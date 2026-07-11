---
title: REST API Design
difficulty: Beginner
page_type: Concept
status: Generic
learning_objectives: [Design predictable resource-oriented HTTP APIs, Apply method status validation and idempotency semantics]
technologies: [HTTP, REST, JSON]
last_reviewed: "2026-07-11"
---

# REST API Design

REST stands for **Representational State Transfer**. It is an architectural
style for exposing resources through standard HTTP semantics. In a REST API,
clients operate on resource representations, usually JSON, using HTTP methods
such as `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`.

Read this page if you want to understand:

- resource naming conventions and versioning;
- safe and idempotent HTTP methods;
- status-code selection;
- pagination, filtering, sorting, and validation;
- API consistency rules that apply before Spring-specific implementation.

REST APIs expose resources through stable HTTP contracts. A good contract is
predictable for clients, independent of database entities, secure by default,
and observable when requests fail.

This guide contains reusable REST design guidance. Shopverse endpoints and
demonstration steps are documented in the [Shopverse API guide](API-GUIDE.md).

## Core REST Design Principles

The following principles should be decided before controllers and DTOs are
implemented. They make an API predictable for clients and easier to secure,
operate, and evolve.

### 1. Model Resources And Use Consistent Names

URLs identify resources, while HTTP methods describe the operation. Use
lowercase, plural nouns and hyphens for multi-word path segments.

| Prefer | Avoid | Reason |
|---|---|---|
| `GET /api/v1/orders` | `GET /api/v1/getOrders` | The HTTP method already expresses the action |
| `GET /api/v1/orders/42` | `GET /api/v1/order?id=42` | The resource identifier belongs in the path |
| `POST /api/v1/orders` | `POST /api/v1/createOrder` | Use a noun-based collection |
| `GET /api/v1/order-items` | `GET /api/v1/orderItems` | Keep path naming lowercase and consistent |
| `GET /api/v1/orders/42/items` | `GET /api/v1/itemsForOrder/42` | Represent relationships through resource hierarchy |

Use query parameters for filtering, sorting, searching, and pagination:

```http
GET /api/v1/orders?status=CONFIRMED&page=0&size=20&sort=createdAt,desc
```

Do not expose database table names, Java class names, implementation details,
or verbs such as `get`, `create`, and `delete` when normal resource semantics
are sufficient. Domain commands such as `refund`, `cancel`, or `checkout` are
acceptable when they cannot be represented clearly as ordinary CRUD.

### 2. Version Public Contracts

Version APIs so incompatible changes can be introduced without unexpectedly
breaking existing clients. URI versioning is explicit and easy to operate:

```http
GET /api/v1/orders/42
GET /api/v2/orders/42
```

Do:

- keep compatible additions, such as optional fields, within the same version;
- publish deprecation and removal dates;
- support old and new versions during an agreed migration period;
- use contract tests for important consumers.

Do not create a new version for every implementation change. A new major
version is normally required when fields are removed or renamed, types change,
or request and response semantics become incompatible.

### 3. Require HTTPS

Use HTTPS for every external API and for internal service communication when
the deployment environment supports service TLS or mTLS. HTTPS provides
encryption in transit, server identity verification, and message integrity.

Do:

- redirect or reject plain HTTP at the ingress;
- use valid, automatically rotated certificates;
- use mTLS when services must authenticate each other;
- mark security cookies `Secure`, `HttpOnly`, and with an appropriate
  `SameSite` policy.

HTTPS does not replace authentication, authorization, input validation, or
safe secret handling.

### 4. Respect HTTP Method Semantics

Choose methods according to their defined meaning:

| Method | Intended use | Safe | Idempotent | Typical response |
|---|---|---:|---:|---|
| `GET` | Read a representation | Yes | Yes | `200`, `304`, `404` |
| `HEAD` | Read headers without a body | Yes | Yes | `200`, `304`, `404` |
| `OPTIONS` | Discover communication options | Yes | Yes | `204`, `200` |
| `POST` | Create a resource or submit a command | No | No, by default | `201`, `202`, `200`, `409` |
| `PUT` | Replace a resource at a known URI | No | Yes | `200`, `204`, `404` |
| `PATCH` | Apply a partial change | No | Depends on the patch | `200`, `204`, `409` |
| `DELETE` | Remove a resource | No | Yes | `204`, `404` |

A **safe** method is read-only from the client's perspective. Logging and
metrics may occur, but a `GET` request must not create an order, charge a
payment, or change inventory.

An **idempotent** method can be repeated with the same intended server-side
effect. The response may differ; for example, a repeated `DELETE` can return
`404` after the resource has already been removed.

Safe methods are automatically idempotent because they should not change
business state. Idempotent does not mean read-only; `PUT` and `DELETE` can
change state, but repeating the same request should not create additional
side effects.

### 5. Design Idempotency For Retried Commands

