---
title: Cassandra Production Interview Scenarios
description: Practice partition modeling, consistency, tombstone, repair, compaction, hot-partition, LWT, and multi-datacenter Cassandra scenarios.
difficulty: Advanced
page_type: Workbook
status: maintained
prerequisites: [Cassandra architecture, CQL data modeling, Cassandra operations]
learning_objectives: [Design tables from queries, Select consistency levels, Diagnose storage and repair failures, Plan multi-datacenter recovery]
technologies: [Apache Cassandra, CQL, Spring Data Cassandra]
last_reviewed: "2026-07-30"
scope: generic
owner: docs-data
reviewer: documentation-maintainers
review_evidence: official-documentation-and-repository-audit
---

# Cassandra Production Interview Scenarios

Start with the exact queries, partition-key distribution, clustering order, maximum partition size, replication
strategy, and required consistency. Cassandra does not rescue a relational model copied into wide rows.

## Ten Scenarios

### 1. How do you model an order timeline?

Create a query-specific table keyed by customer/order plus a time bucket, cluster by event time and a deterministic
tiebreaker, estimate partition growth, and define paging and retention before writing CQL.

### 2. Why is one partition hot?

The partition key has low cardinality or skew, such as tenant-only or current-date-only routing. Add a justified
bucket/shard dimension and accept that reads may fan out across bounded buckets.

### 3. What does `QUORUM` mean?

It requires responses from a quorum of replicas for the operation's scope. Discuss `LOCAL_QUORUM` for multi-DC
latency and availability, and use `R + W > RF` only as a starting condition—not a complete stale-read proof.

### 4. Timeout versus unavailable?

Unavailable means the coordinator knows insufficient replicas are alive. Timeout means enough may exist but did
not respond before the deadline. Retries require idempotency, budget, and coordinator/downstream evidence.

### 5. Why do tombstones cause latency?

Deletes and TTL expiry create tombstones that reads may scan until compaction can safely purge them. Fix the query
and data model, retention, compaction, and repair discipline rather than only raising warning thresholds.

### 6. How can deleted data reappear?

If a replica misses a tombstone and remains unrepaired beyond `gc_grace_seconds`, compaction may purge deletion
evidence and later repair can resurrect the old value as zombie data. Align repair completion and grace policy.

### 7. How do you choose a compaction strategy?

Match overwrite pattern, TTL/time-series behavior, read amplification, space amplification, and operational goals.
TimeWindowCompactionStrategy commonly fits time-bucketed expiring data; validate with real workload evidence.

### 8. When should you use lightweight transactions?

Use LWT/Paxos for a narrow compare-and-set invariant that cannot be modeled otherwise. It adds coordination and
latency; do not use it as a substitute for sound partition ownership or general multi-row transactions.

### 9. How do you operate multi-datacenter Cassandra?

Use `NetworkTopologyStrategy`, local consistency for normal traffic, deliberate failover policy, repair in every
DC, capacity for loss, and tested client/DC recovery. Define conflict and recovery semantics before active-active use.

### 10. What must backup and restore prove?

Snapshots alone are not a complete restore plan. Preserve schema, incremental data/commit logs as required,
credentials and topology metadata; restore into isolation and verify data, consistency, RPO, RTO, and repair.

## Official References

- [Apache Cassandra architecture](https://cassandra.apache.org/doc/latest/cassandra/architecture/overview.html)
- [Apache Cassandra repair](https://cassandra.apache.org/doc/latest/cassandra/managing/operating/repair.html)
- [Apache Cassandra tombstones](https://cassandra.apache.org/doc/latest/cassandra/managing/operating/compaction/tombstones.html)
- [Apache Cassandra compaction](https://cassandra.apache.org/doc/latest/cassandra/managing/operating/compaction/index.html)

## Recommended Next

Review [Architecture And Consistency](./CASSANDRA-ARCHITECTURE-CONSISTENCY.md),
[CQL Data Modeling](./CASSANDRA-CQL-DATA-MODELING.md), and [Operations And Capacity](./CASSANDRA-OPERATIONS-CAPACITY.md).
