---
title: Architect Failure Modeling And Evidence-Led Diagnosis
description: Predict partial failures, overload and data anomalies, then diagnose incidents through hypotheses, telemetry, containment, experiments, and root-cause evidence.
difficulty: Advanced
page_type: Production Guide
status: Generic
prerequisites: [Architect Runtime And Design Reasoning]
learning_objectives: [Build failure models, Diagnose without guessing, Separate containment from permanent correction]
technologies: [Observability, Distributed Systems, SRE]
last_reviewed: "2026-07-23"
---

# Architect Failure Modeling And Evidence-Led Diagnosis

## Question 3: What Can Fail?

Model failures before implementation and again before release. “The service is down” is too
coarse: distributed systems fail partially, slowly, asymmetrically, and ambiguously.

## Failure Categories

| Category | Examples | Design concern |
|---|---|---|
| input/contract | malformed, incompatible schema, oversized request | validation, quarantine, compatibility |
| compute | CPU saturation, deadlock, GC pause, event-loop blocking | bounded concurrency, isolation, profiling |
| memory/storage | leak, heap pressure, disk full, corrupt file | limits, retention, recovery, headroom |
| network | timeout, partition, DNS/TLS failure, lost response | deadlines, retries, ambiguity, failover |
| dependency | slow DB, broker unavailable, registry/config outage | bulkhead, degradation, startup policy |
| concurrency | lost update, lock wait, duplicate ownership | conditional writes, fencing, idempotency |
| data | stale replica, out-of-order event, partial migration | versioning, reconciliation, compatibility |
| deployment/config | mixed version, bad flag, bad secret rotation | canary, expand-contract, rollback |
| security/abuse | stolen identity, privilege error, tenant flood | least privilege, quotas, audit, containment |
| people/process | unsafe manual change, unclear owner, alert gap | controls, runbooks, review, learning |

## Failure-Mode Worksheet

For each critical path record:

```text
failure -> detection -> immediate effect -> propagation
 -> data/correctness impact -> containment
 -> recovery/replay/reconciliation -> prevention -> owner
```

Include ambiguous outcomes: the server may have committed while the client timed out. Include
correlated failures: a region, identity provider, DNS system, shared database, certificate, or
configuration repository can affect many services simultaneously.

## Overload Is A Failure Mode

Every resource has a queue: request threads, event loop, executor, connection pool, broker
partition, consumer backlog, database lock wait, disk I/O, downstream rate quota. When arrival
rate exceeds service rate, latency and timeouts rise before the component appears “down.”

Define admission, maximum queue/wait, rejection behavior, retry budget, and degradation before
saturation. Capacity headroom must include deployments and node/zone loss.

## Question 4: How Would You Diagnose It?

Use this sequence during an incident:

1. **Declare impact:** affected journey/tenant/region, start time, correctness risk, SLO burn.
2. **Stabilize:** stop rollout, shed traffic, disable amplification, isolate/fail over safely.
3. **Build timeline:** deploy/config/dependency/security events and symptom onset.
4. **Compare:** healthy versus unhealthy instance, partition, tenant, region, version, request.
5. **Form hypotheses:** each must predict an observable signal.
6. **Query evidence:** golden signals plus resource, dependency, data, and change telemetry.
7. **Test safely:** bounded query, canary, replay, profile, or controlled reduction.
8. **Correct:** fix owning boundary; validate recovery, backlog, duplicates, and hidden damage.
9. **Learn:** contributing conditions, detection gap, runbook/control/test, owner and deadline.

## Evidence Pyramid

```text
User/business symptom
  -> service SLI/SLO and traffic/error/latency/saturation
  -> dependency and resource metrics
  -> distributed trace/request timeline
  -> structured logs and domain state
  -> thread/heap/profile/query plan/broker/shard internals
  -> controlled experiment or reproduction
```

Start broad enough to locate the boundary, then go deep. Searching random logs first creates
confirmation bias.

## Hypothesis Table Example

| Hypothesis | Prediction | Evidence | Result |
|---|---|---|---|
| DB pool exhausted | high acquire wait, all connections active | Hikari metrics + DB sessions | confirmed/rejected |
| downstream slow | trace child span dominates | p99 dependency span | confirmed/rejected |
| retry amplification | attempts/logical request increases | attempt metric + traces | confirmed/rejected |
| hot key | one partition/shard lags | per-partition rate/lag | confirmed/rejected |

## Diagnosis By Technology

| Technology | First useful evidence |
|---|---|
| JVM | CPU, GC, heap, threads, executor queues, JFR/profile |
| Spring HTTP | route/status, request and dependency timers, pool acquisition, traces |
| database | active sessions, waits/locks, plan rows, buffer/I/O, connection pool |
| Kafka | producer errors, consumer lag by partition, rebalances, processing latency, ISR |
| Cassandra | coordinator/replica latency, timeouts, tombstones, partition size, repair |
| Elasticsearch | shard allocation, heap/GC, queues/rejections, slow log/Profile, disk |
| Kubernetes | rollout, events, probes, restarts, throttling/OOM, endpoints and node health |

## Containment Versus Root Cause

Restarting, scaling, killing a blocker, increasing a timeout, or purging a queue may restore
service but is not necessarily correction. Record:

- trigger and root mechanism;
- why controls failed to prevent propagation;
- why detection was late/noisy;
- data repair or reconciliation needed;
- permanent code/config/capacity/ownership change;
- evidence that recurrence is reduced.

## Incident Interview Answer

Use: impact -> containment -> evidence -> hypotheses -> root cause -> correction -> validation
-> prevention. State what you personally decided and how the team coordinated. Do not claim
certainty before evidence or blame an individual action without systemic controls.

## Practice Labs

1. Create a slow dependency and diagnose pool exhaustion versus CPU saturation.
2. Generate Kafka lag on one partition and distinguish hot key from global under-capacity.
3. Cause a database lock chain and identify blocker, transaction age, and safe correction.
4. Deploy an incompatible config/schema change, stop rollout, and prove rollback/reconciliation.
5. Run a game day where telemetry is intentionally incomplete; identify the missing evidence.

## Official References

- [Google SRE incident response](https://sre.google/sre-book/managing-incidents/)
- [OpenTelemetry signals](https://opentelemetry.io/docs/concepts/signals/)
- [Kubernetes debugging](https://kubernetes.io/docs/tasks/debug/)

## Recommended Next

Continue with [Scaling, Security, And Rejected Trade-Offs](./ARCHITECT-SCALE-SECURITY-TRADEOFFS.md).

