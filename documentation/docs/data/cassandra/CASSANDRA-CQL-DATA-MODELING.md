---
title: Cassandra CQL And Query-First Data Modeling
description: Query-first tables, partition and clustering keys, denormalization, bucketing, CQL types, TTL, batches, paging, and modeling failure modes.
difficulty: Advanced
page_type: Tutorial
status: Generic
prerequisites: [Cassandra architecture and consistency]
learning_objectives: [Derive tables from access patterns, Bound partition size, Write safe CQL queries and mutations]
technologies: [Apache Cassandra, CQL]
last_reviewed: "2026-07-23"
---

# Cassandra CQL And Query-First Data Modeling

Cassandra modeling starts with a named query, not a normalized entity diagram.
Create a table that places every result for that query in a bounded partition and
orders it with clustering columns. Duplicate data across tables deliberately and
own how all projections are updated or rebuilt.

## Primary-Key Grammar

```sql
PRIMARY KEY ((partition_key_part_1, partition_key_part_2),
             clustering_column_1, clustering_column_2)
```

- Partition-key columns select the token and replica set.
- Clustering columns order rows inside the partition and define efficient ranges.
- Remaining columns are payload values.

## Worked Order Timeline

Required query: list one customer's order events for a month, newest first.

```sql
CREATE TABLE order_event_by_customer_month (
  customer_id uuid,
  month date,
  occurred_at timestamp,
  event_id timeuuid,
  order_id uuid,
  event_type text,
  payload text,
  PRIMARY KEY ((customer_id, month), occurred_at, event_id)
) WITH CLUSTERING ORDER BY (occurred_at DESC, event_id DESC);
```

```sql
SELECT occurred_at, event_id, order_id, event_type, payload
FROM order_event_by_customer_month
WHERE customer_id = ? AND month = ?
  AND occurred_at >= ? AND occurred_at < ?
LIMIT 100;
```

The month bucket bounds partition growth. `event_id` breaks timestamp ties. Choose
daily, weekly, monthly, or hash buckets from measured event rate, row size, query
range, and repair/read cost—not convention.

## Model One Table Per Query

Suppose the system also needs all events for one order. Add a projection:

```sql
CREATE TABLE order_event_by_order (
  order_id uuid,
  occurred_at timestamp,
  event_id timeuuid,
  event_type text,
  payload text,
  PRIMARY KEY (order_id, occurred_at, event_id)
) WITH CLUSTERING ORDER BY (occurred_at ASC, event_id ASC);
```

Application or streaming logic writes both tables idempotently. Cassandra does not
join them at read time. Record a source of truth, retry strategy, reconciliation,
and projection rebuild procedure.

## Partition Sizing

Estimate before launch:

```text
rows per partition = peak rows per key per time bucket
partition bytes = rows per partition * average encoded row bytes
```

Then test real compression, tombstones, metadata, reads, repairs, and compaction.
Watch both byte size and row count. A partition that fits disk can still create
latency, heap pressure, timeouts, and large repair streams.

Avoid keys with low cardinality or extreme skew such as country, status, or one
global date. Salting distributes load but requires the reader to fan out, merge,
page, and tolerate partial failure.

## Clustering Restrictions

Queries normally specify the full partition key. Clustering predicates follow
primary-key order: equality on earlier columns, then a bounded range on the next.
Skipping earlier clustering components does not become efficient automatically.

`ALLOW FILTERING` authorizes server-side filtering that may scan unpredictable
data. It is not an index or modeling solution. Use it only when bounded evidence
proves the scan and latency are acceptable.

## CQL Data Types

Use scalar types deliberately: `uuid`, `timeuuid`, `timestamp`, `date`, numeric
types, `boolean`, `text`, `blob`, and network types. Important modeling rules:

- `timeuuid` combines uniqueness and chronological ordering but is not a generic UUID;
- counters have special update and consistency semantics and should be isolated;
- collections suit small bounded values, not unbounded child tables;
- UDTs improve structure but schema evolution and frozen values need planning;
- static columns store one value per partition and can reduce duplication;
- null/unset/deleted have different mutation consequences through the driver.

## TTL And Expiration

```sql
INSERT INTO device_reading_by_day (...)
VALUES (...) USING TTL 2592000;
```

Expired cells become tombstones before compaction can reclaim them. Align TTL,
time buckets, compaction strategy, repair schedule, and `gc_grace_seconds`. Mixing
widely different TTLs in the same table can make reclamation inefficient.

## Writes, Updates, Deletes, And Batches

CQL upserts by primary key. A retry with the same key/value/timestamp can be
idempotent, but counters, generated keys, list appends, and external side effects
need special handling.

Use unlogged batches for grouping statements to the same partition when useful.
Use logged batches only for the documented atomic grouping requirement. Large
cross-partition batches turn a coordinator into a bottleneck and are not a bulk
loader.

Deletes and null writes create tombstones. Prefer table/time-bucket lifecycle and
TTL where appropriate, while still planning tombstone and repair behavior.

## Paging

Use driver paging state rather than offset pagination. A paging state belongs to a
specific query and data contract; protect it from client tampering if exposed as an
API cursor. Do not promise a stable global snapshot while concurrent mutations occur.

## Modeling Review Checklist

For every table document:

- exact read and mutation statements;
- partition and clustering-key rationale;
- peak partition rows/bytes and hot-key distribution;
- ordering and paging behavior;
- consistency levels and staleness tolerance;
- TTL/deletion, compaction, repair, and retention;
- duplicate/retry behavior and projection reconciliation;
- expected rate, latency, storage, and failure-mode evidence.

## Official References

- [CQL data definition](https://cassandra.apache.org/doc/latest/cassandra/developing/cql/ddl.html)
- [CQL data manipulation](https://cassandra.apache.org/doc/latest/cassandra/developing/cql/dml.html)
- [CQL types](https://cassandra.apache.org/doc/latest/cassandra/developing/cql/types.html)

## Recommended Next

Continue with [Storage, Compaction, Tombstones, And Indexes](./CASSANDRA-STORAGE-INDEXES.md).

