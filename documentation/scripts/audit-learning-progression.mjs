import {mkdir, readdir, readFile, writeFile} from 'node:fs/promises';
import {extname, join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const documentationRoot = fileURLToPath(new URL('../', import.meta.url));
const docsRoot = join(documentationRoot, 'docs');
const reportsRoot = join(documentationRoot, 'reports');

async function walk(directory) {
  return (await Promise.all((await readdir(directory, {withFileTypes: true})).map((entry) => {
    const resolved = join(directory, entry.name);
    return entry.isDirectory() ? walk(resolved) : resolved;
  }))).flat();
}

function frontmatter(content, key) {
  return content.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? '';
}

function withoutFrontmatter(content) {
  return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

function plainText(content) {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]+]\([^)]+\)/g, ' ')
    .replace(/[#>*_|`~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordCount(content) {
  return plainText(content).match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)?.length ?? 0;
}

function has(content, expression) {
  return expression.test(content);
}

function headingTexts(content) {
  return [...content.matchAll(/^##\s+(.+)$/gm)].map((match) =>
    match[1].replace(/<[^>]+>|[`*_]/g, '').trim());
}

function markdownLinks(content) {
  return [...content.matchAll(/(?<!!)\[[^\]]+]\(([^)]+)\)/g)].map((match) => match[1]);
}

function titleWordCount(title) {
  return title.replace(/^['"]|['"]$/g, '').match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
}

function introduction(content) {
  const body = withoutFrontmatter(content);
  const afterTitle = body.replace(/^#\s+.+\r?\n/, '');
  return afterTitle.split(/^##\s+/m)[0] ?? '';
}

function domain(path) {
  return path.includes('/') ? path.split('/')[0] : 'root';
}

const conceptualTypes = new Set(['Guide', 'Deep Dive', 'Concept', 'Decision Guide', 'Tutorial']);
const educationalTypes = new Set([
  ...conceptualTypes,
  'Learning Path',
  'Lab',
  'Workbook',
  'Practice',
  'Interview',
]);
const files = (await walk(docsRoot)).filter((file) => ['.md', '.mdx'].includes(extname(file)));
const pages = [];

for (const file of files) {
  const content = await readFile(file, 'utf8');
  const path = relative(docsRoot, file).replaceAll('\\', '/');
  const pageType = frontmatter(content, 'page_type') || 'Unclassified';
  const difficulty = frontmatter(content, 'difficulty') || 'Unclassified';
  const title = frontmatter(content, 'title');
  const headings = headingTexts(content);
  const firstHeadings = headings.slice(0, 3).join(' | ');
  const intro = introduction(content);
  const introText = plainText(intro);
  const introWords = wordCount(intro);
  const conceptual = conceptualTypes.has(pageType);
  const educational = educationalTypes.has(pageType);
  const excluded = /^sidebar_exclude:\s*true\s*$/m.test(content);
  const internalLinks = markdownLinks(content).filter((link) =>
    !/^(?:https?:|mailto:|#)/i.test(link));
  const fencedExamples = [...content.matchAll(/```(?:java|kotlin|sql|yaml|yml|json|bash|shell|powershell|typescript|javascript|text|properties|xml)?\s*\r?\n/gi)].length;
  const exampleSections = headings.filter((heading) =>
    /\b(?:example|walkthrough|scenario|exercise|lab|implementation)\b/i.test(heading)).length;

  const signals = {
    conciseTitle: Boolean(title) && titleWordCount(title) <= 8,
    description: Boolean(frontmatter(content, 'description')),
    pageOverview: has(content, /^##\s+(?:Page )?Overview\b/im)
      || has(content, /^##\s+(?:At A Glance|In This (?:Guide|Page)|Topic Map|How To Use)\b/im),
    prerequisites: /^prerequisites:\s*\[[^\]]+]/m.test(content)
      || has(content, /^##\s+(?:Prerequisites|Before You Start|What You Need)/im),
    terminology: has(content, /^##\s+.*(?:Terminology|Key Terms|Vocabulary|Definitions)/im)
      || has(content, /\*\*[^*]+\*\*\s+(?:is|means|refers to)\b/i),
    learningObjectives: /^learning_objectives:\s*(?:\[[^\]]+]|\r?\n\s+-\s+)/m.test(content),
    substantialIntroduction: introWords >= 35,
    openingDefinition: has(introText,
      /\b(?:is|are|means|refers to|defines|describes|represents|provides)\b/i)
      || has(firstHeadings, /\b(?:what (?:is|are|does|should)|what questions?|definition|fundamentals?|overview|start here|mental model|purpose)\b/i),
    beginnerFirst: has(firstHeadings,
      /\b(?:what (?:is|are|does|should)|what questions?|definition|fundamentals?|overview|start here|mental model|why|core concepts?|terminology|purpose)\b/i)
      && !has(headings[0] ?? '', /\b(?:advanced|internals?|production|operations|interview|deep dive|diagnos)/i),
    mentalModel: has(content,
      /^##\s+.*(?:Mental Model|How To Think|Conceptual Model|Architecture Overview|Big Picture|At A Glance)/im)
      || has(content, /```mermaid|!\[[^\]]*]\([^)]+\)|<(?:LearningRoadmap|LearningDepth)\b/m),
    internalsOrLifecycle: has(content,
      /^##\s+.*(?:How It Works|Internals?|Lifecycle|Execution|Mechanics|Request Flow|Data Flow|Algorithm|Under The Hood|Memory Budget|Triage)/im),
    concreteExample: has(content,
      /^##\s+.*(?:Example|Walkthrough|Scenario|Hands-On|Lab|Implementation)/im)
      || has(content, /```(?:java|kotlin|sql|yaml|json|bash|powershell|typescript|javascript|text)/i),
    exampleCoverage: exampleSections >= 2 || fencedExamples >= 2
      || (exampleSections >= 1 && fencedExamples >= 1),
    tradeoffs: has(content, /\btrade-?offs?\b|^##\s+.*(?:When To Use|When Not To Use|Decision|Alternatives?|Comparison)/im),
    failureModes: has(content,
      /^##\s+.*(?:Failure|Pitfall|Mistake|Anti-Pattern|Troubleshoot|Error|Edge Case|Limit)/im)
      || has(content, /\bfailure mode\b|\bcommon mistake\b|\bpitfall\b/i),
    edgeCases: has(content,
      /^##\s+.*(?:Edge Case|Boundary Case|Corner Case|Failure|Limit)/im)
      || has(content, /\bedge cases?\b|\bboundary (?:value|condition|case)\b/i),
    productionOrDiagnostics: has(content,
      /^##\s+.*(?:Production|Operations|Diagnostics?|Observability|Monitoring|Security|Performance|Capacity|Recovery)/im)
      || has(content, /\bmetric\b|\btrace\b|\blogging\b|\balert\b/i),
    summary: has(content, /^##\s+.*(?:Summary|Key Takeaways|Recap|Checklist|One-Minute Recall)/im),
    nextStep: has(content, /^##\s+Recommended Next(?:\s+Page|\s+Pages)?/im)
      || has(content, /\bContinue with\s+\[/i),
    trickyInterviewQuestions: has(content,
      /^##\s+.*(?:Tricky|Scenario-Based|Reasoning|Deep-Dive)?\s*Interview (?:Questions|Practice)/im)
      || has(content, /\bwhat would (?:you|happen)\b[\s\S]{0,160}\b(?:why|trade-?off|diagnos|failure)\b/i),
    crossLinks: internalLinks.length >= 2,
    leadEngineerDepth: has(content,
      /^##\s+.*(?:Architecture Decision|Selection Criteria|Governance|Capacity|Scale|Compatibility|Recovery|Production Evidence)/im)
      || (has(content, /\b(?:SLO|capacity|compatibility|recovery|migration|governance)\b/i)
        && has(content, /\b(?:trade-?off|decision|alternative|evidence)\b/i)),
    officialReferences: has(content, /^##\s+Official References/im),
  };

  const required = [
    'conciseTitle',
    'pageOverview',
    'substantialIntroduction',
    'openingDefinition',
    'beginnerFirst',
    'learningObjectives',
    'crossLinks',
    'nextStep',
  ];
  if (educational) required.push('terminology', 'mentalModel');
  if (pageType === 'Learning Path') required.push('prerequisites');
  if (conceptual) required.push(
    'concreteExample',
    'exampleCoverage',
    'failureModes',
    'edgeCases',
    'trickyInterviewQuestions',
    'internalsOrLifecycle',
    'tradeoffs',
    'productionOrDiagnostics',
    'leadEngineerDepth',
  );
  if (['Lab', 'Workbook', 'Practice', 'Interview'].includes(pageType)) {
    required.push('concreteExample', 'exampleCoverage', 'failureModes', 'edgeCases', 'trickyInterviewQuestions');
  }
  if (['Advanced', 'Architect'].includes(difficulty) || conceptual) required.push('officialReferences');
  if (!['Beginner', 'All Levels'].includes(difficulty)) required.push('prerequisites');

  const uniqueRequired = [...new Set(required)];
  const missing = uniqueRequired.filter((signal) => !signals[signal]);
  const passed = uniqueRequired.length - missing.length;
  const score = Math.round((passed / uniqueRequired.length) * 100);

  pages.push({
    path,
    domain: domain(path),
    pageType,
    title,
    titleWords: titleWordCount(title),
    difficulty,
    words: wordCount(withoutFrontmatter(content)),
    introWords,
    headings: headings.length,
    excluded,
    conceptual,
    educational,
    score,
    missing,
    signals,
  });
}

const domainRows = [...new Set(pages.map((page) => page.domain))].sort().map((name) => {
  const domainPages = pages.filter((page) => page.domain === name);
  return {
    domain: name,
    pages: domainPages.length,
    averageScore: Math.round(domainPages.reduce((sum, page) => sum + page.score, 0) / domainPages.length),
    beginnerReady: domainPages.filter((page) => page.missing.length === 0).length,
    missingDefinition: domainPages.filter((page) => page.missing.includes('openingDefinition')).length,
    missingBeginnerFirst: domainPages.filter((page) => page.missing.includes('beginnerFirst')).length,
    longTitles: domainPages.filter((page) => page.missing.includes('conciseTitle')).length,
    missingDepth: domainPages.filter((page) => page.conceptual
      && ['internalsOrLifecycle', 'tradeoffs', 'productionOrDiagnostics'].some((signal) => page.missing.includes(signal))).length,
  };
});

const missingCounts = Object.keys(pages[0]?.signals ?? {}).map((signal) => ({
  signal,
  pages: pages.filter((page) => page.missing.includes(signal)).length,
})).sort((left, right) => right.pages - left.pages);

const report = {
  generatedAt: new Date().toISOString(),
  contractVersion: 2,
  summary: {
    pages: pages.length,
    fullyCompliant: pages.filter((page) => page.missing.length === 0).length,
    missingBeginnerOpening: pages.filter((page) =>
      page.missing.includes('openingDefinition') || page.missing.includes('beginnerFirst')).length,
    missingDepth: pages.filter((page) => page.conceptual
      && ['internalsOrLifecycle', 'tradeoffs', 'productionOrDiagnostics'].some((signal) => page.missing.includes(signal))).length,
    longTitles: pages.filter((page) => page.missing.includes('conciseTitle')).length,
    missingExampleCoverage: pages.filter((page) => page.missing.includes('exampleCoverage')).length,
    missingInterviewQuestions: pages.filter((page) => page.missing.includes('trickyInterviewQuestions')).length,
    averageScore: Math.round(pages.reduce((sum, page) => sum + page.score, 0) / pages.length),
  },
  missingCounts,
  domains: domainRows,
  pages: pages.sort((left, right) => left.score - right.score || left.path.localeCompare(right.path)),
};

const markdown = [
  '# Learning Progression Audit',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  '## Repository Summary',
  '',
  '| Signal | Result |',
  '|---|---:|',
  `| Pages checked | ${report.summary.pages} |`,
  `| Fully compliant pages | ${report.summary.fullyCompliant} |`,
  `| Pages missing a beginner opening | ${report.summary.missingBeginnerOpening} |`,
  `| Conceptual pages missing deep-dive evidence | ${report.summary.missingDepth} |`,
  `| Pages with missing or lengthy titles | ${report.summary.longTitles} |`,
  `| Pages missing example progression | ${report.summary.missingExampleCoverage} |`,
  `| Educational pages missing tricky interview questions | ${report.summary.missingInterviewQuestions} |`,
  `| Average progression score | ${report.summary.averageScore}% |`,
  '',
  '## Domain Rollup',
  '',
  '| Domain | Pages | Average | Fully compliant | Missing definition | Wrong opening order | Long title | Missing depth |',
  '|---|---:|---:|---:|---:|---:|---:|---:|',
  ...domainRows.map((row) =>
    `| ${row.domain} | ${row.pages} | ${row.averageScore}% | ${row.beginnerReady} | ${row.missingDefinition} | ${row.missingBeginnerFirst} | ${row.longTitles} | ${row.missingDepth} |`),
  '',
  '## Most Common Gaps',
  '',
  '| Requirement | Pages missing it |',
  '|---|---:|',
  ...missingCounts.map((row) => `| ${row.signal} | ${row.pages} |`),
  '',
  '## Naming Review Queue',
  '',
  'These pages need a shorter visible `title` or a topic-segregation review. Stable filenames can remain until redirects are planned.',
  '',
  '| Page | Current title | Words |',
  '|---|---|---:|',
  ...report.pages.filter((page) => page.missing.includes('conciseTitle')).map((page) =>
    `| \`${page.path}\` | ${page.title || '(missing)'} | ${page.titleWords} |`),
  '',
  '## Lowest-Scoring Pages',
  '',
  '| Page | Type | Difficulty | Score | Missing |',
  '|---|---|---|---:|---|',
  ...report.pages.slice(0, 150).map((page) =>
    `| \`${page.path}\` | ${page.pageType} | ${page.difficulty} | ${page.score}% | ${page.missing.join(', ')} |`),
  '',
  'The JSON report contains the complete result for every page. A missing signal is a review trigger, not permission to insert generic filler.',
  '',
].join('\n');

await mkdir(reportsRoot, {recursive: true});
await writeFile(join(reportsRoot, 'learning-progression-audit.json'), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(join(reportsRoot, 'learning-progression-audit.md'), markdown);

console.log(`Learning progression audit: ${report.summary.pages} pages; ${report.summary.fullyCompliant} fully compliant; ${report.summary.missingBeginnerOpening} missing beginner opening; ${report.summary.missingDepth} conceptual pages missing depth; average ${report.summary.averageScore}%`);
for (const row of domainRows) {
  console.log(`- ${row.domain}: ${row.pages} pages, ${row.averageScore}% average, ${row.beginnerReady} fully compliant`);
}

if (process.argv.includes('--strict') && report.summary.fullyCompliant !== report.summary.pages) {
  process.exitCode = 1;
}
