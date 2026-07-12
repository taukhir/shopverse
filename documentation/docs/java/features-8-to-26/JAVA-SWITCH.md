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

## Resolution And Exhaustiveness

Switch expressions must produce a value or complete abruptly on every path.
Arrow rules avoid accidental fall-through; colon groups in expressions use
`yield`. Pattern dominance is compile-time checked, and null handling is explicit
in modern pattern switches. Avoid a `default` for closed enum/sealed models when
you want recompilation to expose new cases.

## Tricky Interview Questions

1. Is `break value` used in switch expressions? No; use `yield` in colon groups.
2. Can a guarded broad pattern precede a narrower dominated pattern? Dominance rules may reject it.
3. Does classic switch accept null safely? It generally throws unless a supported pattern switch handles null explicitly.

## Official References

- [JLS switch](https://docs.oracle.com/javase/specs/jls/se25/html/jls-14.html#jls-14.11)
