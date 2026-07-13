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

<ExpandableAnswer title="Is var runtime typing?">

No. It is compile-time local type inference.

</ExpandableAnswer>

<ExpandableAnswer title="Does var reduce type safety?">

No. The compiler still enforces the inferred type.

</ExpandableAnswer>

<ExpandableAnswer title="Should every local variable use var?">

No. Prefer readability over brevity.

</ExpandableAnswer>

## Inference Boundaries

`var` is permitted only for initialized local variables, loop variables and
lambda parameters in supported syntax. It cannot describe fields, return types,
method parameters or a null-only initializer. Inference captures the initializer's
static type, which can expose an implementation type or intersection/capture that
is awkward to communicate. Use an explicit interface type when abstraction is
part of the design.

## Tricky Interview Questions

<ExpandableAnswer title="Is var value = null legal?">

No; no type can be inferred.

</ExpandableAnswer>

<ExpandableAnswer title="Does var use runtime type?">

No; inference is compile-time.

</ExpandableAnswer>

<ExpandableAnswer title="Can var change overload resolution?">

The initializer is resolved first; later calls use the inferred static type.

</ExpandableAnswer>


## Official References

- [JLS local variable type inference](https://docs.oracle.com/javase/specs/jls/se25/html/jls-14.html#jls-14.4)
