---
title: Spring Boot Operations Diagnostic Route Map
description: Route map for Spring Boot startup, memory, resource capacity, readiness, graceful drain, observability, and incident diagnostics.
difficulty: Intermediate
page_type: Learning Path
status: Generic
learning_objectives:
  - Route an operational symptom to its canonical production guide
  - Preserve the existing operations URL without duplicating tuning and lifecycle guidance
technologies: [Spring Boot, Actuator, Micrometer, JVM]
last_reviewed: "2026-07-13"
---

# Spring Boot Operations Diagnostic Route Map

<DocLabels items={[
  {label: 'Operations routes', tone: 'foundation'},
  {label: 'Production diagnostics', tone: 'production'},
]} />

Use this compatibility page to select the canonical owner for an operational
symptom. The detailed startup, memory, capacity, lifecycle, and incident procedures
are intentionally maintained once.

<DocCallout type="production" title="Capture evidence before changing limits">
Record workload, latency, errors, CPU, memory, queues, pool acquisition, lifecycle
state, and the deployed configuration. Changing several flags or pools destroys
the baseline and can move the failure into another resource.
</DocCallout>

<TopicCards items={[
  {title: 'Production tuning path', href: '/development/spring-boot-internals/PRODUCTION-TUNING', description: 'Start with the measurement workflow and choose the limiting resource.', icon: 'route', tags: ['SLO', 'Baseline']},
  {title: 'Startup and memory', href: '/spring/production/STARTUP-JVM-CONTAINER-MEMORY', description: 'Diagnose startup phases, JVM/container memory, GC, native usage, and OOM evidence.', icon: 'gauge', tags: ['JVM', 'Memory']},
  {title: 'Resource capacity', href: '/spring/production/RESOURCE-POOL-CONCURRENCY-CAPACITY', description: 'Size executors, database and HTTP pools, Kafka concurrency, and admission from workload.', icon: 'network', tags: ['Pools', 'Capacity']},
  {title: 'Lifecycle and incidents', href: '/spring/internals-production/PRODUCTION-LIFECYCLE', description: 'Operate readiness, admission, graceful drain, forced recovery, observability, and incidents.', icon: 'security', tags: ['Runbook', 'Recovery']},
]} />

## Fast Symptom Routing

| Symptom | Start here |
|---|---|
| context starts slowly or first request pays initialization cost | startup and memory |
| container OOM with free Java heap | startup and memory |
| Hikari pending, HTTP pool wait, executor queue, or Kafka lag | resource capacity |
| deployment drops work or never terminates | lifecycle and incidents |
| annotation task overlaps or runs on the caller | [Task Execution And Scheduling](../../spring/SPRING-ASYNC-PRODUCTION-ARCHITECT.md) |

## Recommended Next

Start with [Spring Boot Production Tuning](./PRODUCTION-TUNING.md).
