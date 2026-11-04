# Task: Order Contract Design — Index

**Status:** Draft — for review, not yet implemented | **Backlog links:**
[FEAT-E](../../../BACKLOG.md), [FEAT-L](../../../BACKLOG.md)

**Current one-line status:** Shape is substantially resolved (see
[`../../DECISIONS.md`](../../DECISIONS.md) #8–12). Still open: see
[`../../OPEN-QUESTIONS.md`](../../OPEN-QUESTIONS.md) #5–6 (pickup
address requirement, customer/admin view split) and #9 (who does the
rollout-plan inventory step).

| File | What's in it |
|---|---|
| `index.md` | This file |
| `context.md` | Why this task exists, what's in the other artifact files, task-specific design notes not already captured in `../../DECISIONS.md` |
| `discussions.md` | Chronological log of review rounds (EOM finalization, real-contract cross-check, vendor-terminology correction, role routing) |
| `order.openapi.yaml` | Draft OpenAPI schema for the `Order` resource (FEAT-E) |
| `order-created-event.avsc` | Draft Avro schema for `OrderCreatedEvent` (FEAT-L) |
| `order-example.json` | Concrete example instance, flagged as illustrative/unconfirmed pending the partial-reservation behavior decision |
