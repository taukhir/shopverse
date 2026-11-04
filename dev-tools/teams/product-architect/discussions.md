# Elena Vasquez — Discussion Log

Append-only. Newest entries at the bottom. Don't rewrite past entries.

### 2026 — BUG-001 scope correction announced
Initial read ("frontend-only") was wrong. Corrected the record with the
team, citing the four facts now in `context.md`. Concluded this matches
the root `AGENTS.md` trigger for plan mode ("event schemas... or changes
with unclear scope before editing"). Recommended not assigning Maya Chen
anything yet.

### 2026 — proposed three options to resize against
(a) redesign `OrderCreatedEvent`/`InventoryReservedEvent` to carry a list
of line items — breaking event-schema change, needs a compatibility
review of every producer/consumer.
(b) keep single-item events, emit one event per line item (same
`orderNumber`) — avoids the schema break, still needs the DB migration,
introduces a partial-reservation-failure mode.
(c) phase it: ship a narrow, honestly-scoped fix now, track the real fix
as a properly-sized follow-up epic.

### 2026 — meeting round 1: Jordan and Priya respond
Jordan Lee (PO) pulled the sprint estimate, picked option (c), rejected
(a) as multi-sprint coordination risk and (b) as a false shortcut (still
needs the migration, plus a new failure mode without proper compensation
design). Asked Priya two questions: is Nov 12 hard, and does "bundle deal"
mean distinct SKUs or qty>1 of one SKU.

Priya Raman (Client) responded in parallel (before seeing Jordan's
question) — confirmed Nov 12 has limited flexibility (ad buy locks Nov 8,
landing page/email blast fixed regardless) and set her bottom line: every
item in a 3+ item order must actually ship and appear correctly on the
receipt by Nov 12, interim fix acceptable, full fix can land later. **Did
not answer the SKU-meaning question** — gap, not yet resolved.

### 2026 — meeting round 2: Elena traces the "ship correctly" requirement further
Priya's bar ("every item must actually ship") is stronger than a
receipt-display fix — it requires real inventory reservation per item, not
an honest-looking receipt over an incomplete reservation. Traced option
(b)/(c)'s interim-fix shape forward and found the payment-dedup risk now
logged in `context.md`. This needs verification before Jordan's preferred
option (c) can be safely scoped as "narrow."

Open items for next round: (1) Priya still owes the SKU-meaning answer;
(2) someone needs to read `PaymentSagaTransactionService` and its
persistence layer to resolve the dedup-guard question before committing to
an interim-fix design.

### 2026 — MVP verdict and shared-contract-module compromise
Gave an explicit MVP verdict when asked: the product is close but **not**
MVP-complete — BUG-001 (multi-item checkout) is the one disqualifying
gap, not a nice-to-have. Payment being a stub is an acceptable MVP
trade-off *only if consciously decided as such*, not a default. Guest
checkout and order-confirmation email are real "should fix soon" items
but don't block MVP status; reviews/wishlist/coupons/multi-tenancy are
correctly out of scope for now.

**Pushed back on the Senior Developer's own plan, not just complied:**
spending the pre-Nov-12 window on Avro/OpenAPI (FEAT-L/FEAT-E) makes
executing option (a) *safer*, but doesn't implement it. If BUG-001's
actual fix isn't separately scheduled, the team could spend the whole
pre-deadline window on enablers without fixing the one disqualifying MVP
gap. Flagged this as a decision to make on purpose, not a side effect.

Accepted the scale-based pushback on "`-api` module per service" being
too much ceremony right now. Proposed middle ground: one
`shopverse-contracts` module (and a matching `shopverse-avro-schemas`
module) with per-service packages, each package owned by its
corresponding service, with an explicit tripwire for when to split into
separate modules (the day a package's change forces an unrelated
service's rebuild/redeploy). Logged as the agreed approach on
`BACKLOG.md` FEAT-E/FEAT-L.

### 2026 — full platform briefing received
Senior Developer requested Elena, Jordan, and Priya all have complete
ShopVerse knowledge, not just BUG-001 thread knowledge, and be pointed at
`documentation/`. Received and logged the full capability/gap list — see
"Full platform knowledge briefing" in `context.md`.
