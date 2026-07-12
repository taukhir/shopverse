---
title: Scaling, CAP, And Data Distribution
sidebar_position: 6
difficulty: Advanced
page_type: Concept
status: Generic
learning_objectives: [Distinguish replication partitioning and sharding, Apply CAP without static product labels, Choose safe partition keys]
technologies: [CockroachDB, Cassandra, MongoDB, DynamoDB, Redis, Elasticsearch, OpenSearch]
last_reviewed: "2026-07-11"
---

# Scaling, CAP, And Data Distribution

## CAP Applies During A Partition

![CAP theorem database placement showing typical CP and AP modes with configuration-dependent systems](/img/diagrams/database-cap-placement.svg)

During a network partition, a distributed system cannot guarantee both
linearizable consistency and a successful response from every reachable node.
Partition tolerance is unavoidable in a multi-node network; the behavior during
the partition is typically CP or AP.

| Mode | Typical deployment behavior | Examples, not permanent labels |
|---|---|---|
| CP | reject or delay operations lacking quorum to avoid conflicting truth | CockroachDB quorum; MongoDB majority writes; fenced relational primary |
| AP | accept reachable operations and tolerate staleness/conflict | Cassandra at low consistency; DynamoDB eventual reads; conflict-tolerant replicas |
| configurable | operation, consistency level, quorum, and topology change behavior | Cassandra, MongoDB, DynamoDB, Redis, Elasticsearch/OpenSearch |
| CA while connected | consistent and available without a network partition | one SQLite/MySQL/PostgreSQL instance, but not a partition-tolerant service |

CAP does not describe latency in normal operation. Use PACELC and explicit
consistency/SLO analysis. Oracle, Db2, SQL Server, Neo4j, ClickHouse, and vector
databases also depend on exact clustering and client settings; do not put a
product logo at one universal point.

See [Consistency Models And BASE](./CONSISTENCY-MODELS-BASE.md) for eventual and
weak consistency, soft state, session guarantees, quorums, and conflict resolution.

## Replication, Partitioning, And Sharding

- **Replication** copies data for availability, recovery, or read scale. It does
  not normally divide write ownership.
- **Table partitioning** splits one logical table for pruning, retention, and
  maintenance. It does not necessarily distribute compute.
- **Sharding** assigns data subsets to independent ownership/compute domains. It
  scales storage/writes but makes cross-shard queries and transactions expensive.

| Database | Distribution posture | Main design risk |
|---|---|---|
| relational engines | replicas and table partitioning; write sharding varies | routing, global keys, cross-shard joins/transactions |
| CockroachDB | automatic replicated range splitting and placement | hot ranges and cross-region consensus |
| Cassandra | partition keys map to token ranges | hot/unbounded partitions, repair, tombstones |
| MongoDB | range/hashed shard keys and zones | low-cardinality or monotonic keys, scatter-gather |
| DynamoDB | managed partitions behind keys | hot keys, throttling/cost, index skew |
| Redis Cluster | key hash slots | hot keys, memory imbalance, cross-slot operations |
| Elasticsearch/OpenSearch | explicit primary shards and replicas | oversharding, hot shards, relocation and merges |
| ClickHouse | partitions, shards, replicas | too many partitions, skew, query fan-out |
| vector stores | engine-specific collection/index sharding | tenant skew, filters, recall after sharding |

## Choose A Partition Key

A good key has high cardinality, even traffic and storage distribution, bounded
per-key growth, locality for common transactions, and a tested resharding path.
A random key spreads load but can destroy range locality. A sequential or tenant-
only key can create a hot shard. Test skew and failures at peak load.

## Scaling Checklist

- Measure before sharding; scale up and optimize first when economical.
- Define replica lag and which reads may be stale.
- Include failure headroom, compaction/repair/merge load, and rebalancing traffic.
- Test failover fencing, split brain prevention, backup restore, and regional loss.
- Monitor hot keys/ranges/shards, queue depth, disk I/O, cache hit ratio, and p99 latency.

## Official References

- [PostgreSQL documentation](https://www.postgresql.org/docs/current/)
- [MySQL Reference Manual](https://dev.mysql.com/doc/refman/8.4/en/)
- [Apache Cassandra documentation](https://cassandra.apache.org/doc/latest/)
