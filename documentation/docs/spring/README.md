---
title: Spring And Spring Boot Learning Guide
description: Dependency-ordered route through Spring fundamentals, runtime internals, data, integration, testing and production architecture.
difficulty: Beginner
page_type: Learning Path
status: Shopverse
prerequisites: [Core Java, HTTP and SQL fundamentals]
learning_objectives: [Choose the correct Spring learning route, Trace framework abstractions to runtime boundaries, Apply concepts to Shopverse without duplicating implementation guides]
technologies: [Spring Framework 7, Spring Boot 4, Spring Cloud, Spring Data JPA, Spring Data Cassandra, Spring Security]
last_reviewed: "2026-07-23"
---

# Spring And Spring Boot Learning Guide

<DocLabels items={[
  {label: 'Beginner to architect', tone: 'foundation'},
  {label: 'Spring Boot 4', tone: 'intermediate'},
  {label: 'Production depth', tone: 'production'},
  {label: 'Shopverse examples', tone: 'shopverse'},
]} />

This is the canonical Spring learning route. Generic mechanics live in this track;
Shopverse pages show repository-specific implementation and link back here instead of
copying the same explanations.

After completing the route, use the
[Spring And Spring Boot Revision Sheet](./SPRING-REVISION-SHEET.md) before the
[Spring Architect Interview Workbook](./SPRING-ARCHITECT-INTERVIEW-WORKBOOK.md).

```mermaid
flowchart LR
    Core["Container and configuration"] --> Proxy["AOP and transactions"]
    Proxy --> Web["MVC, REST and security"]
    Web --> Data["Spring Data Commons and stores"]
    Data --> Integration["Async, Kafka, Batch and clients"]
    Integration --> Production["Testing, observability and operations"]
    Production --> Architect["Lead and architect decisions"]
```

## Choose A Track

<TopicCards items={[
  {
    title: 'Spring Fundamentals',
    href: './SPRING-ECOSYSTEM',
    description: 'Understand the framework, Boot, web, data, security and cloud modules.',
    icon: 'book',
    tags: ['Start here', 'Foundation'],
  },
  {
    title: 'Boot 4 And Framework 7',
    href: './SPRING-BOOT-4-FRAMEWORK-7',
    description: 'Use the correct generation, starter, Jakarta and migration assumptions.',
    icon: 'route',
    tags: ['Compatibility', 'Migration'],
  },
  {
    title: 'Lead And Architect Path',
    href: './SPRING-ARCHITECT-PATH',
    description: 'Trace proxies, threads, transactions, persistence and production lifecycle.',
    icon: 'layers',
    tags: ['Advanced', 'Runtime'],
  },
  {
    title: 'Spring Cloud Architect Path',
    href: './SPRING-CLOUD-ARCHITECT-PATH',
    description: 'Own config, discovery, clients, load balancing, resilience, gateway, Bus, security and operations.',
    icon: 'network',
    tags: ['Distributed systems', 'Production'],
  },
  {
    title: 'REST And MVC',
    href: '../development/SPRING-REST-APIS',
    description: 'Design HTTP contracts, validation, errors, idempotency and clients.',
    icon: 'route',
    tags: ['HTTP', 'APIs'],
  },
  {
    title: 'Spring Data Architect Path',
    href: './SPRING-DATA-ARCHITECT-PATH',
    description: 'Trace Commons internals and master JPA, JDBC, R2DBC, Cassandra, MongoDB, Redis and Elasticsearch.',
    icon: 'boxes',
    tags: ['SQL and NoSQL', 'Persistence'],
  },
  {
    title: 'Kafka And Integration',
    href: './SPRING-KAFKA',
    description: 'Own delivery, retries, DLTs, idempotency, ordering and capacity.',
    icon: 'network',
    tags: ['Messaging', 'Reliability'],
  },
  {
    title: 'Testing And Quality',
    href: './SPRING-BOOT-TESTING',
    description: 'Choose unit, slice, integration, contract and system evidence.',
    icon: 'experiment',
    tags: ['JUnit', 'Testcontainers'],
  },
  {
    title: 'TDD And BDD Engineering',
    href: './TDD-BDD-ENGINEERING-PATH',
    description: 'Drive design from examples and apply behavior specifications across Spring production boundaries.',
    icon: 'experiment',
    tags: ['TDD', 'BDD'],
  },
  {
    title: 'Interview Preparation',
    href: './SPRING-INTERVIEW-PREPARATION',
    description: 'Practise expandable answers from fundamentals through architecture.',
    icon: 'brain',
    tags: ['Questions', 'Scenarios'],
  },
  {
    title: 'Architect Hands-On Labs',
    href: './architect-labs/',
    description: 'Diagnose incidents and prove capacity, transactions, replay and consistency controls.',
    icon: 'experiment',
    tags: ['Executable', 'Production'],
  },
  {
    title: 'Technology Decisions',
    href: './decisions/',
    description: 'Choose web, messaging, persistence, caching and HTTP client strategies.',
    icon: 'layers',
    tags: ['ADR', 'Migration'],
  },
]} />

