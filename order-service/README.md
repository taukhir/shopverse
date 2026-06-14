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

Liquibase also inserts three historical demonstration orders:
`DEMO-ORD-1001` (confirmed), `DEMO-ORD-1002` (payment failed), and
`DEMO-ORD-1003` (inventory rejected). They support immediate API and SQL
exploration but do not publish Kafka events during migration.

```powershell
docker compose exec mysql sh -lc '
  MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot order_service -e "
    SELECT order_number, customer_username, status, correlation_id
    FROM orders ORDER BY created_at DESC;
    SELECT order_number, stage, detail, occurred_at
    FROM order_timeline_events ORDER BY order_number, occurred_at;
  "
'
```

## Communication

- synchronous: Feign catalog lookup to `INVENTORY-SERVICE`, protected by Retry and CircuitBreaker;
- asynchronous: Kafka SAGA events through transactional outbox.

## Caching And Resilience

Order and catalog reads use local Spring Cache. Controller access uses RateLimiter and semaphore Bulkhead. These settings are defined in `cloud-configs/ORDER-SERVICE.yml`.

## Configuration

`cloud-configs/ORDER-SERVICE.yml` owns datasource, JWT, Kafka topics, outbox,
cache, Feign, resilience, metrics, tracing, and logging settings.

## Tests And Observability

```powershell
./gradlew test
./gradlew integrationTest
```

```logql
{log_type="application", application="ORDER-SERVICE"}
```

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

- [SAGA and outbox](../documentation/docs/reliability/SAGA-OUTBOX.md)
- [SAGA code flow](../documentation/docs/reliability/SHOPVERSE-SAGA-CODE-FLOW.md)
- [API guide](../documentation/docs/development/API-GUIDE.md)
- [Transactions](../documentation/docs/reliability/TRANSACTIONS.md)
- [Spring transactions](../documentation/docs/spring/SPRING-TRANSACTIONS.md)
- [Spring Cloud OpenFeign](../documentation/docs/spring/SPRING-OPENFEIGN.md)
- [MDC and tracing](../documentation/docs/observability/MDC-CORRELATION-TRACING.md)
- [Generic Resilience4j patterns](../documentation/docs/reliability/RESILIENCE4J-GENERIC.md)
- [Spring Resilience4j](../documentation/docs/spring/SPRING-RESILIENCE4J.md)
