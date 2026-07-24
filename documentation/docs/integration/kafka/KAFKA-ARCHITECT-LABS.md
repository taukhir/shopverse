---
title: Kafka Architect Labs And Interview Workbook
description: Failure-driven Kafka and Spring Kafka labs, design scenarios, interview rubrics, and mastery gates.
difficulty: Advanced
page_type: Lab
status: Generic
prerequisites: [Kafka architect learning path]
learning_objectives: [Prove Kafka behavior under failure, Diagnose incidents from evidence, Defend architecture decisions in interviews]
technologies: [Apache Kafka 4.x, Spring Kafka 4.x, Testcontainers, Prometheus]
last_reviewed: "2026-07-23"
---

# Kafka Architect Labs And Interview Workbook

## Lab Rules

Each lab must record hypothesis, topology, version, configuration, commands,
timestamps, metrics, logs, offsets, result, cleanup, and conclusion. Predict the
result before injecting the fault. A screenshot without interpretation is not
evidence.

Never run destructive broker or offset commands against an unverified cluster.
Use disposable local/Testcontainers environments unless a production change has an
approved runbook.

## Lab 1 — Partitioning And Ordering

1. Create a six-partition topic.
2. Produce interleaved events for multiple order IDs keyed by order ID.
3. Prove per-key partition placement and order.
4. increase the partition count and measure mapping changes for new records.
5. demonstrate why topic-wide order would require a single serial path.

Pass condition: explain exactly which ordering guarantee survived and which did
not, including application-side asynchronous processing.

## Lab 2 — Producer Durability And Backpressure

Compare `acks`, idempotence, `linger.ms`, batch size, compression, delivery timeout,
and unavailable-broker behavior. Measure throughput, p95/p99 latency, retries,
batch efficiency, buffer wait, CPU, and network.

Pass condition: choose settings for a low-latency payment command and a high-volume
analytics stream from evidence rather than copied defaults.

## Lab 3 — Slow Consumer And Rebalance

Inject database latency so poll processing exceeds budget. Observe lag, partition
assignments, poll interval failure, duplicate processing, and recovery. Repeat with
smaller polls, batching, bounded concurrency, static membership, and cooperative
assignment where supported.

Pass condition: calculate maximum safe poll work and backlog catch-up time, while
respecting downstream capacity.

## Lab 4 — Duplicate-Safe Business Effect

Commit a database change, kill the consumer before the offset commit, and observe
redelivery. Add an inbox unique constraint and keep inbox insertion plus business
effect in one database transaction.

Pass condition: repeated delivery produces one authoritative effect, and the test
does not rely on a race-prone read-before-insert check.

## Lab 5 — Retry And DLT

Test transient, permanent, and deserialization failures. Exercise blocking retry,
non-blocking retry, DLT routing, DLT publish failure, recovery metadata, replay,
and same-key ordering.

Pass condition: every record reaches success or an auditable terminal state; retry
traffic cannot exhaust the main path; replay is idempotent and rate limited.

## Lab 6 — Kafka Transaction

Consume, transform, and produce in one Kafka transaction. Kill the process before
commit and compare `read_uncommitted` with `read_committed`. Start two instances
with the same transactional ID prefix and observe fencing; then correct identity.

Pass condition: explain why this does not make a database or payment API effect
exactly once.

## Lab 7 — Transactional Outbox And CDC

Create a business row and outbox row atomically. Publish with a polling relay or CDC
connector. Inject crashes before publish, after publish but before marking, and
during restart.

Pass condition: no committed business change permanently lacks an event, duplicate
publication is safe, and the outbox has retention/cleanup/monitoring ownership.

## Lab 8 — Security And Rotation

Configure TLS plus workload authentication and least-privilege ACLs. Prove that a
producer cannot read, a consumer cannot write, and the intended group cannot use an
unapproved topic. Rotate trust and credential material without interrupting all
clients.

Pass condition: access is minimal, denial is observable, and old credentials are
revoked only after verified migration.

## Lab 9 — Broker And Disk Failure

Run a multi-broker KRaft cluster with replicated topics. Stop a partition leader,
observe election and client recovery, then create an ISR/minimum-ISR condition that
rejects unsafe writes. Simulate disk pressure in a disposable environment.

Pass condition: distinguish temporary unavailability, acknowledged durability,
under-replication, and actual data loss risk.

