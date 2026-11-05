# Diego Alvarez — Discussion Log

Append-only. Newest entries at the bottom. Don't rewrite past entries.

### 2026 — onboarded
Joined the team. Completed onboarding reading per `context.md`. Has not
yet participated in a discussion.

### 2026-11-04 — status rollup: technical opinion given
Traced `OrderStatus.java`, `OrderServiceImpl.markInventoryReserved`/
`markInventoryRejected`/`markInventoryReservedAndPaymentProcessing`
(lines 256-298), and `InventorySagaTransactionService.handleOrderCreated`
(lines 18-44, confirmed: today emits exactly one event, no partial-
success branch exists). Opinions, not hedged:
1. Rollup logic belongs on `OrderEntity` as a derived read
   (`deriveStatus()`), not in the saga service — matches the existing
   pattern of state transitions encapsulated in the entity.
2. **New enum value needed: `PARTIALLY_RESERVED`.** Don't reuse
   `CONFIRMED` (means paid) or `PENDING_INVENTORY` (already identified as
   misused for this). Sits between `PENDING_INVENTORY` and
   `INVENTORY_RESERVED`/`PAYMENT_PROCESSING`.
3. **The BACKORDERED→RESERVED transition needs a new saga event**
   (e.g. `BackorderFulfilledEvent`) — the current saga model is strictly
   one-shot, no re-entry point exists for "stock arrived later." This is
   new saga surface, not a contract tweak — flagged for explicit
   sequencing in Codex's contract-rollout-plan, not something
   `order.openapi.yaml` alone settles.

### 2026-11-05 — reacted to the BUG-004/005 recurrence and Codex's fixes
Verified BUG-004 through BUG-012 directly against `BACKLOG.md` (commit
hashes, root-cause notes) rather than taking a summary on faith. Three
real conclusions:
1. **Trust calculus shifted.** BUG-004/005 is the exact failure mode
   flagged weeks ago — a fix never actually committed, recurring
   silently under a *different bug ID* for a full day. Going forward:
   treat any "Fixed" claim as "fixed in someone's working tree at some
   point" until personally verified in `git log`. Flagged own prior
   option (a) feasibility conclusions need re-walking against current
   `HEAD` before anyone builds on them — not assumed still accurate.
2. **Low weight on "compile-verified, Docker unavailable" fixes.**
   BUG-006/007 specifically — compiling proves a Liquibase changelog
   parses, not that changeset ordering is correct, which is the actual
   bug class. Held at "plausible, unverified," not a release-gate basis.
3. **Extended Codex's maintenance-burden concern with a concrete
   proposal:** a third category beyond decisions/open-questions needs
   canonicalizing — investigation/verification narrative (root-cause
   timelines) currently duplicates between `BACKLOG.md` rows and
   people's own `discussions.md`/`context.md`. Cited own
   option-(a)-feasibility entry as an example of the duplication.
   Adopted — see `../README.md`'s extended standing rule.

### 2026 — first real contribution: feasibility read on option (a)
Traced the actual code across order-service, inventory-service, and
payment-service (file citations in `context.md`) to assess building
option (a) — the single list-shaped event redesign.

**Key findings:**
1. Payment-service barely changes — it already only reads `orderNumber`/
   `amount` (order-level), never per-item fields.
2. **Real rollout risk identified, not previously surfaced:** a hard
   cutover during a rolling deploy would break — old consumers can't
   deserialize the new shape and would NPE or reserve garbage. Needs a
   two-phase backward-compatible rollout (emit old+new fields together,
   soak, then drop old fields) — two deploys, not one.
3. **Disagreed with Jordan's proposed sequencing:** FEAT-L (Avro) is
   *not* a hard blocker for option (a). Plain JSON with a disciplined
   two-phase rollout works. Avro would make compatibility
   *enforcement* automatic rather than manual — valuable, but not a
   prerequisite. Recommends FEAT-L *after* this ticket, not before.
4. Effort: a sprint, not days — the hard parts are inventory's new
   partial-reservation-failure business logic plus the DB migration,
   and the doubled deploy/test surface from the two-phase rollout, not
   the type changes themselves.
5. **Likely resolves the open payment-dedup investigation (discussion-03)
   as moot under option (a) specifically:** `PaymentSagaTransactionService`
   expects exactly one `InventoryReservedEvent` per order; under option
   (a), inventory-service still emits exactly one event per order (just
   list-shaped), so that assumption keeps holding. Explicitly flagged
   this as his reading, not a final answer — left it to the Senior
   Developer to confirm.
