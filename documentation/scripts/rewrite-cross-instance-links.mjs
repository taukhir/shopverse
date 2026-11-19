// One-time migration helper: rewrite relative markdown links that cross a
// docs-instance boundary into absolute route paths. Docusaurus only resolves
// `../foo.md`-style relative links within the same plugin-content-docs
// instance; splitting a section out into its own instance breaks any
// relative link that used to reach across into (or out of) it. Links that
// stay within the same instance are left untouched.
//
// Usage: node scripts/rewrite-cross-instance-links.mjs <section> [<section> ...]
// Run once per split section (or all pilot sections together), then build
// and let onBrokenLinks:'throw' catch anything this script missed.
import {readFile, writeFile, readdir} from 'node:fs/promises';
import {join, relative, dirname, resolve, extname} from 'node:path';

const sections = new Set(process.argv.slice(2));
if (sections.size === 0) {
  console.error('Usage: node scripts/rewrite-cross-instance-links.mjs <section> [<section> ...]');
  process.exitCode = 1;
  process.exit();
}

const docsRoot = resolve(new URL('../docs/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));

async function walk(dir) {
  const entries = await readdir(dir, {withFileTypes: true});
  const out = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else if (/\.(md|mdx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function topSection(absPath) {
  const rel = relative(docsRoot, absPath).split('\\').join('/');
  return rel.split('/')[0];
}

function toRoute(absPath) {
  const rel = relative(docsRoot, absPath).split('\\').join('/');
  return '/' + rel.replace(/\.(md|mdx)$/, '');
}

// Only rewrite outside fenced code blocks, so example paths in ```text```
// blocks are never touched.
function rewriteOutsideFences(content, rewriter) {
  const parts = content.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/);
  return parts.map((part, i) => (i % 2 === 0 ? rewriter(part) : part)).join('');
}

const linkRe = /\]\(((?:\.\.?\/)[^)\s]*\.mdx?)(#[^)]*)?\)/g;

let filesChanged = 0;
let linksRewritten = 0;

const files = await walk(docsRoot);
for (const file of files) {
  const original = await readFile(file, 'utf8');
  const srcSection = topSection(file);
  let changed = false;

  const updated = rewriteOutsideFences(original, (segment) =>
    segment.replace(linkRe, (full, linkPath, anchor = '') => {
      const targetAbs = resolve(dirname(file), linkPath);
      const tgtSection = topSection(targetAbs);
      const crosses = (sections.has(srcSection) || sections.has(tgtSection)) && srcSection !== tgtSection;
      if (!crosses) return full;
      changed = true;
      linksRewritten++;
      return `](${toRoute(targetAbs)}${anchor})`;
    }));

  if (changed) {
    await writeFile(file, updated, 'utf8');
    filesChanged++;
  }
}

console.log(`Rewrote ${linksRewritten} cross-instance links across ${filesChanged} files for section(s): ${[...sections].join(', ')}`);
