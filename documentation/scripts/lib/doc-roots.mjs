// Shared doc-root registry. spring/java/architecture were split out of the
// main docs/ tree into their own top-level directories (so each can be its
// own Docusaurus plugin-content-docs instance -- see docusaurus.config.ts),
// but every script in this directory historically assumed a single docs/
// root and computed a page's logical id as its path relative to that root.
// This keeps that same logical id scheme (e.g. 'spring/SPRING-AOP') while
// the files physically live under docs-spring/SPRING-AOP.md, so content
// scripts, sidebars.ts, and authored links don't need to know about the
// physical split.
import {readdir} from 'node:fs/promises';
import {existsSync as defaultExistsSync} from 'node:fs';
import {join, relative, extname} from 'node:path';
import {fileURLToPath} from 'node:url';

const documentationRoot = fileURLToPath(new URL('../../', import.meta.url));

// {prefix: logical id prefix ('' for the root instance), dir: physical directory name}
export const DOC_ROOTS = [
  {prefix: '', dir: 'docs'},
  {prefix: 'spring/', dir: 'docs-spring'},
  {prefix: 'java/', dir: 'docs-java'},
  {prefix: 'architecture/', dir: 'docs-architecture'},
  {prefix: 'data/', dir: 'docs-data'},
  {prefix: 'ai/', dir: 'docs-ai'},
  {prefix: 'security/', dir: 'docs-security'},
];

async function walk(dir) {
  const entries = await readdir(dir, {withFileTypes: true});
  const out = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else out.push(full);
  }
  return out;
}

/** Absolute path of a doc root's physical directory. */
export function rootDir(root) {
  return join(documentationRoot, root.dir);
}

/** All files (any extension) across every doc root, each paired with its logical id (no extension). */
export async function walkAllDocFiles() {
  const out = [];
  for (const root of DOC_ROOTS) {
    const dir = rootDir(root);
    const files = await walk(dir);
    for (const file of files) {
      const relPath = relative(dir, file).split('\\').join('/');
      out.push({file, root, id: root.prefix + relPath.replace(/\.(md|mdx)$/, '')});
    }
  }
  return out;
}

/** Same as walkAllDocFiles, but only *.md/*.mdx files. */
export async function walkAllDocs() {
  return (await walkAllDocFiles()).filter(({file}) => ['.md', '.mdx'].includes(extname(file)));
}

/**
 * Resolve a logical doc id (e.g. 'spring/SPRING-AOP' or 'reference/GLOSSARY')
 * to its physical file path, trying .md then .mdx. Returns null if neither exists.
 */
export function resolveDocPath(id, existsSync = defaultExistsSync) {
  for (const root of DOC_ROOTS) {
    if (root.prefix && !id.startsWith(root.prefix)) continue;
    if (!root.prefix && DOC_ROOTS.some((r) => r.prefix && id.startsWith(r.prefix))) continue;
    const rel = id.slice(root.prefix.length);
    for (const ext of ['.md', '.mdx']) {
      const candidate = join(rootDir(root), `${rel}${ext}`);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}
