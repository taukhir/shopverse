---
title: Database Engineering
sidebar_position: 1
---

# Database Engineering

## Relational Modeling

Start from business invariants, ownership, cardinality, and access patterns.
Tables should represent stable concepts and enforce critical rules with keys,
constraints, and indexes.

## Normalization

| Form | Main rule |
|---|---|
| 1NF | atomic values and no repeating groups |
| 2NF | 1NF plus no partial dependency on part of a composite key |
| 3NF | 2NF plus no transitive dependency on non-key columns |
| BCNF | every determinant is a candidate key |
| 4NF | no independent multivalued dependencies in one table |

Normalization reduces update anomalies. Denormalization can improve specific
read paths but creates synchronization responsibility. Use it deliberately and
measure the benefit.

## Joins

| Join | Meaning |
|---|---|
| `INNER JOIN` | rows matching both sides |
| `LEFT JOIN` | every left row plus matching right rows |
| `RIGHT JOIN` | every right row plus matching left rows |
| `FULL OUTER JOIN` | rows from either side; not directly supported by MySQL |
| `CROSS JOIN` | Cartesian product |

Join columns normally need compatible types and useful indexes. A join across
tables in one service database is normal; a join across microservice-owned
databases violates service ownership.

## Indexes

An index improves selected reads at the cost of storage and write overhead.

Good candidates:

- primary and unique keys;
- foreign keys;
- frequent equality and range filters;
- join columns;
- columns supporting common `ORDER BY` patterns.

Composite index order matters:

```sql
CREATE INDEX idx_outbox_status_created
    ON outbox_events(status, created_at);
```

This supports scans such as:

```sql
SELECT *
FROM outbox_events
WHERE status = 'PENDING'
ORDER BY created_at
LIMIT 50;
```

Avoid indexing every column. Low-selectivity indexes and overlapping indexes
can slow writes without improving real plans.

## Query Optimization

1. Capture the exact slow query and parameters.
2. Use `EXPLAIN` or `EXPLAIN ANALYZE`.
3. Check rows examined, access type, chosen indexes, sorting, and temporary
   tables.
4. Select only required columns.
5. Add or reorder indexes based on the access pattern.
6. Remove N+1 application behavior.
7. Retest with realistic data volume.

## ACID

| Property | Meaning |
|---|---|
| Atomicity | all transaction changes commit or none do |
| Consistency | constraints and invariants remain valid |
| Isolation | concurrent transactions have controlled visibility |
| Durability | committed changes survive failures according to storage guarantees |

ACID applies within one transaction manager. It does not make a MySQL update
and a Kafka send one atomic operation. Shopverse uses the transactional Outbox
to close that dual-write gap.

## CAP

During a network partition, a distributed system cannot simultaneously
guarantee both:

- strong consistency for every operation;
- availability for every request.

CAP is about behavior during partitions, not a permanent choice of only two
letters. Shopverse favors local database consistency and eventual cross-service
consistency through durable events.

## Partitioning

Partitioning divides one logical table within a database, often by date or
range:

```text
outbox_2026_01
outbox_2026_02
outbox_2026_03
```

Benefits include retention management and partition pruning. Poor partition
keys can create hotspots or fail to improve queries.

## Sharding

Sharding distributes data across database servers:

```text
customer hash 0..3 -> shard A
customer hash 4..7 -> shard B
```

It adds routing, rebalancing, cross-shard query, transaction, backup, and
operational complexity. Shopverse does not currently implement sharding; it is
study material for future scale.

## Replication

Replication provides copies for availability and read scaling. Applications
must account for replication lag when reading immediately after a write.

## Deadlocks

Deadlocks occur when transactions acquire resources in incompatible order.

Mitigations:

- update rows in a consistent order;
- keep transactions short;
- index lock predicates;
- avoid remote calls inside transactions;
- retry deadlock victims with bounded backoff;
- monitor database deadlock reports.

## Microservice Database Rules

- database per service or strictly isolated schema ownership;
- no direct cross-service table access;
- Liquibase owns schema evolution;
- backups and restore tests are service-specific;
- use Outbox/events for cross-service change propagation;
- expose reporting through APIs, events, or purpose-built read models.

