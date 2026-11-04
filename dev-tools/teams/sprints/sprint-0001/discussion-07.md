# Discussion 07 — Finalizing the Order JSON

**Attendees:** Senior Developer (convened), Elena Vasquez (Architect).

**Correction:** this file originally mis-cast the agenda as the BUG-001
scheduling decision. The Senior Developer's actual intended agenda was
finishing the Order JSON decision started in discussion-06 (EOM
finalization). Logged as a correction, not silently rewritten — the
BUG-001 scheduling question is still open and still needs its own
meeting; it hasn't been dropped, just moved out of this one.

## Where the Order JSON design actually stands

From discussion-06, the schema is drafted and reviewed:
[`order.openapi.yaml`](../../tauqeer/task/order-contract-design/order.openapi.yaml)
has the full `Order` resource shape — envelope fields, `OrderLineItem`
with the scoped-down `reservedQuantity`/`fulfillmentType` borrows from
the real EOM, `ShippingAddress`. What we have is the **schema**
(abstract field definitions). What we don't yet have is a **concrete
example instance** — an actual filled-in JSON document showing what a
real order looks like on the wire, which is usually the thing a team
actually signs off on in a design review, not the abstract schema.

## What "deciding order json" likely means concretely

Producing one complete, realistic example `Order` JSON document —
e.g. a 2-item order, partially reserved, home-delivery on one line and
pickup on another (exercising the per-line `fulfillmentType` decision),
with `statusReason` populated — so there's one concrete artifact the
whole team (Jordan, Sam, Maya) can react to instead of reading YAML
schema abstractly.

## Outcome

Pending — confirm this is the right next deliverable before it's
produced, since the last agenda guess was wrong.

## 2026-11-04 — Codex joins as Product Manager

Tauqeer explicitly invited Codex into Discussion 07. The input below is Codex's recommendation, not a decision attributed to the other attendees. Agenda acknowledged: finalize the Order JSON, not BUG-001 scheduling.

I support reviewing a concrete Order JSON example, but propose resolving these semantics before treating that example as approved:

1. **Baseline versus target:** label the example as the proposed target contract. The multi-item, mixed-fulfillment example describes intended capabilities; it is not evidence that today's API implements them. Keep a simpler home-delivery example alongside the mixed example so the immediate deliverable is clear.
2. **Pickup completeness:** OrderLineItem.fulfillmentType permits PICKUP, but the draft has no pickup-location reference. Decide how a pickup line identifies its destination. Also decide whether shippingAddress is omitted for pickup-only orders; it is currently required on every Order. Adding a fulfillment enum alone leaves the customer journey underspecified.
3. **Reservation meaning:** define whether reservedQuantity is the currently held quantity or the historical reservation result. If it is current, it must change when compensation releases stock; propose the invariant 0 <= reservedQuantity <= quantity. Decide what omitted means, rather than having clients assume it means zero. An example with partial reservation must have an order status and reason consistent with the chosen policy.
4. **Safe, usable reasons:** statusReason is described as admin/ops-oriented, but the resource is not separated into customer/admin views. Define customer-safe reason codes and text, and keep internal provider or exception details out of the customer response.
5. **Acceptance evidence:** demonstrate coherent line totals and order total under an explicit pricing rule, required/null behavior, fulfillment destination, reservation semantics and valid lifecycle state. Include one normal example and one failure/compensation example. A single happy-path document is insufficient for sign-off.

Suggested next turn for Tauqeer/Elena: choose the immediate example's supported fulfillment scope and agree the meaning of reservedQuantity. Codex remains in guidance/review mode; no contract implementation or schema edits made in this contribution.

Continuity note: discussion-06 says no Gradle module exists yet. Earlier in this chat Codex created partial, unverified OpenAPI module/controller changes before Tauqeer stopped implementation. Reconcile the working tree before making new implementation assignments; neither record proves completion.
