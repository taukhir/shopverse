---
title: High-Level Design Interview Workbook
description: Fifty HLD concept questions with answer checkpoints and links to Shopverse deep dives.
sidebar_label: HLD Interview Workbook
tags: [HLD, system design, interview, architecture]
page_type: Workbook
difficulty: Advanced
status: maintained
last_reviewed: "2026-07-16"
---

# High-Level Design Interview Workbook

These questions test whether an engineer can turn requirements into boundaries,
capacity, data flow, reliability, and operable trade-offs. Use the checkpoint as
an answer outline, then support it with a concrete example and one rejected
alternative.

## 1. Scope, Architecture, And Scale

| # | Question | Strong answer checkpoints |
|---:|---|---|
| 1 | What is HLD? | system boundaries, components, data stores, communication, deployment, scale, reliability, and major decisions—not class internals |
| 2 | What inputs are required? | functional scope, users/workload, NFRs, constraints, current state, compliance, budget, and team capability |
| 3 | What should an HLD document contain? | context/container/deployment views, APIs/events, ownership, data, estimates, failure model, security, observability, decisions |
| 4 | How do HLD and LLD connect? | HLD assigns boundaries and contracts; LLD implements each boundary while preserving HLD invariants and failure semantics |
| 5 | How do you decompose a system? | cohesive business capability, data ownership, change cadence, scale/isolation need, team ownership; avoid noun-per-service decomposition |
| 6 | Monolith or microservices? | begin with modular monolith unless independent deployment, ownership, scaling, compliance, or failure isolation justifies distribution |
| 7 | Vertical or horizontal scaling? | vertical is simpler but bounded and failure-prone; horizontal needs statelessness/partitioning and distributed coordination |
| 8 | How do you estimate capacity? | DAU to peak RPS, request mix, concurrency, bandwidth, storage, connections, queues, instances, growth, failure headroom, validation |
| 9 | Latency versus throughput? | latency is time per operation; throughput is completed work/time; queueing and saturation couple them; report percentiles |
| 10 | What is backpressure? | bound admitted/in-flight work so downstream capacity is not exceeded; queues alone postpone overload |

## 2. Edge, APIs, And Communication

| # | Question | Strong answer checkpoints |
|---:|---|---|
| 11 | Load balancer versus API gateway? | LB distributes transport/application traffic; gateway owns API routing and cross-cutting edge policy; neither should own domain logic |
| 12 | Reverse proxy versus forward proxy? | reverse represents servers to clients; forward represents clients to servers; discuss TLS, caching, policy, and trust boundary |
| 13 | What does a CDN do? | geographically distributed edge caching/routing reduces latency and origin load; define cache key, TTL, purge, signed access, origin failure |
| 14 | REST, gRPC, or messaging? | REST for broad resource contracts, gRPC for typed low-latency internal RPC, messaging for temporal decoupling/durability; choose per interaction |
| 15 | Synchronous or asynchronous communication? | immediate answer and simple semantics versus decoupling/buffering; state deadline, delivery, ordering, and user-visible pending state |
| 16 | How do you version APIs? | additive evolution, tolerant consumers, explicit version only for incompatible semantics, deprecation telemetry and migration plan |
| 17 | What is idempotency? | repeated same logical command has one effect and returns stable outcome; key, scope, expiry, atomic claim, stored response |
| 18 | What does a message broker provide? | durable buffering, routing, consumer decoupling and replay; not automatic exactly-once business processing |
| 19 | How do WebSocket and SSE differ? | WebSocket is bidirectional; SSE is server-to-client over HTTP; plan connection scale, reconnect, missed events, auth, and backpressure |
| 20 | How should service discovery work? | registry or platform DNS maps logical service to healthy instances; handle stale entries, health, zones, retries, and load balancing |

## 3. Data, Storage, And Caching

| # | Question | Strong answer checkpoints |
|---:|---|---|
| 21 | SQL or NoSQL? | derive from access patterns, transactions, constraints, scale, consistency, query flexibility, and operating skill—not a traffic slogan |
| 22 | What is database replication? | copies data for availability/read scale; define leader, sync/async, lag, promotion, fencing, read consistency; replication is not backup |
| 23 | What is partitioning/sharding? | divide data/work by key for scale; discuss routing, skew, cross-shard work, rebalancing, uniqueness, and failure |
| 24 | How do you choose a partition key? | high cardinality, even load, stable, query locality, tenant/security fit, low cross-key transaction need |
| 25 | What is consistent hashing? | ring/rendezvous-style placement limits movement as nodes change; virtual nodes improve balance; membership and replication still matter |
| 26 | What is data denormalization? | duplicate/reshape data for read paths after measuring need; assign source of truth, freshness, repair, and update cost |
| 27 | Cache-aside or write-through? | cache-aside is simple but permits miss/staleness; write-through centralizes update but adds write latency/coupling; define invalidation |
| 28 | How do you prevent a cache stampede? | request coalescing, jittered TTL, refresh-ahead/stale-while-revalidate, admission, bounded fallback |
| 29 | Block, file, or object storage? | block for mounted low-level volumes, file for shared hierarchy, object for durable scalable blobs/metadata; compare latency and semantics |
| 30 | How do search indexes stay current? | CDC/outbox ingestion, versioned documents, idempotent update, lag metric, rebuild/alias swap, authoritative revalidation |

