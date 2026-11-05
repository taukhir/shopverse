# Open Questions Ledger

**Last updated:** 2026-11-05 (row #9) | **Scope:** project-level, not
sprint-scoped — see `README.md`'s "Standing Rule: One Canonical
Copy Of Each Fact." Future sprints link here; they don't start a new copy.

Flat, scannable record of every currently-unresolved question, across
all sprints and roles. The point of this file: **a question gets listed
here exactly once.** When a new discussion touches an already-open
question, link to its row here and update the row in place — do not
restate "this has been open for N meetings" in a new file. That phrase
appearing more than once was the original symptom that led to this file.

Mark resolved rows with `~~strikethrough~~` and a one-line resolution +
link, rather than deleting them — a resolved question's history still
has value (e.g. showing how long something stayed open, and why).

| # | Question | Status | Owner | Detail |
|---|---|---|---|---|
| 1 | Is BUG-001's option (a) implementation scheduled inside the pre-Nov-12 window, or after? | **Open — asked in discussions 05, 06, and 07; still unanswered** | Senior Developer | [`sprints/sprint-0001/discussion-05.md`](sprints/sprint-0001/discussion-05.md) |
| 2 | Is discussion-03's payment-dedup investigation confirmed closed? | Open — Diego's reading says likely moot under option (a), not independently confirmed | Senior Developer | [`sprints/sprint-0001/discussion-03.md`](sprints/sprint-0001/discussion-03.md) |
| 3 | How does per-line `fulfillmentStatus` roll up into order-level `status`? | **Resolved (technical shape)** — new `PARTIALLY_RESERVED` status, derived on `OrderEntity`. **Still open:** implementation sequencing (new saga event for BACKORDERED→RESERVED) | Diego / Senior Developer | [`senior-microservices-developer/discussions.md`](senior-microservices-developer/discussions.md) |
| 4 | Should payment capture split across reserved vs. backordered portions of one order? | Open — Jordan's business preference stated (yes, split), but payment-service's model (one payment per order) hasn't been checked against this, and it's explicitly scoped as a **new backlog item**, not current work | Jordan / Senior Developer | [`product-owner/discussions.md`](product-owner/discussions.md) |
| 5 | Pickup-only orders: is `shippingAddress` still required on the Order resource? | Open — raised by Codex, not yet answered | Senior Developer | [`tauqeer/task/order-contract-design/discussions.md`](tauqeer/task/order-contract-design/discussions.md) |
| 6 | Customer-safe vs. admin view split for `statusReason` / per-line `fulfillmentStatus` | Open — raised by Codex and Jordan independently (same underlying concern: don't leak internal detail to customers) | Senior Developer | [`tauqeer/task/order-contract-design/discussions.md`](tauqeer/task/order-contract-design/discussions.md) |
| 7 | Scope divide between Elena (Product Architect) and Codex (Senior Solutions Architect) — deliberate dual-opinion, or needs dividing? | Open — asked once, not yet answered | Senior Developer | this session, not yet filed anywhere else |
| 8 | Next-quarter priority order: Codex proposed BUG-001 → FEAT-J (real payment) → transactional inbox/dedup → ENH-012. **Jordan disagrees**: swap FEAT-J and dedup — silent duplicate payment processing on retried events is a correctness problem happening today; a payment stub is a known, already-flagged trade-off | **Open — genuine disagreement, not yet settled** | Senior Developer | [`product-owner/discussions.md`](product-owner/discussions.md) |
| 9 | "Fixed" claims in `BACKLOG.md`/role files need independent `git log` verification before being trusted for planning — BUG-004/005 recurred silently for a full day under a *different bug ID* after an earlier fix was never actually committed. Diego also flagged his own prior feasibility conclusions need re-walking against current `HEAD` before anyone builds on them | Open | Diego / Senior Developer | [`senior-microservices-developer/discussions.md`](senior-microservices-developer/discussions.md) |

## Resolved

- ~~Who does Codex's "inventory current behavior" first deliverable~~ — done jointly with the user this session: [`tauqeer/task/order-contract-design/contract-inventory.md`](tauqeer/task/order-contract-design/contract-inventory.md).

- ~~Partial, unverified `shopverse-contracts` code sitting uncommitted~~ — reviewed, built, and committed: [`c2ccb622`](https://github.com/taukhir/shopverse/commit/c2ccb622).

- ~~Priya's SKU-meaning question~~ — answered: 3+ distinct products. See [`DECISIONS.md`](DECISIONS.md) #7.
- ~~Option (a) vs (b) vs (c)~~ — decided: option (a). See [`DECISIONS.md`](DECISIONS.md) #2.
- ~~Jordan's proposed BUG-001a necessity~~ — resolved: not needed, see [`DECISIONS.md`](DECISIONS.md) #5–6.
- ~~FEAT-L sequencing disagreement~~ — resolved pragmatically: doing both now regardless. See [`DECISIONS.md`](DECISIONS.md) #3.
