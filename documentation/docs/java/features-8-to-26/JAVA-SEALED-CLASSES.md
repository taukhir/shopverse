---
title: Java Sealed Classes
sidebar_position: 6
---

# Java Sealed Classes

Sealed classes and interfaces restrict which types can extend or implement
them.

```java
public sealed interface PaymentResult
        permits Authorized, Declined, TimedOut {
}

public record Authorized(String reference) implements PaymentResult {
}

public record Declined(String reason) implements PaymentResult {
}

public record TimedOut() implements PaymentResult {
}
```

## Why Use Sealed Types?

Use them when the domain has a known set of variants.

Examples:

- payment result;
- order command;
- SAGA event;
- validation result;
- API error category.

## Permitted Subclasses

A permitted subtype must choose one:

```java
final class CardPayment implements PaymentMethod {
}
```

```java
sealed class WalletPayment implements PaymentMethod
        permits UpiPayment, GiftCardPayment {
}
```

```java
non-sealed class ExternalPayment implements PaymentMethod {
}
```

## Sealed With Switch

```java
String message = switch (result) {
    case Authorized authorized -> "Authorized " + authorized.reference();
    case Declined declined -> "Declined " + declined.reason();
    case TimedOut ignored -> "Payment uncertain";
};
```

The compiler can verify that every known subtype is handled.

## Interview Questions

<ExpandableAnswer title="Why use sealed instead of enum?">

Use enum for fixed constants with similar shape. Use sealed types when each
variant needs different fields or behavior.

</ExpandableAnswer>

<ExpandableAnswer title="Can sealed classes improve maintainability?">

Yes. They make the allowed inheritance model explicit and help exhaustive
switch checks.

</ExpandableAnswer>

<ExpandableAnswer title="Can a sealed hierarchy be extended anywhere?">

Only by permitted classes, subject to package/module rules.

</ExpandableAnswer>

## Runtime And Evolution Depth

Direct permitted subclasses must declare `final`, `sealed`, or `non-sealed`.
In named modules they must reside in the same module; otherwise package rules
apply. Exhaustive pattern switches benefit from the closed hierarchy, but adding
a permitted subtype is a source/behavioral compatibility event that can invalidate
previous exhaustiveness assumptions after recompilation.

## Tricky Interview Questions

<ExpandableAnswer title="Does non-sealed reopen only that branch?">

Yes.

</ExpandableAnswer>

<ExpandableAnswer title="Is a sealed type necessarily abstract?">

No.

</ExpandableAnswer>

<ExpandableAnswer title="Why can adding a subtype break clients?">

Exhaustive handling assumptions change.

</ExpandableAnswer>


## Official References

- [JLS sealed classes](https://docs.oracle.com/javase/specs/jls/se25/html/jls-8.html#jls-8.1.1.2)
