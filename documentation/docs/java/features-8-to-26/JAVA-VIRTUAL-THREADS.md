---
title: Java Virtual Threads
sidebar_position: 7
status: "maintained"
last_reviewed: "2026-07-13"
---

# Java Virtual Threads

Virtual threads are lightweight JVM-managed threads introduced as a stable
feature in Java 21.

They make thread-per-task style practical for high-concurrency blocking I/O.

## Platform Threads vs Virtual Threads

| Platform thread | Virtual thread |
|---|---|
| OS-backed | JVM-managed |
| relatively expensive | lightweight |
| usually pooled | usually created per task |
| blocking occupies OS thread | blocking usually parks virtual thread |
| good for CPU pools | strong fit for blocking I/O |

## Example

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    Future<User> user = executor.submit(() -> userClient.getUser(userId));
    Future<List<Order>> orders =
            executor.submit(() -> orderClient.getOrders(userId));

    UserDashboard dashboard = new UserDashboard(user.get(), orders.get());
}
```

## What Virtual Threads Solve

Traditional blocking servers need large platform-thread pools to handle many
concurrent waiting requests. Virtual threads make waiting cheaper.

Good fit:

- HTTP calls;
- JDBC calls;
- file I/O;
- simple blocking request handling.

Poor fit:

- CPU-heavy work;
- unbounded downstream calls;
- workloads with limited database connection pools;
- code that relies heavily on thread-local assumptions without cleanup.

## Capacity Still Matters

Virtual threads do not increase:

- database connections;
- Kafka broker capacity;
- downstream API quotas;
- CPU cores;
- memory budget.

You still need:

- connection pools;
- rate limits;
- bulkheads;
- timeouts;
- backpressure.

## Spring Boot Note

Spring Boot can use virtual threads for request handling when enabled by
configuration in supported versions.

```yaml
spring:
  threads:
    virtual:
      enabled: true
```

Validate with load tests before enabling in production.

## Interview Questions

<ExpandableAnswer title="Are virtual threads faster than platform threads?">

They are cheaper to create and block. They do not make CPU work faster.

</ExpandableAnswer>

<ExpandableAnswer title="Should virtual threads be pooled?">

Usually no. Create virtual threads per task. Pool scarce resources like
database connections, not virtual threads.

</ExpandableAnswer>

<ExpandableAnswer title="Do ThreadLocal values work with virtual threads?">

They work, but careless use can still leak memory or context. Prefer scoped
context and explicit cleanup.

</ExpandableAnswer>

<ExpandableAnswer title="Do virtual threads replace reactive programming?">

Not completely. They simplify many blocking I/O services. Reactive still helps
for streaming, event-driven, and non-blocking pipelines.

</ExpandableAnswer>

## Architect-Level Continuation

For continuation mounting, carrier scheduling, parking, version-specific pinning,
scoped values, structured task lifecycles, Spring/JDBC limits and JFR diagnostics,
use [Virtual Threads And Structured Concurrency](../JAVA-VIRTUAL-STRUCTURED-CONCURRENCY.md).

## Official References

- [JEP 444: Virtual Threads](https://openjdk.org/jeps/444)
- [`Thread` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Thread.html)
