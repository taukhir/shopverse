---
title: Revision And Interview Readiness Scorecard
description: Reusable scoring, weakness logging, spaced revision, mock evaluation, critical-error gates, and final interview readiness criteria.
difficulty: Intermediate
page_type: Practice
status: maintained
prerequisites: [Lead And Architect Preparation Dashboard]
technologies: [Interview Practice, Spaced Retrieval, Architecture]
last_reviewed: "2026-07-28"
scope: generic
owner: docs-leadership
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Revision And Interview Readiness Scorecard

Confidence is not evidence. Score what you can produce closed-book and under follow-up pressure.
Initialize this page from the completed
[Day-Zero Diagnostic Assessment](./DAY-ZERO-DIAGNOSTIC-ASSESSMENT.md) and its
[Assessor Guide](./DAY-ZERO-ASSESSOR-SCORING-ROUTING.md).

## Domain Capability Scale

| Score | Observable capability |
|---:|---|
| 0 | cannot define the concept accurately |
| 1 | states terms, APIs or a happy path |
| 2 | traces internals and relevant boundaries |
| 3 | handles failure, diagnosis, security, scale and trade-offs |
| 4 | adapts to changed constraints and cites production/portfolio evidence |

Use half-points only when backed by a scored exercise. A role-mandatory domain below 2 is a knowledge
gap; score 2 without failure/diagnosis is a reasoning gap; score 3 without concise delivery is a
communication gap.

## Baseline Sheet

| Domain | Role priority | Recall | Internals | Failure/diagnosis | Design/trade-off | Evidence | Overall | Next retest |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Java/JVM |  |  |  |  |  |  |  |  |
| coding/DSA |  |  |  |  |  |  |  |  |
| Spring/Boot |  |  |  |  |  |  |  |  |
| data/JPA/SQL |  |  |  |  |  |  |  |  |
| Kafka/eventing |  |  |  |  |  |  |  |  |
| microservices |  |  |  |  |  |  |  |  |
| Docker/Kubernetes/network |  |  |  |  |  |  |  |  |
| observability/incidents |  |  |  |  |  |  |  |  |
| system design |  |  |  |  |  |  |  |  |
| security/governance |  |  |  |  |  |  |  |  |
| leadership/portfolio |  |  |  |  |  |  |  |  |
| specialization |  |  |  |  |  |  |  |  |

The overall score is the lowest material dimension, not the mean. Someone who recalls Kafka terms
but cannot diagnose lag is not score 3.

## Topic Revision Card

Create this for each major topic:

```text
Topic:
One-sentence purpose:
Runtime flow drawn from memory:
Three invariants:
Three common failures:
Discriminating evidence and commands:
Safe containment:
Recovery and reconciliation:
Scaling limit and capacity model:
Security boundary:
Rejected alternative and why:
Production or portfolio proof:
Next review date:
```

## Ten-Question Retrieval Pattern

Do not create ten definition questions. Use:

1. definition and problem solved;
2. component/runtime flow;
3. thread, transaction or ownership boundary;
4. internal data structure/protocol;
5. normal failure;
6. ambiguous/partial failure;
7. diagnosis and evidence;
8. scaling/capacity constraint;
9. security and recovery;
10. design alternative and trade-off.

Score before opening the answer. After correction, explain the failed question aloud from the
beginning rather than recognizing the right sentence on the page.

## Weakness Log

| Date | Mock/topic | Exact observed gap | Type | Risk | Corrective drill | Retest | Result |
|---|---|---|---|---|---|---|---|
|  |  |  | knowledge/reasoning/evidence/structure/delivery | critical/high/normal |  |  |  |

Useful entries are precise: “treated Kafka producer idempotence as consumer-effect deduplication.”
“Need more Kafka” is not actionable.

## Mock Scorecard

Score 0–4 with one evidence sentence for each:

| Dimension | Score | Evidence |
|---|---:|---|
| clarified requirements and constraints |  |  |
| structured the answer |  |  |
| technical correctness |  |  |
| runtime internals and boundaries |  |  |
| failure and ambiguity model |  |  |
| diagnosis and containment |  |  |
| scale/capacity/cost |  |  |
| security/privacy/governance |  |  |
| trade-offs and rejected alternatives |  |  |
| production verification and rollback |  |  |
| concise communication and adaptation |  |  |

## Critical-Error Gate

Any of these caps the mock at 2 until corrected:

- proposes a path that can silently lose or duplicate critical data;
- claims global exactly once without defining the transaction boundary;
- retries a non-idempotent ambiguous operation blindly;
- removes authentication, authorization, encryption, durability, constraints, or audit as a fix;
- lacks fencing/authority during failover;
- cannot provide rollback, reconciliation, or recovery for a high-risk change;
- ignores tenant/resource ownership or leaks sensitive information;
- fabricates experience or production evidence.

## Spaced Review Queue

| Topic | Studied | D+1 | D+3 | D+7 | D+21 | D+42 | Latest score | State |
|---|---|---|---|---|---|---|---:|---|
|  |  |  |  |  |  |  |  | new/learning/stable/weak |

Rules:

- score 0–1: review tomorrow with a smaller prerequisite;
- score 2: review in three days with a failure scenario;
- score 3: review in one to three weeks under changed constraints;
- score 4: maintain through mixed mocks rather than isolated repetition.

## Readiness Decision

### Senior Java Engineer

- P0 domains at least 3, including coding, Java/JVM, Spring and data;
- two standard technical mocks at 3 or above;
- no repeated critical correctness error in the last three sessions;
- two evidence-backed project stories.

### Lead Engineer

- Senior gates plus microservices, eventing, platform, incidents and leadership at 3;
- three mocks across depth, incident and system design at 3 or above;
- three decision narratives with measurable outcomes and team ownership.

### Architect

- Lead gates plus security, capacity, governance, migration and DR at 3;
- two 90-minute loops at 3 or above with changed constraints;
- three defensible cases covering correctness, scale/failure, and security/evolution;
- no critical error across the last three mocks.

### Financial specialization

- target-level gates plus money/ledger, payments, reconciliation/batch, and controls at 3;
- can handle ambiguous outcome, duplicate delivery, incorrect posting, break, close, and regional
  recovery without rewriting history or claiming unsupported exactly once.

## Final Seven Days

Stop broad additions. Rotate mixed recall, diagrams, portfolio stories, coding, and timed mocks.
Shorten weak answers, verify facts in canonical pages, prepare interviewer questions, and preserve
sleep. The final day is light retrieval and logistics—not a new framework.

## Recommended Next

Use [Mock Interview Formats And Scoring](./MOCK-INTERVIEW-FORMATS-QUESTION-BANK.md), then update the
[Preparation Dashboard](./LEAD-ARCHITECT-PREPARATION-DASHBOARD.md) from your actual result.
