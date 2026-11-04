# Priya Raman — Discussion Log

Append-only. Newest entries at the bottom. Don't rewrite past entries.

### 2026 — asked for BUG-001
Picked BUG-001 ("checkout only orders the first cart item") from
`../BACKLOG.md`. Business reason: multi-item carts silently drop every
item after the first — under-billing/under-fulfillment and a trust
problem. Hard deadline requested: November 12, driven by the bundle-deal
campaign (see `context.md`). Definition of done in her own terms: a
customer can add 2+ different products, check out in one transaction, and
see every item correctly on the confirmation/receipt — wants to personally
verify this end-to-end before the campaign goes live.

### 2026 — reacted to the resizing news
Told the fix is bigger than first thought (backend contract, inter-service
messaging, a database change — kept in business terms for her). Asked the
obvious business question back: can engineering still promise something
correct by Nov 12, even if not the complete fix? Answered that Nov 12 has
limited flexibility (see `context.md`). Set her bottom line: every item in
a 3+ item order must actually ship and appear correctly on the receipt by
Nov 12 — an interim/patched fix is acceptable, the full clean fix can land
later. Asked engineering to confirm today whether that narrower scope is
realistic, or whether marketing needs to shrink the campaign to a
single-item promo instead.

**Note:** this response was given in parallel with Jordan Lee's meeting
turn, before she'd seen his specific question about what "bundle deal"
means technically (distinct SKUs vs. quantity>1 of one SKU). That question
is still open — see `tasks.md`.

### 2026 — full platform briefing received
Briefed in business terms on what the storefront can and can't do today
— see "What the storefront can actually do today" in `context.md`. Now
has enough grounding to answer Jordan's SKU question with the actual
product in mind, not just the campaign idea in isolation.
