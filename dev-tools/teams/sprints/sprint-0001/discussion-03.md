# Discussion 03 — Debugging Challenge: Can Payment-Service Survive Multiple Reservation Events Per Order?

**Format:** Product Architect pitch → Senior Developer investigates and
proposes the solution, with justification. (First meeting run in this
format — see `../../README.md` for why.)

**Attendees:** Elena Vasquez (Architect, pitching), Senior Developer
(investigating).

## The pitch (Elena)

Here's where we actually are on BUG-001: Jordan rejected option (b) partly
because it "introduces a new partial-reservation-failure mode without
proper saga-compensation design." I went one step further and found a
*second* risk in that same shape: if order-service emits one
`OrderCreatedEvent` per line item (same `orderNumber`, carrying the
order's full `amount` each time, same as today's single event does), then
a 3-item order that reserves successfully would produce **three separate
`InventoryReservedEvent`s for one order**, not one.

The open question: **does payment-service already protect against that,
or would it process payment multiple times for one order?**

This matters architecturally regardless of which option we end up picking
for BUG-001 — if the answer is "not protected," that's a real production
bug waiting to happen the moment *any* future change causes
`InventoryReserved` to fire more than once per order (not just our
hypothetical multi-item design). If the answer is "already protected,"
that changes how risky option (b)/(c) actually is, and changes what
Jordan should tell Priya.

`services/payment-service/AGENTS.md` states a rule: *"A duplicate `InventoryReserved`
event must not create or complete payment more than once for the same
business operation."* That tells you the *intent*. It doesn't tell you
whether the *mechanism* actually delivers on it for this specific shape
of duplication.

## Your task

Don't take my word for either outcome — trace it yourself and come back
with a finding plus a recommendation, justified with evidence (file and
line citations), the way you'd want a colleague to justify a design
decision to you.

**Where to look:**
- `services/payment-service/src/main/java/io/shopverse/payment_service/saga/PaymentSagaTransactionService.java` — what does `handleInventoryReserved` actually check before creating or completing a payment?
- `PaymentEntity` and its repository — is there a unique constraint or an existence-check keyed on `orderNumber`? On something else? Nothing at all?
- Compare: a guard keyed on **business state** ("is this order already past PAYMENT_PROCESSING?") behaves differently under concurrent/near-simultaneous duplicate events than a guard keyed on **Kafka-level duplicate delivery of the identical event** (offset/dedup at the consumer level). Which one, if either, is actually implemented here?

**Guiding questions, not answers:**
1. If `handleInventoryReserved` were called twice in quick succession for
   the same `orderNumber` — not a Kafka redelivery of the same message,
   but two genuinely distinct events — what actually stops a second
   payment from being created or completed? Walk through the code path.
2. Is there a race window? (E.g., both calls read "no payment exists yet"
   before either one writes.)
3. `PROGRESS.md` already flags "Transactional inbox/event-ID
   deduplication — Planned: current consumers use state checks and
   constraints" as a known gap. Does that claim hold up when you actually
   read this specific consumer, or is it more/less protected than that
   general statement suggests?
4. Your recommendation: is the existing guard sufficient for the
   multi-event design, or does BUG-001's interim fix need to add
   something (e.g., a DB unique constraint on `orderNumber` in the
   payment table, an explicit idempotency check, or something else you'd
   justify)?

Bring back your finding and I'll push back on it the way a real architect
review would — that's the point, not a rubber stamp.

## Outcome

Pending — this is the open item.
