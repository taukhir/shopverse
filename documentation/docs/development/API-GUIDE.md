# API Guide

This guide is the Shopverse endpoint catalog and POC demonstration runbook.
Reusable HTTP design guidance is maintained in
[REST API design](REST-API-GENERIC.md).

## Shopverse Conventions

- APIs are versioned under `/api/v1`.
- request records use Jakarta Validation;
- protected APIs require `Authorization: Bearer <token>`;
- checkout requires `Idempotency-Key`;
- `X-Correlation-Id` can be supplied by the caller and is propagated;
- responses use DTOs instead of exposing JPA entities;
- ownership checks protect customer-specific order and payment records.

The gateway at `http://localhost:8080` is the normal entry point.

Use the [complete Shopverse demo](../case-study/COMPLETE-DEMO.mdx) for a
PowerShell-based runbook that chains authentication, checkout, SAGA state,
outbox evidence, failure simulation, and observability.

## Authentication

```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "<password>"
}
```

Use the returned token:

```http
Authorization: Bearer eyJ...
```

## Checkout

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

Current validation allows one checkout item. Reusing the idempotency key returns the existing order and must not reserve or charge twice.

## Important APIs

### Authentication And Public

| Method | Path |
|---|---|
| `POST` | `/auth/login` |
| `GET` | `/auth/.well-known/jwks.json` |
| `GET` | `/api/v1/orders/public/health` |
| `GET` | `/api/v1/orders/public/catalog` |
| `GET` | `/api/v1/inventory/public/items` |
| `GET` | `/api/v1/payments/public/health` |

### Customer Commerce

| Method | Path | Rule |
|---|---|---|
| `GET` | `/api/v1/orders` | current user's orders |
| `GET` | `/api/v1/orders/{id}` | owner or admin |
| `GET` | `/api/v1/orders/{id}/timeline` | owner or admin |
| `POST` | `/api/v1/orders/checkout` | authenticated |
| `GET` | `/api/v1/payments/orders/{orderNumber}` | owner or admin |

### Administration And Recovery

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/orders/admin/all` | inspect all orders |
| `PUT` | `/api/v1/inventory/admin/items` | create or replace stock |
| `GET` | `/api/v1/payments/admin` | inspect all payments |
| `POST` | `/api/v1/payments/admin/simulation?mode=TIMEOUT` | select stub-provider behavior |
| `POST` | `/api/v1/payments/admin/orders/{orderNumber}/reconcile` | resolve a timed-out payment |
| `POST` | `/api/v1/payments/admin/orders/{orderNumber}/refund` | refund a payment |
| `GET` | `/api/v1/orders/admin/dead-letters` | inspect Order recovery records |
| `POST` | `/api/v1/orders/admin/dead-letters/{id}/replay` | replay an Order record |
| `GET` | `/api/v1/inventory/admin/dead-letters` | inspect Inventory recovery records |
| `POST` | `/api/v1/inventory/admin/dead-letters/{id}/replay` | replay an Inventory record |
| `GET` | `/api/v1/payments/admin/dead-letters` | inspect Payment recovery records |
| `POST` | `/api/v1/payments/admin/dead-letters/{id}/replay` | replay a Payment record |

### User Administration

These routes are served by User Service through the gateway. JWT permissions
provide the final method-level authorization check.

| Method | Path | Required permission |
|---|---|---|
| `GET` | `/api/v1/users` | `USER_READ` |
| `GET` | `/api/v1/users/{id}` | `USER_READ` |
| `POST` | `/api/v1/users` | `USER_CREATE` |
| `PATCH` | `/api/v1/users/{id}` | `USER_UPDATE` |
| `PATCH` | `/api/v1/users/{id}/password` | `USER_UPDATE` |
| `POST` | `/api/v1/users/{id}/password/reset` | `USER_UPDATE` |
| `DELETE` | `/api/v1/users/{id}` | `USER_DELETE` |

### Roles And Permissions

Role routes require `ROLE_ADMIN` at the HTTP security layer. Both Role and
Permission controllers require `ADMIN_ACCESS` at the method-security layer.

| Resource | List/read | Create | Update | Delete |
|---|---|---|---|---|
| Roles | `GET /api/v1/roles[/{id}]` | `POST /api/v1/roles` | `PATCH /api/v1/roles/{id}` | `DELETE /api/v1/roles/{id}` |
| Permissions | `GET /api/v1/permissions[/{id}]` | `POST /api/v1/permissions` | `PATCH /api/v1/permissions/{id}` | `DELETE /api/v1/permissions/{id}` |

See the internal [Shopverse service catalog](../services/SERVICE-CATALOG.md)
for User Service ownership, dependencies, and request flow. The service-level
README remains the operational source for direct-port commands and Swagger.

## Current Error Direction

Production-grade responses should consistently include:

```json
{
  "timestamp": "2026-06-11T10:00:00Z",
  "status": 409,
  "code": "DUPLICATE_REQUEST",
  "message": "The idempotency key is already associated with another request",
  "path": "/api/v1/orders/checkout",
  "correlationId": "demo-checkout-9001"
}
```

The POC has validation and exception handling. A single cross-service error
schema remains a hardening item and must be treated as planned until every
service returns it consistently.

## Complete POC Demo

1. Start the stack using the [Docker guide](https://github.com/taukhir/shopverse/tree/main/docker).
2. Confirm gateway, discovery, Config Server, MySQL, Kafka, and observability containers are healthy.
3. Log in through `POST /auth/login` and store the bearer token.
4. Call `GET /api/v1/orders/public/catalog` and choose an available product.
5. Submit checkout with unique `Idempotency-Key` and `X-Correlation-Id` headers.
6. Save the returned order ID and order number.
7. Call `GET /api/v1/orders/{id}/timeline` as the owning customer.
8. Call `GET /api/v1/payments/orders/{orderNumber}` as the same customer.
9. Query Loki with the correlation ID and inspect the trace in Zipkin.
10. Inspect SAGA, outbox, HTTP, JVM, and payment metrics in Grafana.
11. Repeat checkout with the same idempotency key and confirm that no second order, reservation, or payment is created.
12. Log in as another customer and confirm the timeline and payment return `403`.
13. Log in as an administrator and confirm cross-customer access succeeds.
14. Select `DECLINE` or `TIMEOUT` payment simulation and observe compensation or reconciliation.
15. Inspect and replay a persisted dead-letter record after correcting its cause.

See [Features and demos](../reference/FEATURES-AND-DEMOS.md) for failure demonstrations.

## Related Guides

- [Generic REST API design](REST-API-GENERIC.md)
- [Features and demonstrations](../reference/FEATURES-AND-DEMOS.md)
- [System design](../architecture/SYSTEM-DESIGN.md)
- [Debugging](DEBUGGING.md)
