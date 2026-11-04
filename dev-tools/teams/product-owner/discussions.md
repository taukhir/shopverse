# Jordan Lee — Discussion Log

Append-only. Newest entries at the bottom. Don't rewrite past entries.

### 2026 — picked BUG-001 as top priority
Independently (before seeing the Client's pick) selected BUG-001: Must/
Critical, core purchase flow dropping line items is lost revenue and a
trust-breaking receipt mismatch, happening in code already shaped like it
should work — unlike FEAT-A/B/C which are net-new capability work with open
design questions. Also unblocks BUG-003. Client independently picked the
same item — no prioritization conflict.

Flagged duplicate-SKU handling as an open question (later resolved as moot
by the Architect — cart already merges duplicates client-side).

Estimated one sprint, conditional: "if the root cause touches the
order-service line-item persistence layer rather than just the web client,
this needs re-sizing once a developer traces it."

### 2026 — resizing triggered, picked option (c)
The condition above was triggered, worse than anticipated (see Elena
Vasquez's `context.md` for the full technical finding). Pulled the sprint
estimate explicitly, framed it as a scope correction not a failure: "I'd
rather eat the correction now than let a mis-sized commitment surface
mid-sprint... this goes in the log as a scope-correction, not a scope-creep
complaint against Elena — she caught it before we built the wrong thing."

Picked option (c), phase it. Rejected (a) — multi-sprint, coordination
risk, not promisable against a marketing date. Rejected (b) — "looks like
a shortcut but it isn't": still needs the DB migration, plus introduces a
new partial-reservation-failure mode without proper saga-compensation
design, which is new production risk under deadline pressure.

Asked Priya two things before committing to anything: (1) is Nov 12 a
hard externally-fixed date or a movable self-imposed target; (2) does
"bundle deal" mean multiple distinct SKUs in one order, or quantity>1 of a
single SKU — because that changes how narrow an honest interim fix could
be.

Requested `BACKLOG.md`'s BUG-001 row be re-annotated regardless of
Priya's answer — done, see `../BACKLOG.md`.

### 2026 — full platform briefing received
Received the full implemented-vs-missing capability list and a pointer to
`documentation/`'s ShopVerse-specific sections (vs. its mostly-generic
learning-portal content) — see "Full platform knowledge briefing" in
`context.md`.

### 2026 — reacted to the Senior Developer's decision to go with option (a)
The scaling/dedup-risk evidence changed the calculus: option (b) — which
Jordan rejected partly on "new production risk" grounds — turned out to
be the actual *source* of the dedup risk. Option (a) removes that risk
category entirely rather than trading one risk for another, which is a
stronger argument than the original "it's just the properly correct
fix" framing.

Proposed sequencing: **FEAT-L (Avro/schema registry) pulled forward as a
hard dependency ahead of other backlog work**, then option (a)'s redesign
on top of it. Explicit answer on timeline: full BUG-001 likely slips past
Nov 12 under this plan. Proposed splitting the ticket: **BUG-001a**
(capped/interim multi-item fix, Nov 12 target) and **BUG-001b** (full
redesign, blocked on FEAT-L, multi-sprint, no committed date).

**Note for next round — this was proposed before seeing Priya's
decision, and the two may not fit together.** Priya independently chose
to shrink the Nov 12 campaign to a single-item promo rather than ask
engineering for a rushed interim fix (see `../client/discussions.md`). If
that holds, BUG-001a may not be needed at all — there'd be no Nov 12
business pressure for *any* multi-item capability to exist by that date.
This needs reconciling before `BACKLOG.md` is split the way Jordan
proposed.

### 2026-11-04 — mixed fulfillmentStatus rollup: opinion given
Asked for a business opinion on how per-line `RESERVED`/`BACKORDERED`/
`UNAVAILABLE` rolls up to order-level status. Real preferences, not
hedged: (1) customer-facing status must say "partially available"
explicitly, not paper over a mixed state — direct extension of the
BUG-001 trust concern (a customer surprised later is a customer misled
now); (2) split payment capture — charge only the reserved portion now,
bill the backordered portion later, even though that's more engineering
work, because the alternative generates chargebacks and trust erosion;
(3) **this is a new backlog item, not part of current BUG-001/EOM
scope** — a genuine business-design decision deserves its own sizing,
not a ride-along inside an already-resizing ticket.
