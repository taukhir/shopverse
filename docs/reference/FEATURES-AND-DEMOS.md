# Features And Demonstrations

## Implementation Matrix

| Feature | Status | Evidence |
|---|---|---|
| Centralized configuration | Implemented | Config Server and `cloud-configs` |
| Eureka discovery and load balancing | Implemented | service registration and logical Feign names |
| API Gateway routing and JWT security | Implemented | gateway routes and resource-server configuration |
| RSA JWT and JWKS | Implemented | Auth `JwtEncoder`, JWKS endpoint, resource decoders |
| Issuer validation in every resource service | Partial | explicit in User Service; remaining resource services need equivalent validation |
| Method and ownership authorization | Implemented | permissions plus order/payment owner checks |
| Structured JSON logging | Implemented | `logback-spring.xml` structured encoders |
| Health-log separation | Implemented for User, Order, Inventory, and Payment | dedicated health files and Promtail job |
| Metrics, dashboards, alerts | Implemented baseline | Micrometer, Prometheus rules, Grafana provisioning |
| Distributed tracing | Implemented | Micrometer tracing and Zipkin export |
| Persistent Order/Inventory/Payment | Implemented | JPA, Liquibase, independent schemas |
| Idempotent checkout | Implemented | header, lookup, database uniqueness |
| Inventory reservation and expiry | Implemented | reservation state, TTL scheduler, compensation |
| Overselling prevention | Implemented | optimistic version and transactional stock update |
| Payment uncertainty | Implemented | timeout, reconciliation, refund state |
| Choreography SAGA | Implemented | Kafka event listeners and compensation |
| Transactional outbox | Implemented | domain/outbox atomic transaction and publisher |
| DLT persistence and replay audit | Implemented | all three SAGA services |
| Queryable order timeline | Implemented | timeline table and ownership-protected API |
| Failure simulation | Partial | payment success/decline/timeout; broader console planned |
| Distributed Redis cache | Planned | current caches are local |
| Full OAuth2 Authorization Server | Planned | current login is custom JWT issuance |
| AI Incident Investigator | Planned | correlate logs, traces, metrics, timeline, and recovery state |

## Standard Checkout Demo

1. Log in and obtain a JWT.
2. call `/api/v1/orders/public/catalog`.
3. submit checkout with a unique `Idempotency-Key` and `X-Correlation-Id`.
4. query `/api/v1/orders/{id}/timeline`.
5. query `/api/v1/payments/orders/{orderNumber}` as the owner.
6. find all logs by correlation ID in Loki.
7. inspect trace spans in Zipkin.
8. inspect SAGA metrics in Grafana.

## Duplicate Request Demo

Submit the same checkout body twice with the same idempotency key. The second request must resolve to the existing order and must not duplicate stock reservation or payment.

## Payment Failure Demo

1. As admin set `POST /api/v1/payments/admin/simulation?mode=DECLINE`.
2. create checkout.
3. observe `PAYMENT_FAILED` in the order timeline.
4. confirm inventory compensation releases the reservation.
5. query logs by correlation ID.

## Payment Timeout And Reconciliation

1. set simulation to `TIMEOUT`;
2. create checkout and observe `TIMED_OUT`;
3. call `/api/v1/payments/admin/orders/{orderNumber}/reconcile`;
4. observe payment completion and order confirmation.

## Ownership Demo

- Customer A can read A's timeline and payment.
- Customer B receives `403` for A's resources.
- An administrator can read both.

## DLT Replay Demo

Cause a poison event, allow three attempts, inspect the service's dead-letter admin API, fix the cause, and call replay. Confirm replay count, replay user, and replay timestamp are updated.

## Distinctive Future Demo

The planned "last item race" demonstrates two simultaneous buyers, one optimistic-lock winner, payment timeout, reservation expiry/compensation, and a successful retry. The entire journey should be visible through timeline, Kafka, Loki, Prometheus, and Zipkin.

## Roadmap

1. Complete a unified failure-simulation console for Kafka delay, service outage, duplicate events, insufficient stock, and payment modes.
2. Add a dedicated processed-event inbox for stronger consumer idempotency.
3. Add Redis only when multi-replica cache consistency is demonstrated as a requirement.
4. Add OAuth2 Authorization Server flows, refresh-token rotation, audience validation, and service identities.
5. Add consumer-lag metrics and alerting.
6. Add automated last-item race and replay demonstrations.
7. Build the AI Incident Investigator: summarize a failed checkout using timeline state, Loki logs, Zipkin spans, Prometheus signals, outbox rows, and DLT records.
8. Add AI anomaly explanation and natural-language operational search after reliable structured data and access controls are in place.

AI features should be read-only first, cite the underlying evidence, redact secrets, and never autonomously replay or modify production state.
