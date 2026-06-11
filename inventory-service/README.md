# Shopverse Inventory Service

Inventory Service owns product stock and idempotent SAGA reservations. It uses MySQL, Spring Data JPA, Liquibase, optimistic locking, validation, caching, Resilience4j annotations, Kafka, JWT security, OpenAPI, metrics, tracing, and JSON logs.

## Runtime

| Item | Value |
| --- | --- |
| Application | `INVENTORY-SERVICE` |
| Port | `8086` |
| Database | `inventory_service` |
| Config | `cloud-configs/INVENTORY-SERVICE.yml` |
| Swagger UI | `http://localhost:8086/swagger-ui/index.html` |

## APIs

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/inventory/public/health` | Public | Health response |
| `GET` | `/api/v1/inventory/public/items` | Public | Product availability catalog |
| `GET` | `/api/v1/inventory/{productId}` | Customer/Admin | Product stock |
| `PUT` | `/api/v1/inventory/admin/items` | Admin | Create or replace stock |
| `GET` | `/api/v1/inventory/admin/dead-letters` | Admin | Persisted exhausted consumer events |
| `POST` | `/api/v1/inventory/admin/dead-letters/{id}/replay` | Admin | Audit and queue replay |

Admin request:

```json
{
  "productId": 101,
  "productName": "Wireless Keyboard",
  "unitPrice": 2499.00,
  "availableQuantity": 10
}
```

Validation uses `@NotNull`, `@NotBlank`, `@Positive`, `@PositiveOrZero`, and `@DecimalMin`.

Representative response:

```json
{
  "id": 1,
  "productId": 101,
  "productName": "Wireless Keyboard",
  "unitPrice": 2499.00,
  "availableQuantity": 10,
  "reservedQuantity": 0,
  "available": true,
  "updatedAt": "2026-06-11T08:30:00Z"
}
```

Use an administrator JWT for the upsert:

```powershell
curl.exe -X PUT http://localhost:8080/api/v1/inventory/admin/items `
  -H "Authorization: Bearer <token>" `
  -H "Content-Type: application/json" `
  -d '{\"productId\":101,\"productName\":\"Wireless Keyboard\",\"unitPrice\":2499.00,\"availableQuantity\":10}'
```

## Persistence And Concurrency

- `InventoryItem` stores available/reserved quantities and uses JPA `@Version` optimistic locking.
- `InventoryReservation` has a unique order number, making repeated Kafka delivery idempotent.
- `BaseAuditableEntity` uses `@CreatedDate` and `@LastModifiedDate`.
- Liquibase creates and seeds the schema; Hibernate validates it.
- `@Transactional` protects reserve/release state changes.
- `@Cacheable` caches reads and `@CacheEvict` invalidates writes.

## Reservation Expiry And Overselling Prevention

Checkout reservations contain a persisted `expiresAt` calculated from the
central `shopverse.inventory.reservation-ttl` setting, defaulting to five
minutes.

```java
@Version
private long version;

public void reserve(int quantity) {
    if (availableQuantity < quantity) {
        throw new IllegalStateException("Insufficient stock");
    }
    availableQuantity -= quantity;
    reservedQuantity += quantity;
}
```

Hibernate updates the row with the previous version:

```sql
update inventory_items
set available_quantity=?, reserved_quantity=?, version=version+1
where id=? and version=?
```

Only one concurrent buyer can update the final unit. A loser receives an
optimistic-lock failure and Kafka retry processes the latest stock state. This
prevents overselling without a JVM mutex or Redis lock.

The scheduled expiry job queries only active reservations whose indexed
`expires_at` is in the past:

```java
@Scheduled(fixedDelayString =
        "${shopverse.inventory.expiry-scan-delay-ms:60000}")
public int expireReservations() {
    // Release quantities, mark EXPIRED, and publish compensation.
}
```

Release is idempotent because only `RESERVED` records can transition to
`RELEASED` or `EXPIRED`. Repeated payment-failure events therefore cannot add
stock twice.

For this aggregate, database optimistic locking is the distributed concurrency
control. Redis is not required. Redis would be considered for shared catalog
cache or very high read traffic, not as the final stock correctness mechanism.

## Kafka SAGA

```text
shopverse.order.created
  -> reserve persisted stock
  -> shopverse.inventory.reserved
  -> or shopverse.inventory.failed

shopverse.payment.failed
  -> release the persisted reservation
```

Consumers use `@KafkaListener`. Outbox dispatchers call
`KafkaTemplate.send(...)` and wait for broker acknowledgement before marking a
row published. An extra `@Async` layer is intentionally avoided because the
scheduled dispatcher and Kafka client already provide the required separation.

Inventory outcomes now use a transactional outbox. Stock/reservation changes
and `inventory.reserved` or `inventory.failed` are inserted in one MySQL
transaction. Reservation expiry releases stock, marks the reservation expired,
and inserts its compensation event atomically.

The dispatcher publishes committed rows in `REQUIRES_NEW` transactions and
locks each row before sending. A failed send keeps the row pending for retry.
Exhausted incoming Kafka events are persisted and can be replayed through the
admin API; replay count, actor, and timestamp are audited.

The event correlation ID is installed in MDC while each record is processed, so JSON logs from Inventory can be joined with Order and Payment logs.

## Resilience And Observability

The controller uses:

```java
@RateLimiter(name = "inventory-api")
@Bulkhead(name = "inventory-api", type = Bulkhead.Type.SEMAPHORE)
```

Configuration lives in `cloud-configs/INVENTORY-SERVICE.yml`. Request logs, metrics, trace IDs, span IDs, and correlation IDs follow the shared observability pipeline described in [Observability](../observability/README.md).

## Build

```powershell
.\gradlew.bat clean test
docker compose build inventory-service
docker compose up -d inventory-service
```
