import {readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const docs = join(root, 'docs');
const ref = {
  java: ['[Java Language Specification](https://docs.oracle.com/javase/specs/jls/se25/html/)', '[Java Virtual Machine Specification](https://docs.oracle.com/javase/specs/jvms/se25/html/)', '[Java SE 25 API](https://docs.oracle.com/en/java/javase/25/docs/api/)'],
  spring: ['[Spring Framework reference](https://docs.spring.io/spring-framework/reference/)', '[Spring Boot reference](https://docs.spring.io/spring-boot/reference/)', '[Spring project documentation](https://spring.io/projects)'],
  data: ['[PostgreSQL documentation](https://www.postgresql.org/docs/current/)', '[MySQL Reference Manual](https://dev.mysql.com/doc/refman/8.4/en/)', '[Apache Cassandra documentation](https://cassandra.apache.org/doc/latest/)'],
  architecture: ['[Google Site Reliability Engineering book](https://sre.google/sre-book/table-of-contents/)', '[AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)', '[RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)'],
  reliability: ['[Spring transaction management](https://docs.spring.io/spring-framework/reference/data-access/transaction.html)', '[Apache Kafka documentation](https://kafka.apache.org/documentation/)', '[PostgreSQL explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html)'],
  security: ['[OAuth 2.0 Security Best Current Practice — RFC 9700](https://www.rfc-editor.org/rfc/rfc9700)', '[OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)', '[NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)'],
  operations: ['[Kubernetes documentation](https://kubernetes.io/docs/)', '[Docker documentation](https://docs.docker.com/)', '[Google SRE Book](https://sre.google/sre-book/table-of-contents/)'],
  ai: ['[LangChain4j documentation](https://docs.langchain4j.dev/)', '[Model Context Protocol specification](https://modelcontextprotocol.io/specification/)', '[Spring AI reference](https://docs.spring.io/spring-ai/reference/)'],
};

const referenceFiles = [
  'ai/LANGCHAIN4J-DEEP-DIVE.md',
  'architecture/ASYNC-REALTIME-DISTRIBUTED-TIME.md','architecture/DISTRIBUTED-HYBRID-CACHE.md','architecture/hld-lld/CAPACITY-PERFORMANCE-ESTIMATION.md','architecture/hld-lld/SIXTEEN-SYSTEM-DESIGN-CASE-STUDIES.md','architecture/MICROSERVICES-PATTERNS.md','architecture/MULTITENANCY-STORAGE-FEATURE-FLAGS.md','architecture/NETWORKING-GRPC-SERVICE-MESH.md','architecture/system-design-deep-dives/CASE-STUDY-WORKBOOK.md','architecture/system-design-deep-dives/DISTRIBUTED-COMPONENT-INTERNALS.md','architecture/system-design-deep-dives/INTERVIEW-RUBRIC.md','architecture/SYSTEM-DESIGN-DEEP-DIVES.md','architecture/SYSTEM-DESIGN.md',
  'case-study/COMPLETE-DEMO.mdx','case-study/SHOPVERSE-ONBOARDING-ARCHITECTURE-AUDIT.md',
  'data/DATA-PIPELINES-SEARCH-OPERATIONS.md','data/database-selection/CONSISTENCY-MODELS-BASE.md','data/database-selection/DATABASE-CONCURRENCY-BACKPRESSURE.md','data/database-selection/DATABASE-INTERVIEW-EXERCISES.md','data/database-selection/DATABASE-MIGRATIONS-OPERATIONS.md','data/database-selection/SCALING-CAP-DISTRIBUTION.md','data/hibernate/HIBERNATE-CACHING.md',
  'development/REST-API-PRODUCTION-DESIGN.md',
  'java/advanced-internals/DYNAMIC-JAVA-INTERNALS.md','java/advanced-internals/NIO-PERFORMANCE-JMH.md','java/ADVANCED-JAVA-INTERNALS.md','java/JAVA-KEYWORDS.md','java/JVM-PROFILING-GC-NATIVE.md',
  'operations/DEPLOYMENT-STRATEGIES.md','operations/PERFORMANCE-CAPACITY-FINOPS.md','operations/SRE-DR-CHAOS.md',
  'reference/DISTRIBUTED-SYSTEMS-INTERVIEW.md',
  'reliability/DISTRIBUTED-SCHEDULER-WORK-CLAIMS.md','reliability/problems/runtime/ATOMIC-RESERVATION-CLAIM.md','reliability/problems/runtime/RESOURCE-OWNERSHIP-AUTHORIZATION.md','reliability/RESILIENCE4J-GENERIC.md','reliability/SHOPVERSE-SAGA-CODE-FLOW.md',
  'security/ACCESS-REFRESH-API-KEY-IMPLEMENTATION-GUIDE.md','security/SUPPLY-CHAIN-PRIVACY.md',
  'spring/internals-production/HIBERNATE-JDBC-INTERNALS.md','spring/internals-production/PRODUCTION-LIFECYCLE.md','spring/internals-production/WEB-HTTP-RUNTIME.md','spring/SPRING-BATCH.md','spring/SPRING-BOOT-INTERNALS-PRODUCTION.md','spring/SPRING-PLATFORM-ADVANCED.md','spring/SPRING-REACTIVE.md',
];

const specific = new Map([
  ['architecture/NETWORKING-GRPC-SERVICE-MESH.md',['[gRPC core concepts](https://grpc.io/docs/what-is-grpc/core-concepts/)','[RFC 9113 — HTTP/2](https://www.rfc-editor.org/rfc/rfc9113)','[Kubernetes service networking](https://kubernetes.io/docs/concepts/services-networking/)']],
  ['data/DATA-PIPELINES-SEARCH-OPERATIONS.md',['[Apache Kafka design](https://kafka.apache.org/documentation/#design)','[Elasticsearch aliases](https://www.elastic.co/guide/en/elasticsearch/reference/current/aliases.html)','[OpenSearch index aliases](https://docs.opensearch.org/latest/im-plugin/index-alias/)']],
  ['data/database-selection/DATABASE-MIGRATIONS-OPERATIONS.md',['[PostgreSQL backup and restore](https://www.postgresql.org/docs/current/backup.html)','[PostgreSQL high availability](https://www.postgresql.org/docs/current/high-availability.html)','[Liquibase documentation](https://docs.liquibase.com/)']],
  ['data/hibernate/HIBERNATE-CACHING.md',['[Hibernate ORM caching](https://docs.jboss.org/hibernate/orm/current/userguide/html_single/Hibernate_User_Guide.html#caching)','[Jakarta Persistence specification](https://jakarta.ee/specifications/persistence/)']],
  ['development/REST-API-PRODUCTION-DESIGN.md',['[RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)','[RFC 9457 — Problem Details](https://www.rfc-editor.org/rfc/rfc9457)','[OpenAPI Specification](https://spec.openapis.org/oas/latest.html)']],
  ['java/JVM-PROFILING-GC-NATIVE.md',['[Java Flight Recorder](https://docs.oracle.com/en/java/javase/25/jfapi/)','[Java GC Tuning Guide](https://docs.oracle.com/en/java/javase/25/gctuning/)','[GraalVM Native Image](https://www.graalvm.org/latest/reference-manual/native-image/)']],
  ['spring/SPRING-BATCH.md',['[Spring Batch reference](https://docs.spring.io/spring-batch/reference/)','[Spring Batch API](https://docs.spring.io/spring-batch/docs/current/api/)']],
  ['spring/SPRING-REACTIVE.md',['[Spring WebFlux reference](https://docs.spring.io/spring-framework/reference/web/webflux.html)','[Project Reactor reference](https://projectreactor.io/docs/core/release/reference/)','[Reactive Streams specification](https://www.reactive-streams.org/)']],
  ['security/SUPPLY-CHAIN-PRIVACY.md',['[SLSA specification](https://slsa.dev/spec/)','[CycloneDX specification](https://cyclonedx.org/specification/overview/)','[NIST Privacy Framework](https://www.nist.gov/privacy-framework)']],
]);

function referencesFor(path) {
  if (specific.has(path)) return specific.get(path);
  if (path.startsWith('spring/')) return ref.spring;
  if (path.startsWith('java/')) return ref.java;
  if (path.startsWith('data/')) return ref.data;
  if (path.startsWith('reliability/')) return ref.reliability;
  if (path.startsWith('security/')) return ref.security;
  if (path.startsWith('operations/')) return ref.operations;
  if (path.startsWith('ai/')) return ref.ai;
  if (path.startsWith('development/')) return ref.architecture;
  if (path.startsWith('case-study/') || path.startsWith('reference/')) return [...ref.spring.slice(0, 1), ...ref.architecture.slice(0, 2)];
  return ref.architecture;
}

const next = new Map([
  ['ai/LANGCHAIN4J-DEEP-DIVE.md','[LangChain4j Tutorials](./LANGCHAIN4J-TUTORIALS.md)'],
  ['architecture/ARCHITECTURE-STYLES.md','[System Design Deep Dives](./SYSTEM-DESIGN-DEEP-DIVES.md)'],
  ['architecture/hld-lld/CAPACITY-PERFORMANCE-ESTIMATION.md','[End-To-End System Design Method](../system-design-deep-dives/END-TO-END-DESIGN-METHOD.md)'],
  ['architecture/SYSTEM-DESIGN-CONCEPTS.md','[System Design Deep Dives](./SYSTEM-DESIGN-DEEP-DIVES.md)'],
  ['architecture/SYSTEM-DESIGN-DEEP-DIVES.md','[End-To-End System Design Method](./system-design-deep-dives/END-TO-END-DESIGN-METHOD.md)'],
  ['data/database-selection/VECTOR-DATABASES.md','[Database Hands-On Labs](./DATABASE-HANDS-ON-LABS.md)'],
  ['data/DATABASE-SELECTION-GUIDE.md','[Database Quick Choice](./database-selection/DATABASE-QUICK-CHOICE.md)'],
  ['integration/MESSAGING-PLATFORM-SELECTION.md','[Apache Kafka](./APACHE-KAFKA.md)'],
  ['java/advanced-internals/NIO-PERFORMANCE-JMH.md','[JVM Profiling, Garbage Collection, And Native Images](../JVM-PROFILING-GC-NATIVE.md)'],
  ['java/ADVANCED-JAVA-INTERNALS.md','[JVM Execution Internals](./advanced-internals/JVM-EXECUTION-INTERNALS.md)'],
  ['java/JAVA-FUNDAMENTALS.md','[Java OOP](./JAVA-OOP.md)'],
  ['observability/MICROMETER-METRICS.md','[Prometheus](./PROMETHEUS.md)'],
  ['operations/DOCKER.md','[Docker Internals, Layers, And Storage](./DOCKER-INTERNALS-LAYERS-STORAGE.md)'],
  ['reference/LEARNING-PATH.mdx','[Shopverse Case Study](../case-study/SHOPVERSE.mdx)'],
  ['security/oauth/GOOGLE-AUTHENTICATION-SPRING.md','[OAuth2 And OIDC Flows](../spring-security/OAUTH2-OIDC-FLOWS.md)'],
  ['spring/SPRING-BATCH.md','[Spring Reactive And WebFlux](./SPRING-REACTIVE.md)'],
  ['spring/SPRING-BOOT-INTERNALS-PRODUCTION.md','[Container, Bean Factory, And Auto-Configuration](./internals-production/CONTAINER-BEANFACTORY-AUTOCONFIG.md)'],
  ['spring/SPRING-PLATFORM-ADVANCED.md','[Production Platform Engineering](../architecture/PRODUCTION-PLATFORM-ENGINEERING.md)'],
  ['spring/SPRING-REACTIVE.md','[Advanced Spring Platform Patterns](./SPRING-PLATFORM-ADVANCED.md)'],
]);

let changed = 0;
for (const path of referenceFiles) {
  const file = join(docs, path);
  let content = await readFile(file, 'utf8');
  if (!/## Official References/i.test(content)) {
    content = `${content.trimEnd()}\n\n## Official References\n\n${referencesFor(path).map((link) => `- ${link}`).join('\n')}\n`;
    await writeFile(file, content, 'utf8'); changed += 1;
  }
}
for (const [path, link] of next) {
  const file = join(docs, path);
  let content = await readFile(file, 'utf8');
  if (!/## Recommended Next/i.test(content)) {
    content = `${content.trimEnd()}\n\n## Recommended Next Page\n\nContinue with ${link}.\n`;
    await writeFile(file, content, 'utf8'); changed += 1;
  }
}
console.log(`Repaired ${changed} documentation reference/navigation gaps.`);
