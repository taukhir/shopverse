---
title: Architecture Revision Sheet
description: Rapid revision of system design, distributed systems, capacity, consistency, availability, caching, messaging, security, and recovery.
difficulty: Advanced
page_type: Interview
status: Generic
prerequisites: [Software And Systems Architecture Overview]
learning_objectives: [Recall architect concepts quickly, Structure a system design answer, Defend quality and failure trade-offs]
technologies: [Distributed Systems, Microservices, Databases, Kafka, Cloud]
last_reviewed: "2026-07-23"
---

# Architecture Revision Sheet

## Design Sequence

```text
requirements -> scale/SLOs -> APIs/events -> data model -> components
-> critical flows -> failure/security -> capacity -> operations -> evolution
```

## One-Line Recall

| Concept | Revision answer |
|---|---|
| scalability | Sustain growth by adding/resizing resources without breaking requirements. |
| availability | Return an acceptable outcome during specified failures. |
| durability | Acknowledged data survives the defined failure model. |
| consistency | Rules governing which writes an observer may see and when. |
| CAP | During a network partition, a distributed operation cannot guarantee both availability and linearizable consistency. |
| partitioning | Split data/work by a key to distribute capacity and ownership. |
| replication | Maintain copies for availability/read scale; replication is not backup. |
| backpressure | Prevent upstream work from exceeding downstream capacity. |
| idempotency | Make duplicate logical attempts converge on one effect. |
| RPO/RTO | Maximum acceptable data loss and time to restore service. |

## Component Decisions

| Requirement | Typical option | Core trade-off |
|---|---|---|
| strong relational invariant | relational database | vertical/write coordination limits |
| hot repeated reads | cache | staleness and invalidation |
| retained fan-out/replay | Kafka/event log | partition ordering and operations |
| immediate request outcome | HTTP/RPC | temporal coupling and timeout ambiguity |
| text search | search index | asynchronous consistency and duplication |
| binary content | object storage | separate metadata/access control |
| global static delivery | CDN | invalidation and personalized content boundaries |

## Capacity Formulas

```text
concurrency ~= arrival rate * average latency
storage ~= write bytes/sec * retention seconds * replication factor
required workers >= peak arrival rate / measured worker rate
catch-up time ~= backlog / (processing rate - arrival rate)
```

Always add peak, failure, maintenance, retry, growth, and recovery headroom.

## Failure Prompts

- caller times out after the server committed;
- duplicate command/event arrives;
- one partition or tenant becomes hot;
- cache and database disagree;
- queue backlog approaches retention;
- database primary or entire region fails;
- old/new schemas coexist during rollback;
- credentials rotate while instances remain live;
- load exceeds every configured pool.

## Interview Structure

1. clarify functional scope and invariants;
2. quantify traffic, data, latency, availability, durability, and compliance;
3. define contracts and ownership;
4. draw the normal critical path;
5. identify bottlenecks and partitioning;
6. walk failure, overload, security, and recovery;
7. explain telemetry, rollout, migration, and alternatives.

## Final Checklist

- boundaries and owners are explicit;
- every state has an authority;
- capacity is calculated with headroom;
- consistency and ordering match business needs;
- timeout, duplicate, overload, and partial failure are handled;
- security and privacy follow data flow;
- SLOs, alerts, runbooks, rollout, rollback, and DR are testable.
