---
title: Kafka Producer Reliability And Backpressure
description: Producer internals, acknowledgments, idempotence, retries, timeouts, buffer pressure, transactions, and outage containment.
difficulty: Advanced
page_type: Guide
status: Generic
prerequisites: [Kafka topics, partitions, replication]
learning_objectives: [Trace the producer runtime, Configure durability and latency deliberately, Contain overload and ambiguous outcomes]
technologies: [Apache Kafka 4.x, KafkaProducer, Spring Kafka]
last_reviewed: "2026-07-28"
---

# Kafka Producer Reliability And Backpressure

## Runtime Path

```text
send
 -> serialize
 -> choose partition
 -> append to per-partition accumulator batch
 -> sender thread sends to leader
 -> broker replication/acknowledgment
 -> future or callback completes
```

`send()` accepting a record locally is not broker durability. Observe the returned
future and define what the HTTP/business caller is promised.

## Durability Combination

| Setting | Purpose |
|---|---|
| `acks=all` | leader waits for the required in-sync replica acknowledgment condition |
| topic `min.insync.replicas` | minimum ISR required for an `acks=all` write |
| replication factor | number of replicas, not number required for each acknowledgment |
| `enable.idempotence=true` | prevents duplicate log appends from supported retries in one producer session |

With replication factor 3, `min.insync.replicas=2`, and `acks=all`, losing enough
ISR causes writes to fail rather than silently accept a weaker durability level.
That is a deliberate consistency-versus-availability decision.

## Retry And Timeout Budget

`delivery.timeout.ms` bounds total send completion time, including batching and
retries. `request.timeout.ms` bounds an individual request wait, while
`max.block.ms` bounds blocking for metadata or buffer allocation in relevant API
calls. Configure them from the business deadline rather than independently.

An acknowledgment can be lost after the broker appended the record. The producer
then sees an ambiguous result and may retry. Idempotence protects Kafka append
duplicates within its protocol boundary; a caller retrying the entire business
operation still needs a stable business/event ID.

## Ordering During Retries

Idempotence, sequence numbers, producer IDs, and epochs let brokers reject
duplicate or invalid sequence writes. `max.in.flight.requests.per.connection`
interacts with retry ordering; use client-supported idempotent defaults unless a
measured requirement justifies overriding them.

Adding topic partitions can change default key-to-partition mapping. Per-key
ordering across the expansion boundary needs explicit migration or consumer-side
aggregate sequencing.

## Batching And Compression

`batch.size` limits a per-partition batch buffer and `linger.ms` allows additional
records to join before send. Compression applies most effectively to batches.

```text
larger/fuller batch -> better throughput and compression
larger linger/batch -> potentially higher latency and memory
```

Measure batch fill ratio, records/request, compression ratio, send p99, CPU,
network, and buffer availability. Large messages damage batching, replication,
recovery, and consumer memory; publish an object-store reference where possible.

## Buffer Exhaustion And Backpressure

When production exceeds network/broker capacity, accumulator memory fills.
Eventually sends block up to `max.block.ms` and fail. Never respond by making
buffers unlimited.

Containment options:

- bound incoming request concurrency and queues;
- reject or shed work before heap exhaustion;
- use per-tenant quotas;
- expose degraded readiness/status;
- use a durable outbox for accepted database transactions;
- cap outbox storage and alert on oldest pending age;
- stop tight application retry loops.

## Transactions And Fencing

Kafka transactions atomically publish multiple Kafka records and, for
consume-transform-produce, consumed offsets. Every simultaneously running
application instance needs a unique transactional ID namespace. A newer producer
epoch fences stale producers so two owners cannot continue one transactional
identity.

Kafka transactions do not atomically include ordinary database or external API
effects. Use outbox/inbox and idempotency for those boundaries.

## Failure Matrix

| Failure | Evidence | Response |
|---|---|---|
| serialization | local exception | quarantine/fix event; unchanged retry is useless |
| authorization | auth error | fail closed; repair ACL/identity |
| record too large | broker/client size error | redesign payload or align all limits |
| no metadata/buffer | block timeout, buffer metric | contain input; inspect cluster/network |
| insufficient ISR | broker error, ISR metrics | restore replicas or accept defined unavailability |
| delivery timeout | future failure | reconcile ambiguous outcome; retry with stable ID |
| producer fenced | fencing exception | find duplicate transactional identity |
| callback ignored | apparent success | always observe asynchronous completion |

## Metrics

Monitor send/error/retry rates, request latency, record queue time, batch size,
compression ratio, buffer available bytes, records per request, metadata age,
connection/auth failures, and business outbox age.

## Interview Questions

**Does `acks=all` mean every replica?** It means the leader enforces the ISR
acknowledgment condition, including `min.insync.replicas`; it is not “every replica
configured regardless of ISR.”

**Kafka is unavailable—where do records wait?** Only in explicitly bounded places:
producer memory until its deadline, a durable outbox within capacity, or rejected
upstream. Unlimited waiting is a cascading failure.

**Why can a successful broker write look failed?** The acknowledgment may be lost.
Use idempotence and stable event identity, then reconcile ambiguous business state.

## Official References

- [Kafka producer configuration](https://kafka.apache.org/documentation/#producerconfigs)
- [Kafka producer API](https://kafka.apache.org/43/javadoc/org/apache/kafka/clients/producer/KafkaProducer.html)
- [Spring Kafka sending messages](https://docs.spring.io/spring-kafka/reference/kafka/sending-messages.html)

## Recommended Next

Continue with [Capacity And Performance Planning](./KAFKA-CAPACITY-PERFORMANCE-PLANNING.md).

