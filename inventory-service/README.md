# Inventory Service

Inventory Service runs on port `8086`. It owns stock, reservations, expiry, overselling prevention, and inventory-side SAGA recovery.

## APIs

| Method | Path | Access |
|---|---|---|
| `GET` | `/api/v1/inventory/public/health` | public |
| `GET` | `/api/v1/inventory/public/items` | public |
| `GET` | `/api/v1/inventory/{productId}` | authenticated |
| `PUT` | `/api/v1/inventory/admin/items` | admin |
| `GET` | `/api/v1/inventory/admin/dead-letters` | admin |
| `POST` | `/api/v1/inventory/admin/dead-letters/{id}/replay` | admin |

## Reservation Flow

The service consumes `shopverse.order.created`, verifies stock, creates a reservation, decrements available quantity, and saves an inventory outcome to the outbox. Payment failure releases the reservation. A scheduled expiry task restores stock for reservations that exceed the configured five-minute TTL.

## Concurrency

`InventoryItem` uses JPA `@Version`. Concurrent updates based on a stale version fail instead of silently overselling the last item. Reservation operations are transactional and use order number as the business key.

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

- [SAGA and outbox](../docs/reliability/SAGA-OUTBOX.md)
- [SAGA code flow](../docs/reliability/SHOPVERSE-SAGA-CODE-FLOW.md)
- [Shopverse transaction boundaries](../docs/reliability/TRANSACTIONS.md)
- [Spring transactions](../docs/spring/SPRING-TRANSACTIONS.md)
- [Apache Kafka](../docs/integration/APACHE-KAFKA.md)
- [Spring Kafka](../docs/spring/SPRING-KAFKA.md)
- [Distributed systems](../docs/architecture/DISTRIBUTED-SYSTEMS.md)
- [Generic Resilience4j patterns](../docs/reliability/RESILIENCE4J-GENERIC.md)
- [Spring Resilience4j](../docs/spring/SPRING-RESILIENCE4J.md)
