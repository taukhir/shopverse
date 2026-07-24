---
title: Apache Kafka And Spring Kafka Revision Sheet
description: Rapid revision of Kafka architecture, partitions, producers, consumers, reliability, Spring containers, operations, Streams, and Connect.
difficulty: Advanced
page_type: Interview
status: Generic
prerequisites: [Kafka And Spring Kafka Architect Overview]
learning_objectives: [Recall Kafka internals quickly, Diagnose producer and consumer failures, Answer architect-level Kafka questions concisely]
technologies: [Apache Kafka 4.x, Spring Kafka 4.x, Kafka Streams, Kafka Connect]
last_reviewed: "2026-07-23"
---

# Apache Kafka And Spring Kafka Revision Sheet

Use after the [Kafka Architect Overview](./KAFKA-ARCHITECT-OVERVIEW.md).

## One-Line Recall

| Concept | Revision answer |
|---|---|
| partition | Ordered log and primary parallelism/ownership unit. |
| offset | Position inside one partition, not a business acknowledgment. |
| consumer group | Members divide partitions for one logical subscription. |
| ISR | Replicas caught up enough for normal leadership and durability policy. |
| high watermark | Replicated visibility boundary for non-transactional committed records. |
| last stable offset | `read_committed` visibility boundary with transactions. |
| KRaft | Replicated metadata quorum replacing ZooKeeper. |
| idempotent producer | Prevents supported producer-retry duplicates in Kafka. |
| Kafka transaction | Atomically commits Kafka records and consumed offsets. |
| lag | Distance/age between available data and group progress. |

## Producer Recall

```text
serialize -> partition -> accumulator/batch -> sender -> leader
-> replication/acknowledgment -> future/callback
```

Know `acks`, minimum ISR, idempotence, retries, batch size, linger, compression,
buffer memory, maximum block time, delivery timeout, request size, producer identity,
sequence numbers, epochs, transactions, and fencing.

## Consumer Recall

```text
join group -> assignment -> fetch/poll -> process -> commit -> repeat
```

Know poll records/interval, session and heartbeat behavior, fetch sizing, assignment
strategies, static membership, cooperative rebalancing, offset reset, pause/resume,
seek, replay, and shutdown. Kafka consumers are not thread-safe.

## Spring Kafka Recall

| Component | Responsibility |
|---|---|
| `KafkaTemplate` | publishing and local transactional operations |
| listener container | poll ownership, conversion, invocation, commit, recovery, events, shutdown |
| `DefaultErrorHandler` | blocking retry and record recovery |
| retry topics | non-blocking delayed delivery with ordering trade-off |
| DLT recoverer | terminal publication with original failure metadata |
| transaction manager | Kafka transactional resource integration |

Non-blocking retry topics do not support batch listeners or container transactions.
Manual acknowledgment does not make business effects exactly once.

## Scenario Answers

**Lag rising:** split by partition; compare arrival/processing/commit rates; inspect
latency, retries, pools, GC, rebalances, poll budget, assignment, and skew. Scale the
actual bottleneck and calculate catch-up before retention.

**Duplicate:** expected after effect succeeds and commit fails. Protect the effect
with inbox/unique event identity, transactional state change, and external
idempotency keys.

**Ordering:** key by required business identity and preserve same-partition serial
processing. Account for partition increases, retry topics, replay, and async work.

**Broker failure:** eligible ISR replica becomes leader; clients refresh metadata.
Outcome depends on ISR, replication, acknowledgments, minimum ISR, election policy,
and timeouts.

## Operations Checklist

- topic owner, key, schema, partitions, replication, retention, ACLs and quotas;
- controller quorum, offline/under-replicated partitions, ISR and disk;
- producer errors/retries/latency/buffer and consumer lag/rebalances/commit;
- retry/DLT ownership and audited replay;
- compatible rolling upgrade, credential rotation, and regional recovery.

## Final Checklist

- distinguish storage, visibility, group progress, and business completion;
- explain producer and consumer internals;
- calculate partitions, storage, throughput, and catch-up;
- preserve required order while handling failure;
- apply transactions, inbox, outbox, and CDC at correct boundaries;
- secure, monitor, upgrade, replay, and recover the platform.

Practice with the [Kafka Architect Labs](./kafka/KAFKA-ARCHITECT-LABS.md).
