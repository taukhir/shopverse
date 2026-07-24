---
title: Database Engineering Revision Sheet
description: Rapid revision of modeling, indexes, transactions, isolation, locking, SQL performance, JPA, scaling, migration, and recovery.
difficulty: Advanced
page_type: Interview
status: Generic
prerequisites: [Data And Persistence Overview]
learning_objectives: [Recall database concepts quickly, Diagnose common persistence failures, Defend database and ORM decisions]
technologies: [SQL, JPA, Hibernate, MySQL, Distributed Databases]
last_reviewed: "2026-07-23"
---

# Database Engineering Revision Sheet

## One-Line Recall

| Concept | Revision answer |
|---|---|
| primary key | Stable row identity and clustered/access-path influence depending on engine. |
| unique constraint | Authoritative database protection against duplicate values or idempotency identities. |
| foreign key | Enforces referential integrity inside the database boundary. |
| composite index | Ordered index whose useful prefixes follow column order. |
| covering index | Contains all values required by a query, avoiding extra row lookup. |
| MVCC | Maintains versions/snapshots so reads and writes can overlap under isolation rules. |
| optimistic locking | Detects concurrent modification using a version at update time. |
| pessimistic locking | Acquires database locks before conflicting work proceeds. |
| persistence context | JPA identity map and unit of managed entity change tracking. |
| flush | Synchronizes pending ORM changes to SQL; it is not necessarily transaction commit. |

## Isolation Recall

| Level | Intent |
|---|---|
| read committed | each statement reads committed data; repeated reads may change |
| repeatable read | repeated reads in a transaction remain stable under engine semantics |
| serializable | result is equivalent to serial execution, with reduced concurrency/retries |

Isolation level alone does not enforce every business invariant. Use constraints,
conditional writes, locks, or serializable transactions where the invariant needs
them.

## Index Review

- derive indexes from real predicates, joins, ordering, grouping, and selectivity;
- put equality/range/order columns in an evidence-based order;
- inspect the execution plan and actual row counts;
- remove redundant or unused indexes carefully;
- remember that indexes cost writes, memory, disk, and maintenance;
- avoid applying functions/casts that prevent intended index use.

## JPA Failure Prompts

- N+1 queries from lazy traversal;
- unexpected eager graph and duplicate rows;
- `LazyInitializationException` outside persistence context;
- self-invocation bypassing `@Transactional` proxy;
- long transaction holding a connection during remote I/O;
- `saveAll` without configured JDBC batching;
- cascade deleting data outside aggregate ownership;
- pagination with fetch joins or unstable order.

## Scaling Decisions

Optimize query/model first, then consider read replicas, caches, partitioning,
specialized stores, and denormalized projections. Each added store introduces
replication lag, reconciliation, failure, security, and operational cost.

## Migration Checklist

Use expand-and-contract: add compatible schema, deploy code that handles old/new,
backfill safely, switch reads/writes, verify, then remove old structure after the
rollback window. Avoid long blocking DDL and irreversible changes in the same step.

## Interview Prompts

**Optimistic or pessimistic locking?** Choose from contention, retry cost, work
duration, invariant risk, and database behavior—not preference.

**SQL or NoSQL?** Start from invariants, access patterns, scale, consistency,
partitioning, operations, and team capability.

**Why is a query slow?** Check wait/pool time, plan, row estimates, scans, joins,
sorts, locks, cache, I/O, returned data, and application mapping.

## Final Checklist

- constraints protect authoritative invariants;
- transaction and isolation boundaries are explicit;
- indexes are justified by plans and workload;
- ORM SQL and fetch behavior are understood;
- migrations support overlapping versions and rollback;
- pools, locks, latency, storage, replicas, and backups are monitored;
- restoration and reconciliation are tested.
