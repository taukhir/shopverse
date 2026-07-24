---
title: Spring And Spring Boot Revision Sheet
description: Rapid revision of the Spring container, Boot auto-configuration, AOP, transactions, MVC, data, testing, Kafka, security, and production behavior.
difficulty: Advanced
page_type: Interview
status: Generic
prerequisites: [Spring And Spring Boot Learning Guide]
learning_objectives: [Recall Spring runtime behavior quickly, Diagnose framework boundary failures, Structure senior and architect interview answers]
technologies: [Spring Framework 7, Spring Boot 4, Spring Data, Spring Kafka]
last_reviewed: "2026-07-23"
---

# Spring And Spring Boot Revision Sheet

## Runtime Path

```text
configuration -> bean definitions -> BeanFactory post-processors
-> bean creation/dependency injection -> bean post-processors/proxies
-> application lifecycle -> request/message invocation -> shutdown
```

## One-Line Recall

| Concept | Revision answer |
|---|---|
| dependency injection | Container supplies collaborators so policy does not construct infrastructure. |
| bean scope | Defines instance ownership and lifecycle, not thread safety. |
| auto-configuration | Conditional configuration selected from classpath, properties, and existing beans. |
| proxy | Wrapper used for AOP behaviors such as transactions, security, async, or cache. |
| self-invocation | A call through `this` bypasses an external proxy interception point. |
| transaction | Database resource boundary bound to the executing thread by normal Spring infrastructure. |
| filter | Servlet-container interception before/after the Spring MVC dispatcher. |
| interceptor | Spring MVC handler interception around controller execution. |
| argument resolver | Converts request context into controller method arguments. |
| test slice | Focused application context for one framework layer. |

## Frequent Traps

- field injection hides required dependencies;
- circular dependencies reveal confused ownership;
- `@Transactional` on private/self-invoked methods may not apply;
- checked-exception rollback depends on configured rules;
- holding a transaction across remote calls consumes connections and locks;
- `@Async` changes thread, transaction, security, and logging context;
- singleton beans must not hold unsafe request-specific mutable state;
- lazy JPA access outside the transaction fails or encourages open-session leakage;
- replacing Boot factories casually can discard useful auto-configuration;
- application health does not prove dependency or business-flow health.

## MVC Request Recall

```text
server -> filters -> DispatcherServlet -> HandlerMapping
-> interceptors -> argument resolution/validation -> controller
-> service/transaction -> return-value handling -> message conversion
-> exception resolution -> response
```

## Production Review

- externalized, validated configuration and secret ownership;
- bounded servlet, async, connection, HTTP, scheduler, and Kafka pools;
- explicit timeouts, retries, cancellation, and shutdown;
- transaction and idempotency boundaries;
- authentication, authorization, CSRF/CORS and object ownership;
- structured logs, metrics, traces, health, and deployment identity;
- compatible database/event/API rollout and rollback;
- unit, slice, integration, contract, and failure tests.

## Interview Prompts

**How does `@Transactional` work?** A post-processor creates an AOP proxy. Calls
through the proxy start/join a transaction, bind resources, invoke the target, and
commit or roll back according to outcome and rules.

**Boot magic?** Boot is conditional configuration plus dependency management and
conventions. Diagnose it through conditions, bean definitions, properties, and
startup evidence.

**MVC or WebFlux?** Select from workload and dependency model. Reactive code helps
high-concurrency non-blocking pipelines; it does not make blocking dependencies
non-blocking.

## Final Checklist

- trace container startup and proxy creation;
- explain request, transaction, data, async, and Kafka thread boundaries;
- predict auto-configuration back-off;
- size and observe pools as one capacity system;
- test framework integration rather than mocking it away;
- design graceful startup, deployment, and shutdown.

Continue with the [Spring Architect Interview Workbook](./SPRING-ARCHITECT-INTERVIEW-WORKBOOK.md).
