---
title: Database Quick Choice
sidebar_position: 1
difficulty: Beginner
page_type: Decision Guide
status: Generic
keywords: [OLTP, online transaction processing, OLAP, online analytical processing, NoSQL, non-relational database, sharding, horizontal partitioning, vector database, vector store, embeddings]
learning_objectives: [Distinguish OLTP and OLAP, Choose a database from workload strengths, Recognize database scaling and support trade-offs]
technologies: [MySQL, PostgreSQL, Oracle Database, Db2, SQL Server, MariaDB, SQLite, CockroachDB, Cassandra, MongoDB, DynamoDB, Redis, Elasticsearch, OpenSearch, Neo4j, ClickHouse, pgvector]
last_reviewed: "2026-07-11"
---

# Database Quick Choice

Use this page to create a shortlist. Ratings describe the database's natural
workload fit, not an unconditional benchmark. Schema, indexes, consistency,
hardware, topology, query shape, data distribution, and operator skill can
change the result.

## OLTP, OLAP, And HTAP

### OLTP

**Online Transaction Processing** handles many short business transactions:
checkout, payment, inventory reservation, user registration, and account updates.
OLTP normally needs low latency, high concurrency, ACID transactions, constraints,
indexed point/range access, and normalized current data.

### OLAP

**Online Analytical Processing** handles reporting and analysis: revenue trends,
customer cohorts, annual sales, operational dashboards, and large historical
aggregations. OLAP commonly uses columnar storage, compression, large scans,
batch/stream ingestion, and denormalized or dimensional models.

### HTAP Or Mixed Workloads

**Hybrid Transactional/Analytical Processing** serves transactions and analytics
from one platform or closely integrated storage. PostgreSQL, Oracle, Db2, and SQL
Server can support moderate mixed workloads, but heavy scans can evict hot OLTP
pages, consume CPU/I/O/memory, hold resources, and damage p95/p99 transaction latency.

Keep small bounded reports in OLTP when measurements are safe. For large history
and frequent aggregations, publish data through CDC, outbox/events, or ETL into
ClickHouse or another analytical store with an explicit freshness SLO.

| Factor | OLTP | OLAP |
|---|---|---|
| purpose | execute business transactions | analyze history and trends |
| query shape | small point/range reads and writes | large scans, joins, grouping, aggregation |
| concurrency | many short operations | fewer resource-heavy operations |
| schema | usually normalized | often denormalized, star, or wide analytical tables |
| data | current operational truth | historical/derived data |
| latency | milliseconds to short seconds | seconds or longer may be acceptable |
| examples | order, payment, stock, identity | sales dashboard, cohort, forecast |
| common choices | MySQL, PostgreSQL, Oracle, Db2, SQL Server | ClickHouse and analytical platforms |

## What “Good For Reads” Means

| Read type | Natural choices |
|---|---|
| indexed OLTP point/range read | MySQL, PostgreSQL, Oracle, Db2, SQL Server |
| complex relational join | PostgreSQL, Oracle, Db2, SQL Server |
| partition-key read at distributed scale | Cassandra, DynamoDB |
| document/aggregate read | MongoDB |
| extremely low-latency key lookup | Redis |
| full-text relevance and facets | Elasticsearch/OpenSearch |
| graph traversal | Neo4j |
| large analytical scan | ClickHouse |
| embedding similarity | pgvector or a vector database |

“Good for writes” also varies: relational ACID writes, append-heavy ingestion,
distributed key writes, document-local updates, cache counters, and analytical
batches are different workloads.

## Master Capability Matrix

Legend: **Strong** = natural fit, **Good** = capable with normal design,
**Specialized** = strong only for its access model, **Limited** = possible but
not the preferred workload, **Poor** = avoid for this purpose.

