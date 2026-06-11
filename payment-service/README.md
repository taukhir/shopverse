# Shopverse Payment Service

Payment Service persists idempotent payment outcomes for the checkout SAGA. It uses MySQL, Spring Data JPA, Liquibase, typed configuration properties, caching, Resilience4j annotations, Kafka, JWT security, OpenAPI, metrics, tracing, and JSON logs.

## Runtime

| Item | Value |
| --- | --- |
| Application | `PAYMENT-SERVICE` |
| Port | `8084` |
| Database | `payment_service` |
| Config | `cloud-configs/PAYMENT-SERVICE.yml` |
| Swagger UI | `http://localhost:8084/swagger-ui/index.html` |

## APIs

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/payments/public/health` | Public | Health response |
| `GET` | `/api/v1/payments/orders/{orderNumber}` | Customer/Admin | Payment outcome |
| `GET` | `/api/v1/payments/admin` | Admin | All payments |
| `POST` | `/api/v1/payments/admin/simulation?mode={mode}` | Admin | Set `SUCCESS`, `DECLINE`, or `TIMEOUT` |
| `POST` | `/api/v1/payments/admin/orders/{orderNumber}/reconcile` | Admin | Reconcile a timed-out payment |
| `POST` | `/api/v1/payments/admin/orders/{orderNumber}/refund` | Admin | Refund a captured payment |
| `GET` | `/api/v1/payments/admin/dead-letters` | Admin | Inspect persisted failures |
| `POST` | `/api/v1/payments/admin/dead-letters/{id}/replay` | Admin | Replay one failed event |

Representative payment response:

```json
{
  "id": 7,
  "orderNumber": "ORD-10042",
  "correlationId": "checkout-demo-101",
  "amount": 2499.00,
  "status": "CAPTURED",
  "paymentReference": "PAY-...",
  "failureReason": null,
  "createdAt": "2026-06-11T08:30:02Z",
  "updatedAt": "2026-06-11T08:30:03Z"
}
```

All non-public payment endpoints require a JWT; `/admin/**` requires
`ROLE_ADMIN`.

`GET /orders/{orderNumber}` additionally enforces ownership with method
security. A customer can read only a payment whose persisted
`customerUsername` matches the JWT subject; administrators can read any
payment. Integration tests cover owner, non-owner, and admin access.

## Persistence And Processing

- `PaymentEntity` stores order number, amount, status, payment reference, failure reason, and correlation ID.
- A unique order number prevents duplicate charges when Kafka redelivers an event.
- `BaseAuditableEntity` uses JPA `@CreatedDate` and `@LastModifiedDate`.
- Liquibase owns schema changes; Hibernate validates mappings.
- Reads use `@Cacheable`; processing invalidates cached payment data.
- `PaymentProperties` maps and validates `shopverse.payment.approval-limit`.

## Provider Boundary And Payment Uncertainty

`PaymentProvider` isolates Shopverse from a third-party gateway. The included
`StubPaymentProvider` is an in-process deterministic test double with
deterministic modes:

```text
SUCCESS -> AUTHORIZED -> CAPTURED
DECLINE -> DECLINED
TIMEOUT -> TIMED_OUT
```

Set a scenario:

```http
POST /api/v1/payments/admin/simulation?mode=TIMEOUT
```

Timeout is uncertain, not an immediate permanent failure. The order stays in
`PAYMENT_PROCESSING`, and inventory remains reserved until reconciliation or
the five-minute expiry:

```http
POST /api/v1/payments/admin/orders/{orderNumber}/reconcile
POST /api/v1/payments/admin/orders/{orderNumber}/refund
```

Reconciliation turns a timed-out payment into `AUTHORIZED` then `CAPTURED` and
publishes payment completion. Only captured payments can be refunded.

The provider interface supports later Adapter/Strategy implementations for
Stripe, Razorpay, cards, wallets, bank transfer, or cash-on-delivery without
putting provider-specific code in the SAGA listener. A standalone WireMock
container is a suitable next step when HTTP contract testing is required;
SoapUI is not required for the current in-process stub.

## Kafka SAGA

```text
shopverse.inventory.reserved
  -> process and persist payment once
  -> shopverse.payment.completed
  -> or shopverse.payment.failed
```

`@KafkaListener` handles records on Kafka container threads. The outbox
dispatcher uses `KafkaTemplate.send(...)` and waits for broker acknowledgement
before marking the row published. Correlation context is restored into MDC for
consumed and dispatched events.

Payment persistence and its completion/failure event use a transactional
outbox. Processing or reconciliation updates the payment and inserts the
outgoing event in one transaction. Serialization or database failure rolls
back both. The dispatcher publishes only committed rows and retries failed
sends.

## Retry, Dead Letter, And Replay

The payment listener uses `@RetryableTopic(attempts = "3")`. After retries are
exhausted, `@DltHandler` persists the failed payload, source topic, reason,
retry count, and timestamps.

```http
GET  /api/v1/payments/admin/dead-letters
POST /api/v1/payments/admin/dead-letters/{id}/replay
```

Replay republishes the original payload and marks the failure record as
replayed while preserving its history. Replay itself inserts an outbox row and
updates `replayCount`, `lastReplayedBy`, and `replayedAt` atomically.

## Resilience And Observability

The API uses annotation-driven:

```java
@RateLimiter(name = "payment-api")
@Bulkhead(name = "payment-api", type = Bulkhead.Type.SEMAPHORE)
```

Limits live in centralized config. JSON logging, Loki collection, Prometheus metrics, and Zipkin tracing are documented in [Observability](../observability/README.md).

## Build

```powershell
.\gradlew.bat clean test
docker compose build payment-service
docker compose up -d payment-service
```
