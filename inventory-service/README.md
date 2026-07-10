# Inventory Service

Inventory Service runs on port `8086`. It owns stock, reservations, expiry, overselling prevention, and inventory-side SAGA recovery.

## APIs

| Method | Path | Access |
|---|---|---|
| `GET` | `/api/v1/inventory/public/health` | public |
| `GET` | `/api/v1/inventory/public/items` | public |
| `GET` | `/api/v1/inventory/{productId}` | authenticated |
| `PUT` | `/api/v1/inventory/admin/items` | admin |
| `GET` | `/api/v1/inventory/admin/reservations/orders/{orderNumber}` | admin |
| `GET` | `/api/v1/inventory/admin/dead-letters` | admin |
| `POST` | `/api/v1/inventory/admin/dead-letters/{id}/replay` | admin |

Swagger is available at `/swagger-ui/index.html` when the service is reached
directly; use the [API guide](../documentation/docs/development/API-GUIDE.md)
for gateway-facing examples.

## Reservation Flow

The service consumes `shopverse.order.created`, verifies stock, creates a
reservation, decrements available quantity, and saves an inventory outcome to
the outbox. Payment failure releases the reservation. A scheduled expiry task
restores stock for reservations that exceed the configured five-minute TTL.

The current expiry worker is a single-worker baseline, not yet a complete
multi-replica-safe implementation. It has no atomic reservation claim, and
Inventory does not yet consume `payment.completed` to move successful
reservations out of `RESERVED`. The problem, race conditions, target state
machine, atomic-claim transaction, failure behavior, and required tests are in
[Multi-replica reservation expiry](../documentation/docs/reliability/problems/runtime/MULTI-REPLICA-RESERVATION-EXPIRY.md).

The same guide documents the unresolved late-payment race. Once expiry commits
and stock is released, a delayed `payment.completed` event must not resurrect
the reservation. The target choreography commits Inventory first or starts an
idempotent Payment refund workflow.

## Idempotent Consumer Behavior

Kafka can redeliver the same `order.created` business event. Inventory uses
`orderNumber` as the reservation business key. Before reserving stock, the
service checks whether a reservation already exists for that order. If it
exists, the duplicate event is treated as already handled and stock is not
decremented again.

`orderNumber` is used here because Inventory only receives the event after
Order Service has created the order. Kafka consumer ID, group ID, partition,
offset, and trace ID are runtime identifiers; they can change across retries,
rebalances, DLT, or replay and should not be used as the business duplicate
key.

## Concurrency

`InventoryItem` uses JPA `@Version`. Concurrent updates based on a stale version fail instead of silently overselling the last item. Reservation operations are transactional and use order number as the business key.

Liquibase seeds products `101` through `120`, including available, reserved, low-stock,
and unavailable examples. Each catalog record also contains `brand`, `model`,
`category`, `description`, `imageUrl`, and `imageKey`.

```powershell
docker compose exec mysql sh -lc '
  MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot inventory_service -e "
    SELECT product_id, product_name, available_quantity,
           reserved_quantity, version
    FROM inventory_items ORDER BY product_id;
  "
'
```

The `version` value increments on successful versioned updates. Concurrent
transactions using an older value are rejected and must restart the complete
idempotent reservation operation with freshly loaded state.

Administrators can inspect the reservation created for one order:

```http
GET /api/v1/inventory/admin/reservations/orders/{orderNumber}
Authorization: Bearer <admin-token>
```

Use this when debugging checkout, expiry, compensation, or late-payment
recovery flows.

## Product Images

Product media is stored in MinIO, while Inventory stores only the object key
and browser-facing URL. The local Compose stack starts MinIO on `9000`, its
console on `9001`, and a one-shot `minio-init` container that creates the
`shopverse-product-images` bucket and uploads `assets/products/products`.

`GET /api/v1/inventory/public/items` returns the URL the frontend can bind to
an image element. The browser then downloads the media directly from MinIO;
Inventory does not proxy image bytes.

```json
{
  "productId": 101,
  "brand": "KeyForge",
  "model": "SV-101-2026",
  "imageUrl": "http://localhost:9000/shopverse-product-images/products/101.png",
  "imageKey": "products/101.png"
}
```

MinIO credentials are set in the ignored `.env` file using `MINIO_ROOT_USER`
and `MINIO_ROOT_PASSWORD`. Do not expose root credentials to the frontend.

Verify media initialization after startup:

```powershell
docker compose ps minio minio-init
docker compose logs --tail=100 minio-init
Invoke-WebRequest -Method Head `
  -Uri "http://localhost:9000/shopverse-product-images/products/101.png"
```

`minio` should be healthy, `minio-init` should have completed successfully,
and the image request should return `200`. Re-run `minio-init` after changing
files under `assets/products/products`.

## Kafka Recovery

Listeners use `@RetryableTopic(attempts = "3")`. An unresolved event reaches `@DltHandler`, is persisted once with retry/replay audit, and can be replayed through the admin API.

## Configuration

`cloud-configs/INVENTORY-SERVICE.yml` defines datasource, cache, JWT, reservation TTL, expiry scan delay, RateLimiter, and Bulkhead.

## Tests And Observability

`test` covers unit/slice behavior; `integrationTest` uses MySQL and Kafka
Testcontainers for Liquibase, transaction, outbox, and publication checks.

```powershell
./gradlew test
./gradlew integrationTest
```

```logql
{log_type="application", application="INVENTORY-SERVICE"}
```

## Run

```powershell
./gradlew test
./gradlew bootRun
```

```powershell
docker compose build inventory-service
docker compose up -d inventory-service
```

## Related Guides

- [SAGA and outbox](../documentation/docs/reliability/SAGA-OUTBOX.md)
- [Transactional outbox pattern](../documentation/docs/reliability/OUTBOX-PATTERN.md)
- [Inbox pattern](../documentation/docs/reliability/INBOX-PATTERN.md)
- [SAGA code flow](../documentation/docs/reliability/SHOPVERSE-SAGA-CODE-FLOW.md)
- [Multi-replica reservation expiry](../documentation/docs/reliability/problems/runtime/MULTI-REPLICA-RESERVATION-EXPIRY.md)
- [Four reservations and two schedulers walkthrough](../documentation/docs/reliability/problems/runtime/MULTI-REPLICA-RESERVATION-EXPIRY.md#worked-example-four-reservations-and-two-schedulers)
- [Locking and work ownership](../documentation/docs/reliability/locking/LOCKING-AND-WORK-OWNERSHIP.md)
- [Scheduler locking with ShedLock](../documentation/docs/reliability/locking/SCHEDULER-LOCKING-SHEDLOCK.md)
- [Shopverse transaction boundaries](../documentation/docs/reliability/TRANSACTIONS.md)
- [Spring transactions](../documentation/docs/spring/SPRING-TRANSACTIONS.md)
- [Apache Kafka](../documentation/docs/integration/APACHE-KAFKA.md)
- [Spring Kafka](../documentation/docs/spring/SPRING-KAFKA.md)
- [Distributed systems](../documentation/docs/architecture/DISTRIBUTED-SYSTEMS.md)
- [Generic Resilience4j patterns](../documentation/docs/reliability/RESILIENCE4J-GENERIC.md)
- [Spring Resilience4j](../documentation/docs/spring/SPRING-RESILIENCE4J.md)
