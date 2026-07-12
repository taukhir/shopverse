---
title: Database Hands-On Labs
sidebar_position: 11
difficulty: Intermediate
page_type: Tutorial
status: Generic
keywords: [EXPLAIN ANALYZE, indexing, connection pool, keyset pagination, Cassandra partition key, ClickHouse OLAP, pgvector similarity search]
learning_objectives: [Compare query plans and indexes with evidence, Exercise bounded database overload safely, Model specialist database access patterns]
technologies: [MySQL, PostgreSQL, Cassandra, ClickHouse, pgvector]
last_reviewed: "2026-07-12"
---

# Database Hands-On Labs

Run these labs only against disposable local databases. Pin approved image
versions, use non-default host ports, cap CPU/memory, keep datasets bounded, and
remove containers and volumes afterward. Never run overload experiments against
a shared or production environment.

## Lab 1: Compare MySQL And PostgreSQL Query Plans

Create the same logical table in both databases:

```sql
CREATE TABLE lab_orders (
  id BIGINT PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  total DECIMAL(12,2) NOT NULL
);
```

Load 20,000 synthetic rows with a realistic status distribution. Run the query
before and after `CREATE INDEX ix_orders_customer_created ON
lab_orders(customer_id, created_at DESC);`.

```sql
-- PostgreSQL: execute the query and report actual rows/timing/buffers.
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, status, total FROM lab_orders
WHERE customer_id = 42 ORDER BY created_at DESC LIMIT 20;

-- MySQL: execute the query and report actual iterator timing.
EXPLAIN ANALYZE
SELECT id, status, total FROM lab_orders
WHERE customer_id = 42 ORDER BY created_at DESC LIMIT 20;
```

Compare estimated versus actual rows, scan type, sort, rows examined, buffer/I/O
work, and elapsed time. Engine labels differ; compare work performed rather than
assuming similarly named operators behave identically.

## Lab 2: Missing, Correct, And Excessive Indexes

Use the query above in three states:

1. **Missing:** no secondary index; capture the scan and sort.
2. **Correct:** add `(customer_id, created_at DESC)`; capture the new plan.
3. **Excessive:** add overlapping indexes on `customer_id`, `(customer_id,
   created_at)`, and `(customer_id, created_at, status)`.

Measure 10,000 bounded inserts and inspect index sizes. PostgreSQL examples:

```sql
SELECT indexrelname, pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes WHERE relname = 'lab_orders';

SELECT indexrelname, idx_scan
FROM pg_stat_user_indexes WHERE relname = 'lab_orders'
ORDER BY idx_scan;
```

MySQL examples:

```sql
SHOW INDEX FROM lab_orders;
SELECT * FROM sys.schema_unused_indexes WHERE object_name = 'lab_orders';
```

Usage counters reset and rare critical queries may be absent. Combine statistics
with query history, plans, constraints, and a full business cycle before dropping
an index. Excess indexes consume storage/cache and amplify writes, vacuum/cleanup,
backup, replication, and schema-change work.

## Lab 3: Overload A Connection Pool Safely

Configure a local application pool with maximum size **4**, connection timeout
**500 ms**, and a database statement timeout. Send 20 concurrent requests whose
test query takes about 200 ms, for no more than 30 seconds.

Observe active, idle, pending, acquisition-timeout, database-session, CPU, and
query-latency metrics. Expected behavior is a bounded queue and fast controlled
rejection—not unbounded threads or hundreds of database sessions. Repeat with
admission control set to four permits and compare p95/p99 and failure behavior.

Do not infer pool size from CPU core count alone. Benchmark the real workload;
queries spend different proportions of time on CPU, locks, I/O, and network.

## Lab 4: Offset Versus Keyset Pagination

```sql
-- Work grows as the skipped offset grows and concurrent inserts can shift pages.
SELECT id, created_at, total FROM lab_orders
ORDER BY created_at DESC, id DESC OFFSET 10000 LIMIT 50;

-- Cursor contains the previous page's (created_at, id).
SELECT id, created_at, total FROM lab_orders
WHERE (created_at, id) < (:last_created_at, :last_id)
ORDER BY created_at DESC, id DESC LIMIT 50;
```

Add an index on `(created_at DESC, id DESC)`. Compare plans and latency at the
first and deep pages. Offset is useful for small datasets and random page
numbers; keyset gives stable, bounded continuation when a deterministic unique
ordering and opaque cursor are acceptable.

## Lab 5: Model A Cassandra Partition Key

Start from the query, not an entity model: “read one device's events for one day
in descending time order.”

```sql
CREATE TABLE events_by_device_day (
  device_id text,
  event_day date,
  event_time timestamp,
  event_id timeuuid,
  payload text,
  PRIMARY KEY ((device_id, event_day), event_time, event_id)
) WITH CLUSTERING ORDER BY (event_time DESC);
```

`(device_id, event_day)` distributes and bounds partitions; clustering columns
support the ordered range read. Estimate rows and bytes per partition, test hot
devices, retention, retries, and duplicate event identity. Create another table
for a different query; do not add filtering that causes cluster-wide scans.

## Lab 6: Send OLTP Data To ClickHouse For OLAP

Create an append-only `order_fact` table in ClickHouse, export a bounded order
snapshot or publish outbox events from PostgreSQL/MySQL, and ingest them in
batches. Compare a daily revenue aggregation in OLTP and ClickHouse.

```sql
CREATE TABLE order_fact (
  order_id UInt64,
  customer_id UInt64,
  occurred_at DateTime,
  status LowCardinality(String),
  total Decimal(12,2)
) ENGINE = MergeTree
PARTITION BY toYYYYMM(occurred_at)
ORDER BY (toDate(occurred_at), customer_id, order_id);

SELECT toDate(occurred_at) AS day, sum(total)
FROM order_fact WHERE status = 'COMPLETED'
GROUP BY day ORDER BY day;
```

In a real pipeline, use an outbox/CDC connector with checkpoints, idempotent
event identity, schema evolution, reconciliation, replay, deletion, and a
freshness SLO. Do not dual-write synchronously from business code.

## Lab 7: Run pgvector Similarity Search

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE lab_documents (
  id BIGSERIAL PRIMARY KEY,
  body TEXT NOT NULL,
  embedding vector(3) NOT NULL
);
INSERT INTO lab_documents (body, embedding) VALUES
  ('red running shoes', '[0.95,0.10,0.05]'),
  ('database indexing', '[0.05,0.90,0.10]'),
  ('trail footwear', '[0.88,0.18,0.08]');

SELECT id, body, embedding <=> '[0.90,0.12,0.04]' AS cosine_distance
FROM lab_documents ORDER BY embedding <=> '[0.90,0.12,0.04]' LIMIT 2;
```

Then add an HNSW cosine index supported by your installed pgvector version,
load a larger bounded dataset, and compare latency, recall, index build time,
memory, and ingestion cost. Apply tenant/authorization filters and retrieve the
current source record; vector results are not an authorization decision.

## Lab Report Template

Record hypothesis, versions/configuration, schema/data distribution, commands,
p50/p95/p99, throughput, resource use, plans, correctness checks, failure
observations, cleanup, conclusion, and limitations. One unexplained fast run is
not a database decision.

## Recommended Next Page

Turn the evidence into design reasoning with [Database Interview Exercises](./DATABASE-INTERVIEW-EXERCISES.md),
then revisit [Indexes And Query Plans](./INDEXES-QUERY-PLANS.md) for production diagnostics.
