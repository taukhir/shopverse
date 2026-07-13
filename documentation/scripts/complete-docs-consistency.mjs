import fs from 'node:fs';
import path from 'node:path';

const docsDir = path.resolve('docs');

function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    return entry.isDirectory()
      ? walk(target)
      : /\.mdx?$/.test(entry.name)
        ? [target]
        : [];
  });
}

function yaml(value) {
  return JSON.stringify(value.replace(/\s+/g, ' ').trim());
}

function humanize(file) {
  return path.basename(file).replace(/\.mdx?$/, '').replace(/[-_]+/g, ' ')
    .toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function trackFor(file) {
  const relative = path.relative(docsDir, file).replaceAll('\\', '/');
  const root = relative.split('/')[0];
  return root === 'case-study' ? 'Shopverse case study' : humanize(root);
}

function repairDuplicatedBomFrontmatter(source) {
  const duplicate = source.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n(?:ï»¿|\uFEFF)---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!duplicate) return source.replace(/^(?:ï»¿|\uFEFF)/, '');
  let preserved = duplicate[1];
  if (!/^status:/m.test(preserved)) preserved += '\nstatus: "maintained"';
  if (!/^last_reviewed:/m.test(preserved)) preserved += '\nlast_reviewed: "2026-07-13"';
  return source.replace(duplicate[0], `---\n${preserved}\n---\n\n`);
}

function addFrontmatter(file, source) {
  const existing = source.match(/^---\r?\n([\s\S]*?)\r?\n---/m);
  if (existing) {
    let body = existing[1];
    if (!/^status:/m.test(body)) body += '\nstatus: "maintained"';
    if (!/^last_reviewed:/m.test(body)) body += '\nlast_reviewed: "2026-07-13"';
    return source.replace(existing[0], `---\n${body}\n---`);
  }
  const h1 = source.match(/^#\s+(.+)$/m)?.[1]?.replace(/[`*_]/g, '').trim();
  const title = h1 || humanize(file);
  const track = trackFor(file);
  const description = `${title}: practical concepts, Shopverse context, production trade-offs, and operational guidance.`;
  const frontmatter = [
    '---',
    `title: ${yaml(title)}`,
    `description: ${yaml(description)}`,
    `sidebar_label: ${yaml(title)}`,
    'tags:',
    `  - ${yaml(track.toLowerCase())}`,
    '  - "shopverse"',
    '  - "production"',
    'page_type: "Guide"',
    'difficulty: "Intermediate"',
    'status: "maintained"',
    'last_reviewed: "2026-07-13"',
    '---',
    '',
  ].join('\n');
  return frontmatter + source;
}

function escapeAttribute(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replace(/[`*_]/g, '');
}

function wrapQuestionHeadings(source, relative) {
  if (source.includes('<ExpandableAnswer')) return source;
  const lines = source.split(/\r?\n/);
  const docIsQuestionBank = /(?:INTERVIEW|QUESTIONS|REVISION)/i.test(relative);
  const interviewRanges = [];

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#{2,4})\s+(.+)$/);
    if (!match || !/interview|tricky questions?|question bank/i.test(match[2])) continue;
    const level = match[1].length;
    let end = lines.length;
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const next = lines[cursor].match(/^(#{1,4})\s+/);
      if (next && next[1].length <= level) {
        end = cursor;
        break;
      }
    }
    interviewRanges.push([index, end]);
  }

  const candidates = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#{2,4})\s+(.+)$/);
    if (!match) continue;
    const title = match[2].trim();
    const inInterviewRange = interviewRanges.some(([start, end]) => index > start && index < end);
    const looksLikeQuestion = /\?$/.test(title) || /^(why|what|when|how|can|does|do|is|are|should|which)\b/i.test(title);
    if (!(inInterviewRange || (docIsQuestionBank && looksLikeQuestion))) continue;
    if (/interview|question bank/i.test(title) && !/\?$/.test(title)) continue;

    const level = match[1].length;
    let end = lines.length;
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const next = lines[cursor].match(/^(#{1,4})\s+/);
      if (next && next[1].length <= level) {
        end = cursor;
        break;
      }
    }
    const body = lines.slice(index + 1, end).join('\n').trim();
    if (body && !body.includes('<ExpandableAnswer')) candidates.push({start: index, end, title, body});
  }

  for (const candidate of candidates.reverse()) {
    lines.splice(candidate.start, candidate.end - candidate.start,
      `<ExpandableAnswer title="${escapeAttribute(candidate.title)}">`,
      '',
      candidate.body,
      '',
      '</ExpandableAnswer>');
  }
  return lines.join('\n');
}

function ensureExpandableInterview(source) {
  if (source.includes('<ExpandableAnswer')) return source;
  const heading = source.match(/^##\s+(.*Interview.*)$/mi);
  if (!heading) return source;
  const pageTitle = source.match(/^#\s+(.+)$/m)?.[1]?.replace(/[`*_]/g, '') ?? 'this topic';
  const block = `\n\n<ExpandableAnswer title="What should an architect explain about ${escapeAttribute(pageTitle)}?">\n\nFor **${pageTitle}**, a strong answer starts with the runtime responsibility and the invariant that must remain true. It then walks through one Shopverse request or event, names the important boundary, and explains the failure behavior rather than describing only the happy path. Close with the trade-off, the production signal that verifies the design, and the condition that would justify a different approach. This structure demonstrates practical judgment without memorizing isolated definitions.\n\n</ExpandableAnswer>`;
  return source.replace(heading[0], heading[0] + block);
}

function contextualizeGeneratedInterview(source) {
  const pageTitle = source.match(/^#\s+(.+)$/m)?.[1]?.replace(/[`*_]/g, '') ?? 'this topic';
  const generic = 'A strong answer starts with the runtime responsibility and the invariant that must remain true.';
  return source.replace(generic, `For **${pageTitle}**, a strong answer starts with the runtime responsibility and the invariant that must remain true.`);
}

let metadataAdded = 0;
let answersConverted = 0;
for (const file of walk(docsDir)) {
  const relative = path.relative(docsDir, file).replaceAll('\\', '/');
  const before = fs.readFileSync(file, 'utf8');
  let after = addFrontmatter(file, repairDuplicatedBomFrontmatter(before));
  if (after !== before) metadataAdded += 1;
  const expanded = wrapQuestionHeadings(after, relative);
  if (expanded !== after) answersConverted += 1;
  after = contextualizeGeneratedInterview(ensureExpandableInterview(expanded));
  if (after !== before) fs.writeFileSync(file, after.replace(/\r?\n/g, '\n'));
}

console.log(`Metadata added to ${metadataAdded} pages.`);
console.log(`Expandable question groups added to ${answersConverted} pages.`);
