import {access, readFile, readdir} from 'node:fs/promises';
import {extname, join, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const buildRoot = join(root, 'build');
const basePath = '/shopverse/';

async function walk(directory) {
  const entries = await readdir(directory, {withFileTypes: true});
  return (await Promise.all(entries.map((entry) => entry.isDirectory()
    ? walk(join(directory, entry.name))
    : join(directory, entry.name)))).flat();
}

function attributes(html, attribute) {
  const pattern = new RegExp(`\\b${attribute}=["']([^"']+)["']`, 'gi');
  return [...html.matchAll(pattern)].map((match) => match[1]);
}

function ids(html) {
  return attributes(html, 'id').map((value) => decodeURIComponent(value));
}

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

function routeCandidates(pathname) {
  const decoded = decodeURIComponent(pathname);
  const relativePath = decoded.slice(basePath.length).replace(/^\/+|\/+$/g, '');
  const path = resolve(buildRoot, relativePath);
  if (!path.startsWith(resolve(buildRoot))) return [];
  if (extname(path)) return [path];
  return [`${path}.html`, join(path, 'index.html')];
}

const allFiles = await walk(buildRoot);
const htmlFiles = allFiles.filter((file) => file.endsWith('.html'));
const htmlCache = new Map();
const failures = [];
let internalLinks = 0;
let assetReferences = 0;
let anchorReferences = 0;

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  htmlCache.set(file, html);
  const page = relative(buildRoot, file).replaceAll(sep, '/');

  if (!/<title\b[^>]*>\s*[^<]+\s*<\/title>/i.test(html)) failures.push(`${page}: missing non-empty <title>`);
  if (!/<meta\s+[^>]*name=["']description["'][^>]*content=["'][^"']+["']/i.test(html)
      && !/<meta\s+[^>]*content=["'][^"']+["'][^>]*name=["']description["']/i.test(html)) {
    failures.push(`${page}: missing non-empty meta description`);
  }
  const pageIds = ids(html);
  const duplicates = [...new Set(pageIds.filter((id, index) => pageIds.indexOf(id) !== index))];
  if (duplicates.length) failures.push(`${page}: duplicate HTML ids: ${duplicates.slice(0, 5).join(', ')}`);

  const route = page === 'index.html' ? '' : page.replace(/(?:\/index)?\.html$/, '');
  const sourceUrl = new URL(route, `https://docs.invalid${basePath}`);
  for (const raw of [...attributes(html, 'href'), ...attributes(html, 'src')]) {
    if (/^(?:mailto:|tel:|data:|javascript:)/i.test(raw)) continue;
    let target;
    try { target = new URL(raw, sourceUrl); } catch { failures.push(`${page}: invalid URL ${raw}`); continue; }
    if (target.hostname !== 'docs.invalid') continue;
    if (!target.pathname.startsWith(basePath)) {
      failures.push(`${page}: internal URL escapes base path: ${raw}`);
      continue;
    }

    const candidates = routeCandidates(target.pathname);
    const targetFile = (await Promise.all(candidates.map(async (candidate) => [candidate, await exists(candidate)])))
      .find(([, present]) => present)?.[0];
    if (!targetFile) {
      failures.push(`${page}: unresolved generated URL ${raw}`);
      continue;
    }

    if (targetFile.endsWith('.html')) internalLinks += 1;
    else assetReferences += 1;
    if (target.hash && targetFile.endsWith('.html')) {
      anchorReferences += 1;
      const anchor = decodeURIComponent(target.hash.slice(1));
      const targetHtml = htmlCache.get(targetFile) ?? await readFile(targetFile, 'utf8');
      htmlCache.set(targetFile, targetHtml);
      if (!ids(targetHtml).includes(anchor)) failures.push(`${page}: missing generated anchor ${raw}`);
    }
  }
}

console.log(`Generated-site validation: ${htmlFiles.length} HTML pages, ${internalLinks} internal links, ${anchorReferences} anchors, ${assetReferences} asset references.`);
if (failures.length) {
  console.error(`Generated-site validation failed (${failures.length}):`);
  failures.slice(0, 100).forEach((failure) => console.error(`- ${failure}`));
  if (failures.length > 100) console.error(`- ...and ${failures.length - 100} more`);
  process.exitCode = 1;
} else {
  console.log('Routes, assets, metadata, anchors, and unique element ids passed.');
}
