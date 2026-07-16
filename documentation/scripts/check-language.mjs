import {readFile, readdir} from 'node:fs/promises';
import {extname, join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const docsRoot = fileURLToPath(new URL('../docs/', import.meta.url));
const suspicious = new Map([
  ['docsaurus', 'Docusaurus'],
  ['docasaurus', 'Docusaurus'],
  ['docusarus', 'Docusaurus'],
  ['springboot', 'Spring Boot'],
  ['singelton', 'singleton'],
  ['stratergy', 'strategy'],
  ['responsiblity', 'responsibility'],
  ['seperate', 'separate'],
  ['occurence', 'occurrence'],
  ['enviroment', 'environment'],
  ['dependancy', 'dependency'],
]);

async function walk(directory) {
  return (await Promise.all((await readdir(directory, {withFileTypes: true})).map((entry) =>
    entry.isDirectory() ? walk(join(directory, entry.name)) : join(directory, entry.name)))).flat();
}

const files = (await walk(docsRoot)).filter((file) => ['.md', '.mdx'].includes(extname(file)));
const failures = [];
for (const file of files) {
  const content = (await readFile(file, 'utf8'))
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ');
  const lines = content.split(/\r?\n/);
  for (const [misspelling, replacement] of suspicious) {
    const pattern = new RegExp(`\\b${misspelling}\\b`, 'i');
    const index = lines.findIndex((line) => pattern.test(line));
    if (index >= 0) failures.push(`${relative(docsRoot, file)}:${index + 1}: use "${replacement}" instead of "${misspelling}"`);
  }
}

console.log(`Language guard checked ${files.length} pages for governed terminology and common documentation misspellings.`);
if (failures.length) {
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log('Language guard passed.');
}
