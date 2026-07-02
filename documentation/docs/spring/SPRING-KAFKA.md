---
title: Spring Kafka
---

# Spring Kafka

Spring Kafka material is split into focused pages for publishing, consuming, concurrency, retries/DLT, idempotency, operations, and event design.

## Shopverse Implementation Path

After reading the generic Kafka pages, use these Shopverse pages to see the
same ideas applied in code:

| Concept | Shopverse page |
|---|---|
| Shared listener JSON parsing | [Kafka Event Parsing](../platform/KAFKA-PARSING.md) |
| Failed event persistence and replay | [Kafka Recovery Starter](../platform/KAFKA-RECOVERY-STARTER.md) |
| Outbox-backed event publication | [Outbox Starter](../platform/OUTBOX-STARTER.md) |
| Kafka idempotency and runtime failures | [Runtime Reliability Problems](../reliability/problems/RUNTIME-RELIABILITY-PROBLEMS.md) |
| Replay and DLT operational behavior | [Outbox Runtime Problems](../reliability/problems/OUTBOX-RUNTIME-PROBLEMS.md) |

Keep the boundary clear: Kafka infrastructure helpers can be shared, but event
payload records such as order, payment, or inventory events stay service-owned.

## Focused Pages

| Page | Covers |
|---|---|
| [Spring Kafka Basics And Event Flow](kafka/SPRING-KAFKA-BASICS.md) | Dependencies, Kafka concepts used by Spring, Shopverse event flow, KafkaTemplate publishing, and pull-model behavior. |
| [Spring Kafka Consumers And Delivery Semantics](kafka/SPRING-KAFKA-CONSUMERS.md) | Kafka listeners, consumer groups, acknowledgments, delivery semantics, and Spring Kafka transactions. |
| [Spring Kafka Threads Concurrency And Capacity](kafka/SPRING-KAFKA-CONCURRENCY-CAPACITY.md) | Listener threads, concurrency, multithreading, partition counts, and consumer counts. |
| [Spring Kafka Retry DLT And Recovery](kafka/SPRING-KAFKA-RETRY-DLT-RECOVERY.md) | Retry topics, DLT handlers, poison-event recovery guarantees, and replaying failed events. |
| [Spring Kafka Idempotency And Operations](kafka/SPRING-KAFKA-IDEMPOTENCY-OPERATIONS.md) | Idempotent consumers, message-loss checks, consumer lag, slow consumers, commands, observability, event design, and production checklist. |

## Compatibility Anchors

The original long page was split into focused pages. These headings are kept so older links have a stable landing point.

## Dependencies

Moved to [Spring Kafka Basics And Event Flow](kafka/SPRING-KAFKA-BASICS.md).

## Kafka Concepts Used By Spring

Moved to [Spring Kafka Basics And Event Flow](kafka/SPRING-KAFKA-BASICS.md).

## Shopverse Event Flow

Moved to [Spring Kafka Basics And Event Flow](kafka/SPRING-KAFKA-BASICS.md).

## Publishing With `KafkaTemplate`

Moved to [Spring Kafka Basics And Event Flow](kafka/SPRING-KAFKA-BASICS.md).

## Kafka Uses A Pull Model

Moved to [Spring Kafka Basics And Event Flow](kafka/SPRING-KAFKA-BASICS.md).

## Consuming With `@KafkaListener`

Moved to [Spring Kafka Consumers And Delivery Semantics](kafka/SPRING-KAFKA-CONSUMERS.md).

## Consumer Groups

Moved to [Spring Kafka Consumers And Delivery Semantics](kafka/SPRING-KAFKA-CONSUMERS.md).

## Acknowledgments And Delivery Semantics

Moved to [Spring Kafka Consumers And Delivery Semantics](kafka/SPRING-KAFKA-CONSUMERS.md).

## Spring Kafka Transactions

Moved to [Spring Kafka Consumers And Delivery Semantics](kafka/SPRING-KAFKA-CONSUMERS.md).

## Is Kafka A Queue?

Moved to [Spring Kafka Consumers And Delivery Semantics](kafka/SPRING-KAFKA-CONSUMERS.md).

## Listener Threads

Moved to [Spring Kafka Threads Concurrency And Capacity](kafka/SPRING-KAFKA-CONCURRENCY-CAPACITY.md).

## Concurrency And Multithreading

Moved to [Spring Kafka Threads Concurrency And Capacity](kafka/SPRING-KAFKA-CONCURRENCY-CAPACITY.md).

## Determining Partition And Consumer Counts

Moved to [Spring Kafka Threads Concurrency And Capacity](kafka/SPRING-KAFKA-CONCURRENCY-CAPACITY.md).

## Non-Blocking Retry With `@RetryableTopic`

Moved to [Spring Kafka Retry DLT And Recovery](kafka/SPRING-KAFKA-RETRY-DLT-RECOVERY.md).

## `@DltHandler`

Moved to [Spring Kafka Retry DLT And Recovery](kafka/SPRING-KAFKA-RETRY-DLT-RECOVERY.md).

## What "One Poison Event Produces One Recovery Record" Means

Moved to [Spring Kafka Retry DLT And Recovery](kafka/SPRING-KAFKA-RETRY-DLT-RECOVERY.md).

## Idempotent Consumers

Moved to [Spring Kafka Idempotency And Operations](kafka/SPRING-KAFKA-IDEMPOTENCY-OPERATIONS.md).

## Replaying Failed Events

Moved to [Spring Kafka Retry DLT And Recovery](kafka/SPRING-KAFKA-RETRY-DLT-RECOVERY.md).

## Are Messages Being Lost?

Moved to [Spring Kafka Idempotency And Operations](kafka/SPRING-KAFKA-IDEMPOTENCY-OPERATIONS.md).

## Consumer Lag

Moved to [Spring Kafka Idempotency And Operations](kafka/SPRING-KAFKA-IDEMPOTENCY-OPERATIONS.md).

## Slow Consumer Response

Moved to [Spring Kafka Idempotency And Operations](kafka/SPRING-KAFKA-IDEMPOTENCY-OPERATIONS.md).

## Useful Kafka Commands

Moved to [Spring Kafka Idempotency And Operations](kafka/SPRING-KAFKA-IDEMPOTENCY-OPERATIONS.md).

## Observability

Moved to [Spring Kafka Idempotency And Operations](kafka/SPRING-KAFKA-IDEMPOTENCY-OPERATIONS.md).

## Event Design Practices

Moved to [Spring Kafka Idempotency And Operations](kafka/SPRING-KAFKA-IDEMPOTENCY-OPERATIONS.md).

## Production Checklist

Moved to [Spring Kafka Idempotency And Operations](kafka/SPRING-KAFKA-IDEMPOTENCY-OPERATIONS.md).

## Related Guides

Moved to [Spring Kafka Idempotency And Operations](kafka/SPRING-KAFKA-IDEMPOTENCY-OPERATIONS.md).

## Official References

Moved to [Spring Kafka Idempotency And Operations](kafka/SPRING-KAFKA-IDEMPOTENCY-OPERATIONS.md).
