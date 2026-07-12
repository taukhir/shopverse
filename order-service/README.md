# Order Service

Order Service runs on port `8083`. It owns checkout, order state, customer ownership, shipping snapshots, cancellation, fulfillment transitions, return requests, the business SAGA timeline, and Order-side outbox/DLT recovery.

## APIs

| Method | Path | Access |
|---|---|---|
| `GET` | `/api/v1/orders/public/health` | public |
| `GET` | `/api/v1/orders/public/catalog` | public |
| `GET` | `/api/v1/orders` | current customer |
| `GET` | `/api/v1/orders/{id}` | owner or admin |
| `GET` | `/api/v1/orders/{id}/timeline` | owner or admin |
| `POST` | `/api/v1/orders/checkout` | authenticated |
| `POST` | `/api/v1/orders/{id}/cancel` | owner |
| `POST` | `/api/v1/orders/{id}/return-request` | owner |
| `DELETE` | `/api/v1/orders/{id}` | admin |
| `GET` | `/api/v1/orders/admin/all` | admin route policy |
| `POST` | `/api/v1/orders/admin/{id}/cancel` | admin |
| `POST` | `/api/v1/orders/admin/{id}/pack` | admin |
| `POST` | `/api/v1/orders/admin/{id}/ship` | admin |
| `POST` | `/api/v1/orders/admin/{id}/deliver` | admin |
| `POST` | `/api/v1/orders/admin/catalog-cache/evict` | admin |
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
  "shippingAddress": {
    "recipientName": "Ahmed Khan",
    "phoneNumber": "+919876543210",
    "line1": "42 Market Road",
    "line2": "Apt 5",
    "city": "Bangalore",
    "state": "Karnataka",
    "postalCode": "560001",
    "country": "India"
  },
  "items": [
    { "productId": 101, "quantity": 1 }
  ]
}
```

Current validation allows one item. The shipping address is stored as an
immutable snapshot on the Order so later account-address edits do not alter
historical order records.

Fulfillment transitions:

```text
CONFIRMED -> PACKING -> SHIPPED -> OUT_FOR_DELIVERY -> DELIVERED -> RETURN_REQUESTED
```

The `/ship` endpoint advances `PACKING -> SHIPPED` and then
`SHIPPED -> OUT_FOR_DELIVERY` on the next call. Customer return requests are
allowed only from `DELIVERED`.

Swagger is available at `/swagger-ui/index.html` when the service is reached
directly; use the [API guide](../documentation/docs/development/API-GUIDE.md)
for gateway-facing examples.

## Persistence And Consistency

Order, items, shipping snapshot, initial timeline event, and outgoing outbox
event commit in one transaction. Reusing an idempotency key returns the
existing order. A database unique constraint protects concurrent duplicates.

Cancelling an order emits `OrderCancelledEvent` through the outbox. Inventory
Service consumes that event and releases any matching reserved stock.

## Queryable SAGA Timeline

Order Service stores important checkout transitions in
`order_timeline_events`. This is the durable business history for an order,
separate from logs and traces. It records stages such as `ORDER_CREATED`,
`INVENTORY_RESERVED`, `PAYMENT_PROCESSING`, `PAYMENT_COMPLETED`,
`ORDER_CONFIRMED`, `INVENTORY_REJECTED`, `PAYMENT_FAILED`, `ORDER_CANCELLED`,
`PACKING`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, and
`RETURN_REQUESTED`.

Read it through:

```http
GET /api/v1/orders/{id}/timeline
Authorization: Bearer <token>
```

The endpoint is owner-or-admin protected. Use the returned `correlationId` to
find related Loki logs and Zipkin traces.

The authorization rule, Spring method-security flow, repository ownership
query, `401`/`403` behavior, and tests are documented in
[Resource ownership authorization](../documentation/docs/reliability/problems/runtime/RESOURCE-OWNERSHIP-AUTHORIZATION.md).

## Idempotency And Kafka Keys

Checkout uses a caller-provided `Idempotency-Key` because the order ID and
order number do not exist before the first checkout request is saved. If the
client times out after Order Service commits, the client can retry with the
same key and receive the existing order instead of creating another one.

After the order exists, SAGA events use `orderNumber` as the Kafka message key.
That key keeps events for the same order on the same Kafka partition for
per-order ordering. It does not deduplicate records by itself; downstream
services still need idempotent business handling.

The outbox publisher sends `order.created`. Listeners consume inventory and payment outcomes and append timeline stages.

Currently `payment.completed` confirms the Order directly. The target
late-payment-safe choreography records payment completion but confirms only
after Inventory atomically commits the reservation and emits
`inventory.committed`. If expiry wins, Order follows refund/cancellation
recovery instead. See
[Reservation expiry and late-payment recovery](../documentation/docs/reliability/problems/runtime/MULTI-REPLICA-RESERVATION-EXPIRY.md).

Liquibase also inserts nine historical demonstration orders, from
`DEMO-ORD-1001` through `DEMO-ORD-1009`. They cover confirmation, payment
failure, inventory rejection, timeout, cancellation, refund, multi-item history,
and reservation expiry, supporting immediate API and SQL
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
- [Transactional outbox pattern](../documentation/docs/reliability/OUTBOX-PATTERN.md)
- [Inbox pattern](../documentation/docs/reliability/INBOX-PATTERN.md)
- [SAGA code flow](../documentation/docs/reliability/SHOPVERSE-SAGA-CODE-FLOW.md)
- [API guide](../documentation/docs/development/API-GUIDE.md)
- [Resource ownership authorization](../documentation/docs/reliability/problems/runtime/RESOURCE-OWNERSHIP-AUTHORIZATION.md)
- [Reservation expiry and late-payment recovery](../documentation/docs/reliability/problems/runtime/MULTI-REPLICA-RESERVATION-EXPIRY.md)
- [Transactions](../documentation/docs/reliability/TRANSACTIONS.md)
- [Spring transactions](../documentation/docs/spring/SPRING-TRANSACTIONS.md)
- [Spring Cloud OpenFeign](../documentation/docs/spring/SPRING-OPENFEIGN.md)
- [MDC and tracing](../documentation/docs/observability/MDC-CORRELATION-TRACING.md)
- [Generic Resilience4j patterns](../documentation/docs/reliability/RESILIENCE4J-GENERIC.md)
- [Spring Resilience4j](../documentation/docs/spring/SPRING-RESILIENCE4J.md)
