# Payment Service Guidance

## Responsibilities

This service owns payment state and customer ownership, payment processing
decisions, payment saga handling, completion/failure events, compensation
signals, outbox publication, replay audit, and failed-event recovery. It does not
own Order or Inventory state.

## Invariants

- A duplicate `InventoryReserved` event must not create or complete payment more
  than once for the same business operation.
- Preserve valid payment state transitions; terminal success or failure must not
  silently regress under retry, replay, or out-of-order delivery.
- Do not log, persist, emit, or return raw payment credentials or provider
  secrets. Use only the repository's safe identifiers and demo abstractions.
- A payment outcome and its outbox intent must remain atomic in the intended
  local transaction.
- Failure and timeout behavior must produce an auditable outcome that allows the
  choreography to compensate inventory and update the order.
- Preserve customer ownership and configured administrative recovery controls.
- Never interpret retry as permission to charge or complete twice.

## Event And Persistence Changes

- Inspect `saga/`, `service/`, `outbox/`, failed-event storage, replay audit, and
  every downstream consumer before changing an event or payment transition.
- Define stable business identity separately from Kafka offset and delivery
  attempt. Review concurrent duplicate delivery explicitly.
- Add forward-only changelogs under `src/main/resources/db/changelog/` and append
  them to `db.changelog-master.yml`.
- Do not weaken audit or ownership fields to simplify a migration.

## Tests

Run from `payment-service/`:

```powershell
.\gradlew.bat test --no-daemon --max-workers=2
.\gradlew.bat integrationTest --no-daemon --max-workers=2
```

Cover duplicate delivery, terminal-state replay, success, decline, timeout,
outbox commit/rollback, compensation signal, ownership denial, sensitive error
mapping, and migration behavior when relevant.

## Review Focus

Check double-charge/double-completion risk, event compatibility, transaction and
acknowledgment boundaries, retry/DLT/replay semantics, audit evidence,
authorization, sensitive-data handling, and recovery metrics.
