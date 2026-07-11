---
title: REST API HTTP Contracts And Representations
difficulty: Intermediate
page_type: Concept
status: Generic
prerequisites: [REST API design fundamentals]
learning_objectives: [Choose correct HTTP methods and status codes, Design stable DTO and error contracts]
technologies: [HTTP, REST, JSON]
last_reviewed: "2026-07-11"
---

# REST API HTTP Contracts And Representations

This focused guide continues [REST API design](REST-API-GENERIC.md).

## Resource-Oriented URLs

Use nouns for resources and HTTP methods for operations:

```http
GET    /api/v1/orders
GET    /api/v1/orders/42
POST   /api/v1/orders
PATCH  /api/v1/orders/42
DELETE /api/v1/orders/42
```

Prefer:

```text
/orders/42/payments
/orders/42/timeline
```

Avoid RPC-style paths when a resource model is clear:

```text
/getOrder
/createNewOrder
/deleteOrderById
```

An action endpoint is reasonable when the action represents a domain command
that does not map cleanly to CRUD:

```http
POST /api/v1/payments/orders/ORD-1001/refund
```

Use lowercase paths, plural resource names, and consistent naming. Do not
expose implementation terms such as table names or Java class names.

## HTTP Method Semantics

| Method | Typical purpose | Safe | Idempotent |
|---|---|---:|---:|
| `GET` | Read a resource | Yes | Yes |
| `HEAD` | Read response metadata | Yes | Yes |
| `POST` | Create or execute a command | No | Not inherently |
| `PUT` | Replace a resource at a known URI | No | Yes |
| `PATCH` | Partially update a resource | No | Depends on operation |
| `DELETE` | Remove a resource | No | Yes |

Safe means the request should not change business state. Idempotent means
repeating the same request has the same intended effect, although response
metadata can differ.

### Safe Methods

HTTP safe methods are:

| Method | Why it is safe |
|---|---|
| `GET` | retrieves a representation |
| `HEAD` | retrieves headers only |
| `OPTIONS` | asks which methods/options are supported |
| `TRACE` | diagnostic echo; usually disabled in production |

Safe means the client did not ask for a state change. The server may still
write access logs, metrics, audit reads, or cache entries. It must not perform
business changes such as:

- creating an order;
- charging a payment;
- reducing inventory;
- changing user status;
- sending an email as the main operation.

### Idempotent Methods

HTTP idempotent methods are:

| Method | Why it is idempotent |
|---|---|
| `GET` | repeated reads have the same intended effect |
| `HEAD` | repeated metadata reads have the same intended effect |
| `OPTIONS` | repeated capability checks have the same intended effect |
| `PUT` | repeatedly replacing the resource with the same representation has the same final state |
| `DELETE` | repeatedly deleting the same resource leaves it deleted |

`POST` is not idempotent by default:

```http
POST /api/v1/orders
```

If repeated, it can create multiple orders. For business commands that may be
retried, use a durable idempotency key:

```http
POST /api/v1/orders/checkout
Idempotency-Key: checkout-user-42-cart-9001
```

`PATCH` depends on the patch document. This can be idempotent:

```http
PATCH /api/v1/users/42
Content-Type: application/merge-patch+json

{ "displayName": "Ahmed" }
```

This may not be idempotent:

```http
PATCH /api/v1/accounts/42

{ "operation": "incrementBalance", "amount": 100 }
```

`POST` operations that create orders, payments, or other irreversible effects
should support an idempotency key:

```http
POST /api/v1/orders/checkout
Idempotency-Key: checkout-user-42-cart-9001
```

Store the key with the result and enforce uniqueness in the database. An
in-memory existence check alone does not prevent concurrent duplicates.

## Status Codes