| Database | Type | OLTP | OLAP | Reads | Writes | Complex queries | Huge volume | Native sharding | Partitioning | Support |
|---|---|---|---|---|---|---|---|---|---|---|
| MySQL | relational | Strong | Limited | Strong indexed | Strong primary | Good | Good scale-up | Limited/product-specific | native tables | community, commercial, managed |
| PostgreSQL | object-relational | Strong | Good | Strong/complex | Strong | Strong | Good scale-up | extension/service | native tables | community, commercial, managed |
| Oracle | enterprise relational | Strong | Strong | Strong | Strong | Strong | Strong | product/options | mature | enterprise vendor/managed |
| Db2 | enterprise relational | Strong | Good–strong | Strong | Strong | Strong | Strong | platform-specific | mature | IBM enterprise/managed |
| SQL Server | enterprise relational | Strong | Good–strong | Strong | Strong | Strong | Strong scale-up | limited/product-specific | mature | Microsoft enterprise/managed |
| MariaDB | relational | Strong | Limited | Strong indexed | Strong primary | Good | Good scale-up | product-specific | native tables | community, commercial, managed |
| SQLite | embedded relational | Local | Poor | Strong local | Serialized | Good local SQL | Limited single file | No | No | community/vendor integrations |
| CockroachDB | distributed SQL | Strong distributed | Limited | Strong key/range | Strong, consensus cost | Good SQL | Strong | Automatic ranges | automatic ranges | commercial/managed/community core |
| Cassandra | wide-column | Specialized | Poor | Strong by partition | Very strong | Poor | Very strong | Native tokens | core model | community/vendor managed |
| MongoDB | document | Good aggregate | Limited | Strong document | Strong document | Good aggregation | Strong | Native shard key | native sharding | community, commercial, managed |
| DynamoDB | key-value/document | Specialized | Poor | Strong key/index | Strong key/item | Poor | Very strong | Managed | managed keys | AWS managed support |
| Redis | in-memory | Specialized | Poor | Very strong key | Very strong key | Limited structures | Memory-bound | Cluster hash slots | hash slots | community, commercial, managed |
| Elasticsearch/OpenSearch | search index | Derived only | Good search analytics | Strong search | Good indexing | Strong search/aggregation | Strong | Native shards | index shards | community/vendor/managed |
| Neo4j | property graph | Specialized | Specialized | Strong traversal | Good graph ACID | Strong graph queries | Product-specific | Product-specific | graph placement | community, commercial, managed |
| ClickHouse | columnar OLAP | Poor | Very strong | Very strong scans | Strong batch ingest | Strong analytics | Very strong | Native distributed tables | MergeTree partitions | community, commercial, managed |
| pgvector/vector DB | vector index | Derived/specialized | Specialized | Strong similarity | Good ingestion | Poor relational unless PostgreSQL | Product-dependent | Product-dependent | collection/index dependent | community, commercial, managed |

## Quick Database Cards

### MySQL

- **Best for:** conventional web OLTP, commerce, SaaS, indexed point/range reads.
- **Read/write:** balanced OLTP; especially familiar and efficient indexed reads,
  with strong transactional writes on one primary.
- **Internals:** InnoDB clustered primary key, MVCC, redo/undo, buffer pool;
  commonly a thread-per-connection execution model.
- **Scale:** scale up, add read replicas, partition large tables; distributed
  write sharding normally needs product/platform/application design.
- **License/support:** open-source community edition plus commercial and broad managed hosting.
- **Do not choose when:** advanced SQL/extensions or transparent global writes dominate.
- **Detail:** [Relational Databases](./RELATIONAL-DATABASES.md).

### PostgreSQL

- **Best for:** complex OLTP, advanced joins/SQL, constraints, JSONB, geospatial,
  full text, arrays/ranges, and extension-driven workloads.
- **Read/write:** strong balanced OLTP, concurrent writes, and complex reads.
- **Internals:** MVCC heap versions, WAL, vacuum, rich index methods; traditionally
  process per connection, so bounded pooling is important.
- **Scale:** scale up, replicas, native table partitioning; sharding commonly uses
  extensions, services, or application boundaries.
- **License/support:** permissive open source with broad commercial/managed support.
- **Do not choose when:** native massive multi-region distribution is required
  without an additional distributed layer.

### Oracle Database

- **Best for:** mission-critical enterprise OLTP/analytics, packaged enterprise
  systems, mature HA/DR, governance, and PL/SQL ecosystems.
- **Read/write:** strong at high concurrency; mature optimizer and partitioning.
- **Scale:** scale up, partition, Data Guard, RAC and other licensed capabilities.
- **Security/audit:** mature encryption, auditing, masking/redaction, and access controls.
- **Support:** enterprise vendor and managed services; verify licenses/options explicitly.
- **Do not choose when:** cost and specialist operations are not justified.

