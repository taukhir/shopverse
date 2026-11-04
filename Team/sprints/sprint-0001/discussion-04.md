# Discussion 04 — Committing to Option (a): Team Reactions

**Attendees:** Senior Developer (decided), Jordan Lee (PO), Priya Raman
(Client), Diego Alvarez (Senior Microservices Developer, first
contribution), Elena Vasquez (Architect, prior turn).

## Agenda

The Senior Developer decided to go with **option (a)** — redesign
`OrderCreatedEvent`/`InventoryReservedEvent` to carry a list of line
items — after Elena's scaling analysis (option (b) would be ~2N Kafka
messages per order vs. ~2 for option (a), and (b) is the actual source of
the payment-dedup risk under investigation). This meeting gathered
independent reactions from PO, Client, and a new technical voice.

## What happened

**Jordan (PO):** convinced by the dedup-risk evidence — "(b) was the
actual source of the risk I feared, (a) removes a risk category rather
than trading one for another." Proposed: pull FEAT-L (Avro) forward as a
hard dependency, then option (a) on top. Explicit call that full BUG-001
likely slips past Nov 12. Proposed splitting into **BUG-001a** (capped
interim, Nov 12 target) and **BUG-001b** (full redesign, blocked on
FEAT-L, no committed date).

**Priya (Client), independently and in parallel:** chose a different
path entirely — shrink the Nov 12 campaign to a **single-item promo
only** (no multi-item/bundle claims anywhere), keep the Nov 8 media-buy
slot, run a second wave with full multi-item bundles once the real fix
ships. Explicitly weighed double-charge risk and permanent scaling cost
against the date, and chose correctness. Also finally answered the
two-meeting-old SKU question: "bundle deal" = 3+ distinct products (with
openness to reconsider if same-SKU quantity is meaningfully easier/safer
as a fallback).

**Diego (Senior Microservices Developer), first contribution — traced
the real code:**
1. Confirmed concretely what changes in each service (order-service:
   event + checkout() + DTO constraint; inventory-service: event +
   saga handler + new partial-reservation-failure logic + DB migration;
   payment-service: barely changes, already order-level).
2. **New risk, not previously surfaced:** a hard cutover during rolling
   deploy breaks old consumers (NPE or garbage reservation). Needs a
   two-phase backward-compatible rollout — two deploys, not one.
3. **Disagreed with Jordan:** FEAT-L/Avro is *not* a hard blocker for
   option (a) — a disciplined two-phase JSON rollout works; Avro would
   make compatibility enforcement automatic, which is a reason to do it
   *after*, not before.
4. Effort: a sprint, not days — the hard parts are inventory's new
   business logic and the doubled deploy/test surface, not the type
   changes.
5. **Likely resolves discussion-03 (payment-dedup) as moot under option
   (a) specifically** — payment-service already assumes one event per
   order; option (a) preserves that (one list-shaped event, not N).
   Explicitly left this for the Senior Developer to confirm, not
   claimed as final.

## Real disagreements surfaced, not smoothed over

1. **Jordan's BUG-001a may be unnecessary.** It was proposed before
   seeing Priya's decision. If she's shrinking the campaign instead of
   requesting a rushed interim, there's no Nov 12 pressure for any
   interim multi-item capability to exist.
2. **FEAT-L sequencing: Jordan (hard prerequisite) vs. Diego (not
   required, do it after).** Process-risk view vs. technical-feasibility
   view, genuinely in tension.
3. **The original debugging challenge (discussion-03) may already be
   answered** by Diego's reading, but hasn't been independently
   confirmed by the person it was assigned to.

## Outcome

Pending — three items need the Senior Developer's decision before
`BACKLOG.md`/`TEAM.md` are updated to reflect a final plan.
