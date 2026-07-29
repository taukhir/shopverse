---
title: Transactional Outbox Production Failure Modes
description: Relay crashes, duplicates, stuck claims, ordering, poison rows, backlog, cleanup, CDC, and reconciliation for production outboxes.
difficulty: Architect
page_type: Operations Guide
status: Generic
prerequisites: [Transactional outbox, Kafka producer reliability, database transactions]
learning_objectives: [Explain the outbox delivery guarantee, Operate a scalable relay, Recover every major production outbox failure]
technologies: [Spring Boot, Apache Kafka, SQL, Debezium]
last_reviewed: "2026-07-28"
---

# Transactional Outbox Production Failure Modes

The transactional outbox atomically stores domain state and publication intent.
It normally provides **at-least-once publication**, not exactly-once business
effects.

```text
DB transaction: domain row + outbox row
relay: outbox row -> Kafka -> mark published
consumer: deduplicate event -> business effect
```

## Fundamental Crash Windows

| Failure point | Result | Required control |
|---|---|---|
| before DB commit | neither domain nor event exists | transaction rollback |
| after DB commit, before relay | pending row survives | relay recovery |
| before Kafka acknowledgment | publication unknown/failed | retry with same event ID |
| after Kafka acknowledgment, before `PUBLISHED` update | duplicate publication | idempotent consumer |
| after marking published | normal completion | retention/cleanup |

Deleting or marking before broker acknowledgment can lose events. Marking after
acknowledgment creates an unavoidable duplicate window; accept it and deduplicate.

## Safe Polling Relay

Use a short claim transaction, publish outside it, and finalize conditionally:

```text
transaction 1:
  claim bounded rows with claim_token and lease_until
commit

outside transaction:
  publish each row and await broker acknowledgment

transaction 2:
  mark PUBLISHED where id = ? and claim_token = ?
commit
```

Do not hold database row locks while waiting on Kafka. Use `SKIP LOCKED` where
supported or an atomic conditional update. A claim token fences a stale worker
that resumes after its lease expired.

```sql
UPDATE outbox_event
SET status = 'PROCESSING',
    claim_token = :token,
    lease_until = :lease,
    attempts = attempts + 1
WHERE id = :id
  AND status = 'PENDING';
```

## Stuck Claims

A relay can die after claiming rows. A recovery worker may reset an expired claim
only after verifying the lease and attempt policy. Expiry must exceed ordinary
publish p99 plus network variance, and the finalize update must include the claim
token so the former owner cannot overwrite the new owner.

Alert on oldest `PROCESSING` lease age and repeated reclaim count.

## Ordering

Multiple relay workers and Kafka retries can reorder different rows. When order
matters for one aggregate:

- assign a monotonically increasing aggregate sequence in the domain transaction;
- publish with aggregate ID as Kafka key;
- prevent concurrent publication for the same aggregate or partition lane;
- let consumers reject/defer an unexpected sequence;
- never assume global table creation order gives global Kafka order.

Global ordering is usually an unnecessary scalability constraint.

## Batching

Use bounded claim and publish batches. Track success per record; do not mark a
whole batch published because one producer future completed.

| Too small | Too large |
|---|---|
| database/producer overhead | locks, heap, latency, and retry amplification |

Tune from event size, Kafka acknowledgment latency, database load, and backlog
recovery target. Bound both row count and serialized bytes.

## Kafka Outage And Backlog Growth

During an outage, pending rows grow at the business transaction rate:

```text
required outage storage ~= writes/sec * row bytes * outage duration
```

Include indexes, WAL/redo, replicas, growth headroom, and cleanup lag. Define:

- warning and critical oldest-age thresholds;
- database disk protection threshold;
- producer retry budget and circuit breaker;
- admission control or degraded operation;
- recovery rate greater than normal arrival rate;
- fair draining so one tenant cannot starve others.

An outbox moves availability pressure to the database. It does not remove it.

## Poison Rows

Serialization bugs, oversized events, authorization, unsupported topic mappings,
and invalid headers can make a row permanently unpublishable.

After bounded attempts:

- move to `FAILED` or quarantine state;
- retain payload, error category, attempt history, and correlation data securely;
- alert an owning team;
- fix or transform through an audited replay workflow;
- do not let one row block unrelated aggregate streams.

## Cleanup And Table Health

Delete/archive published rows in small indexed batches. Large deletes create
locks, WAL, replication lag, and vacuum pressure. Monitor table/index size,
dead tuples or fragmentation, cleanup lag, query plans, and replica delay.

Partitioning by creation time can simplify retention, but never drop a partition
containing pending, processing, failed, or audit-required rows.

## CDC Relay Failure Modes

Debezium avoids application polling but still requires:

- connector offset and schema-history durability;
- database log/WAL retention greater than connector outage;
- snapshot policy and duplicate-safe consumers;
- outbox event-router configuration and stable IDs/keys;
- monitoring source-log position and connector lag;
- capacity for restart catch-up;
- schema changes compatible with rows already stored.

If database logs expire before the connector catches up, recovery may require a
snapshot and reconciliation; it is not a routine restart.

## Schema And Deployment Ordering

An outbox row may wait hours before publication. The relay and consumers must be
able to publish/read old rows after a deployment. Prefer self-describing event
type/version, additive schema changes, dual-read migration, and contract tests.
Never deploy a relay that can no longer serialize pending old-format rows.

## Reconciliation

No operational pattern is complete without reconciliation. Periodically compare
authoritative domain states that require events with outbox/published evidence.
Repair missing publication intent using a controlled, idempotent procedure.

Reconciliation detects code paths that accidentally changed domain state without
creating an outbox row—something the relay alone cannot discover.

## Metrics And Alerts

- oldest pending age and pending count;
- creation and successful publication rates;
- publish acknowledgment latency and error category;
- attempts, failed rows, expired/stale claims;
- claim/finalize conflicts;
- per-tenant and per-event-type backlog;
- cleanup lag and table/index bytes;
- CDC source lag and database log-retention headroom;
- duplicate publication and consumer deduplication rate.

Page on age/SLO and storage risk, not merely a nonzero row count.

## Production Test Matrix

Inject crashes after DB commit, after claim, after Kafka ack, and before finalize.
Also test Kafka outage, expired credentials, schema incompatibility, oversized
events, multiple relay instances, stale leases, database failover, CDC restart,
and backlog catch-up. Verify no missing business event and only one consumer
business effect.

## Interview Questions

**Can the outbox publish duplicates?** Yes. A crash after broker ack and before
marking the row published causes retry. Stable event ID plus consumer idempotency
is mandatory.

**What if Kafka is down for 30 minutes?** Domain writes and pending rows may
continue until defined storage/admission limits. Stop retry storms, monitor age
and disk, then drain at a controlled rate faster than arrival.

**How do multiple relays avoid duplicate claims?** Short atomic claims using
conditional updates or skip-locked selection, leases, and fencing claim tokens.
Duplicate publication remains possible and safe by design.

## Official References

- [Debezium Outbox Event Router](https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html)
- [Kafka producer configuration](https://kafka.apache.org/documentation/#producerconfigs)
- [Kafka delivery semantics](https://kafka.apache.org/documentation/#semantics)

## Recommended Next

Apply these controls to [Saga Liveness, Timeout, And Recovery](./SAGA-LIVENESS-TIMEOUT-RECOVERY.md).

