---
title: Engineering Foundations Revision Sheet
description: Rapid revision for design principles, patterns, APIs, data structures, testing, delivery, and technical review.
difficulty: Advanced
page_type: Interview
status: Generic
prerequisites: [Engineering Foundations Overview]
learning_objectives: [Recall core engineering decisions quickly, Review a design across quality boundaries, Answer foundational architect questions concisely]
technologies: [Java, HTTP, SQL, Git, CI]
last_reviewed: "2026-07-23"
---

# Engineering Foundations Revision Sheet

Use after completing the [Engineering Foundations Overview](./ENGINEERING-FOUNDATIONS-OVERVIEW.md).

## One-Line Recall

| Concept | Revision answer |
|---|---|
| cohesion | Keep behavior and data that change for the same reason together. |
| coupling | Measure how much one component knows about or depends on another. |
| abstraction | Preserve the essential contract while hiding replaceable detail. |
| encapsulation | Protect invariants by controlling access to state and behavior. |
| dependency inversion | Make policy depend on stable contracts, not volatile infrastructure. |
| composition | Build behavior from collaborating objects instead of inheriting implementation. |
| idempotency | Repeating the same logical operation converges on one authoritative effect. |
| compatibility | Old and new participants can safely overlap during evolution. |
| observability | Runtime evidence can explain state, impact, and recovery. |

## Pattern Selection

| Need | Consider | Avoid when |
|---|---|---|
| choose interchangeable behavior | Strategy | behavior never varies |
| isolate construction | Factory or Builder | construction is already trivial |
| translate an external contract | Adapter | it merely renames identical methods |
| add cross-cutting behavior | Decorator or Proxy | hidden ordering makes behavior unclear |
| notify multiple observers | Observer/events | immediate consistency or response is required |
| process through ordered handlers | Chain of Responsibility | exactly one explicit owner is clearer |

## API Review

- resources and commands express business intent;
- validation and error contracts are stable;
- retries are safe through idempotency keys or conditional state transitions;
- pagination has deterministic ordering;
- authentication and object-level authorization are explicit;
- compatibility, deprecation, rate limits, and observability are defined.

## Code Review Sequence

1. invariant and behavior correctness;
2. security and data protection;
3. transaction, concurrency, and failure boundaries;
4. responsibility and dependency design;
5. performance and resource ownership;
6. test evidence, telemetry, rollout, and rollback;
7. naming and local readability.

## Interview Prompts

**Pattern or simple code?** Use the simplest structure that preserves the required
variation and test boundary. A pattern is justified by change and risk, not by name.

**Monolith or microservices?** Start from ownership, independent scaling/deployment,
consistency, team boundaries, and operational maturity. A modular monolith is often
the safer starting point.

**Unit or integration test?** Unit tests isolate logic cheaply; integration tests
prove framework, database, serialization, network, and configuration boundaries.
Use both where each failure would matter.

**What makes code production-ready?** Correct invariants, bounded resources,
security, failure handling, telemetry, compatible deployment, recovery, and proven
tests—not only clean structure.

## Final Checklist

- requirements and invariants precede implementation;
- dependencies point toward stable policy;
- patterns solve demonstrated variation;
- APIs and data evolve compatibly;
- state and work have clear ownership;
- resources and failure are bounded;
- tests and production evidence cover critical boundaries.
