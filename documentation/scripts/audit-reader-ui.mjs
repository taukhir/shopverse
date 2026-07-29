import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const failures = [];
const read = (path) => readFile(join(root, path), 'utf8');

const rootTheme = await read('src/theme/Root/index.tsx');
const docContent = await read('src/theme/DocItem/Content/index.tsx');
const reader = await read('src/components/ReaderLibrary/index.tsx');
const tools = await read('src/components/LearningTools/index.tsx');
const mdx = await read('src/theme/MDXComponents/index.tsx');
const landing = await read('src/components/DocumentationLanding/index.tsx');

const required = [
  [rootTheme, 'progressTrack', 'global reading progress'],
  [rootTheme, 'Keyboard shortcuts', 'keyboard shortcut help'],
  [rootTheme, 'mobileContents', 'mobile table-of-contents action'],
  [docContent, 'min read', 'reading time'],
  [docContent, 'Mark complete', 'completion tracking'],
  [reader, 'Focus session', 'focus timer'],
  [reader, 'Interview mode', 'interview mode'],
  [reader, 'Notes for this page', 'per-page notes'],
  [landing, 'Difficulty', 'difficulty filter'],
  [landing, 'Format', 'format filter'],
];
for (const [content, token, label] of required) if (!content.includes(token)) failures.push(`Missing ${label}`);

for (const component of ['CodeWalkthrough', 'CopyableCommandGroup', 'InteractiveTopicTree', 'InterviewPractice', 'PatternComparison', 'StepByStepDryRun']) {
  if (!tools.includes(`function ${component}`)) failures.push(`LearningTools missing ${component}`);
  if (!mdx.includes(component)) failures.push(`MDX registry missing ${component}`);
}

const integrations = [
  ['docs/java/JAVA-COLLECTIONS.md', 'InteractiveTopicTree'],
  ['docs/operations/kubernetes/KUBERNETES-OVERVIEW.md', 'InteractiveTopicTree'],
  ['docs/development/DESIGN-PATTERNS.md', 'InterviewPractice'],
  ['docs/development/design-patterns/immutable-class.md', 'CodeWalkthrough'],
  ['docs/operations/performance-chaos/PRODUCTION-SLOWNESS-DIAGNOSIS-RUNBOOK.md', 'StepByStepDryRun'],
];
for (const [path, component] of integrations) {
  const content = await read(path);
  if (!content.includes(`<${component}`)) failures.push(`${path}: missing ${component} integration`);
}

console.log('Reader UI audit: global focus features and six reusable learning components checked.');
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Progress, completion, filters, notes, timer, shortcuts, trees, walkthroughs, dry runs, comparisons, commands, and practice mode are connected.');
}
