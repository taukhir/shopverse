---
title: Runtime Problem Index And Locking
---

# Runtime Problem Index And Locking

Runtime problem index and optimistic versus pessimistic locking.

Back to [Runtime Reliability Problems](../RUNTIME-RELIABILITY-PROBLEMS.md).

## Problem Index

| Area | Problem statement | Impact | Implemented fix | Details |
|---|---|---|---|---|
| Distributed checkout reliability | Order, Inventory, Payment, and Kafka cannot be committed in one ACID transaction | Lost events, partial checkout state, duplicate processing, and unclear recovery | Choreography SAGA with transactional outbox, compensation, timeline, retry/DLT, and stale-claim recovery | [Reliable distributed checkout](DISTRIBUTED-CHECKOUT.md#reliable-distributed-checkout) |
| SAGA visibility | Checkout state is spread across services, Kafka, logs, traces, and databases | hard support/debugging, unclear customer status, and slow incident triage | Persist an owner-protected, queryable order timeline | [Queryable order SAGA timeline](QUERYABLE-ORDER-TIMELINE.md#queryable-order-saga-timeline) |
| Duplicate checkout protection | Client or gateway retries can submit the same checkout more than once | duplicate orders, duplicate inventory reservations, and duplicate payment attempts | Require `Idempotency-Key`, persist it with the order, and enforce database uniqueness | [Idempotent checkout](IDEMPOTENT-CHECKOUT.md#idempotent-checkout-using-mandatory-idempotency-key) |
| Kafka duplicate handling | Kafka and outbox retries can deliver the same business event more than once | repeated reservation, repeated payment, or repeated recovery records | Enable producer idempotence and make consumers idempotent with business keys | [Kafka producer and consumer idempotency](KAFKA-IDEMPOTENCY.md#kafka-producer-idempotence-and-idempotent-consumers) |
| Payment uncertainty | Provider timeout does not prove success or failure | wrong decline, duplicate charge, or stuck order | Persist `TIMED_OUT`, reconcile later, and allow captured refunds | [Payment timeout reconciliation and refunds](PAYMENT-TIMEOUT-RECONCILIATION.md#payment-timeout-reconciliation-and-refunds) |
| Multi-replica reservation expiry | Every Inventory replica can scan the same expired reservation | duplicate work, optimistic-lock failures, batch rollback, and misleading metrics | Planned conditional row claim and one independent transaction per reservation | [Four reservations and two schedulers](TWO-SCHEDULER-RESERVATION-EXAMPLE.md) |
| Concurrency control choice | `@Version` and pessimistic locks can look similar but act at different points in the transaction | wrong lock choice can cause lost updates, duplicate worker processing, or unnecessary blocking | Use `@Version` for ordinary business-row conflicts and short pessimistic claims or atomic status updates for worker ownership | [Optimistic versus pessimistic locking](#optimistic-versus-pessimistic-locking) |
| Docker build reliability | Parallel service builds shared Gradle cache metadata | Intermittent Gradle lock failures | Assign a unique BuildKit cache ID to every service | [Gradle cache locks](../DOCKER-RUNTIME-IMAGE-PROBLEMS.md#1-parallel-docker-builds-and-gradle-cache-locks) |
| Outbox runtime reliability | A database row lock could remain held while waiting for Kafka | Blocked workers, exhausted connections, and lock timeouts | Split publication into short claim and finalization transactions around an unlocked Kafka send | [Short Outbox transactions](../OUTBOX-RUNTIME-PROBLEMS.md#2-outbox-database-locks-while-waiting-for-kafka) |
| Docker image efficiency | A JAR copied as `root` was recursively changed to another owner in a later layer | The large JAR could be represented again in a copy-on-write layer | Set final ownership during `COPY` with `--chown` | [Duplicate JAR ownership layers](../DOCKER-RUNTIME-IMAGE-PROBLEMS.md#3-duplicated-jar-ownership-layers) |
| Order dependency handling | An Inventory outage was converted into an empty catalog and reported as product not found | Misleading and potentially cached `404` responses | Throw a service-unavailable exception and return retryable `503` | [Inventory failure semantics](../DEPENDENCY-VERIFICATION-PROBLEMS.md#4-inventory-failures-reported-as-product-not-found) |
| Outbox crash recovery | A worker could stop after claiming an event | Event remains stuck in `PROCESSING` | Track claim time and release stale claims | [Stale Outbox claims](../OUTBOX-RUNTIME-PROBLEMS.md#5-outbox-events-stuck-after-a-worker-crash) |
| Verification resource control | Gradle, Docker, or smoke checks could wait indefinitely | CI agents and developer machines remain occupied | Apply one global deadline and terminate timed-out process trees | [Bounded verification](../DEPENDENCY-VERIFICATION-PROBLEMS.md#6-unbounded-verification-processes) |
| Windows health probing | PowerShell HTTP probing intermittently rejected valid container responses | Healthy stacks were reported as failed | Use bounded `curl.exe` status and body checks | [Reliable health probes](../DEPENDENCY-VERIFICATION-PROBLEMS.md#7-unreliable-windows-health-probes) |
| Isolated test observability | Config Server attempted to export test spans to an unsuitable default Zipkin endpoint | Connection warnings and timing noise | Disable sampling only in the isolated test override | [Test tracing noise](../DEPENDENCY-VERIFICATION-PROBLEMS.md#8-unnecessary-config-server-tracing-in-isolated-tests) |
| Container security | Application processes could otherwise run with container root privileges | Greater impact if application code is compromised | Create and run as the non-root `shopverse` user | [Non-root runtime](../DOCKER-RUNTIME-IMAGE-PROBLEMS.md#9-container-processes-running-as-root) |
| Runtime image composition | Build tooling and package metadata can unnecessarily remain in deployable images | Larger images and unnecessary runtime components | Use JDK build stages, JRE runtime stages, and remove package indexes | [Multi-stage runtime images](../DOCKER-RUNTIME-IMAGE-PROBLEMS.md#10-build-tools-in-runtime-images) |

The common principle is to avoid unnecessary shared mutable state, keep lock
scope narrow, and write files with their final metadata as early as possible.



## Optimistic Versus Pessimistic Locking

### Problem Statement

Both optimistic and pessimistic locking protect shared database state, so they
can look like the same feature. They are different in timing and purpose:

```text
Optimistic locking:
  allow concurrent reads
  detect conflict later during update or commit

Pessimistic locking:
  lock the row while reading
  prevent another worker from owning the same row at the same time
```

Choosing the wrong one creates real production issues:

- lost updates when stale data overwrites a newer value;
- duplicate outbox, DLT, or expiry processing when two workers pick the same
  row;
- unnecessary database blocking when every normal business read takes a lock;
- retry storms when high-contention operations rely only on optimistic retry.

### Applied Solution

Shopverse uses different protection depending on the invariant:

| Use case | Protection | Why |
|---|---|---|
| Inventory stock update | JPA `@Version` on `InventoryItem` | two checkouts can read, but only one stale-sensitive update succeeds |
| Checkout duplicate request | mandatory `Idempotency-Key` and unique database constraint | duplicate HTTP retries should return the existing order |
| Inventory reservation duplicate event | lookup by `orderNumber` | a repeated Kafka event must not reserve stock again |
| Outbox publishing | short database claim/finalize transactions | two workers must not publish the same row concurrently |
| Multi-replica reservation expiry | planned atomic row claim plus paid-reservation terminal state | every Inventory replica can run the scheduler, so each expired reservation needs one owner and paid stock must stop being eligible |

`@Version` comes into play during flush, update, or commit. Hibernate generates
an update with the old version in the `WHERE` clause:

```sql
update inventory_items
set available_quantity = ?,
    reserved_quantity = ?,
    version = version + 1
where id = ?
  and version = ?;
```

If another transaction already changed the row, the update affects zero rows
and Hibernate raises an optimistic-locking exception. That failed transaction
must roll back and retry the complete idempotent business operation from a
fresh read.

A pessimistic lock comes into play when the query runs:

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("select event from OutboxEvent event where event.id = :id")
Optional<OutboxEvent> findByIdForUpdate(Long id);
```

The database locks the selected row immediately. That is useful for worker
ownership, but the transaction must stay short. Shopverse therefore avoids
holding a database lock while waiting for Kafka.

For the full comparison, SQL shape, diagrams, and Shopverse decision guide,
see [Spring Data JPA locking and concurrency](../../../spring/SPRING-DATA-JPA.md#locking-and-concurrency).

The complete current-state analysis and target implementation are documented
in [Multi-Replica Reservation Expiry](MULTI-REPLICA-RESERVATION-EXPIRY.md).







