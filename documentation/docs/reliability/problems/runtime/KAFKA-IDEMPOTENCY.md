---
title: Kafka Idempotency Problem
---

# Kafka Idempotency Problem

Kafka producer idempotence, idempotent consumers, business keys, and duplicate event handling.

Back to [Runtime Reliability Problems](../RUNTIME-RELIABILITY-PROBLEMS.md).

## Kafka Producer Idempotence And Idempotent Consumers

### Problem Statement

Kafka delivery in Shopverse is intentionally at least once. This is the right
model for the outbox pattern because a committed business change should not
lose its outgoing event. The tradeoff is that a consumer may see the same
business event more than once.

Duplicate delivery can happen when:

- a producer retries after a lost acknowledgement;
- an outbox worker crashes after Kafka stores the record but before the outbox
  row is marked `PUBLISHED`;
- a consumer processes a record but crashes before the offset is committed;
- retry topics and DLT replay reintroduce the same payload;
- an operator replays a failed event after fixing an issue.

If consumers are not idempotent, a duplicate event can repeat the business
effect:

```text
Duplicate order.created     -> reserve stock twice
Duplicate inventory.reserved -> create or charge payment twice
Duplicate payment.completed -> append misleading order transitions
```

### Producer-Side Fix

Central Kafka configuration enables producer idempotence:

```yaml
spring:
  kafka:
    producer:
      acks: all
      properties:
        enable.idempotence: true
        max.in.flight.requests.per.connection: 5
```

This protects the producer-to-broker retry path. If the same producer session
retries a send because the acknowledgement was lost, Kafka can detect the
producer sequence and avoid appending that retry twice.

It does not provide end-to-end exactly-once business processing. It does not
deduplicate two application calls to `KafkaTemplate.send(...)`, a republished
outbox row after process restart, DLT replay, or consumer database updates.

### Consumer-Side Fix

Shopverse consumers currently use business-key and state-based idempotency:

| Service or boundary | Identifier | Duplicate protection |
|---|---|---|
| Order checkout | `Idempotency-Key` | repeated checkout returns the existing order |
| Inventory reservation | `orderNumber` | existing reservation means stock is not reserved again |
| Payment processing | `orderNumber` | existing payment means payment is not created again |
| Kafka partitioning | `orderNumber` message key | events for one order normally stay ordered on one partition |
| DLT persistence | `sourceTopic + payload + replayed=false` | common duplicate unresolved recovery records are suppressed |

Inventory example:

```java
if (reservationRepository.findByOrderNumber(orderNumber).isPresent()) {
    return true;
}
```

Payment example:

```java
return repository.findByOrderNumber(orderNumber).orElseGet(() -> {
    // create and process payment once
});
```

### Why Technical IDs Are Not Enough

Consumer ID, group ID, offset, and trace ID describe Kafka/runtime mechanics.
They do not describe the business operation.

| Identifier | Why it cannot be the main duplicate key |
|---|---|
| consumer ID | changes when a container restarts, scales, or rebalances |
| group ID | identifies all consumers in a service group, not one checkout event |
| partition + offset | identifies one physical record only in one topic; retry, DLT, replay, or republish can create a new offset for the same business event |
| Kafka key | routes related records to a partition but does not prevent multiple records with the same key |
| order ID | generated after checkout creation, so the client cannot use it to safely retry a lost create response |
| trace ID | identifies one technical trace; a SAGA can span several traces |
| correlation ID | useful for searching logs and timelines, but not strict enough by itself for database uniqueness |

The identifier must exist at the point where duplication can occur. Checkout
needs a caller-generated `Idempotency-Key` before an order exists. Downstream
SAGA steps can use `orderNumber` because the order already exists.

### Stronger Production Enhancement

The next stronger pattern is a transactional inbox. Each event carries an
immutable `eventId`, and each consumer stores `(event_id, consumer_name)` in a
unique table in the same transaction as the business update.

```java
@Transactional
public void handle(OrderCreatedEvent event) {
    if (!processedEventRepository.tryInsert(event.eventId(), "inventory-service")) {
        return;
    }

    inventoryService.reserve(...);
    outboxService.enqueue(...);
}
```

That pattern explicitly records processed event identity and is stronger than
state-based checks alone. It is documented as the recommended production
enhancement for Shopverse.






