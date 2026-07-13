---
title: "Security And Checkout Demonstrations"
description: "Security And Checkout Demonstrations with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "Security And Checkout Demonstrations"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Security And Checkout Demonstrations

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

## Implementation Matrix

| Feature | Status | Evidence |
|---|---|---|
| Centralized configuration | Implemented | Config Server and `cloud-configs` |
| Eureka discovery and load balancing | Implemented | service registration and logical Feign names |
| API Gateway routing and JWT security | Implemented | gateway routes and resource-server configuration |
| RSA JWT and JWKS | Implemented | Auth `JwtEncoder`, JWKS endpoint, resource decoders |
| JWT timestamp and issuer validation | Implemented | Gateway, Auth, User, Order, Inventory, and Payment use `JwtValidators.createDefaultWithIssuer(...)` |
| JWT audience validation | Planned | no explicit audience validator is configured yet |
| Method and ownership authorization | Implemented | permissions plus Order/Payment owner checks |
| Structured JSON logging | Implemented | structured Logback encoders |
| Health-log separation | Implemented for core business services | dedicated health files and Promtail job |
| Metrics, dashboards, and alerts | Implemented baseline | Micrometer, Prometheus rules, Grafana provisioning |
| Distributed tracing | Implemented | Micrometer tracing and Zipkin export |
| Independent persistent schemas | Implemented | JPA, Liquibase, separate service databases |
| Idempotent checkout | Implemented | header, lookup, and database uniqueness |
| Direct checkout product lookup | Implemented | Order checkout calls Inventory product-by-id lookup; cached full catalog is browse-only |
| Checkout shipping snapshot | Implemented | checkout request requires shipping address and Order stores immutable snapshot |
| Customer address book | Implemented baseline | User Service `/api/v1/users/me/addresses` plus Angular account UI |
| Persisted cart | Implemented baseline | User Service `/api/v1/cart` APIs plus Angular account-cart sync |
| Public product detail/categories/related APIs | Implemented baseline | Inventory public item, categories, and related endpoints |
| Bounded local catalog cache | Implemented baseline | Order catalog uses Caffeine TTL plus admin eviction endpoint |
| Inventory reservation and expiry | Partial | TTL task exists; cancellation/payment-failure release exists; atomic multi-replica claim and successful-payment terminal transition remain pending |
| Inventory release on cancellation | Implemented baseline | Order emits `OrderCancelledEvent`; Inventory releases matching reservation |
| Overselling prevention | Implemented | optimistic version and transactional stock update |
| Payment uncertainty | Implemented | timeout, reconciliation, retry, refund, and webhook baseline states |
| Fulfillment lifecycle | Implemented baseline | admin pack, ship/out-for-delivery, deliver transitions; tracking/carrier metadata pending |
| Customer return request | Implemented baseline | owner-protected return request from delivered orders |
| Choreography SAGA | Implemented | Kafka event listeners and compensation |
| Transactional outbox | Implemented | domain and outbox atomic local transaction |
| DLT persistence and replay audit | Implemented baseline | Order, Inventory, and Payment recovery APIs |
| Queryable order timeline | Implemented | timeline table and ownership-protected API |
| Angular storefront and admin UI | Implemented baseline | `shopverse-web` served locally or through full-stack Compose |
| MinIO product media | Implemented baseline | Inventory image metadata plus seeded MinIO bucket |
| Public customer registration | Implemented | `POST /api/v1/public/users/register` |
| Shared platform error helpers | Implemented | `shopverse-common-error` `ApiErrorResponse` and `ApiErrors` |
| Gradle convention plugins | Implemented baseline | local `build-logic` included build used by service builds |
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

## Recommended Next

Return to [Shopverse Features And Demos](./FEATURES-AND-DEMOS.md) to select the next focused guide.


## Official References

- [Spring Boot reference](https://docs.spring.io/spring-boot/reference/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
