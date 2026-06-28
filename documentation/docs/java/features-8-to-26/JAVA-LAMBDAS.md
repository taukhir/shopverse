---
title: Java Lambdas
---

# Java Lambdas

Lambda expressions provide concise implementations of functional interfaces.

```java
Predicate<Order> paid = order -> order.status() == OrderStatus.PAID;
```

The target type must be a functional interface: an interface with exactly one
abstract method.

## Before And After

Before Java 8:

```java
Comparator<Order> byCreatedAt = new Comparator<>() {
    public int compare(Order left, Order right) {
        return left.createdAt().compareTo(right.createdAt());
    }
};
```

With lambda:

```java
Comparator<Order> byCreatedAt =
        (left, right) -> left.createdAt().compareTo(right.createdAt());
```

With method reference:

```java
Comparator<Order> byCreatedAt = Comparator.comparing(Order::createdAt);
```

## Lambda Forms

```java
Runnable task = () -> audit();
Consumer<String> logger = value -> log.info(value);
Function<Order, String> orderNumber = Order::orderNumber;
BiFunction<Integer, Integer, Integer> add = Integer::sum;
```

## Effectively Final Variables

Lambdas can capture local variables only if they are final or effectively
final:

```java
String prefix = "ORD-";
orders.stream().map(order -> prefix + order.id()).toList();
```

Do not mutate captured local state inside stream pipelines. Prefer collectors
or immutable transformations.

## When To Use

| Use lambda for | Avoid lambda when |
|---|---|
| simple behavior passed to another method | logic spans many lines |
| stream predicates/transforms | debugging requires many breakpoints |
| callbacks and event handlers | checked exceptions dominate the code |
| strategy registration | object state/lifecycle is complex |
