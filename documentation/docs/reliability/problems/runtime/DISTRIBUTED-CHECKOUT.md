---
title: Reliable Distributed Checkout Problem
---

# Reliable Distributed Checkout Problem

Reliable checkout across Order, Inventory, Payment, Kafka, SAGA, and outbox.

Back to [Runtime Reliability Problems](../RUNTIME-RELIABILITY-PROBLEMS.md).

## Reliable Distributed Checkout

### Problem Statement

Checkout changes data owned by multiple services:

```text
Order Service     -> order and timeline state
Inventory Service -> stock and reservation state
Payment Service   -> payment state
Kafka             -> integration events
```

These resources cannot safely participate in one normal local database
transaction. If the system only saved state and then called Kafka directly,
several production failures are possible:

- Order commits, but the `order.created` Kafka publish fails;
- Inventory reserves stock, but Payment later declines or times out;
- a Kafka listener retries the same message and applies the same transition
  twice;
- a poison Kafka event blocks a consumer unless it is moved to a recovery
  path;
- an outbox worker crashes after claiming a row and leaves the event stuck;
- logs and traces show runtime evidence, but do not provide a durable business
  timeline.

### Solution

Shopverse solves this with a choreography SAGA. Each service commits its own
local transaction and publishes the next business event through a transactional
outbox.

| Requirement | Shopverse implementation |
|---|---|
| Transactional outbox | outgoing events are stored in service-owned `outbox_events` tables before Kafka publication |
| Atomic domain state and outbox insertion | domain rows, timeline rows, and the outbox row are inserted in one local MySQL transaction |
| Compensation | failed payment or failed inventory emits a compensating event so Order and Inventory move to a valid terminal state |
| Persistent SAGA timeline | Order Service stores queryable timeline entries such as `ORDER_CREATED`, `INVENTORY_RESERVED`, `PAYMENT_PROCESSING`, `PAYMENT_COMPLETED`, and `ORDER_CONFIRMED` |
| Kafka retries and DLT handling | listeners use Spring Kafka retry topics and `@DltHandler` to persist unresolved recovery records |
| Outbox crash recovery | claimed outbox rows record `claimed_at`; stale `PROCESSING` rows are released back to retryable state |

### Atomic Local Transaction

The checkout transaction persists the domain state and event intent together:

```java
@Transactional
public OrderResponse checkout(...) {
    OrderEntity order = orderRepository.save(...);
    timelineRepository.save(...);
    outboxService.enqueue(
            "ORDER",
            order.getOrderNumber(),
            "ORDER_CREATED",
            topics.orderCreated(),
            order.getOrderNumber(),
            event,
            correlationId
    );
    return mapper.toResponse(order);
}
```

`outboxService.enqueue(...)` uses `Propagation.MANDATORY`, so it must run
inside the caller's transaction. If saving the order, timeline, or outbox row
fails, the whole local transaction rolls back. If the transaction commits, the
system has durable proof that the event must eventually be published.

### Inventory Compensation Example

Inventory applies its local business decision and saves the outgoing SAGA event
in the same transaction:

```java
@Transactional
public void handleOrderCreated(OrderCreatedEvent event) {
    boolean reserved = inventoryService.reserve(
            event.orderNumber(),
            event.correlationId(),
            event.productId(),
            event.quantity()
    );

    Object outgoingEvent = reserved
            ? new InventoryReservedEvent(...)
            : new InventoryFailedEvent(...);

    outboxService.enqueue(
            "INVENTORY_RESERVATION",
            event.orderNumber(),
            outgoingEvent.getClass().getSimpleName(),
            reserved ? topics.inventoryReserved() : topics.inventoryFailed(),
            event.orderNumber(),
            outgoingEvent,
            event.correlationId()
    );
}
```

This is a SAGA transaction, not a distributed database transaction. Inventory
does not roll back Order Service's database. It publishes a business outcome,
and Order Service reacts in its own transaction.

### Retry And DLT Recovery

Kafka consumers use retry topics for transient failures and a dead-letter
handler for unresolved failures:

```java
@RetryableTopic(attempts = "3")
@KafkaListener(
        topics = "${shopverse.kafka.topics.payment-failed}",
        groupId = "${spring.application.name}"
)
public void onPaymentFailed(String payload) {
    PaymentFailedEvent event = readEvent(payload, PaymentFailedEvent.class);
    CorrelationContext.run(event.correlationId(), () -> handlePaymentFailed(event));
}

@DltHandler
public void onDeadLetter(ConsumerRecord<String, String> record) {
    failedKafkaEventService.record(
            record.topic().replaceFirst("-dlt$", ""),
            record.value(),
            "Listener failed after retry policy",
            3
    );
}
```

The DLT table gives operators a durable recovery record with payload, source
topic, failure reason, retry count, replay count, replay user, and replay time.

### Operational Evidence

Useful checks during a demo or incident:

```powershell
docker compose exec mysql sh -lc '
  MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot -e "
    SELECT order_number, status, correlation_id
    FROM order_service.orders
    ORDER BY id DESC LIMIT 5;

    SELECT order_number, stage, detail, occurred_at
    FROM order_service.order_timeline_events
    ORDER BY occurred_at DESC LIMIT 10;

    SELECT aggregate_id, event_type, topic, status, publish_attempts, last_error
    FROM order_service.outbox_events
    ORDER BY id DESC LIMIT 10;
  "
'
```

Check downstream outbox state:

```powershell
docker compose exec mysql sh -lc '
  MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot -e "
    SELECT aggregate_id, event_type, topic, status, publish_attempts, last_error
    FROM inventory_service.outbox_events
    ORDER BY id DESC LIMIT 10;

    SELECT aggregate_id, event_type, topic, status, publish_attempts, last_error
    FROM payment_service.outbox_events
    ORDER BY id DESC LIMIT 10;
  "
'
```

Check unresolved Kafka recovery records:

```sql
SELECT source_topic, replayed, replay_count, failure_reason, failed_at
FROM order_service.failed_kafka_events
ORDER BY id DESC
LIMIT 10;
```

The order timeline is the business audit trail. Loki logs, Prometheus metrics,
and Zipkin traces are operational evidence that help explain how the system
reached that state.

### Remaining Hardening

The POC demonstrates the core production patterns. Stronger production
implementations should also add event-ID or inbox-table consumer idempotency,
bounded outbox backoff with terminal states, stricter DLT uniqueness
constraints, external payment-provider idempotency keys, and reconciliation
jobs for late payment outcomes.






