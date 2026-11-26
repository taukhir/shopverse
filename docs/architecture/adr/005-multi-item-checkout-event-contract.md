# ADR 005: Multi-Item Checkout Event Contract

## Context

Shopverse's checkout API and Order producer remain single-item, but Inventory
has completed the first implementation phase for multi-item reservation:

- `CheckoutRequest.items` is `@NotEmpty @Size(max = 1)` — the backend
  contract itself rejects more than one item, not only the frontend.
- Order Service's `OrderCreatedEvent` still carries scalar
  `productId`/`quantity`, built from `order.getItems().getFirst()`, with
  `amount` set to the order's **full total** rather than a per-item amount.
  Its HTTP contract still rejects more than one line item.
- The Inventory consumer accepts an `items` list and falls back to the legacy
  scalar fields when the list is absent or empty. `InventoryReservedEvent`
  retains the legacy fields and also carries the line-item list for downstream
  compatibility work.
- Inventory reservation uniqueness is now composite
  `(order_number, product_id)`, so an order can have one reservation row per
  product. Inventory reserves all supplied lines in one transaction, releases
  successful earlier reservations if a later line fails, and enqueues one
  consolidated outcome.
- `OrderEntity.addItem()` already accumulates `totalAmount` correctly across
  multiple calls - the order aggregate itself is multi-item-capable. The
  remaining limitation is the Order API/producer, Payment and Order consumer
  compatibility, and frontend rollout, tracked as `BUG-001` in
  [`dev-tools/teams/BACKLOG-BY-AREA.md`](../../../dev-tools/teams/BACKLOG-BY-AREA.md).

This was initially miscategorized as a frontend-only defect
(`checkout-page.component.ts` only submits `items()[0]`). Tracing the
backend contract showed the frontend bug is a symptom of a cross-service
contract limitation, not its cause — which is why this is an ADR (per this
repository's own rule that event-schema changes with unclear scope go
through plan mode before editing) rather than a one-file fix.

## Options Considered

**(a) Redesign `OrderCreatedEvent`/`InventoryReservedEvent` to carry a list
of line items.** A breaking event-schema change requiring a compatibility
review of every producer and consumer (order-service, inventory-service,
payment-service), per this repository's event-copy convention. Inventory's
consumer side is implemented with a legacy scalar fallback; the coordinated
producer and downstream-consumer rollout remains outstanding.

