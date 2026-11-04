# Discussion 02 — The scope correction and resizing

**Attendees:** Elena Vasquez (Architect), Jordan Lee (PO), Priya Raman
(Client), Senior Developer.

## Agenda

React to Elena's corrected scope finding for BUG-001 and decide how to
proceed against the Nov 12 deadline.

## What happened

1. **Elena corrected the record.** Tracing Maya's question led to
   verifying the actual backend contract, and the "frontend-only" call
   from discussion-01 was wrong. Three concrete findings, each cited to
   source (full detail in `../../product-architect/context.md`):
   - `CheckoutRequest.items` has `@Size(max = 1)` — the API itself
     rejects more than one item.
   - `OrderCreatedEvent` and `InventoryReservedEvent` carry a single
     `productId`/`quantity` end-to-end through the Kafka choreography.
   - `InventoryReservation.orderNumber` has a database-level `unique =
     true` constraint — only one reservation per order is possible today,
     which needs a Liquibase migration to change.
   - What's *not* broken: `OrderEntity.addItem()` already accumulates
     `totalAmount` correctly across multiple items — the order aggregate
     itself is fine.

2. **Elena proposed three options:**
   - (a) redesign the event schema to carry a list of line items —
     breaking change, needs a compatibility review of every producer/
     consumer.
   - (b) keep single-item events, emit one per line item sharing the same
     `orderNumber` — avoids the schema break, still needs the DB
     migration, introduces a new partial-reservation-failure mode.
   - (c) phase it: ship a narrow, honestly-scoped interim fix, track the
     real fix as a properly-sized follow-up epic.

3. **Jordan (PO) reacted.** Pulled the one-sprint estimate explicitly,
   framed it as a scope correction rather than scope creep against Elena
   ("she caught it before we built the wrong thing"). Picked **option
   (c)**. Rejected (a) as multi-sprint coordination risk against a
   marketing date. Rejected (b) as a false shortcut — still needs the
   migration, plus a new failure mode without proper compensation design,
   which is new production risk under deadline pressure. Asked Priya two
   questions: is Nov 12 truly fixed, and does "bundle deal" mean distinct
   SKUs or quantity>1 of one SKU. Requested `BACKLOG.md`'s BUG-001 row be
   re-annotated regardless of her answer — done.

4. **Priya (Client) reacted, in parallel with Jordan's turn** (so she
   hadn't seen his specific SKU question yet). Confirmed Nov 12 has
   limited flexibility: ad media buy locks Nov 8, the landing page/email
   blast is fixed for Nov 12 regardless. Set her bottom line: every item
   in a 3+ item order must actually ship and appear correctly on the
   receipt by Nov 12 — an interim/patched fix is fine, the full clean fix
   can land later. Asked engineering to confirm feasibility today, or
   she'll shrink the campaign to a single-item promo instead.

5. **Elena traced Priya's bar further and found a new risk.** "Every item
   must actually ship" is stronger than a receipt-display fix — it needs
   real inventory reservation per item. If order-service emits one event
   per line item (option b/c's likely shape) and each carries the order's
   full total (as today's single event does), N successful reservations
   would produce **N separate `InventoryReservedEvent`s for one order**,
   each with the full total, reaching payment-service. Whether
   payment-service's existing dedup guard protects against *multiple
   distinct* reservation events for one order, versus only *duplicate
   delivery of the same* event, hasn't been verified — and those are
   different guarantees. Logged as a blocking open item, not assumed safe.

6. **Full platform briefing given to Elena, Jordan, and Priya** at the
   Senior Developer's request, so their knowledge isn't limited to the
   BUG-001 thread. Each now holds a tailored (technical / feature /
   business-language) summary of what ShopVerse does and doesn't do
   today, plus a pointer to which parts of `documentation/` are actually
   ShopVerse-specific versus generic learning content. Detail in each
   role's own `context.md`.

## Outcome

No decision made yet on how to proceed — two real blockers remain open.

## Open items carried forward

1. Priya still owes Jordan's SKU-meaning question (now that she's also
   been briefed on the actual product, she's in a better position to
   answer it with the real storefront in mind).
2. Elena needs to read `PaymentSagaTransactionService` and its
   persistence layer to resolve the dedup-guard question.
3. Senior Developer: decide whether to enter plan mode now for the phased
   design, or resolve 1 and 2 first.
