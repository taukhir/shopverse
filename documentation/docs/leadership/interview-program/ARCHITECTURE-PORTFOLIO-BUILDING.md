---
title: Build A Defensible Architecture Portfolio
description: Create sanitized, evidence-backed architecture case studies that demonstrate decisions, implementation depth, production reasoning, and measurable outcomes.
difficulty: Advanced
page_type: Explanation
status: Generic
prerequisites: [One completed project or substantial lab]
learning_objectives: [Select credible case studies, Structure architecture narratives, Protect confidential information, Attach measurable engineering evidence]
technologies: [C4, ADR, Git, Markdown]
last_reviewed: "2026-07-24"
---

# Build A Defensible Architecture Portfolio

A portfolio is not a gallery of technology logos. Each case study must connect a business
problem to constraints, decisions, implementation, failure handling and measured results.
Use real work where disclosure is permitted; otherwise build an equivalent lab and label it
honestly.

## Portfolio Shape

Create three complementary cases:

1. a distributed/event-driven workflow showing consistency and failure recovery;
2. a performance or scaling case showing measurement and bottleneck removal;
3. a platform/security/operations case showing deployment, observability and incident response.

Each case should be understandable in five minutes and defensible for forty-five minutes.

## Case-Study Template

| Section | Required content |
|---|---|
| context | users, business capability and prior state |
| constraints | scale, latency, availability, compliance, team, time and cost |
| invariants | truths that must survive retry, concurrency and partial failure |
| options | at least two credible alternatives and selection criteria |
| decision | chosen design, assumptions and ADR |
| internals | request/event flow, state transitions, storage and concurrency |
| failures | failure modes, blast radius, containment and recovery |
| security | assets, trust boundaries, identity, authorization and secrets |
| proof | test method, metrics, SLO, incident exercise and observed result |
| reflection | limitation, rejected trade-off and trigger to revisit |

## Artifact Set

Keep artifacts small and cross-linked:

- one-page executive summary;
- system-context and container diagrams;
- one sequence diagram for the critical path and one for failure recovery;
- two to five ADRs;
- API/event schemas and compatibility policy;
- threat model and data-classification note;
- capacity model with explicit units;
- load/failure test scripts and raw results;
- dashboard screenshot or exported configuration;
- runbook and post-incident review;
- source code with a reproducible setup.

## Sanitization And Honesty

Remove employer names, customer data, credentials, internal hostnames, commercial numbers
and proprietary source. Replace exact values with clearly labelled representative ranges.
Never imply that a personal lab ran at an employer's production scale. State your role,
which decisions you owned, what the team owned, and which results are simulated.

## Evidence Before Claims

Weak: “The design was highly available.”

Strong: “A three-node dependency lost one node during a 2,000-request/s test. Error rate
remained below 0.2%, p99 recovered within 42 seconds, and no committed business record was
lost; the test script, dashboard and reconciliation query are linked.”

Record test environment, dataset, warm-up, duration, percentiles, resource saturation and
known limitations. Otherwise results are hard to reproduce or compare.

## README Structure

```text
portfolio-case/
├── README.md
├── diagrams/
├── decisions/
├── contracts/
├── src/
├── tests/load/
├── tests/failure/
├── observability/
├── runbooks/
└── results/
```

The README should offer a five-minute route and a deep route. Pin tool versions, provide
one safe startup command, include expected results, and explain cleanup.

## Portfolio Review Rubric

Score each dimension from 0 to 4: clarity, constraint quality, internal correctness,
trade-off depth, failure reasoning, security, operability, evidence, personal ownership and
communication. A publishable case has no zero and averages at least three.

## Practice Lab

Build a case from the ShopVerse order path. Include the database-to-event consistency
decision, duplicate-delivery invariant, schema evolution, consumer lag incident, capacity
calculation and rollback. Ask another engineer to find unsupported claims; turn every claim
into a link to evidence or qualify it.

## Official References

- [C4 model diagrams](https://c4model.com/diagrams)
- [ADR resources](https://adr.github.io/)
- [Google SRE monitoring distributed systems](https://sre.google/sre-book/monitoring-distributed-systems/)

## Recommended Next

Continue with [Mock Interview Formats, Question Bank, And Scoring](./MOCK-INTERVIEW-FORMATS-QUESTION-BANK.md).

