---
title: Multi-Replica Reservation Expiry
---

# Multi-Replica Reservation Expiry

Inventory reservation expiry exists in Shopverse, but the current worker is
not yet safe as a complete multi-replica design. This page separates the
implemented baseline from the remaining correctness work.

Back to [Runtime Reliability Problems](../RUNTIME-RELIABILITY-PROBLEMS.md).

## Implementation Status

| Capability | Status |
|---|---|
| Reservation TTL and `expires_at` | implemented |
| `(status, expires_at)` database index | implemented |
| Scheduled scan for expired reservations | implemented |
| Stock release and outbox insertion in one local transaction | implemented |
| Atomic ownership claim between scheduler replicas | **not implemented** |
| Successful-payment transition out of `RESERVED` | **not implemented** |
| Multi-replica contention integration test | **not implemented** |

Therefore the accurate description is:

> Shopverse has a single-worker reservation-expiry baseline. Multi-replica
> ownership and the paid-reservation terminal transition remain enhancements.

## Business Problem

Checkout reserves stock before payment completes:

```text
available stock -> reserved stock -> payment decision
```

The reservation cannot remain forever. If payment never completes, abandoned
stock must become available again. Shopverse assigns a five-minute TTL:

```text
RESERVED + expires_at <= now -> EXPIRED + stock restored
```

The operation must satisfy these invariants:

1. one reservation releases stock at most once;
2. a paid reservation must never expire;
3. the status change, stock update, and compensation outbox event commit
   atomically;
4. worker crash must not leave a permanently claimed reservation;
5. adding Inventory Service replicas must not change business results.

## Current Implementation

Every Inventory Service replica runs the same scheduled method:

```java
@Scheduled(
    fixedDelayString =
        "${shopverse.inventory.expiry-scan-delay-ms:60000}"
)
@Transactional
public int expireReservations() {
    List<InventoryReservation> expired =
            reservationRepository.findAllByStatusAndExpiresAtBefore(
                    ReservationStatus.RESERVED,
                    Instant.now()
            );

    expired.forEach(reservation -> {
        findItem(reservation.getProductId())
                .release(reservation.getQuantity());
        reservation.expire();
        outboxService.enqueue(...);
    });

    return expired.size();
}
```

The repository method is an ordinary unlocked read:

```java
List<InventoryReservation> findAllByStatusAndExpiresAtBefore(
        ReservationStatus status,
        Instant expiresAt
);
```

`@Scheduled` runs independently in every application replica. Spring does not
elect one scheduler leader and does not coordinate this method across JVMs.

## Focused Guides

The original analysis is divided by concern so current behavior and target
implementation are not mixed together:

| Guide | Use it for |
|---|---|
| [Atomic reservation claim](ATOMIC-RESERVATION-CLAIM.md) | conditional claims, short transactions, failure isolation, and target code |
| [Two-scheduler worked example](TWO-SCHEDULER-RESERVATION-EXAMPLE.md) | a four-reservation walkthrough across two replicas |
| [Late payment after expiry](LATE-PAYMENT-AFTER-EXPIRY.md) | provider-time decisions, reconciliation, and idempotent refunds |
| [Locking and work ownership](../../locking/LOCKING-AND-WORK-OWNERSHIP.md) | comparison of database claims, `SKIP LOCKED`, ShedLock, fencing, partitions, and queues |

## Target Design Summary

The target design uses an atomic `RESERVED -> EXPIRING` claim, one short
transaction per reservation, and a terminal transition when payment succeeds.
Only the replica whose conditional update affects one row owns that reservation.
Payment completion and expiry compete through conditional state transitions,
and late successful payments trigger an idempotent reconciliation or refund
workflow rather than silently confirming an order without stock.

## Indexing And Batch Limits

The existing index is useful:

```yaml
columns:
  - column: { name: status }
  - column: { name: expires_at }
```

For deterministic pagination, an index ending in `id` may be evaluated:

```text
(status, expires_at, id)
```

Use `EXPLAIN` with production-like cardinality before changing it. Fetch a
bounded candidate batch and order by `expires_at, id`; do not load every
expired row into one persistence context.

## Alternatives

### `SELECT ... FOR UPDATE SKIP LOCKED`

Workers lock different rows and skip rows held by another replica:

```sql
SELECT id
FROM inventory_reservations
WHERE status = 'RESERVED'
  AND expires_at <= CURRENT_TIMESTAMP
ORDER BY expires_at, id
LIMIT 100
FOR UPDATE SKIP LOCKED;
```

This is efficient for competing workers but database-specific. Keep the lock
transaction short and include local state/outbox changes before commit.

### Shared Scheduler Lock