### IBM Db2

- **Best for:** IBM Z/i/AIX estates, banking, regulated enterprise, mainframe integration.
- **Read/write:** strong enterprise OLTP and tuned mixed analytical workloads.
- **Internals:** buffer pools, logs, isolation/MVCC behavior, optimizer,
  compression, partitioning, and platform-specific clustering.
- **Security/audit:** strong governance, roles/authorities, encryption, audit, and
  platform-specific controls.
- **Support:** IBM enterprise support; capabilities vary by Db2 product and edition.
- **Do not choose when:** a small greenfield team has no IBM/platform requirement.

### Microsoft SQL Server

- **Best for:** Microsoft/.NET enterprises, line-of-business OLTP, reporting, and BI integration.
- **Read/write:** strong transactions and complex SQL; columnstore helps analytics.
- **Scale:** scale up, Always On/read offload, table partitioning; general write
  sharding is not transparent by default.
- **Security/audit:** identity integration, encryption, row security, audit, masking.
- **Support:** Microsoft commercial and managed cloud ecosystem.
- **Do not choose when:** its ecosystem/license value is absent or global native writes dominate.

### MariaDB

- **Best for:** MySQL-family web OLTP where MariaDB's ecosystem/features fit.
- **Read/write:** strong indexed reads and single-primary transactional writes.
- **Scale:** replicas, native table partitioning, and product-specific clustering.
- **Support:** open source plus commercial/managed offerings.
- **Do not choose when:** exact MySQL compatibility is assumed without testing.

### SQLite

- **Best for:** mobile, desktop, embedded, edge, tests, and application-local state.
- **Read/write:** excellent local reads; writes serialize, so not for many remote writers.
- **Scale:** distribute independent files with applications, not one clustered server.
- **Support:** open source and embedded in many platforms.
- **Do not choose when:** centralized HA, server-side access control, or high write concurrency is required.

### CockroachDB

- **Best for:** globally/distributed relational OLTP needing serializable transactions.
- **Read/write:** strong SQL reads/writes; writes pay replication and consensus latency.
- **Scale:** automatic replicated range splitting, placement, and rebalancing.
- **Partitioning/sharding:** native ranges, but hot rows/ranges and cross-region
  transactions still need locality design.
- **Support:** commercial/managed ecosystem with community-source availability.
- **Do not choose when:** one normal PostgreSQL/MySQL primary already meets the SLO.
- **Detail:** [Distributed SQL And NoSQL](./DISTRIBUTED-SQL-NOSQL.md).

### Cassandra

- **Best for:** telemetry, activity/event history, IoT, time-bucketed massive writes.
- **Read/write:** exceptionally strong distributed writes and fast bounded
  partition-key reads without sacrificing read availability; poor ad hoc queries.
- **Internals:** commit log, memtables, immutable SSTables, Bloom filters,
  compaction, repair, tunable consistency, peer-to-peer replication.
- **Scale:** native token sharding, replication, and node scale-out; partition key
  must avoid hot or unbounded partitions.
- **Support:** open source with vendor/managed distributions.
- **Do not choose when:** joins, foreign keys, broad scans, or multi-row ACID dominate.

### MongoDB

- **Best for:** bounded aggregate documents, catalogs, content, profiles, nested fields.
- **Read/write:** strong when one indexed document satisfies the operation.
- **Scale:** replica sets, native sharding, range/hashed shard keys and zones.
- **Data:** BSON documents, arrays, geospatial, text and flexible fields with validation.
- **Support:** community, commercial, and managed offerings.
- **Do not choose when:** many-to-many joins and cross-document transactions dominate.

### DynamoDB

- **Best for:** serverless, bursty, massive key/document workloads on AWS.
- **Read/write:** strong predictable key/index operations; poor joins and scans.
- **Scale:** managed partitioning and capacity, but hot keys/index skew remain application concerns.
- **Support/security:** AWS-managed support, IAM, encryption, backups, audit integration.
- **Do not choose when:** ad hoc SQL, broad aggregation, or cloud portability is central.

### Redis

