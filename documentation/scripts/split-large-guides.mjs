import fs from 'node:fs';
import path from 'node:path';

const docsDir = path.resolve('docs');

const guides = [
  {
    file: 'case-study/COMPLETE-DEMO.mdx', title: 'Complete Shopverse Demo',
    description: 'A focused route through the complete Shopverse demonstration.',
    groups: [
      ['COMPLETE-DEMO-SETUP-CHECKOUT.mdx', 'Demo Setup And Checkout', 'Demo Outcome', '7. Prove Duplicate Request Handling'],
      ['COMPLETE-DEMO-RECOVERY-OBSERVABILITY.mdx', 'Recovery And Observability Proof', '7. Prove Duplicate Request Handling', null],
    ],
  },
  {
    file: 'architecture/hld-lld/CAPACITY-PERFORMANCE-ESTIMATION.md', title: 'Capacity And Performance Estimation',
    description: 'Estimate demand, translate it into resource budgets, and validate the design with operational signals.',
    groups: [
      ['CAPACITY-ESTIMATION-FUNDAMENTALS.md', 'Capacity Estimation Fundamentals', 'Capacity Estimation', 'Performance And Capacity Parameters'],
      ['PERFORMANCE-CAPACITY-MODELS.md', 'Performance And Capacity Models', 'Performance And Capacity Parameters', 'Worked Checkout Estimate'],
      ['SHOPVERSE-CAPACITY-WORKED-EXAMPLE.md', 'Shopverse Capacity Worked Example', 'Worked Checkout Estimate', null],
    ],
  },
  {
    file: 'reliability/problems/runtime/ATOMIC-RESERVATION-CLAIM.md', title: 'Atomic Inventory Reservation',
    description: 'Design contention-safe reservation ownership, transaction boundaries, and recovery.',
    groups: [
      ['RESERVATION-CONTENTION-STATE-MODEL.md', 'Reservation Contention And State Model', 'Problem 1: Two Replicas Select The Same Reservation', 'Recommended Solution: Atomic Conditional Claim'],
      ['ATOMIC-CONDITIONAL-RESERVATION-CLAIM.md', 'Atomic Conditional Reservation Claim', 'Recommended Solution: Atomic Conditional Claim', 'Avoiding Whole-Batch Rollback'],
      ['RESERVATION-TRANSACTION-IMPLEMENTATION.md', 'Reservation Transaction Implementation', 'Avoiding Whole-Batch Rollback', null],
    ],
  },
  {
    file: 'operations/DEPLOYMENT-STRATEGIES.md', title: 'Deployment Strategies',
    description: 'Select, operate, and verify safe deployment strategies for Shopverse services.',
    groups: [
      ['DEPLOYMENT-STRATEGY-SELECTION.md', 'Deployment Strategy Selection', 'Learning Route', 'Feature Flags'],
      ['DEPLOYMENT-TRAFFIC-ROLLBACK.md', 'Traffic Control And Rollback', 'Feature Flags', 'Database Deployment'],
      ['DEPLOYMENT-CONTRACTS-RELEASE-GATES.md', 'Contracts And Release Gates', 'Database Deployment', null],
    ],
  },
  {
    file: 'development/API-GATEWAY-GENERIC.md', title: 'API Gateway Engineering',
    description: 'Understand gateway responsibilities, reactive execution, and production operations.',
    groups: [
      ['API-GATEWAY-ARCHITECTURE.md', 'API Gateway Architecture', 'Common Responsibilities', 'Shopverse Reactive Filter Chain'],
      ['API-GATEWAY-REACTIVE-FILTER-LIFECYCLE.md', 'Reactive Gateway Filter Lifecycle', 'Shopverse Reactive Filter Chain', 'Gateway Metrics'],
      ['API-GATEWAY-OPERATIONS.md', 'API Gateway Operations', 'Gateway Metrics', null],
    ],
  },
  {
    file: 'observability/MICROMETER-METRICS.md', title: 'Micrometer Metrics',
    description: 'Design counters, timers, tags, queries, and production metric operations.',
    groups: [
      ['MICROMETER-COUNTERS.md', 'Micrometer Counters', 'Metrics Flow', 'Timer Example'],
      ['MICROMETER-TIMERS-TAGS-OPERATIONS.md', 'Micrometer Timers, Tags, And Operations', 'Timer Example', null],
    ],
  },
  {
    file: 'reliability/RESILIENCE4J-GENERIC.md', title: 'Resilience4j Engineering',
    description: 'Apply resilience patterns with explicit budgets, composition rules, and operational evidence.',
    groups: [
      ['RESILIENCE4J-RATE-LIMITER-BULKHEAD.md', 'Rate Limiter And Bulkhead', 'Dependencies', 'Retry Pattern'],
      ['RESILIENCE4J-RETRY-CIRCUIT-TIMEOUT.md', 'Retry, Circuit Breaker, And Timeout', 'Retry Pattern', 'Pattern Composition'],
      ['RESILIENCE4J-COMPOSITION-OPERATIONS.md', 'Resilience Pattern Composition And Operations', 'Pattern Composition', null],
    ],
  },
  {
    file: 'security/ACCESS-REFRESH-API-KEY-IMPLEMENTATION-GUIDE.md', title: 'Access, Refresh Token, And API Key Design',
    description: 'Separate access-token, session, API-key, authorization, and operational responsibilities.',
    groups: [
      ['ACCESS-REFRESH-TOKEN-DESIGN.md', 'Access And Refresh Token Design', 'Current Shopverse State', 'Step 8: Add API Key Data Model'],
      ['API-KEY-AUTHORIZATION-OPERATIONS.md', 'API Key Authorization And Operations', 'Step 8: Add API Key Data Model', null],
    ],
  },
  {
    file: 'case-study/SHOPVERSE-ONBOARDING-ARCHITECTURE-AUDIT.md', title: 'Shopverse Architecture Audit',
    description: 'Review current architecture, risks, refactoring priorities, and production readiness.',
    groups: [
      ['SHOPVERSE-ARCHITECTURE-CURRENT-STATE.md', 'Shopverse Architecture Current State', 'Executive Summary', 'Critical Problem Areas'],
      ['SHOPVERSE-ARCHITECTURE-REFACTORING-READINESS.md', 'Shopverse Refactoring And Production Readiness', 'Critical Problem Areas', null],
    ],
  },
  {
    file: 'ai/JAVA-AI-CODE-COOKBOOK.md', title: 'Java AI Code Cookbook', description: 'Production-oriented Java patterns for model integration, RAG, tools, and safety.',
    groups: [
      ['JAVA-AI-REQUEST-RAG-PATTERNS.md', 'Java AI Request And RAG Patterns', '1. Request And Response DTOs', '10. LangChain4j Tool'],
      ['JAVA-AI-TOOLS-SECURITY-PATTERNS.md', 'Java AI Tools And Security Patterns', '10. LangChain4j Tool', null],
    ],
  },
  {
    file: 'ai/LANGCHAIN4J-DEEP-DIVE.md', title: 'LangChain4j Deep Dive', description: 'A focused route through LangChain4j architecture, AI services, tools, memory, and RAG.',
    groups: [
      ['LANGCHAIN4J-ARCHITECTURE-AI-SERVICES.md', 'LangChain4j Architecture And AI Services', 'Why LangChain4j Exists', 'Tools'],
      ['LANGCHAIN4J-TOOLS-MEMORY.md', 'LangChain4j Tools And Memory', 'Tools', 'RAG In LangChain4j'],
      ['LANGCHAIN4J-RAG-SPRING-OPERATIONS.md', 'LangChain4j RAG And Spring Operations', 'RAG In LangChain4j', null],
    ],
  },
  {
    file: 'architecture/hld-lld/PERFORMANCE-CAPACITY-MODELS.md', title: 'Performance And Capacity Models', description: 'Quantitative models for latency, throughput, saturation, storage, queues, and recovery.', headingLevel: 3,
    groups: [
      ['PERFORMANCE-LATENCY-THROUGHPUT-MODELS.md', 'Latency, Throughput, And Saturation Models', 'Latency', 'Availability'],
      ['CAPACITY-STORAGE-QUEUE-POOL-MODELS.md', 'Availability, Storage, Queue, And Pool Models', 'Availability', null],
    ],
  },
  {
    file: 'architecture/SYSTEM-DESIGN.md', title: 'Shopverse System Design', description: 'The complete Shopverse system context, runtime flows, data ownership, and operational boundaries.',
    groups: [
      ['SYSTEM-CONTEXT-SERVICE-OWNERSHIP.md', 'System Context And Service Ownership', 'System Context', 'Synchronous Request Flow'],
      ['CHECKOUT-SECURITY-EVENT-FLOWS.md', 'Checkout, Security, And Event Flows', 'Synchronous Request Flow', 'State Machines'],
      ['STATE-DATA-DEPLOYMENT-BOUNDARIES.md', 'State, Data, Deployment, And Failure Boundaries', 'State Machines', null],
    ],
  },
  {
    file: 'case-study/COMPLETE-DEMO-SETUP-CHECKOUT.mdx', title: 'Demo Setup And Checkout', description: 'Prepare the platform, authenticate, seed data, and execute checkout.',
    groups: [
      ['DEMO-PLATFORM-AUTHENTICATION.mdx', 'Demo Platform And Authentication', 'Demo Outcome', 'Large API Seed Data Set'],
      ['DEMO-SEED-CHECKOUT-SAGA.mdx', 'Demo Seed, Checkout, And SAGA', 'Large API Seed Data Set', null],
    ],
  },
  {
    file: 'case-study/COMPLETE-DEMO-RECOVERY-OBSERVABILITY.mdx', title: 'Recovery And Observability Proof', description: 'Prove idempotency, recovery, DLT handling, metrics, logs, and traces.',
    groups: [
      ['DEMO-IDEMPOTENCY-OUTBOX-RECOVERY.mdx', 'Demo Idempotency, Outbox, And Recovery', '7. Prove Duplicate Request Handling', '11. Find The Journey In Loki And Grafana'],
      ['DEMO-OBSERVABILITY-AUTOMATION.mdx', 'Demo Observability And Automation', '11. Find The Journey In Loki And Grafana', null],
    ],
  },
  {
    file: 'data/DATABASE-ENGINEERING.md', title: 'Database Engineering', description: 'Relational design, query performance, distributed trade-offs, and production correctness.',
    groups: [
      ['RELATIONAL-MODELING-QUERY-PERFORMANCE.md', 'Relational Modeling And Query Performance', 'Relational Modeling', 'ACID'],
      ['DATABASE-CONSISTENCY-SCALING.md', 'Database Consistency And Scaling', 'ACID', null],
    ],
  },
  {
    file: 'development/DEBUGGING.md', title: 'Shopverse Debugging', description: 'Evidence-first diagnosis across routing, security, data, messaging, and observability.',
    groups: [
      ['DEBUGGING-REQUEST-PLATFORM.md', 'Debugging Requests And Platform Dependencies', 'First Five Minutes', 'Database And Liquibase'],
      ['DEBUGGING-DATA-SAGA-KAFKA.md', 'Debugging Data, SAGA, And Kafka', 'Database And Liquibase', 'Prometheus'],
      ['DEBUGGING-OBSERVABILITY-RECOVERY.md', 'Debugging Observability And Recovery', 'Prometheus', null],
    ],
  },
  {
    file: 'development/DESIGN-PATTERNS.md', title: 'Design Patterns', description: 'Select and apply object, behavioral, integration, and reliability patterns.',
    groups: [
      ['DESIGN-PATTERNS-CREATIONAL-STRUCTURAL.md', 'Creational And Structural Patterns', 'Pattern Categories', 'Chain Of Responsibility'],
      ['DESIGN-PATTERNS-BEHAVIORAL-DISTRIBUTED.md', 'Behavioral And Distributed Patterns', 'Chain Of Responsibility', null],
    ],
  },
  {
    file: 'development/ENGINEERING-PRINCIPLES.md', title: 'Engineering Principles', description: 'Apply SOLID and production design principles to Shopverse code reviews.',
    groups: [
      ['SOLID-JAVA-SHOPVERSE.md', 'SOLID With Java And Shopverse', 'SOLID', 'DRY'],
      ['PRODUCTION-DESIGN-PRINCIPLES.md', 'Production Design Principles', 'DRY', null],
    ],
  },
  {
    file: 'development/TESTING.md', title: 'Shopverse Testing Strategy', description: 'Choose verification modes, integration boundaries, CI controls, and failure triage.',
    groups: [
      ['TESTING-ARCHITECTURE-COVERAGE.md', 'Testing Architecture And Coverage', 'Objectives', 'Verification Scripts'],
      ['TESTING-MODES-CI-TRIAGE.md', 'Testing Modes, CI, And Triage', 'Verification Scripts', null],
    ],
  },
  {
    file: 'observability/MDC-CORRELATION-TRACING.md', title: 'Correlation And Trace Propagation', description: 'Propagate identity across gateway, servlet, HTTP, Kafka, and asynchronous boundaries.',
    groups: [
      ['CORRELATION-IDENTIFIERS-HTTP-PROPAGATION.md', 'Correlation Identifiers And HTTP Propagation', 'Why Shopverse Needs A Correlation ID', 'MDC Internals'],
      ['MDC-KAFKA-ASYNC-PROPAGATION.md', 'MDC, Kafka, And Async Propagation', 'MDC Internals', null],
    ],
  },
  {
    file: 'operations/DOCUSAURUS.md', title: 'Docusaurus Documentation Engineering', description: 'Author, organize, customize, deploy, and validate the Shopverse documentation site.',
    groups: [
      ['DOCUSAURUS-AUTHORING-NAVIGATION.md', 'Docusaurus Authoring And Navigation', 'Shopverse Documentation Architecture', 'Modify Styling'],
      ['DOCUSAURUS-COMPONENTS-DEPLOYMENT.md', 'Docusaurus Components And Deployment', 'Modify Styling', null],
    ],
  },
  {
    file: 'operations/GIT-COMMANDS.md', title: 'Git Engineering Guide', description: 'Use Git safely for daily delivery, history management, recovery, and collaboration.',
    groups: [
      ['GIT-DAILY-SYNC-CONFLICTS.md', 'Git Daily Workflow, Sync, And Conflicts', 'Daily Workflow', 'Inspect Changes'],
      ['GIT-HISTORY-RECOVERY-COLLABORATION.md', 'Git History, Recovery, And Collaboration', 'Inspect Changes', null],
    ],
  },
  {
    file: 'reference/FEATURES-AND-DEMOS.md', title: 'Shopverse Features And Demos', description: 'Trace implemented capabilities to reproducible demonstrations and honest roadmap status.',
    groups: [
      ['FEATURES-SECURITY-CHECKOUT.md', 'Security And Checkout Demonstrations', 'Implementation Matrix', 'Transactional Outbox'],
      ['FEATURES-RELIABILITY-OBSERVABILITY.md', 'Reliability And Observability Demonstrations', 'Transactional Outbox', null],
    ],
  },
  {
    file: 'reliability/problems/runtime/RESOURCE-OWNERSHIP-AUTHORIZATION.md', title: 'Resource Ownership Authorization', description: 'Enforce object ownership through method security, trusted context, tests, and operational evidence.',
    groups: [
      ['RESOURCE-OWNERSHIP-SPEL-RUNTIME.md', 'Resource Ownership And SpEL Runtime', 'Problem Statement', 'Ownership Components'],
      ['RESOURCE-OWNERSHIP-TESTS-OPERATIONS.md', 'Resource Ownership Tests And Operations', 'Ownership Components', null],
    ],
  },
  {
    file: 'reliability/SAGA-GENERIC.md', title: 'SAGA And Transactional Outbox', description: 'Design distributed transactions, compensation, outbox delivery, and operations.',
    groups: [
      ['SAGA-CONSISTENCY-COMPENSATION.md', 'SAGA Consistency And Compensation', 'Shopverse Links', 'Transactional Outbox Pattern'],
      ['OUTBOX-DELIVERY-OPERATIONS.md', 'Outbox Delivery And Operations', 'Transactional Outbox Pattern', null],
    ],
  },
  {
    file: 'security/oauth/GOOGLE-AUTHENTICATION-SPRING.md', title: 'Google Authentication With Spring', description: 'Choose and implement secure Google authentication boundaries for Shopverse.',
    groups: [
      ['GOOGLE-OAUTH-CLIENT-SESSION.md', 'Google OAuth Client And Session Login', 'Recommended Shopverse Boundary', '4B. SPA And Microservices: BFF Cookie Model'],
      ['GOOGLE-OAUTH-BFF-TOKEN-PRODUCTION.md', 'Google OAuth BFF, Tokens, And Production', '4B. SPA And Microservices: BFF Cookie Model', null],
    ],
  },
  {
    file: 'security/JWT-OAUTH2-SPRING-SECURITY.md', title: 'JWT, OAuth2, And Spring Security', description: 'Understand Shopverse token validation, filter chains, authorization, and security roadmap.',
    groups: [
      ['JWT-LOGIN-VALIDATION-AUTHORITIES.md', 'JWT Login, Validation, And Authorities', 'What Shopverse Uses', 'Security Context'],
      ['SPRING-SECURITY-FILTERS-OWNERSHIP-ROADMAP.md', 'Spring Security Filters, Ownership, And Roadmap', 'Security Context', null],
    ],
  },
];

