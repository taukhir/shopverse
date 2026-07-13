---
title: HLD And LLD
status: "maintained"
last_reviewed: "2026-07-13"
---

# HLD And LLD

High-Level Design and Low-Level Design answer different questions.

HLD explains **what the system looks like at architecture level**: requirements,
capacity, service boundaries, storage, communication, consistency, scaling,
availability, and major trade-offs.

LLD explains **how important parts are implemented**: classes, interfaces,
sequence flows, state transitions, database schema, object relationships, and
method-level design.

## Quick Difference

| Area | HLD | LLD |
|---|---|---|
| Main question | how should the system work at scale? | how should this component be implemented? |
| Audience | architects, leads, senior engineers, operations | developers, reviewers, interviewers |
| Scope | full system or major subsystem | service, module, class, workflow, schema |
| Focus | boundaries, data flow, scale, reliability | contracts, objects, algorithms, state |
| Diagrams | context, container, deployment, data flow | class, sequence, state, ERD |
| Output | architecture proposal and trade-offs | implementable design |

## HLD Umbrella

Read these pages when you are designing the system shape, scale, or production
behavior.

| Page | Use it for |
|---|---|
| [HLD Fundamentals](hld-lld/HLD-FUNDAMENTALS.md) | HLD process, architecture building blocks, availability, CDN, and interview prompts |
| [Introduction To HLD](hld-lld/hld/INTRODUCTION-TO-HLD.md) | HLD purpose, inputs, outputs, process, and common mistakes |
| [Functional And Non-Functional Requirements](hld-lld/NON-FUNCTIONAL-REQUIREMENTS.md) | functional scope, NFRs, measurable targets, and requirement quality |
| [Capacity And Performance Estimation](hld-lld/CAPACITY-PERFORMANCE-ESTIMATION.md) | latency, throughput, active requests, storage, Kafka, DB pool, and instance estimates |
| [Data Partitioning](hld-lld/DATA-PARTITIONING.md) | horizontal, vertical, range, hash, directory, consistent hashing, and Kafka partitioning |
| [Availability](hld-lld/hld/AVAILABILITY.md) | availability targets, dependency math, failover, queues, and graceful degradation |
| [CAP Theorem](hld-lld/hld/CAP-THEOREM.md) | consistency, availability, partition tolerance, CP/AP examples, and PACELC |
| [Consistency](hld-lld/hld/CONSISTENCY.md) | strong consistency, eventual consistency, read-your-writes, and SAGA consistency |
| [Content Delivery Network](hld-lld/hld/CONTENT-DELIVERY-NETWORK.md) | CDN caching, cache hit/miss, object storage, public/private content, and invalidation |

## LLD Umbrella

Read these pages when you are designing implementation details.

| Page | Use it for |
|---|---|
| [LLD Examples And Diagrams](hld-lld/LLD-EXAMPLES-DIAGRAMS.md) | class, sequence, and state examples for implementation design |
| [UML Diagrams](hld-lld/UML-DIAGRAMS.md) | UML diagram types, when to use them, and LLD interview usage |
| [ERD Diagrams](hld-lld/ERD-DIAGRAMS.md) | tables, keys, relationships, cardinality, and constraints |
| [Database LLD And Design Process](hld-lld/DATABASE-LLD-DESIGN-PROCESS.md) | database LLD, design steps, interview approach, do/don't rules |

## Suggested Reading Order

For system-design interviews:

1. [Functional And Non-Functional Requirements](hld-lld/NON-FUNCTIONAL-REQUIREMENTS.md)
2. [Capacity And Performance Estimation](hld-lld/CAPACITY-PERFORMANCE-ESTIMATION.md)
3. [Introduction To HLD](hld-lld/hld/INTRODUCTION-TO-HLD.md)
4. [Availability](hld-lld/hld/AVAILABILITY.md)
5. [CAP Theorem](hld-lld/hld/CAP-THEOREM.md)
6. [Consistency](hld-lld/hld/CONSISTENCY.md)
7. [Content Delivery Network](hld-lld/hld/CONTENT-DELIVERY-NETWORK.md)
8. [Data Partitioning](hld-lld/DATA-PARTITIONING.md)
9. [UML Diagrams](hld-lld/UML-DIAGRAMS.md)
10. [ERD Diagrams](hld-lld/ERD-DIAGRAMS.md)
11. [LLD Examples And Diagrams](hld-lld/LLD-EXAMPLES-DIAGRAMS.md)
12. [Database LLD And Design Process](hld-lld/DATABASE-LLD-DESIGN-PROCESS.md)

