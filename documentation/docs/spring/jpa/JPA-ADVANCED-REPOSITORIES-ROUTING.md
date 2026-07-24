---
title: Advanced JPA Repositories Routing And Provider Features
description: Querydsl, scrolling, stored procedures, bulk DML, routing, multi-tenancy, filters, Envers, domain events, callbacks, OSIV, and advanced production decisions.
difficulty: Architect
page_type: Deep Dive
status: Generic
prerequisites: [Spring Data JPA, Hibernate internals]
learning_objectives: [Implement advanced repository queries, Design tenant and datasource routing, Avoid provider lifecycle and bulk update hazards]
technologies: [Spring Data JPA, Hibernate, Querydsl, Spring Boot]
last_reviewed: "2026-07-24"
---

# Advanced JPA Repositories Routing And Provider Features

## Querydsl And Dynamic Queries

Specifications and Querydsl both build dynamic predicates. Specifications use the JPA Criteria
model and compose well with Spring Data. Querydsl generates typed Q-models and can improve complex
query readability. Neither guarantees efficient SQL; inspect joins, predicates, result shape and plan.

Keep business search criteria separate from framework predicates so controllers and domain services
do not depend on persistence implementation.

## Scrolling And Keysets

Spring Data scrolling can return `Window<T>` with a `ScrollPosition`. Keyset scrolling avoids
deep offsets when the sort is stable, unique and indexed. Include every sort field in the selected
shape and add an immutable unique tie-breaker.

Do not expose encoded persistence details as an unsigned public cursor. Version, sign or validate
cursor contents and cap traversal size.

## Stored Procedures

`@Procedure` or `EntityManager` stored-procedure APIs can integrate required database procedures.
Treat parameter modes, transaction behavior, result sets, timeouts, privileges and database-version
compatibility as an explicit adapter contract. Avoid moving ordinary domain logic into procedures
without an ownership and test strategy.

## Bulk DML And Persistence Context

JPQL/native bulk update and delete bypass managed-entity dirty checking, callbacks and ordinary
version semantics. Managed objects may become stale immediately.

```java
@Modifying(clearAutomatically = true, flushAutomatically = true)
@Query("update OrderEntity o set o.status = :next where o.status = :current")
int transitionAll(OrderStatus current, OrderStatus next);
```

Automatic clear is convenient but discards unflushed state if boundaries are wrong. Prefer a small
transaction dedicated to the bulk operation, verify affected rows and explicitly refresh/reload.

## Read Write Routing

`AbstractRoutingDataSource` can select a writer or replica before a connection is acquired. Routing
based only on `readOnly=true` is unsafe when the operation requires read-your-write behavior or an
idempotency/authorization decision from the writer.

Replica lag must be a product-level consistency decision. Once a transaction obtains a connection,
changing context must not silently move later statements to another database.

## Multi-Tenancy

| Model | Isolation | Main cost |
|---|---|---|
| shared schema with tenant column | lowest physical isolation | every query/index/constraint must include tenant correctly |
| schema per tenant | stronger namespace isolation | migrations and pools at scale |
| database per tenant | strongest operational isolation | provisioning, routing and fleet cost |

Use trusted request identity to establish tenant context, clear it reliably, enforce it in database
constraints/policies where possible, and test cross-tenant adversarial queries. Hibernate filters can
add predicates but are not a sufficient security boundary if native or bulk paths bypass them.

## Filters And Soft Delete

Hibernate filters and soft-delete annotations affect generated ORM queries, not every native query,
stored procedure or admin path. Soft deletion complicates uniqueness, foreign keys, storage retention,
privacy erasure and index selectivity. Prefer explicit retention semantics and test all access paths.

## Envers And Auditing

Envers records entity revision history inside the database transaction. Define revision identity,
table growth, querying, schema migration and retention. It is valuable for entity history but is not
automatically a domain audit, security audit or event stream.

## Domain Events And Entity Callbacks

`@DomainEvents` publishes aggregate events around repository operations. `EntityCallback` is a shared
Spring Data lifecycle extension; JPA also has entity listeners/provider callbacks. Keep callbacks free
of remote I/O and understand their order. Use an outbox when an external event must survive commit.

## OSIV

Open EntityManager in View keeps persistence access available through web rendering/serialization.
It can hide missing fetch plans, produce N+1 queries outside service transaction intent and hold
connections unpredictably. Disable OSIV for service APIs, load explicit DTOs inside service boundaries,
and prove query counts before rollout.

## Advanced Identifier And Generated Values

Sequence allocation, identity columns, UUIDs, natural IDs and database-generated columns affect batch
inserts, portability and equality. Choose from write throughput, ordering, disclosure and migration
requirements. Refresh database-generated values when the provider cannot retrieve them automatically.

## Interview Questions

1. Why can bulk JPQL leave managed entities stale?
2. What makes keyset scrolling correct?
3. Why is read-only routing not automatically safe?
4. Can a Hibernate tenant filter enforce complete tenant isolation?
5. How do Envers, auditing columns, domain events and an outbox differ?
6. Why does disabling OSIV often expose `LazyInitializationException`?

## Official References

- [Spring Data JPA reference](https://docs.spring.io/spring-data/jpa/reference/)
- [Hibernate ORM documentation](https://docs.jboss.org/hibernate/orm/current/userguide/html_single/Hibernate_User_Guide.html)

## Recommended Next

Continue with [Multi-Store Consistency](../data/SPRING-DATA-MULTISTORE-CONSISTENCY.md).

