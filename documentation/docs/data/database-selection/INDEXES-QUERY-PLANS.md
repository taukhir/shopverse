---
title: Indexes And Query Plans
sidebar_position: 5
difficulty: Intermediate
page_type: Practical Guide
status: Generic
learning_objectives: [Choose an index type from a query, Detect under-indexing and over-indexing, Verify index effectiveness with query plans and statistics]
technologies: [PostgreSQL, MySQL, MariaDB, SQL Server, Oracle Database, Db2, MongoDB, Cassandra]
last_reviewed: "2026-07-11"
---

# Indexes And Query Plans

An index is an additional data structure that makes selected reads cheaper in
exchange for storage, memory, write amplification, maintenance, and operational
complexity. Index the workload—not individual columns in isolation.

## Start From A Query

For every slow or critical query, record:

1. predicates and their selectivity;
2. join keys;
3. requested sort/group order;
4. returned columns and row count;
5. execution frequency and p95/p99 latency;
6. write rate and acceptable index-maintenance cost.

Example:

```sql
SELECT id, event_type, created_at
FROM outbox_events
WHERE status = 'PENDING'
  AND created_at < :cutoff
ORDER BY created_at
LIMIT 100;
```

A useful composite index is commonly `(status, created_at)`: equality first,
then range/order. The exact choice must be proven with data distribution and a plan.

## Major Index Types

| Type | Good for | Main limitation |
|---|---|---|
| B-tree | equality, range, sorting, prefix of composite keys | adds write/storage cost; poor for arbitrary contains search |
| hash | equality lookup | normally no range/order support; product-specific behavior |
| bitmap | low-cardinality analytical predicates, especially combined | write/concurrency cost often makes it unsuitable for hot OLTP |
| clustered index | stores rows in index-key order or makes the primary index the row organization | only one physical organization; random/wide keys can be costly |
| nonclustered/secondary | additional access paths | lookup back to row/primary key and write amplification |
| covering/include | satisfies a query from the index without table lookup | wider index consumes cache/storage and costs more to update |
| partial/filtered | indexes only rows matching a stable predicate | query must imply the predicate; portability varies |
| expression/function-based | queries using normalized/computed expressions | expression must match; function/locale semantics matter |
| unique | fast lookup plus a data invariant | failed/conflicting writes and migration cleanup must be planned |
| full-text/inverted | words, tokens, relevance, contains-like search | not general relational ordering; language analysis matters |
| spatial | intersection, containment, nearest spatial objects | specialized operators, types, and coordinate systems |
| GIN/GiST/SP-GiST | PostgreSQL JSONB, arrays, ranges, text, spatial/specialized operators | method-specific build, update, size, and query trade-offs |
| BRIN | very large physically correlated tables such as append-only time data | lossy ranges need rechecks; poor when physical order is random |
| columnstore | analytical scans and compression | not the default for small point-update OLTP |
| vector ANN | nearest embedding search using HNSW/IVF-like structures | recall, memory, build/update, filtering, and reindex trade-offs |

MongoDB uses B-tree-style indexes including compound, multikey, text, geospatial,
hashed, wildcard, partial, sparse, TTL, and unique variants. Cassandra primary-key
layout is the first access path; secondary-index features do not turn Cassandra
into an ad hoc SQL engine. Elasticsearch/OpenSearch inverted indexes are core
storage structures, not optional relational-style indexes.

## Composite Index Ordering

For `(tenant_id, status, created_at)`, the leading-column prefix normally supports:

```text
tenant_id
tenant_id + status
tenant_id + status + created_at
```

It generally does not efficiently support `status` alone. Put equality columns
that define the access path before range columns, then consider sort order and
selectivity. This is guidance, not a universal formula: skip scans, bitmap
operations, index intersection, statistics, and engine capabilities vary.

Avoid redundant prefixes such as both `(tenant_id)` and
`(tenant_id, status)` unless measurements show the smaller index is valuable.

## Under-Indexing

Symptoms include:

- repeated large table scans for selective queries;
- high rows-read compared with rows-returned;
- expensive sorts, temporary tables, hash spills, or excessive random I/O;
- nested-loop joins repeatedly scanning an unindexed inner table;
- lock duration and CPU rising because updates first search too much data;
- foreign-key parent deletes/updates scanning an unindexed child key;
- p99 latency growing rapidly with table size.

Possible fixes include a composite, covering, partial/filtered, expression, or
specialized index; query/schema correction; partition pruning; or an appropriate
search/analytical read model. Adding a single-column index to every predicate is
usually not the answer.

## Over-Indexing

Symptoms include:

