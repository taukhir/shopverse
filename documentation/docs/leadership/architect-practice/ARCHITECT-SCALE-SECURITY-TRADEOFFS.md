---
title: Architect Scaling, Security, And Rejected Trade-Offs
description: Build quantitative scaling and security models, protect multi-tenant systems, compare alternatives, document rejected trade-offs, and define reconsideration triggers.
difficulty: Advanced
page_type: Decision Guide
status: Generic
prerequisites: [Architect Failure Modeling And Diagnosis]
learning_objectives: [Scale from bottleneck evidence, Integrate security into architecture, Defend rejected alternatives honestly]
technologies: [Distributed Systems, Security, Capacity Engineering]
last_reviewed: "2026-07-23"
---

# Architect Scaling, Security, And Rejected Trade-Offs

## Question 5: How Would You Scale It?

Scaling begins with a workload and bottleneck, not “add more pods.” Define:

- requests/events per second and peak/burst shape;
- payload/result size and read/write ratio;
- latency SLO and concurrency;
- key/tenant distribution and ordering requirements;
- state size, retention, growth, replication, and recovery throughput;
- dependency quotas and database/broker/shard limits;
- failure headroom and cost ceiling.

## Quantitative Starting Points

```text
concurrency approximately = throughput x average service time

minimum workers/partitions approximately = arrival rate / measured worker service rate

storage = events per second x bytes x retention seconds x replication

utilization must leave headroom for bursts, deployments, skew, and node/zone failure
```

Average values hide tails. Validate p95/p99, queue wait, retries, GC, I/O, and skew under
representative load.

## Scaling Levers And Limits

| Layer | Scale lever | Limit/trade-off |
|---|---|---|
| stateless API | replicas, async I/O, caching | downstream capacity, coordination, cold start |
| executor/pool | workers/connections | context switching, DB saturation, queueing |
| database | indexes, query/batch, replicas, partitioning | consistency, cross-partition work, failover |
| Kafka | partitions, consumers, batching | key ordering, rebalance, hot partitions |
| Cassandra | nodes/token capacity, bucketing | hot/large partitions, repair, consistency |
| Elasticsearch | shards/nodes/tiers | shard overhead, scoring fan-out, recovery |
| cache | capacity, sharding, replicas | invalidation, stale data, stampede |

Scale the bottleneck and protect it with admission control. Horizontal application scale that
multiplies database connections, retries, or hot-key traffic can reduce total throughput.

## Backpressure And Degradation

Bound queues, concurrency, response/page size, batch size, retry attempts, and per-tenant use.
Reject early with a documented response. Degraded modes must preserve truth: return stale data
with freshness metadata, `PENDING`, or `UNAVAILABLE`; never invent payment/inventory success.

## Security As A Design Dimension

Map assets, actors, trust boundaries, data classification, threats, and abuse cases. For each
request/event path define:

- workload and user identity, authentication strength, token/certificate lifecycle;
- authorization decision and resource/tenant ownership;
- validation, canonicalization, size/rate/complexity limits;
- confidentiality/integrity in transit and at rest;
- secrets/keys creation, distribution, rotation, revocation, audit;
- least-privilege database, broker, cloud, and CI identities;
- sensitive telemetry redaction and audit retention;
- compromise containment, credential rotation, forensics, and recovery.

## Multi-Tenant Scaling And Security

One tenant can be both a capacity and isolation threat. Enforce tenant identity server-side,
partition/cache/index keys with tenant context, authorize every resource, apply quotas/fairness,
prevent metric-label explosion, and test cross-tenant leakage. Decide shared, pooled-with-guardrails,
or isolated resources from compliance, noisy-neighbor risk, cost, and operational complexity.

## Question 6: What Trade-Offs Did You Reject?

An architect answer is incomplete without credible alternatives. Use this record:

| Field | Content |
|---|---|
| decision | selected option and scope |
| drivers | outcomes, constraints, invariants, workload |
| options | at least two credible choices plus do-nothing |
| selected benefits | why it wins now |
| accepted costs | complexity, consistency, latency, operations, cost |
| rejected option | what it would improve and why it loses now |
| evidence | measurement, prototype, incident, benchmark, team capability |
| risks/mitigations | failure, security, migration, lock-in |
| review trigger | threshold/date/change that reopens decision |

## Common Trade-Off Axes

- consistency versus latency/availability;
- synchronous simplicity versus asynchronous resilience/complexity;
- normalization versus read amplification/denormalized update cost;
- single-region simplicity versus multi-region RPO/latency/cost;
- managed service speed versus portability/control/lock-in;
- framework abstraction versus product-specific control;
- build versus buy;
- shared platform efficiency versus tenant/team isolation;
- aggressive caching versus freshness/correctness;
- one partition/global order versus parallel throughput.

Do not make the rejected option sound foolish. Explain when it would become the better choice.

## Worked Example: One Database Or Database Per Service

A shared database may be selected during early modularization because transaction boundaries,
team capacity, and migration risk dominate. Accept schema ownership controls and coupling risk.
A database per service may be rejected until boundaries and operational automation mature.
Reconsider when independent scale/deployment or compliance isolation has measured value and
cross-boundary workflows are explicitly redesigned.

## Security And Scale Evidence

- load/soak/spike tests with one node/zone removed;
- saturation curves and admission behavior;
- threat model and abuse-case tests;
- authorization and tenant-isolation tests;
- dependency/secret/image scanning with triage;
- key/certificate rotation drill;
- failover under peak load and recovery backlog processing;
- cost per transaction/tenant and forecast variance.

## Interview Questions

**How do you scale a slow consumer?** Locate per-partition versus global lag, measure processing
and dependencies, fix hot keys/retries/blocking work, batch where safe, then increase consumers
up to partitions or repartition with ordering implications.

**How do you discuss a rejected option?** State its real benefit, the current driver it loses,
evidence/uncertainty, accepted risk of the selected option, and a trigger to reconsider.

## Official References

- [OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/)
- [CISA Secure by Design](https://www.cisa.gov/securebydesign)
- [Google SRE load balancing](https://sre.google/sre-book/load-balancing-frontend/)

## Recommended Next

Finish with [Production Evidence, Portfolio, Labs, And Interview Worksheet](./ARCHITECT-PRODUCTION-EVIDENCE-WORKBOOK.md).

