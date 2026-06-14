# Shopverse Checkout SAGA Runbook

Shopverse implements a Kafka choreography SAGA across Order, Inventory, and
Payment. Each service owns its database and uses a transactional outbox for
reliable event publication.

Canonical documentation:

- [Shopverse SAGA code flow](../documentation/docs/reliability/SHOPVERSE-SAGA-CODE-FLOW.md)
- [SAGA and outbox architecture](../documentation/docs/reliability/SAGA-OUTBOX.md)
- [Generic SAGA and outbox patterns](../documentation/docs/reliability/SAGA-GENERIC.md)
- [Transactions](../documentation/docs/reliability/TRANSACTIONS.md)

## Success Flow

```text
ORDER_CREATED
  -> INVENTORY_RESERVED
  -> PAYMENT_PROCESSING
  -> PAYMENT_COMPLETED
  -> ORDER_CONFIRMED
```

Failure paths persist the failed/pending state and publish compensation events
where required. Inventory is released after payment failure or reservation
expiry.

## Main Topics

| Topic | Producer | Consumer |
|---|---|---|
| `shopverse.order.created` | Order | Inventory |
| `shopverse.inventory.reserved` | Inventory | Payment |
| `shopverse.inventory.failed` | Inventory | Order |
| `shopverse.payment.completed` | Payment | Order |
| `shopverse.payment.failed` | Payment | Order and Inventory |

Retry topics and dead-letter topics are created by Spring Kafka according to
listener retry configuration.

## Trigger Checkout

```powershell
$token = "<customer-jwt>"

curl.exe -X POST http://localhost:8080/api/v1/orders/checkout `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -H "Idempotency-Key: checkout-demo-101" `
  -H "X-Correlation-Id: checkout-demo-101" `
  -d '{"items":[{"productId":101,"quantity":1}]}'
```

The endpoint is authenticated. `Idempotency-Key` prevents duplicate checkout
creation, and `X-Correlation-Id` links HTTP and Kafka logs.

## Verify

1. Query the returned order and timeline through the authenticated Order API.
2. Wait for `ORDER_CONFIRMED`, a failure state, or a pending payment state.
3. Confirm outbox rows become `PUBLISHED` in each participating service.
4. Search Loki:

```logql
{log_type="application"} |= "checkout-demo-101"
```

5. Repeat the same checkout with the same idempotency key and verify the
   existing order is returned.

## Failure And Recovery Checks

- request more inventory than available and verify `inventory.failed`;
- configure/simulate payment failure and verify reservation compensation;
- send a poison event and verify bounded retries followed by DLT persistence;
- replay an authorized recovery record and verify replay audit fields;
- allow an unpaid reservation to expire and verify stock is restored.

## Implementation Rules

- domain state and outgoing outbox row commit in one local transaction;
- Kafka publication runs after the database claim transaction releases locks;
- consumers must be idempotent because Kafka delivery is at least once;
- listener correlation context is installed in MDC and always cleaned up;
- `@KafkaListener` already runs on managed consumer threads, so `@Async` is not
  added around listener methods;
- replay is authorized, audited, bounded, and idempotent.

## Code Locations

| Responsibility | Service |
|---|---|
| checkout, order state, timeline, final outcome | `order-service` |
| reservation, expiry, compensation | `inventory-service` |
| payment state and reconciliation | `payment-service` |
| topic/retry configuration | centralized `cloud-configs` and service config records |
| shared event contracts | participating service event packages |

See the [code-flow page](../documentation/docs/reliability/SHOPVERSE-SAGA-CODE-FLOW.md) for
annotated listener, outbox, transaction, retry, and DLT snippets.
