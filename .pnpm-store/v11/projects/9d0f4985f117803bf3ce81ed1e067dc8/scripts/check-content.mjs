import {readdir, readFile} from 'node:fs/promises';
import {extname, join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const docsRoot = fileURLToPath(new URL('../docs/', import.meta.url));

async function collect(directory) {
  const entries = await readdir(directory, {withFileTypes: true});
  const files = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? collect(path) : path;
  }));
  return files.flat();
}

const problems = [];
const files = (await collect(docsRoot)).filter((file) => ['.md', '.mdx'].includes(extname(file)));

for (const file of files) {
  const content = await readFile(file, 'utf8');
  const frontMatterTitle = /^---[\s\S]*?^title:\s*.+?\s*$[\s\S]*?^---/m.test(content);
  const markdownTitle = /^#\s+\S.+$/m.test(content);
  if (!frontMatterTitle && !markdownTitle) {
    problems.push(`${relative(docsRoot, file)}: missing a page title`);
  }
  if (/\]\(http:\/\//i.test(content)) {
    problems.push(`${relative(docsRoot, file)}: insecure HTTP link; prefer HTTPS`);
  }
}

if (problems.length) {
  console.error(`Documentation quality check failed (${problems.length} problem${problems.length === 1 ? '' : 's'}):`);
  problems.forEach((problem) => console.error(`- ${problem}`));
  process.exitCode = 1;
} else {
  console.log(`Documentation quality check passed for ${files.length} Markdown/MDX files.`);
}
