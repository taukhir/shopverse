---
title: Elasticsearch Production Interview Scenarios
description: Diagnose mapping, relevance, shard, indexing, pagination, reindexing, recovery, and database-to-search consistency scenarios.
difficulty: Advanced
page_type: Workbook
status: maintained
prerequisites: [Elasticsearch internals, query relevance, operations]
learning_objectives: [Explain search internals under pressure, Diagnose production failures, Design safe index evolution, Defend database-to-search consistency]
technologies: [Elasticsearch, Lucene, Spring Data Elasticsearch]
last_reviewed: "2026-07-30"
scope: generic
owner: docs-data
reviewer: documentation-maintainers
review_evidence: official-documentation-and-repository-audit
---

# Elasticsearch Production Interview Scenarios

Answer each scenario by separating source-of-truth correctness, indexing freshness, search semantics, shard/node
capacity, and recovery. Search availability does not prove the projection is complete or current.

## Ten Scenarios

### 1. Why does a newly indexed document not appear immediately?

Explain near-real-time refresh, refresh interval, explicit refresh cost, replica visibility, and the difference
between an acknowledged index operation and searchable visibility.

### 2. Why did a string map incorrectly in production?

Dynamic mapping inferred the first observed shape. Use explicit mappings, templates, controlled dynamic behavior,
and a new index plus reindex when an incompatible field type must change.

### 3. `text` versus `keyword`?

`text` is analyzed for full-text relevance; `keyword` preserves an exact value for filtering, sorting, and
aggregations. Multi-fields can support both access patterns at additional index cost.

### 4. Why is deep pagination slow or inconsistent?

`from`/`size` makes coordinating shards retain and merge large result windows. Use a stable sort with
`search_after`, and a point-in-time view when consistency across pages matters.

### 5. How do you diagnose a hot shard?

Inspect routing skew, shard sizes, query/indexing rate, thread-pool rejection, CPU, heap, disk, and slow logs.
Correct the routing/data model or shard plan; adding nodes cannot evenly split one immutable hot primary shard.

### 6. Why can oversharding hurt?

Every shard carries cluster-state, heap, file, recovery, and fan-out overhead. Size from data volume, growth,
retention, node capacity, recovery time, and query concurrency rather than choosing many tiny shards by default.

### 7. How do you change an incompatible mapping without downtime?

Create a versioned index, reindex or rebuild from the source of truth, apply live changes, validate counts and
queries, atomically switch an alias, retain rollback, then retire the old index after the safety window.

### 8. Database says committed but search is stale—what now?

Treat Elasticsearch as a projection. Publish changes through an outbox/CDC path, make indexing idempotent and
version-aware, monitor freshness and failures, and support reconciliation plus full rebuild.

### 9. Red cluster versus yellow cluster?

Red means at least one primary shard is unassigned; yellow means primaries are assigned but some replicas are not.
Use allocation explanations, node/disk/tier evidence, and snapshots before any destructive recovery.

### 10. Snapshot versus replica?

A replica supports availability and read capacity but shares operator and cluster failure domains. A snapshot is
the recoverable backup boundary; test restore, repository access, security metadata, RPO, and RTO.

## Official References

- [Elasticsearch mapping](https://www.elastic.co/docs/manage-data/data-store/mapping)
- [Elasticsearch search shard routing](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-shard-routing.html)
- [Elasticsearch reindex API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-reindex)
- [Elasticsearch snapshot and restore](https://www.elastic.co/docs/deploy-manage/tools/snapshot-and-restore)

## Recommended Next

Review [Internals And Mapping](./ELASTICSEARCH-INTERNALS-MAPPING.md),
[Query And Relevance](./ELASTICSEARCH-QUERY-RELEVANCE.md), and [Operations](./ELASTICSEARCH-OPERATIONS.md).