Networks can lose responses even after a server successfully commits work.
Clients, gateways, and message consumers can therefore repeat requests.
Non-idempotent commands such as checkout and payment creation should accept a
stable idempotency key:

```http
POST /api/v1/orders/checkout
Idempotency-Key: checkout-customer-42-cart-9001
```

The server should persist the key, request identity, and result in durable
storage. Repeating the same request returns the original result without
creating another order or charge. Reusing the key for a different request
should return `409 Conflict`.

Database uniqueness is the final concurrency guarantee. A check such as
`existsByIdempotencyKey(...)` without a unique constraint is vulnerable to
race conditions.

### 6. Return Accurate HTTP Status Codes

Use status codes to describe the protocol-level result:

| Situation | Recommended status |
|---|---|
| Successful read or update with a body | `200 OK` |
| Resource created | `201 Created` |
| Asynchronous work accepted | `202 Accepted` |
| Successful request without a body | `204 No Content` |
| Cached representation still valid | `304 Not Modified` |
| Resource permanently moved | `301 Moved Permanently` |
| Temporary redirect that may change back | `302 Found` or `307 Temporary Redirect` |
| Permanent redirect preserving method | `308 Permanent Redirect` |
| Malformed request | `400 Bad Request` |
| Missing or invalid authentication | `401 Unauthorized` |
| Authenticated but not permitted | `403 Forbidden` |
| Resource not found | `404 Not Found` |
| Duplicate, state, or version conflict | `409 Conflict` |
| Structurally valid but semantically invalid input | `422 Unprocessable Content` |
| Rate limit exceeded | `429 Too Many Requests` |
| Unexpected server failure | `500 Internal Server Error` |
| Temporary dependency or capacity failure | `503 Service Unavailable` |

Do not return `200 OK` with an error payload. Include `Location` with
`201 Created` or `202 Accepted` when clients can follow a resource or operation.

Use 3xx responses deliberately. Redirects are useful for canonical URLs,
resource moves, download links, and cache validation, but API clients must know
whether the HTTP method may change during redirect handling.

### 7. Keep APIs Stateless

Each request should contain the authentication and request context needed to
process it. A service instance should not depend on in-memory state created by
a previous request. Stateless APIs can be load balanced and scaled more
reliably.

Durable business state belongs in a database, cache, or message system. A
server-side login session is valid when deliberately designed, but it must be
stored or replicated so another instance can continue the interaction.

### 8. Use Stable DTOs And Representations

Do not expose JPA entities directly. Define request and response DTOs so API
contracts can evolve independently from persistence schemas. Use consistent:

- field naming and date formats, preferably ISO 8601 with a timezone;
- money representation, including currency and decimal precision;
- identifier types;
- null and optional-field behavior;
- content types such as `application/json`.

Support content negotiation through `Accept` and `Content-Type` where multiple
representations are genuinely needed.

### 9. Validate At The Boundary

Validate structure, size, ranges, formats, and nested objects before business
processing. Use Jakarta Validation for request shape and domain services for
rules requiring current business state.

```java
public record CreateOrderRequest(
        @NotBlank @Size(max = 100) String customerUsername,
        @NotEmpty @Size(max = 20) List<@Valid OrderItemRequest> items
) {
}
```

Reject unknown or oversized input where appropriate. Validation must also
exist at database boundaries through constraints such as `NOT NULL`, unique
keys, foreign keys, and optimistic locking.

### 10. Standardize Error Responses

Return one machine-readable error shape across services. Include a stable
error code, useful message, request path, timestamp, and correlation ID.
Never expose stack traces, SQL, credentials, internal hostnames, or secrets.

Use Spring `ProblemDetail` or an equivalent RFC 9457 problem response and map
exceptions centrally with `@RestControllerAdvice`.

### 11. Bound Collection APIs

Every collection endpoint should define pagination, maximum page size, stable
sorting, and allow-listed filters. Use indexed fields for common queries.
Cursor pagination is preferable for large or rapidly changing datasets.

Never expose an endpoint that can load an unbounded table into memory.

### 12. Secure And Operate The Contract

- Authenticate requests and authorize both the operation and resource owner.
- Apply rate limits, request-size limits, timeouts, and concurrency limits.
- Restrict CORS to required origins, headers, and methods.
- Never log passwords, tokens, secrets, or sensitive payment data.
- Emit correlated logs, traces, request counts, error counts, and latency.
- Publish OpenAPI documentation with examples and error responses.
- Preserve backward compatibility and test important consumer contracts.

The following sections explain these principles and their implementation in
more detail.

## Continue With The Focused Guides

- [HTTP contracts and representations](REST-API-HTTP-CONTRACTS.md) covers resource URLs, methods, status codes, DTOs, and error responses.
- [Production API design](REST-API-PRODUCTION-DESIGN.md) covers queries, concurrency, asynchronous work, compatibility, security, caching, resilience, observability, and maturity.
- [Shopverse API guide](API-GUIDE.md) maps these reusable rules to the running platform.
