---
title: TDD And BDD Interview, Labs, And Revision
description: Lead-level questions, production scenarios, practical exercises, and a compact revision sheet for TDD and BDD.
difficulty: Advanced
page_type: Interview Guide
status: Generic
prerequisites: [TDD And BDD With Spring In Production]
learning_objectives: [Defend testing decisions, Diagnose brittle and slow suites, Practise TDD and BDD with production scenarios]
technologies: [Java, JUnit 5, Spring Boot Test]
last_reviewed: "2026-07-23"
---

# TDD And BDD Interview, Labs, And Revision

## Top Interview Questions

**Does TDD guarantee good design?** No. It creates frequent design feedback. Poor examples,
over-mocking, unwillingness to refactor, and testing at the wrong boundary still produce bad
design.

**What do you test first?** The smallest high-risk behavior/example that reduces uncertainty
and can fail for one clear reason—not necessarily the easiest method.

**Should private methods be tested?** Through public observable behavior. Difficulty doing so
may reveal a missing collaborator/value object, but extracting solely for coverage is not a
goal.

**How much mocking is too much?** When tests duplicate implementation, have deep stubbing,
break on harmless refactoring, or cannot represent collaborator state/failure truthfully.

**How does BDD help architecture?** Examples expose commands, events, invariants, ownership,
consistency, failure semantics, and ambiguous language before they become coupled code.

**Are acceptance tests enough?** No. They are slower and coarser. Combine focused domain tests,
adapter/contract evidence, integration tests, and few end-to-end journeys.

**How do you test eventual consistency?** Trigger through a real boundary, poll observable
state with a bounded deadline, assert intermediate/failure outcomes when important, and
prove idempotency/replay separately.

## Production Scenarios

**The suite takes 45 minutes.** Profile by layer, remove accidental full contexts, improve
context reuse, parallelize only isolated tests, replace redundant end-to-end checks with
focused evidence, optimize infrastructure startup, and preserve critical risk coverage.

**Tests pass but production fails on Oracle.** A substitute did not represent dialect, plan,
locking, constraint, or commit behavior. Add a production-engine integration boundary and
retain fast unit/slice tests for other risks.

**Refactoring breaks hundreds of mocks.** Tests are coupled to call structure. Restore
observable outcome tests, introduce stable ports only at real boundaries, and refactor in
small green steps.

**Flaky asynchronous test.** Remove sleeps/shared mutable state, control clocks/IDs, isolate
topics/data, wait on a domain condition with deadline, capture diagnostics, and check for a
real race before blaming the test.

**Product examples conflict.** Pause implementation. Name the rule and context, gather a
domain decision, record examples/counterexamples, and update the canonical specification.

## Hands-On Labs

1. TDD a money/discount value object using boundary examples and refactoring.
2. TDD an order state machine with optimistic concurrency and idempotency.
3. Run an example-mapping session for cancellation/refund; automate the core rules in JUnit.
4. Drive an application port outside-in, then prove JDBC and HTTP adapters separately.
5. Add an MVC slice for validation/error contracts and a database integration test for commit.
6. Reproduce and remove an async test flake without increasing sleeps.
7. Characterize a legacy service, introduce a seam, add one rule, then refactor safely.

## One-Page Revision

- Red fails for the intended missing behavior; green is minimal correctness; refactor stays green.
- Examples are chosen by uncertainty and risk, not by getters or coverage lines.
- Prefer state/output tests; verify interactions only when interaction is the contract.
- BDD = collaborative discovery + domain language + concrete observable examples.
- Given is context, When is action, Then is observable outcome.
- Keep canonical rules at the fastest honest layer; prove adapters separately.
- Full Spring context is for wiring/cross-boundary risks, not every branch.
- Real engines/brokers are required where substitutes hide important semantics.
- Test idempotency, timeouts, duplicates, reordering, partial failure, and reconciliation.
- Coverage is a diagnostic; confidence comes from risk-focused evidence.

## Official References

- [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/)
- [Spring testing reference](https://docs.spring.io/spring-framework/reference/testing.html)

## Recommended Next

Return to the [TDD And BDD Engineering Path](../TDD-BDD-ENGINEERING-PATH.md) and complete one lab using an actual Shopverse business rule.
