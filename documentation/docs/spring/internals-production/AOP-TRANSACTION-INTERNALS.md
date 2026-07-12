---
title: AOP Proxy And Transaction Internals
difficulty: Advanced
page_type: Concept
status: Generic
keywords: [Spring AOP, JDK proxy, CGLIB proxy, transaction interceptor, self invocation, transaction synchronization]
learning_objectives: [Explain proxy method interception, Trace transaction begin commit rollback and synchronization, Diagnose propagation and self-invocation failures]
technologies: [Spring Framework, JDBC]
last_reviewed: "2026-07-12"
---

# AOP Proxy And Transaction Internals

![Animated comparison of an external Spring proxy call and self-invocation bypass](/img/diagrams/animated-spring-proxy-self-invocation.svg)

*The red self-call never crosses the proxy boundary, so proxy advice is not
reapplied. Refactor the boundary or use an appropriate weaving/programmatic model.*

Spring AOP normally returns a proxy from a bean post-processor. JDK proxies expose
interfaces; subclass proxies override eligible non-final methods. Interceptors form
a chain around the target invocation. Final/private methods, construction, and
calls through `this` bypass ordinary proxy interception.

Advice order changes semantics: retry outside transaction creates a new transaction
per attempt; retry inside transaction may repeat work in one rollback-only context.
Security, metrics, cache, async, resilience, and transactions need explicit ordering.

## Transaction Flow

The transaction interceptor resolves metadata, asks a transaction manager for a
transaction, binds resources/synchronization to the execution context, invokes the
target, then commits or rolls back. Runtime exceptions normally trigger rollback;
checked exceptions require configured rules. An inner failure can mark a shared
transaction rollback-only and cause `UnexpectedRollbackException` later.

| Propagation | Effect |
|---|---|
| REQUIRED | join existing or create |
| REQUIRES_NEW | suspend existing and use another physical transaction/connection |
| NESTED | savepoint when manager/resource supports it |
| SUPPORTS | join if present, otherwise nontransactional |

`REQUIRES_NEW` can exhaust pools when outer transactions retain connections.
Isolation applies when a new physical transaction begins and cannot be reasoned
about without engine MVCC/locking semantics.

Transaction synchronizations run before/after commit/completion and support ORM
flush and resource cleanup. `afterCommit` is too late to make a remote publish
atomic; use an outbox. Thread-bound transactions do not automatically cross
`@Async`, executor, reactive, or arbitrary new-thread boundaries.

## Lab

Create two beans to compare proxied cross-bean invocation with self-invocation.
Exercise rollback rules, REQUIRED/REQUIRES_NEW pool usage, nested savepoints, and
after-commit failure. Inspect SQL, connections, and transaction logs.

## Recommended Next Page

[Web Execution And HTTP Runtime](./WEB-HTTP-RUNTIME.md)

## Official References

- [Spring Framework — AOP Proxies](https://docs.spring.io/spring-framework/reference/core/aop/proxying.html)
- [Spring Framework — Declarative Transaction Implementation](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-decl-explained.html)
- [Spring Framework — `@Transactional` Settings](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html)
- [Spring Framework — Transaction Propagation](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html)
