import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const sidebar = await readFile(join(root, 'sidebars.ts'), 'utf8');
const failures = [];

const guides = [
  {
    id: 'java/JAVA-CUSTOM-EXCEPTIONS-CHECKED-UNCHECKED',
    terms: ['checked exception', 'unchecked exception', 'RuntimeException', 'preserve the original cause', 'suppressed', 'rollback', 'Interview Questions'],
  },
  {
    id: 'development/spring-boot-internals/SPRING-BEAN-LIFECYCLE-GC-STATIC-REFERENCES',
    terms: ['singleton registry', 'prototype', 'Static Variables', 'ThreadLocal', 'GC root', '@PreDestroy', 'Interview Questions'],
  },
  {
    id: 'development/spring-boot-internals/AUTOWIRING-CIRCULAR-REFERENCE-INTERNALS',
    terms: ['Constructor Injection', 'Field Injection', 'ObjectProvider', '@Primary', '@Qualifier', 'NoUniqueBeanDefinitionException', 'Circular Dependencies', 'Interview Questions'],
  },
  {
    id: 'operations/performance-chaos/PRODUCTION-SLOWNESS-DIAGNOSIS-RUNBOOK',
    terms: ['First Five Minutes', 'p50/p95/p99', 'Trace The Critical Path', 'JFR', 'Database Diagnosis', 'Rapid Mitigation', 'Recovery Proof', 'Interview Questions'],
  },
];

for (const guide of guides) {
  const content = await readFile(join(root, 'docs', `${guide.id}.md`), 'utf8');
  if (!sidebar.includes(`'${guide.id}'`)) failures.push(`${guide.id}: missing from sidebar`);
  for (const term of guide.terms) {
    if (!content.toLowerCase().includes(term.toLowerCase())) failures.push(`${guide.id}: missing ${term}`);
  }
  if (!content.includes('<ExpandableAnswer')) failures.push(`${guide.id}: missing collapsible explanation`);
  if (!content.includes('```java')) failures.push(`${guide.id}: missing Java example`);
  if (!/^## Official References$/m.test(content)) failures.push(`${guide.id}: missing official references`);
  if (!/^## Recommended Next$/m.test(content)) failures.push(`${guide.id}: missing recommended next step`);
}

console.log(`Java/Spring/production guide audit: ${guides.length} focused guides checked.`);
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Exception, bean/GC, autowiring, ambiguity, circular-dependency, and latency-runbook coverage is present.');
}
