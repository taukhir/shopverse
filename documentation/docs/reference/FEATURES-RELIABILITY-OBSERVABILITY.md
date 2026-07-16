---
title: "Reliability And Observability Demonstrations"
description: "Reliability And Observability Demonstrations with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "Reliability And Observability Demonstrations"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Reliability And Observability Demonstrations

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

## Transactional Outbox

**Purpose:** prevent a committed domain change from losing its outgoing event.

```java
@Transactional
public OrderResponse checkout(...) {
    OrderEntity order = repository.save(...);
    outboxService.enqueue(...);
    return map(order);
}
```

`OutboxService.enqueue(...)` uses `Propagation.MANDATORY`, so it must join the
domain transaction.

**Demo**

1. Create checkout.
2. Inspect the Order `outbox_events` row.
3. Observe it move from `PENDING` to `PUBLISHED`.
4. Stop Kafka and create another checkout.
5. Confirm the domain/outbox state remains durable and publication reports a
   failure rather than silently losing the event.

## Inventory Reservation And Overselling Prevention

**Purpose:** hold stock during payment and reject concurrent stale updates.

```java
@Version
private long version;
```

**Demo**

1. Set a product's available quantity to one.
2. Send two concurrent checkouts with different idempotency keys.
3. Confirm at most one reservation wins.
4. Inspect optimistic-lock/conflict logs and metrics.
5. Confirm available plus reserved quantities remain valid.

Automating this race with an integration test remains preferable to manual
timing.

## Reservation Expiry And Compensation

**Purpose:** prevent abandoned reservations from holding stock indefinitely.

**Demo**

1. Create a reservation that does not reach successful payment.
2. Wait for the configured expiry window.
3. Confirm reservation status becomes `EXPIRED` and stock is released.
4. Inspect `shopverse_inventory_reservations_expired_total`.

For payment decline, the compensation path uses `RELEASED` rather than expiry.

## Payment Outcomes

Payment states include:

```text
PENDING, AUTHORIZED, CAPTURED, DECLINED, TIMED_OUT, REFUNDED
```

### Success

1. Set simulation to `SUCCESS`.
2. Create checkout.
3. Confirm payment becomes `CAPTURED`.
4. Confirm Order becomes `CONFIRMED`.

### Decline

1. Set `POST /api/v1/payments/admin/simulation?mode=DECLINE`.
2. Create checkout.
3. Confirm payment is `DECLINED`.
4. Confirm Order records `PAYMENT_FAILED`.
5. Confirm Inventory releases its reservation.

### Timeout And Reconciliation

1. Set simulation to `TIMEOUT`.
2. Create checkout and confirm payment is `TIMED_OUT`.
3. Call `/api/v1/payments/admin/orders/{orderNumber}/reconcile`.
4. Confirm payment becomes `CAPTURED`.
5. Confirm completion event advances Order to `CONFIRMED`.

### Refund

1. Start with a captured payment.
2. Call `/api/v1/payments/admin/orders/{orderNumber}/refund`.
3. Confirm state becomes `REFUNDED`.

The provider is a stub; external webhook signatures, settlement, disputes, and
provider idempotency are outside the current implementation.

## Kafka Retry, DLT, And Replay

**Purpose:** isolate records that still fail after bounded retries and retain
operator audit.

```java
@RetryableTopic(attempts = "3")
@KafkaListener(topics = "${shopverse.kafka.topics.order-created}")
public void onOrderCreated(String payload) {
    // deserialize and delegate
}
```

**Demo**

1. Publish a malformed or otherwise poison event.
2. Observe original and retry attempts.
3. Confirm the DLT handler persists a failed-event record.
4. Inspect the relevant admin dead-letter API.
5. Correct the root cause.
6. Replay as an administrator.
7. Confirm replay count, user, timestamp, logs, and metric update.

Current recovery deduplication uses an existence check. Strict concurrent
deduplication requires an immutable event ID and database unique constraint.

## Structured Logging And Correlation

**Purpose:** search one business journey across services.

**Demo**

1. Send checkout with `X-Correlation-Id: demo-checkout-9001`.
2. Query Loki:

```logql
{log_type="application"} | json | correlationId="demo-checkout-9001"
```

3. Confirm Order, Inventory, and Payment logs share the value.
4. Compare trace IDs: asynchronous portions can use different traces while the
   correlation ID remains stable.

## Metrics, Dashboards, And Alerts

**Purpose:** detect aggregate health and business failures without searching
individual logs.

**Demo**

1. Open Prometheus targets and confirm all services are `UP`.
2. Run:

```promql
sum by (application) (rate(http_server_requests_seconds_count[5m]))
```

