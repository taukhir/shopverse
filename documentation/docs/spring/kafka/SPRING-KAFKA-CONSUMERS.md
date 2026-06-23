---
title: Spring Kafka Consumers And Delivery Semantics
---

# Spring Kafka Consumers And Delivery Semantics

Kafka listeners, consumer groups, acknowledgments, delivery semantics, and Spring Kafka transactions.

Back to [Spring Kafka](../SPRING-KAFKA.md).

## Consuming With `@KafkaListener`

```java
@KafkaListener(
        topics = "${shopverse.kafka.topics.payment-failed}",
        groupId = "${spring.application.name}"
)
public void onPaymentFailed(String payload) {
    PaymentFailedEvent event = readEvent(payload, PaymentFailedEvent.class);
    CorrelationContext.run(
            event.correlationId(),
            () -> handlePaymentFailed(event)
    );
}
```

`@KafkaListener` marks the method as the endpoint for a Spring-managed message
listener container. Spring Boot supplies the default container factory from
`spring.kafka.*` properties.

At startup Spring:

1. finds the annotation;
2. creates a listener endpoint and container;
3. creates a Kafka consumer;
4. subscribes it to the topic using the group ID;
5. starts a polling thread;
6. converts each record to the method arguments;
7. invokes the listener on the consumer-container thread.

`topics` selects the input topic. `groupId` identifies independent processing
progress. Property placeholders keep names in centralized configuration.

Use `ConsumerRecord<K,V>` when topic, key, partition, offset, timestamp, or
headers are needed:

```java
@KafkaListener(topics = "orders", groupId = "inventory-service")
public void consume(ConsumerRecord<String, String> record) {
    log.info(
            "Kafka record received topic={} partition={} offset={} key={}",
            record.topic(),
            record.partition(),
            record.offset(),
            record.key()
    );
}
```

Do not log sensitive payloads by default.


## Consumer Groups

Consumers with the same group ID cooperate. One partition is assigned to at
most one consumer in that group:

```text
Topic: 3 partitions

inventory-service group
  consumer A -> partition 0
  consumer B -> partition 1
  consumer C -> partition 2

analytics group
  consumer X -> partitions 0, 1, 2
```

The Inventory and Analytics groups both receive the records because their
group IDs differ. Within Inventory, each partition is handled by one member.

When a consumer starts, stops, or becomes unhealthy, Kafka rebalances
partitions across surviving group members. Rebalances temporarily pause
processing and may expose duplicates when completed work was not yet committed.

Shopverse uses `${spring.application.name}` as the group ID, so each service
receives the event types it subscribes to while replicas of that service share
the work.


## Acknowledgments And Delivery Semantics

Shopverse central configuration uses:

```yaml
spring:
  kafka:
    consumer:
      enable-auto-commit: false
      auto-offset-reset: earliest
    listener:
      ack-mode: record
```

- auto-commit is disabled, so the container controls offset commits;
- `RECORD` commits the offset after a record listener completes successfully;
- `earliest` applies only when a group has no valid committed offset.

A failure before a successful commit can cause redelivery. A crash after the
database commit but before the offset commit can also redeliver the record.
Shopverse therefore has at-least-once consumption and must make business
effects idempotent.

Manual acknowledgment is useful only when application-controlled offset timing
is genuinely required:

```java
@KafkaListener(topics = "orders", groupId = "worker")
public void consume(String payload, Acknowledgment acknowledgment) {
    process(payload);
    acknowledgment.acknowledge();
}
```

It requires a manual acknowledgment mode. It does not itself make database
work and offset commits atomic.

### Manual Acknowledgment Modes

```yaml
spring:
  kafka:
    listener:
      ack-mode: manual
```

Common container modes include:

| Mode | General behavior |
|---|---|
| `RECORD` | commit after each successfully handled record |
| `BATCH` | commit after records returned by one poll are processed |
| `MANUAL` | listener acknowledges; commit is queued by container semantics |
| `MANUAL_IMMEDIATE` | attempt commit immediately when acknowledgment occurs on the consumer thread |

Exact behavior depends on record versus batch listeners and transaction
configuration. Manual acknowledgment should not be used merely because it
looks more controlled. It adds responsibility for every success, failure, and
threading path.


## Spring Kafka Transactions

Configure a transactional producer ID prefix:

```yaml
spring:
  kafka:
    producer:
      transaction-id-prefix: ${spring.application.name}-${INSTANCE_ID:local}-
```

Each running instance requires unique transactional IDs.

Spring can execute several Kafka sends atomically:

```java
kafkaTemplate.executeInTransaction(operations -> {
    operations.send("order.created", orderNumber, createdPayload);
    operations.send("order.audit", orderNumber, auditPayload);
    return null;
});
```

Either both records become visible to `read_committed` consumers or neither
does.

For a consume-process-produce flow, a Kafka-aware listener container can bind
the consumed offsets and outgoing records to one Kafka transaction:

```text
poll input record
  -> begin Kafka transaction
  -> invoke listener
  -> publish output record
  -> send consumed offset to transaction
  -> commit Kafka transaction
```

Kafka transactions provide exactly-once semantics within Kafka boundaries.
They do not make a MySQL transaction and Kafka transaction one atomic commit.

Unsafe dual write:

```java
@Transactional
public void createOrder() {
    orderRepository.save(order);
    kafkaTemplate.send("order.created", payload);
}
```

Use a transactional outbox when database state and event publication must
survive independent failures:

```java
@Transactional
public void createOrder() {
    orderRepository.save(order);
    outboxRepository.save(OutboxEvent.orderCreated(order));
}
```

Non-blocking retry topics and container transactions have compatibility
constraints. Select retry and transaction semantics together rather than
combining annotations without verifying behavior.


## Is Kafka A Queue?

Kafka can model competing work by using one consumer group:

```text
one topic + one consumer group
  -> each partition record handled by one group member
```

But Kafka retains records after processing and supports multiple groups and
replay, so its fundamental model is a distributed log rather than a
traditional destructive queue.

Use separate topics or explicit routing when different work types require
independent retry, retention, ownership, or scaling.

For the ownership comparison between Kafka groups, competing queues, static
shards, lease tables, and database row claims, see
[Partition And Queue Ownership](../../reliability/locking/PARTITION-AND-QUEUE-OWNERSHIP.md).








