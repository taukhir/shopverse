# API Guide

## REST Conventions

- APIs are versioned under `/api/v1`.
- resources use nouns and HTTP methods express the action;
- request records use Jakarta Validation;
- protected APIs require `Authorization: Bearer <token>`;
- checkout requires `Idempotency-Key`;
- responses use stable DTOs instead of exposing JPA entities;
- ownership checks protect customer-specific order and payment records.

The gateway at `http://localhost:8080` is the normal entry point.

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

### Public

| Method | Path |
|---|---|
| `POST` | `/auth/login` |
| `GET` | `/auth/.well-known/jwks.json` |
| `GET` | `/api/v1/orders/public/health` |
| `GET` | `/api/v1/orders/public/catalog` |
| `GET` | `/api/v1/inventory/public/items` |

### Customer

| Method | Path | Rule |
|---|---|---|
| `GET` | `/api/v1/orders` | current user's orders |
| `GET` | `/api/v1/orders/{id}` | owner or admin |
| `GET` | `/api/v1/orders/{id}/timeline` | owner or admin |
| `POST` | `/api/v1/orders/checkout` | authenticated |
| `GET` | `/api/v1/payments/orders/{orderNumber}` | owner or admin |

### Administrator

| Method | Path |
|---|---|
| `GET` | `/api/v1/orders/admin/all` |
| `PUT` | `/api/v1/inventory/admin/items` |
| `GET` | `/api/v1/payments/admin` |
| `POST` | `/api/v1/payments/admin/simulation?mode=TIMEOUT` |
| `POST` | `/api/v1/payments/admin/orders/{orderNumber}/reconcile` |
| `POST` | `/api/v1/payments/admin/orders/{orderNumber}/refund` |
| `GET/POST` | service dead-letter inspection/replay endpoints |

User, Role, and Permission CRUD are documented in [user-service/README.md](../../user-service/README.md).

## Error Design

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

The POC has validation and exception handling, but a single cross-service error schema remains a useful hardening item.

## Complete Demo

1. Start the stack using the Docker guide.
2. Log in and store the bearer token.
3. call the catalog endpoint and choose an available product.
4. submit checkout with a unique idempotency and correlation ID.
5. read the order and timeline.
6. read the payment as the same customer.
7. query Loki by correlation ID.
8. inspect the trace in Zipkin.
9. inspect SAGA and payment metrics in Grafana.
10. repeat the same checkout key and confirm no duplicate order.

See [Features and demos](../reference/FEATURES-AND-DEMOS.md) for failure demonstrations.
