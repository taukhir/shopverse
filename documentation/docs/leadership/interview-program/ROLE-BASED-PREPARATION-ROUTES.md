---
title: Role-Based Preparation Routes And Schedules
description: Select mandatory depth, specializations, six-week or twelve-week pacing, and interview evidence for Senior Java, Lead, Architect, and financial-platform roles.
difficulty: Intermediate
page_type: Learning Path
status: Complete
prerequisites: [Lead And Architect Preparation Dashboard]
technologies: [Java, Spring, Kafka, Databases, Kubernetes, Architecture]
last_reviewed: "2026-07-28"
---

# Role-Based Preparation Routes And Schedules

Select one primary role. Trying to prepare for every specialization at equal depth hides the gaps
that matter in the actual interview loop.

## Senior Java Engineer

### Mandatory depth

- Java language, collections, generics, exceptions, streams, concurrency, memory, JVM and diagnostics;
- Spring container, Boot auto-configuration, MVC, validation, transactions and security basics;
- SQL, indexes/plans, JPA/Hibernate fetching/locking, database transactions and pooling;
- testing with JUnit, Mockito, Spring tests and Testcontainers;
- API contracts and one messaging platform;
- Docker/Kubernetes fundamentals and application troubleshooting;
- coding patterns and complexity.

### Interview evidence

Trace one request end to end, diagnose one Java performance incident, optimize one query/ORM path,
and explain one idempotent event workflow.

## Lead Engineer

Complete Senior depth, then add:

- service boundaries, distributed consistency, Saga/outbox, retries, backpressure and cascading failure;
- Kafka consumer/producer internals, ordering, commits, DLT, lag and capacity;
- Kubernetes rollout/readiness/resources/network diagnosis;
- observability, SLOs, incident command and safe recovery;
- schema/API governance and zero-downtime migration;
- architecture decisions, delivery planning, disagreement, mentoring and risk escalation.

### Interview evidence

Prepare three decision narratives: reliability/correctness, scale/performance, and leadership/change.
Show how evidence changed a decision and how the team operated the result.

## Solution Or Software Architect

Complete Lead depth, then add:

- system-wide NFRs, capacity, cost, security, privacy, data residency and governance;
- multi-region authority, disaster recovery, RPO/RTO, failover and failback;
- platform trade-offs across synchronous, messaging, streaming, databases, caches and search;
- identity and authorization boundaries, secrets, supply chain and threat modeling;
- deployment/GitOps, service mesh/gRPC where relevant, and platform ownership;
- migration from current state, compatibility, rollout, rollback and organizational ownership;
- portfolio defense at executive, product, team and specialist altitudes.

### Interview evidence

Produce three sanitized case studies, ADRs, capacity estimates, threat/failure models, SLO/runbook,
and measured or explicitly proposed verification.

## Banking Or Financial-Platform Engineer

Complete the Senior or Lead route appropriate to level, then add:

- exact money/currency and rounding policies;
- double-entry ledger, reversals, projections and concurrent balance protection;
- authorization/capture/refund/dispute and uncertain outcomes;
- reconciliation, clearing, settlement, control totals and restartable batch;
- maker-checker, entitlements, immutable audit and sensitive-data boundaries;
- temporal data, business dates, cutoffs, EOD, recovery, and financial incident evidence.

Use [Financial Systems Architecture](../../architecture/financial/FINANCIAL-SYSTEMS-ARCHITECT-PATH.md)
as the specialization route.

## Twelve-Week Balanced Route

| Week | Depth | Revision/mock focus |
|---:|---|---|
| 1 | Java, collections and coding patterns | Java recall plus one timed coding round |
| 2 | concurrency, JVM and performance diagnosis | thread/heap/GC scenario |
| 3 | Spring container, Boot, MVC and security runtime | trace request and proxy boundaries |
| 4 | transactions, JPA/Hibernate, SQL and database production | query/lock/pool incident |
| 5 | Kafka and Spring Kafka | lag, commit, retry, ordering and outbox |
| 6 | microservices consistency and resilience | stuck Saga and cascading-failure design |
| 7 | Docker, Kubernetes, Linux and network diagnosis | rollout plus DNS/TLS incident |
| 8 | observability, SLOs, CI/CD and GitOps | incident simulation and recovery proof |
| 9 | system design, capacity, HLD and LLD | 60-minute design round |
| 10 | security, governance and multi-region recovery | threat plus DR review |
| 11 | role specialization and portfolio | three case defenses |
| 12 | closed-book revision and full loops | two 90-minute interviews; no broad new topics |

The detailed daily structure remains in the
[Twelve-Week Preparation Programme](./TWELVE-WEEK-PREPARATION-PROGRAM.md).

## Six-Week Accelerated Route

Use this only when the baseline is already at least score 2 in Java, Spring, data, and distributed
systems. Otherwise, reduce scope rather than pretending to compress missing foundations.

| Week | Days 1–3 | Days 4–5 | Day 6 | Day 7 |
|---:|---|---|---|---|
| 1 | Java/concurrency/JVM | coding and performance | Java mock | correction/rest |
| 2 | Spring/data/transactions | SQL/JPA incidents | Spring-data mock | correction/rest |
| 3 | Kafka/microservices | idempotency/Saga/outbox | eventing mock | correction/rest |
| 4 | Docker/Kubernetes/network | observability/incident | platform mock | correction/rest |
| 5 | system design/security/DR | specialization | 90-minute design | correction/rest |
| 6 | portfolio/leadership | weak-domain revision | two full loops | final review/rest |

## Four-Week Emergency Route

Do not attempt complete coverage. Prioritize:

1. Java/JVM and Spring runtime weaknesses from the job description.
2. SQL/JPA/transactions and Kafka/microservices production scenarios.
3. One platform path plus system-design method.
4. Two portfolio cases, leadership stories, and repeated mocks.

Drop P2 technologies unless explicitly required. Keep a written list of honest gaps and adjacent
experience; bluffing a specialized platform is worse than a bounded answer with a sound learning plan.

## Weekly Deliverables

Every week produces:

- one closed-book overview and diagram;
- one failure matrix and diagnostic sequence;
- one capacity/security/trade-off decision;
- ten retrieval questions with scores;
- one recorded or peer-scored mock;
- one weakness-log update and scheduled retest;
- one portfolio-quality explanation or evidence artifact.

## Recommended Next

Return to the [Preparation Dashboard](./LEAD-ARCHITECT-PREPARATION-DASHBOARD.md) and initialize the
[Revision And Readiness Scorecard](./REVISION-READINESS-SCORECARD.md).

