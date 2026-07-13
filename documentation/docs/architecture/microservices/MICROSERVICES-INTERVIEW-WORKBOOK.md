---
title: Microservices Architect Interview Workbook
description: Expandable scenario answers covering boundaries, communication, consistency, resilience, and operations.
difficulty: Advanced
page_type: Interview
status: Generic
prerequisites: [Microservices architect path]
learning_objectives: [Answer through trade-offs, Use production evidence, Avoid pattern-name responses]
technologies: [HTTP, Kafka, Databases, Kubernetes]
last_reviewed: "2026-07-13"
---

# Microservices Architect Interview Workbook

<DocLabels items={[
  {label: 'Architect interview', tone: 'advanced'},
  {label: 'Expandable answers', tone: 'production'},
  {label: 'Scenario based', tone: 'shopverse'},
]} />

**Microservices versus a modular monolith?**

<ExpandableAnswer title="Expand answer">

Start modular unless independent ownership, deployment, scaling, isolation, or
compliance benefit outweighs network, consistency and operating cost. Preserve
capability boundaries so extraction remains possible; service count is not the goal.

</ExpandableAnswer>

**Saga choreography versus orchestration?**

<ExpandableAnswer title="Expand answer">

Choreography keeps participants autonomous but can hide the end-to-end state graph.
Orchestration makes workflow and recovery visible but risks centralizing domain logic.
Choose from workflow complexity, auditability and ownership; keep each service’s
business invariant and compensation local.

</ExpandableAnswer>

**How do you version events safely?**

<ExpandableAnswer title="Expand answer">

Treat events as durable contracts: additive evolution first, stable semantics,
schema compatibility checks, tolerant consumers, producer/consumer deployment order,
and replay tests using old records. A new field cannot silently change old meaning.

</ExpandableAnswer>

**Can a circuit breaker prevent cascading failure?**

<ExpandableAnswer title="Expand answer">

It helps after failures cross configured thresholds. Cascades are primarily bounded
with deadlines, admission control, finite queues, pool isolation and retry budgets.
The breaker must have observable state and a safe fallback; otherwise it can hide loss.

</ExpandableAnswer>

**How do you test eventual consistency?**

<ExpandableAnswer title="Expand answer">

Assert states and deadlines rather than sleeps: accepted command, durable message,
idempotent consumer effect, duplicate/reordered delivery, transient failure, replay,
compensation and reconciliation. Measure the convergence SLO and terminal failure path.

</ExpandableAnswer>

## Official References

- [AWS prescriptive microservices guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/)

## Recommended Next

Return to the [Microservices Learning Guide](../MICROSERVICES-DISTRIBUTED-SYSTEMS.md).
