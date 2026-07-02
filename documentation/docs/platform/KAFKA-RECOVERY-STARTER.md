---
title: Kafka Recovery Starter
---

# Kafka Recovery Starter

Back to [Platform Infrastructure](./README.md).

## Status

Implemented.

## Purpose

Use `shopverse-kafka-recovery-starter` to share failed Kafka event recording,
deduplication, replay orchestration, metrics, and common recovery exceptions.

## Problem

Order, Payment, and Inventory repeated failed Kafka event persistence,
deduplication, listing, replay payload parsing, replay outbox enqueueing, replay
marking, and DLT metrics.

## When To Use

Use this starter in services that persist failed Kafka events and support replay
through a service-owned controller or admin endpoint.

Do not move failed-event JPA entities, repositories, response DTOs, or replay
authorization rules into the platform module.

## Solution

`shopverse-kafka-recovery-starter` provides:

- `FailedKafkaEventRecord`
- `FailedKafkaEventStore`
- `KafkaReplayOutbox`
- `KafkaRecoveryService`
- `KafkaRecoveryProperties`
- recovery auto-configuration

## Used By

- `order-service`
- `payment-service`
- `inventory-service`

## Gradle Dependency

```groovy
dependencies {
    implementation 'io.shopverse.platform:shopverse-kafka-recovery-starter:0.0.1-SNAPSHOT'
}
```

## Service-Owned Code

Each service still owns:

- failed-event JPA entity
- failed-event repository
- failed-event response DTO
- recovery controller endpoint
- local adapters for `FailedKafkaEventStore` and `KafkaReplayOutbox`

## Configuration Properties

Prefix:

```yaml
shopverse:
  kafka-recovery:
```

| Property | Default | Purpose |
|---|---:|---|
| `service-name` | `unknown` | Service tag for recovery logs and metrics. |
| `replay-metric-name` | `shopverse.kafka.dlt.replays` | Counter name for replay attempts. |
| `failed-metric-name` | `shopverse.kafka.dlt.events` | Counter name for recorded failed events. |

## Migration Steps

Add the dependency.

```groovy
dependencies {
    implementation 'io.shopverse.platform:shopverse-kafka-recovery-starter:0.0.1-SNAPSHOT'
}
```

Configure the service name used in metrics and logs.

```yaml
shopverse:
  kafka-recovery:
    service-name: payment
```

Keep the service's failed-event entity and repository. Add an adapter that
implements `FailedKafkaEventStore`.

```java
import io.shopverse.platform.kafka.recovery.FailedKafkaEventRecord;
import io.shopverse.platform.kafka.recovery.FailedKafkaEventStore;

@Service
@RequiredArgsConstructor
class PaymentFailedKafkaEventStore implements FailedKafkaEventStore {

    private final FailedKafkaEventRepository repository;

    @Override
    public boolean existsUnreplayed(String sourceTopic, String payload) {
        return repository.existsBySourceTopicAndPayloadAndReplayedFalse(
                sourceTopic,
                payload
        );
    }

    @Override
    public void saveFailed(String sourceTopic, String payload, String reason, int retryCount) {
        repository.save(new FailedKafkaEvent(sourceTopic, payload, reason, retryCount));
    }

    @Override
    public List<FailedKafkaEventRecord> findAll() {
        return repository.findAllByOrderByFailedAtDesc().stream()
                .map(this::toRecord)
                .toList();
    }

    private FailedKafkaEventRecord toRecord(FailedKafkaEvent event) {
        return new FailedKafkaEventRecord(
                event.getId(),
                event.getSourceTopic(),
                event.getPayload(),
                event.getFailureReason(),
                event.getRetryCount(),
                event.isReplayed(),
                event.getReplayCount(),
                event.getLastReplayedBy(),
                event.getFailedAt(),
                event.getReplayedAt()
        );
    }
}
```

Add a replay adapter that tells the platform how to enqueue a replay event into
the service-owned outbox.

```java
import io.shopverse.platform.kafka.recovery.FailedKafkaEventRecord;
import io.shopverse.platform.kafka.recovery.KafkaReplayOutbox;

@Service
@RequiredArgsConstructor
class PaymentKafkaReplayOutbox implements KafkaReplayOutbox {

    private final OutboxService outboxService;

    @Override
    public void enqueueReplay(
            FailedKafkaEventRecord failedEvent,
            Object payload,
            String messageKey,
            String correlationId
    ) {
        outboxService.enqueue(
                "FAILED_KAFKA_EVENT",
                failedEvent.id().toString(),
                "KafkaEventReplay",
                failedEvent.sourceTopic(),
                messageKey,
                payload,
                correlationId
        );
    }
}
```

Replace the duplicated recovery service implementation with a facade over
`KafkaRecoveryService`.

```java
@Service
@RequiredArgsConstructor
class FailedKafkaEventService {

    private final KafkaRecoveryService recoveryService;

    public void recordFailure(String sourceTopic, String payload, Exception cause, int retryCount) {
        recoveryService.recordFailure(sourceTopic, payload, cause, retryCount);
    }

    public FailedKafkaEventResponse replay(Long id, String replayedBy) {
        try {
            return toResponse(recoveryService.replay(id, replayedBy));
        } catch (FailedKafkaEventNotFoundException ex) {
            throw new ResourceNotFoundException(ex.getMessage());
        }
    }
}
```

After this change, duplicate deduplication checks, payload parsing, replay
enqueueing, replay marking, metrics, and common error handling live in the
starter.

## Verification

Run recovery tests:

```powershell
.\gradlew.bat test --no-daemon
```

Then verify a runtime replay path with a known failed event:

```powershell
docker compose --profile apps up -d order-service payment-service inventory-service
docker logs shopverse-payment-service --tail 100
```

Check:

- duplicate failed payloads are not stored as unreplayed duplicates
- replay enqueues through the service-owned outbox adapter
- replay metadata is updated
- replay and failed-event metrics use the configured service name

## Troubleshooting

| Symptom | Check |
|---|---|
| `KafkaRecoveryService` bean is missing | The starter dependency is missing, or required adapters are not present. |
| Failed events are not saved | Check the service `FailedKafkaEventStore` adapter and repository method names. |
| Replay does not publish | Check the `KafkaReplayOutbox` adapter and the outbox starter path. |
| Replay endpoint returns the wrong DTO | Keep the controller and response DTO local and map from `FailedKafkaEventRecord`. |
| Metrics are tagged as `unknown` | Set `shopverse.kafka-recovery.service-name`. |

## Related Docs

- [Kafka Event Parsing](./KAFKA-PARSING.md)
- [Outbox Starter](./OUTBOX-STARTER.md)
- [Spring Kafka Retry, DLT, Recovery](../spring/kafka/SPRING-KAFKA-RETRY-DLT-RECOVERY.md)
- [Config Property Reference](./CONFIG-PROPERTIES.md)
