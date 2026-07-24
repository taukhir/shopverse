---
title: Twelve-Week Architecture Interview Preparation Programme
description: A twelve-week schedule combining technical depth, hands-on evidence, portfolio production, revision, and progressively harder mock interviews.
difficulty: Advanced
page_type: Learning Path
status: Generic
prerequisites: [Architecture Portfolio And Mock Interview Programme]
learning_objectives: [Plan balanced preparation, Produce evidence each week, Use spaced revision, Reach interview readiness through measured mocks]
technologies: [Java, Spring, Kafka, Databases, Kubernetes, Architecture]
last_reviewed: "2026-07-24"
---

# Twelve-Week Architecture Interview Preparation Programme

Use six focused days and one recovery/review day per week. A normal study day has 45 minutes
of concept recall, 90 minutes of implementation or diagnosis, 30 minutes of spoken
explanation and 15 minutes updating evidence and the weakness log.

## Weekly Programme

| Week | Primary depth | Required evidence | Mock |
|---:|---|---|---|
| 1 | Java concurrency, JVM and diagnostics | thread/heap/GC investigation | 30-minute Java depth |
| 2 | Spring runtime, MVC, data, security | traced request plus failure test | Spring internals |
| 3 | SQL, Oracle and transactions | query plan, contention and recovery | data design |
| 4 | Cassandra and distributed data | query-first model and failure lab | database selection |
| 5 | Kafka and Spring Kafka | lag, retry, ordering and outbox lab | eventing incident |
| 6 | Streams, Connect and schema governance | stateful topology plus compatibility gate | event architecture |
| 7 | containers, Kubernetes and networking | rollout plus DNS/TLS incident | platform diagnosis |
| 8 | Helm, GitOps, Argo CD and observability | promotion, drift and rollback evidence | delivery incident |
| 9 | microservices, gRPC and service mesh | protocol/mesh decision with threat model | system design |
| 10 | system design and capacity | complete case study one | 60-minute design |
| 11 | portfolio and leadership narratives | three reviewed cases and eight stories | full interview loop |
| 12 | revision and interview simulation | closed critical gaps | two 90-minute loops |

## Daily Rotation

- Day 1: learn and draw internals from memory.
- Day 2: implement the happy path and tests.
- Day 3: inject failure and diagnose with evidence.
- Day 4: scale, secure and calculate capacity.
- Day 5: compare alternatives and write an ADR.
- Day 6: timed explanation, interview questions and portfolio update.
- Day 7: light spaced recall, review metrics and recover.

## Revision System

After each topic create a one-page overview, a failure matrix, ten retrieval questions and
one diagram drawn from memory. Review after one day, one week, three weeks and six weeks.
Answers that feel familiar but cannot be produced without notes remain unlearned.

## Readiness Dashboard

Track:

- coverage: required topics completed with a lab;
- recall: closed-book question accuracy;
- application: successful failure and scale exercises;
- communication: mock rubric average and variance;
- evidence: portfolio claims backed by reproducible artifacts;
- recurrence: critical weaknesses repeated in recent mocks.

Do not use total reading hours as the primary measure. A suggested exit threshold is an
average mock score of at least three out of four, no critical error in three consecutive
rounds, and all portfolio claims traceable to evidence.

## Final Interview Week

Reduce new material. Rehearse summaries, diagrams, constraints, leadership stories and
questions for the interviewer. Run only short drills in the final forty-eight hours. Check
the interview format and environment, but preserve sleep and normal routines.

## After Every Real Interview

Within one hour, capture questions, follow-ups, unclear answers and observed signals without
recording confidential interviewer content. Update the weakness log, schedule one corrective
drill, and avoid changing the entire programme from a single data point.

## Official References

- [Google SRE workbook](https://sre.google/workbook/table-of-contents/)
- [Java documentation](https://docs.oracle.com/en/java/)
- [Kubernetes documentation](https://kubernetes.io/docs/home/)

## Recommended Next

Return to the [Architecture Portfolio And Mock Interview Programme](../ARCHITECTURE-PORTFOLIO-MOCK-INTERVIEW-PROGRAM.md), select a Week 1 baseline mock, and record the rubric before studying further.

