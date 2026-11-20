# Inventory Service

Inventory Service runs on port `8086`. It owns the public product catalog, product metadata, stock, reservations, expiry, overselling prevention, cancellation release, and inventory-side SAGA recovery.

## APIs

| Method | Path | Access |
|---|---|---|
| `GET` | `/api/v1/inventory/public/health` | public |
| `GET` | `/api/v1/inventory/public/items` | public |
| `GET` | `/api/v1/inventory/public/items/{productId}` | public |
| `GET` | `/api/v1/inventory/public/items/{productId}/related` | public |
| `GET` | `/api/v1/inventory/public/categories` | public |
| `GET` | `/api/v1/inventory/{productId}` | authenticated |
| `PUT` | `/api/v1/inventory/admin/items` | admin |
| `POST` | `/api/v1/inventory/admin/items/{productId}/image` | admin |
| `GET` | `/api/v1/inventory/admin/reservations/orders/{orderNumber}` | admin |
| `GET` | `/api/v1/inventory/admin/dead-letters` | admin |
| `POST` | `/api/v1/inventory/admin/dead-letters/{id}/replay` | admin |

Swagger is available at `/swagger-ui/index.html` when the service is reached
directly; use the [API guide](../../docs/development/API-GUIDE.md)
for gateway-facing examples.

## Reservation Flow

The service consumes `shopverse.order.created`, verifies stock, creates a
reservation, decrements available quantity, and saves an inventory outcome to
the outbox. Payment failure and order cancellation release the reservation.
A scheduled expiry task restores stock for reservations that exceed the
configured five-minute TTL.

Expiry scans use pessimistic row locks so overlapping replicas do not release
the same reservation concurrently. Inventory consumes `payment.completed` and
moves successful reservations to `CONFIRMED`, which is not eligible for expiry.
The problem, race conditions, target state machine, claim/lease alternatives,
failure behavior, and required tests are in
[Multi-replica reservation expiry](https://taukhir.github.io/shopverse-docs/reliability/problems/runtime/MULTI-REPLICA-RESERVATION-EXPIRY).

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

Administrators can upload or replace a product image:

```http
POST /api/v1/inventory/admin/items/{productId}/image
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data
```

## Public Catalog APIs

The Angular UI now reads product browsing data directly from Inventory:

```http
GET /api/v1/inventory/public/items
GET /api/v1/inventory/public/items/{productId}
GET /api/v1/inventory/public/items/{productId}/related
GET /api/v1/inventory/public/categories
```

Related products are selected by category and ordered by available quantity.
Server-side search, filtering, pagination, and richer recommendation scoring
remain hardening items.

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

The current expiry worker is a single-worker baseline. Do not run unrestricted
multi-replica expiry until work ownership is protected with a database claim,
fencing/lease mechanism, or another proven single-owner design.

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

Alert on negative-stock invariant violations, optimistic-lock conflicts,
reservation failure rate, expired reservations awaiting release, outbox/DLT age,
MinIO failures, and datasource saturation. Reconciliation should compare active
reservations, order terminal state, and available stock before an operator changes
inventory.

Known POC limits: expiry ownership is not multi-replica safe and inbox tables are
not implemented. The deterministic AI suite reviews concurrency/expiry reasoning;
service-level Testcontainers concurrency evidence is still required.

## Run

```powershell
./gradlew test
./gradlew bootRun
```

```powershell
docker compose build inventory-service
docker compose up -d inventory-service
```

## AI-Assisted Development

This module has scoped [`AGENTS.md`](AGENTS.md) guidance imported by
[`CLAUDE.md`](CLAUDE.md). Useful reviewed workflows include:

- [Kafka consumer review](../../dev-tools/ai-workflows/prompts/review-kafka-consumer.md)
- [Distributed checkout debugging](../../dev-tools/ai-workflows/prompts/debug-distributed-checkout.md)
- [Performance optimization](../../dev-tools/ai-workflows/prompts/optimize-performance.md)
- [Incident investigation](../../dev-tools/ai-workflows/prompts/incident-investigation.md)

AI changes must preserve non-negative stock, concurrency-safe reservation,
replay-safe release/expiry, local transaction plus outbox behavior, and
administrative authorization. Use database/Testcontainers evidence for locking
or transaction claims; an in-memory check is not proof against overselling.

Evaluation coverage includes duplicate Kafka handling and a deterministic
reservation/expiry scenario. It does not replace a concurrent database fixture.

## Related Guides

- [SAGA and outbox](https://taukhir.github.io/shopverse-docs/reliability/SAGA-OUTBOX)
- [Transactional outbox pattern](https://taukhir.github.io/shopverse-docs/reliability/OUTBOX-PATTERN)
- [Inbox pattern](https://taukhir.github.io/shopverse-docs/reliability/INBOX-PATTERN)
- [SAGA code flow](https://taukhir.github.io/shopverse-docs/reliability/SHOPVERSE-SAGA-CODE-FLOW)
- [Multi-replica reservation expiry](https://taukhir.github.io/shopverse-docs/reliability/problems/runtime/MULTI-REPLICA-RESERVATION-EXPIRY)
- [Locking and work ownership](https://taukhir.github.io/shopverse-docs/reliability/locking/LOCKING-AND-WORK-OWNERSHIP)
- [Scheduler locking with ShedLock](https://taukhir.github.io/shopverse-docs/reliability/locking/SCHEDULER-LOCKING-SHEDLOCK)
- [Shopverse transaction boundaries](https://taukhir.github.io/shopverse-docs/reliability/TRANSACTIONS)
- [Spring transactions](https://taukhir.github.io/shopverse-docs/spring/SPRING-TRANSACTIONS)
- [Apache Kafka](https://taukhir.github.io/shopverse-docs/integration/APACHE-KAFKA)
- [Spring Kafka](https://taukhir.github.io/shopverse-docs/spring/SPRING-KAFKA)
- [Distributed systems](https://taukhir.github.io/shopverse-docs/architecture/DISTRIBUTED-SYSTEMS)
- [Generic Resilience4j patterns](https://taukhir.github.io/shopverse-docs/reliability/RESILIENCE4J-GENERIC)
- [Spring Resilience4j](https://taukhir.github.io/shopverse-docs/spring/SPRING-RESILIENCE4J)
