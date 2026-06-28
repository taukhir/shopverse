---
title: Java 8 To 26 Features
sidebar_position: 4
---

# Important Java Features From 8 To 26

:::info
This page is kept as a compact legacy overview. The expanded notes now live in
the [Java 8 To 26 feature section](features-8-to-26/JAVA-8-TO-26.md), with
dedicated pages for Optional, `var`, switch, records, sealed classes, and
virtual threads.
:::

This page focuses on production-relevant language and runtime features rather
than listing every JEP.

## Java 8

### Lambda And Functional Interface

```java
@FunctionalInterface
interface PricingRule {
    BigDecimal apply(BigDecimal amount);
}

PricingRule discount = amount -> amount.multiply(new BigDecimal("0.90"));
```

A functional interface has one abstract method. Default/static methods do not
break that rule.

### Method Reference

```java
orders.stream().map(Order::orderNumber).toList();
```

Forms include `Type::staticMethod`, `instance::method`,
`Type::instanceMethod`, and `Type::new`.

### Optional

```java
return repository.findById(id)
        .map(mapper::toResponse)
        .orElseThrow(() -> new OrderNotFoundException(id));
```

Use Optional mainly as a return type, not for entity fields, parameters, or
every nullable local variable.

### Streams, Date/Time, CompletableFuture

Java 8 introduced Streams, `java.time`, and `CompletableFuture`, each covered
in dedicated sections/pages.

## Java 9 To 11

- module system (`module-info.java`);
- collection factories: `List.of`, `Set.of`, `Map.of`;
- private interface methods;
- local variable `var` in Java 10;
- standard HTTP Client in Java 11;
- useful String methods and `Files.readString`.

```java
var orderNumbers = List.of("ORD-1", "ORD-2");
```

`var` is local type inference, not dynamic typing. Avoid it when the inferred
type or intent is unclear.

## Java 12 To 15

### Switch Expressions

```java
String label = switch (status) {
    case PENDING -> "Waiting";
    case CONFIRMED -> "Complete";
    case FAILED, COMPENSATED -> "Attention";
};
```

Switch expressions are exhaustive and return a value.

### Text Blocks

```java
String json = """
        {
          "orderNumber": "ORD-1001"
        }
        """;
```

## Java 16

### Records

```java
public record OrderResponse(
        long id,
        String orderNumber,
        BigDecimal total
) {
    public OrderResponse {
        Objects.requireNonNull(orderNumber);
        if (total.signum() < 0) {
            throw new IllegalArgumentException("Negative total");
        }
    }
}
```

Records are transparent immutable data carriers with generated accessors,
constructor, equality, hash code, and `toString`. Their referenced objects can
still be mutable.

### Pattern Matching For `instanceof`

```java
if (result instanceof Declined declined) {
    log.warn("Payment declined reason={}", declined.reason());
}
```

## Java 17

### Sealed Types

```java
public sealed interface PaymentResult
        permits Authorized, Declined, TimedOut {
}
```

Sealed hierarchies control permitted subtypes and work well with exhaustive
pattern matching.

Java 17 is an LTS release.

## Java 21

### Virtual Threads

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    Future<User> user = executor.submit(() -> userClient.getUser(id));
    Future<List<Order>> orders =
            executor.submit(() -> orderClient.getOrders(id));
}
```

Virtual threads make thread-per-request practical for blocking I/O. They do
not increase database connections, downstream quotas, CPU, or memory without
limit. Keep connection pools, bulkheads, and admission control.

### Pattern Matching For Switch

```java
String message = switch (result) {
    case Authorized authorized ->
            "Authorized " + authorized.reference();
    case Declined declined ->
            "Declined: " + declined.reason();
    case TimedOut ignored ->
            "Payment status uncertain";
};
```

### Sequenced Collections

`SequencedCollection`, `SequencedSet`, and `SequencedMap` standardize first,
last, and reversed encounter-order operations.

```java
String newest = orderNumbers.getLast();
List<String> reverseView = orderNumbers.reversed();
```

## Version Summary

| Version | Important examples |
|---|---|
| 8 | lambdas, streams, Optional, `java.time`, CompletableFuture |
| 9 | modules, collection factories |
| 10 | `var` |
| 11 LTS | HTTP Client, String/File APIs |
| 14 | switch expressions |
| 15 | text blocks |
| 16 | records, `instanceof` patterns |
| 17 LTS | sealed classes |
| 21 LTS | virtual threads, switch patterns, sequenced collections |
| 22 | unnamed variables and patterns, foreign function and memory API |
| 23 | Markdown documentation comments, primitive patterns preview |
| 24 | stream gatherers, class-file API |
| 25 | scoped values final, compact source files preview |
| 26 | primitive pattern matching and newer preview/incubator work |

## Interview And Tricky Questions

### Is `var` Dynamic Typing?

No. The compiler infers one static type at compile time.

### Are Records Immutable?

Record components are final references. Deep immutability depends on the
component types.

### Do Virtual Threads Make Code Non-Blocking?

No. They allow blocking style with cheap parked threads. The I/O operation can
still be blocking and the dependency remains capacity constrained.

### Optional `orElse` Versus `orElseGet`

`orElse` evaluates its argument eagerly. `orElseGet` invokes the supplier only
when empty.

### Can A Sealed Type Be Extended Anywhere?

Only by explicitly permitted types, subject to Java's module/package rules.

## Practices

- target a supported LTS;
- use features to clarify domain intent;
- do not convert every class to a record;
- benchmark virtual-thread workloads with real pools and dependencies;
- keep switch expressions exhaustive;
- avoid Optional abuse and unreadable stream chains.
