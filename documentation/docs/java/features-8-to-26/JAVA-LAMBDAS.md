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

## Runtime And Architecture Depth

Lambdas are translated through `invokedynamic` and a bootstrap linkage strategy;
they are not specified as anonymous inner-class instances. Stateless instances
may be reused, so identity and synchronization on a lambda are invalid designs.
Capturing lambdas retain captured objects and can extend request/class-loader
lifetime when stored globally. Target typing can make overloaded lambda calls
ambiguous. Checked exceptions remain constrained by the target SAM signature.

## Tricky Interview Questions

<ExpandableAnswer title="Is a new object guaranteed for every lambda evaluation?">

No.

</ExpandableAnswer>

<ExpandableAnswer title="What does this mean inside a lambda?">

The lexically enclosing instance.

</ExpandableAnswer>

<ExpandableAnswer title="Can a functional interface contain default methods?">

Yes; only abstract methods count toward SAM.

</ExpandableAnswer>


## Official References

- [JLS lambda expressions](https://docs.oracle.com/javase/specs/jls/se25/html/jls-15.html#jls-15.27)
- [`LambdaMetafactory`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/invoke/LambdaMetafactory.html)
