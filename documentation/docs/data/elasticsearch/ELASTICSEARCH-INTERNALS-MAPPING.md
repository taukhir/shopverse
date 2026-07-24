---
title: Elasticsearch Internals, Indexing, And Mapping
description: Trace nodes, clusters, primary and replica shards, routing, Lucene segments, refresh, translog, merge, mappings, and document modeling.
difficulty: Advanced
page_type: Deep Dive
status: Generic
prerequisites: [Elasticsearch Architect Learning Path]
learning_objectives: [Trace write and read internals, Design explicit mappings, Prevent shard and document modeling failures]
technologies: [Elasticsearch, Lucene]
last_reviewed: "2026-07-23"
---

# Elasticsearch Internals, Indexing, And Mapping

## Cluster And Node Roles

A cluster coordinates metadata and shard allocation. Master-eligible nodes participate in
cluster-state leadership; data nodes hold shards; ingest nodes run pipelines; coordinating
nodes fan out and reduce requests. Role layout should match workload and failure domains.

Cluster state contains index metadata, mappings, settings, and allocation—not all document
data. Excessive indices/shards/mapping fields increase control-plane pressure.

## Shards And Routing

An index has primary shards and replica copies. A document routes to a primary shard from
its routing value (normally `_id`); the primary coordinates replica writes. Primary shard
count defines the hash space and cannot be changed in place like replica count; split/shrink
or reindex when topology changes.

Custom routing can localize tenant/entity queries but may create hot or oversized shards.
Routing is a data contract: reads/updates/deletes must use it consistently.

## Indexing Path

```text
request -> coordinating node -> primary shard
 -> validate/analyze -> in-memory indexing buffer + translog
 -> replica operations -> response per durability/ack rules
 -> refresh publishes a new searchable segment
 -> flush creates commit point and resets translog generation
 -> merge combines immutable segments and expunges old deleted docs over time
```

Elasticsearch is near real time. A successful index response does not necessarily mean a
normal search can see the document until refresh. Real-time GET has different behavior.
Forcing refresh per write damages throughput; use explicit refresh only where the business
contract pays the cost.

Updates are read-modify-index operations: Lucene documents are immutable, so the old version
is marked deleted and a new one is indexed. Heavy update/delete workloads increase merge work.

## Source And Indexed Structures

`_source` stores the original/reconstructed document representation used for retrieval,
updates, and reindex workflows. Inverted indices map analyzed terms to documents. Doc values
provide column-oriented storage for sorting, aggregations, and scripting on supported fields.
Stored fields and term vectors solve more specialized retrieval/analysis needs.

## Mapping Types

- `text`: analyzed full-text search;
- `keyword`: exact match, aggregation, sorting;
- numeric/date/boolean: typed range and aggregation behavior;
- `object`: flattened field paths; arrays of objects lose tuple independence;
- `nested`: indexes child objects separately to preserve per-object matching, with cost;
- `flattened`: contains unpredictable key sets with reduced mapping explosion;
- `geo_point`/`geo_shape`, completion, rank and vector types for specific use cases.

```json
{
  "mappings": {
    "dynamic": "strict",
    "properties": {
      "productId": {"type": "keyword"},
      "name": {
        "type": "text",
        "fields": {"raw": {"type": "keyword", "ignore_above": 256}}
      },
      "price": {"type": "scaled_float", "scaling_factor": 100},
      "createdAt": {"type": "date"}
    }
  }
}
```

Choose explicit mappings/templates before production data. Dynamic mapping can infer the
wrong type, create field explosion, and make subsequent documents fail. Mapping changes such
as field type/analyzer usually require a new index and reindex.

## Document Modeling

Denormalize data needed together at query time, but define update amplification and source of
truth. Avoid unbounded arrays and giant documents. Parent-child joins preserve independent
updates but add routing and query cost; often event-driven projection/reindex is simpler.

An Elasticsearch write plus database write is a dual write. Prefer transactional outbox/CDC,
idempotent projection updates with source version, replay, and reconciliation.

## Optimistic Concurrency

Use sequence number and primary term for compare-and-set updates when clients may race. External
versioning can align projection versions when used consistently. Treat conflict as a business
or replay-order decision, not a blind infinite retry.

## Interview Questions

**Primary shard versus replica?** Primaries own routing partitions and coordinate writes;
replicas provide availability/read capacity and can be promoted after failure.

**Refresh versus flush?** Refresh opens recent segment data for search; flush creates a Lucene
commit point and advances translog lifecycle. They solve different durability/visibility work.

**Why are too many shards harmful?** Each shard is a Lucene index with files, memory, threads,
cluster-state and recovery overhead; tiny shards waste resources and slow coordination.

## Official References

- [Elasticsearch clusters, nodes, and shards](https://www.elastic.co/guide/en/elasticsearch/reference/current/scalability.html)
- [Near real-time search](https://www.elastic.co/guide/en/elasticsearch/reference/current/near-real-time.html)
- [Mapping field types](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-types.html)

## Recommended Next

Continue with [Analyzers, Query DSL, Relevance, Aggregations, And Pagination](./ELASTICSEARCH-QUERY-RELEVANCE.md).

