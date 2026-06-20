---
title: Spring Kafka Idempotency And Operations
---

# Spring Kafka Idempotency And Operations

Idempotent consumers, message-loss checks, consumer lag, slow consumers, commands, observability, event design, and production checklist.

Back to [Spring Kafka](../SPRING-KAFKA.md).

## Idempotent Consumers

At-least-once delivery means listener code must tolerate duplicates.
For the canonical pattern using immutable event IDs and a `processed_events`
table, see [Inbox pattern](../../reliability/INBOX-PATTERN.md).

Shopverse currently uses:

- stable order numbers as message keys and aggregate identifiers;
- unique checkout idempotency keys;
- unique order/payment relationships;
- state checks before applying transitions;
- optimistic locking for concurrent inventory updates;
- idempotent release behavior bounded by reserved quantity;
- outbox records for durable outgoing events;
- application-level DLT record suppression;
- audited replay through the outbox.

### Shopverse Business Identifiers

Shopverse deliberately uses different identifiers for different duplicate
problems:

| Area | Identifier | Why this identifier is used |
|---|---|---|
| Order checkout API | `Idempotency-Key` | caller creates it before the order exists, so retries of `POST /checkout` can find the original result |
| Order aggregate | `orderNumber` | stable business identifier after the order has been created |
| Inventory reservation | `orderNumber` | one order should create at most one reservation for the checkout flow |
| Payment record | `orderNumber` | one order should create at most one payment record in the POC flow |
| Kafka message key | `orderNumber` | sends events for the same order to the same partition for per-order ordering |
| Logs/timeline/replay | `correlationId` | connects the business journey across services, retries, DLT, and replay |

The current SAGA events are idempotent mainly through these business keys and
state checks. For example, Inventory checks whether a reservation already
exists for the order before decrementing stock again:

```java
if (reservationRepository.findByOrderNumber(orderNumber).isPresent()) {
    return true;
}
```

Payment checks whether a payment already exists for the order before creating
or charging another one:

```java
return repository.findByOrderNumber(orderNumber).orElseGet(() -> {
    // create and process payment once
});
```

This is state-based idempotency. It is appropriate for the POC because the
business invariant is simple: one checkout order should have one reservation
and one payment record.

### Why Not Use Consumer ID, Group ID, Offset, Or Trace ID?

Not every identifier is suitable for duplicate business detection.

| Identifier | Why it is not enough for business idempotency |
|---|---|
| Kafka consumer ID | identifies a running consumer instance; it can change after restart, rebalance, or scaling |
| Kafka group ID | identifies a group of consumers, not one event or one order |
| topic + partition + offset | identifies one physical Kafka record, but the same business event can appear again in a retry topic, DLT, replay, or republished outbox record with a different offset |
| Kafka message key | controls partitioning and ordering; Kafka still allows multiple records with the same key |
| order ID | generated after checkout creation; the client does not know it before retrying a lost `POST /checkout` response |
| trace ID | identifies one technical trace; a SAGA can continue through multiple traces |
| correlation ID | good for searching one business journey, but not necessarily unique enough to enforce database idempotency |

The correct duplicate key must be available at the point where duplication can
occur. That is why checkout uses a caller-provided `Idempotency-Key` before
the order exists, while Inventory and Payment use `orderNumber` after the
order exists.

```text
Before order exists:
  duplicate risk = repeated POST /checkout
  key = Idempotency-Key

After order exists:
  duplicate risk = repeated Kafka event for same order
  key = orderNumber or future eventId
```

The strongest general pattern is a transactional inbox:

```java
@Transactional
public void handle(OrderCreatedEvent event) {
    if (!processedEventRepository.tryInsert(event.eventId(), "inventory-service")) {
        return;
    }

    inventoryService.reserve(event);
    outboxService.enqueue(...);
}
```

`tryInsert` must rely on a database unique constraint. The processed event,
business update, and outgoing outbox record must commit together.