- inserts, updates, deletes, bulk loads, vacuum/compaction, or replication slowing;
- high storage, backup, cache, checkpoint, WAL/redo, and recovery volume;
- several indexes sharing the same leading keys or covering the same query;
- indexes with no meaningful seeks/scans over a representative business cycle;
- update-heavy columns appearing in many indexes;
- large covering indexes kept only for rare reports;
- longer migrations, rebuilds, failover recovery, and statistics maintenance.

Do not drop an apparently unused index immediately. It may enforce uniqueness,
support a foreign key, serve a monthly/incident query, exist only on a replica,
or have statistics reset after restart. Observe a full workload cycle, inspect
constraints and plans, and use a reversible change with monitoring.

## Verify Whether An Index Is Used

### PostgreSQL

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT ...;

SELECT schemaname, relname, indexrelname, idx_scan,
       idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan;
```

Look for `Index Scan`, `Index Only Scan`, `Bitmap Index Scan`, estimates versus
actual rows, loops, buffers, sort spills, and total execution time. A sequential
scan is correct when the table is small or the query returns much of it. `ANALYZE`
executes the statement—wrap mutating statements safely or use plan-only analysis.

### MySQL And MariaDB

```sql
EXPLAIN ANALYZE
SELECT ...;

EXPLAIN FORMAT=JSON
SELECT ...;
```

Inspect chosen `key`, possible keys, access type, estimated/actual rows, loops,
filtering, covering-index use, temporary tables, and filesort. Use Performance
Schema/sys schema statement and index-usage views over a representative period.

### SQL Server

Use the **actual execution plan**, Query Store, and DMVs such as
`sys.dm_db_index_usage_stats` and `sys.dm_db_index_operational_stats`. Inspect
index seeks/scans, key lookups, estimated versus actual rows, spills, implicit
conversions, and missing-index suggestions. Treat suggestions as clues: they do
not account fully for write cost, overlap, filtered indexes, or the whole workload.

### Oracle Database

Use `EXPLAIN PLAN` for estimates and `DBMS_XPLAN.DISPLAY_CURSOR` with runtime
statistics for actual execution. Inspect access/full-scan operations, cardinality,
predicate information, buffer gets, partition pruning, and bind-sensitive plans.
Views such as `V$SQL_PLAN` and index monitoring/usage facilities require suitable
privileges and interpretation over a representative window.

### IBM Db2

Use `EXPLAIN` facilities and tools such as `db2exfmt` to inspect table/index
access, join methods, cardinality estimates, sorts, and cost. Catalog and
monitoring views expose index and statement activity; exact commands differ
across Db2 platforms and versions.

### MongoDB

```javascript
db.orders.find({customerId: 42, status: "OPEN"})
  .sort({createdAt: -1})
  .explain("executionStats")
```

Compare `IXSCAN` versus `COLLSCAN`, winning/rejected plans, keys examined,
documents examined, documents returned, execution time, in-memory sort, and
whether a fetch is required. Use profiler/query analytics carefully to avoid
capturing sensitive values or creating production overhead.

## Why A Valid Index May Not Be Chosen

- the query returns a large fraction of the table;
- the table is small enough that a scan is cheaper;
- stale or inaccurate statistics mislead the optimizer;
- an implicit cast, collation mismatch, or function hides the indexed column;
- the composite leading columns are missing;
- parameter-sensitive plans or bind values change selectivity;
- an `OR`, wildcard prefix, negative predicate, or low-cardinality filter is weak;
- data correlation or skew is not represented in statistics;
- index/table bloat, cache state, or random I/O changes the cost;
- partition pruning or a better competing index wins.

Do not force an index before understanding the optimizer's choice. Refresh
statistics, correct types and predicates, test representative parameters, and
compare elapsed time, CPU, I/O, locks, and p95/p99—not merely the plan node name.

## Safe Index Review Process

1. Capture top queries by total load and tail latency.
2. Obtain actual plans with production-shaped parameters and data.
3. Identify scans, lookups, sorts, spills, misestimates, and contention.
4. Design the smallest index that supports a repeated valuable access pattern.
5. Estimate storage and write amplification before creation.
6. Create online/concurrently where supported and operationally safe.
7. Re-run plans and load tests; compare reads, CPU, writes, latency, and storage.
8. Monitor through a full business cycle.
9. Consolidate redundant indexes and document the owner/query for important ones.

Continue with [Database And Query Optimization](./DATABASE-QUERY-OPTIMIZATION.md)
for query rewrites, Bloom filters, connections, caching, engine maintenance, and
before/after performance verification.
