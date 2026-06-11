# Choreography SAGA And Transactional Outbox

## Why A SAGA

Checkout changes Order, Inventory, and Payment data owned by different services. A single ACID transaction cannot safely cover those databases and Kafka. Shopverse uses local transactions plus events and compensation.

## Success Path

```text
ORDER_CREATED
  -> INVENTORY_RESERVED
  -> PAYMENT_PROCESSING
  -> PAYMENT_COMPLETED
  -> ORDER_CONFIRMED
```

## Failure Paths

- insufficient stock: Inventory emits `inventory.failed`; Order becomes `INVENTORY_REJECTED`;
- payment decline: Payment emits `payment.failed`; Order becomes `PAYMENT_FAILED`; Inventory releases the reservation;
- payment timeout: Payment remains `TIMED_OUT` and waits for reconciliation;
- reservation expiry: Inventory marks an unpaid reservation `EXPIRED` and restores stock.

## Transactional Outbox

The domain update and outgoing event are saved in the same MySQL transaction:

```java
@Transactional
public OrderResponse checkout(...) {
    OrderEntity order = orderRepository.save(...);
    timelineRepository.save(...);
    outboxService.enqueue("ORDER", order.getOrderNumber(),
            "ORDER_CREATED", topic, order.getOrderNumber(), event, correlationId);
    return mapper.toResponse(order);
}
```

`OutboxService.enqueue` uses `Propagation.MANDATORY`, so it fails when called outside the owning transaction. This closes the failure window where a database commit succeeds but `KafkaTemplate.send` never occurs.

A scheduled publisher:

1. selects the oldest 50 `PENDING` rows;
2. locks one row;
3. opens a `REQUIRES_NEW` transaction;
4. sends with `KafkaTemplate`;
5. marks it `PUBLISHED`, or records failure and attempt count.

## Idempotency

HTTP checkout requires `Idempotency-Key`. Repeating the same key returns the existing order instead of inserting another one. A unique database constraint protects races that pass the application lookup concurrently.

Kafka remains at-least-once. Consumers must treat repeated state transitions as harmless by checking existing order, payment, and reservation state and by using unique business keys.

## Inventory Concurrency

`InventoryItem` uses `@Version`. Two transactions reading the last unit cannot both successfully update the same version. One update wins; the other receives an optimistic-lock failure and can be retried or rejected.

## DLT And Replay

Listeners use `@RetryableTopic(attempts = "3")`. After retries, `@DltHandler` persists one unresolved recovery record containing source topic, payload, reason, retry count, failure time, replay count, replay user, and replay time.

Admin replay APIs enqueue the event through the outbox and update the audit fields. Replay is observable through logs and `shopverse.kafka.dlt.replays`.

## Timeline

Order Service persists queryable stages with timestamp, correlation ID, and details. The timeline is protected by ownership authorization. It is the business audit trail; Kafka logs and Zipkin traces are operational evidence, not the source of order state.

## Guarantees And Limits

- local state and outgoing event: atomic;
- cross-service state: eventually consistent;
- message delivery: at least once;
- ordering: per Kafka key/partition;
- global exactly once: not claimed;
- compensation: explicit business action, not database rollback.
