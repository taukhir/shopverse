---
title: JPA Versus JDBC
description: Choose aggregate mapping or explicit SQL control by persistence workload.
difficulty: Advanced
page_type: Decision Guide
status: Generic
prerequisites: [SQL, Transactions, JPA]
learning_objectives: [Match tool to workload, Identify ORM risk, Plan coexistence]
technologies: [Spring Data JPA, Hibernate, Spring JDBC]
last_reviewed: "2026-07-13"
---

# JPA Versus JDBC

<DocLabels items={[
  {label: 'Decision guide', tone: 'advanced'},
  {label: 'Persistence', tone: 'production'},
  {label: 'SQL evidence', tone: 'shopverse'},
]} />

| Prefer JPA when | Prefer JDBC when |
|---|---|
| modifying rich aggregates with invariants | query shape is the primary design |
| dirty checking and unit-of-work semantics help | bulk updates, reports, CTEs or vendor SQL dominate |
| relationships are navigated within a boundary | result is a projection, not an entity graph |
| team can inspect generated SQL and fetch plans | exact statements and mapping cost need control |

## Avoid

- Avoid exposing entities as API contracts.
- Avoid implicit lazy traversal across transaction boundaries.
- Avoid forcing analytical queries into object graphs.
- Avoid hand-written JDBC for every CRUD path when mapping cost exceeds its value.

## Evidence Checklist

Capture statement count, query plan, rows scanned/returned, result-set bytes,
hydration time, flush statements, lock duration and connection hold time. “JPA
is slow” and “JDBC is faster” are not architecture evidence.

## Coexistence And Migration

Spring transaction management can coordinate JPA and JDBC against the same data
source. Introduce a JDBC query adapter behind an application port for one hot
read path, keep write ownership unchanged, compare semantics and metrics, then
expand only where the benefit persists. Migrating writes requires explicit
optimistic locking, auditing, cascade and invariant behavior previously supplied
by the ORM.

<!-- snippet-source: labs/spring-architect/src/main/java/io/shopverse/labs/order/OrderRepository.java -->
<!-- snippet-test: labs/spring-architect/src/test/java/io/shopverse/labs/NPlusOneQueryTest.java -->

<DocCallout type="production" title="Fetch plans are use-case decisions">

The executable lab proves an entity graph collapses one aggregate query to one
statement. That does not mean every relationship should be eager; create a fetch
plan for each use case and verify it with statement-count evidence.

</DocCallout>

<ExpandableAnswer title="Interview: Can one service safely use both JPA and JDBC?">

Yes. Keep both behind clear repository/query ports, use the same transaction
manager and data source where atomicity is required, and prevent duplicate write
ownership. JDBC projections are often ideal for hot reads while JPA manages
aggregate changes.

</ExpandableAnswer>

## Official References

- [Spring JDBC](https://docs.spring.io/spring-framework/reference/data-access/jdbc.html)
- [Spring ORM and JPA](https://docs.spring.io/spring-framework/reference/data-access/orm.html)

## Recommended Next

Read [JPA Fetching And Performance](../jpa/JPA-FETCHING-PERFORMANCE.md).
