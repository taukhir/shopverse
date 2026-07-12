---
title: Java Functional Interfaces
sidebar_position: 5
---

# Java Functional Interfaces

A functional interface has exactly one abstract method. Lambdas and method
references are instances of functional interfaces.

```java
@FunctionalInterface
interface DiscountRule {
    BigDecimal apply(BigDecimal amount);
}

DiscountRule tenPercentOff =
        amount -> amount.multiply(new BigDecimal("0.90"));
```

`@FunctionalInterface` is optional, but recommended. It lets the compiler
protect the one-abstract-method contract.

## Common Built-In Interfaces

| Interface | Method | Example use |
|---|---|---|
| `Predicate<T>` | `boolean test(T value)` | validation/filtering |
| `Function<T, R>` | `R apply(T value)` | mapping |
| `Consumer<T>` | `void accept(T value)` | side effect |
| `Supplier<T>` | `T get()` | lazy creation |
| `BiFunction<T, U, R>` | `R apply(T left, U right)` | combine two values |
| `UnaryOperator<T>` | `T apply(T value)` | transform same type |
| `BinaryOperator<T>` | `T apply(T left, T right)` | combine same type |

## Predicate

```java
Predicate<Order> paidOrder =
        order -> order.status() == OrderStatus.PAID;

List<Order> paid = orders.stream()
        .filter(paidOrder)
        .toList();
```

Predicates can be composed:

```java
Predicate<Order> largeOrder =
        order -> order.total().compareTo(new BigDecimal("1000")) > 0;

Predicate<Order> paidLargeOrder = paidOrder.and(largeOrder);
```

## Function

```java
Function<Order, String> orderNumber = Order::orderNumber;

List<String> numbers = orders.stream()
        .map(orderNumber)
        .toList();
```

Function composition:

```java
Function<Order, BigDecimal> total = Order::totalAmount;
Function<BigDecimal, String> moneyLabel = amount -> "INR " + amount;

Function<Order, String> orderTotalLabel = total.andThen(moneyLabel);
```

## Supplier

```java
Order order = repository.findById(id)
        .orElseThrow(() -> new OrderNotFoundException(id));
```

The exception object is created only when the optional is empty.

## Consumer

```java
Consumer<Order> audit = order ->
        log.info("Order audited orderNumber={}", order.orderNumber());

orders.forEach(audit);
```

Use consumers carefully. They are side-effect oriented.

## BiFunction And Operators

```java
BiFunction<BigDecimal, BigDecimal, BigDecimal> addTax =
        (amount, tax) -> amount.add(tax);

BinaryOperator<BigDecimal> maxAmount = BigDecimal::max;

UnaryOperator<String> normalizeUsername =
        username -> username.trim().toLowerCase(Locale.ROOT);
```

Use `UnaryOperator<T>` when input and output are the same type. Use
`BinaryOperator<T>` when both inputs and the output are the same type.

## Custom Functional Interface

Create a custom interface when the domain name is clearer than a generic
`Function`.

```java
@FunctionalInterface
interface PaymentRiskRule {
    RiskDecision evaluate(PaymentAttempt attempt);
}
```

This reads better than `Function<PaymentAttempt, RiskDecision>` when the
concept is important in the domain.

## Method References

```java
orders.stream()
        .map(Order::orderNumber)
        .toList();
```

Common forms:

| Form | Example |
|---|---|
| static method | `BigDecimal::valueOf` |
| instance method of object | `validator::isValid` |
| instance method of type | `Order::orderNumber` |
| constructor | `OrderResponse::new` |

## Tricky Interview Questions

### Can a functional interface have default methods?

Yes. It can have many default/static methods, but only one abstract method.

### Lambda vs anonymous class?

A lambda is concise and does not create a new named class in source. `this`
inside a lambda refers to the enclosing instance. `this` inside an anonymous
class refers to the anonymous class instance.

### Why prefer standard functional interfaces?

They are widely understood and compose well with the Java library. Create a
custom interface only when the domain name improves clarity.

### Is a lambda always better?

No. If logic is long, branching-heavy, or reused in many places, a named method
or class is clearer.

## Official References

- [`java.util.function`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/function/package-summary.html)
- [JLS functional interfaces](https://docs.oracle.com/javase/specs/jls/se25/html/jls-9.html#jls-9.8)
