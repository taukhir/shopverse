---
title: "Reservation Transaction Implementation"
description: "Reservation Transaction Implementation with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "Reservation Transaction Implementation"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Reservation Transaction Implementation

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

## Avoiding Whole-Batch Rollback

The current method processes the complete result list inside one transaction:

```text
one transaction
  reservation 100
  reservation 101
  reservation 102 -> optimistic-lock failure
  reservation 103
```

Failure on reservation `102` can roll back successful work for `100` and `101`.

The target design keeps the scheduler non-transactional and invokes a separate
proxied worker transaction for every ID:

```java
@Scheduled(
    fixedDelayString =
        "${shopverse.inventory.expiry-scan-delay-ms:60000}"
)
public void expireBatch() {
    List<Long> candidateIds = reservations.findExpiredCandidateIds(
            ReservationStatus.RESERVED,
            Instant.now(),
            PageRequest.of(0, batchSize)
    );

    for (Long id : candidateIds) {
        try {
            expiryWorker.expireOne(id);
        } catch (TransientDataAccessException exception) {
            log.warn(
                    "Reservation expiry rolled back; it will be retried "
                            + "by a later scan id={}",
                    id,
                    exception
            );
        }
    }
}
```

```java
@Transactional(propagation = Propagation.REQUIRES_NEW)
public boolean expireOne(Long id) {
    // conditional claim, stock release, final status, outbox insertion
}
```

Result:

```text
reservation 100 transaction -> COMMIT
reservation 101 transaction -> COMMIT
reservation 102 transaction -> ROLLBACK
reservation 103 transaction -> COMMIT
```

Reservation `102` remains eligible for a later bounded retry. Other committed
reservations are not undone.

`REQUIRES_NEW` guarantees an independent transaction even if a caller later
adds an outer transaction. The worker must remain a separate Spring bean;
self-invocation such as `this.expireOne(id)` bypasses the transactional proxy.

Catch only failures that the scheduler can safely defer. Configuration,
serialization, invariant, and programming errors should remain visible and
alertable rather than being swallowed indefinitely. Apply a retry limit or
recovery state if one reservation repeatedly fails.

## Complete Target Implementation

The following snippets form one coherent target implementation. They are not
present in the runtime yet.

### 1. Reservation States

```java
public enum ReservationStatus {
    RESERVED,
    EXPIRING,
    COMMITTED,
    RELEASED,
    EXPIRED
}
```

### 2. Expiry Configuration

```yaml
shopverse:
  inventory:
    reservation-ttl: 5m
    expiry-scan-delay-ms: 30000
    expiry-batch-size: 100
```

```java
@Validated
@ConfigurationProperties("shopverse.inventory")
public record InventoryProperties(
        @NotNull Duration reservationTtl,
        @Positive long expiryScanDelayMs,
        @Min(1) @Max(1000) int expiryBatchSize
) {
}
```

Use an injectable clock so boundary behavior is deterministic in tests:

```java
@Configuration
class TimeConfiguration {

    @Bean
    Clock utcClock() {
        return Clock.systemUTC();
    }
}
```

### 3. Candidate Scan And Atomic Claim Repository

```java
public interface InventoryReservationRepository
        extends JpaRepository<InventoryReservation, Long> {

    Optional<InventoryReservation> findByOrderNumber(String orderNumber);

    @Query("""
            select reservation.id
              from InventoryReservation reservation
             where reservation.status = :status
               and reservation.expiresAt <= :now
             order by reservation.expiresAt, reservation.id
            """)
    List<Long> findExpiredCandidateIds(
            @Param("status") ReservationStatus status,
            @Param("now") Instant now,
            Pageable pageable
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update InventoryReservation reservation
               set reservation.status = :claimStatus
             where reservation.id = :id
               and reservation.status = :expectedStatus
               and reservation.expiresAt <= :now
            """)
    int claimExpiredReservation(
            @Param("id") Long id,
            @Param("expectedStatus") ReservationStatus expectedStatus,
            @Param("claimStatus") ReservationStatus claimStatus,
            @Param("now") Instant now
    );
}
```

The existing `(status, expires_at)` index supports the candidate predicate.
InnoDB secondary indexes also carry the primary-key value internally, so add a
new `(status, expires_at, id)` index only after checking the actual plan with
`EXPLAIN`.

### 4. Worker Result

Returning a result lets the scheduler publish metrics and logs only after the
worker's transaction interceptor has committed:

```java
public record ReservationExpiryResult(
        Long reservationId,
        String orderNumber,
        String correlationId,
        Outcome outcome
) {
    public enum Outcome {
        EXPIRED,
        SKIPPED
    }

    public static ReservationExpiryResult skipped(Long reservationId) {
        return new ReservationExpiryResult(
                reservationId,
                null,
                null,
                Outcome.SKIPPED
        );
    }
}
```

### 5. One Transaction Per Reservation

