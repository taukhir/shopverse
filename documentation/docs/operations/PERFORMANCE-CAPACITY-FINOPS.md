---
title: Performance, Capacity, And FinOps
difficulty: Advanced
page_type: Tutorial
status: Generic
keywords: [load testing, coordinated omission, soak test, stress test, capacity planning, FinOps, cost per request]
learning_objectives: [Design representative load tests, Turn saturation into capacity limits, Attribute and optimize unit cost safely]
technologies: [Java, PostgreSQL, Kafka, Kubernetes]
last_reviewed: "2026-07-12"
---

# Performance, Capacity, And FinOps

## Workload Model

Start from arrivals, user journeys, read/write mix, payload and dataset size,
cardinality/skew, cache state, concurrency, think time, geographic latency,
dependencies, background work, and growth. Test production-shaped data and
failure/maintenance states, not an empty database and one endpoint.

An open model generates arrivals independently of response time; a closed model
maintains a number of users and can hide overload as slow responses reduce new
work. Coordinated omission occurs when a generator waits during a stall and fails
to record requests that should have arrived. Use a tool/mode that preserves the
arrival schedule and report the methodology.

| Test | Purpose |
|---|---|
| baseline | validate script and normal behavior |
| load | expected peak plus headroom |
| stress | find saturation and failure shape |
| spike | sudden burst and autoscaling/queue response |
| soak | leaks, compaction, caches, logs, and degradation over time |
| breakpoint | locate maximum sustainable throughput, carefully |

Measure throughput, errors, p50/p95/p99/max, queue/pool waits, CPU, run queue,
memory/GC, I/O, locks, database plans/sessions, broker lag, retries, and downstream
latency. Maximum alone is outlier-sensitive; percentiles can hide rare catastrophic
errors, so retain distributions and error classes.

## Capacity Planning

Maximum sustainable load is the highest rate that meets all SLOs with recovery
and failure headroom—not the point where the system crashes. Identify the first
saturated resource, its concurrency demand, service time, queueing, and scaling
unit. Validate N-1 node/zone, deployments, backups, rebalancing, and seasonal peaks.

Apply admission control and bounded queues. Scaling stateless pods when the
database is saturated increases connections and work, worsening collapse.

## FinOps

Tag and allocate compute, database, storage, backup, observability, licenses,
support, and network egress. Track unit economics such as cost per order, request,
active tenant, GB ingested, or million events alongside SLOs.

Optimize waste before architecture: idle capacity, wrong retention, unused
indexes, verbose logs, cross-region egress, oversized instances, orphaned volumes,
and inefficient queries. Compare reserved/committed capacity for stable base load
with elastic/on-demand capacity for variance. Spot/preemptible capacity belongs
only where interruption is tolerated.

Cost reduction must preserve reliability, security, recovery, and engineering
time. Add forecast, anomaly alert, budget owner, and cost review to architecture
decisions and load-test reports.

## Recommended Next Page

Continue with [Supply-Chain Security And Privacy Engineering](../security/SUPPLY-CHAIN-PRIVACY.md).

## Official References

- [Kubernetes documentation](https://kubernetes.io/docs/)
- [Docker documentation](https://docs.docker.com/)
- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
