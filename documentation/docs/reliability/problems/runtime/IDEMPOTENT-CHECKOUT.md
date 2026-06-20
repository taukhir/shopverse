---
title: Idempotent Checkout Problem
---

# Idempotent Checkout Problem

Mandatory Idempotency-Key and duplicate checkout prevention.

Back to [Runtime Reliability Problems](../RUNTIME-RELIABILITY-PROBLEMS.md).

## Idempotent Checkout Using Mandatory Idempotency-Key

### Problem Statement

Checkout is a side-effecting command. A client, gateway, load balancer, or
network retry may send the same request again when the first response is slow,
lost, or ambiguous.

Without idempotency, this can create:

- two orders for the same customer action;
- two inventory reservations;
- two payment attempts;
- two SAGA timelines;
- confusing customer support and reconciliation work.

The difficult case is not only a double-click. It is the unknown result:

```text
Client sends checkout
Order Service creates order
Response is lost before client receives it
Client retries checkout
```

The retry must return the original result, not create a second checkout.

### Solution

Order Service requires every checkout request to provide a stable
`Idempotency-Key` header:

```java
@PostMapping("/checkout")
public ResponseEntity<OrderResponse> checkout(
        @Valid @RequestBody CheckoutRequest request,
        @RequestHeader("Idempotency-Key")
        @NotBlank
        @Size(max = 100)
        String idempotencyKey,
        Authentication authentication
) {
    String correlationId = MDC.get(CorrelationConstants.MDC_KEY);
    OrderResponse order = orderService.checkout(
            request,
            authentication.getName(),
            correlationId,
            idempotencyKey
    );
    return ResponseEntity.status(HttpStatus.CREATED).body(order);
}
```

The service first checks whether the key already produced an order:

```java
var existing = repository.findWithItemsByIdempotencyKey(idempotencyKey);
if (existing.isPresent()) {
    if (!existing.get().getCustomerUsername().equals(username)) {
        throw new IllegalStateException(
                "Idempotency key is already owned by another customer"
        );
    }
    return OrderMapper.toResponse(existing.get());
}
```

If the key belongs to the same customer, the existing order is returned. If
another customer tries to reuse the same key, the service returns a conflict.

The key is also stored as a unique database column:

```java
@Column(nullable = false, unique = true, length = 100)
private String idempotencyKey;
```

Liquibase enforces the invariant:

```yaml
- addUniqueConstraint:
    tableName: orders
    columnNames: idempotency_key
    constraintName: uk_orders_idempotency_key
```

The database constraint is important because two concurrent requests can pass
the application lookup at nearly the same time. Only one insert can win. The
losing request receives `409 Conflict` and can retry with the same key to read
the created order.

### How It Helps

| Failure mode | Behavior with idempotency |
|---|---|
| user double-clicks checkout | second request returns existing order |
| client timeout after order creation | retry uses same key and returns existing order |
| gateway retries a slow request | unique key prevents duplicate order creation |
| two concurrent same-key requests race | database uniqueness allows only one order |
| another user reuses the key | service rejects with `409 Conflict` |

### Demo

Send checkout with a stable key:

```powershell
$headers = @{
  Authorization      = "Bearer $token"
  "X-Correlation-Id" = "demo-checkout-1001"
  "Idempotency-Key"  = "checkout-user-42-cart-9001"
}

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:8080/api/v1/orders/checkout" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body '{"items":[{"productId":101,"quantity":1}]}'
```

Repeat the exact request with the same `Idempotency-Key`. The response should
refer to the same order number instead of creating a second order.

Confirm in MySQL:

```sql
SELECT order_number, customer_username, status, correlation_id, idempotency_key
FROM order_service.orders
WHERE idempotency_key = 'checkout-user-42-cart-9001';
```






