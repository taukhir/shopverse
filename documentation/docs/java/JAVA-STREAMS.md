---
title: Java Streams
sidebar_position: 3
status: maintained
last_reviewed: "2026-07-13"
page_type: Guide
difficulty: Intermediate
prerequisites: [Java collections, generics, lambdas, and functional interfaces]
learning_objectives: [Build lazy side-effect-controlled pipelines, Select map flatMap collect and reduce correctly, Evaluate parallel stream safety and cost]
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Java Streams

A Stream describes a lazy pipeline over a data source. It is not a collection
and normally does not store elements.
It exists to express filtering, transformation, grouping, and reduction as a
composable traversal while allowing the library to control evaluation. After
this page, you should be able to predict execution, avoid unsafe side effects,
and decide whether sequential, parallel, or non-stream code fits the workload.

## Page Overview

A Java Stream is a single-use description of aggregate computation over a source.
This guide covers pipeline construction, laziness, traversal, flattening,
collectors, reduction, optional results, parallel execution, side effects, and
the cases where a loop, executor, or virtual thread is clearer.

## Core Terminology And Prerequisites

Know collections, generics, lambdas, and functional interfaces. A **source**
provides elements, an **intermediate operation** transforms a lazy pipeline, a
**terminal operation** triggers traversal, and **encounter order** constrains the
order in which results must be observed.

## Mental Model

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

## How It Works: Pipeline

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

## Boundaries, Trade-Offs, And Edge Cases

- infinite streams require short-circuiting or an explicit bound;
- stateful operations such as `sorted` and `distinct` may buffer substantial data;
- null elements interact poorly with `Optional`-returning terminals;
- non-associative reduction can change results under parallel grouping;
- ordered parallel pipelines may sacrifice throughput to preserve encounter order;
- checked exceptions and blocking I/O usually need an explicit boundary rather
  than being hidden inside lambdas.

## Lead-Engineer Production Guidance

Review pipeline complexity, allocation, boxing, ordering, source splittability,
side effects, context propagation, and downstream capacity. Require representative
JMH or service-level evidence before parallelization; the common pool is shared
process capacity, not free concurrency.

## Tricky Interview Questions

### Stream Versus Collection

A collection stores data. A stream represents a one-use computation over a
source.

### `map` Versus `flatMap`

`map` transforms one element into one result. `flatMap` transforms one element
into zero or more results and flattens them.

<ExpandableAnswer title="Are Streams Always Lazy?">

Intermediate operations are lazy; terminal operations trigger processing.
Some stateful operations such as sorting may buffer elements.

</ExpandableAnswer>

### `findFirst` Versus `findAny`

`findFirst` preserves encounter-order semantics. `findAny` permits any element
and may be more flexible for parallel pipelines.

<ExpandableAnswer title="Why Must Reduce Be Associative?">

Parallel execution groups elements differently. Non-associative accumulation
can produce different answers.

</ExpandableAnswer>

## Practices

- keep lambdas small and side-effect free;
- use method references when they improve readability;
- avoid streams for complex branching or exception-heavy workflows;
- do not hide expensive remote calls inside `map`;
- use primitive streams to reduce boxing for numerical workloads;
- benchmark before selecting parallel streams.

## Official References

- [Stream package specification](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/stream/package-summary.html)

## Recommended Next

Continue with [Stream Pipeline Internals](./JAVA-STREAM-PIPELINE-INTERNALS.md) and
[Parallel Stream Internals](./JAVA-PARALLEL-STREAM-INTERNALS.md).
