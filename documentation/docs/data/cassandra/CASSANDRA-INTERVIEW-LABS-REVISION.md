---
title: Cassandra Interview Labs And Revision
description: Architect interview answers, production scenarios, hands-on exercises, calculations, and a completion checklist for Cassandra.
difficulty: Advanced
page_type: Revision Sheet
status: Generic
prerequisites: [Cassandra architecture, modeling, storage, and operations]
learning_objectives: [Recall Cassandra internals, Defend design choices, Practise production diagnosis]
technologies: [Apache Cassandra, CQL, nodetool]
last_reviewed: "2026-07-23"
---

# Cassandra Interview Labs And Revision

## Two-Minute Mental Model

```text
query -> partition key -> token -> replica set
write -> coordinator -> commit log + memtable -> SSTables -> compaction
read  -> coordinator -> replicas -> memtable/SSTable reconciliation
correctness -> replication + consistency + timestamps + repair
operations -> bounded partitions + disk headroom + compaction + backup/restore
```

## Top Interview Questions

**Why is Cassandra fast for writes?** Replicas append to commit logs and update
memtables; immutable SSTables are flushed later. Distribution and sequential I/O
help, but compaction, replication, and repair remain deferred costs.

**Partition key versus clustering columns?** The partition key selects token and
replicas. Clustering columns order and range rows within that partition.

**Why query-first modeling?** Cassandra efficiently serves known partition and
clustering access paths; joins and arbitrary filtering are not the runtime model.

**What is a coordinator?** Any node receiving a client request; it routes work to
the correct replicas and applies consistency requirements.

**What does `LOCAL_QUORUM` mean with RF=3?** Two replicas in the local data center
must acknowledge/respond.

**Hints versus repair?** Hints are best-effort missed-write replay. Repair is the
anti-entropy process that systematically compares replica ranges.

**Why do tombstones exist?** A distributed delete must propagate as a versioned
fact so an offline replica's old value does not resurrect.

**When can tombstones disappear?** After grace eligibility and a compaction that can
prove safe removal, coordinated with repair and replica state.

**STCS, LCS, TWCS?** STCS favors write-heavy similar files, LCS bounds overlap for
reads at write-amplification cost, and TWCS groups immutable time windows for
TTL/time-series workloads. Modern deployments may also evaluate UCS.

**Is a logged batch a transaction?** It is not a relational isolated transaction
or throughput tool; use it only for the documented atomic mutation requirement.

**When use LWT?** For a narrow conditional invariant that justifies Paxos latency
and contention, not routine writes or cross-partition transactions.

**Why can adding nodes fail to fix latency?** Hot logical partitions, tombstone
scans, poor queries, compaction, disk, or client behavior may remain bottlenecks.

## Production Questions

### Repair has not completed before `gc_grace_seconds`

Treat this as a correctness risk. Restore repair coverage safely before tombstones
can be purged, investigate capacity/scheduling, and do not simply reduce grace or
force compaction.

### A time-series table has millions of tombstones

Check TTL variation, bucket size, TWCS suitability, late writes, repair state,
compaction windows, and query ranges. Redesign lifecycle and tables; threshold
changes only hide symptoms.

### One data center is disconnected

Define which writes/reads continue from configured local consistency and RF, bound
hint accumulation, monitor cross-DC recovery, prevent conflicting ownership policy,
and run validated repair after connectivity returns.

### A node is permanently lost

Verify replica availability and backups, use the documented replace-address/node
lifecycle, monitor streaming and capacity, then validate ownership and repair.

## Hands-On Labs

1. Create a three-node development cluster and observe token/rack ownership.
2. Model telemetry by device/day; calculate peak partition rows and bytes.
3. Run the same read at `ONE` and `LOCAL_QUORUM` while a replica is unavailable.
4. Generate updates/deletes, inspect SSTables/tombstone metrics, and observe compaction.
5. Compare a query table with a secondary-index approach under skew.
6. Take a snapshot, copy it independently, and restore into a clean test cluster.
7. Simulate one lost node and document replacement evidence.
8. Create a hot partition, measure tail latency, and redesign the key.
9. Run repair under load and measure network, disk, and application impact.
10. Implement the same table with Spring repository and template APIs.

## Design Exercise

Design a shipment-location history service. Provide:

- exact commands and queries;
- tables and primary keys;
- bucket strategy and maximum partition estimate;
- RF/data centers and read/write consistency;
- TTL, compaction, repair, backup, and restore policy;
- duplicate, late, out-of-order, and clock behavior;
- Spring adapter, tests, metrics, and incident runbook;
- rejected relational, Kafka-only, and search-store alternatives.

## Completion Checklist

- explain ring/tokens, coordinator, gossip, failure detection, replicas, and racks;
- trace write/read/storage/compaction paths;
- model query tables and bounded partitions without `ALLOW FILTERING` dependence;
- explain quorums, conflicts, hints, read repair, anti-entropy repair, and LWT;
- choose compaction/index/view policy from evidence;
- operate repair, backup/restore, replacement, upgrades, and security;
- diagnose hot partitions, tombstones, disk, timeouts, unavailable errors, and inconsistency;
- integrate Spring while preserving Cassandra semantics.

## Official References

- [Apache Cassandra documentation](https://cassandra.apache.org/doc/latest/)
- [CQL](https://cassandra.apache.org/doc/latest/cassandra/developing/cql/index.html)
- [Operating Cassandra](https://cassandra.apache.org/doc/latest/cassandra/managing/operating/index.html)

## Recommended Next

Apply the database through [Spring Data Cassandra](../../spring/SPRING-DATA-CASSANDRA.md).