## Step-By-Step Learning Order

| Stage | Outcome | Entry page |
|---:|---|---|
| 1 | Distinguish Framework, Boot, Data, Security and Cloud | [Spring Ecosystem](./SPRING-ECOSYSTEM.md) |
| 2 | Explain startup, bean creation and configuration | [Spring Boot Internals](../development/SPRING-BOOT-INTERNALS.md) |
| 3 | Trace interception and transaction behavior | [Proxy And Transaction Internals](./SPRING-PROXY-TRANSACTION-ARCHITECT.md) |
| 4 | Trace filters, dispatch, validation and serialization | [MVC And Security Runtime](./SPRING-MVC-SECURITY-RUNTIME.md) |
| 5 | Trace repositories and select relational or NoSQL persistence deliberately | [Spring Data Architect Path](./SPRING-DATA-ARCHITECT-PATH.md) |
| 6 | Design JPA persistence context, fetch and concurrency behavior | [JPA And Hibernate Runtime](./SPRING-JPA-HIBERNATE-ARCHITECT.md) |
| 7 | Apply query-first distributed persistence without JPA assumptions | [Spring Data Cassandra](./SPRING-DATA-CASSANDRA.md) |
| 8 | Select and operate distributed configuration, discovery, clients and gateway | [Spring Cloud Architect Path](./SPRING-CLOUD-ARCHITECT-PATH.md) |
| 9 | Bound remote, async, broker and batch work | [Async And Production Lifecycle](./SPRING-ASYNC-PRODUCTION-ARCHITECT.md) |
| 10 | Drive behavior and prove production boundaries | [TDD And BDD Engineering](./TDD-BDD-ENGINEERING-PATH.md) |
| 11 | Prove runtime behavior with operational labs | [Spring Internals Labs](./SPRING-INTERNALS-LABS.md) |

## Related Spring Portfolio Tracks

Some portfolio projects already have a stronger canonical home elsewhere in the
documentation. They are linked here instead of being copied into the core track.

| Portfolio area | Canonical guide | Why it is separate |
|---|---|---|
| Spring Security | [Spring Security](../security/SPRING-SECURITY-GENERIC.md) | authentication, authorization, OAuth2/OIDC and threat controls form a full security track |
| Spring Cloud Gateway | [Advanced Gateway](../development/SPRING-CLOUD-GATEWAY-ADVANCED.md) | edge routing, filters, rate limits and reactive capacity belong to gateway architecture |
| Spring Cloud Stream | [Event Streaming Application Path](../integration/EVENT-STREAMING-APPLICATION-PATH.md) | binding, binder, Kafka Streams and Connect concepts have a dedicated event-streaming path |
| Spring AI | [Spring AI](../ai/SPRING-AI-UMBRELLA.md) | model clients, retrieval, tools and MCP have their own fast-moving compatibility surface |
| Modulith, native, streaming and multi-tenancy | [Advanced Spring Platform Patterns](./SPRING-PLATFORM-ADVANCED.md) | architect decisions are driven by deployment and ownership trade-offs |

<DocCallout type="shopverse" title="Keep examples and implementation claims separate">

Spring pages may use Shopverse order, inventory, payment and identity scenarios. Claims
about what the repository currently implements must link to a platform, case-study or
reliability page, because those pages are maintained with the code.

</DocCallout>

## Shopverse Implementation Links

- [Platform Kafka Parsing](../platform/KAFKA-PARSING.md)
- [Platform Kafka Recovery Starter](../platform/KAFKA-RECOVERY-STARTER.md)
- [Platform Security Starter](../platform/SECURITY-STARTER.md)
- [Runtime Reliability Problems](../reliability/problems/RUNTIME-RELIABILITY-PROBLEMS.md)
- [Spring Security Track](../security/SPRING-SECURITY-GENERIC.md)

## Recommended Next

Start with [Spring Ecosystem](./SPRING-ECOSYSTEM.md).
