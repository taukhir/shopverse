# Order Service

Order Service runs on port `8083`. It owns checkout, order state, customer ownership, the business SAGA timeline, and Order-side outbox/DLT recovery.

## APIs

| Method | Path | Access |
|---|---|---|
| `GET` | `/api/v1/orders/public/health` | public |
| `GET` | `/api/v1/orders/public/catalog` | public |
| `GET` | `/api/v1/orders` | current customer |
| `GET` | `/api/v1/orders/{id}` | owner or admin |
| `GET` | `/api/v1/orders/{id}/timeline` | owner or admin |
| `POST` | `/api/v1/orders/checkout` | authenticated |
| `DELETE` | `/api/v1/orders/{id}` | admin |
| `GET` | `/api/v1/orders/admin/all` | admin route policy |
| `GET` | `/api/v1/orders/admin/dead-letters` | admin |
| `POST` | `/api/v1/orders/admin/dead-letters/{id}/replay` | admin |

Checkout:

```http
POST /api/v1/orders/checkout
Authorization: Bearer <token>
Idempotency-Key: checkout-user-42-cart-9001
X-Correlation-Id: demo-checkout-9001
Content-Type: application/json

{
  "items": [
    { "productId": 101, "quantity": 1 }
  ]
}
```

Current validation allows one item.

## Persistence And Consistency

Order, items, initial timeline event, and outgoing outbox event commit in one transaction. Reusing an idempotency key returns the existing order. A database unique constraint protects concurrent duplicates.

The outbox publisher sends `order.created`. Listeners consume inventory and payment outcomes and append timeline stages.

## Communication

- synchronous: Feign catalog lookup to `INVENTORY-SERVICE`, protected by Retry and CircuitBreaker;
- asynchronous: Kafka SAGA events through transactional outbox.

## Caching And Resilience

Order and catalog reads use local Spring Cache. Controller access uses RateLimiter and semaphore Bulkhead. These settings are defined in `cloud-configs/ORDER-SERVICE.yml`.

## Run

```powershell
./gradlew test
./gradlew bootRun
```

```powershell
docker compose build order-service
docker compose up -d order-service
```

## Related Guides

- [SAGA and outbox](../docs/reliability/SAGA-OUTBOX.md)
- [API guide](../docs/development/API-GUIDE.md)
- [Transactions](../docs/reliability/TRANSACTIONS.md)
- [MDC and tracing](../docs/observability/MDC-CORRELATION-TRACING.md)
