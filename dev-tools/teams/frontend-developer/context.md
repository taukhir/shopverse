# Maya Chen — Project Knowledge

Append-only. Newest entries at the bottom. Don't rewrite past entries.

From `shopverse-web/AGENTS.md`, relevant to the eventual BUG-001 task:
(1) idempotency-key reuse rule — must be generated once per attempt, not
regenerated per item or per request; (2) never display internal
stack/database/broker/token details, even via the receipt/success path;
(3) follow the existing signal/computed pattern already used in
`checkout-page.component.ts` rather than introducing a different
state-management approach.
