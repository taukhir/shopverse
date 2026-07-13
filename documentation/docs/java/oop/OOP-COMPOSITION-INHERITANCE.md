---
title: Composition, Ownership And Inheritance
description: Model Java relationships, aggregate lifecycles, composition, inheritance, and substitutability with Shopverse examples.
---

# Composition, Ownership And Inheritance

Choose a relationship from domain meaning. Ask who owns the lifecycle and
invariant before asking which Java syntax is convenient.

## Relationship Vocabulary

| Relationship | Meaning | Lifecycle | Typical Java shape |
|---|---|---|---|
| association | one object temporarily knows or uses another | independent | parameter, lookup, or injected reference |
| aggregation | a whole groups independently meaningful parts | independent or shared | collection of references |
| composition | a whole owns parts needed to preserve its invariant | controlled by the whole | private fields plus creation/removal methods |
| inheritance | a subtype promises it can stand in for a base type | not an ownership relationship | `extends` or `implements` |

Association, aggregation, and composition are design meanings, not different
Java keywords. Persistence annotations can reinforce ownership, but do not
decide the domain relationship by themselves.

## Shopverse Relationship Map

```mermaid
flowchart LR
  checkout["Checkout service"] -. "uses" .-> provider["PaymentProvider"]
  catalog["Catalog"] -->|"groups"| product["Product"]
  order["Order"] -->|"owns lifecycle"| line["OrderLine"]
  line -. "snapshots price/name" .-> product
  provider <|.. stub["StubPaymentProvider"]
  provider <|.. external["External provider adapter"]
```

- Checkout and a payment provider are associated collaborators; neither owns
  the other's lifecycle.
- A catalog aggregates products that remain meaningful independently.
- An order composes lines because adding or removing a line changes the order's
  total and invariant.
- Provider implementations inherit a contract, not state from one another.

## Put Owned State Behind The Owner

An aggregate should create its parts and expose read-only views. This keeps
derived state synchronized and prevents callers from assembling an invalid
order.

```java
public final class Order {
    private final List<OrderLine> lines = new ArrayList<>();
    private BigDecimal total = BigDecimal.ZERO;

    public void addItem(ProductSnapshot product, int quantity) {
        if (quantity <= 0) throw new IllegalArgumentException("quantity");
        var line = new OrderLine(
                product.id(), product.name(), quantity, product.price());
        lines.add(line);
        total = total.add(line.subtotal());
    }

    public List<OrderLine> lines() {
        return List.copyOf(lines);
    }
}

public record OrderLine(
        long productId, String productName, int quantity, BigDecimal unitPrice) {
    public BigDecimal subtotal() {
        return unitPrice.multiply(BigDecimal.valueOf(quantity));
    }
}
```

The line stores a checkout snapshot: a later catalog price change must not
rewrite the accepted order. In a JPA model, `cascade = ALL` and
`orphanRemoval = true` can implement this lifecycle, while an `Order.addItem`
method still protects the domain invariant.

## Favor Composition For Pluggable Work

Composition makes dependencies explicit and lets a service receive a focused
collaborator without inheriting its state or lifecycle.

```java
public final class PaymentApplicationService {
    private final PaymentProvider provider;
    private final PaymentRepository payments;

    public PaymentApplicationService(
            PaymentProvider provider, PaymentRepository payments) {
        this.provider = provider;
        this.payments = payments;
    }
}
```

Changing the provider does not create a new kind of application service. It
changes one collaborator. This is a stronger model than subclasses such as
`StripePaymentService` and `StubPaymentService` that inherit orchestration only
to replace one step.

## When Inheritance Is Honest

Inheritance is appropriate when all of these are true:

- the subtype has a stable **is-a** meaning;
- callers can use it wherever the base type is accepted;
- base invariants and postconditions remain true;
- the hierarchy is more important than implementation reuse;
- evolution of the base contract will not force meaningless behavior on a
  subtype.

A sealed destination family is a useful closed domain taxonomy:

```java
public sealed interface DeliveryDestination
        permits ShippingAddress, PickupLocation {}

public record ShippingAddress(
        String line1, String city, String postalCode)
        implements DeliveryDestination {}

public record PickupLocation(String storeCode)
        implements DeliveryDestination {}
```

Framework inheritance can also be pragmatic. Shopverse JPA entities may extend
a `BaseAuditableEntity` because the framework treats audit fields uniformly.
Keep such a mapped superclass thin; do not turn it into a universal domain base
class with unrelated business behavior.

## Substitutability Before Reuse

The Liskov substitution test is behavioral: would existing caller reasoning
remain correct for every subtype?

| Contract dimension | A subtype must not |
|---|---|
| accepted inputs | reject inputs the base contract promises to accept |
| results | return values outside the promised meaning |
| state | violate invariants visible through the base API |
| side effects | add surprising persistence, network, or timing behavior |
| failures | turn a normal outcome into an undocumented exception |

If a discounted order subtype refuses ordinary items or changes cancellation
semantics, it is not safely substitutable. A `DiscountPolicy` composed into an
ordinary order makes the variation explicit instead.

## Design Review Questions

1. Does the relationship express use, membership, lifecycle ownership, or
   substitutability?
2. Can a part move to another owner without changing identity?
3. Can callers mutate a composed collection around the owning invariant?
4. Would a strategy or port express the variation more directly than a
   subclass?
5. Does every subtype honor the base type's inputs, outcomes, and side effects?

## Related Deep Dives

- [Domain Polymorphism And Object Contracts](./OOP-DOMAIN-POLYMORPHISM-OBJECT-CONTRACTS.md)
- [Abstract Classes, Interfaces And Functional Java](../JAVA-ABSTRACTION-INTERFACES.md)
- [Overriding And Hiding](../JAVA-OVERRIDING-HIDING-DEEP-DIVE.md)