ShedLock or another database-backed scheduler lock allows only one replica to
run the job. It is simple for a POC, but:

- expiry throughput is limited to one scheduler;
- lease duration and clock behavior need care;
- one global lock prevents parallel processing of independent rows;
- the business operation still needs idempotency.

Configuration, JDBC lock-table setup, lease semantics, failure behavior, and
tests are documented in
[Scheduler Locking With ShedLock](../../locking/SCHEDULER-LOCKING-SHEDLOCK.md).

### Partition Ownership

Assign each reservation partition to one worker. This scales well but adds
rebalancing and ownership complexity that is unnecessary for the current POC.

## Recommended Choice For Shopverse

Use:

```text
bounded candidate scan
+ atomic conditional row claim
+ one transaction per reservation
+ InventoryItem optimistic locking
+ transactional outbox
+ payment.completed -> COMMITTED transition
```

This approach uses the existing MySQL/JPA/outbox architecture, allows multiple
replicas to make progress, and does not introduce Redis or a separate locking
service.

## Required Tests

Use MySQL Testcontainers because H2 does not reproduce MySQL locking behavior.

1. Start two concurrent workers against one expired reservation.
2. Synchronize their start with a barrier/latch.
3. Assert exactly one worker reports a successful claim.
4. Assert stock is restored exactly once.
5. Assert reservation becomes `EXPIRED`.
6. Assert exactly one compensation outbox record exists.
7. Force an outbox failure and assert stock, status, and claim all roll back.
8. Race `payment.completed` against expiry and assert only one transition from
   `RESERVED` wins.
9. Assert `COMMITTED`, `RELEASED`, and `EXPIRED` rows are never selected again.
10. Run multiple expired reservations for the same product and confirm
    optimistic conflicts retry without deadlock or duplicate release.

## Observability

Useful low-cardinality metrics:

```text
shopverse.inventory.expiry.candidates
shopverse.inventory.expiry.claimed
shopverse.inventory.expiry.skipped
shopverse.inventory.expiry.completed
shopverse.inventory.expiry.failed
shopverse.inventory.expiry.duration
shopverse.inventory.expiry.lag
```

Keep `orderNumber`, reservation ID, and correlation ID in structured logs, not
metric labels.

Log outcomes only after transaction completion where possible:

```text
candidate found
claim won / claim skipped
expiry committed
expiry rolled back with exception category
late payment requires reconciliation
```

Alert on growing expiry lag, repeated claim failures, optimistic-conflict
spikes, and old `RESERVED` rows beyond the TTL plus scan allowance.

## Implementation Checklist

- [ ] Add `EXPIRING` and `COMMITTED` reservation states.
- [ ] Consume `payment.completed` in Inventory Service.
- [ ] Add conditional `RESERVED -> COMMITTED` transition.
- [ ] Add bounded candidate-ID query.
- [ ] Add atomic `RESERVED -> EXPIRING` claim.
- [ ] Process each claimed reservation in a separate proxied transaction.
- [ ] Keep stock release, final status, and outbox insertion atomic.
- [ ] Add `inventory.committed`; stop confirming Order directly from only
      `payment.completed`.
- [ ] Add idempotent `late-payment.detected` recovery.
- [ ] Add durable `REFUND_PENDING -> REFUNDED/MANUAL_REVIEW` workflow.
- [ ] Define provider refund idempotency and reconciliation behavior.
- [ ] Guard Order terminal-state transitions.
- [ ] Add MySQL Testcontainers concurrency and rollback tests.
- [ ] Add Kafka Testcontainers late-payment and duplicate-delivery tests.
- [ ] Add expiry claim, lag, failure, and completion metrics.
- [ ] Load-test multiple Inventory replicas before marking this implemented.

## Related Documentation

- [Locking And Work Ownership](../../locking/LOCKING-AND-WORK-OWNERSHIP.md)
- [Database Locking And Work Claims](../../locking/DATABASE-LOCKING-AND-CLAIMS.md)
- [Scheduler Locking With ShedLock](../../locking/SCHEDULER-LOCKING-SHEDLOCK.md)
- [Runtime locking decisions](INDEX-AND-LOCKING.md)
- [Spring Data JPA transactions and locking](../../../spring/jpa/JPA-TRANSACTIONS-LOCKING.md)
- [Transactional outbox](../../OUTBOX-PATTERN.md)
- [Shopverse SAGA and Outbox](../../SAGA-OUTBOX.md)
- [Inventory Service README](https://github.com/taukhir/shopverse/tree/main/inventory-service)
- [Spring transaction management](https://docs.spring.io/spring-framework/reference/data-access/transaction.html)
- [Spring scheduling](https://docs.spring.io/spring-framework/reference/integration/scheduling.html)

