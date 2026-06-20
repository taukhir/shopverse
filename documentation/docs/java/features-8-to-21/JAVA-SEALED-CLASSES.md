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

### Why use sealed instead of enum?

Use enum for fixed constants with similar shape. Use sealed types when each
variant needs different fields or behavior.

### Can sealed classes improve maintainability?

Yes. They make the allowed inheritance model explicit and help exhaustive
switch checks.

### Can a sealed hierarchy be extended anywhere?

Only by permitted classes, subject to package/module rules.

