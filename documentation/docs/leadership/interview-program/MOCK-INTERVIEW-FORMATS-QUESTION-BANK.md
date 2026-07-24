---
title: Mock Interview Formats, Question Bank, And Scoring
description: Run repeatable technical mocks with realistic timing, progressive follow-ups, evidence-based scoring, and targeted remediation.
difficulty: Advanced
page_type: Practice
status: Generic
prerequisites: [Architecture portfolio outline]
learning_objectives: [Run structured mocks, Ask progressive follow-ups, Score observable behaviour, Convert feedback into drills]
technologies: [Java, Spring, Kafka, SQL, Cassandra, Kubernetes]
last_reviewed: "2026-07-24"
---

# Mock Interview Formats, Question Bank, And Scoring

Random question practice creates random improvement. Use a fixed format, observable scoring
criteria and a written feedback loop. Record with consent and review both technical content
and communication.

## Recommended Mock Formats

| Round | Time | Structure |
|---|---:|---|
| focused depth | 30 min | 5 clarify, 15 explain, 7 follow-ups, 3 feedback |
| standard technical | 60 min | 5 scope, 35 core problem, 15 failures/trade-offs, 5 questions |
| architect loop | 90 min | 10 requirements, 45 design, 20 deep dive, 10 operations/security, 5 summary |
| incident simulation | 45 min | symptom, evidence requests, containment, diagnosis, recovery, prevention |
| portfolio defence | 45 min | five-minute case, decision challenge, failure scenario, evidence audit |

## Progressive Follow-Up Ladder

The interviewer should not reveal the intended solution. Escalate through:

1. clarify business outcome and constraints;
2. trace runtime internals;
3. introduce partial failure or overload;
4. challenge correctness, ordering or consistency;
5. require scale and capacity numbers;
6. add security/compliance constraints;
7. ask for rejected alternatives;
8. demand production evidence and rollback.

## Core Question Bank

### Java And JVM

- A service has rising latency but low CPU. How do thread states, locks, I/O and GC change your hypotheses?
- When would virtual threads help, and what pinned or downstream bottlenecks remain?
- Explain safe publication and diagnose a concurrency bug that disappears under debugging.

### Spring And Data

- Trace an HTTP request through filters, security, MVC, transaction proxy, connection pool and database.
- A transaction annotation appears ignored. What proxy and invocation conditions do you inspect?
- Design idempotent database updates under retries and concurrent delivery.

### Kafka And Eventing

- Lag rises on one partition only. Diagnose key skew, poison records and downstream latency.
- Payment succeeds but offset commit fails. Preserve correctness without claiming global exactly once.
- Add partitions without silently breaking per-key ordering or consumer assumptions.

### Platform And Network

- A rollout is healthy in Kubernetes but clients see intermittent 503s. Trace DNS, endpoints, proxy, readiness and termination.
- TLS works from one pod but fails from another. Determine whether identity, trust, SNI, time or policy is responsible.
- Argo CD repeatedly reverses an emergency fix. Explain reconciliation and a safe operational procedure.

## Scoring Rubric

Score 0–4 for requirements, structure, correctness, internals, failure model, diagnosis,
scale, security, trade-offs, evidence and communication. Record exact observed behaviour,
not personality labels.

```text
Weak: “Needs more depth.”
Useful: “Did not distinguish heartbeat failure from max.poll.interval expiry;
         revise consumer-group lifecycle and repeat a 10-minute drill.”
```

Critical errors—unsafe data loss, insecure defaults, incorrect consistency claims or no
rollback—cap the round at two until corrected.

## Feedback Loop

Within twenty-four hours:

1. write the strongest and weakest answer;
2. classify gaps as knowledge, reasoning, evidence, structure or delivery;
3. select no more than two corrective drills;
4. repeat the failed segment within forty-eight hours;
5. schedule spaced retests at one and three weeks.

Track repeated weaknesses by concept, not question wording. The goal is transferable
reasoning rather than memorized answers.

## Interviewer Packet

For every mock prepare a prompt, hidden constraints, follow-up ladder, expected signals,
red flags, scoring sheet and reference answer. Rotate interviewers so one person's preferred
solution does not become the curriculum.

## Official References

- [Java Language Specification](https://docs.oracle.com/javase/specs/)
- [Spring Framework reference](https://docs.spring.io/spring-framework/reference/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)

## Recommended Next

Continue with [System Design, Troubleshooting, And Leadership Rounds](./SYSTEM-DESIGN-BEHAVIORAL-LEADERSHIP-ROUNDS.md).

