---
title: "ADR 002: Kafka Choreography SAGA For Checkout"
status: maintained
last_reviewed: "2026-11-17"
page_type: Guide
difficulty: Advanced
scope: shopverse
owner: docs-architecture
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# ADR 002: Kafka Choreography SAGA For Checkout

## Context

Checkout spans three services that each own their own database
(order-service, inventory-service, payment-service) — this repository's
"each service owns its data" invariant rules out one distributed
transaction across all three. A customer's checkout still has to end up in
one of a small set of valid, auditable outcomes: fully confirmed, rejected
for insufficient stock, or failed at payment with inventory released back.

## Decision

**Choreography, not orchestration.** No central saga coordinator calls
order → inventory → payment in sequence. Each service publishes a domain
event on its own state change and reacts to the events it cares about;
the saga's shape emerges from those independent listeners, not from one
service's control flow.

`order-service`'s `checkout()` commits the order and an outbox row in one
local transaction (see [Outbox Pattern](../../reliability/OUTBOX-PATTERN.md)
for why the local commit and the Kafka publish must not share a
transaction). `inventory-service` listens for `OrderCreatedEvent`, attempts
the reservation, and publishes `InventoryReservedEvent` or
`InventoryFailedEvent`. `order-service`'s own `OrderSagaListener` reacts to
those:

```java
@RetryableTopic(attempts = "3")
@KafkaListener(
        topics = "${shopverse.kafka.topics.inventory-reserved}",
        groupId = "${spring.application.name}"
)
public void onInventoryReserved(String payload) {
    InventoryReservedEvent event = eventParser.parse(payload, InventoryReservedEvent.class);
    CorrelationContext.run(
            event.correlationId(),
            () -> orderService.markInventoryReservedAndPaymentProcessing(event.orderNumber())
    );
}
```

`groupId: ${spring.application.name}` means each service's own listeners
share one consumer group — scaling order-service horizontally scales this
listener's throughput without needing a separate group per handler.
`@RetryableTopic(attempts = "3")` plus a `@DltHandler` gives each listener
bounded retry and a dead-letter path instead of an unbounded retry loop or
a silently dropped event; `FailedKafkaEventService` persists DLT arrivals
for operator review and replay, not just a log line.

Compensation is a forward business transition, not a database rollback:
a payment decline doesn't undo the reservation transactionally, it emits
`PaymentFailedEvent`, which inventory-service consumes to explicitly
release the stock it had reserved — an auditable state change with its own
timeline entry, matching this repository's compensation invariant.

## Options Considered

**Synchronous orchestration (Order calls Inventory calls Payment over
HTTP).** Rejected per this repository's own architecture invariant — it
would couple the three services' availability together (inventory being
slow makes checkout slow) and make the already-owned local transactions
leak across service boundaries. Changing to this model requires an
approved ADR superseding this one, which this document is not.

**A central saga-orchestrator service.** Would give one place to read the
whole checkout flow, at the cost of a new single point of coordination
that every step depends on, and a new service to keep available. Rejected
for this repository's current scale — choreography keeps each service's
saga logic colocated with the state it owns (`OrderSagaListener` lives in
order-service, not in a shared orchestrator), matching the "each service
owns its data" invariant more directly.

**At-least-once with no idempotency handling.** Kafka's delivery guarantee
here is at-least-once, not exactly-once — the design choice was never
"assume single delivery," it was "make every consumer tolerate duplicates."
Current consumers use state-check idempotency (a handler is a no-op unless
the order is in the specific state the event expects); a formal
transactional consumer inbox (event-ID-keyed deduplication) is tracked
separately as a planned follow-up (`FEAT-L`/inbox tracked in
`dev-tools/teams/BACKLOG.md`), not yet built.

## Consequences

- Each service keeps its own transaction boundary; checkout's overall
  consistency is eventual, not immediate — a client reading the Order
  resource immediately after checkout sees an in-progress state, not a
  guaranteed final one, by design.
- Failure states are visible through the queryable order timeline and DLT
  audit records, not only through logs — this is what makes an eventually-
  consistent flow debuggable rather than opaque.
- Choreography has no single file that shows the whole saga: understanding
  "what happens after inventory reserves stock" means reading
  `OrderSagaListener` in order-service, not a central coordinator. This is
  a real operational cost, traded for not having a new service in the
  critical path.
- **The design is only as good as its state-machine wiring, and this
  repository has hit that failure mode for real.** A guarded transition
  whose precondition is never assigned anywhere makes 9 of `OrderStatus`'s
  14 values unreachable, so a real checkout never reaches `CONFIRMED` —
  the choreography pattern itself isn't at fault, but it is exactly the
  kind of defect choreography makes easy to miss, since no single
  orchestrator exists to assert the full sequence actually runs end to
  end. See
  [Order Status Dead-Transition Problem](../../reliability/problems/ORDER-STATUS-DEAD-TRANSITION-PROBLEM.md)
  for the full root cause and fix (`BUG-013`,
  `dev-tools/teams/BACKLOG.md`) — fix designed, not yet implemented as of
  this writing.
- Observability and replay tooling (correlation ID propagation, DLT
  persistence, timeline queries) are required parts of this architecture,
  not optional extras, precisely because choreography trades a readable
  control flow for operational visibility instead.

## Official References

- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Saga pattern — microservices.io](https://microservices.io/patterns/data/saga.html)

## Related Documentation

- [Outbox Pattern](../../reliability/OUTBOX-PATTERN.md)
- [Order Status Dead-Transition Problem](../../reliability/problems/ORDER-STATUS-DEAD-TRANSITION-PROBLEM.md)
- [Shopverse Saga Code Flow](../../reliability/SHOPVERSE-SAGA-CODE-FLOW.md)
- [Saga Consistency And Compensation](../../reliability/SAGA-CONSISTENCY-COMPENSATION.md)
- [ADR 005: Multi-Item Checkout Event Contract](005-multi-item-checkout-event-contract.md)
