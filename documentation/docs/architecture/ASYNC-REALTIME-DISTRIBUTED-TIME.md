---
title: Asynchronous And Real-Time Distributed Systems
difficulty: Advanced
page_type: Decision Guide
status: Generic
keywords: [priority queue, delayed queue, visibility timeout, WebSocket, SSE, Snowflake ID, ULID, clock skew, logical clock]
learning_objectives: [Choose queue and real-time communication semantics, Select distributed identifiers safely, Handle clocks ordering and late events]
technologies: [Kafka, RabbitMQ, WebSocket, SSE]
last_reviewed: "2026-07-12"
---

# Asynchronous And Real-Time Distributed Systems

## Queues, Delays, And Fairness

| Requirement | Mechanism |
|---|---|
| competing workers and per-message acknowledgment | work queue |
| replayable ordered log by key | Kafka-like partitioned log |
| retry after a time | delayed queue, timer wheel, scheduled table, or broker delay |
| hide claimed work during processing | visibility timeout/lease |
| urgent before normal work | bounded priority queues or separate capacity |

Visibility timeout is a lease, not exactly-once delivery. If processing exceeds
it, renew safely or expect redelivery. Use idempotent consumers, bounded attempts,
exponential backoff with jitter, dead-letter/manual review, and poison-message
isolation. Measure oldest-message age, not queue depth alone.

Priorities can starve normal work. Reserve capacity per class or use weighted
fair scheduling. Work stealing improves utilization but complicates locality,
ordering, cancellation, and ownership recovery.

## Real-Time Communication

| Mechanism | Direction | Fit |
|---|---|---|
| short/long polling | request/response | simple clients and infrequent updates |
| SSE | server to browser | notifications and ordered text event streams |
| WebSocket | bidirectional | chat, collaboration, presence, interactive control |

Design authentication/renewal, connection limits, heartbeats, idle cleanup,
reconnect with jitter, resume cursor, duplicate suppression, slow-client buffers,
backpressure, fan-out, ordering scope, and regional affinity. Presence is a
time-bounded hint, not durable truth. Store durable messages independently from
connection servers.

## Distributed IDs

| ID | Property | Trade-off |
|---|---|---|
| random UUID | decentralized and opaque | poor index locality, larger keys |
| time-ordered UUID/ULID | roughly sortable and decentralized | exposes time; same-time order needs care |
| Snowflake-style | time + worker + sequence, compact/sortable | worker allocation and clock rollback |
| database sequence | compact and ordered locally | central allocation/shard coordination |

Do not treat sortable IDs as authoritative event ordering. Avoid embedding tenant,
region, or sensitive meaning unless disclosure is acceptable.

## Time And Ordering

Wall clocks can jump due to synchronization; use monotonic elapsed time for
timeouts and durations. Synchronize clocks and monitor skew, but do not base
distributed correctness solely on timestamps.

Lamport clocks capture a happens-before-compatible order without wall time;
vector clocks represent causality across participants at metadata cost; hybrid
logical clocks combine physical proximity with logical ordering. Choose only when
the conflict/ordering model needs them.

Streaming distinguishes event time from processing/ingestion time. Watermarks
estimate completeness; windows group events; allowed lateness and retractions
define how late events correct results. Keep replay deterministic.

## Recommended Next Page

Read [Multi-Tenancy, Object Storage, And Feature Flags](./MULTITENANCY-STORAGE-FEATURE-FLAGS.md).
