import {readdir, readFile} from 'node:fs/promises';
import {extname, join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const docsRoot = join(root, 'docs');

async function walk(dir) {
  const entries = await readdir(dir, {withFileTypes: true});
  return (await Promise.all(entries.map((entry) => entry.isDirectory()
    ? walk(join(dir, entry.name)) : join(dir, entry.name)))).flat();
}

function body(content) { return content.replace(/^---[\s\S]*?---\s*/m, ''); }
function prose(content) {
  return body(content)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/^\s{4,}.*$/gm, ' ');
}
function words(content) { return body(content).replace(/```[\s\S]*?```/g, ' ').replace(/<[^>]+>/g, ' ').match(/[a-z0-9]+/gi)?.length ?? 0; }
function paragraphFingerprint(value) {
  return value.toLowerCase().replace(/\[[^\]]+\]\([^)]+\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
}

const files = (await walk(docsRoot)).filter((file) => ['.md', '.mdx'].includes(extname(file)));
const pages = await Promise.all(files.map(async (file) => {
  const content = await readFile(file, 'utf8');
  const path = relative(docsRoot, file).replaceAll('\\', '/');
  const pageType = content.match(/^page_type:\s*(.+)$/m)?.[1]?.trim() ?? '';
  const paragraphs = prose(content).split(/\r?\n\s*\r?\n/).map(paragraphFingerprint).filter((p) => p.length >= 180);
  return {
    path, content, pageType, paragraphs, words: words(content),
    images: [...content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]),
    hasVisual: /!\[[^\]]*\]\([^)]+\)/.test(content)
      || /```mermaid\b/.test(content)
      || /^\|.+\|\r?\n\|(?:\s*:?-+:?\s*\|)+/m.test(content)
      || /<(?:LearningRoadmap|Mermaid|Diagram|Architecture)[\s/>]/.test(content),
    official: /## Official References/i.test(content),
    next: /## Recommended Next/i.test(content),
  };
}));

const paragraphOwners = new Map();
for (const page of pages) for (const paragraph of page.paragraphs) {
  paragraphOwners.set(paragraph, [...(paragraphOwners.get(paragraph) ?? []), page.path]);
}
const duplicateGroups = [...paragraphOwners.entries()].filter(([, owners]) => new Set(owners).size > 1);
const deepPages = pages.filter((page) => /Advanced/i.test(page.content.match(/^difficulty:\s*(.+)$/m)?.[1] ?? ''));
const textHeavy = pages.filter((page) => page.words >= 1200 && !page.hasVisual);
const missingOfficial = deepPages.filter((page) => !page.official);
const missingNext = pages.filter((page) => ['Learning Path', 'Tutorial', 'Decision Guide'].includes(page.pageType) && !page.next);

const sidebar = await readFile(join(root, 'sidebars.ts'), 'utf8');
const orphanPages = pages.filter((page) => {
  const id = page.path.replace(/\.(md|mdx)$/, '');
  const intentionallyUnlisted = /^sidebar_exclude:\s*true\s*$/m.test(page.content);
  return !intentionallyUnlisted && !sidebar.includes(`'${id}'`) && !sidebar.includes(`id: '${id}'`) && !page.path.includes('/adr/');
});

console.log(`Documentation structure audit: ${pages.length} pages`);
console.log(`Exact repeated long paragraphs: ${duplicateGroups.length}`);
console.log(`Advanced pages without an Official References section: ${missingOfficial.length}`);
console.log(`Text-heavy pages without Markdown images: ${textHeavy.length}`);
console.log(`Tutorial/decision/learning pages without Recommended Next: ${missingNext.length}`);
console.log(`Pages not explicitly present in sidebars (review; generated categories may be intentional): ${orphanPages.length}`);

function sample(label, items, mapper = (item) => item.path) {
  if (!items.length) return;
  const limit = Number(process.env.DOCS_AUDIT_LIMIT || 20);
  console.log(`\n${label} (first ${Math.min(limit, items.length)}):`);
  for (const item of items.slice(0, limit)) console.log(`- ${mapper(item)}`);
}
sample('Repeated paragraphs', duplicateGroups, ([text, owners]) => `${[...new Set(owners)].join(', ')} :: ${text.slice(0, 90)}...`);
sample('Missing official references', missingOfficial);
sample('Text-heavy without images', textHeavy);
sample('Missing recommended next', missingNext);
sample('Potential sidebar orphans', orphanPages);

if (process.argv.includes('--strict')
    && (duplicateGroups.length || missingOfficial.length || textHeavy.length
      || missingNext.length || orphanPages.length)) process.exitCode = 1;
