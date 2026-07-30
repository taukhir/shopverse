# Inventory Service Guidance

## Responsibilities

This service owns catalog and stock data, reservation state, reservation expiry,
release/compensation, inventory saga handling, outbox publication, and failed
Kafka-event recovery. Do not let Order or Payment mutate inventory tables.

## Invariants

- Stock reservation must prevent overselling under concurrent requests. Do not
  replace database concurrency controls with an in-memory check.
- Quantity changes must preserve non-negative available and reserved values and
  the service's existing stock/reservation relationship.
- Duplicate `OrderCreated` delivery must not reserve stock twice or emit repeated
  business effects.
- Cancellation or payment-failure compensation must release at most the amount
  reserved for the order and must be safe to replay.
- Expiry and compensation can race; use durable state transitions and database
  evidence rather than timing assumptions.
- Catalog reads may be public, but inventory administration and recovery actions
  retain their configured authorization.

## Event And Persistence Changes

- Inspect `saga/`, `outbox/`, `recovery/`, reservation entities/repositories, and
  all event consumers before changing stock or reservation flow.
- Preserve atomic domain mutation plus outbox enqueue in the local transaction.
- Review Kafka keying, concurrency, retry, DLT, and replay when ordering matters.
- Add forward-only changelogs under `src/main/resources/db/changelog/` and append
  them to `db.changelog-master.yml`.
- Seed-data changes must remain deterministic and must not masquerade as a
  runtime integration event.

## Tests

Run from `inventory-service/`:

```powershell
.\gradlew.bat test --no-daemon --max-workers=2
.\gradlew.bat integrationTest --no-daemon --max-workers=2
```

Cover insufficient stock, concurrent reservation, duplicate events, repeated
release, expiry races, outbox commit/rollback, authorization, and migration
behavior when relevant. Use Testcontainers integration coverage for database and
transaction claims.

## Review Focus

Check oversell risk, isolation/locking assumptions, replay safety, quantity
boundaries, event compatibility, reservation auditability, recovery behavior,
and metrics that distinguish reservation success, rejection, release, and expiry.