3. Trigger checkout success and failure.
4. Inspect SAGA, payment, outbox, inventory, and DLT metrics.
5. Open the provisioned Grafana dashboards.
6. Trigger a controlled outbox or DLT failure and inspect the Prometheus rule.

The POC evaluates alerts but does not provide a production notification route.

## Distributed Tracing

**Purpose:** inspect service/span relationships and latency for one technical
execution.

**Demo**

1. Execute an authenticated HTTP flow.
2. Capture `traceId` from structured logs.
3. Search Zipkin by trace ID.
4. Inspect gateway/server/client spans.
5. Use correlation ID for the wider SAGA journey.

## Resilience4j

**Purpose:** bound concurrency, admission, retries, and repeated dependency
failure.

Implemented annotations include RateLimiter, semaphore Bulkhead, Retry, and
CircuitBreaker with fallbacks on selected boundaries.

**Demo**

1. Repeatedly call a rate-limited endpoint and observe `429`.
2. Make a configured downstream dependency unavailable.
3. Observe bounded retries and circuit-breaker behavior.
4. Confirm the fallback is explicit and does not hide authentication or
   permanent business failures.

## Database Migrations And Auditing

**Purpose:** reproduce schemas and retain creation/update history.

**Demo**

1. Start a clean database.
2. Confirm Liquibase applies each service changelog.
3. Inspect `DATABASECHANGELOG` and `DATABASECHANGELOGLOCK`.
4. Confirm Hibernate validation succeeds.
5. Create/update entities and inspect audit timestamps.

### Admin Audit Events

**Purpose:** keep operator-facing account and administration changes queryable
without depending only on logs or the current UI state.

**Demo**

1. Log in as an administrator.
2. Perform a User Service administration or account change.
3. Query `GET /api/v1/admin/audit-events?area=USERS&size=10`.
4. Open one record through `GET /api/v1/admin/audit-events/{id}`.
5. Open the Angular Admin Activity page and confirm it uses backend audit data
   before falling back to derived operational signals.

The current implementation records User Service account, user, role, and
permission events. Extending the same audit surface to Order, Inventory,
Payment, and DLT recovery workflows remains a production hardening item.

## Testing And Delivery

Shopverse contains unit, controller/security, integration, and Testcontainers
testing patterns plus GitHub Actions and Jenkins build/image pipelines.

**Demo**

1. Run a changed service's unit tests.
2. Run its integration tests with MySQL/Kafka Testcontainers.
3. Inspect CI stages for compile, test, image build, and optional deployment.
4. Confirm failures stop later stages.

## Complete POC Walkthrough

1. Verify Config Server and Eureka.
2. Log in and inspect JWT/JWKS.
3. Read catalog through the gateway.
4. Create an idempotent checkout with a correlation ID.
5. Observe Order, Inventory, and Payment state.
6. Read the protected timeline and payment.
7. Search logs by correlation ID.
8. inspect the technical trace by trace ID.
9. inspect Prometheus and Grafana.
10. repeat the idempotency key.
11. demonstrate ownership denial.
12. demonstrate payment decline and compensation.
13. demonstrate timeout and reconciliation.
14. demonstrate DLT persistence and replay.
15. inspect database and outbox evidence.

## Roadmap

The items below are target improvements. They must not be described elsewhere
as implemented until code, configuration, tests, and a demonstration path are
added to the implementation matrix.

1. Add event IDs, schema versions, and a transactional consumer inbox.
2. Add bounded outbox backoff, terminal failure, and oldest-pending alerts.
3. Complete a failure-simulation console for Kafka delay, service outage,
   duplicate events, and insufficient stock.
4. Add Redis only with a demonstrated multi-replica consistency requirement.
5. Add full OAuth2 Authorization Server flows, audience validation, refresh
   rotation, and service identities.
6. Add external payment adapter contracts, webhook verification, and provider
   reconciliation.
7. Automate the last-item race and recovery scenario.
8. Build the AI Incident Investigator using timeline, Loki, Zipkin, Prometheus,
   outbox, and DLT evidence.

AI capabilities should start read-only, cite evidence, redact sensitive data,
and never autonomously replay or mutate production state.

## Related Guides

- [System design](../architecture/SYSTEM-DESIGN.md)
- [API guide](../development/API-GUIDE.md)
- [Debugging](../development/DEBUGGING.md)
- [Observability](../observability/OBSERVABILITY.md)

## Recommended Next

Return to [Shopverse Features And Demos](./FEATURES-AND-DEMOS.md) to select the next focused guide.


## Official References

- [Spring Boot reference](https://docs.spring.io/spring-boot/reference/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
