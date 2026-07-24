---
title: Distributed Reliability Revision Sheet
description: Rapid revision of deadlines, retries, circuit breakers, idempotency, sagas, outbox, locking, backpressure, and recovery.
difficulty: Advanced
page_type: Interview
status: Generic
prerequisites: [Distributed Reliability Overview]
learning_objectives: [Recall reliability pattern boundaries, Diagnose partial failure, Defend recovery and consistency decisions]
technologies: [Resilience4j, Kafka, SQL, Spring Boot]
last_reviewed: "2026-07-23"
---

# Distributed Reliability Revision Sheet

## Core Rule

A timeout means the caller stopped waiting; it does not prove whether the remote
effect committed. Design an idempotent retry or reconciliation path for unknown
outcomes.

## Pattern Recall

| Pattern | Solves | Does not solve |
|---|---|---|
| timeout | unbounded waiting/resource use | unknown remote outcome |
| retry | selected transient failure | permanent error or non-idempotent duplication |
| circuit breaker | repeated calls to an unhealthy dependency | dependency recovery or backlog |
| bulkhead | shared-resource blast radius | total capacity shortage |
| rate limiter | admission rate | already admitted work or downstream correctness |
| idempotency | duplicate logical attempts | unrelated commands or missing authorization |
| outbox | database state plus publish intent | exactly-once relay delivery |
| inbox | duplicate event business effects | bad ordering or invalid events |
| saga | multi-service business progress/compensation | global ACID rollback |
| fencing | stale owner writes | ownership selection by itself |
| reconciliation | uncertain/divergent state | immediate response latency |

## Retry Budget

```text
worst calls = original attempt + retries
amplified traffic = logical traffic * attempts
total deadline >= attempt timeouts + backoff + queue/processing overhead
```

Retry only classified transient failures, add jitter, respect an overall deadline,
and stop before amplified work destroys the recovering dependency.

## Idempotency Checklist

- stable client/event identity;
- scoped to actor and operation;
- request fingerprint or conflict behavior;
- unique database constraint;
- business effect and identity record in one transaction;
- stored authoritative response/outcome;
- retention longer than retry/replay window;
- concurrent and crash-window tests.

## Saga Recall

Choreography distributes reactions through events; orchestration centralizes
workflow decisions. Both need state transitions, idempotency, timeouts, late-event
policy, compensation, reconciliation, observability, and manual recovery.

## Incident Prompts

- retries spike during dependency recovery;
- payment completes after order expiry;
- outbox backlog grows while broker is unavailable;
- the same scheduled job runs on multiple replicas;
- lock holder pauses and later resumes stale work;
- DLT replay repeats old side effects;
- region recovery restores inconsistent workflow stages.

## Interview Answer Shape

State the invariant, enumerate definite/unknown outcomes, identify the authority,
select the pattern, bound resources and retry, define durable evidence, then explain
recovery and remaining limitations.

## Final Checklist

- deadlines bound every remote/resource wait;
- retries are classified, bounded, jittered, and idempotent;
- overload has an admission and shedding policy;
- local transactions protect local invariants;
- cross-system workflows use durable intent and reconciliation;
- stale ownership is fenced;
- every terminal failure has an owned recovery path.
