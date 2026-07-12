---
title: Database Decision Worksheet
sidebar_position: 2
difficulty: Beginner
page_type: Decision Guide
status: Generic
keywords: [OLTP, online transaction processing, OLAP, online analytical processing, NoSQL, non-relational database, sharding, horizontal partitioning, vector database, embeddings]
learning_objectives: [Turn workload requirements into database criteria, Produce and validate a database shortlist, Record rejected alternatives]
technologies: [MySQL, PostgreSQL, CockroachDB, Cassandra, MongoDB, DynamoDB, ClickHouse, pgvector]
last_reviewed: "2026-07-12"
---

# Database Decision Worksheet

Complete this worksheet before comparing products. A database wins because it
fits measured requirements, not because it is familiar or popular.

## 1. Describe The Workload

| Question | Answer to record |
|---|---|
| business capability | What truth does this database own? |
| read/write ratio | Average and peak reads/writes per second; identify bursts |
| workload | OLTP, OLAP, search, cache, graph, vector, or a deliberate mixture |
| volume and growth | Current rows/bytes, item size, daily growth, retention, and three-year estimate |
| query types | Exact point, range, join, aggregation, full-text, traversal, or similarity queries |
| transactions | Invariants, transaction boundary, isolation, constraints, and conflict rate |
| latency | p50, p95, and p99 targets for each critical operation |
| regions | User/data locations, residency, failover region, RTO, and RPO |
| consistency | Required read-your-writes, ordering, staleness bound, and partition behavior |
| distribution | Replication, partitioning, sharding, hot-key risk, and rebalance expectations |
| governance | PII, encryption, RBAC, audit evidence, retention, deletion, and masking |
| operations | Managed/self-hosted, team skills, backups, restores, upgrades, and on-call support |
| cost | License, compute, storage, IOPS, backup, network egress, support, and staff time |

Write the five most important access patterns as concrete statements, for
example: `fetch the newest 50 messages for conversation_id ordered by sent_at`.
Include expected cardinality and frequency. “Flexible queries” is not specific
enough to design a key, index, or partition.

## 2. Set Non-Negotiable Gates

Eliminate a candidate when it cannot meet a mandatory requirement without
building a fragile database inside the application.

| Mandatory requirement | Candidates to investigate first |
|---|---|
| multi-row ACID, constraints, and joins | PostgreSQL, MySQL/MariaDB, SQL Server, Oracle, Db2 |
| globally distributed relational transactions | CockroachDB; also evaluate managed distributed SQL products |
| extreme partition-key-driven write ingestion | Cassandra or DynamoDB |
| aggregate-oriented documents | PostgreSQL JSONB first; MongoDB when document access dominates |
| full-text relevance and facets | Elasticsearch/OpenSearch as a derived index |
| large analytical scans and aggregation | ClickHouse or another OLAP platform |
| relationship traversal | Neo4j or another graph database |
| embedding similarity | pgvector first; dedicated vector database when scale/isolation justifies it |
| embedded local storage | SQLite |

Redis, search, OLAP, and vector stores are normally specialist projections, not
the authoritative home for orders, balances, inventory, or permissions.

## 3. Build A Weighted Scorecard

Assign each criterion a weight totaling 100. Score every surviving candidate
from **1 (poor)** to **5 (strong)** and multiply score by weight. A high score
does not override a failed mandatory gate.

| Criterion | Suggested weight | Candidate A | Candidate B | Candidate C |
|---|---:|---:|---:|---:|
| correctness and transactions | 20 |  |  |  |
| critical query fit | 18 |  |  |  |
| peak read/write performance | 12 |  |  |  |
| volume, growth, and distribution | 10 |  |  |  |
| consistency and regional behavior | 10 |  |  |  |
| resilience, backup, and restore | 10 |  |  |  |
| security and audit | 8 |  |  |  |
| operability and team skills | 7 |  |  |  |
| total cost and support | 5 |  |  |  |
| **weighted total** | **100** |  |  |  |

Do not score from marketing claims. Attach query plans, load results, failover
observations, restore time, and cost assumptions as evidence.

## 4. Produce The Shortlist

Use this sequence:

1. Remove candidates that fail a non-negotiable gate.
2. Prefer one general-purpose relational system when it meets the requirements.
3. Rank the remaining candidates with the weighted scorecard.
4. Keep the top two or three for a production-shaped proof of concept.
5. Add a specialist database only for an access pattern the system of record
   cannot satisfy safely and economically.
6. Re-score after failure, restore, skew, maintenance, and cost tests.

The output should look like this:

```text
Decision: PostgreSQL is the system of record.
Shortlist: PostgreSQL (430/500), MySQL (395/500), CockroachDB (350/500).
Why: multi-row inventory transactions, complex joins, JSONB attributes,
      one primary region, and existing operational skill.
Rejected: MySQL lacks no mandatory feature, but scored lower for this query set.
          CockroachDB adds consensus and operational cost without a multi-region need.
Revisit when: active-active regional writes become mandatory or p99 exceeds the SLO
              after schema, index, query, and capacity optimization.
```

## 5. Example: Commerce Platform

Assume 85% reads, 15% writes; short OLTP transactions; product JSON attributes;
complex operational joins; one write region; 500 million rows in three years;
strict inventory/payment correctness; and a managed-service requirement.

- **Shortlist:** PostgreSQL and MySQL for authoritative OLTP.
- **Likely choice:** PostgreSQL if JSONB, rich indexing, or complex SQL is heavily
  weighted; MySQL remains credible for straightforward, read-heavy web OLTP.
- **Derived stores:** OpenSearch for discovery and ClickHouse for heavy analytics.
- **Rejected:** Cassandra because transactions and joins dominate; MongoDB because
  the core invariants cross aggregates; CockroachDB because global writes are not required.

## Validation Checklist

- Test production-shaped data volume, skew, concurrency, and peak bursts.
- Capture p50/p95/p99, throughput, lock waits, CPU, memory, I/O, and pool queues.
- Verify critical query plans and index maintenance cost.
- Exercise node/region loss, stale replicas, rebalance, backup, and restore.
- Verify least privilege, encryption, audit completeness, deletion, and residency.
- Document assumptions, evidence, rejected alternatives, owner, and review date in an ADR.

## Recommended Next Page

Use [Relational Databases](./RELATIONAL-DATABASES.md) for the default shortlist,
or [Distributed SQL And NoSQL](./DISTRIBUTED-SQL-NOSQL.md) when distribution is a
mandatory gate. Then prove the choice in [Database Hands-On Labs](./DATABASE-HANDS-ON-LABS.md).