## Lab 10 — Kafka Streams State

Build keyed aggregation and a windowed join. Include late and out-of-order records,
changelog/repartition inspection, restart, state restoration, and a deliberately
incompatible topology change.

Pass condition: explain stream time, grace, state growth, restoration SLO, and the
upgrade/migration plan.

## Lab 11 — Connect And CDC Recovery

Deploy distributed Connect with a CDC source and sink. Stop a worker, restart a
task, introduce a poison record, and inspect config/offset/status topics and DLQ.

Pass condition: prove connector recovery position, duplicate behavior, schema
handling, plugin ownership, and external-system backpressure.

## Lab 12 — Regional Failover Game Day

Replicate selected topics and checkpoints to a second cluster. Simulate regional
loss, execute client cutover, choose consumer start offsets, measure RPO/RTO, and
perform failback with reconciliation.

Pass condition: the design handles replication lag, duplicates, split ownership,
offset translation, data residency, and irreversible writes explicitly.

## Architect Design Scenarios

For each scenario, state requirements, invariants, volume, key, partitions,
replication, retention, schema, delivery model, consistency boundary, failure
policy, security, observability, capacity, rollout, and recovery.

1. Kafka is unavailable for 30 minutes while APIs keep accepting orders.
2. One tenant generates 80% of events and one key is extremely hot.
3. More partitions are required without violating order state transitions.
4. Payment succeeds but consumer offset commit fails.
5. Database commits but immediate Kafka publication fails.
6. DLT volume rises 100 times after deployment.
7. Broker disk reaches 90% while compaction falls behind.
8. Old and new producers/consumers coexist through a breaking business change.
9. Two years of data must be replayed without sending old notifications.
10. Credentials and certificates must rotate without downtime.
11. A region fails while cross-region replication is behind.
12. Tenant-level quotas and legal data residency are mandatory.

## Interview Answer Rubric

| Level | Evidence |
|---|---|
| weak | names a setting or adds consumers without locating the bottleneck |
| senior | traces the runtime, uses metrics, identifies failure windows, proposes bounded fixes |
| lead | coordinates application, broker, database, security, rollout, and operational ownership |
| architect | quantifies trade-offs, states invariants and guarantees, plans migration/recovery, and challenges whether Kafka is appropriate |

## Top Questions

### Why is consumer lag rising?

Separate global capacity from partition skew. Compare arrival, processing, and
commit rates; inspect processing latency, downstream pools, retry rate, GC,
rebalances, poll budgets, assignment, and key distribution. Scale only the actual
bottleneck and estimate catch-up before retention overtakes the group.

### How do you guarantee ordering?

Kafka orders records within a partition. Use the business ordering identity as the
key, preserve partition mapping, and avoid concurrent same-key processing. Then
account for partition increases, retry topics, replays, and downstream asynchronous
work. Global order sacrifices horizontal parallelism.

### How do you achieve exactly once?

First name the effect. Kafka transactions can atomically combine Kafka input
offsets, state/output, and Kafka writes. Database and external effects require
idempotency, inbox/outbox, external idempotency keys, and reconciliation. “Enable
idempotence” is not a complete answer.

### What happens when a broker fails?

Affected leaders become unavailable until eligible replicas take leadership.
Clients refresh metadata and retry. Outcome depends on ISR health, replication,
minimum ISR, acknowledgment, unclean-election policy, and timeout configuration.

### Kafka or RabbitMQ/share group?

Choose from retention/replay, ordering, routing, queue acquisition, fan-out,
throughput, operational ecosystem, latency, and failure semantics. Do not choose
from brand familiarity.

## Final Mastery Gate

- [ ] all twelve labs have reproducible evidence and cleanup;
- [ ] every design scenario has quantified capacity and recovery decisions;
- [ ] producer, consumer, broker, and Spring container paths can be drawn unaided;
- [ ] security and multi-tenant access can be implemented and audited;
- [ ] Kafka, database, and external-effect consistency boundaries are explained;
- [ ] lag, rebalance, replication, disk, schema, DLT, and regional incidents have runbooks;
- [ ] a 45-minute architecture interview can be completed with explicit trade-offs;
- [ ] limitations and version-sensitive APIs are verified in official documentation.

## Recommended Review

Return to the [Kafka Architect Learning Path](../KAFKA-ARCHITECT-PATH.md) and close
every completion-evidence item before claiming mastery.
