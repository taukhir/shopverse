# Order Service Guidance

## Responsibilities

This service owns checkout creation, order state, immutable line and shipping
snapshots, customer ownership, idempotency, the order timeline, cancellation,
fulfillment, returns, saga observation, outbox publication, and failed-event
recovery. Do not move inventory or payment ownership into this service.

## Invariants

- `Idempotency-Key` is required at checkout. Preserve customer scoping: a key
  owned by another customer must conflict rather than reveal or reuse the order.
- A successful new checkout must commit order state, its initial timeline entry,
  and outbox intent within the intended local transaction.
- A replayed idempotent request must not create another order or publish another
  initial business event.
- Validate every saga transition against the current order state. Duplicate,
  stale, and out-of-order events must not regress or repeat terminal behavior.
- Keep order timeline entries useful for audit and customer-visible progress.
- Preserve object ownership for read, cancellation, fulfillment, return, and
  recovery endpoints; confirm the required customer/admin role in code and tests.
- Do not expose internal exception, Kafka, database, or payment details through
  public problem responses.

## Event And Persistence Changes

- Review `saga/`, `outbox/`, `recovery/`, producer metadata, and every consuming
  service before changing an event record or topic behavior.
- Preserve the transactional outbox boundary. Do not publish directly from a
  business transaction as a replacement for the existing outbox.
- Add forward-only changelogs under `src/main/resources/db/changelog/` and append
  them to `db.changelog-master.yml`.
- Include compatibility, rollback/forward-fix, and existing-data behavior in a
  migration plan.

## Tests

Run from `order-service/`:

```powershell
.\gradlew.bat test --no-daemon --max-workers=2
.\gradlew.bat integrationTest --no-daemon --max-workers=2
```

For focused work, use `--tests` first. Cover idempotency replay and conflict,
ownership denial, invalid transitions, duplicate delivery, outbox commit/rollback,
and public error mapping when relevant.

## Review Focus

Check checkout response compatibility, money and quantity semantics, immutable
snapshots, timeline completeness, Kafka key/order assumptions, compensation,
authorization, sensitive logging, and whether tests fail without the fix.
