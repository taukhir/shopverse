---
title: Domain Polymorphism And Object Contracts
description: Design substitutable Shopverse behaviors and safe Java equality, hashing, identity, and string contracts.
status: "maintained"
last_reviewed: "2026-07-13"
---

# Domain Polymorphism And Object Contracts

Domain polymorphism lets a caller express one business intent while different
implementations fulfill it. The useful unit is a small behavioral contract, not
the mere existence of several classes with a common method name.

## A Provider-Neutral Shopverse Port

Shopverse payment orchestration should depend on an outcome it understands,
while each adapter translates provider-specific requests, errors, and payloads.

```java
public interface PaymentProvider {
    PaymentOutcome authorize(PaymentCommand command);
}

public record PaymentCommand(
        String orderNumber, Money amount, String idempotencyKey) {}

public sealed interface PaymentOutcome permits Authorized, Declined, TimedOut {}
public record Authorized(String reference) implements PaymentOutcome {}
public record Declined(String reason) implements PaymentOutcome {}
public record TimedOut(Duration retryAfter) implements PaymentOutcome {}
```

```mermaid
flowchart LR
  service["PaymentService"] -->|"authorize(command)"| port["PaymentProvider"]
  port <|.. stub["Stub adapter"]
  port <|.. bank["Bank adapter"]
  stub --> outcome["PaymentOutcome"]
  bank --> outcome
  outcome --> decision["Persist state and publish domain event"]
```

The service does not ask `instanceof StubPaymentProvider` or switch on provider
names. A new adapter is useful only if it preserves the same input, outcome,
idempotency, and failure promises.

## Specify Behavior, Not Just A Signature

A Java interface states types. The domain contract must also state semantics:

| Concern | Example `PaymentProvider` promise |
|---|---|
| precondition | amount and order number are already validated |
| success | `Authorized` contains a nonblank provider reference |
| business refusal | return `Declined`; do not throw for an ordinary decline |
| uncertainty | return `TimedOut` so reconciliation can continue |
| idempotency | retrying the same key must not create a second charge |
| side effects | provider I/O occurs, but Shopverse persistence remains the caller's responsibility |

Tests should run the same contract suite against every adapter. Adapter-specific
tests can then cover translation and authentication details.

```java
abstract class PaymentProviderContract {
    protected abstract PaymentProvider provider();

    @Test
    void declineIsADomainOutcome() {
        PaymentOutcome result = provider().authorize(declinedCommand());
        assertInstanceOf(Declined.class, result);
    }
}
```

For compile-time overload selection, runtime override dispatch, and method
hiding rules, use the dedicated
[overloading](../JAVA-OVERLOADING-RESOLUTION-DEEP-DIVE.md) and
[overriding](../JAVA-OVERRIDING-HIDING-DEEP-DIVE.md) pages.

## Object Contracts Are Also Polymorphic Contracts

Collections and callers invoke methods inherited from `Object`. Their behavior
must remain valid for every instance, including through a base reference.

### Equality And Hashing

`equals` must be reflexive, symmetric, transitive, consistent, and false for
`null`. Whenever two objects are equal, their hash codes must also be equal.
Unequal objects may share a hash code.

An immutable Shopverse identifier is a natural value object:

```java
public record OrderNumber(String value) {
    public OrderNumber {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("order number is required");
        }
        value = value.trim();
    }
}
```

Records derive equality and hashing from all components. Keep those components
immutable; changing hash-relevant state after insertion can make a key
unreachable in `HashMap` or `HashSet`.

### Values Versus Entities

| Kind | Identity rule | Good candidate |
|---|---|---|
| value object | all normalized components | `OrderNumber`, `Money`, address snapshot |
| persisted entity | stable domain identifier, chosen deliberately | order or payment aggregate |
| event/data carrier | all immutable components when value semantics are intended | `PaymentCompletedEvent` record |

Database-generated entity IDs complicate equality because they are absent
before persistence, and ORM proxies complicate exact-class checks. Do not add a
generic Lombok-generated `equals`/`hashCode` to every entity. Choose and test a
service-wide entity policy, and never include mutable associations or status in
hashing.

### `toString` And Defensive Exposure

`toString` should help diagnostics without leaking credentials, tokens,
addresses, or payment data. Avoid traversing bidirectional entity relationships,
which can recurse or initialize large lazy graphs. Redaction is part of the
contract, not merely a logging preference.

Object contracts extend beyond the three `Object` methods:

- return immutable copies or unmodifiable views for owned collections;
- normalize values at construction so equal values stay equal;
- document ordering when `Comparable` is inconsistent with `equals`;
- avoid using mutable entities as map keys or set members.

## The Inheritance Equality Trap

Adding identity-bearing state in subclasses often breaks symmetry or
transitivity. If a `PromotionalOrderNumber` sometimes compares equal to an
`OrderNumber` while the base type knows nothing about the promotion, equality
becomes fragile. Prefer one final value type plus composed metadata. Records are
final, which makes that safe choice natural.

## Review Checklist

- Can the caller remain unaware of the concrete implementation?
- Are business refusals modeled separately from technical failures?
- Does every implementation preserve idempotency and side-effect expectations?
- Are values immutable and normalized at their boundary?
- Do equal objects always have equal hashes throughout their usable lifetime?
- Is entity identity stable before and after persistence?
- Can diagnostic strings expose secrets or traverse an object graph?

## Related Deep Dives

- [Composition, Ownership And Inheritance](./OOP-COMPOSITION-INHERITANCE.md)
- [Hash Collections Deep Dive](../JAVA-HASH-COLLECTIONS-DEEP-DIVE.md)
- [Objects, Strings And Garbage Collection](../JAVA-OBJECTS-STRINGS-GC.md)

