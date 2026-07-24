---
title: Cassandra Storage Compaction Tombstones And Indexes
description: Commit log, memtables, SSTables, read path, caches, Bloom filters, compaction strategies, tombstones, SAI, secondary indexes, and materialized views.
difficulty: Advanced
page_type: Deep Dive
status: Generic
prerequisites: [Cassandra CQL data modeling]
learning_objectives: [Trace storage paths, Select compaction and indexing, Diagnose tombstone and SSTable amplification]
technologies: [Apache Cassandra, SSTable, Bloom Filter, SAI]
last_reviewed: "2026-07-23"
---

# Cassandra Storage Compaction Tombstones And Indexes

## Write Path

Each replica appends a mutation to the commit log and updates an in-memory memtable.
The replica can acknowledge according to durability configuration without waiting
for an SSTable flush.

```text
mutation -> commit log append -> memtable update -> acknowledgement
                               `-> later flush -> immutable SSTable
```

Commit-log segments are recycled after their covered memtables flush. A flush is
not compaction: flushing creates another immutable SSTable; compaction later merges
SSTables.

## SSTable Components

SSTables hold sorted immutable data plus supporting structures. Conceptually:

- data component containing partitions and rows;
- primary/partition index and summaries for locating data;
- per-SSTable Bloom filter for probable key membership;
- compression metadata and statistics;
- checksums and table-specific metadata.

A Bloom filter can say “definitely absent” or “possibly present.” False positives
cause an unnecessary lookup; false negatives should not occur for represented keys.
It does not accelerate arbitrary non-key predicates.

## Read Path

The replica reconciles versions from relevant memtables and SSTables:

```text
partition key -> row/key caches where enabled -> memtables
              -> Bloom filters/index summaries -> candidate SSTables
              -> merge cells/tombstones by timestamp -> result
```

Many overlapping SSTables increase read amplification. Large partitions, broad
ranges, tombstones, cache churn, disk latency, and replica speculation can dominate
tail latency.

## Compaction

Compaction merges immutable SSTables, reconciles versions, and can reclaim obsolete
data when it is safe. It consumes disk bandwidth, CPU, temporary space, and write
capacity. Plan headroom for old inputs and new outputs to coexist.

| Strategy | Best fit | Main trade-off |
|---|---|---|
| Unified Compaction Strategy | modern general workloads where supported | tune/test for workload and version |
| Size-Tiered (STCS) | write-heavy similarly sized SSTables | higher space/read amplification |
| Leveled (LCS) | read-heavy workloads needing bounded overlap | greater write amplification |
| Time-Window (TWCS) | TTL/time-series tables with immutable time windows | late/out-of-order writes and mixed TTLs hurt reclamation |

Select per table from write rate, update pattern, read latency, TTL, disk capacity,
repair, and measured amplification. Do not switch strategy during an incident
without estimating rewrite and temporary-space cost.

## Tombstones And Zombie Data

Cassandra records deletion as a timestamped tombstone so every replica can learn
the deletion. TTL expiration also produces tombstones. A tombstone is eligible for
purging only after its grace policy and when compaction has enough information to
prove older shadowed data cannot reappear.

If a replica misses a delete and repair does not reconcile it before tombstones are
purged, old data can reappear during later repair—the zombie-data failure.
Therefore `gc_grace_seconds`, repair cadence, node downtime, backup/restore, and
compaction policy form one correctness decision.

Tombstone-heavy reads can scan large discarded ranges, causing latency and failure.
Prevent them through bounded partitions, suitable TTL/bucketing, query-specific
tables, and compaction—not by raising warning/failure thresholds blindly.

## Secondary Index Choices

The primary key remains the first Cassandra access path. Index options vary by
supported Cassandra release and distribution; verify the deployed version.

### Storage-Attached Indexing (SAI)

SAI supports selected non-primary-key predicates with indexes integrated into the
storage lifecycle. Evaluate cardinality, selectivity, conjunctions, update rate,
index build/rebuild, disk, compaction, and worst-case query fan-out. It does not
make joins or unbounded analytics appropriate.

### Legacy Secondary Indexes

Traditional local secondary indexes can perform poorly when a query must contact
many nodes or matches many values. Low-selectivity columns such as status often
produce expensive distributed reads. Prefer a query table when the access pattern
is stable and critical.

### SASI And Distribution-Specific Features

Support and recommendation vary by Cassandra version/vendor. Do not adopt an index
because CQL syntax accepts it; verify lifecycle, upgrade, backup, and operational
support for the exact distribution.

## Materialized Views

Materialized views maintain an alternate primary-key projection asynchronously
inside Cassandra. They reduce application write code but introduce hidden write,
repair, rebuild, consistency, and operational behavior. Feature maturity and
limitations vary by release.

For critical projections, explicit application/stream-managed tables often provide
clearer ownership, backfill, retry, and reconciliation. If using views, test node
failure, updates to key-related fields, repair, rebuild, and upgrades.

## Observability

Track SSTable count, read/write latency, partition size, tombstones scanned,
compaction pending/completed, bytes compacted, flush pressure, dropped mutations,
commit-log usage, cache hit rate, disk latency/space, and index query/build metrics.
Correlate table metrics with exact queries and token ranges.

## Interview Questions

**Does Cassandra update an SSTable in place?** No. New versions go through the
write path and immutable SSTables; reads/compaction reconcile them.

**Does `gc_grace_seconds` delete tombstones immediately?** No. It controls
eligibility; safe purging still depends on compaction and replica/repair state.

**Why can Bloom filters not solve a `WHERE status=?` query?** They test partition-key
membership per SSTable, not arbitrary value search.

**LCS versus TWCS?** LCS controls overlap for read-heavy mutable data; TWCS groups
time periods for TTL/time-series reclamation. Workload evidence decides.

## Official References

- [Cassandra storage engine](https://cassandra.apache.org/doc/latest/cassandra/architecture/storage-engine.html)
- [Compaction](https://cassandra.apache.org/doc/latest/cassandra/managing/operating/compaction/index.html)
- [Compaction and tombstones](https://cassandra.apache.org/doc/latest/cassandra/managing/operating/compaction/overview.html)
- [Storage-Attached Indexing](https://cassandra.apache.org/doc/latest/cassandra/developing/cql/indexing/sai/sai-concepts.html)

## Recommended Next

Continue with [Operations, Capacity, Repair, Backup, And Incidents](./CASSANDRA-OPERATIONS-CAPACITY.md).

