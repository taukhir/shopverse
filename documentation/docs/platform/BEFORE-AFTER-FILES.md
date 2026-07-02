# Before And After File Inventory

This page records what changed when duplicate infrastructure logic moved into
platform modules.

## Observability

Removed local servlet filter implementations:

| Service | Removed files | Replacement |
|---|---|---|
| `user-service` | local `observability/CorrelationConstants.java`, `CorrelationContext.java`, `RequestLoggingFilter.java` | `shopverse-observability-starter` |
| `order-service` | `src/main/java/io/shopverse/order/observability/CorrelationConstants.java`, `CorrelationContext.java`, `RequestLoggingFilter.java` | `shopverse-observability-starter` |
| `payment-service` | `src/main/java/io/shopverse/payment_service/observability/CorrelationConstants.java`, `CorrelationContext.java`, `RequestLoggingFilter.java` | `shopverse-observability-starter` |
| `inventory-service` | `src/main/java/io/shopverse/inventory_service/observability/CorrelationConstants.java`, `CorrelationContext.java`, `RequestLoggingFilter.java` | `shopverse-observability-starter` |

Server services also consume the same starter:

- `auth-service`
- `config-server`
- `discovery-server`

`api-gateway` was not migrated because it is reactive WebFlux.

## Security

Before:

- services repeated JWT resource-server setup
- services repeated role and permission claim mapping
- services repeated issuer and JWKS decoder wiring

After:

- `shopverse-security-starter` provides the shared `JwtAuthenticationConverter`
- `shopverse-security-starter` provides the shared `JwtDecoder`
- each service keeps its own `SecurityFilterChain`

Updated services:

- `user-service`
- `order-service`
- `payment-service`
- `inventory-service`

## Kafka Event Parsing

Before:

- saga listeners used repeated `ObjectMapper.readValue(...)`
- each listener wrapped `JsonProcessingException` locally

After:

- listeners inject `KafkaEventParser`
- parse failures use `KafkaEventParseException`

Updated listeners:

- `order-service/src/main/java/io/shopverse/order/saga/OrderSagaListener.java`
- `payment-service/src/main/java/io/shopverse/payment_service/saga/PaymentSagaListener.java`
- `inventory-service/src/main/java/io/shopverse/inventory_service/saga/InventorySagaListener.java`

## Outbox

Removed local publishers:

| Service | Removed file | Added adapter |
|---|---|---|
| `order-service` | `src/main/java/io/shopverse/order/outbox/OutboxPublisher.java` | `OrderOutboxEventStore.java` |
| `payment-service` | `src/main/java/io/shopverse/payment_service/outbox/OutboxPublisher.java` | `PaymentOutboxEventStore.java` |
| `inventory-service` | `src/main/java/io/shopverse/inventory_service/outbox/OutboxPublisher.java` | `InventoryOutboxEventStore.java` |

The starter now owns the publish loop, stale-claim release, Kafka send, and
common outbox metrics.

## Kafka Recovery

Before:

- each service had its own failed-event deduplication
- each service parsed replay payloads locally
- each service enqueued replay events locally
- each service marked failed records as replayed locally
- each service emitted DLT metrics locally

After:

- `shopverse-kafka-recovery-starter` owns the shared recovery workflow
- services keep small facades around `KafkaRecoveryService`
- services provide repository and outbox adapters

Adapters added:

| Service | Failed-event adapter | Replay outbox adapter |
|---|---|---|
| `order-service` | `OrderFailedKafkaEventStore.java` | `OrderKafkaReplayOutbox.java` |
| `payment-service` | `PaymentFailedKafkaEventStore.java` | `PaymentKafkaReplayOutbox.java` |
| `inventory-service` | `InventoryFailedKafkaEventStore.java` | `InventoryKafkaReplayOutbox.java` |

## Common Error And Web

Before:

- error DTO and pagination helper code lived in service modules

After:

- `shopverse-common-error` provides `ApiErrorResponse`
- `shopverse-web` provides `PageResponse`, `PageMapper`, `PaginationUtils`, and `InvalidPageRequestException`

Currently used by:

- `user-service`