**(b) Keep single-item events; emit one event per line item, same
`orderNumber`.** Avoids the schema break, but still needs the same
`InventoryReservation` uniqueness migration as (a), and introduces a new
partial-reservation-failure mode (some of an order's per-item events
succeed, others don't) that (a) handles as one atomic reservation attempt.

**(c) Phase it: ship a narrow, honestly-scoped interim fix now (for example,
cap and clearly label order size), track the real multi-item redesign as a
separately sized follow-up epic.**

| Option | Events per N-item order | Payment dedup risk | Schema/rollout change |
|---|---|---|---|
| (a) List-shaped event | ~2 (same shape as today) | None — preserves one-event-per-order | Breaking, two-phase rollout |
| (b) One event per line item | ~2N | New — N reservation events per order | No schema break, but new reservation-uniqueness migration |
| (c) Narrow interim fix | Unchanged (single-item) | None | None |

## Scaling And Risk Analysis

The three options were not equivalent in either cost or risk, and the
difference changed the decision:

- **Message volume.** For an N-item order, (a) emits one list-shaped event
  per order — the same traffic shape Shopverse has today. (b) emits one
  event per line item — roughly `2N` Kafka messages per order (order-created
  and inventory-reserved, each N times) versus roughly `2` for (a). At
  Shopverse's current scale this is a cost difference, not a correctness
  one — but it compounds with the next finding.

- **Payment-dedup risk, found while tracing (b)'s consequences forward, not
  assumed up front.** `payment-service`'s own contract states a duplicate
  `InventoryReserved` event must not create or complete payment more than
  once for the same business operation. Under (b), an N-item order that
  fully reserves produces **N separate `InventoryReservedEvent`s for one
  order**, each still carrying the order's full total as `amount` (per-item
  events, order-level amount — the schema wasn't being redesigned to match).
  Whether the existing dedup guard protects against multiple *distinct*
  reservation events for the same order, or only against duplicate
  *delivery* of the *same* event, are different guarantees — and tracing
  `PaymentSagaTransactionService` showed the guard is keyed for the second
  case, not the first. A naive rollout of (b) could trigger duplicate
  payment processing for a real customer order — a production risk, not a
  hypothetical one, and specific to the per-item-event shape.

- **Rollout risk, found by tracing the actual deploy, not just the final
  state.** Any schema change — (a) included — breaks a hard cutover during a
  rolling deploy: an old consumer can't deserialize the new shape and would
  either throw or silently reserve against garbage data. This forces a
  two-phase backward-compatible rollout (emit old and new fields together,
  soak, then drop the old fields) — two deploys, not one, regardless of
  which option is chosen.

Under (a), inventory-service still emits exactly one event per order (just
list-shaped), so `PaymentSagaTransactionService`'s existing one-event-per-order
assumption keeps holding without any change on the payment side — option (a)
specifically removes the dedup risk category rather than trading one risk
for another. Under (b), that risk is real and would need its own dedup
redesign on top of everything else (b) already requires.

## Decision

**Option (a).** Redesign `OrderCreatedEvent`/`InventoryReservedEvent` to
carry a list of line items, rolled out as a two-phase backward-compatible
change (old and new fields emitted together, then the old fields dropped
once all consumers have deployed on the new shape).

(c) was considered and rejected as a standing plan: a narrower interim fix
still has to be retired later, and the team's own stakeholder in this case
(the client) independently chose to narrow the *campaign* instead — shrink a
time-boxed promotion to single-item-only rather than ship a rushed partial
backend fix — which removed the deadline pressure that made (c) attractive
in the first place. (c) remains available for a future deadline that can't
absorb a sprint-sized change, but nothing currently forces it.

Avro event schemas (tracked separately as `FEAT-L`) are **not** a hard
prerequisite for (a). A disciplined two-phase JSON rollout is sufficient on
its own; Avro would make compatibility *enforcement* automatic at
publish/registry time instead of manual, which is a reason to sequence it
*after* this change, not before it.

**Worth modeling now, even in a minimal form:** a comparable real
multi-item checkout system splits "ship together" from "ship separately"
as an explicit per-line concept, because a multi-item order's lines don't
all have to move as one shipment once inventory reservation can
partially succeed. Shopverse doesn't need that system's full strategy-class
machinery — a two-value enum on each line item (`SHIP_TOGETHER` /
`SHIP_SEPARATELY`, defaulting to together) is enough to avoid having to
retrofit the concept later once partial-reservation-failure handling
(now implemented in Inventory's first phase) is exercised by end-to-end
multi-item checkout.

## Consequences

- **order-service:** event shape changes, plus `checkout()` and
  `CheckoutRequest`'s `@Size(max = 1)` constraint both need to change
  together, since the DTO constraint is the first thing that currently
  rejects multi-item requests.
- **inventory-service:** consumer support for list-shaped events, the
  composite `(orderNumber, productId)` reservation key, and compensating
  release on partial reservation failure are implemented in BUG-001 phase 1.
  A remaining operational gap is that the admin lookup by order number returns
  only the first reservation row; BUG-053 tracks exposing all rows.
- **payment-service:** barely changes. It already reads only
  `orderNumber`/`amount` at the order level, never per-item fields, and (a)
  preserves the one-event-per-order shape it already assumes.
- **Rollout is two deploys, not one**, for every service that produces or
  consumes either event, to avoid breaking old consumers during the window
  where old and new instances run side by side.
- **Remaining effort is cross-service rollout and verification**, not the
  Inventory reservation algorithm, which is implemented in phase 1. Order,
  Payment, and frontend contract changes still need coordinated compatibility
  tests and staged deployment.
- Database migration, event-schema change, and checkout authorization/
  validation all move together in one coordinated change, consistent with
  this repository's rule that an event schema change requires a
  compatibility review of every producer and consumer, not a
  service-by-service patch.

**Status:** option (a) is decided. Inventory phase 1 is implemented, including
the list-shaped consumer extension, composite reservation key, and atomic
partial-failure compensation. Order Service still emits the legacy scalar event
and limits checkout to one line; Payment/Order consumer compatibility and the
frontend rollout are not complete. Track the remaining cross-service work as
`BUG-001` in [`dev-tools/teams/BACKLOG-BY-AREA.md`](../../../dev-tools/teams/BACKLOG-BY-AREA.md).

## Official References

- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Apache Avro specification](https://avro.apache.org/docs/current/specification/)

## Related Documentation

- [ADR 002: Kafka Choreography SAGA For Checkout](./002-kafka-choreography-saga.md)
- [API And Event Compatibility](https://taukhir.github.io/shopverse-docs/architecture/API-EVENT-COMPATIBILITY)
- [API/Event Schema Governance Path](https://taukhir.github.io/shopverse-docs/architecture/API-EVENT-SCHEMA-GOVERNANCE-PATH)
