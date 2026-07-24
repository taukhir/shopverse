---
title: Spring Data Testing Observability Capacity And Incidents
description: Test pyramid, Testcontainers, query evidence, metrics, tracing, capacity calculations, security, and production runbooks across data modules.
difficulty: Architect
page_type: Production Guide
status: Generic
prerequisites: [Spring Data modules, database operations]
learning_objectives: [Build meaningful persistence tests, Instrument database access, Diagnose and scale production workloads]
technologies: [Spring Data, Testcontainers, Micrometer, OpenTelemetry]
last_reviewed: "2026-07-24"
---

# Spring Data Testing Observability Capacity And Incidents

## Evidence Pyramid

| Layer | Proves | Cannot prove alone |
|---|---|---|
| unit test | domain decisions and adapter collaboration | mappings, queries, constraints |
| repository slice | mapping and repository behavior | full security, messaging and deployment |
| Testcontainers integration | real engine dialect, indexes, transactions and failures | production scale |
| contract/component test | adapter boundary and compatibility | cluster saturation |
| load/failure test | capacity, queueing, timeouts and recovery | every business invariant |
| production telemetry | actual workload behavior | counterfactual failure safety |

Prefer the same database family and compatible version/configuration used in production.
H2 cannot prove PostgreSQL/Oracle SQL, Cassandra partitions, MongoDB indexes, Redis topology,
or Elasticsearch analysis.

## Test Matrix

- Mapping of IDs, time, decimals, enums, nulls, embedded/collection values and converters.
- Unique, foreign-key, check, version, partition and index behavior.
- Derived, declared and custom queries including empty and maximum result cases.
- Transaction rollback, isolation, lock contention and unknown outcomes.
- Paging stability under concurrent inserts/deletes.
- Duplicate delivery, idempotency, outbox and reconciliation.
- Schema migration forward compatibility and rollback/roll-forward.
- Authentication, TLS, authorization and tenant separation.
- Timeout, cancellation, failover, retry and graceful shutdown.

## Observability

Measure separately:

```text
request queue -> connection acquisition -> server execution -> row/document transfer
-> mapping/conversion -> application processing
```

Track request rate, errors, p50/p95/p99, acquisition wait, active/idle/pending connections,
query/result size, retries, timeouts, transaction duration, lock wait, replication/projection
lag, cache hit/eviction, rejected work, and resource saturation.

Use low-cardinality tags such as operation name and datastore. Never tag metrics with IDs,
raw queries, tenant IDs at unbounded scale, or user input. Sanitize SQL/query logs and spans.

## Capacity Model

Apply Little's Law as a starting point:

```text
concurrency approximately equals throughput x average latency
```

At 500 database operations/second and 40 ms average end-to-end database time, about 20
operations are in flight on average; tail latency and bursts require headroom. Pool size must
fit the database's total connection budget across pods, jobs, admin tools, and failover.

```text
total possible connections = replicas x pool max + background/admin consumers
```

Increasing pool size can worsen database queueing. Scale only after locating CPU, I/O, locks,
network, query plans, hot partitions/shards, or application concurrency as the bottleneck.

## Security

- Use separate least-privilege identities per workload and environment.
- Require TLS and validate server identity.
- Rotate credentials/certificates without restarting every instance simultaneously.
- Store secrets in an approved secret manager, never source or images.
- Prevent injection by binding values and whitelisting identifiers.
- Encrypt/tokenize sensitive fields based on threat and query requirements.
- Audit privileged access and destructive maintenance.

## Incident Workflow

1. Declare user impact, affected operations, start time and recent changes.
2. Split saturation into application queue, pool wait, network, server execution and result handling.
3. Compare all operations versus one query/key/partition/shard.
4. Inspect retries and timeout multiplication before scaling clients.
5. Apply the smallest reversible mitigation: shed load, disable expensive feature, reduce concurrency,
   pause replay, route reads, or rollback.
6. Preserve queries, plans, traces, metrics, logs and database diagnostics.
7. Reconcile data after recovery; availability restoration does not prove correctness.

## Runbook Scenarios

### Pool Exhaustion

Inspect acquisition wait, active transactions, thread dumps, slow queries, remote calls inside
transactions, leak detection and pod count. Do not immediately increase the pool.

### Hot Partition Or Shard

Compare per-key/partition/shard rate and latency, cardinality and routing. Revisit key design,
admission control, tenant isolation or bucketing while preserving ordering requirements.

### Retry Storm

Stop unbounded retries, respect one end-to-end budget, add jitter, cap concurrency, and protect
the recovery path. Confirm whether outcomes are known before replay.

### Migration Regression

Identify lock duration, scan/backfill progress, plan changes and mixed-version compatibility.
Use feature flags, expand/contract, throttling, rollback or roll-forward as preplanned.

## Production Readiness Checklist

- SLO and alert thresholds are defined from user impact.
- Every query path is bounded and indexed or explicitly accepted.
- Pool/concurrency budgets are reconciled across replicas.
- Backups and restores are tested.
- Migrations are reviewed and reversible.
- Retry and idempotency policies are documented.
- Dashboards distinguish latency components.
- On-call owns replay, reconciliation and destructive procedures.

## Official References

- [Spring Boot data access](https://docs.spring.io/spring-boot/reference/data/)
- [Spring Boot observability](https://docs.spring.io/spring-boot/reference/actuator/observability.html)
- [Testcontainers](https://testcontainers.com/)

## Recommended Next

Finish with [Spring Data Interview, Labs, And Revision](./SPRING-DATA-INTERVIEW-REVISION.md).

