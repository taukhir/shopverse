---
title: Spring Infrastructure Diagnostic Route Map
description: Route map from Spring Boot infrastructure symptoms to canonical transaction, persistence, task, HTTP, messaging, observability, and reactive runtime guides.
difficulty: Intermediate
page_type: Learning Path
status: Generic
learning_objectives:
  - Identify which Spring infrastructure component owns a runtime symptom
  - Continue to one canonical diagnostic guide without duplicating implementation detail
technologies: [Spring Boot, Spring Framework]
last_reviewed: "2026-07-13"
---

# Spring Infrastructure Diagnostic Route Map

<DocLabels items={[
  {label: 'Diagnostic routes', tone: 'foundation'},
  {label: 'Spring infrastructure', tone: 'intermediate'},
]} />

This page preserves the existing infrastructure URL while routing each concern to
its canonical owner. Use the symptom and runtime boundary—not the annotation name—
to choose the next guide.

<DocCallout type="tip" title="Start with the owner of the constrained resource">
A transaction proxy, repository, scheduler, HTTP client, Kafka container, or
reactive event loop can surface the same timeout. Follow the component that owns
the connection, queue, thread, offset, or lifecycle state.
</DocCallout>

<TopicCards items={[
  {title: 'Transactions and proxies', href: '/spring/SPRING-PROXY-TRANSACTION-ARCHITECT', description: 'Diagnose interception, rollback, propagation, connection ownership, and async boundaries.', icon: 'route', tags: ['AOP', 'Transactions']},
  {title: 'JPA and Hibernate', href: '/spring/SPRING-JPA-HIBERNATE-ARCHITECT', description: 'Trace repository proxies, persistence context, flush, queries, locks, and pool use.', icon: 'layers', tags: ['JPA', 'Hibernate']},
  {title: 'Tasks and scheduling', href: '/spring/SPRING-ASYNC-PRODUCTION-ARCHITECT', description: 'Own @Async execution, scheduler timing, replica claims, fencing, and task shutdown.', icon: 'network', tags: ['Executors', 'Schedulers']},
  {title: 'Synchronous HTTP clients', href: '/spring/SPRING-OPENFEIGN', description: 'Inspect Feign proxies, LoadBalancer, pools, DNS, TLS, OAuth, retries, and AOT.', icon: 'code', tags: ['OpenFeign', 'HTTP']},
  {title: 'Kafka runtime', href: '/spring/SPRING-KAFKA', description: 'Own listener containers, concurrency, offsets, retries, DLT, idempotency, and recovery.', icon: 'boxes', tags: ['Kafka', 'Messaging']},
  {title: 'Reactive runtime', href: '/spring/SPRING-REACTIVE', description: 'Diagnose event loops, demand, connection pools, blocking, context, and cancellation.', icon: 'gauge', tags: ['WebFlux', 'Reactor']},
]} />

## Additional Routes

| Concern | Canonical guide |
|---|---|
| container startup, bean creation, and auto-configuration | [Spring Container Runtime For Architects](../../spring/SPRING-CONTAINER-ARCHITECT.md) |
| Liquibase migration ownership | [Liquibase](../../data/LIQUIBASE-GENERIC.md) |
| cache proxy and production policy | [Spring Cache](../../spring/SPRING-CACHE.md) |
| Actuator, readiness, drain, and incidents | [Production Lifecycle Runbook](../../spring/internals-production/PRODUCTION-LIFECYCLE.md) |
| Config Client and discovery | [Spring Ecosystem](../../spring/SPRING-ECOSYSTEM.md) |
| metrics and tracing | [MDC And Correlation](../../observability/MDC-CORRELATION-TRACING.md) and [Micrometer Metrics](../../observability/MICROMETER-METRICS.md) |

## Recommended Next

Return to [Spring Boot Internals](../SPRING-BOOT-INTERNALS.md) or open the route
whose evidence matches the current failure.
