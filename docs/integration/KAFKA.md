# Kafka In Shopverse

## Publishing

Services do not publish domain events directly from the controller transaction. They write an outbox row, and the scheduled publisher calls:

```java
kafkaTemplate.send(topic, orderNumber, payload).get(10, TimeUnit.SECONDS);
```

The order number is the key. Events for one order therefore map consistently to a partition.

Producer settings include `acks=all`, idempotence, and a bounded `max.in.flight.requests.per.connection`.

## Consuming

```java
@RetryableTopic(attempts = "3")
@KafkaListener(
    topics = "${shopverse.kafka.topics.order-created}",
    groupId = "${spring.application.name}"
)
public void onOrderCreated(String payload) { ... }
```

Kafka consumers pull records from brokers. Within a consumer group, one partition is assigned to at most one consumer at a time. Adding listener instances beyond the partition count adds no parallelism.

## Threads And Concurrency

- each listener container owns consumer threads;
- records in one partition are processed in order;
- separate partitions can be processed concurrently;
- database transactions remain short and must not wait indefinitely;
- arbitrary `@Async` around a listener is avoided because it can acknowledge before work completes.

Scale consumers according to partition count, processing latency, and lag. Start from measured throughput rather than a fixed producer/consumer ratio.

## Retry And DLT

`@RetryableTopic` creates retry topics with delayed redelivery and ultimately a dead-letter topic. `@DltHandler` persists the unresolved event for inspection and controlled replay.

One poison event should create one unresolved recovery record in each affected service, not one row per retry callback. Retry callbacks are transport attempts; the persisted record represents the final operator action.

## Idempotent Consumers

Shopverse uses:

- stable business keys such as order number;
- unique idempotency keys for checkout;
- existing-state checks before transitions;
- unique payment/order relationships;
- optimistic locking for stock;
- persisted DLT replay audit.

A stronger future design can add a dedicated `processed_events` table keyed by event ID per consumer.

## Diagnosing Lost Messages

1. Check the producing service's outbox row: `PENDING`, `PUBLISHED`, or failed.
2. Check outbox failure metrics and logs.
3. Confirm the topic exists and producer acknowledgement succeeded.
4. Inspect consumer group offsets and lag.
5. Check retry topics and DLT.
6. Verify the consumer transaction rolled back on failure.
7. Replay only after fixing the root cause.

## Slow Consumers

Symptoms are growing lag, increasing end-to-end timeline delay, and stable producer throughput.

Actions:

- identify slow database or external calls;
- reduce work inside the listener;
- add partitions and matching consumers;
- batch where ordering and transaction rules allow;
- tune poll and processing limits;
- do not add concurrency above partition count;
- ensure failures are not continuously retrying.

Useful commands:

```powershell
docker compose exec kafka kafka-consumer-groups.sh `
  --bootstrap-server localhost:9092 `
  --describe --all-groups
```

```powershell
docker compose exec kafka kafka-topics.sh `
  --bootstrap-server localhost:9092 `
  --list
```

## Semantics

Shopverse uses at-least-once consumption. Kafka producer idempotence prevents some duplicate writes from retries, but it does not make database side effects exactly once. The application must remain idempotent.
