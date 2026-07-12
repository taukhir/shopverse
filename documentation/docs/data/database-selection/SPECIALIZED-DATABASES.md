---
title: Specialized Databases
sidebar_position: 3
difficulty: Intermediate
page_type: Comparison
status: Generic
learning_objectives: [Choose workload-specific databases, Keep derived stores rebuildable]
technologies: [Redis, Elasticsearch, OpenSearch, Neo4j, ClickHouse]
last_reviewed: "2026-07-11"
---

# Specialized Databases

Specialized databases are often secondary stores built from an authoritative
OLTP database. Use an outbox or change-data-capture pipeline so search, cache,
graph, and analytical projections can be replayed and rebuilt.

| Database | Best fit | Read/write profile | Scaling concern |
|---|---|---|---|
| Redis | cache, sessions, counters, rate limits, leaderboards | both at very low latency | memory cost, hot keys, eviction, cluster hash slots |
| Elasticsearch/OpenSearch | full-text search, facets, logs | search/read-heavy with continuous indexing | shard count/skew, merges, mapping changes |
| Neo4j | fraud links, topology, identity, knowledge graphs | traversal/read-heavy plus ACID graph writes | starting-node selectivity and cross-partition traversal |
| ClickHouse | dashboards, event analytics, large aggregations | analytical reads plus high-throughput batch ingest | merge pressure, partition count, shard skew |

## Redis

Redis keeps strings, hashes, sets, sorted sets, streams, and other structures
primarily in memory. Bounded commands are fast; large values, blocking commands,
expensive scripts, and hot keys hurt tail latency. Replicas support availability
and selected reads; Redis Cluster shards hash slots. Snapshots and append-only
logging offer different durability/latency trade-offs. A fast cache is not
automatically a safe system of record.

## Elasticsearch And OpenSearch

These engines analyze documents into distributed inverted indexes. They excel at
text relevance, filters, facets, aggregations, and observability exploration.
Indexing creates write amplification through analysis, refresh, replication,
segments, and merges. Too many shards waste memory; too few or skewed shards
create hotspots. Keep authoritative transactions elsewhere and plan index rebuilds.

## Neo4j

Neo4j models nodes, relationships, and properties. Indexes locate a starting
node, then graph traversal follows relationships. It earns its operational cost
when multi-hop traversal is central—not for ordinary key lookup or tabular
reporting. Treat inferred relationships as sensitive data in authorization and audit.

## ClickHouse

ClickHouse stores sorted, compressed columnar parts and merges them in the
background. Vectorized execution, partition pruning, sparse indexes, and data-
skipping indexes make analytical scans efficient. Prefer batched ingestion.
Frequent tiny inserts, point updates, and deletes create overhead and are a poor
OLTP fit. Partition for lifecycle and pruning, not unbounded cardinality.

## Security And Operations

For each system, verify TLS, identity/roles, tenant isolation, encryption,
backups, audit features, and license/tier. Also monitor workload-specific health:
Redis eviction and memory fragmentation, search shard/merge health, graph query
expansion, and ClickHouse parts/merge queues.
