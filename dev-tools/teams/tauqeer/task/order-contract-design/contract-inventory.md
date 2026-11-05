# Order-Service Contract Inventory

First deliverable from `senior-solutions-architect/contract-rollout-plan.md`
("Inventory REST operations, DTOs, events, producers, consumers, topic
keys, outbox storage, retries, DLT and replay. Capture current behavior
and explicit acceptance criteria."), scoped to order-service and its
direct Kafka counterparties. Captured 2026-11-05 as part of the
REST-contracts/MapStruct/Avro planning round. Resolves
[`OPEN-QUESTIONS.md`](../../../OPEN-QUESTIONS.md) #9.

## REST surface

`OrderController` (`/api/v1/orders`) -- public catalog read, customer order
read/checkout/cancel/return, admin order read/cancel/pack/ship/deliver,
catalog-cache eviction. Already migrated onto generated contract DTOs
from `shopverse-contracts` (`io.shopverse.contracts.order.*`) via a
hand-written `OrderContractMapper`, mapping to/from order-service's own
`io.shopverse.order.dto.*` application DTOs. (MapStruct adoption for this
mapper is this round's Step 1.)

## Kafka -- producer side (order-service publishes)

| Event | Class | Topic property | Enqueued from |
|---|---|---|---|
| `OrderCreatedEvent` | `io.shopverse.order.saga.OrderCreatedEvent` | `topics.orderCreated()` | `OrderServiceImpl` checkout path, via `OutboxService.enqueue("ORDER", orderNumber, "OrderCreatedEvent", topic, orderNumber, event)` |
| `OrderCancelledEvent` | `io.shopverse.order.saga.OrderCancelledEvent` | `topics.orderCancelled()` | `OrderServiceImpl.enqueueOrderCancelled(...)`, same outbox pattern |

Both go through `OutboxService` (transactional outbox: domain state +
event intent committed atomically, published asynchronously by the
platform's outbox worker) -- not a direct `KafkaTemplate.send()`. Both are
keyed by `orderNumber` (per-aggregate ordering).

## Kafka -- consumer side (order-service consumes)

`OrderSagaListener` (`services/order-service/.../saga/OrderSagaListener.java`):
`@KafkaListener` + `@RetryableTopic(attempts="3")` per topic --
`inventory-reserved`, `inventory-failed`, `payment-completed`,
`payment-failed` -- each parsed via the shared `KafkaEventParser`
(Jackson JSON, not Avro), run inside `CorrelationContext.run(event.correlationId(), ...)`.
A shared `@DltHandler` records failures to `FailedKafkaEventService` for
later replay.

## Cross-service event ownership (who else needs to know if order-service's wire format changes)

| Event | order-service | inventory-service | payment-service |
|---|---|---|---|
| `OrderCreatedEvent` | producer | **consumer** | -- |
| `OrderCancelledEvent` | producer | **consumer** | -- |
| `InventoryReservedEvent` | consumer | producer | consumer |
| `InventoryFailedEvent` | consumer | producer | -- |
| `PaymentCompletedEvent` | consumer | consumer | producer |
| `PaymentFailedEvent` | consumer | consumer | producer |

Each event type has its own duplicate POJO per service (matching
AGENTS.md's "event records are copied across producer and consumer
modules"). Any wire-format change to `OrderCreatedEvent`/`OrderCancelledEvent`
needs `inventory-service` on both sides of the change, not order-service
alone -- this is exactly why this round's Avro work stops at a
compile-only schema module and does not touch the live producer.

## Current wire format

Plain Jackson JSON via `KafkaEventParser` (`shopverse-kafka-starter`) --
no Avro, no schema registry anywhere in shipped code today. The only
`.avsc` in the repo is the draft at
`tauqeer/task/order-contract-design/order-created-event.avsc`, now being
moved into a real, compiling `shopverse-avro-schemas` module (this
round's Step 2) -- still not wired to the producer/consumer above.

## Outbox / retry / DLT / replay

- Outbox: `OutboxService` / outbox entity + repository, per-service
  (platform convention from `shopverse-outbox-starter`).
- Retry: `@RetryableTopic(attempts="3")` on the consumer side.
- DLT: shared `@DltHandler` -> `FailedKafkaEventService` (persisted,
  replayable via the recovery starter).
