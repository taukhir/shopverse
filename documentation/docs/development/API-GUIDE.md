---
title: Shopverse API Guide
difficulty: Intermediate
page_type: Reference
status: Implemented
prerequisites: [Running Shopverse stack, Valid demo credentials]
learning_objectives: [Discover Shopverse endpoints and authorization rules, Run the main API demonstration flows]
technologies: [REST, JWT, Spring MVC]
last_reviewed: "2026-07-13"
---

# API Guide

This guide is the Shopverse endpoint catalog and POC demonstration runbook.
Reusable HTTP design guidance is maintained in
[REST API design](REST-API-GENERIC.md).

The endpoints and flows below describe current POC behavior unless a section
is explicitly marked as hardening or roadmap. For feature status, see
[Features and demos](../reference/FEATURES-AND-DEMOS.md).

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

<ApiPanel method="POST" path="/auth/login" title="Authenticate and issue an access token">

```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "<password>"
}
```

</ApiPanel>

Use the returned token:

```http
Authorization: Bearer eyJ...
```

## Checkout

<ApiPanel method="POST" path="/api/v1/orders/checkout" title="Create an idempotent checkout">

```http
POST /api/v1/orders/checkout
Authorization: Bearer <token>
Idempotency-Key: checkout-user-42-cart-9001
X-Correlation-Id: demo-checkout-9001
Content-Type: application/json

{
  "shippingAddress": {
    "recipientName": "Ahmed Khan",
    "phoneNumber": "+919876543210",
    "line1": "42 Market Road",
    "line2": "Apt 5",
    "city": "Bangalore",
    "state": "Karnataka",
    "postalCode": "560001",
    "country": "India"
  },
  "items": [
    {
      "productId": 101,
      "quantity": 1
    }
  ]
}
```

Current validation allows one checkout item. Reusing the idempotency key returns the existing order and must not reserve or charge twice. The shipping address is stored as an immutable snapshot on the Order.

</ApiPanel>

## Important APIs

### Authentication And Public

| Method | Path |
|---|---|
| `POST` | `/auth/login` |
| `GET` | `/auth/.well-known/jwks.json` |
| `POST` | `/api/v1/public/users/register` |
| `GET` | `/api/v1/public/health` |
| `GET` | `/api/v1/orders/public/health` |
| `GET` | `/api/v1/orders/public/catalog` |
| `GET` | `/api/v1/inventory/public/items` |
| `GET` | `/api/v1/inventory/public/items/{productId}` |
| `GET` | `/api/v1/inventory/public/items/{productId}/related` |
| `GET` | `/api/v1/inventory/public/categories` |
| `GET` | `/api/v1/payments/public/health` |

### Customer Commerce

| Method | Path | Rule |
|---|---|---|
| `GET` | `/api/v1/users/me` | current user's profile |
| `PUT` | `/api/v1/users/me` | update current user's profile |
| `PATCH` | `/api/v1/users/me` | partial profile update alias |
| `GET` | `/api/v1/users/me/addresses` | current user's address book |
| `POST` | `/api/v1/users/me/addresses` | create address |
| `PUT` | `/api/v1/users/me/addresses/{addressId}` | update owned address |
| `DELETE` | `/api/v1/users/me/addresses/{addressId}` | delete owned address |
| `GET` | `/api/v1/cart` | load persisted cart |
| `PUT` | `/api/v1/cart` | replace persisted cart |
| `POST` | `/api/v1/cart/merge` | merge browser cart into account cart |
| `POST` | `/api/v1/cart/validate` | structural cart validation |
| `DELETE` | `/api/v1/cart/items/{productId}` | remove cart item |
| `GET` | `/api/v1/orders` | current user's orders |
| `GET` | `/api/v1/orders/{id}` | owner or admin |
| `GET` | `/api/v1/orders/{id}/timeline` | owner or admin |
| `POST` | `/api/v1/orders/checkout` | authenticated |
| `POST` | `/api/v1/orders/{id}/cancel` | owner |
| `POST` | `/api/v1/orders/{id}/return-request` | owner, delivered orders |
| `GET` | `/api/v1/payments/orders/{orderNumber}` | owner or admin |
| `POST` | `/api/v1/payments/intent` | authenticated |
| `POST` | `/api/v1/payments/orders/{orderNumber}/retry` | owner or admin |
| `POST` | `/api/v1/payments/orders/{orderNumber}/refund` | owner or admin |

