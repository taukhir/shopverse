---
title: Machine-Coding And Object-Oriented Design Interview
description: Deliver runnable Java designs under time pressure using explicit scope, domain invariants, concurrency, extensibility, tests, and review evidence.
difficulty: Advanced
page_type: Workbook
status: maintained
prerequisites: [SOLID, design patterns, Java testing]
learning_objectives: [Scope a timed design, Model domain invariants, Deliver executable vertical slices, Explain trade-offs and extensions]
technologies: [Java, JUnit, Object-Oriented Design]
last_reviewed: "2026-07-31"
scope: generic
owner: docs-data-structures
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Machine-Coding And Object-Oriented Design Interview

Machine coding evaluates executable design, not diagram vocabulary. Start with use
cases, exclusions, invariants, concurrency expectations, storage assumptions, and
observable behavior. Deliver one tested vertical slice before optional features.

## Ninety-Minute Execution Plan

| Time | Outcome |
|---:|---|
| 0–10 min | clarify requirements, examples, constraints, and explicit non-goals |
| 10–20 min | identify entities/value objects, state transitions, interfaces, and concurrency boundary |
| 20–60 min | implement the smallest end-to-end flow with validation and deterministic behavior |
| 60–75 min | add focused tests for success, rejection, boundary, and concurrency-sensitive behavior |
| 75–90 min | refactor names/ownership, run tests, explain extensions and production gaps |

## Ten Exercises

1. **Parking lot:** atomic spot claim, vehicle/spot compatibility, ticket state, pricing policy, and exit idempotency.
2. **Elevator controller:** request scheduling, car state machine, capacity, fairness, and emergency behavior.
3. **Splitwise ledger:** exact money arithmetic, expense strategies, balance invariants, settlement, and audit history.
4. **Library system:** copy versus title identity, loan state, reservation queue, fines, and concurrent checkout.
5. **Notification service:** channel strategies, templates, preference policy, provider adapters, idempotency, and delivery ledger.
6. **In-memory key-value store:** TTL, atomic operations, eviction, snapshot ownership, concurrency, and testable clock.
7. **Task scheduler:** priorities, dependencies, bounded workers, retry policy, cancellation, and terminal outcomes.
8. **Rate limiter:** strategy boundary for fixed/sliding/token algorithms, key scope, monotonic clock, cleanup, and concurrency.
9. **Inventory reservation:** available/reserved invariant, atomic claim, expiry, release idempotency, and event intent.
10. **Logging framework:** levels, appenders, formatting, asynchronous bounded delivery, failure policy, and shutdown.

## Design Rules

- Keep domain state private and change it through validated behavior.
- Use value objects for money, identifiers, time ranges, and other validated values.
- Introduce interfaces at real policy/infrastructure variation points, not for every class.
- Inject a clock and ID generator for deterministic tests.
- Use exceptions or result types consistently for expected rejections.
- Do not pretend an in-memory implementation has distributed durability or transactions.

## Scoring Rubric

| Dimension | Strong evidence |
|---|---|
| correctness | invariants and state transitions are explicit and tested |
| design | responsibilities are cohesive; dependencies and extension points are visible |
| code | readable Java, safe collections/types, deterministic behavior, no hidden globals |
| concurrency | ownership and atomicity match the prompt; resources are bounded |
| testing | success, invalid, boundary, and race-sensitive paths are exercised |
| communication | scope, trade-offs, unfinished work, and production migration are honest |

## Official References

- [JUnit 5 user guide](https://junit.org/junit5/docs/current/user-guide/)
- [Java Collections Framework](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/package-summary.html)
- [Java concurrency API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/package-summary.html)

## Recommended Next

Use the [LLD Interview Workbook](../architecture/hld-lld/LLD-INTERVIEW-WORKBOOK.md)
for deeper review questions and diagrams.
