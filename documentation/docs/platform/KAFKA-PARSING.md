---
title: Kafka Event Parsing
---

# Kafka Event Parsing

Back to [Platform Infrastructure](./README.md).

## Status

Implemented.

## Purpose

Use `shopverse-kafka-starter` to centralize Kafka listener JSON parsing and
consistent parse exceptions.

## Problem

Saga listeners repeated `ObjectMapper.readValue` and `JsonProcessingException`
wrapping for every event payload.

## When To Use

Use this starter in services that consume Kafka messages and parse JSON
payloads into service-owned event records.

Do not move event payload records into the platform module. Event contracts
remain owned by the publishing/consuming services.

## Solution

`shopverse-kafka-starter` provides:

- `KafkaEventParser`
- `KafkaEventParseException`
- parser auto-configuration

## Used By

- `order-service`
- `payment-service`
- `inventory-service`

## Gradle Dependency

```groovy
dependencies {
    implementation 'io.shopverse.platform:shopverse-kafka-starter:0.0.1-SNAPSHOT'
}
```

## Service-Owned Code

Event payload records and listener business handling remain service-owned.

## Configuration Properties

None. The starter auto-configures `KafkaEventParser` from the existing
application `ObjectMapper`.

## Migration Steps

Add the dependency.

```groovy
dependencies {
    implementation 'io.shopverse.platform:shopverse-kafka-starter:0.0.1-SNAPSHOT'
}
```

Inject `KafkaEventParser` into listeners.

```java
import io.shopverse.platform.kafka.KafkaEventParser;
import io.shopverse.platform.observability.CorrelationContext;

@Service
@RequiredArgsConstructor
class PaymentSagaListener {

    private final KafkaEventParser eventParser;

    @KafkaListener(topics = "inventory.reserved")
    void onInventoryReserved(String payload) {
        InventoryReservedEvent event = eventParser.parse(
                payload,
                InventoryReservedEvent.class
        );

        CorrelationContext.run(
                event.correlationId(),
                () -> handleInventoryReserved(event)
        );
    }
}
```

Remove repeated listener code like this:

```java
try {
    InventoryReservedEvent event = objectMapper.readValue(
            payload,
            InventoryReservedEvent.class
    );
    handleInventoryReserved(event);
} catch (JsonProcessingException ex) {
    throw new IllegalArgumentException("Invalid Kafka event payload", ex);
}
```

Keep payload records local. For example, `InventoryReservedEvent` belongs to the
service contract that consumes or publishes that event, not to the platform
library.

## Verification

Run listener tests:

```powershell
.\gradlew.bat test --no-daemon
```

Check:

- valid payloads parse into the expected service-owned record
- invalid payloads throw `KafkaEventParseException`
- correlation IDs are still carried into message handling where needed

## Troubleshooting

| Symptom | Check |
|---|---|
| `KafkaEventParser` bean is missing | The starter dependency or platform composite build is missing. |
| Date/time parsing changed | Confirm the application `ObjectMapper` has the same modules as before. |
| Invalid payload handling changed | Update listener tests to expect `KafkaEventParseException` instead of local wrapper exceptions. |
| Event type appears to belong in platform | Keep domain event records service-owned unless the event is truly infrastructure-only. |

## Related Docs

- [Spring Kafka Consumers](../spring/kafka/SPRING-KAFKA-CONSUMERS.md)
- [Kafka Recovery Starter](./KAFKA-RECOVERY-STARTER.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
