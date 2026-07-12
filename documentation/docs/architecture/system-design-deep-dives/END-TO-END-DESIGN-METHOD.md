---
title: End-To-End System Design Method
difficulty: Advanced
page_type: Tutorial
status: Generic
keywords: [functional requirements, nonfunctional requirements, back of envelope, access pattern, bottleneck analysis]
learning_objectives: [Drive a design from requirements to evidence, Calculate workload and storage, Evolve a simple design along measured bottlenecks]
technologies: [System Design]
last_reviewed: "2026-07-12"
---

# End-To-End System Design Method

![Eight-step system-design method from requirements and estimates through operations and evolution](/img/diagrams/system-design-method.svg)

*The feedback arrow is deliberate: estimates, access patterns, failure tests, and
cost evidence frequently invalidate early assumptions.*

## 1. Clarify Scope

Identify actors and top journeys; explicitly exclude features. Ask about correctness,
availability, latency percentiles, durability, freshness, throughput/peaks, growth,
regions, ordering, privacy, retention, cost and team constraints. Rank them—designs
cannot maximize every quality simultaneously.

## 2. Estimate

Calculate average and peak requests/writes, concurrent sessions/connections,
payload and event bandwidth, daily storage, retained storage, indexes/replicas/
backups, cache working set, fan-out, and hotspot distribution. State decimal versus
binary units and add failure/maintenance headroom.

```text
peak writes/s = daily writes × peak factor / 86,400
storage = writes/day × bytes/write × retention × replication/index overhead
concurrency ≈ arrival rate × average time in system
```

Estimates choose architecture scale; they are not capacity proof.

## 3. Define Contracts And Invariants

Write APIs/events with identity, pagination, idempotency, authorization and errors.
List invariants such as one charge per payment attempt or stock never below zero.
Set the transaction boundary and acceptable staleness per read.

## 4. Derive Data Model From Queries

Write exact reads/writes, filter/sort keys, cardinality and frequency. Choose system
of record, indexes, partition/shard key, replicas and rebuildable projections.
Analyze skew, hot keys, cross-shard operations, migration, retention and deletion.

## 5. Draw Critical Flows

Show client/edge, stateless compute, authoritative data, cache, broker, derived
stores and external systems. Then deep-dive the hardest write and read with sequence
diagrams, including timeout, duplicate, conflict and partial failure.

## 6. Scale And Protect

Locate CPU, network, storage, lock, connection, partition and downstream bottlenecks.
Apply caching, batching, async work, partitioning or specialist stores only where
the workload justifies them. Bound every queue/pool/retry and define admission,
backpressure, shedding and degradation.

## 7. Reliability And Operations

Cover replication/failover, RPO/RTO, backups/restores, reconciliation, replay,
deployment/schema compatibility, regional loss, observability, alert/runbook,
security/privacy and cost. State what happens to an in-flight operation at every
failure boundary.

## 8. Alternatives And Evolution

Reject at least two credible alternatives against named requirements. Start with
the simplest design, then describe triggers and safe migrations for the next scale.
Avoid presenting a hyperscale architecture as the day-one answer.

## Recommended Next Page

[Distributed Component Internals](./DISTRIBUTED-COMPONENT-INTERNALS.md)

## Official References

- [Google SRE Book — Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
- [Google SRE Book — Handling Overload](https://sre.google/sre-book/handling-overload/)
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)