## 4. Consistency And Distributed Correctness

| # | Question | Strong answer checkpoints |
|---:|---|---|
| 31 | Explain CAP precisely. | during a network partition a replicated operation cannot guarantee both linearizable consistency and every non-failing-node response; P is the condition |
| 32 | Strong versus eventual consistency? | current authoritative read versus temporary divergence with convergence; select per invariant and user-visible staleness |
| 33 | What are session guarantees? | read-your-writes, monotonic reads/writes, writes-follow-reads; useful middle ground for user experience |
| 34 | What does PACELC add? | if partitioned choose availability/consistency; else often choose latency/consistency |
| 35 | What is a quorum? | coordinate R/W replicas so selected sets overlap; sloppy quorum, failures, latency, version conflict, and repair complicate the formula |
| 36 | How do distributed transactions work? | 2PC gives atomic decision but coordinator/participant availability affects progress; use only where atomicity justifies coupling |
| 37 | What is a SAGA? | sequence of local transactions with durable state and compensations; define semantic consistency, idempotency, timeout, and reconciliation |
| 38 | Outbox and inbox patterns? | atomically store domain change plus outbound event; relay later; inbox/dedup protects consumer effect; monitor stuck records |
| 39 | What is consensus used for? | replicas agree on ordered state/leadership despite failures; quorum availability, term/epoch, log, and membership are key |
| 40 | How do clocks affect design? | wall clocks skew; ordering and leases need monotonic time, sequence/version, or consensus; define expiry tolerance and fencing |

## 5. Availability, Security, And Operations

| # | Question | Strong answer checkpoints |
|---:|---|---|
| 41 | Availability versus reliability? | availability is successful service when expected; reliability includes sustained correct behavior; define SLI/SLO and eligible events |
| 42 | Active-active or active-passive? | active-active improves capacity/regional latency but needs conflict/routing strategy; active-passive simplifies writes but needs tested promotion |
| 43 | How do retries harm availability? | they multiply load and deadlines; use idempotency, budgets, exponential backoff/jitter, caps, and circuit breaking |
| 44 | Circuit breaker, timeout, bulkhead, and rate limiter? | timeout bounds wait, breaker suppresses known failure, bulkhead isolates resources, limiter controls admission; compose with one deadline/budget |
| 45 | What are RTO and RPO? | maximum recovery time and acceptable data-loss window; drive topology, backup frequency, restore automation, and exercises |
| 46 | How do you design authentication and authorization? | centralized identity lifecycle; short-lived verifiable credentials; resource owner enforces RBAC/ABAC; rotation, revocation, audit |
| 47 | How do you design data privacy? | minimization, classification, consent/purpose, encryption, least privilege, masking, retention/deletion, residency, audit |
| 48 | What are the observability pillars? | logs, metrics, traces linked by stable context; add business correctness, SLOs, cardinality control, and actionable alerts |
| 49 | What role does containerization play? | reproducible packaging and isolation; orchestration handles placement/health/scale; images do not solve state, security, or availability automatically |
| 50 | How do you validate an HLD? | threat/failure modeling, capacity tests, schema/API review, restore/failover/chaos drills, cost model, staged delivery, decision records |

## Answer Quality Checklist

A strong spoken answer:

- defines the term precisely before listing products;
- uses one concrete request or event flow;
- names the invariant and owner;
- states failure and overload behavior;
- identifies the most important trade-off;
- names the metric, test, or drill that validates the design;
- explains the condition that would change the decision.

## Related Guides

- [HLD Fundamentals](./HLD-FUNDAMENTALS.md)
- [Introduction To HLD](./hld/INTRODUCTION-TO-HLD.md)
- [Capacity And Performance Estimation](./CAPACITY-PERFORMANCE-ESTIMATION.md)
- [Availability](./hld/AVAILABILITY.md)
- [CAP Theorem](./hld/CAP-THEOREM.md)
- [Consistency](./hld/CONSISTENCY.md)
- [System Design Interview Problem Catalog](../system-design-deep-dives/SYSTEM-DESIGN-INTERVIEW-CATALOG.md)

## References

- [System Design Interview Questions And Answers - GeeksforGeeks](https://www.geeksforgeeks.org/system-design/top-low-level-system-designlld-interview-questions-2024/)
- [Most Commonly Asked System Design Interview Questions - GeeksforGeeks](https://www.geeksforgeeks.org/system-design/most-commonly-asked-system-design-interview-problems-questions/)
