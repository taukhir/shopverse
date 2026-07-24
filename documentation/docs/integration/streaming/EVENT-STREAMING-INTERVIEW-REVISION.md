---
title: Event Streaming Interview And Revision
description: High-value revision tables, interview answers, production scenarios, design exercises, and readiness checks across Spring Cloud Stream, Kafka Streams, and Kafka Connect.
difficulty: Advanced
page_type: Revision Sheet
status: Generic
prerequisites: [Spring Cloud Stream track, Kafka Streams track, Kafka Connect track]
learning_objectives: [Recall critical concepts quickly, Answer Lead interviews with precise boundaries, Diagnose production scenarios systematically]
technologies: [Spring Cloud Stream, Kafka Streams, Kafka Connect, Apache Kafka]
last_reviewed: "2026-07-23"
---

# Event Streaming Interview And Revision

Use this page after each track and during interview preparation. A strong answer
states the requirement, execution model, guarantee boundary, likely failure, and
operational evidence. Naming an API or property is not enough.

## Sixty-Second Overview

| Technology | One-line purpose | Unit of scale | Durable progress/state |
|---|---|---|---|
| Spring Cloud Stream Kafka binder | bind Spring business functions to Kafka | topic partitions and listener concurrency | consumer-group offsets; application state is external |
| Kafka Streams | continuous Kafka-to-Kafka stateful computation | topology tasks from source partitions | local stores plus Kafka changelogs and offsets |
| Kafka Connect | managed source/sink data movement | connector tasks across workers | Connect internal offsets plus Kafka group offsets for sinks |

## Selection Questions

1. Is the output a business side effect, another Kafka record, or an external-system write?
2. Does processing depend on prior records, a window, aggregate, or join?
3. Is a maintained connector already available and trustworthy?
4. Which team owns failures, schemas, offsets, and replay?
5. Where must atomicity stop?
6. What ordering scope and recovery-time objective are required?

## Must-Know Boundaries

- Kafka ordering is per partition.
- Partition/task count caps useful parallelism.
- Producer idempotence does not deduplicate consumer side effects.
- A committed consumer offset is not proof of a completed external business effect.
- Kafka transactions do not include arbitrary databases or HTTP APIs.
- Kafka Streams exactly-once covers Kafka-managed records, offsets, and state.
- Connect commonly redelivers around source/sink offset failure windows.
- A DLT preserves a failed record; it does not solve or replay it safely.
- Schema compatibility can pass while business meaning is broken.
- More pods do not fix a hot partition, slow database, or single-threaded source.

## Spring Cloud Stream Questions

### What are binding, destination, and binder?

A binding is the named application connection. A destination is the broker topic or
queue. A binder implements the connection for a particular middleware.

### What does `process-in-0` mean?

`process` is the function bean, `in` is input, and `0` is the first input. The
binding maps to a destination through configuration.

### Supplier versus StreamBridge?

A supplier is framework-triggered, usually by a poller or reactive source.
`StreamBridge` is invoked imperatively by HTTP/domain/application code.

### Spring Cloud Stream versus Spring Kafka?

Choose Spring Cloud Stream for functional binding conventions and broker
abstraction. Choose Spring Kafka when detailed Kafka listener/container behavior is
central. Both still require Kafka operational knowledge.

### How do retry and DLT work?

Classify errors, configure bounded attempts/backoff, and enable Kafka-binder DLT for
an explicit group. Long blocking retry can violate poll intervals. Give the DLT an
owner, alert, retention, correction, and idempotent replay process.

### Does `StreamBridge.send()` make database publication reliable?

No. A database commit and broker send are a dual write. Use a transactional outbox
or a similarly explicit consistency design.

## Kafka Streams Questions

### KStream, KTable, and GlobalKTable?

`KStream` models each event, `KTable` models the latest value by key, and
`GlobalKTable` replicates a bounded table to every instance for lookup joins.

### What creates a repartition topic?

Changing a key before a key-based aggregation or join requires redistribution so
records for the new key meet in the same task.

### How is state recovered?

Tasks restore local state from changelog/source topics after reassignment. Standby
replicas can reduce restore time at extra resource cost.

### What is stream time?

Time derived from observed record timestamps that drives window progress and late
record evaluation; it is not simply wall-clock time.

### Why can a join miss or multiply results?

Keys, partitioning, timestamps, window/grace, table update order, null behavior,
and record multiplicity all affect join semantics.

### How do you deploy an incompatible state change?

Run a new application ID/output, rebuild from retained inputs, compare results,
cut consumers over, and preserve a rollback path.

