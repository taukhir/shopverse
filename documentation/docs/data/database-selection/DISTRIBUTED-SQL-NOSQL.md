---
title: Distributed SQL And NoSQL
sidebar_position: 2
difficulty: Intermediate
page_type: Comparison
status: Generic
learning_objectives: [Compare distributed SQL wide-column document and key-value models, Design partition-key-driven access]
technologies: [CockroachDB, Cassandra, MongoDB, DynamoDB]
last_reviewed: "2026-07-11"
---

# Distributed SQL And NoSQL

These databases solve different distribution and data-model problems. Choose
them only when the workload benefits from their constraints.

| Database | Model and best fit | Read/write profile | Native distribution | Main risk |
|---|---|---|---|---|
| CockroachDB | distributed SQL for global relational OLTP | both; writes pay consensus latency | replicated ranges split and rebalance | hot ranges and cross-region transactions |
| Cassandra | wide-column for telemetry/events at extreme scale | write-heavy; fast bounded partition reads | token partitioning and peer replication | hot/unbounded partitions, tombstones, repair |
| MongoDB | documents for bounded aggregates | both when one document serves the request | replica sets and shard keys | scatter-gather, growing documents, cross-document transactions |
| DynamoDB | managed key-value/document | both at huge key-driven scale | service-managed partitions | hot keys, scans, index skew, unexpected cost |

## CockroachDB

CockroachDB offers distributed ACID SQL. Key ranges are replicated using
consensus, split as data grows, and move across nodes. It fits relational systems
that truly need node/zone resilience or multi-region placement. Serializable
cross-range and cross-region transactions remain correct but add coordination
latency. PostgreSQL wire compatibility is not complete PostgreSQL equivalence.

## Cassandra

Cassandra writes to a commit log and memtable, flushes immutable SSTables, and
uses compaction and repair to maintain replicas. Model tables from queries:
choose a high-cardinality partition key, bound partition growth—often with time
buckets—and use clustering columns for ordered reads. It has no relational joins
and is a poor fit for ad hoc filtering or frequent multi-row transactions.

## MongoDB

MongoDB stores BSON documents using WiredTiger, indexes, journaling, replica
sets, and optional sharding. Embed bounded one-to-few data that changes with its
aggregate; reference independent or unbounded entities. Schema validation still
protects invariants. Multi-document transactions exist, but frequent use may
indicate that the aggregate or database model is wrong.

## DynamoDB

DynamoDB routes items by partition key and optional sort key. Secondary indexes
add access paths and write/storage cost. On-demand or provisioned capacity handles
large and bursty traffic, but the service cannot rescue a hot key. Avoid scans;
design every request around a bounded key/index operation. Cloud IAM, encryption,
backups, recovery, and audit logs are part of the surrounding design.

## Selection Rule

- Need relational joins and distributed transactions: **CockroachDB**.
- Need enormous append-oriented writes with known partition queries: **Cassandra**.
- Need bounded variable-shaped aggregates: **MongoDB**.
- Need fully managed elastic key access: **DynamoDB**.

If one PostgreSQL or MySQL primary already satisfies the SLO, it is usually the
simpler and safer design.
