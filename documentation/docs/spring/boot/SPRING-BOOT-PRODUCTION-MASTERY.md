---
title: Spring Boot Production Mastery
description: Complete lead and architect coverage map for startup, auto-configuration, beans, proxies, web runtimes, transactions, pools, configuration, Actuator, shutdown, AOT, containers, and incidents.
difficulty: Architect
page_type: Learning Path
status: maintained
prerequisites: [Core Spring, Spring Boot, Java, HTTP, SQL]
learning_objectives: [Cover every Spring Boot production competency, Trace ownership across runtime layers, Diagnose and defend production decisions]
technologies: [Spring Boot 4, Spring Framework 7, Actuator, Micrometer, Docker, Kubernetes]
last_reviewed: "2026-07-28"
scope: generic
owner: docs-spring
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Spring Boot Production Mastery

Use the [Spring Boot Architect Path](../SPRING-BOOT-ARCHITECT-PATH.md) for study
order. This page is the production completeness index.

## Startup And Application Context

| Required coverage | Canonical material |
|---|---|
| `main` to ready state, environment and context creation | [Startup And Auto-Configuration](../../development/spring-boot-internals/STARTUP-AUTOCONFIGURATION.md) |
| initializers, listeners, runners and startup extension points | [Startup Extension Points](../../development/spring-boot-internals/STARTUP-EXTENSION-POINTS.md) |
| bean definitions, factory/post-processors, creation and destruction | [Spring Container Architect](../SPRING-CONTAINER-ARCHITECT.md) |
| injection resolution, scopes, circular dependencies and early references | [Dependency Injection And Bean Resolution](../../development/spring-boot-internals/DEPENDENCY-INJECTION-BEAN-RESOLUTION.md) |
| bean/static/thread-local retention and class-loader leaks | [Bean Lifecycle, GC And Static References](../../development/spring-boot-internals/SPRING-BEAN-LIFECYCLE-GC-STATIC-REFERENCES.md) |

Explain the difference between “process started,” `ApplicationStartedEvent`,
runner completion, `ApplicationReadyEvent`, liveness and readiness.

## Auto-Configuration And Configuration

- conditional imports, back-off, ordering, starters, failure analysis and custom
  auto-configuration: [Auto-Configuration And Starters](./SPRING-BOOT-AUTOCONFIGURATION-STARTERS.md);
- ConfigData, property-source precedence, profiles, environment variables,
  typed binding, validation and secrets:
  [Configuration And Environments](./SPRING-BOOT-CONFIGURATION-ENVIRONMENTS.md).

Production diagnosis must identify the exact property source and condition
outcome—not merely print a guessed value. Protect `/actuator/env`, config props and
condition reports because they can expose sensitive or architectural data.

## Proxies And Annotation Runtime

`@Transactional`, `@Async`, `@Cacheable`, retry and method security commonly use
proxy interception. External calls through the proxy can be advised; self
invocation calls the target directly and bypasses proxy advice. Private methods
cannot be overridden/advised by subclass proxies, static calls have no instance
proxy dispatch, and final methods/classes constrain subclass proxying.

- [Proxy And Transaction Architect Guide](../SPRING-PROXY-TRANSACTION-ARCHITECT.md)
- [AOP Transaction Internals](../internals-production/AOP-TRANSACTION-INTERNALS.md)
- [Spring Annotation Internals](../SPRING-BOOT-ANNOTATIONS-PATH.md)

Prefer moving the advised operation to a separate collaborating bean or using an
explicit `TransactionTemplate` boundary instead of self-injection tricks.

## Transactions And Data

Cover transaction managers, propagation, isolation, rollback rules, checked
exceptions, read-only behavior, timeouts, synchronization, deadlocks, private/
static/self-invocation limits, programmatic boundaries, JPA dirty checking,
locking and database/Kafka dual writes:

- [Spring Transactions](../SPRING-TRANSACTIONS.md)
- [Transaction Proxy Boundary Design](../transactions/SPRING-TRANSACTION-PROXY-BOUNDARY-DESIGN.md)
- [JPA Transactions And Locking](../jpa/JPA-TRANSACTIONS-LOCKING.md)
- [Spring Data Architect Path](../SPRING-DATA-ARCHITECT-PATH.md)

