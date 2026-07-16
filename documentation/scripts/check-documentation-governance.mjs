import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const documentationDir = path.resolve(scriptDir, '..');
const docsDir = path.join(documentationDir, 'docs');
const repositoryDir = path.resolve(documentationDir, '..');
const sidebarPath = path.join(documentationDir, 'sidebars.ts');
const policy = JSON.parse(fs.readFileSync(
  path.join(documentationDir, 'governance', 'documentation-version-policy.json'), 'utf8'));

const focusRoots = [
  docsDir,
];
const focusFiles = [];
const requiredRegistrationRoots = [
  docsDir,
];
const strictSnippetRoots = [
  path.join(docsDir, 'spring', 'architect-labs'),
  path.join(docsDir, 'spring', 'decisions'),
  path.join(docsDir, 'security', 'spring-security', 'CSRF-CORS-BROWSER-SECURITY.md'),
  path.join(docsDir, 'security', 'spring-security', 'THREAT-MODELING-INTERVIEW-LAB.md'),
  path.join(docsDir, 'security', 'spring-security', 'PASSWORD-AUTHENTICATION-RUNTIME.md'),
  path.join(docsDir, 'security', 'spring-security', 'SECURITY-CONTEXT-LIFECYCLE.md'),
];

function walk(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, {withFileTypes: true}).flatMap((entry) => {
    const resolved = path.join(root, entry.name);
    return entry.isDirectory() ? walk(resolved) : [resolved];
  });
}

const markdownFiles = [...new Set([
  ...focusRoots.flatMap(walk).filter((file) => /\.mdx?$/.test(file)),
  ...focusFiles,
])];
const registrationFiles = requiredRegistrationRoots.flatMap(walk).filter((file) => /\.mdx?$/.test(file));
const sidebar = fs.readFileSync(sidebarPath, 'utf8');
const errors = [];
const snippetSources = new Set();
const snippetTests = new Set();

function relative(file) {
  return path.relative(documentationDir, file).replaceAll('\\', '/');
}

function docId(file) {
  const relativePath = path.relative(docsDir, file).replaceAll('\\', '/').replace(/\.mdx?$/, '');
  const declaredId = fs.readFileSync(file, 'utf8').match(/^id:\s*['"]?([^'"\r\n]+)['"]?\s*$/m)?.[1]?.trim();
  const conventionalId = path.posix.basename(relativePath).replace(/^\d+-/, '');
  return path.posix.join(path.posix.dirname(relativePath), declaredId ?? conventionalId);
}

function resolveDocLink(sourceFile, rawLink) {
  const link = rawLink.split('#')[0].split('?')[0];
  if (!link || /^(?:https?:|mailto:|tel:)/i.test(link) || link.startsWith('/')) return true;
  let decoded;
  try {
    decoded = decodeURIComponent(link);
  } catch {
    errors.push(`${relative(sourceFile)}: invalid URL encoding in ${rawLink}`);
    return false;
  }
  const base = path.resolve(path.dirname(sourceFile), decoded);
  const candidates = path.extname(base)
    ? [base]
    : [base, `${base}.md`, path.join(base, 'README.md')];
  if (!candidates.some((candidate) => fs.existsSync(candidate))) {
    errors.push(`${relative(sourceFile)}: broken internal link ${rawLink}`);
    return false;
  }
  return true;
}

