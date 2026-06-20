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

## Timeout Reconciliation And Refunds

Payment timeout is modeled as an uncertain state, not an automatic decline.
When the stub provider returns `TIMEOUT`, Payment Service stores the payment
as `TIMED_OUT` and does not publish `payment.completed` or `payment.failed`.
This prevents blind retry from creating a duplicate charge and keeps the SAGA
visible for operator recovery.

Reconciliation resolves the uncertain state:

```http
POST /api/v1/payments/admin/orders/{orderNumber}/reconcile
Authorization: Bearer <admin-token>
```

If the payment is `TIMED_OUT`, reconciliation marks it `CAPTURED`, creates a
`RECONCILED-{orderNumber}` reference, and enqueues `payment.completed` through
the outbox so Order Service can confirm the order.

Refund is a local payment administration action:

```http
POST /api/v1/payments/admin/orders/{orderNumber}/refund
Authorization: Bearer <admin-token>
```

Only `CAPTURED` payments can be refunded. Refund changes Payment state to
`REFUNDED`. The current POC does not publish a `payment.refunded` event or
change Order state after refund.

## SAGA

The service consumes `inventory.reserved`, persists the payment and an outgoing event in one transaction, and emits `payment.completed` or `payment.failed` through its outbox. Payment failure causes Order failure and Inventory compensation.

## Idempotent Consumer Behavior

Kafka can redeliver the same `inventory.reserved` business event. Payment uses
`orderNumber` as the payment business key. Before creating or processing a new
payment, the service checks whether a payment already exists for that order.
If it exists, the existing payment is reused and the customer is not charged
again by a duplicate event.

Producer idempotence protects producer retries to Kafka, but it does not
protect payment side effects. Payment must remain idempotent at the database
and provider boundary. A production payment integration should also send a
provider idempotency key derived from the order number.

## Ownership

Customer payment lookup compares the authenticated JWT subject with the payment owner. Administrators retain cross-customer access.

See [Resource ownership authorization](../documentation/docs/reliability/problems/runtime/RESOURCE-OWNERSHIP-AUTHORIZATION.md)
for the problem statement, `@PreAuthorize` flow, targeted repository query,
expected API outcomes, and method-security tests.

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
- [Problems and solutions](../documentation/docs/reliability/PROBLEMS-AND-SOLUTIONS.md)
- [Resource ownership authorization](../documentation/docs/reliability/problems/runtime/RESOURCE-OWNERSHIP-AUTHORIZATION.md)
- [Transactional outbox pattern](../documentation/docs/reliability/OUTBOX-PATTERN.md)
- [Inbox pattern](../documentation/docs/reliability/INBOX-PATTERN.md)
- [SAGA code flow](../documentation/docs/reliability/SHOPVERSE-SAGA-CODE-FLOW.md)
- [Transactions](../documentation/docs/reliability/TRANSACTIONS.md)
- [Spring transactions](../documentation/docs/spring/SPRING-TRANSACTIONS.md)
- [Spring Kafka](../documentation/docs/spring/SPRING-KAFKA.md)
- [Features and demos](../documentation/docs/reference/FEATURES-AND-DEMOS.md)
- [Generic Resilience4j patterns](../documentation/docs/reliability/RESILIENCE4J-GENERIC.md)
- [Spring Resilience4j](../documentation/docs/spring/SPRING-RESILIENCE4J.md)