## How To Decide Whether A Topic Is HLD Or LLD

Ask this:

```text
Does this decision affect system-wide architecture, scaling, failure handling,
or data ownership?
```

If yes, it belongs mostly in HLD.

```text
Does this decision affect classes, APIs inside a service, schema details,
state transitions, or method-level behavior?
```

If yes, it belongs mostly in LLD.

Some topics cross both. For example, database design has HLD decisions such as
which service owns which data, and LLD decisions such as table structure,
indexes, constraints, and relationships.

## Compatibility Anchors

The original long page was split into focused pages. These headings are kept so
older links have a stable landing point.

## HLD Versus LLD

Moved to [HLD Fundamentals](hld-lld/HLD-FUNDAMENTALS.md).

## HLD Contents

Moved to [HLD Fundamentals](hld-lld/HLD-FUNDAMENTALS.md).

## HLD Example

Moved to [HLD Fundamentals](hld-lld/HLD-FUNDAMENTALS.md).

## Capacity Estimation

Moved to [Capacity And Performance Estimation](hld-lld/CAPACITY-PERFORMANCE-ESTIMATION.md).

## Performance And Capacity Parameters

Moved to [Capacity And Performance Estimation](hld-lld/CAPACITY-PERFORMANCE-ESTIMATION.md).

## Worked Checkout Estimate

Moved to [Capacity And Performance Estimation](hld-lld/CAPACITY-PERFORMANCE-ESTIMATION.md).

## RED, USE, And Business Metrics

Moved to [Capacity And Performance Estimation](hld-lld/CAPACITY-PERFORMANCE-ESTIMATION.md).

## Performance Design Rules

Moved to [Capacity And Performance Estimation](hld-lld/CAPACITY-PERFORMANCE-ESTIMATION.md).

## Non-Functional Requirements

Moved to [Functional And Non-Functional Requirements](hld-lld/NON-FUNCTIONAL-REQUIREMENTS.md).

## LLD Contents

Moved to [LLD Examples And Diagrams](hld-lld/LLD-EXAMPLES-DIAGRAMS.md).

## LLD Class Example

Moved to [LLD Examples And Diagrams](hld-lld/LLD-EXAMPLES-DIAGRAMS.md).

## LLD Sequence Example

Moved to [LLD Examples And Diagrams](hld-lld/LLD-EXAMPLES-DIAGRAMS.md).

## State Diagram Example

Moved to [LLD Examples And Diagrams](hld-lld/LLD-EXAMPLES-DIAGRAMS.md).

## Database LLD

Moved to [Database LLD And Design Process](hld-lld/DATABASE-LLD-DESIGN-PROCESS.md).

## Design Process

Moved to [Database LLD And Design Process](hld-lld/DATABASE-LLD-DESIGN-PROCESS.md).

## Interview Approach

<ExpandableAnswer title="What should an architect explain about HLD And LLD?">

For **HLD And LLD**, a strong answer starts with the runtime responsibility and the invariant that must remain true. It then walks through one Shopverse request or event, names the important boundary, and explains the failure behavior rather than describing only the happy path. Close with the trade-off, the production signal that verifies the design, and the condition that would justify a different approach. This structure demonstrates practical judgment without memorizing isolated definitions.

</ExpandableAnswer>

Moved to [Database LLD And Design Process](hld-lld/DATABASE-LLD-DESIGN-PROCESS.md).

## Do And Do Not

Moved to [Database LLD And Design Process](hld-lld/DATABASE-LLD-DESIGN-PROCESS.md).

## Related Guides

Moved to [Database LLD And Design Process](hld-lld/DATABASE-LLD-DESIGN-PROCESS.md).
