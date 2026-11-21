# Synthetic Checkout Architecture Evidence

This fixture is intentionally concise. Paths refer to the real repository areas
an investigator should verify when running against ShopVerse.

| Evidence | Observation |
|---|---|
| `README.md#checkout-example` | Gateway accepts a priced checkout quote, then a `place-order` call with `Idempotency-Key` and `X-Correlation-Id`. |
| `services/order-service/.../OrderServiceImpl.java#checkout` | A new Order and initial outbox record are written in the local Order transaction when `place-order` confirms the checkout. |
| `services/order-service/.../OrderSagaListener.java` | Order observes inventory and payment results and records timeline transitions. |
| `services/inventory-service/.../InventorySagaListener.java` | Inventory consumes `OrderCreated`, reserves stock, and emits success or failure through its outbox. |
| `services/payment-service/.../PaymentSagaListener.java` | Payment consumes `InventoryReserved` and emits payment completion or failure through its outbox. |
| `docs/architecture/adr/002-kafka-choreography-saga.md` | Services use Kafka choreography rather than a distributed database transaction. |
| `https://taukhir.github.io/shopverse-docs/reliability/SAGA-OUTBOX` | Compensation reverses completed business work; it is not a global rollback. |

Assume Kafka delivery is at least once. The aggregate/order number is used as the
ordering key. No evidence in this fixture establishes a global exactly-once
guarantee or an inbox table in every consumer.
