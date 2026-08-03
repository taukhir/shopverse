import {readdir, readFile, writeFile} from 'node:fs/promises';
import {extname, join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const docsRoot = fileURLToPath(new URL('../docs/', import.meta.url));
async function walk(directory) {
  return (await Promise.all((await readdir(directory, {withFileTypes: true})).map((entry) =>
    entry.isDirectory() ? walk(join(directory, entry.name)) : join(directory, entry.name)))).flat();
}

const pageTypes = new Map(Object.entries({
  'Learning Path': 'Learning Path', 'Learning Plan': 'Learning Path',
  Guide: 'Guide', 'Practical Guide': 'Guide', 'Production Guide': 'Guide',
  'Architecture Guide': 'Guide', 'Security Guide': 'Guide', 'Reliability Guide': 'Guide',
  'Operations Guide': 'Guide', 'Deployment Guide': 'Guide', 'Migration Guide': 'Guide',
  'Programming Guide': 'Guide', 'Quality Guide': 'Guide', 'Implementation Guide': 'Guide',
  Testing: 'Guide', Operations: 'Guide',
  'Deep Dive': 'Deep Dive', 'Architecture Deep Dive': 'Deep Dive', 'Internals Deep Dive': 'Deep Dive',
  Concept: 'Concept', Explanation: 'Concept', Architecture: 'Concept',
  Reference: 'Reference', 'Practical Reference': 'Reference', 'Revision Sheet': 'Reference',
  'Compatibility Page': 'Reference', Overview: 'Reference', 'Category Overview': 'Reference',
  'Documentation Index': 'Reference', Comparison: 'Reference',
  'Decision Guide': 'Decision Guide', 'Concept And Decision Guide': 'Decision Guide',
  Tutorial: 'Tutorial', Interview: 'Interview', 'Interview Guide': 'Interview',
  'Interview Preparation': 'Interview', 'Revision Guide': 'Interview',
  Workbook: 'Workbook', 'Interview Workbook': 'Workbook', Practice: 'Practice',
  'Interactive Practice': 'Practice', Lab: 'Lab', Runbook: 'Runbook', 'Case Study': 'Case Study',
}));
const difficulties = new Map(Object.entries({
  Foundation: 'Beginner', 'Foundation to Advanced': 'All Levels',
  'Easy to Medium': 'All Levels', Medium: 'Intermediate',
  'Intermediate to Advanced': 'Advanced',
}));

function unquote(value = '') { return value.trim().replace(/^['"]|['"]$/g, ''); }
function setField(lines, key, value) {
  const index = lines.findIndex((line) => line.startsWith(`${key}:`));
  const rendered = `${key}: ${value}`;
  if (index >= 0) lines[index] = rendered;
  else lines.push(rendered);
}

const files = (await walk(docsRoot)).filter((file) => ['.md', '.mdx'].includes(extname(file)));
let changed = 0;
for (const file of files) {
  const source = await readFile(file, 'utf8');
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) continue;
  const lines = match[1].split(/\r?\n/);
  const get = (key) => unquote(lines.find((line) => line.startsWith(`${key}:`))?.slice(key.length + 1));
  const path = relative(docsRoot, file).replaceAll('\\', '/');
  const top = path.includes('/') ? path.split('/')[0] : 'documentation';
  const previousStatus = get('status');
  const previousType = get('page_type') || 'Guide';
  const previousDifficulty = get('difficulty');

  const status = previousStatus.startsWith('Proposed') ? 'proposed' : 'maintained';
  const scope = previousStatus === 'Compatibility route' ? 'compatibility'
    : previousStatus === 'Generic with Shopverse mapping' ? 'hybrid'
    : /Shopverse|Implemented|Partially implemented/.test(previousStatus) || ['case-study', 'services'].includes(top) ? 'shopverse'
    : 'generic';
  if (previousStatus === 'Partially implemented') setField(lines, 'implementation_status', 'partial');
  else if (previousStatus === 'Implemented') setField(lines, 'implementation_status', 'implemented');

  setField(lines, 'page_type', pageTypes.get(previousType) ?? 'Guide');
  setField(lines, 'difficulty', (difficulties.get(previousDifficulty) ?? previousDifficulty) || 'Intermediate');
  setField(lines, 'status', status);
  setField(lines, 'scope', get('scope') || scope);
  setField(lines, 'owner', get('owner') || `docs-${top}`);
  setField(lines, 'reviewer', get('reviewer') || 'documentation-maintainers');
  setField(lines, 'review_evidence', get('review_evidence') || 'repository-content-audit');

  const updated = source.replace(match[0], `---\n${lines.join('\n')}\n---`);
  if (updated !== source) {
    await writeFile(file, updated, 'utf8');
    changed += 1;
  }
}
console.log(`Normalized documentation metadata for ${changed}/${files.length} pages.`);
