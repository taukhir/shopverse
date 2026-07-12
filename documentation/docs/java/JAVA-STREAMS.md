---
title: Java Streams
sidebar_position: 3
---

# Java Streams

A Stream describes a lazy pipeline over a data source. It is not a collection
and normally does not store elements.

Streams are built on functional interfaces such as `Predicate`, `Function`,
`Consumer`, and `Supplier`. See
[Java Functional Interfaces](JAVA-FUNCTIONAL-INTERFACES.md).

```java
List<String> paidOrders = orders.stream()
        .filter(order -> order.status() == OrderStatus.PAID)
        .sorted(Comparator.comparing(Order::createdAt).reversed())
        .map(Order::orderNumber)
        .toList();
```

## Pipeline

```text
source -> intermediate operations -> terminal operation
```

Intermediate operations such as `filter` and `map` are lazy. A terminal
operation such as `toList`, `reduce`, or `count` starts traversal.

## Important Operations

| Operation | Purpose |
|---|---|
| `filter` | retain matching elements |
| `map` | one-to-one transformation |
| `flatMap` | flatten nested values/streams |
| `distinct` | remove duplicates using equality |
| `sorted` | order elements |
| `limit` / `skip` | bounded traversal |
| `peek` | observe pipeline, mainly debugging |
| `toList` / `collect` | materialize a result |
| `reduce` | combine into one value |
| `anyMatch` / `allMatch` | short-circuit predicates |
| `findFirst` / `findAny` | retrieve an element |

## Stream Lifecycle

```text
collection / array / generator
  -> stream source
  -> intermediate operation
  -> intermediate operation
  -> terminal operation
  -> result
```

Nothing runs until the terminal operation starts traversal.

```java
Stream<Order> pipeline = orders.stream()
        .filter(order -> {
            log.info("Filtering {}", order.orderNumber());
            return order.status() == OrderStatus.PAID;
        });

// No log yet.
long count = pipeline.count(); // traversal starts here
```

## Map Versus FlatMap

```java
List<List<OrderLine>> nested = orders.stream()
        .map(Order::lines)
        .toList();

List<OrderLine> flattened = orders.stream()
        .flatMap(order -> order.lines().stream())
        .toList();
```

## Collectors

```java
Map<OrderStatus, List<Order>> byStatus = orders.stream()
        .collect(Collectors.groupingBy(Order::status));

Map<String, BigDecimal> totalByCustomer = orders.stream()
        .collect(Collectors.groupingBy(
                Order::customerUsername,
                Collectors.reducing(
                        BigDecimal.ZERO,
                        Order::total,
                        BigDecimal::add
                )
        ));
```

Handle duplicate map keys explicitly:

```java
Map<String, Order> latestByCustomer = orders.stream()
        .collect(Collectors.toMap(
                Order::customerUsername,
                Function.identity(),
                BinaryOperator.maxBy(Comparator.comparing(Order::createdAt))
        ));
```

## Reduce

```java
BigDecimal total = orders.stream()
        .map(Order::total)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
```

The identity must be neutral and the accumulator associative, especially for
parallel execution.

## Optional With Streams

```java
Order latest = orders.stream()
        .max(Comparator.comparing(Order::createdAt))
        .orElseThrow(() -> new OrderNotFoundException("No orders"));
```

Avoid `optional.get()` without a presence guarantee.

## Parallel Streams

```java
long count = values.parallelStream()
        .filter(this::cpuIntensivePredicate)
        .count();
```

Parallel streams use the common ForkJoinPool by default. Avoid them for:

- blocking database/HTTP calls;
- request paths needing predictable resource isolation;
- small collections;
- ordered stateful operations;
- code mutating shared state;
- work requiring MDC/security context propagation.

Use a controlled executor or virtual threads for blocking tasks.

## Common Mistakes

```java
List<String> result = new ArrayList<>();
orders.parallelStream().forEach(order -> result.add(order.orderNumber()));
```

This has unsafe shared mutation. Return values through the pipeline:

```java
List<String> result = orders.parallelStream()
        .map(Order::orderNumber)
        .toList();
```

Do not reuse a stream after a terminal operation.

## Interview And Tricky Questions

### Stream Versus Collection

A collection stores data. A stream represents a one-use computation over a
source.

### `map` Versus `flatMap`

`map` transforms one element into one result. `flatMap` transforms one element
into zero or more results and flattens them.

### Are Streams Always Lazy?

Intermediate operations are lazy; terminal operations trigger processing.
Some stateful operations such as sorting may buffer elements.

### `findFirst` Versus `findAny`

`findFirst` preserves encounter-order semantics. `findAny` permits any element
and may be more flexible for parallel pipelines.

### Why Must Reduce Be Associative?

Parallel execution groups elements differently. Non-associative accumulation
can produce different answers.

## Practices

- keep lambdas small and side-effect free;
- use method references when they improve readability;
- avoid streams for complex branching or exception-heavy workflows;
- do not hide expensive remote calls inside `map`;
- use primitive streams to reduce boxing for numerical workloads;
- benchmark before selecting parallel streams.

## Official References

- [Stream package specification](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/stream/package-summary.html)