## Kafka Connect Questions

### Worker, connector, and task?

Workers run Connect, a connector owns configuration and splits work, and tasks move
data in parallel.

### Converter versus serializer?

A converter translates Connect's schema/value model to Kafka bytes. A serializer
is the ordinary Kafka producer API abstraction.

### Why can a sink duplicate data?

The external write may succeed before the Kafka offset commit. Recovery replays the
records; use deterministic upserts or deduplication.

### Why might `tasks.max=10` produce one task?

The connector or source may expose only one shard/work unit, or the destination may
not support more parallelism.

### What does CDC plus outbox solve?

The application commits business data and event intent in one database transaction;
CDC later publishes that intent. It closes the missing-event dual-write gap but
still permits duplicate delivery.

### Are SMTs a business-rules engine?

No. They suit small stateless per-record changes, not stateful joins, orchestration,
or long hidden transformation pipelines.

## Production Scenario Framework

For every incident, answer in this order:

```text
scope -> freshness/impact -> recent change -> rates/latencies/errors
      -> partition/task distribution -> offset/state evidence
      -> dependency saturation -> safe containment -> durable fix -> replay/reconcile
```

## Top Production Questions

### Consumer lag keeps increasing

Split by partition, compare ingress and completion rates, inspect processing
latency, retries, rebalances, downstream saturation, key skew, and active consumers.
Scale only after locating the bottleneck.

### One tenant creates 80% of traffic

Confirm key skew and ordering requirements. Options include tenant isolation,
quotas, a sharded business key, dedicated topics, or an aggregate redesign. Random
keys can destroy required order.

### Consumers rebalance repeatedly

Inspect poll-interval violations, session/heartbeat failures, pod churn, GC pauses,
network, group membership, and slow retry/processing. Fix instability before merely
increasing timeouts.

### A topic needs more partitions

Model future parallelism and key remapping. Existing keyed records do not
automatically move, so the same key can exist in old and new partitions over time.
If strict history order matters, use a controlled migration/new topic.

### Payment succeeded but the offset did not commit

The record can return. Send an idempotency key to the payment provider and record
the event/business outcome transactionally in the consumer's database.

### Kafka Streams restore is too slow

Measure state bytes, changelog lag, effective restore throughput, concurrent
restores, broker/network/disk saturation, and standby placement. Reduce or partition
state and engineer recovery capacity to the RTO.

### A Connect source is running but stale

Inspect task status, source log position, snapshot phase, filters, permissions,
poll rate, conversion/producer errors, topic routing, and actual source changes.

### DLT volume spikes after deployment

Stop automatic replay, group failures by producer/schema/exception, compare the
deployment diff, preserve raw records, contain the faulty version, fix compatibility
or business logic, then replay under idempotency and rate controls.

### Schema changes while old versions remain deployed

Use the configured compatibility policy and overlap tests. Prefer additive optional
fields, never silently change meaning/units, and keep old/new producer-consumer
matrices in CI.

### A region fails

Execute the documented failover authority, validate replication lag/RPO, establish
write ownership, translate or choose consumer offsets, start consumers safely, and
plan duplicate reconciliation and failback. Replication is not synchronous global
ordering.

## Design Exercises

1. Design an order workflow using Stream, ordinary consumers, outbox, and Connect CDC.
2. Design a five-minute fraud aggregate with late events and state recovery.
3. Design a database-to-Kafka-to-warehouse pipeline and enumerate every duplicate window.
4. Plan a certificate rotation and rolling upgrade with no silent consumption gap.
5. Plan a two-year replay without recharging customers or starving live traffic.

## Readiness Scorecard

You are interview-ready when you can, without notes:

- draw all three runtime architectures;
- select one for a new requirement and reject the other two with evidence;
- trace offsets, state, and duplicate windows;
- explain ordering and exactly-once boundaries precisely;
- design retry/DLT/replay with ownership;
- diagnose lag, restore, and connector failures from metrics;
- discuss security, schemas, upgrades, capacity, and regional recovery;
- give both a two-minute answer and a ten-minute deep dive.

## Official References

- [Spring Cloud Stream reference](https://docs.spring.io/spring-cloud-stream/reference/)
- [Apache Kafka Streams](https://kafka.apache.org/documentation/streams/)
- [Apache Kafka Connect](https://kafka.apache.org/documentation/#connect)

## Recommended Next

Apply the questions in [Kafka Architect Labs And Interview Workbook](../kafka/KAFKA-ARCHITECT-LABS.md).