Never hold a database transaction open across an uncontrolled remote call unless
the locking, timeout and failure consequences are explicitly accepted.

## Web Runtime

Spring MVC uses a servlet container request/thread model; WebFlux uses a reactive
event-loop model and requires non-blocking paths. Embedded Tomcat, Jetty and Netty
are replaceable runtime choices, not equivalent tuning profiles.

- [Servlet And MVC Request Lifecycle](../web/SERVLET-MVC-REQUEST-LIFECYCLE.md)
- [Web MVC, Servlet And Filters](../../development/spring-boot-internals/WEB-MVC-SERVLET-FILTERS.md)
- [MVC Versus WebFlux](../decisions/MVC-VS-WEBFLUX.md)
- [HTTP Conversion And Jackson](../web/HTTP-MESSAGE-CONVERSION-JACKSON.md)

Trace socket accept/backlog, server connection, request thread/event loop,
filters, security, dispatcher, controller, transaction, database/client pool,
serialization and response write.

## Resource Pools And Performance

[Spring Boot Runtime Performance](./SPRING-BOOT-RUNTIME-PERFORMANCE.md) connects
server threads, executors, HikariCP, HTTP clients, Kafka, schedules, JVM, cgroups
and downstream capacity. The detailed quantitative guide is
[Resource Pool Concurrency And Capacity](../production/RESOURCE-POOL-CONCURRENCY-CAPACITY.md).

## Actuator And Observability

[Spring Boot Actuator](../../operations/SPRING-BOOT-ACTUATOR.md) covers endpoints,
health groups, liveness/readiness, Micrometer, caches, diagnostics and security.
Monitor customer SLIs plus server requests, executor/pool saturation, JVM/GC,
dependencies, startup/ready time and business workflow age.

Do not expose sensitive Actuator endpoints publicly. Liveness must not depend on
remote services and create restart cascades; readiness may remove a pod when it
cannot safely serve.

## Packaging, AOT And Containers

Executable/layered jars, Buildpacks, Dockerfiles, AOT processing, native images,
runtime hints, fixed build-time assumptions and Kubernetes lifecycle:

- [Packaging, AOT And Containers](./SPRING-BOOT-PACKAGING-AOT-CONTAINERS.md)
- [Startup, JVM And Container Memory](../production/STARTUP-JVM-CONTAINER-MEMORY.md)
- [Java Container Resource Limits](../../java/JAVA-CONTAINERS-RESOURCE-LIMITS.md)

AOT can reduce startup work but constrains dynamic runtime behavior. Validate the
actual classpath, profiles, reflection/proxy/resource needs and operational tools.

## Graceful Lifecycle

On termination: remove readiness, stop new work, drain HTTP/message/scheduled
work within a bound, finish or safely replay transactions, close pools/clients and
exit before platform forced termination. Test SIGTERM, rolling deployment and
hard-kill behavior with real traffic.

## Required Incident Scenarios

Use the [Spring Boot Incident Playbook](./SPRING-BOOT-PRODUCTION-INCIDENT-PLAYBOOK.md)
for:

- startup regresses or fails only in production;
- bean missing, duplicated, circular or unexpectedly proxied;
- transaction/async/cache/retry advice does not execute;
- intermittent 503 despite a green health endpoint;
- server threads or Hikari connections exhaust;
- high CPU, allocation, GC, native memory or `OOMKilled`;
- downstream timeout and retry cascade;
- serialization/message-conversion failure;
- graceful shutdown loses HTTP/Kafka work;
- AOT/native image behaves differently from JVM mode.

## Completion Standard

For one request/event, draw every queue, thread, proxy, transaction, pool,
serialization and network boundary; inject a failure; collect evidence; contain
impact; recover without data loss; and prove the correction under load.

## Official References

- [Spring Boot reference](https://docs.spring.io/spring-boot/reference/)
- [Spring Framework reference](https://docs.spring.io/spring-framework/reference/)

## Recommended Next

Continue with [Spring Boot Runtime Performance](./SPRING-BOOT-RUNTIME-PERFORMANCE.md).

