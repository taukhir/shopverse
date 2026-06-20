---
title: Spring Kafka Threads Concurrency And Capacity
---

# Spring Kafka Threads Concurrency And Capacity

Listener threads, concurrency, multithreading, partition counts, and consumer counts.

Back to [Spring Kafka](../SPRING-KAFKA.md).

## Listener Threads

Kafka listeners do not run on Spring Boot's main startup thread. Each running
listener container owns one or more consumer threads and invokes its listener
on those threads.

With default concurrency:

```text
application main thread
  starts Spring
  starts listener containers

listener container thread
  poll -> listener -> offset handling -> poll
```

Multiple `@KafkaListener` endpoints create separate listener containers. Retry
topics also require listener infrastructure. Thread count is therefore based
on listener containers and configured concurrency, not one global application
thread.

The Kafka consumer client is not thread-safe. Spring confines each consumer
instance to its container thread.


## Concurrency And Multithreading

Listener concurrency can be configured on the annotation:

```java
@KafkaListener(
        topics = "orders-topic",
        groupId = "order-processing-group",
        concurrency = "${shopverse.kafka.order-concurrency:3}"
)
public void listenToOrders(String message) {
    process(message);
}
```

Spring creates up to three child consumer containers. Effective parallelism is
limited by the number of assigned partitions:

| Partitions | Consumers in group | Active parallel consumers |
|---:|---:|---:|
| 1 | 3 | 1 |
| 3 | 3 | 3 |
| 6 | 3 | 3 |
| 3 | 6 | 3 |

Across service replicas:

```text
total group consumers = replicas x concurrency
useful consumers <= topic partitions
```

For a topic with six partitions, two replicas with concurrency three can use
all six partitions. Adding more consumers produces idle members unless the
partition count also increases.

Records from one partition remain sequential. Slow processing of one key can
block later records in that partition.

### Should A Listener Use `@Async`?

Usually no:

```java
@Async
@KafkaListener(...)
public void consume(String payload) {
    process(payload);
}
```

Handing work to another executor can let the listener return and commit the
offset before asynchronous work succeeds. It also weakens partition ordering,
retry behavior, MDC context, backpressure, and graceful shutdown.

Use listener concurrency and partitions for Kafka parallelism. If work must be
handed off, design explicit acknowledgment, bounded queues, failure recovery,
context propagation, and shutdown behavior.


## Determining Partition And Consumer Counts

There is no fixed producer-to-consumer ratio. Producers are normally cheap and
can send to all partitions. Consumer capacity depends on processing time and
target throughput.

Estimate one consumer's capacity:

```text
records per second per consumer
    approximately 1000 / average processing time in milliseconds
```

If average processing takes 50 ms, one sequential consumer handles roughly
20 records/second before database, network, and poll overhead.

Estimate required consumers:

```text
required consumers
    = ceiling(target records per second / measured records per consumer)
```

Then choose:

```text
partition count >= required active consumers
```

Also account for peak traffic, key skew, ordering, broker capacity, database
connection limits, downstream rate limits, retry traffic, and desired recovery
time after an outage.

Measure under production-like load. Do not set concurrency higher than the
database connection pool or downstream system can support.








