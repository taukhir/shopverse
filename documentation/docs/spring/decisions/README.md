---
title: Spring Technology Decision Guides
description: Evidence-based choices and migration paths for Spring web, messaging, persistence, caching, and HTTP clients.
difficulty: Advanced
page_type: Reference
status: Generic
prerequisites: [Spring Boot fundamentals, Distributed systems]
learning_objectives: [Choose from workload constraints, Identify avoidance signals, Plan reversible migrations]
technologies: [Spring Boot 4, Spring Framework 7, Spring Kafka, Spring Data]
last_reviewed: "2026-07-13"
---

# Spring Technology Decision Guides

<DocLabels items={[
  {label: 'Architecture decisions', tone: 'advanced'},
  {label: 'Trade-offs', tone: 'production'},
  {label: 'Migration paths', tone: 'shopverse'},
]} />

These guides turn “which technology is better?” into a constrained decision.
Each page states when to use an option, when to avoid it, evidence to collect,
and how to migrate without rewriting the whole service.

<TopicCards items={[
  {title: 'MVC Versus WebFlux', href: './MVC-VS-WEBFLUX', description: 'Choose an execution model from dependency and concurrency evidence.', icon: 'route', tags: ['HTTP', 'Runtime']},
  {title: 'Kafka Versus Synchronous Calls', href: './KAFKA-VS-SYNCHRONOUS', description: 'Choose temporal coupling, acknowledgement and recovery semantics.', icon: 'network', tags: ['Messaging', 'Consistency']},
  {title: 'JPA Versus JDBC', href: './JPA-VS-JDBC', description: 'Choose aggregate productivity or explicit SQL control per workload.', icon: 'boxes', tags: ['Persistence', 'SQL']},
  {title: 'Cache-Aside Versus Write-Through', href: './CACHE-ASIDE-VS-WRITE-THROUGH', description: 'Choose ownership, stale windows and failure recovery.', icon: 'layers', tags: ['Cache', 'Data']},
  {title: 'Feign Versus HTTP Service Clients', href: './FEIGN-VS-HTTP-SERVICE-CLIENTS', description: 'Choose a declarative HTTP client and an incremental migration route.', icon: 'code', tags: ['Spring 7', 'Clients']},
]} />

## Decision Record Template

Capture context, workload shape, options, decision, rejected alternatives,
consequences, operational controls, migration/rollback plan, and a review date.
Benchmarks and failure tests belong with the ADR.

<DocCallout type="tip" title="Choose per boundary, not per organization">

A service can use MVC for inbound HTTP, JDBC for one reporting query, JPA for
aggregates, Kafka for durable facts, and a synchronous client for a query. A
single platform-wide answer usually ignores different contracts.

</DocCallout>

## Official References

- [Spring Framework reference](https://docs.spring.io/spring-framework/reference/)
- [Spring Boot reference](https://docs.spring.io/spring-boot/reference/)

## Recommended Next

Choose the page matching an active design decision and record evidence before
selecting the option.
