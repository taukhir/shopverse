# Discussion 05 — MVP Verdict, Contract-Module Compromise, and the Nov 12 Working Plan

**Attendees:** Senior Developer, Elena Vasquez (Architect, pitching on request).

**Format note:** the Senior Developer made explicit a standing rule going
forward — every role reasons independently and justifies its own
position, disagreement included. See `../../README.md`'s new "Standing
Rule: Independent Reasoning" section.

## What happened

1. **Senior Developer's own tracking folder brought up to current
   standard** — `teams/senior-developer/` had gone stale since discussion-01
   while every other role kept moving. Backfilled through discussion-04.

2. **Decision: implement Avro (FEAT-L) and OpenAPI contracts (FEAT-E) now**,
   using the pre-Nov-12 window. Pushed back on Elena's earlier "one `-api`
   module per service" recommendation as too much ceremony at ShopVerse's
   current scale, and asked for a middle ground.

3. **Decision: the team works on foundational engineering between now
   and Nov 12, and does not take new client requirements in that
   window** — client requirements resume after Nov 12. This resolves
   discussion-04's open question about Jordan's proposed BUG-001a: it's
   not needed, since there's no Nov 12 engineering deliverable in this
   plan at all (Priya already moved that pressure to marketing).

4. **Elena's MVP verdict, given directly, not softened:** the product is
   not MVP-complete. BUG-001 (multi-item checkout) is the one
   disqualifying gap — not a nice-to-have alongside others. Payment
   being a stub is fine *only as a conscious decision*. Guest checkout
   and order-confirmation email are real but non-blocking gaps.
   Reviews/wishlist/coupons/multi-tenancy correctly out of scope.

5. **Elena pushed back on the plan itself**, not just complied with the
   request: Avro/OpenAPI make option (a) safer to execute, they don't
   implement it. If BUG-001's actual fix isn't separately scheduled, the
   pre-Nov-12 window could be spent entirely on enablers without fixing
   the one disqualifying MVP gap — flagged as a decision to make on
   purpose.

6. **Compromise reached on the contract-module question:** one
   `shopverse-contracts` module (and matching `shopverse-avro-schemas`)
   with per-service packages, each owned by its corresponding service,
   with an explicit tripwire for splitting into separate modules later
   (the day a package change forces an unrelated service's
   rebuild/redeploy). Logged on `BACKLOG.md` FEAT-E/FEAT-L, both moved
   to "Next up — active pre-Nov-12 work."

## Open items carried forward

1. Is BUG-001's actual option (a) implementation going to be scheduled
   within the pre-Nov-12 window, or does it wait until after — Elena's
   pushback was raised but not yet explicitly answered.
2. Discussion-03 (payment-dedup) still not independently confirmed by
   the Senior Developer, though less urgent now.
