# Order Contract Design — Context

## What this task is

Design the enterprise-shaped `Order` contract and the redesigned
`OrderCreatedEvent` Avro schema, as concrete drafts to review before any
real Gradle module or production code is written. Originated from
discussion-05 and the follow-up design conversation with Elena Vasquez —
see [`../../sprints/sprint-0001/discussion-05.md`](../../sprints/sprint-0001/discussion-05.md).

## Why this task exists

- `FEAT-E`/`FEAT-L` on `BACKLOG.md` are active pre-Nov-12 work.
- The contract-module compromise (one `shopverse-contracts` /
  `shopverse-avro-schemas` module, per-service packages) needed a
  concrete shape to review before implementation — see
  [`../../DECISIONS.md`](../../DECISIONS.md) #4.

## Files in this folder

See [`index.md`](index.md) — kept there so it's the single place that
lists them (don't duplicate the file table here too).

## Durable design decisions

Most of these now live in [`../../DECISIONS.md`](../../DECISIONS.md)
(#8–12) — check there first. This section holds only the
task-specific elaboration that doesn't fit a one-line ledger row:

- **Money/currency/timestamps/address formats:** see `DECISIONS.md` #8.
  Elaboration: every money field also carries an explicit ISO 4217
  `currency` — cheap now, expensive to retrofit once FEAT-H (tax) or
  multi-currency work begins.
- **Line items as a nested record array in both REST and event
  shapes**, deliberately kept consistent — one business concept
  (`OrderLineItem`), not two representations that can drift apart.
- **Avro field defaults are not style, they're the compatibility
  rule** — a field can only be safely added later if it has a default;
  skipping this now breaks the first schema evolution.
- **`eventId` is identity, not dedup** — see `DECISIONS.md` row history;
  the inbox logic itself is a separate implementation task.
- **Shared `.avsc` schema source, independently compiled per service** —
  resolves the tension between sharing one module and the repo's
  "event records copied per service" convention. See `DECISIONS.md` #4.

## Codex's rollout plan

`teams/senior-solutions-architect/contract-rollout-plan.md` (formerly
under `product-manager/`) is a concrete, sequenced engineering plan —
inventory existing behavior → OpenAPI module → Avro module → registry
selection → pilot one route → controlled cutover → CI checks. Treat it
as the execution plan once this design is approved, not something to
re-derive from scratch.
