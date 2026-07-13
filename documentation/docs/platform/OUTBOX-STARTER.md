---
title: Outbox Starter
status: "maintained"
last_reviewed: "2026-07-13"
---

# Outbox Starter

Back to [Platform Infrastructure](./README.md).

## Status

Implemented.

## Purpose

Use `shopverse-outbox-starter` to share outbox polling, claiming, Kafka
publishing, stale-claim release, metrics, and common logging while leaving
domain event creation and schema ownership inside each service.

## Problem

Order, Payment, and Inventory repeated outbox polling, stale claim release,
claim/publish/mark-failed logic, Kafka send handling, metrics, and logging.

## When To Use

Use this starter in services that own an outbox table and publish domain events
to Kafka.

Do not use it to move service-owned outbox entities, repositories, or domain
event payloads into `shopverse-platform`.

## Solution

`shopverse-outbox-starter` provides:

- `OutboxMessage`
- `KafkaPublishMetadata`
- `OutboxEventStore`
- `ShopverseOutboxPublisher`
- `ShopverseOutboxPublishWorker`
- `OutboxPublisherProperties`
- outbox auto-configuration

## Used By

- `order-service`
- `payment-service`
- `inventory-service`

## Gradle Dependency

```groovy
dependencies {
    implementation 'io.shopverse.platform:shopverse-outbox-starter:0.0.1-SNAPSHOT'
}
```

## Service-Owned Code

Each service still owns:

- `OutboxEvent`
- `OutboxEventRepository`
- `OutboxStatus`
- Liquibase schema
- domain event creation through local `OutboxService`
- an adapter implementing `OutboxEventStore`

## Configuration Properties

Prefix:

```yaml
shopverse:
  outbox:
```

| Property | Default | Purpose |
|---|---:|---|
| `batch-size` | `50` | Maximum pending event IDs loaded per publish cycle. |
| `publish-delay-ms` | `1000` | Delay between scheduled publish cycles. |
| `claim-timeout-ms` | `30000` | Processing claim age after which the starter releases stale claims. |
| `send-timeout-seconds` | `10` | Maximum wait for Kafka send completion. |

## Migration Steps

Add the dependency.

```groovy
dependencies {
    implementation 'io.shopverse.platform:shopverse-outbox-starter:0.0.1-SNAPSHOT'
}
```

Keep the service's existing outbox entity and repository. Add a small adapter
that maps service-owned rows to platform messages.

```java
import io.shopverse.platform.outbox.KafkaPublishMetadata;
import io.shopverse.platform.outbox.OutboxEventStore;
import io.shopverse.platform.outbox.OutboxMessage;

@Service
@RequiredArgsConstructor
class PaymentOutboxEventStore implements OutboxEventStore {

    private final OutboxEventRepository repository;
    private final TransactionTemplate transactionTemplate;

    @Override
    public List<Long> pendingEventIds(int batchSize) {
        return repository.findTop50ByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING)
                .stream()
                .limit(batchSize)
                .map(OutboxEvent::getId)
                .toList();
    }

    @Override
    public OutboxMessage claim(Long eventId) {
        return transactionTemplate.execute(status -> {
            OutboxEvent event = repository.findByIdForUpdate(eventId).orElse(null);
            if (event == null || event.getStatus() != OutboxStatus.PENDING) {
                return null;
            }
            event.claim();
            return toMessage(event);
        });
    }

    @Override
    public void markPublished(Long eventId, KafkaPublishMetadata metadata) {
        transactionTemplate.executeWithoutResult(status ->
                repository.findByIdForUpdate(eventId)
                        .filter(event -> event.getStatus() == OutboxStatus.PROCESSING)
                        .ifPresent(OutboxEvent::markPublished)
        );
    }

    private OutboxMessage toMessage(OutboxEvent event) {
        return new OutboxMessage(
                event.getId(),
                event.getAggregateId(),
                event.getEventType(),
                event.getTopic(),
                event.getMessageKey(),
                event.getPayload(),
                event.getCorrelationId()
        );
    }
}
```

Delete the local `OutboxPublisher` after the adapter is in place. The starter
now owns:

- polling pending IDs
- claiming a row
- publishing to Kafka
- marking published or failed
- releasing stale claims
- common metrics and logs

The service still decides when to enqueue domain events.

```java
outboxService.enqueue(
        payment.getId().toString(),
        "PaymentCompleted",
        "payment.completed",
        payment.getId().toString(),
        new PaymentCompletedEvent(...),
        correlationId
);
```

## Verification

Run service tests:

```powershell
.\gradlew.bat test --no-daemon
```

Then verify the runtime path:

```powershell
docker compose --profile apps up -d order-service payment-service inventory-service
docker logs shopverse-order-service --tail 100
```

Check:

- pending rows are claimed once
- published rows move to the published state
- failed sends are marked failed
- stale processing rows are released after `claim-timeout-ms`
- outbox metrics still appear in the metrics endpoint

## Troubleshooting

| Symptom | Check |
|---|---|
| `OutboxEventStore` bean missing | The service must provide an adapter because the starter does not own service tables. |
| Events are not published | Check scheduler settings, `shopverse.outbox.publish-delay-ms`, Kafka health, and adapter query methods. |
| Rows stay `PROCESSING` | Check stale-claim release and `claim-timeout-ms`. |
| Duplicate publishes | Check claim queries use row locking or atomic status updates. |
| Domain event shape is requested in platform | Keep domain payloads in the owning service. |

## Related Docs

- [Transactional Outbox Pattern](../reliability/OUTBOX-PATTERN.md)
- [Shopverse SAGA And Outbox](../reliability/SAGA-OUTBOX.md)
- [Config Property Reference](./CONFIG-PROPERTIES.md)
- [Runtime Optimization](../reliability/problems/optimization/RUNTIME-OPTIMIZATION.md)