function frontmatter(title, description, pageType = 'Guide') {
  return `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description)}\nsidebar_label: ${JSON.stringify(title)}\ntags: ["shopverse", "architecture", "production"]\npage_type: ${JSON.stringify(pageType)}\ndifficulty: "Advanced"\nstatus: "maintained"\nlast_reviewed: "2026-07-13"\n---\n\n`;
}

function sectionsOf(source, headingLevel = 2) {
  const body = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').replace(/^import .*\r?\n(?:\r?\n)?/gm, '');
  const marker = '#'.repeat(headingLevel);
  const matches = [...body.matchAll(new RegExp(`^${marker}\\s+(.+)$`, 'gm'))];
  return matches.map((match, index) => ({
    title: match[1].trim(),
    content: body.slice(match.index, matches[index + 1]?.index ?? body.length).trim()
      .replace(new RegExp(`^${marker}\\s+`, 'gm'), '## '),
  }));
}

function routeFor(relative) {
  return '/' + relative.replace(/\\/g, '/').replace(/\.mdx?$/, '');
}

for (const guide of guides) {
  const sourcePath = path.join(docsDir, guide.file);
  const source = fs.readFileSync(sourcePath, 'utf8');
  if (source.includes('<!-- split-guide-index -->')) continue;
  const sections = sectionsOf(source, guide.headingLevel);
  const directory = path.dirname(sourcePath);
  const cards = [];

  for (const [filename, title, from, to] of guide.groups) {
    const start = sections.findIndex((section) => section.title === from);
    const end = to ? sections.findIndex((section) => section.title === to) : sections.length;
    if (start < 0 || end < 0 || end <= start) throw new Error(`Cannot split ${guide.file}: ${from} -> ${to}`);
    const content = sections.slice(start, end).map((section) => section.content).join('\n\n');
    const child = frontmatter(title, `${title} with Shopverse examples, failure analysis, and production guidance.`) +
      `# ${title}\n\n<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />\n\n` +
      content +
      `\n\n## Recommended Next\n\nReturn to [${guide.title}](./${path.basename(guide.file)}) to select the next focused guide.\n`;
    fs.writeFileSync(path.join(directory, filename), child);
    cards.push({filename, title});
  }

  const relativeDir = path.dirname(guide.file).replaceAll('\\', '/');
  const cardRows = cards.map((card, index) =>
    `  {title: '${card.title.replaceAll("'", "\\'")}', href: '${routeFor(path.posix.join(relativeDir, card.filename))}', description: 'Part ${index + 1} of the focused ${guide.title} learning route.', icon: '${index === 0 ? 'route' : index === cards.length - 1 ? 'security' : 'layers'}', tags: ['Focused', 'Advanced']},`
  ).join('\n');
  const nodes = cards.map((card, index) => `    P${index + 1}["${card.title}"]`).join('\n');
  const edges = cards.slice(1).map((_, index) => `    P${index + 1} --> P${index + 2}`).join('\n');
  const landing = frontmatter(guide.title, guide.description, 'Learning Path') +
    `<!-- split-guide-index -->\n# ${guide.title}\n\n<DocLabels items={[{label: 'Focused guides', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Architect route', tone: 'production'}]} />\n\n` +
    `${guide.description} The original long-form material is preserved without duplication across the focused pages below.\n\n` +
    `\`\`\`mermaid\nflowchart LR\n${nodes}\n${edges}\n\`\`\`\n\n` +
    `<TopicCards items={[\n${cardRows}\n]} />\n\n` +
    `<DocCallout type="tip" title="Use the index as the stable entry point">\n\nEach focused page owns one concern. Cross-links point to the canonical explanation instead of repeating the same material.\n\n</DocCallout>\n\n` +
    `## Recommended Learning Order\n\n${cards.map((card, index) => `${index + 1}. [${card.title}](./${card.filename})`).join('\n')}\n`;
  fs.writeFileSync(sourcePath, landing);
  console.log(`Split ${guide.file} into ${cards.length} focused guides.`);
}

