---
title: TDD Workflow And Design Feedback
description: Practise red-green-refactor, test selection, state and interaction testing, triangulation, test doubles, and outside-in versus inside-out development.
difficulty: Intermediate
page_type: Deep Dive
status: Generic
prerequisites: [JUnit Testing Fundamentals]
learning_objectives: [Run a disciplined TDD loop, Use tests as design feedback, Avoid over-mocking and brittle implementation coupling]
technologies: [Java, JUnit 5, Mockito]
last_reviewed: "2026-07-23"
---

# TDD Workflow And Design Feedback

## Red, Green, Refactor

1. **Red:** add one small test for missing behavior and see it fail for the intended reason.
2. **Green:** implement the simplest correct behavior, not a fake special case that cannot
   survive the next example.
3. **Refactor:** remove duplication and improve names/boundaries while all tests remain green.

A test that passes immediately may be useful regression coverage, but it did not drive the
new behavior. A test that fails because setup is broken provides no design signal.

## Worked Domain Example

```java
class PriceTest {
    @Test
    void appliesPercentageDiscountWithoutCreatingNegativeMoney() {
        var price = Money.inr("100.00");

        var discounted = price.discountedBy(15);

        assertEquals(Money.inr("85.00"), discounted);
    }

    @Test
    void rejectsDiscountAboveOneHundredPercent() {
        assertThrows(IllegalArgumentException.class,
            () -> Money.inr("100.00").discountedBy(101));
    }
}
```

The first example drives value semantics and arithmetic. The second triangulates a boundary.
Further examples should be chosen by risk: rounding, zero, currency mismatch, and overflow.

## Test Naming And Structure

Name observable behavior and condition, not method plumbing. Arrange only relevant state,
act once when practical, and assert meaningful outcome. Keep failure messages diagnostic.

Good tests are deterministic, isolated at their chosen boundary, fast enough for their
feedback role, readable as examples, and sensitive to meaningful regression while tolerant
of valid refactoring.

## State Versus Interaction Testing

Prefer state/output checks for pure domain behavior. Verify interactions when the interaction
is the contract: publish once with an idempotency key, do not charge after fraud rejection,
or release a lease. Do not mirror every private call.

```java
@Test
void publishesConfirmationOnlyAfterReservationSucceeds() {
    when(inventory.reserve("O-1")).thenReturn(RESERVED);

    service.confirm("O-1");

    verify(events).publish(new OrderConfirmed("O-1"));
    verifyNoMoreInteractions(events);
}
```

If a test needs a deep mock graph, the production object may have too many responsibilities
or the test may be at the wrong boundary.

## Test Doubles

| Double | Role |
|---|---|
| fake | working simplified implementation, such as in-memory repository |
| stub | supplies controlled answers |
| spy | records calls, often around a real object |
| mock | interaction expectations verified by a framework/test |
| dummy | required argument never meaningfully used |

Prefer a fake when stateful behavior matters and it accurately represents the contract;
verify the fake itself against the real adapter contract where divergence is risky.

## Inside-Out And Outside-In

Inside-out grows stable domain objects and composes outward. Outside-in starts from an
observable acceptance boundary and uses collaborators to discover ports. Classical TDD
usually emphasizes state and real objects; mockist/London-style TDD emphasizes interaction
and role discovery. Choose deliberately; neither removes integration testing.

## Legacy Code

Add characterization tests around current observable behavior before changing risky code.
Create seams around time, randomness, network, filesystem, and static/global state. Refactor
in small steps, distinguish current behavior from desired behavior, and delete obsolete
characterization tests after a stronger specification owns the rule.

## Common Failure Modes

- test-after development relabeled as TDD;
- writing five tests before making the first one pass;
- asserting implementation order without a contract reason;
- mocking value objects, collections, or the class under test;
- making private methods public only to test them;
- ignoring concurrency, failure, persistence, and timeout boundaries;
- optimizing for line coverage instead of risk confidence.

## Official References

- [JUnit writing tests](https://junit.org/junit5/docs/current/user-guide/#writing-tests)
- [Mockito verification](https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html)

## Recommended Next

Continue with [BDD Discovery, Specifications, And Domain Examples](./BDD-DISCOVERY-SPECIFICATIONS.md).