With a full inbox pattern, every event carries an immutable `eventId`:

```json
{
  "eventId": "evt-7b0b8c8f",
  "orderNumber": "ORD-1003",
  "correlationId": "SAGA-ORD-1003"
}
```

Each consumer writes that event ID before applying the business change:

```sql
CREATE TABLE processed_events (
  event_id VARCHAR(100) NOT NULL,
  consumer_name VARCHAR(100) NOT NULL,
  processed_at TIMESTAMP NOT NULL,
  PRIMARY KEY (event_id, consumer_name)
);
```

If the same event is delivered again, the insert fails or is ignored and the
consumer skips the business action. That is stronger than checking only
current business state, and it is the recommended production enhancement for
Shopverse.


## Are Messages Being Lost?

Kafka issues often look like message loss while the record is actually in a
different stage.

### Producer Investigation

1. Find the source domain change and outbox row.
2. Check whether the outbox status is pending, failed, or published.
3. Inspect publish attempts and the last error.
4. Confirm `KafkaTemplate.send()` received broker metadata.
5. Verify the destination topic and message key.
6. Check broker availability, topic existence, replication, and disk state.
7. Confirm the producer did not mark the row published before acknowledgement.

### Broker Investigation

1. Describe the topic and partition count.
2. Verify leaders and in-sync replicas.
3. Inspect retention and cleanup policies.
4. Confirm the event was not sent to a similarly named environment/topic.
5. Check retry and DLT topics.

### Consumer Investigation

1. Confirm the expected consumer group is active.
2. Compare current offset, log-end offset, and lag.
3. Inspect listener exceptions and retry-topic lag.
4. Check whether the record is already committed but the database transaction
   failed due to incorrect acknowledgment design.
5. Check DLT persistence and replay audit.
6. Verify deserialization and event-schema compatibility.
7. Inspect rebalances and `max.poll.interval.ms` violations.

Do not reset offsets or replay a topic until the business duplication impact is
understood.


## Consumer Lag

Lag is approximately:

```text
log end offset - consumer group's committed offset
```

Growing lag means records arrive faster than the group commits them. Lag can
result from slow processing, failures, too few partitions/consumers, a stopped
group, key skew, database contention, or rebalance loops.

Inspect all groups:

```powershell
docker compose exec kafka kafka-consumer-groups.sh `
  --bootstrap-server localhost:9092 `
  --describe --all-groups
```

Inspect one group:

```powershell
docker compose exec kafka kafka-consumer-groups.sh `
  --bootstrap-server localhost:9092 `
  --describe `
  --group INVENTORY-SERVICE
```

Important columns include topic, partition, current offset, log-end offset,
lag, consumer ID, host, and client ID.

One instantaneous lag value is not enough. Alert on lag trend, age of the
oldest unprocessed event, and business SAGA duration.


## Slow Consumer Response

1. Measure listener processing time by event type.
2. Identify slow database queries, lock waits, pool exhaustion, remote calls,
   serialization, and excessive logging.
3. Separate permanent poison records through bounded retry and DLT.
4. Check whether one hot key dominates a partition.
5. Make the handler transaction smaller.
6. Add partitions and matching group consumers when work is parallelizable.
7. Increase concurrency only within database and downstream capacity.
8. Tune poll size and maximum poll interval using measured processing time.
9. Use batching only when ordering, retry, and transaction semantics permit it.
10. Apply backpressure instead of creating unbounded executor queues.

Scaling consumers does not fix a locked database or slow downstream service.
It can amplify the failure by increasing concurrent pressure.


## Useful Kafka Commands

List topics:

```powershell
docker compose exec kafka kafka-topics.sh `
  --bootstrap-server localhost:9092 `
  --list
```

Describe a topic:

```powershell
docker compose exec kafka kafka-topics.sh `
  --bootstrap-server localhost:9092 `
  --describe `
  --topic shopverse.order.created
```

Read records for debugging:

```powershell
docker compose exec kafka kafka-console-consumer.sh `
  --bootstrap-server localhost:9092 `
  --topic shopverse.order.created `
  --from-beginning `
  --property print.key=true `
  --property print.partition=true `
  --property print.offset=true
```

Use a temporary group or console consumer carefully. A consumer using the
application's group ID participates in that group and can take partitions away
from the service.


## Observability

Shopverse enables Kafka observation:

```yaml
spring:
  kafka:
    template:
      observation-enabled: true
    listener:
      observation-enabled: true
```

Monitor:

- producer send rate, errors, retries, and latency;
- consumer records rate and processing duration;
- consumer lag and oldest-event age;
- group rebalances;
- retry-topic and DLT volume;
- outbox pending count and oldest pending age;
- DLT persistence and replay counters;
- end-to-end SAGA completion time.

Current application metrics include:

```text
shopverse.kafka.dlt.events
shopverse.kafka.dlt.replays
shopverse.outbox.publish
```

Logs should include event ID when available, aggregate/order number,
correlation ID, topic, partition, offset, event type, attempt, and outcome.
Avoid putting order numbers, payloads, or correlation IDs into metric labels
because they create unbounded cardinality.


## Event Design Practices

- Use a stable event name and explicit schema version.
- Include immutable `eventId`, `occurredAt`, `correlationId`, aggregate ID, and
  aggregate version.
- Keep business events immutable.
- Use backward-compatible schema evolution.
- Avoid exposing JPA entities as event contracts.
- Use the aggregate ID as key when per-aggregate ordering matters.
- Validate payloads at the consumer boundary.
- Do not log secrets or full personal/payment payloads.
- Define retention, partition, replication, and replay policies per topic.
- Keep listeners thin and delegate transactional work to services.

Example envelope:

```json
{
  "eventId": "a7bd1ec4-31b1-4bb0-8bb7-a172bcfa7467",
  "eventType": "InventoryReserved",
  "schemaVersion": 1,
  "occurredAt": "2026-06-11T12:30:00Z",
  "correlationId": "checkout-9001",
  "aggregateId": "ORD-1003",
  "aggregateVersion": 2,
  "data": {
    "productId": 101,
    "quantity": 1
  }
}
```

The event ID and aggregate version are recommended hardening items; current
Shopverse event records do not consistently expose both.


## Production Checklist

1. Use explicit topic ownership, partitions, replication, and retention.
2. Require stable event IDs and versioned schemas.
3. Use keys for required ordering.
4. Use `acks=all` and idempotent producers.
5. Keep database/Kafka consistency behind a transactional outbox.
6. Keep listeners thin and transactional handlers idempotent.
7. Use bounded, classified retries with backoff.
8. Persist terminal failures and audit replay.
9. Enforce inbox/recovery deduplication with database uniqueness.
10. Scale consumers according to partitions and measured capacity.
11. Avoid arbitrary `@Async` listener handoff.
12. Monitor lag, oldest-event age, retry traffic, DLTs, and outbox backlog.
13. Test malformed events, duplicates, broker outages, crashes, and rebalances.
14. Secure brokers with authentication, authorization, and encryption outside
    local POC environments.


## Related Guides

- [SAGA and outbox implementation](../../reliability/SAGA-OUTBOX.md)
- [Generic SAGA and outbox patterns](../../reliability/SAGA-GENERIC.md)
- [Spring Transactions](../SPRING-TRANSACTIONS.md)
- [MDC and correlation](../../observability/MDC-CORRELATION-TRACING.md)
- [Prometheus queries](../../observability/PROMETHEUS.md)
- [Debugging](../../development/DEBUGGING.md)


## Official References

- [Spring Kafka `@KafkaListener`](https://docs.spring.io/spring-kafka/reference/kafka/receiving-messages/listener-annotation.html)
- [Spring Kafka non-blocking retries](https://docs.spring.io/spring-kafka/reference/retrytopic.html)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)







