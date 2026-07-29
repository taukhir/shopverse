import {access, readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const docs = join(root, 'docs', 'development', 'design-patterns');
const sidebar = await readFile(join(root, 'sidebars.ts'), 'utf8');
const failures = [];

const families = {
  'CREATIONAL-PATTERNS.md': ['Factory Method', 'Abstract Factory', 'Builder', 'Prototype', 'Singleton'],
  'STRUCTURAL-PATTERNS.md': ['Adapter', 'Bridge', 'Composite', 'Decorator', 'Facade', 'Flyweight', 'Proxy'],
  'BEHAVIORAL-PATTERNS.md': ['Chain Of Responsibility', 'Command', 'Interpreter', 'Iterator', 'Mediator', 'Memento', 'Observer', 'State', 'Strategy', 'Template Method', 'Visitor'],
};

const deepDives = [
  'immutable-class', 'factory', 'abstract-factory', 'builder', 'prototype', 'singleton',
  'adapter', 'bridge', 'decorator', 'proxy',
  'strategy', 'observer', 'chain-of-responsibility', 'template-method',
];

for (const [file, patterns] of Object.entries(families)) {
  const content = await readFile(join(docs, file), 'utf8');
  for (const pattern of patterns) {
    if (!content.toLowerCase().includes(pattern.toLowerCase())) {
      failures.push(`${file}: missing ${pattern}`);
    }
  }
}

for (const id of deepDives) {
  const path = join(docs, `${id}.md`);
  try {
    await access(path);
  } catch {
    failures.push(`${id}: dedicated page is missing`);
    continue;
  }
  const content = await readFile(path, 'utf8');
  if (!sidebar.includes(`development/design-patterns/${id}`)) failures.push(`${id}: not in sidebar`);
  if (!/```java/.test(content)) failures.push(`${id}: missing Java implementation`);
  if (!/Interview/i.test(content)) failures.push(`${id}: missing interview preparation`);
  if (!/^## Official References$/m.test(content)) failures.push(`${id}: missing official references`);
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  if (wordCount < 500) failures.push(`${id}: too short for a deep dive (${wordCount} words)`);
}

const immutable = await readFile(join(docs, 'immutable-class.md'), 'utf8');
for (const topic of ['defensive copy', 'List.copyOf', 'unmodifiableList', 'Cloneable', 'record', 'final', 'serialization', 'reflection', 'Thread Safety', 'Dry run']) {
  if (!immutable.toLowerCase().includes(topic.toLowerCase())) failures.push(`immutable-class: missing ${topic}`);
}

console.log(`Design-pattern audit: 23 GoF patterns catalogued; ${deepDives.length} priority deep dives checked.`);
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Problem, implementation, trade-off, interview, references, and immutability coverage are present.');
}
