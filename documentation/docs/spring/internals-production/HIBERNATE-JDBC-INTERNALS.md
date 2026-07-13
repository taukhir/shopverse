---
title: Persistence Runtime Compatibility Route
description: Compatibility route from the former Hibernate and JDBC internals chapter to the canonical persistence-runtime architecture guide.
difficulty: Advanced
page_type: Reference
status: Generic
prerequisites: [Spring Data JPA]
learning_objectives: [Locate the canonical Spring persistence-runtime guide]
technologies: [Spring Data JPA, Hibernate ORM, JDBC]
last_reviewed: "2026-07-13"
---

# Persistence Runtime Compatibility Route

<DocLabels items={[
  {label: 'Compatibility route', tone: 'foundation'},
  {label: 'Advanced', tone: 'advanced'},
]} />

<DocCallout type="tip" title="This material has one canonical home">

Hibernate dirty checking, flush, query plans, locking, connection capacity, schema
rollout, and incident evidence now live in
[Spring Data JPA And Hibernate Runtime For Architects](../SPRING-JPA-HIBERNATE-ARCHITECT.md).
This URL remains available so existing bookmarks do not lead to duplicated prose.

</DocCallout>

<TopicCards items={[
  {title: 'Persistence runtime for architects', href: '/spring/SPRING-JPA-HIBERNATE-ARCHITECT', description: 'Use the canonical Spring transaction, Hibernate, JDBC, capacity, and rollout synthesis.', icon: 'layers', tags: ['Canonical', 'Architecture']},
  {title: 'Hibernate reference track', href: '/data/HIBERNATE', description: 'Review provider-level lifecycle, mapping, fetching, caching, and interview scenarios.', icon: 'book', tags: ['Hibernate', 'Reference']},
]} />

## Route By Symptom

Use the symptom to enter the canonical material instead of reading another copy of
the same runtime explanation:

| Symptom or decision | Canonical destination |
|---|---|
| a read query unexpectedly flushes pending writes | [Runtime Mental Model](../SPRING-JPA-HIBERNATE-ARCHITECT.md#runtime-mental-model) |
| datasource acquisition time rises with request concurrency | [Connection Capacity](../SPRING-JPA-HIBERNATE-ARCHITECT.md#connection-capacity) |
| one request emits many association queries | [Fetching Performance](../jpa/JPA-FETCHING-PERFORMANCE.md) |
| bulk JPQL is followed by stale managed state | [Batching And Bulk Work](../SPRING-JPA-HIBERNATE-ARCHITECT.md#batching-and-bulk-work) |
| an optimistic conflict or row-lock timeout needs a retry decision | [Transactions Locking And Concurrency](../jpa/JPA-TRANSACTIONS-LOCKING.md) |
| a column, key, enum, or index must change during rolling deployment | [Schema Evolution And Rollback](../SPRING-JPA-HIBERNATE-ARCHITECT.md#schema-evolution-and-rollback) |

For an incident, start with the trace or metric that identifies transaction time,
query count, lock wait, or connection acquisition. Follow only the corresponding
destination above, capture the stated evidence, and return to the architect synthesis
when the failure crosses more than one persistence boundary.

## Official References

- [Spring Data JPA reference](https://docs.spring.io/spring-data/jpa/reference/)
- [Hibernate ORM user guide](https://docs.hibernate.org/orm/current/userguide/html_single/)

## Recommended Next Page

[Production Lifecycle, Security, And Observability](./PRODUCTION-LIFECYCLE.md)
