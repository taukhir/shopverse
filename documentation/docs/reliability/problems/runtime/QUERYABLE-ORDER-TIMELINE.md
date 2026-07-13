---
title: Queryable Order Timeline Problem
status: "maintained"
last_reviewed: "2026-07-13"
---


# Queryable Order Timeline Problem

Queryable owner-protected SAGA timeline for order support and debugging.

Back to [Runtime Reliability Problems](../RUNTIME-RELIABILITY-PROBLEMS.md).

## Queryable Order SAGA Timeline

### Problem Statement

A checkout SAGA does not complete inside one HTTP request or one database
transaction. It moves across independently owned services:

```text
Order Service
  -> Kafka
  -> Inventory Service
  -> Kafka
  -> Payment Service
  -> Kafka
  -> Order Service
```

When a customer or operator asks what happened to one order, logs and traces
alone are not enough. They are operational evidence, but they are distributed
across Loki, Zipkin, Kafka, service databases, outbox tables, and DLT records.

Without a durable timeline, support must manually reconstruct the order
journey from several systems:

- order row and status;
- inventory reservation state;
- payment state;
- Kafka offsets, retry topics, and DLT;
- Loki logs by correlation ID;
- Zipkin traces by trace ID.

That is slow and error-prone, especially when asynchronous SAGA steps run
after the original HTTP trace has finished.

### Solution

Order Service persists business transitions in `order_timeline_events`.
Timeline rows are append-only business history for an order. They store:

| Column | Purpose |
|---|---|
| `order_number` | groups timeline rows for one order |
| `correlation_id` | connects the row to logs, Kafka events, outbox, and DLT |
| `stage` | business transition such as `ORDER_CREATED` or `PAYMENT_FAILED` |
| `detail` | human-readable explanation |
| `occurred_at` | when the transition was recorded |

The table is created with an index for ordered timeline lookup:

```yaml
- createIndex:
    tableName: order_timeline_events
    indexName: idx_order_timeline_order_time
    columns:
      - column:
          name: order_number
      - column:
          name: occurred_at
```

The supported stages are:

```java
public enum OrderTimelineStage {
    ORDER_CREATED,
    INVENTORY_RESERVED,
    INVENTORY_REJECTED,
    PAYMENT_PROCESSING,
    PAYMENT_COMPLETED,
    PAYMENT_FAILED,
    ORDER_CONFIRMED,
    ORDER_CANCELLED
}
```

### How It Is Implemented

Checkout writes the initial timeline row in the same transaction as the order
and outgoing outbox event:

```java
OrderEntity saved = repository.save(order);
appendTimeline(saved, OrderTimelineStage.ORDER_CREATED,
        "Checkout accepted and order persisted");
outboxService.enqueue(...);
```

SAGA handlers append later stages as Inventory and Payment outcomes arrive:

```java
appendTimeline(order, OrderTimelineStage.INVENTORY_RESERVED,
        "Inventory reservation confirmed");
appendTimeline(order, OrderTimelineStage.PAYMENT_PROCESSING,
        "Payment processing started");
appendTimeline(order, OrderTimelineStage.PAYMENT_COMPLETED,
        "Payment reference " + paymentReference);
appendTimeline(order, OrderTimelineStage.ORDER_CONFIRMED,
        "Order confirmed");
```

The helper persists the row and increments a SAGA transition metric:

```java
private void appendTimeline(OrderEntity order,
                            OrderTimelineStage stage,
                            String detail) {
    timelineRepository.save(new OrderTimelineEvent(
            order.getOrderNumber(),
            order.getCorrelationId(),
            stage,
            detail
    ));

    meterRegistry.counter(
            "shopverse.saga.transitions",
            "stage", stage.name()
    ).increment();
}
```

The API returns the timeline in chronological order:

```java
List<OrderTimelineEvent> findAllByOrderNumberOrderByOccurredAtAsc(
        String orderNumber
);
```

```http
GET /api/v1/orders/{id}/timeline
Authorization: Bearer <token>
```

Access is owner-or-admin:

```java
@PreAuthorize("hasRole('ADMIN') or @orderAuthorization.isOwner(#id, authentication.name)")
```

### How It Helps

| Question | Timeline answer |
|---|---|
| Did checkout persist? | `ORDER_CREATED` exists |
| Did inventory reserve stock? | `INVENTORY_RESERVED` exists |
| Did inventory reject or expire reservation? | `INVENTORY_REJECTED` with detail |
| Did payment start? | `PAYMENT_PROCESSING` exists |
| Did payment complete? | `PAYMENT_COMPLETED` and `ORDER_CONFIRMED` exist |
| Why did the order fail? | `PAYMENT_FAILED` or `INVENTORY_REJECTED` detail |

The timeline is the business audit trail. Loki logs and Zipkin traces explain
technical execution; the timeline explains the durable order journey.

### Demo Query

```sql
SELECT order_number, correlation_id, stage, detail, occurred_at
FROM order_service.order_timeline_events
WHERE order_number = 'ORD-1001'
ORDER BY occurred_at;
```






