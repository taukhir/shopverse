---
title: Spring Boot Production Incident Playbook
description: Evidence-first diagnosis for startup, beans, proxies, transactions, HTTP, pools, dependencies, memory, CPU, Actuator, shutdown, AOT, and deployment incidents.
difficulty: Architect
page_type: Guide
status: maintained
prerequisites: [Spring Boot runtime, Java diagnostics, Observability]
learning_objectives: [Locate the owning Spring runtime, Contain incidents without data loss, Prove recovery and prevention]
technologies: [Spring Boot 4, Spring Framework 7, Actuator, JFR, Kubernetes]
last_reviewed: "2026-07-28"
scope: generic
owner: docs-spring
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Spring Boot Production Incident Playbook

## Universal Sequence

1. establish customer impact, affected versions/instances and start time;
2. stop concurrent deployments/config changes;
3. preserve logs, metrics, traces, Kubernetes events, startup/condition report and
   JVM evidence;
4. identify the owning queue, thread, proxy, transaction, pool or dependency;
5. contain load/retry/background work without advancing unsafe business state;
6. correct through a canary and explicit rollback;
7. reconcile requests, events, outboxes, Sagas and external effects;
8. prove SLO recovery and record prevention.

## Startup Slow Or Failing

Compare `application.started.time`, `application.ready.time`, startup steps and
JFR between releases. Inspect classpath/dependencies, ConfigData, condition
outcomes, bean instantiation, migrations, DNS/secret/config services, entropy,
filesystem and container CPU throttling.

Do not mark readiness before mandatory migrations, schema compatibility and
critical initialization are complete. Avoid remote calls in constructors and
unbounded startup runners.

## Bean Missing Or Unexpected

Capture active profiles, exact property origins, condition evaluation, bean
definitions, component scan/import boundaries and auto-configuration back-off.
Check whether another user bean caused `@ConditionalOnMissingBean` to back off,
whether a profile/property differs, or whether AOT fixed assumptions at build time.

For duplicate/ambiguous beans, inspect type/generic resolution, qualifiers,
primary/fallback semantics and configuration imports. Do not “fix” ambiguity with
an arbitrary `@Primary` without defining ownership.

## Circular Dependency Or Early Reference

Draw constructor/property dependency edges and identify the mixed responsibility.
Refactor boundaries or introduce an explicit coordinator/event. Lazy references
can defer the cycle but also move failure to runtime. Early proxy references make
identity and lifecycle harder to reason about.

## Advice Does Not Execute

For `@Transactional`, `@Async`, `@Cacheable`, retry or security:

- verify the object is a Spring-managed proxy;
- inspect proxy type and exposed method;
- check external versus self invocation;
- check private/static/final method/class constraints;
- verify annotation precedence and enabling infrastructure;
- ensure exceptions are not caught before advice observes them;
- verify thread/context boundaries.

Refactor advised behavior behind another bean or use an explicit programmatic
boundary. Never call an annotated method directly with `new` and expect advice.

## Transaction Did Not Roll Back

Check whether a transaction actually started, correct transaction manager was
selected, the call crossed the proxy, the exception escaped, rollback rules match,
and an async/new thread did not leave the transaction context. Verify commit in
database evidence, not only logs.

For partial DB/Kafka or DB/HTTP outcomes, use outbox/idempotency/reconciliation;
`@Transactional` cannot roll back an external system.

## Intermittent 503 Or High Latency

Follow one trace through gateway/load balancer, server accept/backlog, servlet
thread/event loop, executor, Hikari/client pool, query/remote call and response
serialization. Compare request/completion rate and queue age.

Contain by bounding/reducing concurrency, disabling retry amplification, shedding
expired/optional work and protecting dependency capacity. Increasing every pool
is not a diagnosis.

## Hikari Connection Exhaustion

Inspect pending acquisition, active/idle, usage duration, transaction duration,
database sessions/locks/queries and caller workloads. Find leaked connections,
slow queries, N+1, remote calls inside transactions and background competition.
Restore gradually; a larger pool can overload the database.

## CPU Or Memory Incident

Use the [Java Performance Diagnostics](../../java/JAVA-PERFORMANCE-DIAGNOSTICS-TOOLING.md).
Correlate per-thread CPU, JFR, allocations, GC, heap/native memory, direct buffers,
metaspace, thread stacks and cgroup throttling/events. Secure diagnostic artifacts.

If Kubernetes reports `OOMKilled` but heap was below maximum, compare total RSS
with the container limit and inspect native categories. Do not merely increase
heap inside the same limit.

## Downstream Failure And Retry Cascade

Identify every retry layer and total attempts, remaining deadline, idempotency,
breaker state, pool saturation and tenant share. Stop retry/replay/background
amplification, apply admission control and recover with a gradual canary. Reconcile
ambiguous writes before repeating them.

## Conversion Or Serialization Failure

Capture content type, negotiated converter, safe schema/payload metadata, producer
version and exception. Distinguish malformed input, unsupported media type,
validation, incompatible schema and application defects. Bound body sizes and
avoid logging secrets. Kafka deserialization failures may occur before listener
invocation and require deserializer-aware recovery.

## Actuator Says Healthy But Service Is Not

Health may prove only process/component checks, not customer success or capacity.
Compare business SLI, request errors/latency, saturation, queue age and dependency
outcomes. Liveness should answer whether restart can help; readiness should answer
whether this instance can safely receive traffic.

## Graceful Shutdown Loses Work

Build a termination timeline: readiness removal propagation, in-flight requests,
Kafka polls/commits, schedulers, async executors, transactions, pool close and
forced kill. Ensure platform grace exceeds measured drain. Make unfinished work
idempotently replayable; use outbox for committed publication intent.

## AOT Or Native-Only Failure

Compare build-time classpath/profiles/properties with runtime expectations. Inspect
reflection, resources, serialization, proxies, dynamic class generation, JNI and
runtime hints. Reproduce using the exact artifact/image. Maintain a JVM-mode
rollback unless native behavior is independently verified.

## Evidence Package

Retain deployment/config diff, image digest, condition/startup report, Actuator
metrics, traces, structured logs, thread/JFR/GC evidence, cgroup/Kubernetes events,
DB/dependency evidence, containment actions, reconciliation results and
before/after load-test report.

## Interview Answer Framework

State symptom and scope, locate the runtime owner, name the failure boundary,
collect discriminating evidence, contain without corrupting state, recover and
reconcile, prove SLO restoration, then prevent recurrence with a bound/test/alert.

## Official References

- [Spring Boot Actuator endpoints](https://docs.spring.io/spring-boot/reference/actuator/endpoints.html)
- [Spring Boot startup endpoint](https://docs.spring.io/spring-boot/api/rest/actuator/startup.html)
- [Spring AOP proxying](https://docs.spring.io/spring-framework/reference/core/aop/proxying.html)
- [Spring transaction management](https://docs.spring.io/spring-framework/reference/data-access/transaction.html)

## Recommended Next

Revise with [Spring Boot Production Interview And Revision](./SPRING-BOOT-PRODUCTION-INTERVIEW-REVISION.md).

