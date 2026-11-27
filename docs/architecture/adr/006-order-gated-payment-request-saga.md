# ADR 006: Order-Gated Payment Request In Checkout Choreography

**Status:** Proposed by the Senior Solutions Architect on 2026-11-26; team adoption and implementation not yet approved.

## Context

Checkout uses Kafka choreography, service-owned databases, and local transactional outboxes. Inventory publishes InventoryReserved to independent Order and Payment consumer groups. Payment may therefore process the event and publish PaymentCompleted before Order processes InventoryReserved and enters PAYMENT_PROCESSING. OrderServiceImpl.confirm() ignores payment completion unless the order is already in PAYMENT_PROCESSING. The out-of-order result can be acknowledged and lost, leaving the order pending despite a completed payment.

Order also permits cancellation during PAYMENT_PROCESSING. It emits OrderCancelled for Inventory, but Payment does not consume an order-cancellation event. A late payment completion can be ignored by Order after cancellation. The current provider is a stub; real-provider financial consequences have not been exercised.

## Decision

Keep asynchronous Kafka choreography and the existing service/data boundaries. Make Order Service the causal gate for payment:

1. Inventory publishes InventoryReserved after its reservation transaction commits.
2. Order consumes it and, in one local transaction, advances the order to PAYMENT_PROCESSING, appends the timeline entry, and enqueues a new PaymentRequested event in the Order outbox.
3. Payment consumes PaymentRequested, creates or resumes one idempotent order-level payment attempt, and publishes PaymentCompleted or PaymentFailed through its outbox.
4. Order applies the terminal payment outcome only to the expected payment attempt and aggregate version. Duplicate or stale events are recorded/reconciled, not silently treated as successful processing.
5. Define cancellation during payment as a separate pending workflow. Payment must report whether the attempt was not started, voided, captured/refunded, or still uncertain before Order enters a terminal cancellation state. Inventory release remains an idempotent business transition.

PaymentRequested should carry a stable event ID, schema version, order number/key, payment-attempt ID, correlation ID, currency, amount, and only the customer information Payment actually needs. It must not carry credentials, payment secrets, or browser tokens. Use orderNumber as the Kafka key where per-order sequence is required.

Add a transactional inbox keyed by consumer and event ID; add expected aggregate/payment-attempt versions to reject stale events. Keep the provider idempotency identity stable across retries. Preserve outbox atomicity between each service's local state transition and event intent.

## Rationale

This corrects the cross-topic race without a synchronous Order-to-Payment call or a new central saga service. Order owns the order state machine, and Payment owns payment state and provider interaction. Each service remains independently deployable and commits only to its own database.

## Alternatives considered

- **Keep Payment subscribed directly to InventoryReserved:** rejected for the target because independent consumer groups provide no ordering guarantee between Order and Payment processing.
- **Add synchronous Order-to-Payment orchestration:** rejected because it couples availability and request latency and crosses local workflow boundaries.
- **Add a central saga-orchestrator service:** not justified at current scale; it adds another required service and duplicates state ownership. Reconsider only if workflow complexity and operations evidence show choreography is no longer manageable.

## Consequences and rollout

- This is a Kafka event-contract change. Add the compatible producer/consumer fields and listeners in a staged rollout; do not hard-cut consumers that may still process InventoryReserved directly.
- Keep the current one-item HTTP cap until the complete Order, Inventory, Payment, retry/DLT/replay, and frontend multi-item path is verified.
- Add MySQL/Kafka integration tests for inventory success/failure, payment result arriving early or late, duplicate delivery, timeout/reconciliation, cancellation before/during/after payment, and publish-then-crash.
- Add metrics for age of pending payment requests, unresolved cancellation requests, inbox duplicate/stale outcomes, and terminal SAGA duration.
- Define explicit remediation for orders already left pending by an early payment result before any event replay or migration.

## Evidence

- Order state transition and confirmation guards: services/order-service/src/main/java/io/shopverse/order/service/OrderServiceImpl.java
- Independent listeners: services/order-service/src/main/java/io/shopverse/order/saga/OrderSagaListener.java and services/payment-service/src/main/java/io/shopverse/payment_service/saga/PaymentSagaListener.java
- Payment initiation and result publication: services/payment-service/src/main/java/io/shopverse/payment_service/saga/PaymentSagaTransactionService.java
- Current multi-item rollout: docs/architecture/adr/005-multi-item-checkout-event-contract.md
- Current static risk inventory: dev-tools/teams/docs/order-service-audit.md
