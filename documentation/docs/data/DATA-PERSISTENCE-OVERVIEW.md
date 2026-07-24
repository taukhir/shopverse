---
title: Data And Persistence Overview
description: First-read map of relational modeling, transactions, indexes, JPA, distributed databases, migration, caching, and production data operations.
difficulty: Intermediate
page_type: Learning Path
status: Generic
prerequisites: [SQL fundamentals]
learning_objectives: [Select storage from access and consistency needs, Define safe transaction and schema boundaries, Navigate database implementation and operations guides]
technologies: [SQL, MySQL, Oracle Database, JPA, Hibernate, Cassandra, Elasticsearch, NoSQL, Liquibase]
last_reviewed: "2026-07-23"
---

# Data And Persistence Overview

Data architecture begins with invariants, access patterns, ownership, consistency,
volume, and lifecycle. A database product is selected after those requirements are
clear.

```mermaid
flowchart LR
    Invariant["Business invariants"] --> Model["Logical model"]
    Model --> Store["Storage engine"]
    Store --> Query["Indexes and queries"]
    Query --> Tx["Transactions and concurrency"]
    Tx --> Ops["Migration, backup, monitoring, recovery"]
```

## Important Topics

| Topic | Brief explanation |
|---|---|
| logical modeling | Represent entities, identity, relationships, constraints, and lifecycle independently of framework classes. |
| normalization | Reduce inconsistent duplication; denormalize only for measured read or distribution needs. |
| constraints | Enforce authoritative uniqueness, references, and valid state in the database where possible. |
| indexes | Additional ordered structures that accelerate selected access paths while costing writes and storage. |
| transactions | Atomicity and isolation boundary for related state changes in one database. |
| isolation | Controls which concurrent effects a transaction may observe. |
| locking and MVCC | Coordinate conflicting work using locks, versions, snapshots, or conditional updates. |
| query planning | Engine selection of scans, joins, indexes, sorts, and aggregation strategies. |
| JPA/Hibernate | Object-relational abstraction with lifecycle, persistence context, fetching, dirty checking, and flush behavior. |
| migrations | Version-controlled, compatible changes to live schemas and data. |
| distributed data | Partitioning and replication add availability and scale while complicating transactions and consistency. |
| backup and recovery | Independent protection and tested restoration for deletion, corruption, and regional failure. |
| Oracle Database | Product-specific instance, redo/undo, optimizer, PL/SQL, RAC, Data Guard, RMAN, and Spring integration. |
| Elasticsearch | Distributed full-text search, relevance, analytics, lifecycle, and rebuildable read projections. |

## Selection Questions

Choose storage by asking:

- What are the authoritative invariants and transaction boundaries?
- Which reads and writes dominate, at what rate and size?
- Is access by key, range, relation, document, graph, vector, text, or time?
- Which consistency and conflict behavior is acceptable?
- How will data partition, replicate, expire, archive, and restore?
- What are privacy, residency, audit, and deletion obligations?
- Which operational skills and managed services are available?

Relational databases are a strong default for transactional domain state. Add
specialized stores when a distinct access pattern justifies the consistency and
operational cost.

## ORM Boundary

JPA does not eliminate SQL or database behavior. Architects must understand:

- persistence-context identity and entity lifecycle;
- flush timing versus transaction commit;
- lazy/eager fetching and N+1 queries;
- cascade and orphan-removal ownership;
- optimistic and pessimistic locking;
- JDBC batching and connection-pool capacity;
- query plans, indexes, pagination, and memory use.

## Production Failure Questions

1. Can concurrent requests violate an invariant?
2. What happens when a transaction retries?
3. Can a migration run safely while old and new applications coexist?
4. What if replicas lag or a partition is unavailable?
5. Can a cache return state that violates the business decision?
6. How long do backup restoration and reconciliation take?
7. Which metrics expose pool exhaustion, lock waits, slow queries, and storage growth?

## Recommended Route

1. [Database Engineering](./DATABASE-ENGINEERING.md)
2. [Relational Modeling And Query Performance](./RELATIONAL-MODELING-QUERY-PERFORMANCE.md)
3. [Database Consistency And Scaling](./DATABASE-CONSISTENCY-SCALING.md)
4. [Database Selection Guide](./DATABASE-SELECTION-GUIDE.md)
5. [Apache Cassandra Architect Path](./CASSANDRA-ARCHITECT-PATH.md)
6. [Oracle Database Architect Path](./ORACLE-DATABASE-ARCHITECT-PATH.md)
7. [Elasticsearch Architect Path](./ELASTICSEARCH-ARCHITECT-PATH.md)
8. [JPA And Hibernate Architect Guide](../spring/SPRING-JPA-HIBERNATE-ARCHITECT.md)
9. [Spring Data Cassandra](../spring/SPRING-DATA-CASSANDRA.md)
10. [Database Engine Internals](./DATABASE-ENGINE-INTERNALS.md)
11. [Database Migrations And Operations](./database-selection/DATABASE-MIGRATIONS-OPERATIONS.md)
12. [Database Revision Sheet](./DATABASE-REVISION-SHEET.md)

## Completion Check

- model identity, ownership, constraints, and lifecycle;
- explain transaction isolation and concurrency protection;
- read an execution plan and justify indexes;
- predict ORM queries, flushes, and fetch behavior;
- select storage from access and consistency requirements;
- design compatible migration, backup, restore, and observability;
- calculate connections, throughput, storage, and growth headroom.
