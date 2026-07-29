---
title: Spring Data Transaction Async Scheduling And Cache Annotations
description: Deep guide to Spring Data repository, JPA, transaction, events, async, scheduling, retry and cache annotations with proxy boundaries, consistency, concurrency, and production failures.
difficulty: Advanced
page_type: Deep Dive
status: Generic
prerequisites: [Spring AOP, Transactions, Spring Data fundamentals]
learning_objectives: [Use persistence annotations deliberately, Explain transaction metadata, Bound async and scheduled work, Design caching safely, Diagnose proxy failures]
technologies: [Spring Framework 7, Spring Boot 4, Spring Data JPA, Spring Cache]
last_reviewed: "2026-07-29"
---

# Spring Data Transaction Async Scheduling And Cache Annotations

Many annotations on this page are implemented by proxies or generated repository objects.
They apply only when execution crosses the corresponding managed interception boundary.

## Persistence Mapping And Repository Annotations

Important JPA annotations include:

- `@Entity`, `@Table`, `@Id`, `@GeneratedValue`, `@Column`;
- `@Embeddable`, `@Embedded`, `@EmbeddedId`, `@IdClass`;
- `@OneToOne`, `@OneToMany`, `@ManyToOne`, `@ManyToMany`, `@JoinColumn`;
- `@Enumerated`, `@Version`, `@MappedSuperclass`, `@EntityListeners`.

Mapping annotations describe persistence metadata; they do not make an object a safe REST
or event contract. Define association ownership, cascade and orphan removal explicitly.
`@Version` supports optimistic concurrency checks—it is not business-event versioning.

Spring Data repository annotations include:

| Annotation | Purpose and risk |
|---|---|
| `@Query` | explicit JPQL/native query; test binding, pagination and count semantics |
| `@Param` | names a repository query parameter |
| `@Modifying` | marks update/delete query; persistence-context clearing may be required |
| `@Lock` | applies provider/database lock mode; understand blocking/deadlock behavior |
| `@EntityGraph` | selects fetch graph to address use-case fetch requirements |
| `@Procedure` | invokes stored procedure with database-specific contract |
| `@EnableJpaRepositories` | controls repository discovery/configuration boundary |
| `@EnableJpaAuditing` | activates auditing metadata support |
| `@CreatedDate`, `@LastModifiedDate`, `@CreatedBy`, `@LastModifiedBy` | auditing fields; define clock and principal semantics |

## `@Transactional`

It supplies transaction attributes interpreted by transaction infrastructure:

- manager/qualifier;
- propagation;
- isolation;
- timeout;
- read-only hint;
- rollback/no-rollback rules.

For the complete interceptor flow, private/static/final method matrix, self-invocation
explanation, `TransactionTemplate`, reactive operators and boundary-refactoring examples,
use [Transaction Proxy Mechanics And Boundary Design](../transactions/SPRING-TRANSACTION-PROXY-BOUNDARY-DESIGN.md).

Default Spring semantics commonly use `REQUIRED`, underlying default isolation, read-write,
and rollback for unchecked exceptions/`Error`, not checked exceptions.

```java
@Transactional(timeout = 5)
public Order confirm(OrderId id) {
    Order order = repository.getRequired(id);
    order.confirm();
    return order;
}
```

Avoid remote calls inside long database transactions. `readOnly = true` is an optimization
hint/semantic declaration, not a universal database write prohibition.

### Common transaction traps

- self-invocation bypasses proxy advice;
- catching an exception can prevent expected rollback or leave rollback-only state;
- private/non-interceptable call paths may not receive advice;
- multiple transaction managers require explicit ownership;
- database commit plus Kafka/API call is still a dual write;
- test `@Transactional` rollback can hide missing production transaction boundaries.

## Transactional Events

`@TransactionalEventListener` can bind handling to phases such as before commit, after
commit, after rollback or completion. After-commit code is not a reliable replacement for
an outbox: the database is already committed, and a crash can lose the external action.

## Async And Scheduling

| Annotation | Runtime behavior |
|---|---|
| `@EnableAsync` | registers async annotation infrastructure |
| `@Async` | submits eligible intercepted invocation to a configured executor |
| `@EnableScheduling` | activates scheduled-method processing |
| `@Scheduled` | schedules fixed rate/delay or cron invocation per application instance |

`@Async` changes thread and exception/context behavior; it does not automatically propagate
transactions, security context, MDC or deadlines. Name and bound executors explicitly.

`@Scheduled` runs in every replica unless coordination/leader election makes the job
singleton. Fixed rate measures from scheduled starts; fixed delay waits after completion.

## Cache Annotations

- `@EnableCaching` activates cache interception;
- `@Cacheable` reads cache before invocation and stores successful result;
- `@CachePut` always invokes and updates cache;
- `@CacheEvict` removes entries, optionally before invocation;
- `@Caching` groups multiple cache operations;
- `@CacheConfig` supplies class-level defaults.

Define key stability, null/failure caching, TTL, stampede protection, multi-replica
coherence and database transaction ordering. Self-invocation can bypass cache advice.

## Interview Questions

**Why can `@Transactional` and `@Async` on one call be dangerous?** Async execution occurs
on another thread, so the caller's thread-bound transaction/context is not automatically
continued. Define the transaction inside the async operation and its failure contract.

**Why is `@Cacheable` not enough for distributed consistency?** It does not define cross-
instance invalidation, transaction ordering, TTL, stampede control or authoritative data.

**Does `@Scheduled` run once in Kubernetes?** By default it runs in every application
replica that creates the scheduled bean.

## Official References

- [Spring `@Transactional`](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html)
- [Spring task execution and scheduling](https://docs.spring.io/spring-framework/reference/integration/scheduling.html)
- [Spring cache annotations](https://docs.spring.io/spring-framework/reference/integration/cache/annotations.html)
