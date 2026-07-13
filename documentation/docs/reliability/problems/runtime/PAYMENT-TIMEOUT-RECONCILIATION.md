---
title: Payment Timeout Reconciliation Problem
status: "maintained"
last_reviewed: "2026-07-13"
---


# Payment Timeout Reconciliation Problem

Payment uncertainty, timeout reconciliation, and refunds.

Back to [Runtime Reliability Problems](../RUNTIME-RELIABILITY-PROBLEMS.md).

## Payment Timeout Reconciliation And Refunds

### Problem Statement

Payment providers do not always return a clean success or failure response.
A timeout means Payment Service did not receive a definitive answer:

```text
Payment Service -> provider authorize/capture request
provider may have processed it
network/provider response times out
Payment Service does not know final outcome
```

Treating timeout as automatic decline can be wrong if the provider actually
captured the payment. Retrying blindly can also be wrong because the retry can
charge the customer twice.

The correct model is payment uncertainty:

```text
PENDING -> TIMED_OUT
```

The system must preserve the uncertain state and provide an explicit recovery
operation.

### Solution

Shopverse Payment Service models payment states:

```java
public enum PaymentStatus {
    PENDING,
    AUTHORIZED,
    CAPTURED,
    DECLINED,
    TIMED_OUT,
    REFUNDED
}
```

The stub provider supports:

```text
SUCCESS
DECLINE
TIMEOUT
```

When the provider returns `TIMEOUT`, Payment Service stores:

```java
payment.timeOut(providerResult.reason());
```

No `payment.completed` or `payment.failed` event is published for that
uncertain outcome. The payment remains visible as `TIMED_OUT` until an
administrator reconciles it.

### Reconciliation API

```http
POST /api/v1/payments/admin/orders/{orderNumber}/reconcile
Authorization: Bearer <admin-token>
```

Implementation behavior:

```java
@Transactional
public PaymentResponse reconcile(String orderNumber) {
    PaymentEntity payment = findPayment(orderNumber);
    if (payment.getStatus() == PaymentStatus.TIMED_OUT) {
        payment.authorize("RECONCILED-" + orderNumber);
        payment.capture();
        outboxService.enqueue(
                "PAYMENT",
                payment.getOrderNumber(),
                PaymentCompletedEvent.class.getSimpleName(),
                topics.paymentCompleted(),
                payment.getOrderNumber(),
                new PaymentCompletedEvent(...),
                payment.getCorrelationId()
        );
    }
    return toResponse(payment);
}
```

Reconciliation converts the uncertain payment to `CAPTURED` and emits
`payment.completed` through the outbox. Order Service later consumes that
event and confirms the order.

If reconciliation completes after the Inventory reservation has already
expired, confirmation is unsafe because released stock may have been assigned
elsewhere. The target workflow detects the late payment and starts an
idempotent refund instead. See
[Late Payment Reconciliation After Expiry](LATE-PAYMENT-AFTER-EXPIRY.md).

### Refund API

```http
POST /api/v1/payments/admin/orders/{orderNumber}/refund
Authorization: Bearer <admin-token>
```

Refund is allowed only for captured payments:

```java
if (payment.getStatus() != PaymentStatus.CAPTURED) {
    throw new IllegalStateException("Only captured payments can be refunded");
}
payment.refund();
```

Current POC scope:

| Operation | Effect |
|---|---|
| reconciliation | `TIMED_OUT -> CAPTURED`, publishes `payment.completed` |
| refund | `CAPTURED -> REFUNDED`, local Payment state update |

The POC does not yet publish `payment.refunded` or reverse the Order state
after refund. A production payment integration should also use provider-side
idempotency keys, webhook verification, settlement reconciliation, dispute
handling, and refund event publication.

### Demo

Set timeout mode:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "$gateway/api/v1/payments/admin/simulation?mode=TIMEOUT" `
  -Headers @{ Authorization = "Bearer $adminToken" }
```

Create checkout and verify the payment is `TIMED_OUT`.

Reconcile:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "$gateway/api/v1/payments/admin/orders/<order-number>/reconcile" `
  -Headers @{ Authorization = "Bearer $adminToken" }
```

Refund after capture:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "$gateway/api/v1/payments/admin/orders/<order-number>/refund" `
  -Headers @{ Authorization = "Bearer $adminToken" }
```

### Failure And Operations Checklist

- preserve `TIMED_OUT` as uncertainty rather than guessing success or failure;
- reconcile using the provider operation/idempotency key and verified webhooks;
- make reconciliation and refund state transitions conditional and idempotent;
- alert on age and count of uncertain payments, webhook verification failures,
  duplicate provider references, refund failures, and settlement mismatches;
- keep an immutable audit trail while excluding payment credentials and sensitive PII;
- route exhausted cases to explicit manual review instead of infinite retry.

## Official References

- [Stripe API idempotent requests](https://docs.stripe.com/api/idempotent_requests)
- [PCI Security Standards Council](https://www.pcisecuritystandards.org/)
- [RFC 9110 — Idempotent Methods](https://www.rfc-editor.org/rfc/rfc9110#section-9.2.2)

## Recommended Next Page

Continue with [Late Payment Reconciliation After Expiry](./LATE-PAYMENT-AFTER-EXPIRY.md).



















