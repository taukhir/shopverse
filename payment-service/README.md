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

## Configuration

`cloud-configs/PAYMENT-SERVICE.yml` defines datasource, JWT, approval limit, cache, RateLimiter, and Bulkhead.

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

- [SAGA and outbox](../docs/reliability/SAGA-OUTBOX.md)
- [Transactions](../docs/reliability/TRANSACTIONS.md)
- [Generic transaction concepts](../docs/reliability/TRANSACTIONS-GENERIC.md)
- [Features and demos](../docs/reference/FEATURES-AND-DEMOS.md)
- [Generic Resilience4j patterns](../docs/reliability/RESILIENCE4J-GENERIC.md)
