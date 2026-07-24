---
title: Apache Cassandra Architect Learning Path
description: Complete route from Cassandra fundamentals through query-first modeling, distributed internals, storage, indexing, repair, capacity, incidents, and Spring integration.
difficulty: Advanced
page_type: Learning Path
status: Generic
prerequisites: [Distributed systems fundamentals, Database fundamentals]
learning_objectives: [Model Cassandra tables from queries, Explain consistency and storage internals, Operate and troubleshoot Cassandra safely]
technologies: [Apache Cassandra, CQL, Spring Data Cassandra]
last_reviewed: "2026-07-23"
---

# Apache Cassandra Architect Learning Path

Cassandra is a distributed wide-column database optimized for always-on,
partition-key-driven workloads across multiple nodes and failure domains. It is
not relational SQL with automatic sharding. Schema begins with exact queries,
partition size, ordering, consistency, retention, and repair requirements.

```mermaid
flowchart LR
    Query["Known query"] --> Key["Partition and clustering key"]
    Key --> Token["Token ranges and replicas"]
    Token --> Path["Read/write path"]
    Path --> Disk["Memtables, SSTables, compaction"]
    Disk --> Ops["Repair, backup, capacity, incidents"]
    Ops --> Spring["Spring Data Cassandra adapter"]
```

## When Cassandra Fits

Good candidates have very high write throughput, horizontal scale, predictable
partition-key access, multi-node availability, denormalized tables, and explicit
staleness tolerance. Common examples include telemetry, append-oriented event
history, device measurements, time-series buckets, and large per-entity timelines.

Avoid Cassandra when the workload depends on ad hoc joins, cross-partition
transactions, flexible filters, global uniqueness, frequent aggregation over
unknown dimensions, or small-scale operational simplicity.

## Complete Route

1. [Architecture, Replication, And Consistency](./cassandra/CASSANDRA-ARCHITECTURE-CONSISTENCY.md)
2. [CQL And Query-First Data Modeling](./cassandra/CASSANDRA-CQL-DATA-MODELING.md)
3. [Storage, Compaction, Tombstones, And Indexes](./cassandra/CASSANDRA-STORAGE-INDEXES.md)
4. [Operations, Capacity, Repair, Backup, And Incidents](./cassandra/CASSANDRA-OPERATIONS-CAPACITY.md)
5. [Interview, Labs, And Revision](./cassandra/CASSANDRA-INTERVIEW-LABS-REVISION.md)
6. [Spring Data Cassandra](../spring/SPRING-DATA-CASSANDRA.md)

## Completion Standard

You are complete only when you can:

- derive primary keys and tables from named queries;
- calculate quorum choices and state their failure/staleness trade-offs;
- trace writes and reads through coordinator, replicas, memtables, and SSTables;
- select compaction and indexing from workload evidence;
- prevent unbounded partitions and tombstone-heavy scans;
- calculate storage, replication, compaction, repair, and failure headroom;
- execute and explain repair, backup/restore, node replacement, and upgrades;
- diagnose unavailable errors, latency, hot partitions, disk pressure, and data inconsistency;
- implement repositories/templates without hiding Cassandra's access model.

## Official References

- [Apache Cassandra documentation](https://cassandra.apache.org/doc/latest/)
- [Cassandra architecture](https://cassandra.apache.org/doc/latest/cassandra/architecture/overview.html)
- [Spring Data for Apache Cassandra](https://docs.spring.io/spring-data/cassandra/reference/)

## Recommended Next

Begin with [Architecture, Replication, And Consistency](./cassandra/CASSANDRA-ARCHITECTURE-CONSISTENCY.md).