- **Best for:** cache, sessions, rate limits, counters, locks/coordination, leaderboards.
- **Read/write:** extremely low-latency bounded key/data-structure operations.
- **Scale:** replicas and Redis Cluster hash slots; memory cost and hot keys matter.
- **Support:** open-source/community and commercial/managed variants; confirm license/distribution.
- **Do not choose when:** durable relational truth or complex queries are required.
- **Detail:** [Specialized Databases](./SPECIALIZED-DATABASES.md).

### Elasticsearch And OpenSearch

- **Best for:** full-text search, relevance, facets, filters, logs, search analytics.
- **Read/write:** excellent search reads; indexing creates refresh/segment/merge amplification.
- **Scale:** native primary shards and replicas; avoid oversharding and hot shards.
- **Role:** normally a rebuildable derived index, not transactional truth.
- **Support:** community plus Elastic/AWS/other vendor managed ecosystems.
- **Do not choose when:** ACID transactions and authoritative constraints are required.

### Neo4j

- **Best for:** fraud rings, social/identity links, topology, knowledge graphs.
- **Read/write:** excellent multi-hop traversal with ACID graph writes.
- **Scale:** clustering and product-specific graph placement; cross-partition
  traversal is the hard problem.
- **Support:** community, commercial enterprise, and managed offerings.
- **Do not choose when:** ordinary key lookup or tabular reporting is the main query.

### ClickHouse

- **Best for:** event analytics, dashboards, observability, huge historical aggregations.
- **Read/write:** very strong columnar scans and high-throughput batch ingestion.
- **Internals:** sorted compressed MergeTree parts, background merges, vectorized execution.
- **Scale:** partitions, distributed shards, replicas; manage part count and skew.
- **Support:** open source plus commercial/managed services.
- **Do not choose when:** row-by-row OLTP, foreign keys, and frequent point updates dominate.

### Vector Databases And pgvector

- **Best for:** RAG, semantic search, recommendations, similarity/deduplication.
- **Read/write:** similarity-read-heavy plus embedding ingestion; ANN indexes trade
  recall, latency, memory, and update cost.
- **Scale:** pgvector for operational simplicity/moderate scale; dedicated stores
  when vector isolation/distribution/index operations justify another service.
- **Role:** normally a derived index; fetch current authorized source records before use.
- **Support:** varies widely by open-source project, vendor, and managed tier.
- **Do not choose when:** the need is transactional SQL rather than vector similarity.
- **Detail:** [Vector Databases](./VECTOR-DATABASES.md).

## Scenario Lookup

| Scenario | First choice | Why |
|---|---|---|
| conventional web commerce | MySQL or PostgreSQL | balanced OLTP, transactions, indexes |
| complex SQL/JSON/geospatial | PostgreSQL | joins, JSONB, extensions, rich indexes |
| IBM/mainframe regulated core | Db2 | platform integration, governance, enterprise support |
| Microsoft enterprise/BI | SQL Server | ecosystem and mixed relational/BI tooling |
| packaged mission-critical enterprise | Oracle | mature HA/governance/support when justified |
| global distributed relational SaaS | CockroachDB | distributed serializable SQL |
| massive telemetry/event writes | Cassandra | token distribution and append-oriented writes |
| flexible aggregate catalog | PostgreSQL JSONB first, then MongoDB if document access dominates | safety first or natural document model |
| managed serverless key access | DynamoDB | elastic AWS-managed key operations |
| cache/session/rate limit | Redis | very low-latency data structures |
| full-text product discovery | Elasticsearch/OpenSearch | relevance, facets, filters |
| fraud/relationship traversal | Neo4j | graph patterns and multi-hop traversal |
| huge historical analytics | ClickHouse | compressed columnar OLAP |
| local mobile/desktop state | SQLite | embedded ACID storage |
| semantic search/RAG | pgvector first, dedicated vector DB when measured | embedding similarity |

## Final Selection Rule

Choose the simplest database that preserves the business invariants and meets
measured peak load with failure headroom. Then validate critical queries,
transactions, skew, failover, restore, security/audit, upgrades, and total cost
using production-shaped data.

## Recommended Next Page

Complete the [Database Decision Worksheet](./DATABASE-DECISION-WORKSHEET.md) to
turn these rules into a ranked shortlist with explicit evidence and rejected alternatives.
