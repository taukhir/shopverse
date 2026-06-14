# Payment Service

Payment Service runs on port `8084`. It owns persistent payment state, a third-party provider boundary, payment simulation, reconciliation, refunds, and payment-side recovery.

## APIs

| Method | Path | Access |
|---|---|---|
| `GET` | `/api/v1/payments/public/health` | public |
| `GET` | `/api/v1/payments/orders/{orderNumber}` | owner or admin |
| `GET` | `/api/v1/payments/admin` | admin |
| `POST` | `/api/v1/payments/admin/simulation?mode=SUCCESS` | admin |
| `POST` | `/api/v1/payments/admin/orders/{orderNumber}/reconcile` | admin |
| `POST` | `/api/v1/payments/admin/orders/{orderNumber}/refund` | admin |
| `GET` | `/api/v1/payments/admin/dead-letters` | admin |
| `POST` | `/api/v1/payments/admin/dead-letters/{id}/replay` | admin |

## Payment States

```text
PENDING -> AUTHORIZED -> CAPTURED
        -> DECLINED | TIMED_OUT
CAPTURED -> REFUNDED
```

The stub provider supports `SUCCESS`, `DECLINE`, and `TIMEOUT`. A timed-out payment remains uncertain until the reconciliation endpoint resolves it.

## SAGA

The service consumes `inventory.reserved`, persists the payment and an outgoing event in one transaction, and emits `payment.completed` or `payment.failed` through its outbox. Payment failure causes Order failure and Inventory compensation.

## Ownership

Customer payment lookup compares the authenticated JWT subject with the payment owner. Administrators retain cross-customer access.

Liquibase includes matching historical payment examples for
`DEMO-ORD-1001` (`CAPTURED`) and `DEMO-ORD-1002` (`DECLINED`):

```powershell
docker compose exec mysql sh -lc '
  MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot payment_service -e "
    SELECT order_number, customer_username, status, amount,
           payment_reference, failure_reason
    FROM payments ORDER BY created_at DESC;
  "
'
```

## Configuration

`cloud-configs/PAYMENT-SERVICE.yml` defines datasource, JWT, approval limit, cache, RateLimiter, and Bulkhead.

## Tests And Observability

```powershell
./gradlew test
./gradlew integrationTest
```

```logql
{log_type="application", application="PAYMENT-SERVICE"}
```

## Run

```powershell
./gradlew test
./gradlew bootRun
```

```powershell
docker compose build payment-service
docker compose up -d payment-service
```

## Related Guides

- [SAGA and outbox](../documentation/docs/reliability/SAGA-OUTBOX.md)
- [SAGA code flow](../documentation/docs/reliability/SHOPVERSE-SAGA-CODE-FLOW.md)
- [Transactions](../documentation/docs/reliability/TRANSACTIONS.md)
- [Spring transactions](../documentation/docs/spring/SPRING-TRANSACTIONS.md)
- [Spring Kafka](../documentation/docs/spring/SPRING-KAFKA.md)
- [Features and demos](../documentation/docs/reference/FEATURES-AND-DEMOS.md)
- [Generic Resilience4j patterns](../documentation/docs/reliability/RESILIENCE4J-GENERIC.md)
- [Spring Resilience4j](../documentation/docs/spring/SPRING-RESILIENCE4J.md)
