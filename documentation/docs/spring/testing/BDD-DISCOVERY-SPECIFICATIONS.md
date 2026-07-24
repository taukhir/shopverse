---
title: BDD Discovery, Specifications, And Domain Examples
description: Discover behavior through examples, define ubiquitous language, write Given-When-Then specifications, and maintain executable business documentation.
difficulty: Intermediate
page_type: Deep Dive
status: Generic
prerequisites: [TDD Workflow And Design Feedback]
learning_objectives: [Facilitate example discovery, Express rules through concrete scenarios, Prevent specification drift]
technologies: [Java, JUnit 5]
last_reviewed: "2026-07-23"
---

# BDD Discovery, Specifications, And Domain Examples

BDD begins before automation. Product, engineering, and testing perspectives explore a
capability with concrete examples until rules, terminology, boundaries, and unanswered
questions are visible.

## Discovery Conversation

Use example mapping:

```text
Story/capability: customer cancels an order
Rules:
  - only PAYMENT_PENDING or CONFIRMED may be cancelled
  - captured payment requires refund workflow
Examples:
  - pending order -> cancelled immediately
  - shipped order -> rejection
Questions:
  - what if refund provider times out after accepting the request?
```

The unanswered question is valuable: it reveals idempotency and reconciliation work before
implementation.

## Given, When, Then

- **Given** describes relevant starting context, not every database row.
- **When** describes one business action or event.
- **Then** describes observable outcome and important side effects.

```text
Given order O-17 is CONFIRMED and payment P-9 is captured
When the customer requests cancellation with request key C-44
Then the order becomes CANCELLATION_PENDING
And one refund is requested using C-44
And repeating C-44 returns the same outcome
```

Avoid UI-click scripts, internal class/method names, vague “works correctly,” and long
conjunction-heavy scenarios. Separate rules when examples become unreadable.

## From Specification To Executable Test

```java
@Test
void capturedPaymentStartsIdempotentRefund() {
    givenConfirmedOrderWithCapturedPayment("O-17", "P-9");

    var result = cancellation.cancel("O-17", "C-44");
    var repeated = cancellation.cancel("O-17", "C-44");

    assertEquals(CANCELLATION_PENDING, result.status());
    assertEquals(result, repeated);
    assertEquals(1, refundRequests.countFor("C-44"));
}
```

Business-readable helper methods form a small testing language. Keep assertions near the
test and helpers honest; a helper that silently performs half the behavior hides failures.

## Commands, Events, And Outcomes

BDD sharpens language:

- command: `CancelOrder` asks for a change and may be rejected;
- event: `OrderCancellationRequested` states a fact;
- policy: captured payment requires a refund;
- invariant: a shipped order cannot be cancelled;
- outcome: accepted, rejected, pending, or already processed.

Record time, actor/authorization, tenant, idempotency, version, and failure semantics when
they change behavior.

## Specification Layers

| Layer | Best examples |
|---|---|
| domain | decisions, invariants, calculations, state transitions |
| application | orchestration, ports, idempotency, authorization intent |
| adapter/contract | HTTP, database, broker, schema, serialization |
| end-to-end | few critical user journeys and deployment integration |

Do not force all business examples through the slowest UI/system layer. Keep the canonical
rule at the fastest honest layer and add boundary confidence separately.

## Living Documentation

Specifications remain living only if they execute, use current domain language, have clear
ownership, and are reviewed when rules change. Link product decision/rule identifiers when
useful. Delete redundant scenarios and treat ignored tests as visible debt with expiry.

## Common BDD Mistakes

- automation without collaborative discovery;
- implementation jargon in business scenarios;
- one scenario containing multiple unrelated rules;
- examples with no edge, failure, or ambiguity exploration;
- treating pending asynchronous outcome as immediate success;
- duplicating the same rule across many layers;
- assuming a readable sentence proves observability, security, or load behavior.

## Interview Questions

**TDD versus BDD?** TDD is a developer feedback/design loop; BDD extends discovery and
specification around externally meaningful behavior and shared domain language. They work
together.

**Who writes scenarios?** The delivery group collaborates. Product/domain experts own rule
meaning; engineers and testers expose technical and risk boundaries; automation ownership
is shared and explicit.

## Official References

- [JUnit parameterized tests](https://junit.org/junit5/docs/current/user-guide/#writing-tests-parameterized-tests)
- [Spring Modulith application module tests](https://docs.spring.io/spring-modulith/reference/testing.html)

## Recommended Next

Continue with [Spring Test Architecture, Boundaries, And Production Adoption](./TDD-BDD-SPRING-PRODUCTION.md).

