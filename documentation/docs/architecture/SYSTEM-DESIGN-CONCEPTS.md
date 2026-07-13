---
title: System Design Concepts Roadmap
sidebar_position: 2
difficulty: Beginner
page_type: Learning Path
status: Generic
learning_objectives: [Sequence system design concepts, Connect requirements to architecture decisions]
technologies: [HTTP, Kafka, Redis, Docker, JWT]
last_reviewed: "2026-07-11"
---

# System Design Concepts Roadmap

System design is a reasoning process: define behavior and scale, identify the
hardest constraints, choose ownership and data models, design failures, and then
justify technology. Learn concepts in dependency order rather than as isolated buzzwords.

![Fourteen system design concepts learning map](/img/learning/system-design-concepts.jpg)

*Visual learning prompt supplied by the project owner. Source:
[LinkedIn system-design concepts post](https://www.linkedin.com/posts/nk-systemdesign-one_i-struggled-with-system-design-until-activity-7480242797011443712-Em_/).*

## Step-By-Step Path

| Step | Concept | Question it answers | Existing guide |
|---:|---|---|---|
| 1 | requirements and API design | what must the system do and expose? | [HLD fundamentals](./hld-lld/HLD-FUNDAMENTALS.md) |
| 2 | capacity and NFRs | what scale, latency, availability, and recovery? | [Capacity estimation](./hld-lld/CAPACITY-PERFORMANCE-ESTIMATION.md) |
| 3 | modular monolith and boundaries | what should be owned and deployed together? | [Architecture styles](./ARCHITECTURE-STYLES.md) |
| 4 | data modeling and databases | where does authoritative state live? | [Database selection](../data/DATABASE-SELECTION-GUIDE.md) |
| 5 | caching layers | which repeated work can be avoided safely? | [Cache umbrella](./CACHE-UMBRELLA.md) |
| 6 | load balancing and discovery | how do requests reach healthy capacity? | [Load balancing](./LOAD-BALANCING-GENERIC.md) |
| 7 | messaging and Kafka | which work should be asynchronous or replayable? | [Messaging selection](../integration/MESSAGING-PLATFORM-SELECTION.md) |
| 8 | consistency and CAP | what can be stale or unavailable? | [Consistency models](../data/database-selection/CONSISTENCY-MODELS-BASE.md) |
| 9 | idempotency and retries | how are duplicate attempts made safe? | [Idempotency](../reliability/IDEMPOTENCY-GENERIC.md) |
| 10 | partitioning and hashing | how is ownership distributed without hotspots? | [Data distribution](../data/database-selection/SCALING-CAP-DISTRIBUTION.md) |
| 11 | saga and outbox | how do workflows cross transaction boundaries? | [Microservices patterns](./MICROSERVICES-PATTERNS.md) |
| 12 | RPC and service communication | when should work be synchronous? | [Distributed systems](./DISTRIBUTED-SYSTEMS-GENERIC.md) |
| 13 | security and JWT | who may perform each action? | [Security principles](../security/principles/SECURITY-PRINCIPLES.md) |
| 14 | deployment and observability | how is the system operated and recovered? | [Deployment strategies](../operations/DEPLOYMENT-STRATEGIES.md) |

## Design Interview / Review Sequence

<ExpandableAnswer title="What should an architect explain about System Design Concepts Roadmap?">

For **System Design Concepts Roadmap**, a strong answer starts with the runtime responsibility and the invariant that must remain true. It then walks through one Shopverse request or event, names the important boundary, and explains the failure behavior rather than describing only the happy path. Close with the trade-off, the production signal that verifies the design, and the condition that would justify a different approach. This structure demonstrates practical judgment without memorizing isolated definitions.

</ExpandableAnswer>

1. Clarify users, commands, queries, invariants, and out-of-scope behavior.
2. Quantify peak read/write traffic, object size, retention, concurrency, and growth.
3. Define p95/p99 latency, availability, consistency, RTO, RPO, security, and cost.
4. Draw clients, entry points, services/modules, authoritative stores, and external dependencies.
5. Walk the critical write path and identify the commit point and duplicate behavior.
6. Walk the critical read path and define cache/projection freshness.
7. Find hotspots, single points of failure, backpressure, and regional constraints.
8. Explain failure, retry, timeout, idempotency, failover, restore, and reconciliation.
9. Estimate capacity and identify the first likely bottleneck.
10. State trade-offs, alternatives, evolution triggers, and how assumptions will be tested.

Continue with [Sixteen HLD Case Studies](./hld-lld/SIXTEEN-SYSTEM-DESIGN-CASE-STUDIES.md)
to apply these concepts to recognizable systems.

## Recommended Next Page

Continue with [System Design Deep Dives](./SYSTEM-DESIGN-DEEP-DIVES.md).
