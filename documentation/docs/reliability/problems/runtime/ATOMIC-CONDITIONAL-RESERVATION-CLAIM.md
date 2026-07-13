---
title: "Atomic Conditional Reservation Claim"
description: "Atomic Conditional Reservation Claim with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "Atomic Conditional Reservation Claim"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Atomic Conditional Reservation Claim

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

## Recommended Solution: Atomic Conditional Claim

Use the database to choose exactly one owner before stock is changed:

```java
@Modifying(clearAutomatically = true, flushAutomatically = true)
@Query("""
        update InventoryReservation reservation
           set reservation.status = :claimStatus
         where reservation.id = :id
           and reservation.status = :expectedStatus
           and reservation.expiresAt <= :now
        """)
int claimExpiredReservation(
        Long id,
        ReservationStatus expectedStatus,
        ReservationStatus claimStatus,
        Instant now
);
```

Conceptually, the database executes:

```sql
UPDATE inventory_reservations
SET status = 'EXPIRING'
WHERE id = ?
  AND status = 'RESERVED'
  AND expires_at <= ?;
```

The affected-row count is the ownership decision:

```text
1 row updated -> this transaction owns expiry
0 rows updated -> another worker/event already changed it; skip
```

### What The `UPDATE` Returns

SQL `UPDATE` does not return the modified reservation row. JDBC returns an
integer update count through `executeUpdate`. Spring Data exposes that count
when an `@Modifying` repository method returns `int` or `long`:

```java
int claimed = reservations.claimExpiredReservation(
        reservationId,
        ReservationStatus.RESERVED,
        ReservationStatus.EXPIRING,
        Instant.now()
);
```

For this conditional update:

```sql
UPDATE inventory_reservations
SET status = 'EXPIRING'
WHERE id = ?
  AND status = 'RESERVED'
  AND expires_at <= CURRENT_TIMESTAMP;
```

the meaningful results are:

| Update count | Meaning | Worker action |
|---:|---|---|
| `1` | one row satisfied every predicate and was changed | this transaction owns the reservation and continues |
| `0` | row is missing, not expired, or no longer `RESERVED` | skip without error |
| greater than `1` | impossible when `id` is a primary key | treat as a defect |

The status predicate makes the operation compare-and-set:

```text
change RESERVED to EXPIRING only if it is still RESERVED
```

The worker should not fetch the row first and use that earlier result as proof
of ownership. Only the update count from the conditional write is authoritative.

### Concurrent Update Behavior In MySQL

Suppose replicas A and B both execute the claim for reservation `100`:

```mermaid
sequenceDiagram
    participant A as Replica A
    participant B as Replica B
    participant DB as MySQL

    A->>DB: UPDATE id=100 WHERE status=RESERVED
    DB-->>A: update count 1; row lock held until transaction ends
    B->>DB: UPDATE id=100 WHERE status=RESERVED
    Note over B,DB: B waits for the conflicting row lock
    A->>DB: release stock, mark EXPIRED, insert outbox, COMMIT
    DB-->>B: re-evaluate WHERE against committed state
    DB-->>B: update count 0 because status is EXPIRED
```

If A rolls back instead, its uncommitted `EXPIRING` change disappears. B can
then re-evaluate the predicate, change `RESERVED -> EXPIRING`, and receive `1`.
This gives failover without two committed owners.

Concurrent updates to the same row serialize inside MySQL. After the first
transaction commits, the second worker re-evaluates `status = 'RESERVED'`,
finds it false, and receives `0`.

## Can Two Replicas Read The Same Candidate Batch?

Yes. With the simple candidate query, both replicas can read the same IDs:

```text
Replica A candidates: [100, 101, 102]
Replica B candidates: [100, 101, 102]
```

The scan is only a work hint. It does not grant ownership. Each replica must
claim every ID separately:

```text
Reservation 100: A gets 1, B gets 0
Reservation 101: B gets 1, A gets 0
Reservation 102: A gets 1, B gets 0
```

Both replicas may therefore scan the same set while each reservation still has
one committed owner. Duplicate candidate reads waste a small amount of query
and claim work but do not duplicate the business operation.

To reduce duplicate scanning at higher scale, use a database-specific
`FOR UPDATE SKIP LOCKED` query. It lets each worker fetch rows not currently
locked by another worker. Atomic conditional claiming remains useful as the
business guard, especially for retries and alternative entry paths.

## Short Per-Reservation Transaction

Split scanning from processing:

```java
@Component
@RequiredArgsConstructor
class ReservationExpiryScheduler {

    private final InventoryReservationRepository repository;
    private final ReservationExpiryWorker worker;

    @Scheduled(
        fixedDelayString =
            "${shopverse.inventory.expiry-scan-delay-ms:60000}"
    )
    public void expireBatch() {
        repository.findExpiredCandidateIds(
                        ReservationStatus.RESERVED,
                        Instant.now(),
                        PageRequest.of(0, 100)
                )
                .forEach(worker::expireOne);
    }
}
```

The worker must be a separate Spring bean so calling it passes through the
transaction proxy. Calling a new `@Transactional` method through `this` would
bypass proxy interception.

```java
@Service
@RequiredArgsConstructor
class ReservationExpiryWorker {

    private final InventoryReservationRepository reservations;
    private final InventoryItemRepository items;
    private final OutboxService outbox;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean expireOne(Long reservationId) {
        Instant now = Instant.now();

        int claimed = reservations.claimExpiredReservation(
                reservationId,
                ReservationStatus.RESERVED,
                ReservationStatus.EXPIRING,
                now
        );

        if (claimed == 0) {
            return false;
        }

        InventoryReservation reservation = reservations
                .findById(reservationId)
                .orElseThrow();

        InventoryItem item = items
                .findByProductId(reservation.getProductId())
                .orElseThrow();

        item.release(reservation.getQuantity());
        reservation.expire();

        outbox.enqueue(
                "INVENTORY_RESERVATION",
                reservation.getOrderNumber(),
                "InventoryFailedEvent",
                "shopverse.inventory.failed",
                reservation.getOrderNumber(),
                createExpiryEvent(reservation),
                reservation.getCorrelationId()
        );

        return true;
    }
}
```

The code is a target design, not the current implementation. Exact types and
topic properties should use the existing Shopverse abstractions when built.

## Recommended Next

Return to [Atomic Inventory Reservation](./ATOMIC-RESERVATION-CLAIM.md) to select the next focused guide.


## Official References

- [Resilience4j documentation](https://resilience4j.readme.io/docs)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
