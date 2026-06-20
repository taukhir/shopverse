---
title: Java Switch
sidebar_position: 4
---

# Java Switch Enhancements

Modern Java switch supports expression style, arrow labels, exhaustiveness,
and pattern matching.

## Switch Expression

```java
String label = switch (status) {
    case PENDING -> "Waiting";
    case CONFIRMED -> "Confirmed";
    case CANCELLED -> "Cancelled";
};
```

Switch expressions return a value and avoid accidental fall-through.

## Multiple Labels

```java
boolean terminal = switch (status) {
    case CONFIRMED, CANCELLED, FAILED -> true;
    case PENDING, PROCESSING -> false;
};
```

## `yield`

Use `yield` when a case block needs multiple statements.

```java
String message = switch (status) {
    case FAILED -> {
        log.warn("Order failed orderNumber={}", orderNumber);
        yield "Failed";
    }
    default -> "Active";
};
```

## Pattern Matching For Switch

```java
String result = switch (paymentResult) {
    case Authorized authorized -> "Authorized " + authorized.reference();
    case Declined declined -> "Declined " + declined.reason();
    case TimedOut ignored -> "Uncertain";
};
```

This works especially well with sealed hierarchies.

## Interview Questions

### Switch statement vs switch expression?

A statement performs control flow. An expression returns a value and is usually
exhaustive.

### Why is modern switch safer?

Arrow labels avoid fall-through, and expressions force all cases to be handled.

### When use `default`?

Use `default` for open-ended inputs. For enums or sealed types, avoiding
`default` can let the compiler catch newly added cases.