```java
@Service
@RequiredArgsConstructor
public class ReservationExpiryWorker {

    private final InventoryReservationRepository reservations;
    private final InventoryItemRepository items;
    private final OutboxService outboxService;
    private final KafkaTopicsProperties topics;
    private final Clock clock;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ReservationExpiryResult expireOne(Long reservationId) {
        Instant now = clock.instant();

        int claimed = reservations.claimExpiredReservation(
                reservationId,
                ReservationStatus.RESERVED,
                ReservationStatus.EXPIRING,
                now
        );

        if (claimed == 0) {
            return ReservationExpiryResult.skipped(reservationId);
        }

        InventoryReservation reservation = reservations
                .findById(reservationId)
                .orElseThrow(() -> new IllegalStateException(
                        "Claimed reservation not found: " + reservationId
                ));

        InventoryItem item = items
                .findByProductId(reservation.getProductId())
                .orElseThrow(() -> new IllegalStateException(
                        "Inventory item not found for reservation: "
                                + reservationId
                ));

        item.release(reservation.getQuantity());
        reservation.expire();

        InventoryFailedEvent event = new InventoryFailedEvent(
                null,
                reservation.getOrderNumber(),
                reservation.getCorrelationId(),
                "Inventory reservation expired before payment completed"
        );

        outboxService.enqueue(
                "INVENTORY_RESERVATION",
                reservation.getOrderNumber(),
                InventoryFailedEvent.class.getSimpleName(),
                topics.inventoryFailed(),
                reservation.getOrderNumber(),
                event,
                reservation.getCorrelationId()
        );

        return new ReservationExpiryResult(
                reservation.getId(),
                reservation.getOrderNumber(),
                reservation.getCorrelationId(),
                ReservationExpiryResult.Outcome.EXPIRED
        );
    }
}
```

### 6. Non-Transactional Scheduler

The scheduler discovers candidates but does not own a batch transaction. Each
worker invocation enters a separate proxied bean and therefore receives its own
REQUIRES_NEW transaction.

```java
@Component
@RequiredArgsConstructor
public class ReservationExpiryScheduler {

    private final InventoryReservationRepository reservations;
    private final ReservationExpiryWorker worker;
    private final Clock clock;
    private final MeterRegistry meterRegistry;

    @Scheduled(
            fixedDelayString =
                    "${shopverse.inventory.expiry-scan-delay-ms:60000}"
    )
    public void expireReservations() {
        List<Long> candidates = reservations.findExpiredCandidateIds(
                ReservationStatus.RESERVED,
                clock.instant(),
                PageRequest.of(0, 100)
        );

        for (Long reservationId : candidates) {
            try {
                ReservationExpiryResult result =
                        worker.expireOne(reservationId);

                if (result.outcome()
                        == ReservationExpiryResult.Outcome.EXPIRED) {
                    meterRegistry.counter(
                            "shopverse.inventory.reservations.expired"
                    ).increment();
                }
            } catch (RuntimeException exception) {
                meterRegistry.counter(
                        "shopverse.inventory.reservations.expiry.failures"
                ).increment();
                log.error(
                        "Reservation expiry failed reservationId={}",
                        reservationId,
                        exception
                );
            }
        }
    }
}
```

Do not call `expireOne()` through `this`. Spring transaction advice is applied
by the proxy between the scheduler bean and worker bean.

## Transaction Boundary

For every candidate, the sequence is:

```text
begin transaction
  conditional RESERVED -> EXPIRING claim
  load the claimed reservation and inventory item
  release stock
  mark reservation EXPIRED
  insert inventory.failed into the outbox
commit transaction
```

Kafka publication remains outside this transaction. The outbox publisher sends
the persisted event later. If one reservation fails, only its transaction rolls
back and the scheduler continues with the remaining IDs.

## Successful Payment Must Compete Atomically

The `payment.completed` consumer needs its own conditional transition:

```java
@Modifying(clearAutomatically = true, flushAutomatically = true)
@Query("""
        update InventoryReservation reservation
           set reservation.status = :committed
         where reservation.orderNumber = :orderNumber
           and reservation.status = :reserved
        """)
int commitReservation(
        String orderNumber,
        ReservationStatus reserved,
        ReservationStatus committed
);
```

Payment completion and expiry race on the same `RESERVED` predicate:

```text
payment wins: RESERVED -> COMMITTED; expiry claim returns 0
expiry wins:  RESERVED -> EXPIRING; payment transition returns 0
```

If expiry wins, use the explicit late-payment workflow documented in
[Late payment after expiry](LATE-PAYMENT-AFTER-EXPIRY.md). Never silently move
an expired or cancelled order to `CONFIRMED`.

## Official References

- [Spring transaction management](https://docs.spring.io/spring-framework/reference/data-access/transaction.html)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [PostgreSQL explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html)

## Recommended Next

Return to [Atomic Inventory Reservation](./ATOMIC-RESERVATION-CLAIM.md) to select the next focused guide.
