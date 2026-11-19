import {readFile} from 'node:fs/promises';
import {walkAllDocs} from './lib/doc-roots.mjs';

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

const docs = await walkAllDocs();
const failures = [];
for (const {file, id} of docs) {
  const content = (await readFile(file, 'utf8'))
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ');
  const lines = content.split(/\r?\n/);
  for (const [misspelling, replacement] of suspicious) {
    const pattern = new RegExp(`\\b${misspelling}\\b`, 'i');
    const index = lines.findIndex((line) => pattern.test(line));
    if (index >= 0) failures.push(`${id}:${index + 1}: use "${replacement}" instead of "${misspelling}"`);
  }
}

console.log(`Language guard checked ${docs.length} pages for governed terminology and common documentation misspellings.`);
if (failures.length) {
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log('Language guard passed.');
}
