---
title: Database System-Design Interview Exercises
sidebar_position: 12
difficulty: Advanced
page_type: Case Study
status: Generic
keywords: [database interview, Uber system design, WhatsApp storage, Stripe idempotency, Amazon inventory, rejected alternatives]
learning_objectives: [Choose databases from access patterns and invariants, Explain scaling and consistency trade-offs, Defend rejected alternatives]
technologies: [PostgreSQL, MySQL, Cassandra, Redis, OpenSearch, ClickHouse]
last_reviewed: "2026-07-12"
---

# Database System-Design Interview Exercises

These are educational archetypes, not claims about any company's current
architecture. For every exercise, clarify requirements, estimate scale, define
invariants and access patterns, choose authoritative and derived stores, explain
partitioning/consistency/failure behavior, and reject credible alternatives.

## 1. Uber-Like Location And Ride Data

**Prompt:** design storage for live driver locations, nearby-driver lookup, ride
matching, and durable trip/payment history.

Ask about update frequency, location precision, city/region boundaries, search
radius, acceptable staleness, driver count, trip correctness, retention, and
regional failure behavior.

A defensible design separates workloads:

- use an in-memory/geospatial index or purpose-built location service for
  short-lived driver positions, partitioned by geographic cell and region;
- use PostgreSQL/MySQL for durable rides, assignments, prices, and payments;
- stream historical events to ClickHouse for operational analytics;
- use fencing/version checks so two matchers cannot authoritatively assign one driver.

**Rejected alternatives:** a relational table alone can work at smaller scale,
but constant updates and radius queries may contend with durable OLTP. Cassandra
can ingest location history but is not naturally an arbitrary nearest-neighbor
engine. A vector database solves semantic similarity, not geographic correctness.

## 2. WhatsApp-Like Message Storage

**Prompt:** design one-to-one/group message persistence, ordered history,
delivery state, offline retrieval, attachments, and multi-device synchronization.

Model the critical query as conversation plus time. At very large scale, a
wide-column design can use a bounded time bucket in the partition key and message
time/ID as clustering columns. Store attachment bytes in object storage and
metadata/references with the message. Keep identity, membership, and policy in a
relational store when transactions and constraints are valuable.

Discuss per-conversation ordering rather than impossible global ordering,
idempotent message IDs, replication, quorum/consistency choices, hot celebrity
groups, fan-out, retention, encryption, abuse/audit metadata, and regional routing.

**Rejected alternatives:** one unpartitioned conversation creates hotspots;
offset pagination becomes expensive; Redis alone is not durable message truth;
Elasticsearch is a derived search index and must not define delivery state.

## 3. Stripe-Like Idempotent Payments

**Prompt:** design a payment API that safely handles client retries, timeouts,
webhooks, and downstream processor uncertainty.

Use a relational system of record with ACID transactions and constraints. Scope
an idempotency key to the caller/operation, store a request fingerprint, state,
and stable response, and enforce uniqueness. In one transaction, change payment
state and write an outbox event. A retry with the same key and same fingerprint
returns the recorded result; the same key with different input is rejected.

Explain state-machine transitions, optimistic locking, ledger immutability,
unknown processor outcomes, reconciliation, webhook deduplication, expiration,
PII/PCI boundaries, encryption, access control, and audit evidence.

**Rejected alternatives:** cache-only deduplication loses keys; check-then-insert
without a unique constraint races; synchronous dual writes split truth; eventual
consistency is unacceptable for the authoritative balance/ledger invariant.

## 4. Amazon-Like Inventory And Product Search

**Prompt:** design authoritative stock reservation and high-scale product search
with filters, facets, text relevance, and variable product attributes.

Use PostgreSQL/MySQL for inventory and reservations with atomic conditional
updates or explicit locking, unique constraints, expiration, and idempotent order
identity. Use relational columns plus JSONB/document fields for a catalog when
that model remains manageable. Publish an outbox/CDC stream to OpenSearch for
full-text discovery and to ClickHouse for analytics. Cache only bounded,
reconstructable reads.

State the search freshness SLO and behavior when search shows a product whose
price or stock changed. Checkout must re-read and validate authoritative data.

**Rejected alternatives:** OpenSearch cannot own inventory invariants; Redis
alone risks durability/correctness; Cassandra is strong for known partition-key
access but weak for ad hoc product filtering and cross-item reservation
transactions; synchronous OLTP-to-search dual writes create inconsistent truth.

## Answer Framework

Use this structure in every interview:

1. **Requirements:** functional scope, invariants, SLOs, scale, growth, regions,
   consistency, security, retention, and cost.
2. **Access patterns:** write exact critical queries and their cardinality.
3. **Data ownership:** identify the system of record and rebuildable projections.
4. **Schema/distribution:** keys, indexes, partitions, shards, replicas, and hotspot controls.
5. **Correctness:** transactions, ordering scope, idempotency, concurrency, and staleness.
6. **Operations:** overload, failover, backup/restore, migration, observability, and audit.
7. **Alternatives:** reject at least two plausible choices against named requirements.
8. **Validation:** describe the benchmark and failure experiment that could change the decision.

## Self-Scoring Rubric

| Area | Points |
|---|---:|
| clarifies requirements and estimates scale | 20 |
| defines invariants and access patterns | 20 |
| assigns authoritative versus derived ownership | 15 |
| explains partitioning, consistency, and failure behavior | 20 |
| covers security, operations, and cost | 10 |
| explains rejected alternatives with evidence | 15 |

## Recommended Next Page

Compare your answers with [Database System Design Scenarios](./SYSTEM-DESIGN-SCENARIOS.md)
and formalize the final choice using the [Database Decision Worksheet](./DATABASE-DECISION-WORKSHEET.md).

## Official References

- [PostgreSQL documentation](https://www.postgresql.org/docs/current/)
- [MySQL Reference Manual](https://dev.mysql.com/doc/refman/8.4/en/)
- [Apache Cassandra documentation](https://cassandra.apache.org/doc/latest/)
