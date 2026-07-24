---
title: Elasticsearch Capacity, Lifecycle, Security, And Operations
description: Plan shards and heap, use templates and ILM, reindex safely, secure clusters, snapshot and recover, upgrade, and diagnose production incidents.
difficulty: Advanced
page_type: Production Guide
status: Generic
prerequisites: [Elasticsearch Query And Relevance]
learning_objectives: [Plan cluster capacity, Operate lifecycle and recovery, Diagnose shard, heap, disk, and query incidents]
technologies: [Elasticsearch, ILM, Snapshot And Restore]
last_reviewed: "2026-07-23"
---

# Elasticsearch Capacity, Lifecycle, Security, And Operations

## Capacity Model

Estimate indexed bytes from source volume and measured expansion for inverted indices, doc
values, stored fields, replicas, merges, translog, watermarks, snapshots, and growth.

```text
primary indexed storage = daily documents x measured bytes/document x retention
cluster local storage = primary x (1 + replicas) + merge/recovery/headroom
```

Benchmark realistic mappings, queries, updates, refresh, and failure recovery. Choose shard
size/count so one shard fits recovery and query goals while avoiding tiny-shard overhead and
single-shard hotspots. Leave disk and CPU/heap headroom for node loss and relocation.

Heap is used by cluster metadata, indexing/query structures, aggregations, caches, queues,
and coordination; Lucene also benefits from filesystem page cache. Oversizing JVM heap can
harm page cache and GC.

## Templates, Data Streams, And ILM

Composable index templates govern mappings/settings/aliases. Data streams fit append-oriented
time-series data and roll over backing indices. ILM can transition hot/warm/cold/frozen/delete
phases based on age/size/doc count and perform rollover, allocation, force merge, shrink, or
delete as supported.

Lifecycle policy is not capacity magic. Monitor rollover, shard size, tier capacity, pending
actions, and retention compliance. Searchable snapshots/tiered features require licensing and
performance validation.

## Aliases And Reindexing

For incompatible mappings:

1. create versioned target index from reviewed template;
2. backfill with slices/throttling and failure capture;
3. dual-update or catch up from an ordered change log;
4. compare counts, sampled documents, queries, relevance, and lag;
5. atomically switch read/write aliases;
6. monitor and retain rollback window;
7. delete old index only after recovery/retention approval.

Reindex reads `_source` and consumes source/target capacity. Prevent duplicate or lost changes
with a versioned pipeline, not an assumed one-time copy.

## Snapshots And Recovery

Use a registered repository in an independent failure domain, automate snapshots, monitor
failures, retain per policy, and test restore into an isolated cluster. Snapshots are incremental
at segment level but repository contents must be managed only through Elasticsearch APIs.

Define recovery for accidental delete, corrupt shard, node loss, cluster loss, region loss,
and security/config loss. Measure restore speed and validate templates, aliases, security,
pipelines, and application behavior.

## Security

- require TLS for clients and node communication according to deployment model;
- use least-privilege roles limited by index/operation and separate admin/runtime identities;
- prefer API keys/service identities with expiry/rotation over shared passwords;
- protect Kibana, snapshots, ingest pipelines, scripts, and management APIs;
- prevent query injection by building structured DSL and restricting expensive/script queries;
- apply document/field-level security only with performance and leakage tests;
- audit sensitive operations and redact query data where necessary.

## Operational Signals

Cluster health is necessary but insufficient. Monitor unassigned shards/reason, pending tasks,
master stability, shard allocation/recovery, JVM heap/GC, CPU, disk watermarks, I/O, thread-pool
queues/rejections, indexing/search latency/rate, refresh/merge time, cache evictions, circuit-
breaker trips, slow logs, snapshot/ILM failures, and per-shard skew.

## Incident Runbooks

**Disk watermark reached:** stop growth/amplification, identify indices/shards/retention/merge,
restore capacity or move/delete only approved data, verify allocation, then fix rollover/retention
and capacity forecast. Never delete cluster files manually.

**Heap pressure and long GC:** inspect aggregations, fielddata, shard count, request size, queues,
and mapping explosion; reject/limit expensive work, cancel known offenders, then correct query/
mapping/shard architecture.

**Cluster red:** identify missing primary shards and allocation explanation, preserve data, restore
node/storage or recover from replica/snapshot, avoid unsafe forced allocation without understanding
data-loss implications.

**Hot node/shard:** inspect shard placement, routing/tenant skew, write/read rates, segment/merge,
and query mix. Rebalance, change routing/sharding or isolate tenant after confirming ordering and
data-contract consequences.

**Rolling upgrade:** verify supported upgrade path and plugin/client compatibility, snapshot and
test restore, disable/limit allocation only as documented, upgrade in supported role order, watch
cluster state, mixed-version behavior, recovery, and rollback boundary.

## Official References

- [Elasticsearch sizing and capacity](https://www.elastic.co/guide/en/elasticsearch/reference/current/size-your-shards.html)
- [Index lifecycle management](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-lifecycle-management.html)
- [Snapshot and restore](https://www.elastic.co/guide/en/elasticsearch/reference/current/snapshot-restore.html)
- [Elasticsearch security](https://www.elastic.co/guide/en/elasticsearch/reference/current/secure-cluster.html)

## Recommended Next

Finish with [Spring Data Integration, Pipelines, Interviews, Labs, And Revision](./ELASTICSEARCH-SPRING-INTERVIEW-REVISION.md).

