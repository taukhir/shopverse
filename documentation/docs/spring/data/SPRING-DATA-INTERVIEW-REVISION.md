---
title: Spring Data Interview Labs And Revision
description: Lead and architect interview questions, production scenarios, hands-on labs, selection matrix, and rapid revision sheet.
difficulty: Architect
page_type: Interview Guide
status: Generic
prerequisites: [Spring Data Architect Learning Path]
learning_objectives: [Answer internals and design questions, Diagnose production data incidents, Demonstrate decisions with executable evidence]
technologies: [Spring Data, JPA, JDBC, R2DBC, Cassandra, MongoDB, Redis, Elasticsearch]
last_reviewed: "2026-07-24"
---

# Spring Data Interview Labs And Revision

## Top Interview Questions

### How does Spring create a repository implementation?

Scanning registers a factory bean. A store-specific repository factory reads repository and
domain metadata, resolves query methods, composes the base implementation and custom fragments,
and creates a proxy whose calls dispatch to CRUD, derived, declared, or fragment logic.

### Repository or template?

Use a repository for stable aggregate access and bounded queries. Use a template/native query
adapter when store-specific queries, updates, aggregations, batching, routing or tuning must
remain explicit. Choose clarity and evidence, not uniformity.

### Why can a derived query be dangerous?

Property parsing can succeed while the database performs an unindexed scan, fan-out, deep
pagination, large result materialization, or unsupported consistency pattern. Validate generated
queries with realistic data and plans.

### JPA, JDBC, or R2DBC?

JPA provides a persistence context, dirty checking and rich mapping. JDBC provides explicit
aggregate persistence and SQL without change tracking. R2DBC provides non-blocking relational
access for an end-to-end reactive system. Team skill, query model and operational evidence matter.

### Can `@Transactional` span SQL and MongoDB/Kafka/Redis?

Not as a normal atomic transaction. It selects a transaction manager and resource boundary.
Use outbox, idempotency, sagas, reconciliation or a deliberately justified distributed transaction.

### How do you prevent stale search updates?

Carry aggregate versions, apply events idempotently, reject older versions, monitor lag and
support a complete rebuild from the authority.

### Why can increasing a connection pool reduce throughput?

It moves queueing to the database, increases concurrent working sets and lock contention, and
can exceed the database connection budget across replicas.

## Production Scenarios

1. A `Page` endpoint becomes slow after data reaches 100 million rows.
2. JPA produces thousands of queries after a harmless serializer change.
3. R2DBC acquisition wait grows although database CPU is low.
4. Cassandra writes succeed but one partition's p99 rises continuously.
5. MongoDB documents approach the size limit because an array never stops growing.
6. Redis evictions cause a database stampede.
7. Elasticsearch receives events out of order during replay.
8. A schema migration must support three running application versions.
9. A timeout occurs after the database may have committed a payment record.
10. A tenant deletion must reach cache, search, events and backups.

For each scenario answer:

- What is the user impact and invariant?
- Which metrics, query/driver evidence and logs distinguish hypotheses?
- What is the smallest reversible mitigation?
- How will duplicates, partial commits or stale reads be reconciled?
- What test and alert prevent recurrence?

## Hands-On Labs

### Lab 1: Repository Internals

Create a repository with derived, declared and custom-fragment methods. Enable startup/query
diagnostics, trace proxy invocation, deliberately misspell a property, and explain the failure stage.
Use the compiled [Spring Data Repository Internals Lab](../architect-labs/SPRING-DATA-REPOSITORY-INTERNALS-LAB.md)
as the executable starting point.

### Lab 2: JPA Versus JDBC

Implement the same order aggregate with JPA and Spring Data JDBC. Measure SQL count, write
amplification, memory, concurrency conflict handling and developer complexity.

### Lab 3: Reactive Capacity

Run an R2DBC endpoint with bounded and unbounded `flatMap`. Measure pool wait, event-loop
threads, p99 and cancellation. Inject one blocking dependency and identify it.

### Lab 4: NoSQL Modeling

Implement one access pattern in Cassandra and MongoDB. Demonstrate why copying a relational
entity model produces a bad partition/document design.

### Lab 5: Cache Failure

Simulate Redis loss under traffic. Compare uncontrolled cache-aside with request coalescing,
jittered TTL, bounded fallback and load shedding.

### Lab 6: Search Rebuild

Create a new index, backfill, apply live events, compare versions/counts/golden queries, switch
an alias, roll back, and document evidence.

### Lab 7: Outbox Crash Windows

Crash after business commit, after broker send and before relay marking. Prove eventual publish,
duplicate tolerance and reconciliation.

## One-Page Revision

```text
Repository = proxy + metadata + base implementation + queries + fragments
Derived name validity != efficient database query
Page = content + count; Slice avoids exact count
JPA = unit of work; JDBC = explicit aggregate persistence; R2DBC = reactive SQL
Cassandra = query-first partitions; MongoDB = bounded documents
Redis role must be explicit; Elasticsearch needs authority and rebuild
@Transactional owns one configured resource boundary, not universal atomicity
Outbox publishes reliably; inbox/idempotency handles duplicates
Pool capacity is global across replicas; more connections can worsen queues
Test real engines; observe acquisition, execution, mapping and downstream separately
Schema changes use expand-contract and mixed-version evidence
Restore, replay and reconciliation are production features
```

## Completion Standard

You should be able to implement and test at least two contrasting stores, explain repository
internals, diagnose generated queries and pool waits, defend consistency and migration choices,
and present production evidence rather than configuration memorization.

## Official References

- [Spring Data projects](https://spring.io/projects/spring-data)
- [Spring Data Commons reference](https://docs.spring.io/spring-data/commons/reference/)

## Recommended Next

Apply these questions to the [Spring Architect Interview Workbook](../SPRING-ARCHITECT-INTERVIEW-WORKBOOK.md).
