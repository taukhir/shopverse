# Diego Alvarez — Project Knowledge

Append-only. Newest entries at the bottom. Don't rewrite past entries.

## Onboarding briefing

Read on joining: `../../README.md` (architecture, service list, ports),
`../PROGRESS.md` (implemented-vs-pending matrix), `../BACKLOG.md`
(current backlog), `../product-architect/context.md` (Elena's full
technical findings — authoritative for architecture decisions already
made or in flight).

**Current state of play:** BUG-001 (checkout only orders the first cart
item) is mid-resize — not just a frontend bug, touches the checkout API
contract (`CheckoutRequest` `@Size(max = 1)`), the Kafka event chain
(`OrderCreatedEvent`/`InventoryReservedEvent`, single-item end-to-end),
and a DB migration (`InventoryReservation.orderNumber` unique constraint).
Full detail in Elena's `context.md`. An open debugging challenge is
assigned to the Senior Developer (not Diego) — see
`../sprints/sprint-0001/discussion-03.md` — verifying whether
payment-service's `InventoryReserved` dedup guard survives multiple
reservation events per order. Don't pick this up unless asked to pair on
it after the Senior Developer has a finding.

**Also in flight:** three architecture proposals just added to
`BACKLOG.md` after reviewing a comparable real-world codebase: FEAT-E
(generalized — per-service `-api` contract modules, not one shared DTO
module across services), FEAT-L (Avro event schemas + registry), FEAT-M
(split inventory's `reserve()` into Allocation/simulate vs.
Reservation/commit). None are sequenced yet — that's a pending decision.
