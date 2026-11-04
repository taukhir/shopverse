# Order Contract Design — Tasks

Mark items done in place; don't delete them.

## Open

- [ ] Resolve [`OPEN-QUESTIONS.md`](../../OPEN-QUESTIONS.md) #5 (pickup
  address requirement) and #6 (customer/admin view split).
- [ ] Decide who does Codex's rollout-plan "inventory current behavior"
  first deliverable ([`OPEN-QUESTIONS.md`](../../OPEN-QUESTIONS.md) #9).
- [ ] Produce the failure/compensation example `discussion-07` asked
  for, using the now-resolved `OrderLineFulfillmentStatus` enum instead
  of an invented shape.
- [ ] Enter plan mode before any real Gradle module is created, per
  `AGENTS.md`'s cross-service-contract rule.

## Done

- [x] Drafted `order.openapi.yaml` and `order-created-event.avsc`.
- [x] Finalized against the real Amway EOM contract (discussion-06).
- [x] Resolved partial-reservation behavior and the missing status
  vocabulary against the real fulfillment-api/tax-api contracts.
- [x] Redesigned the vendor-borrowed enum as ShopVerse's own.
- [x] Split this task's documentation into index/context/discussions/
  tasks, matching the rest of `Team/`.
