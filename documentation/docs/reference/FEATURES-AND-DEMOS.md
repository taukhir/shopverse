# Features And Demonstrations

This guide is the canonical record of implemented Shopverse capabilities and
the steps used to demonstrate them. `Implemented` means code and configuration
exist. It does not imply production scale, external-provider certification, or
full failure testing.

## Implementation Matrix

| Feature | Status | Evidence |
|---|---|---|
| Centralized configuration | Implemented | Config Server and `cloud-configs` |
| Eureka discovery and load balancing | Implemented | service registration and logical Feign names |
| API Gateway routing and JWT security | Implemented | gateway routes and resource-server configuration |
| RSA JWT and JWKS | Implemented | Auth `JwtEncoder`, JWKS endpoint, resource decoders |
| Issuer validation in every resource service | Partial | explicit in User Service; cross-service consistency requires audit |
| Method and ownership authorization | Implemented | permissions plus Order/Payment owner checks |
| Structured JSON logging | Implemented | structured Logback encoders |
| Health-log separation | Implemented for core business services | dedicated health files and Promtail job |
| Metrics, dashboards, and alerts | Implemented baseline | Micrometer, Prometheus rules, Grafana provisioning |
| Distributed tracing | Implemented | Micrometer tracing and Zipkin export |
| Independent persistent schemas | Implemented | JPA, Liquibase, separate service databases |
| Idempotent checkout | Implemented | header, lookup, and database uniqueness |
| Inventory reservation and expiry | Implemented | reservation state, TTL task, compensation |
| Overselling prevention | Implemented | optimistic version and transactional stock update |
| Payment uncertainty | Implemented | timeout, reconciliation, and refund states |
| Choreography SAGA | Implemented | Kafka event listeners and compensation |
| Transactional outbox | Implemented | domain and outbox atomic local transaction |
| DLT persistence and replay audit | Implemented baseline | Order, Inventory, and Payment recovery APIs |
| Queryable order timeline | Implemented | timeline table and ownership-protected API |
| Failure simulation | Partial | payment success, decline, and timeout |
| Distributed Redis cache | Planned | current caches are local |
| Transactional inbox/event-ID deduplication | Planned | current consumers use state checks and constraints |
| Full OAuth2 Authorization Server | Planned | current login is custom JWT issuance |
| AI Incident Investigator | Planned | evidence-based incident summarization |

## Demo Prerequisites

1. Start the stack using the [Docker guide](https://github.com/taukhir/shopverse/tree/main/docker).
2. Confirm containers are healthy with `docker compose ps`.
3. Use `http://localhost:8080` as the application entry point.
4. Have one customer credential and one administrator credential.
5. Open Grafana, Prometheus, Zipkin, and optionally MySQL tooling.
6. Use a fresh `Idempotency-Key` and `X-Correlation-Id` for each new checkout.

Exact API contracts are maintained in the [API guide](../development/API-GUIDE.md).

## Centralized Configuration

**Purpose:** keep environment-specific properties outside service artifacts.

Services import configuration from Config Server. Common Kafka, tracing, and
management properties live in `cloud-configs/application.yml`; service-specific
datasource, security, resilience, and route properties live in named files.

**Demo**

1. Open `http://localhost:8888/ORDER-SERVICE/default`.
2. Confirm property sources include common and Order configuration.
3. Change a refreshable property in the configured repository.
4. Refresh only a service that exposes and supports refresh.
5. Verify the new value through its behavior or environment endpoint.

Restart is still required for properties bound during infrastructure creation
or for configuration that is not refresh-scoped.

## Discovery And Load Balancing

**Purpose:** route to logical service names instead of hard-coded instances.

```java
@FeignClient(name = "INVENTORY-SERVICE")
public interface InventoryClient {
    @GetMapping("/api/v1/inventory/public/items")
    List<CatalogItemResponse> items();
}
```

**Demo**

1. Open Eureka at `http://localhost:8761`.
2. Confirm all application services are registered.
3. Call the Order catalog endpoint through the gateway.
4. Confirm Order calls Inventory using the logical name.

## Authentication, JWT, And JWKS

**Purpose:** authenticate credentials once and authorize signed bearer tokens
without sharing the private key.

```http
POST /auth/login
Content-Type: application/json

{
  "username": "customer",
  "password": "<password>"
}
```

**Demo**

1. Log in and capture the JWT.
2. Decode its header and claims without treating decoding as verification.
3. Open `/auth/.well-known/jwks.json`.
4. Call a protected endpoint with no token and expect `401`.
5. Call it with the token and expect authorization according to roles and
   ownership.

## Method And Ownership Authorization

**Purpose:** prevent authenticated users from reading another customer's
business records.

```java
@PreAuthorize("hasRole('ADMIN') or @orderAuthorization.isOwner(#id, authentication.name)")
public List<OrderTimelineResponse> getTimeline(Long id) {
    return orderService.getTimeline(id);
}
```

**Demo**

1. Customer A creates an order.
2. Customer A reads its timeline and payment.
3. Customer B requests the same resources and receives `403`.
4. An administrator reads both resources successfully.

## Idempotent Checkout

**Purpose:** make client retries return the existing order instead of creating
duplicate orders, stock reservations, or payments.

```http
POST /api/v1/orders/checkout
Authorization: Bearer <token>
Idempotency-Key: checkout-user-42-cart-9001
X-Correlation-Id: demo-checkout-9001
Content-Type: application/json

{
  "items": [
    {
      "productId": 101,
      "quantity": 1
    }
  ]
}
```

The service checks the key and the database enforces uniqueness.

**Demo**

1. Submit the request and save its order ID.
2. Submit the identical request with the same key.
3. Confirm the existing order is returned.
4. Confirm there is one order, one reservation, and one payment effect.

## Persistent SAGA And Timeline

**Purpose:** make a distributed checkout auditable instead of relying only on
transient logs.

```text
ORDER_CREATED
INVENTORY_RESERVED
PAYMENT_PROCESSING
PAYMENT_COMPLETED
ORDER_CONFIRMED
```

**Demo**

1. Create checkout.
2. Poll `GET /api/v1/orders/{id}/timeline`.
3. Confirm timestamps, correlation ID, stage, and details.
4. Compare timeline stages with Kafka logs and payment state.

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
