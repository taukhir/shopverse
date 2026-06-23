---
title: Scheduler Locking With ShedLock
---

# Scheduler Locking With ShedLock

Spring `@Scheduled` runs independently in every application instance. ShedLock
uses shared storage so only one replica executes a named scheduled method for
one lock interval.

Back to [Locking And Work Ownership](LOCKING-AND-WORK-OWNERSHIP.md).

## Problem

```text
Inventory replica A -> expireReservations()
Inventory replica B -> expireReservations()
Inventory replica C -> expireReservations()
```

Without coordination, all three methods run.

With ShedLock:

```text
A acquires inventory-reservation-expiry -> executes
B cannot acquire                         -> skips
C cannot acquire                         -> skips
```

The skipped calls are not queued for later execution.

## Dependencies

Declare one compatible ShedLock version centrally:

```gradle
implementation "net.javacrumbs.shedlock:shedlock-spring:${shedlockVersion}"
implementation "net.javacrumbs.shedlock:shedlock-provider-jdbc-template:${shedlockVersion}"
```

ShedLock is not currently installed in Shopverse.

## Lock Table

MySQL/Liquibase target:

```yaml
databaseChangeLog:
  - changeSet:
      id: create-shedlock
      author: shopverse
      changes:
        - createTable:
            tableName: shedlock
            columns:
              - column:
                  name: name
                  type: VARCHAR(64)
                  constraints:
                    primaryKey: true
                    nullable: false
              - column:
                  name: lock_until
                  type: TIMESTAMP(3)
                  constraints:
                    nullable: false
              - column:
                  name: locked_at
                  type: TIMESTAMP(3)
                  constraints:
                    nullable: false
              - column:
                  name: locked_by
                  type: VARCHAR(255)
                  constraints:
                    nullable: false
```

All scheduler replicas must use the same table/database.

## Configuration

```java
@Configuration
@EnableScheduling
@EnableSchedulerLock(defaultLockAtMostFor = "PT10M")
public class SchedulerLockConfiguration {

    @Bean
    LockProvider lockProvider(DataSource dataSource) {
        return new JdbcTemplateLockProvider(
                JdbcTemplateLockProvider.Configuration.builder()
                        .withJdbcTemplate(new JdbcTemplate(dataSource))
                        .usingDbTime()
                        .build()
        );
    }
}
```

`usingDbTime()` makes lock decisions using the shared database clock instead
of comparing independent JVM clocks.

## Scheduled Method

```java
@Scheduled(
    fixedDelayString =
        "${shopverse.inventory.expiry-scan-delay-ms:60000}"
)
@SchedulerLock(
    name = "inventory-reservation-expiry",
    lockAtMostFor = "PT2M",
    lockAtLeastFor = "PT1S"
)
public void expireReservations() {
    // bounded, idempotent expiry work
}
```

| Parameter | Meaning |
|---|---|
| `name` | globally unique scheduled-job identity |
| `lockAtMostFor` | safety lease if the owner crashes and cannot release |
| `lockAtLeastFor` | minimum hold time to prevent rapid repeated execution |

`lockAtMostFor` must exceed the measured worst-case execution time with safe
headroom. If it expires while the first worker still runs, another replica can
start concurrently.

## Execution Flow

```mermaid
sequenceDiagram
    participant A as Replica A
    participant B as Replica B
    participant DB as Shared lock table

    A->>DB: acquire inventory-reservation-expiry
    DB-->>A: acquired until T+2m
    B->>DB: acquire same lock
    DB-->>B: not acquired; skip method
    A->>A: run bounded expiry
    A->>DB: release/update lock_until
```

## What ShedLock Solves

- duplicate execution of one named scheduler across replicas;
- simple leader-like behavior without a separate coordinator;
- crash recovery after `lockAtMostFor` expires.

## What It Does Not Solve

- duplicate Kafka delivery;
- idempotency of the scheduled business operation;
- stale owner writes after an incorrectly short lease;
- database transactions and rollback;
- outbox publication reliability;
- high-throughput parallel row processing.

## Failure Scenarios

| Scenario | Behavior |
|---|---|
| owner finishes normally | lock is released subject to `lockAtLeastFor` |
| owner process crashes | another replica can acquire after `lockAtMostFor` |
| execution exceeds `lockAtMostFor` | overlap becomes possible; operation must remain idempotent |
| database unavailable | lock cannot be acquired; job should fail visibly |
| method throws | lock release follows library interception; business transaction rolls back independently |

## ShedLock Versus Row Claiming

| ShedLock | Row-level claim |
|---|---|
| one scheduler runs globally | all replicas may process different rows |
| simplest operational model | higher throughput |
| no duplicate candidate scans | duplicate scans are harmless after claim |
| one worker can become bottleneck | work distributes naturally |
| lease duration must cover job | row transaction determines ownership |

For a small POC, ShedLock is the simplest multi-replica scheduler guard. For
high-volume reservation expiry, per-row claims or `SKIP LOCKED` use all replicas
and isolate failures better.

## Testing

1. Start two Spring contexts against one MySQL Testcontainer.
2. Trigger the scheduled method concurrently.
3. Assert one execution enters the protected body.
4. Assert the other skips without modifying business rows.
5. Simulate owner termination and advance beyond `lockAtMostFor`.
6. Assert another replica can acquire.
7. Test an execution exceeding the lease and confirm business idempotency.

## Production Practices

- Use unique stable lock names.
- Use shared database time.
- Set lease values from measured runtime, not guesses.
- Keep work bounded and observable.
- Alert when the job has not completed within its expected interval.
- Keep the underlying operation transactional and idempotent.
- Do not use ShedLock as a general-purpose distributed lock API.

## Official Reference

- [ShedLock project](https://github.com/lukas-krecan/ShedLock)

