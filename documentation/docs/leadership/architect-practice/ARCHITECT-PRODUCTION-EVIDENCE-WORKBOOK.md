---
title: Architect Production Evidence, Portfolio, Labs, And Interview Workbook
description: Define proof that a design works, build an evidence portfolio, run architecture labs, and practise seven-question interview answers with scoring rubrics.
difficulty: Advanced
page_type: Interview Guide
status: Generic
prerequisites: [Architect Scaling Security And Trade-Offs]
learning_objectives: [Define production proof, Build portfolio artifacts, Practise and score architect answers]
technologies: [SLOs, Observability, Load Testing, Chaos Engineering, ADRs]
last_reviewed: "2026-07-23"
---

# Architect Production Evidence, Portfolio, Labs, And Interview Workbook

## Question 7: What Production Evidence Proves It Works?

Deployment success proves only that an artifact started. Architecture proof connects user/
business outcomes, correctness, performance, reliability, security, recovery, delivery, cost,
and ownership to explicit acceptance criteria.

## Evidence Layers

| Layer | Example proof |
|---|---|
| business/user | checkout completion, conversion, freshness, support incidents |
| correctness | invariant checks, reconciliation difference, duplicate/loss rate |
| performance | throughput, p50/p95/p99, saturation curve, queue/pool wait |
| reliability | SLI/SLO/error-budget burn, failover and degraded-mode behavior |
| recovery | tested RPO/RTO, restore/replay throughput, failback reconciliation |
| security | threat model, authz/tenant tests, rotation drill, audit and response evidence |
| delivery | canary result, rollback time, mixed-version compatibility, change-failure rate |
| operations | dashboards, actionable alerts, runbook execution, ownership/MTTR |
| cost | unit cost, capacity forecast accuracy, idle/failure headroom |

## Evidence Contract Template

```text
Claim:
  "Order API sustains 1,000 accepted commands/s at p99 < 300 ms."

Conditions:
  production-like payload/key distribution, auth enabled, realistic DB/event writes,
  one pod unavailable, bounded retries, 30-minute soak.

Measures:
  accepted/error/duplicate rate, p99, CPU/heap/GC, pool and queue wait,
  DB waits, Kafka publish latency, cost.

Thresholds:
  exact pass/fail and allowed degradation.

Artifacts:
  test version/config, dashboards, traces, raw result, change revision.

Owner and expiry:
  person/team, last verified date, change that invalidates evidence.
```

Evidence must be reproducible and tied to the artifact/config/schema version. Screenshots
without queries, conditions, timestamps, or thresholds are weak evidence.

## Production Verification Ladder

1. static/design review and threat/failure model;
2. unit, component, contract, and migration compatibility tests;
3. integration with real protocol/database/broker behavior;
4. representative load, soak, spike, and saturation test;
5. failure injection, restore, replay, failover, and rotation drills;
6. shadow/canary/limited tenant rollout with automated comparison;
7. SLO, correctness, security, and cost observation after full rollout;
8. scheduled reassessment and retirement of obsolete assumptions.

## Portfolio Artifact Set

For each major project, preserve sanitized artifacts:

- one-page context, requirements, constraints, and system diagram;
- runtime sequence with durability/idempotency/deadline points;
- ADR with alternatives and rejected trade-offs;
- capacity model and load-test results;
- threat model and authorization/trust-boundary diagram;
- failure-mode table and incident/runbook example;
- dashboard/SLO and alert rationale;
- deployment/migration/rollback/reconciliation plan;
- restore/failover/replay evidence;
- before/after outcome, cost, and lessons.

Never include employer secrets, customer data, credentials, private topology, or proprietary
incident detail. Recreate a generic lab when necessary.

## Seven-Question Worksheet

Copy this for every topic/system:

```markdown
### Scope and workload
- Business outcome:
- Invariants:
- Rate, size, distribution, SLO, RPO/RTO:

### 1. Internals
- Entry-to-completion sequence:
- Threads/queues/pools:
- Durable state/acknowledgement:

### 2. Selection
- Decision drivers:
- Selected design:
- Unknowns/validation:

### 3. Failures
- Three failure modes:
- Propagation/data impact:
- Recovery/reconciliation:

### 4. Diagnosis
- User symptom and containment:
- Hypotheses and predicted signals:
- Metrics/logs/traces/deep evidence:

### 5. Scale and security
- Bottleneck/capacity model:
- Admission/backpressure:
- Identity/authz/secrets/tenant controls:

### 6. Rejected trade-offs
- Alternatives and benefits:
- Why rejected now:
- Reconsideration trigger:

### 7. Production proof
- Claims and thresholds:
- Load/failure/security/recovery evidence:
- Dashboard, owner, expiry:
```

## Capstone Labs

### Lab 1: Reliable Checkout

Design order acceptance with database transaction, outbox, Kafka consumers, idempotent
payment/inventory, DLT/replay, and user status. Inject database, broker, consumer, and lost-
response failures. Prove no lost accepted order and no duplicate business effect.

### Lab 2: Search Projection

Build database -> CDC/Kafka -> Elasticsearch. Reindex into a new mapping while live changes
continue. Prove version ordering, deletion, replay, alias switch, rollback, freshness SLO, and
cluster saturation behavior.

### Lab 3: Multi-Replica Spring Service

Run multiple pods behind gateway/discovery. Measure pool and thread capacity, drain a pod,
rotate credentials, cause retry amplification, fix it, and prove canary/rollback evidence.

### Lab 4: Data Recovery

Choose Oracle or Cassandra. Define RPO/RTO, create backup/snapshot, restore into isolation,
reconcile application state, record actual throughput, and identify the bottleneck preventing
the target.

## Interview Scoring Rubric

Score each dimension from 0 to 3:

| Dimension | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| internals | names only | partial flow | correct end-to-end | connects resources/durability/failure |
| decision | preference | generic benefits | constraints and alternatives | evidence plus review trigger |
| failure | happy path | one outage | partial/overload/data failures | propagation and recovery modeled |
| diagnosis | guesses | logs only | hypothesis + telemetry | containment, proof, correction, learning |
| scale/security | more nodes/auth | generic controls | quantitative capacity and trust boundaries | skew/failure/tenant/cost and rotation tested |
| trade-offs | none | straw alternative | credible rejected choice | benefit, evidence, accepted risk, trigger |
| proof | tests passed | dashboard exists | thresholds/load/failure evidence | reproducible SLO, recovery, security, cost proof |

Target at least 16/21 with no zero before considering the topic interview-ready. Re-answer
within 10 minutes, then handle follow-up failure and scale questions.

## Thirty-Day Practice Cadence

- Days 1-7: one technology worksheet daily; draw internals without notes.
- Days 8-14: run diagnosis/capacity labs and collect evidence.
- Days 15-21: three system capstones with ADR and failure model.
- Days 22-26: timed interview answers and follow-up challenges.
- Days 27-30: close low-scoring areas, produce sanitized portfolio summaries, repeat recovery.

## Official References

- [Google SRE service level objectives](https://sre.google/workbook/implementing-slos/)
- [Google SRE monitoring distributed systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- [OpenTelemetry documentation](https://opentelemetry.io/docs/)
- [Kubernetes production best practices](https://kubernetes.io/docs/setup/best-practices/)

## Recommended Next

Return to the [Architect Practice And Evidence Path](../ARCHITECT-PRACTICE-EVIDENCE-PATH.md), choose one completed technology track, and produce its seven-question worksheet plus one measured lab.
