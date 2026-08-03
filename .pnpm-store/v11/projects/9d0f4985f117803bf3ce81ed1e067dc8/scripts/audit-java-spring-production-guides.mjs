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

const containerInterview = 'spring/interview/SPRING-BOOT-CONTAINER-INTERVIEW';
const containerCoverage = [
  {
    topic: 'BeanFactory versus ApplicationContext',
    canonical: 'development/spring-boot-internals/DEPENDENCY-INJECTION-BEAN-RESOLUTION',
    canonicalTerms: ['BeanFactory', 'ApplicationContext', 'automatic processor discovery'],
    interviewTerm: 'difference between BeanFactory and ApplicationContext',
  },
  {
    topic: 'FactoryBean product and factory identity',
    canonical: 'development/spring-boot-internals/DEPENDENCY-INJECTION-BEAN-RESOLUTION',
    canonicalTerms: ['FactoryBean<T>', 'getBean("&client")', '@Bean'],
    interviewTerm: 'FactoryBean, BeanFactory and @Bean differ',
  },
  {
    topic: 'multiple-constructor selection',
    canonical: 'development/spring-boot-internals/DEPENDENCY-INJECTION-BEAN-RESOLUTION',
    canonicalTerms: ['How Spring Selects A Constructor', '@Autowired(required = false)', 'greediest constructor'],
    interviewTerm: 'select a constructor when several exist',
  },
  {
    topic: 'Autowired Inject and Resource semantics',
    canonical: 'development/spring-boot-internals/DEPENDENCY-INJECTION-BEAN-RESOLUTION',
    canonicalTerms: ['`@Autowired`, `@Inject`, And `@Resource`', 'explicit or inferred bean name', 'constructor injection'],
    interviewTerm: '@Autowired, @Inject and @Resource differ',
  },
  {
    topic: 'constructor dependency DependsOn and Order',
    canonical: 'development/spring-boot-internals/DEPENDENCY-INJECTION-BEAN-RESOLUTION',
    canonicalTerms: ['@DependsOn', '@Order', 'dependency path'],
    interviewTerm: 'Constructor dependency, @DependsOn or @Order',
  },
  {
    topic: 'lookup method injection',
    canonical: 'development/spring-boot-internals/DEPENDENCY-INJECTION-BEAN-RESOLUTION',
    canonicalTerms: ['lookup-method injection', 'ObjectProvider<ExportWorkspace>', '`@Bean` factory'],
    interviewTerm: '@Lookup instead of ObjectProvider',
  },
  {
    topic: 'lifecycle callback order',
    canonical: 'development/spring-boot-internals/BEAN-SCOPES-LIFECYCLE',
    canonicalTerms: ['Exact Callback Sequence', 'InitializingBean.afterPropertiesSet()', 'custom init method'],
    interviewTerm: 'bean initialization callback order',
  },
  {
    topic: 'Aware infrastructure callbacks',
    canonical: 'development/spring-boot-internals/BEAN-SCOPES-LIFECYCLE',
    canonicalTerms: ['BeanNameAware', 'BeanFactoryAware', 'ApplicationContextAware'],
    interviewTerm: 'Spring Aware interfaces',
  },
  {
    topic: 'lazy definition and injection-point semantics',
    canonical: 'development/spring-boot-internals/BEAN-SCOPES-LIFECYCLE',
    canonicalTerms: ['Lazy Resolution', 'injection point', 'first-use latency'],
    interviewTerm: 'What exactly does @Lazy defer',
  },
  {
    topic: 'parent and child context ownership',
    canonical: 'development/spring-boot-internals/BEAN-SCOPES-LIFECYCLE',
    canonicalTerms: ['Parent And Child Application Contexts', 'shadow a parent bean name', 'separate singleton'],
    interviewTerm: 'parent and child ApplicationContexts',
  },
  {
    topic: 'container post-processor boundaries',
    canonical: 'development/spring-boot-internals/STARTUP-EXTENSION-POINTS',
    canonicalTerms: ['BeanDefinitionRegistryPostProcessor', 'BeanFactoryPostProcessor', 'BeanPostProcessor'],
    interviewTerm: 'BeanDefinitionRegistryPostProcessor, BeanFactoryPostProcessor and BeanPostProcessor',
  },
  {
    topic: 'singleton completion lifecycle and runner boundaries',
    canonical: 'development/spring-boot-internals/STARTUP-EXTENSION-POINTS',
    canonicalTerms: ['SmartInitializingSingleton', 'SmartLifecycle', 'ApplicationRunner'],
    interviewTerm: 'SmartInitializingSingleton, SmartLifecycle or runner',
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

const contentCache = new Map();
async function guideContent(id) {
  if (!contentCache.has(id)) {
    contentCache.set(id, await readFile(join(root, 'docs', `${id}.md`), 'utf8'));
  }
  return contentCache.get(id);
}

const interviewContent = await guideContent(containerInterview);
if (!sidebar.includes(`'${containerInterview}'`)) failures.push(`${containerInterview}: missing from sidebar`);
for (const coverage of containerCoverage) {
  const canonicalContent = await guideContent(coverage.canonical);
  for (const term of coverage.canonicalTerms) {
    if (!canonicalContent.toLowerCase().includes(term.toLowerCase())) {
      failures.push(`${coverage.canonical}: ${coverage.topic} is missing canonical term ${term}`);
    }
  }
  if (!interviewContent.toLowerCase().includes(coverage.interviewTerm.toLowerCase())) {
    failures.push(`${containerInterview}: missing interview coverage for ${coverage.topic}`);
  }
}

console.log(`Java/Spring/production guide audit: ${guides.length} focused guides and ${containerCoverage.length} container interview topics checked.`);
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Exception, bean/GC, autowiring, container interview, ambiguity, circular-dependency, and latency-runbook coverage is present.');
}
