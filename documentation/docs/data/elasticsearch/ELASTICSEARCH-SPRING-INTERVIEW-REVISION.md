---
title: Elasticsearch With Spring, Interview Scenarios, Labs, And Revision
description: Integrate Spring Data Elasticsearch, design Kafka-to-search projections, and prepare with production scenarios, labs, and a compact revision sheet.
difficulty: Advanced
page_type: Interview Guide
status: Generic
prerequisites: [Elasticsearch Operations, Spring Boot]
learning_objectives: [Use Spring Data without hiding Elasticsearch semantics, Build reliable search projections, Answer architect interview scenarios]
technologies: [Spring Data Elasticsearch, Elasticsearch, Kafka]
last_reviewed: "2026-07-23"
---

# Elasticsearch With Spring, Interview Scenarios, Labs, And Revision

## Spring Data Boundary

Use the Spring Data Elasticsearch generation compatible with Spring Boot and the target
Elasticsearch cluster. The repository abstraction is convenient for simple CRUD/derived queries;
use `ElasticsearchOperations` or the supported client for explicit query, aggregation, routing,
PIT, bulk, and concurrency requirements.

```java
@Document(indexName = "products-read")
public class ProductDocument {
    @Id private String productId;

    @Field(type = FieldType.Text,
           fields = @InnerField(suffix = "raw", type = FieldType.Keyword))
    private String name;

    @Field(type = FieldType.Keyword)
    private String tenantId;

    @Field(type = FieldType.Scaled_Float, scalingFactor = 100)
    private BigDecimal price;
}
```

Treat annotation-based index creation cautiously in production. Provision reviewed templates,
settings, aliases, and ILM through controlled infrastructure/migrations. Application mapping
must match the deployed index contract.

## Bulk Indexing

Batch by measured bytes and actions, bound concurrency, inspect per-item responses, classify
retryable rejections/timeouts from permanent mapping errors, use backoff/jitter, and preserve
source version/idempotency. A successful HTTP bulk response can contain failed items.

Never retry the entire bulk blindly when some items succeeded. Track item identity, version,
attempt, failure reason, and recovery destination.

## Database/Kafka To Search Projection

```text
database transaction -> outbox/CDC -> Kafka event
 -> projection consumer -> transform -> bulk index with source version
 -> checkpoint/offset -> lag and reconciliation
```

The relational/database record remains the source of truth; Elasticsearch is a rebuildable read
model. Use stable document IDs, versioned events, idempotent upsert/delete/tombstone behavior,
schema-compatible consumers, retry/DLT ownership, full replay, and periodic reconciliation.

Ordering is per entity/key. A late old event must not overwrite a newer projection. Delete events
need retention/replay semantics so a rebuild does not resurrect removed data.

## API Search Contract

Validate and whitelist filters/sorts, cap page size and query complexity, enforce tenant filter
server-side, use stable cursors rather than exposing raw internals carelessly, return result
freshness where relevant, and separate no-result from search-unavailable. Do not pass arbitrary
client Query DSL or script fields to the cluster.

## Top Interview Questions

**Can Elasticsearch be the system of record?** It can durably store data, but most transactional
business systems need database constraints/transactions and use Elasticsearch as a derived search
projection. Decide from consistency, update, recovery, and audit requirements—not fashion.

**How do you keep database and index consistent?** Avoid dual write; publish committed changes via
outbox/CDC, consume idempotently with versions, monitor lag/failures, reconcile, and support replay.

**How do you change an analyzer?** Create a new versioned index with new mapping/analyzer, reindex
and catch up changes, validate relevance, atomically switch aliases, retain rollback, then retire old.

**Why is one shard overloaded?** Routing/key/tenant skew, uneven shard placement, time-based write
concentration, or a query targeting one shard. Measure per-shard workload before resharding.

**What if indexing is fast but search is stale?** Inspect refresh interval/blocked refresh, pipeline
lag, bulk partial failures, replica/search routing, and whether the API reads the expected alias/index.

## Production Scenarios

**Kafka replay of two years without harming search.** Build a new versioned index, use a dedicated
consumer group, throttle/batch from measured cluster headroom, version documents, monitor lag/
merges/rejections, catch up live changes, validate, then alias switch.

**DLT spikes after mapping deployment.** Stop/limit producers or projection rollout, compare event
schema with index mapping/template, preserve failed payload metadata, fix via compatible new index/
consumer, replay idempotently, and add contract/mapping tests.

**Search cluster unavailable.** Serve an explicit degraded response or bounded cache where valid;
buffer source events in Kafka/outbox, do not block source-of-truth transactions on search, recover
cluster, replay, and reconcile before declaring freshness restored.

## Hands-On Labs

1. Define strict product mapping with text/keyword multi-fields and test analyzer tokens.
2. Index realistic data; compare term versus match and inspect Explain/Profile evidence.
3. Build bool filters, aggregations, and PIT + `search_after` pagination.
4. Create a new analyzer index and execute alias-based zero-downtime reindex.
5. Bulk index with one permanent and one transient item failure; retry only safe items.
6. Build a versioned Kafka projection and prove duplicate/out-of-order/delete handling.
7. Simulate node loss, disk watermark, snapshot restore, and hot-shard incident.

## One-Page Revision

- Index -> primary shards + replicas; each shard is a Lucene index.
- Writes hit primary then replicas; refresh makes new segments searchable; merge compacts segments.
- `text` analyzes; `keyword` exact-matches/sorts/aggregates; mapping changes often need reindex.
- Query context scores; filter context constrains; BM25 is relative relevance.
- Deep pagination uses PIT + deterministic `search_after`, not huge `from`.
- Shard count/size balance parallelism against overhead and recovery time.
- ILM automates lifecycle but still needs capacity and failure monitoring.
- Snapshot restore must be tested; green health alone does not prove recoverability.
- Database-to-search uses outbox/CDC, versions, idempotency, replay, and reconciliation.
- Spring Data is an adapter; production mapping/query/shard semantics remain Elasticsearch concerns.

## Official References

- [Spring Data Elasticsearch reference](https://docs.spring.io/spring-data/elasticsearch/reference/)
- [Elasticsearch bulk API](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html)
- [Elasticsearch optimistic concurrency control](https://www.elastic.co/guide/en/elasticsearch/reference/current/optimistic-concurrency-control.html)

## Recommended Next

Return to the [Elasticsearch Architect Learning Path](../ELASTICSEARCH-ARCHITECT-PATH.md) and complete the labs with representative data and measured evidence.
