---
title: Spring Boot Production Interview And Revision
description: Spring Boot rapid revision and lead-level scenario bank covering startup, conditions, configuration, web runtime, data, pools, Actuator, containers, incidents, and design trade-offs.
difficulty: Advanced
page_type: Interview
status: maintained
prerequisites: [Spring Boot architect path]
learning_objectives: [Revise Boot internals quickly, Structure lead-level answers, Diagnose production scenarios, Explain evidence and trade-offs]
technologies: [Spring Boot 4, Spring Framework 7, Actuator, JVM, Kubernetes]
last_reviewed: "2026-07-28"
scope: generic
owner: docs-spring
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Spring Boot Production Interview And Revision

## Answer Framework

For each question explain:

1. the owning runtime component;
2. the execution sequence and thread/transaction boundary;
3. what can fail;
4. which evidence distinguishes likely causes;
5. the safest mitigation and long-term correction;
6. the rejected alternative and trade-off.

## Startup Revision

```text
SpringApplication
  -> determine application type
  -> prepare Environment and ConfigData
  -> create ApplicationContext
  -> load definitions and auto-configurations
  -> invoke factory/bean post-processors
  -> instantiate non-lazy singletons and proxies
  -> start web server/lifecycle components
  -> runners
  -> readiness accepts traffic
```

Important distinctions:

- a bean definition is metadata; a bean instance is a created object;
- a `BeanFactoryPostProcessor` changes definitions before ordinary bean creation;
- a `BeanPostProcessor` participates in instance initialization and proxy creation;
- conditions decide whether configuration contributes definitions;
- readiness should change only when the application can serve safely.

## Scenario Bank

### Startup became 90 seconds after a release

Compare startup steps/JFR between good and bad versions. Inspect new classpath scanning,
DNS/network calls, migrations, eager clients, entropy/TLS, bean initialization and resource
pool timeouts. Do not add lazy initialization globally before identifying which startup
contract became slow.

### A bean is missing only in production

Inspect active profiles, property origins, classpath/dependency graph, component scan,
auto-configuration condition report and user-bean back-off. Compare the built artifact,
not only source.

### `@Transactional` does not roll back

Check proxy eligibility, self-invocation, method visibility, exception/rollback rules,
transaction manager, propagation and whether the side effect belongs to the same resource.
Kafka, database and remote API side effects are not one atomic transaction by default.

### Service is healthy but returns intermittent 503

Trace ingress/LB, readiness/endpoints, connector queue, executor, downstream pools,
timeouts/retries and dependency health. A health endpoint from localhost bypasses much of
the production request path.

### Memory grows in Kubernetes but heap looks stable

Inspect container working set, direct buffers, thread stacks, metaspace/class loaders,
native agents/libraries, mapped files and JVM Native Memory Tracking. Heap tuning alone can
make the failure worse.

### Graceful shutdown still loses Kafka/HTTP work

Verify readiness transition, endpoint propagation, server shutdown timeout, executor and
listener stop order, acknowledgment/transaction boundaries and platform termination grace.
Shutdown must stop admission before exhausting the completion budget.

### Adding retries caused an outage

Compute retry multiplication across gateway, client and consumer layers. Check whether
timeouts fit the end-to-end deadline and whether retries are bounded, jittered and limited
to idempotent transient operations.

## Top Questions

**What does `@SpringBootApplication` combine?** Configuration, component scanning and
auto-configuration enablement. Placement influences default scan/auto-configuration packages.

**How does Boot auto-configuration work?** It imports candidate configurations and applies
classpath, bean, property and environment conditions. Defaults commonly back off when the
application supplies an explicit bean.

**What is the difference between liveness and readiness?** Liveness asks whether restart
may repair the process; readiness asks whether it should receive traffic now.

**Why avoid field injection?** Constructor injection makes required dependencies explicit,
supports immutability and simplifies framework-independent tests.

**Why can `@Async` or `@Transactional` fail on self-invocation?** The internal `this` call
bypasses the proxy where advice is applied.

**How do you size a Boot service?** Start from workload/SLO, measure service and dependency
times, then bound connector/executor/connection pools and memory against actual CPU,
downstream capacity and container limits.

## Rapid Recall

| Topic | Recall |
|---|---|
| ConfigData | ordered external inputs with origin and activation |
| condition report | why auto-configuration matched or backed off |
| ApplicationContext | bean factory plus events/resources/environment/lifecycle |
| proxy | interception boundary; target self-call may bypass it |
| Actuator | operations endpoints, health contributors, metrics and lifecycle integration |
| availability | liveness and readiness application states |
| graceful shutdown | refuse admission, drain, bound completion, terminate |
| AOT/native | build-time analysis with dynamic-feature constraints |
| buildpack | builds OCI image from curated build/run lifecycle |

## Recommended Revision Route

Return to [Spring Boot Beginner-To-Architect Path](../SPRING-BOOT-ARCHITECT-PATH.md), then
practise explaining one startup incident, one request-latency incident and one failed
deployment with evidence.

## Official References

- [Spring Boot Reference Documentation](https://docs.spring.io/spring-boot/reference/)
- [Spring Boot Actuator](https://docs.spring.io/spring-boot/reference/actuator/)