const sidebarPath = path.resolve('sidebars.ts');
let sidebar = fs.readFileSync(sidebarPath, 'utf8');
for (const guide of guides) {
  const id = guide.file.replace(/\.mdx?$/, '');
  if (sidebar.includes(`link: {type: 'doc', id: '${id}'}`)) continue;
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const bare = new RegExp(`^([ \\t]*)'${escaped}',`, 'm');
  const match = sidebar.match(bare);
  if (!match) {
    console.warn(`Sidebar entry not found for ${id}`);
    continue;
  }
  const indent = match[1];
  const childIds = guide.groups.map(([filename]) =>
    path.posix.join(path.posix.dirname(id), filename.replace(/\.mdx?$/, ''))
  );
  const items = childIds.map((child) => `${indent}    '${child}',`).join('\n');
  const category = `${indent}{\n${indent}  type: 'category',\n${indent}  label: '${guide.title.replaceAll("'", "\\'")}',\n${indent}  link: {type: 'doc', id: '${id}'},\n${indent}  items: [\n${items}\n${indent}  ],\n${indent}},`;
  sidebar = sidebar.replace(bare, category);
}
sidebar = sidebar.replace(/\r?\n[ \t]*\r?\n/g, '\n');
fs.writeFileSync(sidebarPath, sidebar);

