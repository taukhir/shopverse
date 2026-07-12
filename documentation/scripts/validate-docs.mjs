import {execFileSync} from 'node:child_process';
import {readdir, readFile, stat} from 'node:fs/promises';
import {extname, join, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const documentationRoot = fileURLToPath(new URL('../', import.meta.url));
const repositoryRoot = resolve(documentationRoot, '..');
const docsRoot = join(documentationRoot, 'docs');
const staticRoot = join(documentationRoot, 'static');
const full = process.argv.includes('--full') || process.env.DOCS_CHECK_MODE === 'full';

async function collect(directory) {
  const entries = await readdir(directory, {withFileTypes: true});
  return (await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? collect(path) : path;
  }))).flat();
}

function git(args) {
  try {
    return execFileSync('git', args, {cwd: repositoryRoot, encoding: 'utf8'}).trim();
  } catch {
    return '';
  }
}

function changedPaths() {
  const explicitBase = process.env.DOCS_BASE_SHA;
  const base = explicitBase || git(['merge-base', 'HEAD', 'origin/master']) || 'HEAD~1';
  const tracked = git(['diff', '--name-only', '--diff-filter=ACMR', `${base}...HEAD`]);
  const working = git(['diff', '--name-only', '--diff-filter=ACMR']);
  const untracked = git(['ls-files', '--others', '--exclude-standard']);
  return new Set(`${tracked}\n${working}\n${untracked}`.split(/\r?\n/).filter(Boolean)
    .map((path) => path.replaceAll('/', sep)));
}

function frontMatter(content) {
  const match = content.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return new Map();
  return new Map(match[1].split(/\r?\n/).map((line) => {
    const separator = line.indexOf(':');
    return separator < 0 ? [line.trim(), ''] : [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
  }));
}

function lineNumber(content, offset) {
  return content.slice(0, offset).split(/\r?\n/).length;
}

const allFiles = await collect(docsRoot);
const docs = allFiles.filter((file) => ['.md', '.mdx'].includes(extname(file)));
const allRelative = new Set(docs.map((file) => relative(docsRoot, file).replaceAll('\\', '/')));
const changes = changedPaths();
const selected = full ? docs : docs.filter((file) => changes.has(relative(repositoryRoot, file)));
const globalChange = [...changes].some((path) => /^(documentation[\\/](sidebars\.ts|docusaurus\.config\.ts|package(-lock)?\.json|src[\\/]|scripts[\\/])|\.github[\\/]workflows[\\/]docs)/.test(path));
const filesToCheck = full || globalChange || selected.length === 0 ? (full || globalChange ? docs : []) : selected;

const failures = [];
const warnings = [];
const titles = new Map();

for (const file of docs) {
  const content = await readFile(file, 'utf8');
  const metadata = frontMatter(content);
  const title = metadata.get('title') || content.match(/^#\s+(.+)$/m)?.[1];
  if (title) titles.set(title.toLowerCase(), [...(titles.get(title.toLowerCase()) || []), relative(docsRoot, file)]);
}

for (const [title, files] of titles) {
  if (files.length > 1) warnings.push(`duplicate title "${title}": ${files.join(', ')}`);
}

const markdownLink = /!?(\[[^\]]*\])\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
const forbiddenSecret = /(-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:password|passwd|client_secret|api[_-]?key)\s*[:=]\s*["']?(?!<|\$\{|\*|example|test|change|your-|xxx|redacted)[A-Za-z0-9_+\/.=-]{16,})/i;

for (const file of filesToCheck) {
  const content = await readFile(file, 'utf8');
  const path = relative(docsRoot, file).replaceAll('\\', '/');
  const metadata = frontMatter(content);
  const words = (content.match(/\b[\w-]+\b/g) ?? []).length;
  const h2 = (content.match(/^## /gm) ?? []).length;

  if (!metadata.get('title') && !/^#\s+\S.+$/m.test(content)) failures.push(`${path}: missing page title`);
  if (/\]\(http:\/\//i.test(content)) failures.push(`${path}: insecure HTTP link`);
  if (words >= 2000) for (const field of ['difficulty', 'page_type', 'status', 'last_reviewed']) {
    if (!metadata.get(field)) failures.push(`${path}: ${words} words but missing ${field} metadata`);
  }
  if (words > 3500) failures.push(`${path}: ${words} words exceeds 3,500-word split threshold`);
  if (h2 > 28 && words > 2500) failures.push(`${path}: ${h2} top-level sections exceeds navigation threshold`);
  if (forbiddenSecret.test(content)) warnings.push(`${path}: possible embedded secret; review examples and use placeholders`);

  for (const match of content.matchAll(markdownLink)) {
    const raw = match[0];
    const target = match[2];
    if (/^(https?:|mailto:|#|data:)/i.test(target)) continue;
    const clean = decodeURIComponent(target.split('#')[0].split('?')[0]);
    if (!clean) continue;
    const image = raw.startsWith('!');
    if (image && clean.startsWith('/')) {
      const asset = join(staticRoot, clean.slice(1));
      try { await stat(asset); } catch { failures.push(`${path}:${lineNumber(content, match.index)}: missing image ${target}`); }
      continue;
    }
    if (image) {
      const asset = resolve(file, '..', clean);
      try { await stat(asset); } catch { failures.push(`${path}:${lineNumber(content, match.index)}: missing image ${target}`); }
      continue;
    }
    if (clean.startsWith('/')) continue;
    const resolved = relative(docsRoot, resolve(file, '..', clean)).replaceAll('\\', '/');
    const candidates = extname(resolved) ? [resolved] : [`${resolved}.md`, `${resolved}.mdx`, `${resolved}/index.md`, `${resolved}/index.mdx`];
    if (!candidates.some((candidate) => allRelative.has(candidate))) {
      failures.push(`${path}:${lineNumber(content, match.index)}: broken internal link ${target}`);
    }
  }
}

const mode = full ? 'full' : globalChange ? 'changed (global docs change => all pages)' : 'changed';
console.log(`Documentation validation (${mode}): ${filesToCheck.length}/${docs.length} pages scanned.`);
if (!filesToCheck.length) console.log('No changed documentation pages require scanning.');
if (warnings.length) {
  console.warn(`Warnings (${warnings.length}):`);
  warnings.slice(0, 30).forEach((warning) => console.warn(`- ${warning}`));
}
if (failures.length) {
  console.error(`Failures (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log('Titles, metadata, length, links, images, HTTPS, and secret heuristics passed.');
}
