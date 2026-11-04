# Order Contract Design — Discussion Log

Append-only. Newest entries at the bottom. Facts that belong in
[`../../DECISIONS.md`](../../DECISIONS.md) are linked, not repeated here
— this file is for the narrative of *how* each round went, not a second
copy of *what* was decided.

### EOM finalization meeting (discussion-06)

Reviewed against the real Amway `commerce-checkout-api`
`checkout-eom-rest/v1/openapi-rest.yml` and against Codex's independent
rollout-plan. Outcome: `DECISIONS.md` #8 (money), the `statusReason` and
original `reservedQuantity`/`fulfillmentType` additions (later refined,
see below), and the `eventId`-is-not-dedup correction Codex's review
caught. Explicitly rejected borrowing the real EOM's PV/BV/ABO/
commission/subscription fields — pure Amway MLM business model, zero
relevance here.

### Resolved against the real fulfillment-api and tax-api contracts

Checked `commerce-fulfillment-api` and `commerce-tax-api` (siblings of
`commerce-checkout-api`). This resolved two real open questions by
finding the actual answer rather than guessing — see `DECISIONS.md` #9
(fixed-forward/backorder) and the vendor `AvailabilityDisposition` enum
that exposed the `PENDING_INVENTORY` misuse (superseded below).

One real-world counterpoint worth keeping visible: both real contracts
represent money as `number`/`double` at the REST boundary. ShopVerse
deliberately did not copy that — the double-precision bug already found
in the comparable taxation *service's* own Java code is a direct
consequence of that exact choice, and "the real system does it this
way" isn't a reason to repeat a known mistake.

### Correction: don't inherit vendor terminology, design our own

Tauqeer's explicit call: the real contracts were reference material for
understanding the *problem*, not a design to copy. Reverted the borrowed
`AvailabilityDisposition` (`SHP`/`TNA`/`NLA`/`NYA`/`NAW`/`BO`) in favor
of ShopVerse's own `OrderLineFulfillmentStatus`
(`RESERVED`/`BACKORDERED`/`UNAVAILABLE`) — see `DECISIONS.md` #10,
styled to match the existing `ReservationStatus` convention already in
the codebase. The underlying `requestedQuantity`/`reservedQuantity`
split and the backorder *behavior* were kept — those aren't vendor
terminology, they're a generically sound pattern independent of where
they were first noticed.

### Role routing update

Codex moved from Product Manager to Senior Solutions Architect; current
memory under `teams/senior-solutions-architect/` (not `product-manager/`,
which now holds only historical records). Cybersecurity Engineer
onboarded separately, running `SEC-REVIEW-001`. No change to this task's
ownership — Tauqeer drives implementation, assistants guide and review.

### Status rollup discussion

Diego and Jordan gave independent technical and business opinions —
see `DECISIONS.md` #11–13 for the resulting decisions (new
`PARTIALLY_RESERVED` status, rollup logic on `OrderEntity`, and the
scope call that split-payment-capture is a new backlog item, not part
of this task).

### Team-efficiency review (this entry)

`task.md` had grown into a single file mixing stable design notes with
a chronological log — inconsistent with every other role folder's
`index`/`context`/`discussions`/`tasks` split. Split into that same
structure. Also created `../../DECISIONS.md` and
`../../OPEN-QUESTIONS.md` as cross-cutting ledgers, specifically because
`sprints/sprint-0001/index.md`'s own "current open items" section had
already drifted stale — direct evidence that restating facts/questions
in multiple places doesn't survive more than a few review rounds.
