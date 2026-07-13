---
title: Documentation Structure
sidebar_position: 2
status: "maintained"
last_reviewed: "2026-07-13"
---

# Documentation Structure

This documentation is both a Shopverse case study and a backend engineering
reference. Keep those two purposes separate:

```text
Generic study material:
  explain the concept, tradeoffs, examples, and interview points.

Shopverse case study:
  explain where the concept is implemented, which services own it,
  which classes/configuration files are involved, and how to demo it.
```

## Current Top-Level Structure

| Section | Purpose |
|---|---|
| Engineering Foundations | design principles, patterns, HLD/LLD, REST basics, Git |
| Java Fundamentals | Java language, collections, streams, OOP, concurrency |
| Spring Ecosystem | Spring Boot, REST APIs, validation, transactions, JPA, Kafka, testing |
| Data And Persistence | database engineering, Hibernate, Liquibase, caching |
| Microservices And Distributed Systems | service boundaries, discovery, gateway, consistency, SAGA, outbox, reliability |
| Security | generic Spring Security and authentication material |
| Logging And Observability | logging, MDC, metrics, Prometheus, Loki, Promtail, Grafana |
| Delivery, Containers And CI/CD | Docker, Jenkins, GitHub Actions, deployment, Docusaurus |
| Shopverse Case Study | project-specific architecture, APIs, SAGA, observability, testing, and problem fixes |
| Platform Infrastructure | shared infrastructure modules extracted from duplicated service code |
| Problems And Solutions | problem statements, measured fixes, and verification results |

## Page Placement Rules

| Content type | Place it here |
|---|---|
| Concept explanation | generic section such as Spring, Data, Microservices, Security, or Observability |
| Shopverse code flow | Shopverse Case Study |
| Commands for this project | Shopverse Case Study or Operations |
| Commands that apply to any project | generic Operations page |
| Interview questions | relevant generic section or Reference |
| Problem statement and fix from this POC | `reliability/PROBLEMS-AND-SOLUTIONS.md` |
| Shared platform starter usage | `platform/README.md` and focused platform module pages |
| Optimization measurements and command output | `reliability/problems/optimization/*` |
| API request/response examples | `development/API-GUIDE.md` or service README |

## Length Guidelines

Long pages are acceptable when they are searchable reference pages, but they
become hard to read when they mix multiple unrelated topics.

| Page length | Action |
|---|---|
| under 400 lines | normally fine |
| 400-800 lines | add a clear table of contents or split if topics are unrelated |
| 800-1200 lines | consider splitting into focused pages |
| over 1200 lines | split when link migration is manageable |

The original oversized reference pages have already been split into focused
child pages:

| Original hub | New child-page group |
|---|---|
| `SPRING-DATA-JPA.md` | `spring/jpa/*` |
| `PROBLEMS-AND-SOLUTIONS.md` | `reliability/problems/*` |
| `SPRING-BOOT-INTERNALS.md` | `development/spring-boot-internals/*` |
| `SPRING-BOOT-TESTING.md` | `spring/testing/*` |
| `HIBERNATE.md` | `data/hibernate/*` |

Current remaining large pages that may be split later:

| Page | Reason | Suggested split |
|---|---|---|
| `COMPLETE-DEMO.mdx` | complete end-to-end project demo | keep as one walkthrough unless it becomes hard to follow |
| `DOCUSAURUS.md` | setup, customization, operations, and deployment | split only if deployment details grow |
| `API-GATEWAY-GENERIC.md` | gateway theory, filter chain, metrics, and load-balancing references | split only if gateway implementation details grow |
| `MICROMETER-METRICS.md` | metric concepts, counters, timers, Prometheus, and examples | split only if dashboards/alerts become large |

Additional oversized pages already split in the second pass:

| Original hub | New child-page group |
|---|---|
| `SPRING-SECURITY-GENERIC.md` | `security/spring-security/*` |
| `SPRING-KAFKA.md` | `spring/kafka/*` |
| `SPRING-REST-APIS.md` | `development/spring-rest/*` |
| `RUNTIME-RELIABILITY-PROBLEMS.md` | `reliability/problems/runtime/*` |
| `HLD-LLD.md` | `architecture/hld-lld/*` |

## Split Strategy

When splitting a long page:

1. Create the new focused page.
2. Move one complete section at a time.
3. Leave a short summary and link in the original page.
4. Update all relative links.
5. Run the Docusaurus build to catch broken links and anchors.
6. Avoid changing filenames unless the page ID is clearly wrong.

This keeps existing links stable while gradually improving readability.

## Naming Guidelines

Use names that describe the topic directly:

| Prefer | Avoid |
|---|---|
| `Microservices Fundamentals` | vague "generic" names in visible titles |
| `Spring Feign Client` | only "Feign" without Spring context |
| `Kafka Fundamentals` | mixing Apache Kafka and Spring Kafka in one title |
| `Transactional Outbox Pattern` | "Outbox notes" |
| `Shopverse SAGA Implementation` | mixing generic SAGA theory and project code flow |

File names can remain stable for link safety, but visible `title` values should
be reader-friendly.

## Cross-Link Rule

Every major topic should link both ways:

```text
Generic concept page
  -> Shopverse implementation page

Shopverse implementation page
  -> Generic concept page
```

Example:

- [Transactional outbox pattern](../reliability/OUTBOX-PATTERN.md)
- [Shopverse SAGA and outbox implementation](../reliability/SAGA-OUTBOX.md)

## Current Organization Pass

The docs are organized around two reader modes:

| Reader mode | Use |
|---|---|
| Learning mode | Generic Java, Spring, data, security, operations, and distributed-system pages. |
| Shopverse mode | Case study, platform infrastructure, problem/solution pages, and implementation guides. |

When adding new content, avoid putting a full Shopverse implementation inside a
generic learning page. Add a short "Shopverse link" section that points to the
case-study or platform page instead.

When adding a new problem fix, place the detailed command output and
before/after numbers under `reliability/problems/`, then link to it from the
generic operations or architecture page.

## Current Maintenance Guidance

The major restructuring work is complete. The documentation is intentionally
hub-based:

- large mixed-topic pages were split into focused child pages;
- [learning path](LEARNING-PATH.mdx) now contains quick tracks;
- the home page contains quick routes;
- major reference pages now start with short "read this page if..." summaries;
- generic concept pages and Shopverse implementation pages are cross-linked.

Do not split pages only because they are a few hundred lines long. Split only
when a page mixes unrelated reader goals.

Future split candidates are conditional:

| Page | Split only when |
|---|---|
| `COMPLETE-DEMO.mdx` | the demo grows beyond one clear walkthrough |
| `API-GATEWAY-GENERIC.md` | gateway theory and implementation details start competing |
| `MICROMETER-METRICS.md` | dashboard, alert, and query examples become large enough to distract from fundamentals |

Ongoing maintenance rules:

1. Keep quick tracks updated when new major topics are added.
2. Add "read this page if..." summaries to any new large reference page.
3. Cross-link new generic pages to Shopverse implementation pages.
4. Avoid splitting pages below roughly 700 lines unless they mix unrelated
   subjects.