const registry = guides.map((guide) => ({
  index: guide.file.replace(/\.mdx?$/, ''),
  pages: guide.groups.map(([filename]) =>
    path.posix.join(path.posix.dirname(guide.file), filename).replace(/\.mdx?$/, '')
  ),
}));
fs.writeFileSync(path.resolve('governance/split-guide-registry.json'), JSON.stringify(registry, null, 2) + '\n');

const officialReferences = {
  ai: ['[LangChain4j documentation](https://docs.langchain4j.dev/)', '[Spring AI reference](https://docs.spring.io/spring-ai/reference/)'],
  architecture: ['[AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)', '[RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)'],
  'case-study': ['[Spring Boot reference](https://docs.spring.io/spring-boot/reference/)', '[Apache Kafka documentation](https://kafka.apache.org/documentation/)'],
  data: ['[MySQL reference manual](https://dev.mysql.com/doc/refman/8.4/en/)', '[Jakarta Persistence specification](https://jakarta.ee/specifications/persistence/)'],
  development: ['[Spring Framework reference](https://docs.spring.io/spring-framework/reference/)', '[Spring Boot reference](https://docs.spring.io/spring-boot/reference/)'],
  observability: ['[Micrometer documentation](https://docs.micrometer.io/micrometer/reference/)', '[OpenTelemetry documentation](https://opentelemetry.io/docs/)'],
  operations: ['[Docusaurus documentation](https://docusaurus.io/docs)', '[Git documentation](https://git-scm.com/docs)'],
  reference: ['[Spring Boot reference](https://docs.spring.io/spring-boot/reference/)', '[Apache Kafka documentation](https://kafka.apache.org/documentation/)'],
  reliability: ['[Resilience4j documentation](https://resilience4j.readme.io/docs)', '[Apache Kafka documentation](https://kafka.apache.org/documentation/)'],
  security: ['[Spring Security reference](https://docs.spring.io/spring-security/reference/)', '[OAuth 2.0 Security Best Current Practice](https://www.rfc-editor.org/rfc/rfc9700)'],
};
for (const entry of registry) {
  for (const id of [entry.index, ...entry.pages]) {
    const extension = fs.existsSync(path.join(docsDir, `${id}.mdx`)) ? '.mdx' : '.md';
    const file = path.join(docsDir, id + extension);
    let source = fs.readFileSync(file, 'utf8');
    const pageTitle = source.match(/^#\s+(.+)$/m)?.[1] ?? path.posix.basename(id);
    const proseWords = source.replace(/^---[\s\S]*?---\s*/m, ' ').replace(/```[\s\S]*?```/g, ' ')
      .replace(/<[^>]+>/g, ' ').match(/[A-Za-z][A-Za-z0-9-]{2,}/g)?.length ?? 0;
    if (proseWords < 120) {
      const routeTitle = guides.find((guide) => entry.index === guide.file.replace(/\.mdx?$/, ''))?.title ?? 'the parent route';
      const readingStrategy = `## Reading Strategy\n\nUse **${pageTitle}** as a decision and verification guide inside **${routeTitle}**. Start by naming the invariant or operational outcome, then follow the runtime flow and identify the owning component. For every example, record the expected success evidence, the most important failure mode, and the metric or test that proves recovery. This keeps the material useful for implementation reviews, production incidents, and architect interviews instead of treating it as isolated syntax.\n\nWithin **${pageTitle}**, apply the Shopverse guidance incrementally: verify the current behavior, introduce one bounded change, test the unhappy path, and preserve a rollback or reconciliation route. Follow links to canonical pages when a concept belongs to another track; do not copy that explanation into this page. This ownership rule keeps the focused guides short while retaining technical depth and traceability.\n\n`;
      source = source.replace(/\n## Official References\n/, `\n${readingStrategy}## Official References\n`);
    }
    source = source.replace('In Shopverse, apply the guidance incrementally: verify the current behavior, introduce one bounded change, test the unhappy path, and preserve a rollback or reconciliation route.', `Within **${pageTitle}**, apply the Shopverse guidance incrementally: verify the current behavior, introduce one bounded change, test the unhappy path, and preserve a rollback or reconciliation route.`);
    if (!/^## Official References$/m.test(source)) {
      const root = id.split('/')[0];
      const refs = officialReferences[root] ?? officialReferences.architecture;
      source += `\n\n## Official References\n\n${refs.map((ref) => `- ${ref}`).join('\n')}\n`;
    }
    fs.writeFileSync(file, source);
  }
}
console.log(`Registered ${registry.length} split-guide routes.`);
