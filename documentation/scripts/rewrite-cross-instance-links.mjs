// One-time migration helper: rewrite relative markdown links that cross a
// docs-instance boundary into absolute route paths. Docusaurus only resolves
// `../foo.md`-style relative links within the same plugin-content-docs
// instance; splitting a section out into its own instance breaks any
// relative link that used to reach across into (or out of) it.
//
// spring/java/architecture physically moved from nested docs/<section>/ up to
// top-level docs-<section>/ (one directory level shallower). A pre-existing
// relative link authored against the old depth (e.g. '../../observability/
// OBSERVABILITY.md' from docs/architecture/adr/) now overshoots by one level
// and resolves outside every doc root. Such links are re-resolved here
// against their pre-move virtual location, then mapped to the REAL route via
// each plugin instance's own generated metadata (not a hand-rolled slug
// formula) -- Docusaurus has slug rules (README, a file named after its own
// parent directory, explicit `slug:` frontmatter, etc.) that are only
// knowable for certain from what the plugin itself computed.
//
// Requires a prior `docusaurus build` (or `start`) attempt so .docusaurus/
// docusaurus-plugin-content-docs/*/site-*.json metadata exists -- that cache
// is written during content loading, before the broken-links check runs, so
// it's present even when the build ultimately fails on broken links.
//
// Usage: npm run build (let it fail) && node scripts/rewrite-cross-instance-links.mjs && npm run build
import {readFile, readdir, writeFile} from 'node:fs/promises';
import {dirname, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {DOC_ROOTS, rootDir, walkAllDocs} from './lib/doc-roots.mjs';

const documentationRoot = fileURLToPath(new URL('../', import.meta.url));
const mainRoot = DOC_ROOTS.find((r) => r.prefix === '');
const baseUrl = '/shopverse/';

function toForwardSlash(p) {
  return p.split('\\').join('/');
}

function sectionOf(absPath) {
  for (const root of DOC_ROOTS) {
    const dir = rootDir(root);
    if (absPath === dir || absPath.startsWith(dir + '\\') || absPath.startsWith(dir + '/')) {
      return root;
    }
  }
  return null;
}

// Only rewrite outside fenced code blocks, so example paths in ```text```
// blocks are never touched.
function rewriteOutsideFences(content, rewriter) {
  const parts = content.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/);
  return parts.map((part, i) => (i % 2 === 0 ? rewriter(part) : part)).join('');
}

const linkRe = /\]\(((?:\.\.?\/)[^)\s]*\.mdx?)(#[^)]*)?\)/g;

// source (e.g. 'docs-architecture/adr/004-observability-stack.md') -> route
// (permalink with baseUrl stripped, e.g. '/architecture/adr/observability-stack').
const sourceToRoute = new Map();
const cacheRoot = resolve(documentationRoot, '.docusaurus/docusaurus-plugin-content-docs');
for (const instanceDir of await readdir(cacheRoot, {withFileTypes: true}).catch(() => [])) {
  if (!instanceDir.isDirectory()) continue;
  const dir = resolve(cacheRoot, instanceDir.name);
  for (const entry of await readdir(dir)) {
    if (!entry.startsWith('site-') || !entry.endsWith('.json')) continue;
    const data = JSON.parse(await readFile(resolve(dir, entry), 'utf8'));
    if (!data.source?.startsWith('@site/') || !data.permalink) continue;
    const source = data.source.slice('@site/'.length);
    const route = data.permalink.startsWith(baseUrl) ? '/' + data.permalink.slice(baseUrl.length) : data.permalink;
    sourceToRoute.set(source, route.replace(/\/$/, '') || '/');
  }
}
if (sourceToRoute.size === 0) {
  console.error('No .docusaurus content-docs metadata found. Run `npm run build` (it may fail on broken links) first.');
  process.exit(1);
}

function routeFor(absPath) {
  const source = toForwardSlash(relative(documentationRoot, absPath));
  return sourceToRoute.get(source) ?? null;
}

// A link may use the OLD unified-tree layout for a section that has since
// moved out to its own top-level docs-<section>/ directory (e.g. a literal
// 'docs/architecture/...' path, written back when 'architecture' still lived
// under 'docs/'). Translate that stale segment to the section's real
// physical directory so routeFor() can find it by its actual @site/ source.
function normalizeStaleMovedPath(absPath) {
  const dir = rootDir(mainRoot);
  if (absPath !== dir && !absPath.startsWith(dir + '\\') && !absPath.startsWith(dir + '/')) return null;
  const relFromDocs = toForwardSlash(relative(dir, absPath));
  const moved = DOC_ROOTS.find((r) => r.prefix && relFromDocs.startsWith(r.prefix));
  if (!moved) return null;
  return resolve(rootDir(moved), relFromDocs.slice(moved.prefix.length));
}

/**
 * Resolve a link to its real route, trying the current (post-move) file
 * location first, then a stale-literal-path translation, then -- if the
 * source itself lives in a root that moved -- the pre-move virtual location.
 */
function resolveRoute(srcRoot, srcFile, linkPath) {
  const direct = resolve(dirname(srcFile), linkPath);
  const normalized = normalizeStaleMovedPath(direct);
  const realAbs = routeFor(direct) ? direct : normalized && routeFor(normalized) ? normalized : null;
  if (realAbs) return {section: sectionOf(realAbs)?.prefix || '__main__', route: routeFor(realAbs)};

  if (!srcRoot.prefix) return null; // main root never moved; no virtual fallback needed
  const oldSectionDir = rootDir(mainRoot) + '\\' + srcRoot.prefix.replace(/\/$/, '').split('/').join('\\');
  const oldFileDir = oldSectionDir + '\\' + relative(rootDir(srcRoot), dirname(srcFile));
  const virtual = resolve(oldFileDir, linkPath);
  const virtualRel = toForwardSlash(relative(rootDir(mainRoot), virtual));
  if (virtualRel.startsWith('..')) return null; // escaped the old unified tree too

  // Translate the virtual (pre-move) path back to its real physical file so
  // routeFor() can look it up by its actual @site/ source path.
  const movedMatch = DOC_ROOTS.find((r) => r.prefix && virtualRel.startsWith(r.prefix));
  const virtualRealAbs = movedMatch
    ? resolve(rootDir(movedMatch), virtualRel.slice(movedMatch.prefix.length))
    : resolve(rootDir(mainRoot), virtualRel);
  const virtualRoute = routeFor(virtualRealAbs);
  if (!virtualRoute) return null;
  return {section: movedMatch ? movedMatch.prefix : '__main__', route: virtualRoute};
}

const docs = await walkAllDocs();
let filesChanged = 0;
let linksRewritten = 0;

for (const {file, root} of docs) {
  const original = await readFile(file, 'utf8');
  const srcSection = root.prefix || '__main__';
  let changed = false;

  const updated = rewriteOutsideFences(original, (segment) =>
    segment.replace(linkRe, (full, linkPath, anchor = '') => {
      const resolved = resolveRoute(root, file, linkPath);
      if (!resolved || resolved.section === srcSection) return full;
      changed = true;
      linksRewritten++;
      return `](${resolved.route}${anchor})`;
    }));

  if (changed) {
    await writeFile(file, updated, 'utf8');
    filesChanged++;
  }
}

console.log(`Rewrote ${linksRewritten} cross-instance links across ${filesChanged} files.`);