### Administration And Recovery

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/orders/admin/all` | inspect all orders |
| `POST` | `/api/v1/orders/admin/{id}/cancel` | cancel order from operations |
| `POST` | `/api/v1/orders/admin/{id}/pack` | move confirmed order to packing |
| `POST` | `/api/v1/orders/admin/{id}/ship` | advance packing/shipped order |
| `POST` | `/api/v1/orders/admin/{id}/deliver` | mark shipped order delivered |
| `POST` | `/api/v1/orders/admin/catalog-cache/evict` | evict cached inventory catalog data |
| `PUT` | `/api/v1/inventory/admin/items` | create or replace stock |
| `POST` | `/api/v1/inventory/admin/items/{productId}/image` | upload or replace product image |
| `GET` | `/api/v1/inventory/admin/reservations/orders/{orderNumber}` | inspect reservation state for one order |
| `GET` | `/api/v1/payments/admin` | inspect all payments |
| `POST` | `/api/v1/payments/admin/simulation?mode=TIMEOUT` | select stub-provider behavior |
| `POST` | `/api/v1/payments/admin/orders/{orderNumber}/reconcile` | resolve a timed-out payment |
| `POST` | `/api/v1/payments/admin/orders/{orderNumber}/refund` | refund a payment |
| `POST` | `/api/v1/payments/webhooks/provider` | provider callback baseline |
| `GET` | `/api/v1/admin/audit-events` | list immutable admin audit events; Angular falls back to derived signals until implemented |
| `GET` | `/api/v1/admin/audit-events/{id}` | inspect one admin audit event; planned backend contract |
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
| `GET` | `/api/v1/users/me` | authenticated user |
| `PUT` | `/api/v1/users/me` | authenticated user |
| `PATCH` | `/api/v1/users/me` | authenticated user |
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

## Error Contract Direction

Production-grade responses should consistently include the shape below. This
is the target direction for cross-service consistency, not a guarantee that
every current Shopverse service returns this exact schema today:

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

## Recent Problems Solved

| Problem | Implemented solution | Remaining hardening |
|---|---|---|
| Cancelled orders could leave Inventory stock reserved | Order emits `OrderCancelledEvent`; Inventory consumes it and releases the reservation | add explicit cancellation integration test across Kafka |
| Checkout did not preserve delivery details | Customer address book plus immutable Order shipping snapshot | address validation/country rules and delivery-rate integration |
| Cart was browser-only | User Service owns persisted cart APIs; Angular merges local cart after login | validate cart against Inventory stock and product availability |
| Product detail depended on broad catalog data | Inventory exposes public item detail, categories, and related-product APIs | add server-side search/filter/sort and pagination |
| Customer order actions were placeholders | Customer cancel, payment retry, refund request, and return request are wired | split refund request from direct refund execution for production |
| Admin fulfillment was missing | Admin pack, ship/out-for-delivery, deliver, and cancel transitions exist | add admin audit comments and carrier/tracking metadata |
| Payment retry/refund lacked customer-facing APIs | Payment retry/refund endpoints now exist and emit terminal outbox events | provider idempotency keys, webhook signature verification, retry limits |

## Complete POC Demo

1. Start the stack using the [Docker guide](https://github.com/taukhir/shopverse/tree/main/docker).
2. Confirm gateway, discovery, Config Server, MySQL, Kafka, and observability containers are healthy.
3. Log in through `POST /auth/login` and store the bearer token.
4. Call `GET /api/v1/inventory/public/items` and choose an available product.
5. Create or confirm an account address through `/api/v1/users/me/addresses`.
6. Persist a cart through `/api/v1/cart` or merge a browser cart through `/api/v1/cart/merge`.
7. Submit checkout with shipping snapshot, unique `Idempotency-Key`, and `X-Correlation-Id` headers.
8. Save the returned order ID and order number.
9. Call `GET /api/v1/orders/{id}/timeline` as the owning customer.
10. Call `GET /api/v1/payments/orders/{orderNumber}` as the same customer.
11. Query Loki with the correlation ID and inspect the trace in Zipkin.
12. Inspect SAGA, outbox, HTTP, JVM, and payment metrics in Grafana.
13. Repeat checkout with the same idempotency key and confirm that no second order, reservation, or payment is created.
14. Log in as another customer and confirm the timeline and payment return `403`.
15. Log in as an administrator and confirm cross-customer access succeeds.
16. Select `DECLINE` or `TIMEOUT` payment simulation and observe compensation, retry, or reconciliation.
17. Move a confirmed order through pack, ship, out-for-delivery, and deliver.
18. Request a return as the owning customer after delivery.
19. Cancel another reserved order and verify Inventory releases stock.
20. Inspect and replay a persisted dead-letter record after correcting its cause.

See [Features and demos](../reference/FEATURES-AND-DEMOS.md) for failure demonstrations.

## Related Guides

- [Generic REST API design](REST-API-GENERIC.md)
- [Features and demonstrations](../reference/FEATURES-AND-DEMOS.md)
- [System design](../architecture/SYSTEM-DESIGN.md)
- [Debugging](DEBUGGING.md)
