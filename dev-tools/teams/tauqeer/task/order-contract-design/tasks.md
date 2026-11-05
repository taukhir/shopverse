# Order Contract Design — Tasks

Mark items done in place; don't delete them.

## Open

- [ ] Resolve [`OPEN-QUESTIONS.md`](../../OPEN-QUESTIONS.md) #5 (pickup
  address requirement) and #6 (customer/admin view split).
- [ ] Produce the failure/compensation example `discussion-07` asked
  for, using the now-resolved `OrderLineFulfillmentStatus` enum instead
  of an invented shape.

## Done

- [x] Decided who does Codex's rollout-plan "inventory current
  behavior" first deliverable -- done jointly this session, see
  `contract-inventory.md` (resolves `OPEN-QUESTIONS.md` #9).
- [x] Entered plan mode before creating the real Gradle modules
  (`shopverse-avro-schemas`), per `AGENTS.md`'s cross-service-contract
  rule -- plan approved 2026-11-05.
- [x] Implemented the approved plan 2026-11-05: MapStruct adoption for
  `OrderContractMapper` (`f09bef8a`) and the `shopverse-avro-schemas`
  module compiling `OrderCreatedEvent` (`8bbfb1ff`), order-service only,
  compile-only (not wired to the live Kafka producer/consumer -- see
  `BACKLOG.md` FEAT-L for what's still open).

- [x] Drafted `order.openapi.yaml` and `order-created-event.avsc`.
- [x] Finalized against the real Amway EOM contract (discussion-06).
- [x] Resolved partial-reservation behavior and the missing status
  vocabulary against the real fulfillment-api/tax-api contracts.
- [x] Redesigned the vendor-borrowed enum as ShopVerse's own.
- [x] Split this task's documentation into index/context/discussions/
  tasks, matching the rest of `teams/`.