for (const file of markdownFiles) {
  const content = fs.readFileSync(file, 'utf8');

  for (const match of content.matchAll(/(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    resolveDocLink(file, match[1]);
  }

  const headings = [...content.matchAll(/^##\s+(.+)$/gm)]
    .map((match) => match[1].replace(/`/g, '').trim().toLowerCase());
  const seenHeadings = new Set();
  for (const heading of headings) {
    if (seenHeadings.has(heading)) {
      errors.push(`${relative(file)}: duplicate heading "${heading}"`);
    }
    seenHeadings.add(heading);
  }

  const paragraphs = content
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter((paragraph) => paragraph.length >= 180 && !paragraph.startsWith('```')
      && !paragraph.startsWith('<') && !paragraph.includes('Moved to ['));
  const seenParagraphs = new Set();
  for (const paragraph of paragraphs) {
    const normalized = paragraph.toLowerCase();
    if (seenParagraphs.has(normalized)) {
      errors.push(`${relative(file)}: exact repeated long paragraph`);
    }
    seenParagraphs.add(normalized);
  }

  const technologies = content.match(/^technologies:\s*\[(.*)]\s*$/m)?.[1] ?? '';
  const bootVersion = technologies.match(/Spring Boot\s+(\d+)/i)?.[1];
  const frameworkVersion = technologies.match(/Spring Framework\s+(\d+)/i)?.[1];
  if (bootVersion && bootVersion !== policy.frontmatterRules['Spring Boot']) {
    errors.push(`${relative(file)}: current technologies declare Spring Boot ${bootVersion}; expected major ${policy.frontmatterRules['Spring Boot']}`);
  }
  if (frameworkVersion && frameworkVersion !== policy.frontmatterRules['Spring Framework']) {
    errors.push(`${relative(file)}: current technologies declare Spring Framework ${frameworkVersion}; expected major ${policy.frontmatterRules['Spring Framework']}`);
  }

  for (const match of content.matchAll(/<!--\s*snippet-source:\s*([^>]+?)\s*-->/g)) {
    snippetSources.add(match[1].trim());
  }
  for (const match of content.matchAll(/<!--\s*snippet-test:\s*([^>]+?)\s*-->/g)) {
    snippetTests.add(match[1].trim());
  }

  const requiresCompiledReference = strictSnippetRoots.some((root) =>
    file === root || file.startsWith(`${root}${path.sep}`));
  if (requiresCompiledReference && content.includes('```java')
      && (!content.includes('snippet-source:') || !content.includes('snippet-test:'))) {
    errors.push(`${relative(file)}: Java fence in an executable-guide scope lacks snippet-source/snippet-test references`);
  }
}

for (const file of registrationFiles) {
  if (/^sidebar_exclude:\s*true\s*$/m.test(fs.readFileSync(file, 'utf8'))) continue;
  const id = docId(file);
  if (!sidebar.includes(`'${id}'`) && !sidebar.includes(`id: '${id}'`)) {
    errors.push(`${relative(file)}: page is not registered in sidebars.ts as ${id}`);
  }
}

for (const snippet of [...snippetSources, ...snippetTests]) {
  const resolved = path.join(documentationDir, snippet);
  if (!fs.existsSync(resolved)) {
    errors.push(`snippet reference does not exist: ${snippet}`);
  }
}

const labBuild = fs.readFileSync(
  path.join(documentationDir, 'labs', 'spring-architect', 'build.gradle'), 'utf8');
const requiredBuildTokens = [
  `JavaLanguageVersion.of(${policy.java})`,
  `id 'org.springframework.boot' version '${policy.springBoot}'`,
  `set('resilience4jVersion', '${policy.resilience4j}')`,
];
for (const token of requiredBuildTokens) {
  if (!labBuild.includes(token)) errors.push(`spring lab build is missing governed version token: ${token}`);
}

if (snippetSources.size === 0 || snippetTests.size === 0) {
  errors.push('no compiled snippet source/test markers were found');
}

if (errors.length) {
  console.error(`Documentation governance failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Documentation governance passed:`);
console.log(`- ${markdownFiles.length} focused pages checked for internal links and duplicate sections`);
console.log(`- ${registrationFiles.length} pages checked for sidebar registration`);
console.log(`- ${snippetSources.size} source and ${snippetTests.size} test references verified`);
console.log(`- Java ${policy.java}, Spring Boot ${policy.springBoot}, Spring Framework ${policy.springFrameworkMajor}, and Resilience4j ${policy.resilience4j} policy enforced`);