| Status | Use |
|---|---|
| `200 OK` | Successful read or command with a response body |
| `201 Created` | Resource created; include `Location` when practical |
| `202 Accepted` | Asynchronous work accepted but not completed |
| `204 No Content` | Successful operation without a response body |
| `301 Moved Permanently` | Resource has a permanent new URI; clients may update stored links |
| `302 Found` | Temporary redirect; historically clients may change method to `GET` |
| `303 See Other` | Redirect client to retrieve another resource with `GET`, often after `POST` |
| `304 Not Modified` | Cached representation is still valid; response has no body |
| `307 Temporary Redirect` | Temporary redirect preserving original method and body |
| `308 Permanent Redirect` | Permanent redirect preserving original method and body |
| `400 Bad Request` | Malformed request or invalid syntax |
| `401 Unauthorized` | Authentication is missing or invalid |
| `403 Forbidden` | Identity is valid but lacks access |
| `404 Not Found` | Resource does not exist or must be concealed |
| `409 Conflict` | State conflict, duplicate key, or version conflict |
| `422 Unprocessable Content` | Semantically invalid request |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Unexpected server failure |
| `503 Service Unavailable` | Temporary dependency or capacity failure |

Do not return `200` with an error object. The HTTP status must describe the
result so clients, gateways, and monitoring systems can interpret it.

### Important 3xx Status Codes

3xx responses tell the client that another action is needed, usually using a
`Location` header.

| Code | Meaning | API guidance |
|---|---|---|
| `301 Moved Permanently` | Resource URI changed permanently | Useful for canonical URLs; be careful because clients may cache it |
| `302 Found` | Temporary redirect | Common in browsers; API clients may change method to `GET` |
| `303 See Other` | See another resource using `GET` | Useful after `POST` when client should fetch operation/result resource |
| `304 Not Modified` | Cached copy is still valid | Used with `ETag` or `Last-Modified`; no response body |
| `307 Temporary Redirect` | Temporary redirect, method preserved | Safer than `302` for APIs when method/body must not change |
| `308 Permanent Redirect` | Permanent redirect, method preserved | Safer than `301` for APIs when method/body must not change |

Examples:

```http
HTTP/1.1 303 See Other
Location: /api/v1/orders/ORD-1001
```

Use this when a command was accepted or completed and the client should fetch
the resulting resource with `GET`.

```http
GET /api/v1/products/101
If-None-Match: "v7"

HTTP/1.1 304 Not Modified
ETag: "v7"
```

Use this for cache validation. The client keeps using its cached
representation.

For APIs, prefer `307`/`308` over `302`/`301` when the original method and body
must be preserved.

## Requests, Responses, And DTOs

Expose stable request and response DTOs rather than JPA entities. This prevents
lazy-loading leaks, accidental field exposure, recursive serialization, and
tight coupling between database and API schemas.

```java
public record CheckoutRequest(
        @NotEmpty @Size(max = 20) List<@Valid CheckoutItemRequest> items
) {
}

public record CheckoutItemRequest(
        @NotNull @Positive Long productId,
        @Positive int quantity
) {
}
```

Use Jakarta Validation for structural validation and service/domain code for
business rules. Validation errors should identify the field, rejected rule,
and correlation ID without exposing internals.

Keep response shapes consistent. Avoid returning unrelated shapes from the
same endpoint based on success or failure.

## Error Contract

A shared error model makes client and operational behavior predictable:

```json
{
  "timestamp": "2026-06-11T10:00:00Z",
  "status": 409,
  "code": "DUPLICATE_REQUEST",
  "message": "The idempotency key belongs to another request",
  "path": "/api/v1/orders/checkout",
  "correlationId": "demo-checkout-9001",
  "fieldErrors": []
}
```

Use a stable machine-readable `code`; human-readable messages can change.
Never return stack traces, SQL, secrets, internal hosts, or dependency
credentials. Spring's `ProblemDetail` can be used to implement a consistent
problem response while adding application-specific properties.

## Continue

Continue with [production API design](REST-API-PRODUCTION-DESIGN.md).
