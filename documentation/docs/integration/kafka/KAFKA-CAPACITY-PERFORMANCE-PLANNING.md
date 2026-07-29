---
title: Kafka Capacity And Performance Planning
description: Quantitative planning for partitions, consumers, producers, storage, network, recovery, retention, and downstream limits.
difficulty: Architect
page_type: Decision Guide
status: Generic
prerequisites: [Kafka partitions, producer batching, consumer groups]
learning_objectives: [Calculate initial Kafka capacity, Validate scaling against bottlenecks, Plan backlog and failure recovery headroom]
technologies: [Apache Kafka 4.x, Spring Kafka, Prometheus]
last_reviewed: "2026-07-28"
---

# Kafka Capacity And Performance Planning

Capacity starts with workload measurements, not a conventional partition count.

## Workload Contract

Record peak and normal:

- records/second and bytes/second;
- average, p95, and maximum record size;
- key cardinality and skew;
- retention and replay window;
- producer durability requirement;
- consumer end-to-end service time and freshness SLO;
- region/zone failure and recovery target;
- annual growth and burst factor.

## Consumer And Partition Sizing

```text
safe rate per consumer
  = measured sustainable completions/sec at target p99

required active consumers
  = ceiling(peak arrival rate / safe rate per consumer)

effective active consumers
  = min(partitions, replicas * concurrency)
```

If peak is 15,000 records/s and a listener safely completes 1,200 records/s,
the theoretical need is 13 active consumers. Add headroom for key skew, rollout,
one-instance loss, retries, and backlog recovery, then validate broker and
downstream capacity.

Use processing **cost**, not only record count. Ten fraud checks can cost more
than a thousand cache updates.

## Backlog Recovery

```text
lag growth rate = arrival rate - completion rate

net recovery rate = recovery completion rate - current arrival rate

recovery time = backlog / net recovery rate
```

A group that only matches the normal arrival rate can never catch up. Design a
bounded recovery mode with spare downstream capacity and fair tenant admission.

## Storage

```text
raw daily bytes
  = records/sec * average stored record bytes * 86,400

replicated retained bytes
  = raw daily bytes * retention days * replication factor
```

Adjust with measured compression, then add segment/index overhead, filesystem
headroom, replication movement, compaction amplification, tiering behavior, and
growth. Do not operate disks near full; reassignments and recovery need temporary
space.

For compacted topics, size from key churn, tombstones, cleaner lag, and dirty
segments—not simply the latest value per key.

## Network

Include producer ingress, follower replication, consumer egress for every group,
cross-zone traffic, reassignment, catch-up replicas, Connect, Streams repartition,
and cross-region replication.

```text
consumer egress ~= topic bytes/sec * independent full-reading groups
```

Compression can reduce network and disk but consumes producer/consumer CPU.

## Partition Cost

Partitions add parallelism and distribute leaders, but also add metadata, open
files, replication work, leader-election/recovery time, consumer assignments,
Streams tasks, and operational movement. Very large counts require cluster-specific
load tests and failure drills.

Select enough partitions for:

- target parallelism and growth;
- peak producer throughput;
- largest useful consumer fleet;
- key distribution;
- failover with one or more consumers unavailable.

Do not use partitions to compensate for a saturated database or one hot key.

## Poll And Batch Budget

Approximate sequential poll work:

```text
poll work duration
  ~= returned records * p95 per-record service time
```

It must remain comfortably within the poll interval after including retries, GC,
locks, and network tails. Real database batching changes the service curve, so
benchmark batches and define partial-failure behavior.

Bound both record count and bytes across producer batches, consumer fetches,
listener batches, executor queues, and database writes.

## Downstream Capacity Is The Ceiling

Before increasing consumers, budget:

```text
Kafka listener DB demand
+ HTTP request DB demand
+ retry/replay demand
< safe database pool and server capacity
```

Use separate bulkheads where one workload must not starve another. Apply the same
reasoning to HTTP providers, CPU, heap, and rate-limited APIs.

## Failure Headroom

Test capacity with:

- one broker unavailable;
- one consumer replica unavailable;
- rolling deployment overlap and rebalances;
- one zone unavailable;
- retry rate at expected failure budget;
- Streams state restoration or Connect snapshot;
- backlog catch-up while normal traffic continues;
- replica reassignment consuming disk/network.

## Tuning Experiment

Change one variable at a time: `linger.ms`, `batch.size`, compression,
`max.poll.records`, fetch size/wait, concurrency, or DB batch size. Measure
throughput, p95/p99 age, CPU, allocation/GC, network, disk, lag slope, retry rate,
and downstream saturation. Preserve the baseline and rollback threshold.

## Capacity Review Questions

- What is the measured sustainable rate per partition and consumer?
- Can the service catch up before its freshness/retention deadline?
- Which resource saturates first during failover?
- How much disk remains during reassignment?
- Can a single tenant or key consume the headroom?
- Are retry, replay, Connect, Streams, and DR traffic included?
- Which metric triggers scaling, throttling, or load shedding?

## Official References

- [Kafka producer configuration](https://kafka.apache.org/documentation/#producerconfigs)
- [Kafka consumer configuration](https://kafka.apache.org/documentation/#consumerconfigs)
- [Kafka monitoring](https://kafka.apache.org/documentation/#monitoring)

## Recommended Next

Apply the calculations in the [Production Failure Playbook](./KAFKA-PRODUCTION-FAILURE-PLAYBOOK.md).

