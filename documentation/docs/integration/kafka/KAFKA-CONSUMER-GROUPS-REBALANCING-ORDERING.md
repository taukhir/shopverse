---
title: Kafka Consumer Groups Rebalancing And Ordering
description: Coordinators, generations, heartbeats, assignors, static membership, rebalance storms, partition keys, skew, expansion, and ordered recovery.
difficulty: Advanced
page_type: Guide
status: Generic
prerequisites: [Kafka consumer groups, partitions, offsets]
learning_objectives: [Trace consumer group membership, Diagnose rebalance storms, Preserve required ordering while scaling and retrying]
technologies: [Apache Kafka 4.x, KafkaConsumer, Spring Kafka]
last_reviewed: "2026-07-28"
---

# Kafka Consumer Groups Rebalancing And Ordering

## Group Runtime

A group coordinator manages membership and committed offsets. Consumers join a
generation, receive partition assignments, maintain liveness, and rejoin when
membership or subscribed partitions change.

```text
bootstrap metadata
 -> locate coordinator
 -> join group
 -> assign/synchronize partitions
 -> fetch, process, commit, heartbeat
 -> rebalance on membership/assignment change
```

The classic protocol separates heartbeat/session liveness from the maximum delay
between polls. Newer consumer group protocol behavior is broker-coordinated and
must be adopted only with compatible brokers, clients, and rollout tests.

## Liveness Timers

| Setting | Question answered |
|---|---|
| session timeout | how long can the group miss liveness before eviction? |
| heartbeat interval | how frequently does classic membership report liveness? |
| max poll interval | how long may application processing delay the next poll? |
| max poll records | how much work can one poll expose to the application? |

Increasing the poll interval hides symptoms if the handler is unbounded. First
bound database/HTTP calls, retries, records per poll, and in-flight work.

## Assignment Strategies

- range assignment can create imbalance across multiple topics;
- round-robin distributes broadly but may move more partitions;
- sticky strategies try to balance while retaining ownership;
- cooperative assignment reduces stop-the-world movement by transferring
  partitions incrementally;
- static membership (`group.instance.id`) reduces churn from short restarts but
  requires unique, correctly managed instance identities.

Assignment choice affects movement and pause time, not business idempotency.

## Rebalance Storm Diagnosis

Look for repeated revoke/assign events, poll interval violations, authentication
resets, pod restarts, unstable network/DNS, duplicate static IDs, autoscaler
oscillation, and deployments that replace too many replicas at once.

Contain by stabilizing membership, reducing poll work, bounding retries, using
graceful shutdown/readiness, controlling rollout surge, and verifying protocol
compatibility. Avoid repeatedly scaling a group every few seconds from noisy lag.

## Ordering Boundary

Kafka orders records only within one partition. Select the key from the smallest
business scope that requires serialization:

```text
order lifecycle -> orderId
account ledger -> accountId
tenant-global order -> tenantId (may become hot)
```

Unkeyed or changing keys sacrifice that guarantee. Global topic ordering requires
one partition and usually rejects useful scalability.

## Hot Keys And Skew

More partitions do not divide one hot key. Options include:

- redesign whether strict ordering is truly needed;
- controlled key bucketing with downstream sequence reconciliation;
- isolate extreme tenants/entities into dedicated topics;
- fair admission and tenant quotas;
- split independent sub-aggregates.

Measure bytes, records, and processing cost per partition; equal record count can
still hide unequal work.

## Adding Partitions

Adding partitions increases potential parallelism but can remap a key under the
default partitioning calculation. Old and new records for one key may reside in
different partitions and be processed concurrently.

Migration choices:

- accept ordering only from a documented cutover epoch;
- pause production and drain before expansion;
- version the partitioning strategy;
- use aggregate sequence/version validation at consumers;
- create a new topic and migrate with an explicit routing plan.

## Retry And Ordering

Blocking retry holds the partition and better preserves order but can stall other
keys on it. Retry topics free the main partition but allow later same-key records
to overtake the failed record. Choose explicitly:

- keep blocking retry short and bounded;
- use state/version-aware consumers;
- park or pause only the affected partition;
- route one aggregate through an ordered workflow;
- compensate/reconcile late events.

DLT recovery also removes a record from the main sequence. Advancing past it is a
business decision, not only an error-handler setting.

## Offset Expiration And Replay

Committed group offsets can expire according to broker policy when the group is
inactive and no longer subscribed. A returning group then follows its reset
policy. Important consumers need retention aligned to outage expectations,
monitoring, and a documented reset/replay procedure. Prefer a new group for
isolated rebuilds and make side effects replay-safe.

## Interview Questions

**Why do five consumers process only three partitions?** At most one consumer in
the group owns a partition; two are idle.

**Why did a rolling deployment produce duplicates?** Revocation/reassignment can
replay work completed after the last safe offset commit. Idempotency is required.

**Can cooperative rebalancing eliminate pauses?** It reduces partition movement
and disruption; it cannot eliminate failure, ownership transitions, or duplicate
windows.

## Official References

- [Kafka consumer configuration](https://kafka.apache.org/documentation/#consumerconfigs)
- [Kafka consumer API](https://kafka.apache.org/43/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html)
- [Spring Kafka rebalance listeners](https://docs.spring.io/spring-kafka/reference/kafka/receiving-messages/rebalance-listeners.html)

## Recommended Next

Continue with [Consumer Offset Commits](./KAFKA-CONSUMER-OFFSET-COMMITS.md).

