---
title: Partition And Queue Ownership
---

# Partition And Queue Ownership

Partition and queue ownership serialize work by assignment rather than by
making every worker contend for one global lock.

Back to [Locking And Work Ownership](LOCKING-AND-WORK-OWNERSHIP.md).

## Partition Ownership

Route one business key to one partition owner:

```text
hash(orderNumber) % partitionCount -> partition
partition -> one active owner
```

All events for one order use the same partition, preserving per-order ordering
under normal processing.

Partitioning improves concurrency:

```text
partition 0 -> worker A
partition 1 -> worker B
partition 2 -> worker C
```

It does not enforce database invariants. Replays, administrative writes, and
other entry paths can bypass normal serialization, so unique constraints,
conditional updates, and idempotency remain necessary.

## Static Shard Ownership

Simple mapping:

```java
int shard = Math.floorMod(orderNumber.hashCode(), shardCount);
```

Static ownership is easy when worker and shard counts rarely change. Changing
`shardCount` remaps many keys, so production designs use fixed logical shards
and assign those shards to changing worker instances.

Required concerns:

- ownership registry/lease;
- generation or fencing token;
- rebalance after worker failure;
- hot-shard detection;
- deterministic key mapping;
- no simultaneous old/new owner writes.

## Lease-Table Shard Ownership

Conceptual table:

```text
worker_partitions
-----------------
partition_id
owner_id
generation
lease_until
```

Acquisition increments `generation`. Writes include that generation so a stale
owner cannot continue after reassignment.

This is useful for custom worker systems but considerably more complex than a
broker consumer group.

## Queue-Based Competing Consumers

In a work queue, one message is normally delivered to one active consumer.
After acknowledgement it is removed or considered complete. If the consumer
dies before acknowledgement, delivery becomes available again.

```text
queue
  job 1 -> worker A
  job 2 -> worker B
  job 3 -> worker C
```

Redelivery means queue ownership is temporary. Consumers must be idempotent.

## Kafka Consumer-Group Ownership

Kafka assigns each partition to at most one consumer in the same group:

```text
topic partitions: P0 P1 P2 P3
consumer A:       P0 P1
consumer B:       P2 P3
```

Consumers in different groups receive independent copies. Rebalance moves
partition ownership when membership or partition count changes.

Kafka does not delete a record after consumption and can redeliver after a
crash, offset rewind, retry, or replay. Business consumers still need business
keys or Inbox/event-ID deduplication.

Canonical Kafka details remain in:

- [Apache Kafka](../../integration/APACHE-KAFKA.md)
- [Spring Kafka Consumers](../../spring/kafka/SPRING-KAFKA-CONSUMERS.md)
- [Spring Kafka Concurrency And Capacity](../../spring/kafka/SPRING-KAFKA-CONCURRENCY-CAPACITY.md)

## Queue Versus Database Claim

| Queue/partition | Database claim |
|---|---|
| broker assigns temporary delivery owner | database predicate assigns row owner |
| natural async backpressure and lag | natural querying by due time/status |
| redelivery after failure | stale claims or rollback make work retryable |
| good for event-triggered work | good for durable time/status-driven work |
| ordering per queue/partition | ordering requires indexed query/order |

## Reservation Expiry

Reservation expiry is time-driven database work. Current candidate state lives
in MySQL as `RESERVED + expires_at`.

Options:

1. poll and conditionally claim rows;
2. poll with `SKIP LOCKED`;
3. run one ShedLock-protected scheduler;
4. publish delayed expiry commands through a delay-capable queue;
5. use a timer service that emits due reservation IDs.

Kafka does not natively provide an arbitrary per-message delivery timestamp as
a general delay queue. Retry topics can approximate delays but are not a direct
replacement for querying durable reservation deadlines.

For Shopverse, MySQL row claiming is simpler because the authoritative status
and expiry time already live there.

## Outbox Publishing

An Outbox publisher can emit claimed records into Kafka. Kafka then provides
partition ownership to downstream consumers, but it does not coordinate the
database pollers that claim Outbox rows. Those pollers still need a database
claim strategy.

```text
MySQL claim ownership
  -> Kafka publication
  -> Kafka consumer-group partition ownership
  -> idempotent business processing
```

## Choosing Partition Count

Useful upper bound:

```text
active consumers in one group <= partition count
```

More partitions improve potential parallelism but increase broker metadata,
open files, rebalance work, and ordering domains. Base the count on measured
throughput, processing time, key distribution, growth, and recovery goals.

## Production Practices

- Choose stable high-cardinality keys that distribute load.
- Keep all events requiring per-key order on the same partition.
- Make consumers idempotent.
- Commit progress only after the durable business transaction succeeds.
- Monitor consumer lag and hot partitions.
- Handle rebalance and shutdown without abandoning in-flight work.
- Use fencing/generation for custom shard leases.
- Keep database constraints as the final invariant guard.

## Shopverse Decision

| Work | Ownership mechanism |
|---|---|
| SAGA event consumption | Kafka consumer group plus business idempotency |
| same-order event ordering | Kafka key `orderNumber` |
| Outbox row claim | database lock/claim before Kafka |
| reservation expiry | database deadline scan and conditional claim target |
| one simple global scheduler | optional ShedLock alternative |

