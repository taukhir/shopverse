---
title: Consistency Models And BASE
sidebar_position: 7
difficulty: Advanced
page_type: Concept
status: Generic
learning_objectives: [Distinguish consistency models, Explain BASE and soft state, Choose consistency from business invariants]
technologies: [Cassandra, MongoDB, DynamoDB, CockroachDB, Redis]
last_reviewed: "2026-07-11"
---

# Consistency Models And BASE

Consistency defines which values and orderings clients may observe when data is
replicated or updated concurrently. It is not a single strong-versus-eventual switch.

## Consistency Model Comparison

| Model | Guarantee | Suitable example |
|---|---|---|
| linearizable | each operation appears atomic and ordered consistently with real time | last inventory unit, leader/fencing state |
| serializable isolation | concurrent transactions have an outcome equivalent to some serial order | transfers, multi-row invariants |
| causal | causally related operations are observed in causal order | reply appears after its parent post |
| read-your-writes | a client/session sees its own acknowledged updates | profile page after saving |
| monotonic reads | once a client sees a version, it does not later see an older one | order-status refresh |
| monotonic writes | one client's writes are applied in that client's order | successive preference changes |
| bounded staleness | reads may lag, but no more than a stated time/version bound | regional catalog with an explicit freshness SLO |
| eventual | if updates stop and communication continues, replicas eventually converge | search index, analytics projection |
| weak consistency | umbrella term for guarantees weaker than strong/linearizable behavior | cache or replica behavior, only when its exact guarantee is specified |

**Transaction isolation** and **replica consistency** are related but different.
A database can provide serializable transactions on one authority while an
asynchronous read replica remains stale.

## Eventual Consistency

Eventual consistency guarantees convergence under assumptions: updates stop,
messages/repair continue, and conflict resolution is deterministic enough for
replicas to reach the same state. Before convergence, clients may observe stale,
missing, reordered, or conflicting values depending on the system.

```text
t0  primary accepts product price = 120
t1  search replica still shows 100
t2  replication/indexing completes
t3  both expose 120
```

Eventual consistency does **not** specify:

- how long convergence takes;
- which write wins a conflict;
- whether a session sees its own write;
- whether versions appear in a monotonic order;
- whether an acknowledged write can be lost under the chosen durability settings.

Turn “eventually” into an SLO such as: 99.9% of product updates appear in search
within 10 seconds, with an alert and replay process for older events.

## Weak Consistency

Weak consistency is not one precise universal contract. It generally means the
system does not guarantee that every read immediately observes the latest write.
Always name the actual guarantee: eventual convergence, bounded staleness,
session consistency, cache TTL, quorum level, or best-effort availability.

Saying “this is weakly consistent” without describing allowed observations,
conflict handling, and time bounds is insufficient for system design.

## BASE

BASE is commonly contrasted with strict ACID-centric design:

- **Basically Available:** the distributed service aims to respond despite some
  failures, possibly with stale, partial, degraded, or conflict-bearing data.
- **Soft state:** externally visible replicated/derived state may change over
  time because asynchronous replication, expiration, repair, or reconciliation
  continues—even without a new user command at that replica.
- **Eventual consistency:** replicas/projections converge when updates stop and
  required communication/reconciliation succeeds.

Soft state does not mean “data may randomly disappear” or that durability is
unimportant. It means the current distributed view is not treated as a single
immediately stable value. TTL expiration is another common form of time-varying state.

BASE and ACID are not mutually exclusive product labels. A service can commit an
order with a local ACID transaction and update its search/timeline projections
with BASE-style asynchronous processing.

## CAP And PACELC

During a network partition, a distributed operation must choose between serving
every reachable request and preserving a single linearizable view. CAP applies
to the partition case. PACELC adds the normal case:

```text
if Partition: choose Availability or Consistency
Else:          choose Latency or Consistency
```

A system can make different choices for different operations. Reject a last-item
reservation without quorum, while accepting a shopping-cart note for later merge.
See [Scaling, CAP, And Data Distribution](./SCALING-CAP-DISTRIBUTION.md).

## Quorums And Tunable Consistency

For replication factor `N`, a simplified quorum rule is:

```text
R + W > N
```

where `R` is replicas consulted by a read and `W` is replicas acknowledging a
write. This creates overlap, but does not by itself guarantee linearizability;
sloppy quorums, concurrent writes, clock/order semantics, failed repairs, and
implementation details matter.

Systems such as Cassandra allow operation-level consistency choices. MongoDB
write concern/read concern and DynamoDB read modes expose different trade-offs.
Use product-specific guarantees rather than assuming all “quorums” behave alike.

## Convergence And Conflict Handling

| Mechanism | Purpose | Risk or limitation |
|---|---|---|
| last-write-wins | choose a winner using timestamp/order | clock skew or concurrent intent can discard valid updates |
| version/vector metadata | identify ordering or concurrent versions | metadata and application merge complexity |
| CRDT | deterministic merge for supported data types | model-specific semantics; not a general invariant solver |
| read repair | reconcile replicas during reads | cold data may remain inconsistent without anti-entropy |
| anti-entropy/repair | compare and repair replicas in background | consumes I/O/network and needs operational discipline |
| hinted handoff/retry | deliver missed writes later | backlog, expiration, duplicates, and delayed convergence |
| saga/compensation | coordinate cross-service business steps | compensation is domain logic, not rollback through time |

Make consumers idempotent. Use stable event IDs, deduplication/inbox state,
optimistic versions, conditional writes, and replayable outbox/CDC pipelines.

## Choose Consistency Per Invariant

| Scenario | Recommended posture | Reason |
|---|---|---|
| debit or payment capture | strong transaction and idempotency | duplicates/stale decisions lose money |
| reserve final inventory unit | atomic conditional update or serializable invariant | prevent overselling |
| username/email uniqueness | authoritative unique constraint | concurrent registration must have one winner |
| shopping-cart item additions | mergeable/eventual can work | conflicts can often be unioned with domain rules |
| social feed timeline | eventual/causal/session guarantees | availability and latency often outweigh global immediacy |
| product search index | eventual with freshness SLO | projection is rebuildable; product DB is authoritative |
| analytics dashboard | eventual/bounded staleness | aggregation delay is normally acceptable and measurable |
| cache | weak/TTL-based, with source fallback | cache must not become authority |
| telemetry in Cassandra | tunable consistency from loss/staleness requirements | high availability and write scale may dominate |
| vector/RAG index | eventual derived projection | re-fetch authorized current sources before answering |

## User Experience Under Staleness

- route a user to a session-consistent region/replica when read-your-writes matters;
- return the accepted authoritative object after a write instead of immediately
  querying a lagging projection;
- show “processing” or freshness timestamps rather than pretending convergence is instant;
- use version tokens/ETags to prevent lost updates;
- never make a money, permission, or final-allocation decision from a stale cache/search index;
- measure replication/event age and alert when the consistency SLO is missed.

The correct choice is the weakest model that still preserves the business
invariants and user contract—not the weakest model the database can offer.

## Official References

- [PostgreSQL documentation](https://www.postgresql.org/docs/current/)
- [MySQL Reference Manual](https://dev.mysql.com/doc/refman/8.4/en/)
- [Apache Cassandra documentation](https://cassandra.apache.org/doc/latest/)
