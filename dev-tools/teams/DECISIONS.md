# Decisions Ledger

**Last updated:** 2026-11-04 (row #13) | **Scope:** project-level, not
sprint-scoped — see `README.md`'s "Standing Rule: One Canonical
Copy Of Each Fact." Future sprints link here; they don't start a new copy.

Flat, scannable record of durable decisions only — not open questions
(see [`OPEN-QUESTIONS.md`](OPEN-QUESTIONS.md)), not narrative. If you
need to know "what have we actually decided," read this table, not
seven discussion files. Each row links to where the full reasoning
lives — **don't duplicate the reasoning here, and don't duplicate this
table's facts elsewhere.** When a discussion or role file needs to cite
a past decision, link to the row here instead of restating it.

Append rows; never delete a superseded decision — mark it superseded in
place (new row + a note on the old one), so the history stays visible.

| # | Decision | Rationale (full detail) |
|---|---|---|
| 1 | BUG-001 is not frontend-only — touches the checkout API contract, the Kafka event chain, and a DB migration | [`product-architect/context.md`](product-architect/context.md) |
| 2 | Go with option (a) (single list-shaped event) over (b)/(c) | [`sprints/sprint-0001/discussion-04.md`](sprints/sprint-0001/discussion-04.md) |
| 3 | FEAT-L (Avro) is not a hard blocker for option (a); do it after, not before | Diego's feasibility read, [`senior-microservices-developer/discussions.md`](senior-microservices-developer/discussions.md) |
| 4 | Contract-module compromise: one `shopverse-contracts`/`shopverse-avro-schemas` module, per-service packages, explicit split-tripwire — not N modules, not one shared DTO module | [`product-architect/context.md`](product-architect/context.md) |
| 5 | Pre-Nov-12 window = foundational engineering (FEAT-E/FEAT-L); client requirements resume after Nov 12 | [`sprints/sprint-0001/discussion-05.md`](sprints/sprint-0001/discussion-05.md) |
| 6 | Priya's Nov 12 campaign: single-item promo only; full multi-item bundle wave after the real fix ships | [`client/discussions.md`](client/discussions.md) |
| 7 | "Bundle deal" = 3+ distinct products, not quantity>1 of one product | [`client/discussions.md`](client/discussions.md) |
| 8 | Money: decimal string (OpenAPI) / Avro `decimal` logical type — never float/double, even though the real reference contracts use `number`/`double` | [`tauqeer/task/order-contract-design/discussions.md`](tauqeer/task/order-contract-design/discussions.md) |
| 9 | Fixed-forward/backorder behavior for partial reservation (not atomic-cancel, not hold-for-decision) | Confirmed against the real fulfillment-service's `InventoryReservation`/`AllocationGroupEntry` schema, [`tauqeer/task/order-contract-design/discussions.md`](tauqeer/task/order-contract-design/discussions.md) |
| 10 | `OrderLineFulfillmentStatus`: `RESERVED`/`BACKORDERED`/`UNAVAILABLE` — ShopVerse's own enum, not the real system's 6-value vendor-specific `AvailabilityDisposition` | [`tauqeer/task/order-contract-design/discussions.md`](tauqeer/task/order-contract-design/discussions.md) |
| 11 | New order-level status needed: `PARTIALLY_RESERVED` (not a reuse of `CONFIRMED` or `PENDING_INVENTORY`) | Diego, [`senior-microservices-developer/discussions.md`](senior-microservices-developer/discussions.md) |
| 12 | Status-rollup logic lives on `OrderEntity` as a derived read, not the saga service | Diego, [`senior-microservices-developer/discussions.md`](senior-microservices-developer/discussions.md) |
| 13 | Partial-fulfillment order status + split payment capture is a **new backlog item**, not BUG-001/EOM scope | Jordan + Diego independently converged, [`product-owner/discussions.md`](product-owner/discussions.md) |
