# Elena Vasquez — Tasks

Mark items done in place; don't delete them.

## Open

- [ ] Verify payment-service's `InventoryReserved` dedup mechanism — keyed
  on orderNumber (safe against the per-item-event design) or only on
  Kafka-level duplicate delivery of the same event (not safe)? Read
  `PaymentSagaTransactionService` and its persistence layer.
- [ ] Once Priya answers the SKU-meaning question (distinct products vs.
  quantity>1 of one product), re-assess whether option (c)'s "narrow
  interim fix" is even smaller than currently scoped.
- [ ] Decide with Senior Developer whether to enter plan mode now for the
  phased design, or wait on the above two items first.

## Done

- [x] Fixed BUG-004 (inventory-service boot failure) — see context.md.
- [x] Investigated BUG-001 scope, corrected the "frontend-only" record.
- [x] Proposed three resizing options to the team.
