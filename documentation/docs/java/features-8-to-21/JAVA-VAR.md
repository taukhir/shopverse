---
title: Java var
sidebar_position: 3
---

# Java `var`

`var` is local variable type inference introduced in Java 10.

It is not dynamic typing. The compiler infers a static type at compile time.

```java
var orderNumbers = List.of("ORD-1", "ORD-2");
```

The inferred type is still fixed:

```java
var count = 10; // int
// count = "ten"; // compile error
```

## Where `var` Is Allowed

Allowed:

- local variables;
- enhanced for-loop variables;
- try-with-resources variables;
- lambda parameters with annotations.

Not allowed:

- fields;
- method parameters;
- return types;
- uninitialized variables.

## Good Usage

```java
var response = paymentGateway.authorize(request);
var grouped = orders.stream()
        .collect(Collectors.groupingBy(Order::status));
```

Use `var` when the right-hand side makes the type clear.

## Avoid

```java
var data = service.getData();
```

If the type is not obvious, explicit typing is better.

```java
Map<OrderStatus, List<Order>> ordersByStatus = service.getData();
```

## Interview Questions

### Is `var` runtime typing?

No. It is compile-time local type inference.

### Does `var` reduce type safety?

No. The compiler still enforces the inferred type.

### Should every local variable use `var`?

No. Prefer readability over brevity.

