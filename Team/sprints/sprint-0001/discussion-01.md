# Discussion 01 — Kickoff: picking the next ticket

**Attendees:** Priya Raman (Client), Jordan Lee (PO), Sam Okafor (BA),
Maya Chen (Frontend Dev), Elena Vasquez (Architect), Senior Developer.

## Agenda

Pick the next backlog item and get it spec'd and architecturally scoped.

## What happened

1. **Client and PO picked independently, in parallel.** Both landed on
   **BUG-001** ("checkout only orders the first cart item") without
   seeing each other's pick first — a genuine alignment signal, not a
   coordinated answer.
   - Priya's reasoning: multi-item carts silently drop items after the
     first, which is a revenue and trust problem. Requested a hard
     deadline of **November 12**, driven by a bundle-deal marketing
     campaign (buy 3+ items for a discount) launching mid-November.
   - Jordan's reasoning: Must/Critical, core flow broken, unblocks BUG-003
     (missing test coverage) as a side effect. Flagged an open question —
     duplicate-SKU handling in the cart — and estimated **one sprint**,
     conditional: "if the root cause touches order-service persistence
     rather than just the web client, this needs re-sizing."

2. **Elena resolved the duplicate-SKU question immediately**, without
   needing a meeting: `cart.service.ts`'s `add()` already merges a
   repeated `productId` into one line with summed quantity — the cart
   structurally can't contain duplicate lines. Non-issue.

3. **Elena also made an initial scope call: "frontend-only."** Checked
   that `OrdersApiService.checkout()` and the backend endpoint accept a
   full `items[]` array, concluded the bug was just
   `checkout-page.component.ts` truncating to `items()[0]`. (**This later
   turned out to be wrong** — see discussion-02.md. Logged here for the
   record, not erased.)

4. **Sam (BA) wrote the formal spec**, based on Client + PO input and
   Elena's (then-believed) ground truth: 5 functional requirements, 3
   Gherkin acceptance scenarios, explicit exclusion of BUG-002 (hardcoded
   "Pending capture" string), Nov 12 deadline carried forward.

5. **Maya Chen was onboarded** as the frontend developer for this ticket.
   Read `shopverse-web/AGENTS.md`, the current checkout component, and the
   spec. Asked one real clarifying question: **is checkout atomic at the
   API level, or is there a per-item partial-failure signal to design the
   UI around?** She was told to wait for a formal task assignment before
   writing any code.

## Outcome

Maya's question was good enough that it sent Elena back to actually read
the backend contract instead of assuming — which is where discussion-02
picks up.

## Action items going into discussion-02

- Elena: re-verify the backend checkout contract and event chain in
  response to Maya's question.
- Senior Developer: hold off assigning Maya anything until that's done.
