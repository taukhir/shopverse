---
title: Database Locking And Work Claims
---

# Database Locking And Work Claims

This page compares database worker-claim algorithms. Entity-level optimistic
and pessimistic locking internals remain in
[JPA Transactions, Locking And Concurrency](../../spring/jpa/JPA-TRANSACTIONS-LOCKING.md).

Back to [Locking And Work Ownership](LOCKING-AND-WORK-OWNERSHIP.md).

## Corrected Comparison

| Approach | Correct when completed properly? | Contention behavior | Best fit |
|---|---:|---|---|
| per-row conditional update | yes | duplicate candidates cause failed claims, not duplicate ownership | simple/low-volume workers and failure isolation |
| plain `SELECT ... FOR UPDATE` | yes | competing workers wait | short per-row claim, low contention |
| `FOR UPDATE SKIP LOCKED` | yes | workers skip locked rows | parallel MySQL/PostgreSQL pollers |
| PostgreSQL CTE + `UPDATE ... RETURNING` | yes | batch claim and rows returned in one statement | high-throughput PostgreSQL outbox |
| MySQL `SKIP LOCKED` + bulk update | yes | batch selection without waiting | high-throughput Shopverse-compatible outbox target |

No approach provides end-to-end exactly-once processing. Crash after broker
acceptance and before database finalization can still cause republishing.

## Per-Row Conditional Claim

```sql
UPDATE outbox_events
SET status = 'PROCESSING',
    claimed_by = ?,
    claimed_at = CURRENT_TIMESTAMP
WHERE id = ?
  AND status = 'PENDING';
```

JDBC/Spring Data returns the affected-row count:

```text
1 -> this transaction owns the row
0 -> another worker changed it or it is no longer eligible
```

Strengths:

- portable and simple;
- short transaction;
- excellent one-record failure isolation;
- suitable for a low/medium-volume POC.

Costs:

- workers may scan the same IDs;
- one claim update per row;
- contention creates extra failed claim attempts.

This is the target Shopverse reservation-expiry choice because every row also
changes Inventory stock and creates an Outbox record.

## Plain Pessimistic Claim

```sql
BEGIN;

SELECT *
FROM outbox_events
WHERE id = ?
FOR UPDATE;

UPDATE outbox_events
SET status = 'PROCESSING',
    claimed_at = CURRENT_TIMESTAMP
WHERE id = ?
  AND status = 'PENDING';

COMMIT;
```

Another worker waits for the row lock, then observes the committed status and
skips. The status must change before commit; a lock without a durable claim
only delays the next worker.

Shopverse currently uses this approach per Outbox event through
`@Lock(PESSIMISTIC_WRITE)`. It commits the claim before publishing to Kafka,
so no database lock is held during network I/O.

## `FOR UPDATE SKIP LOCKED`

```sql
SELECT id, topic, message_key, payload
FROM outbox_events
WHERE status = 'PENDING'
  AND next_retry_at <= CURRENT_TIMESTAMP
ORDER BY created_at, id
LIMIT 100
FOR UPDATE SKIP LOCKED;
```

Rows locked by another transaction are omitted instead of making the worker
wait. Results are intentionally queue-like and not a consistent analytical
view.

Inside the same short transaction, update every selected row to `PROCESSING`.
Do not commit after `SELECT` and before recording ownership.

Requirements:

- InnoDB/PostgreSQL engine support;
- indexed status/retry/order predicate;
- bounded batch;
- stale committed-claim recovery;
- idempotent consumers;
- metrics for skipped/claimed/stale work.

Potential issues:

- repeatedly locked rows can starve;
- one large transaction increases lock and rollback scope;
- application/JPA support may require native SQL or JDBC;
- processing all claimed rows in one transaction couples their failures.

## PostgreSQL Batch Claim With `RETURNING`

```sql
WITH candidates AS (
    SELECT id
    FROM outbox_events
    WHERE status = 'PENDING'
      AND next_retry_at <= NOW()
    ORDER BY created_at, id
    LIMIT :batchSize
    FOR UPDATE SKIP LOCKED
)
UPDATE outbox_events event
SET status = 'PROCESSING',
    claimed_by = :instanceId,
    claimed_at = NOW()
FROM candidates
WHERE event.id = candidates.id
RETURNING event.*;
```

PostgreSQL can select, lock, update, and return the claimed rows in one
statement. It is efficient, but not portable to Shopverse's MySQL 8.4.

## MySQL Batch-Claim Equivalent

MySQL 8.4 supports `SKIP LOCKED` but not PostgreSQL-style
`UPDATE ... RETURNING`.

`next_retry_at`, `claimed_by`, and `claim_token` in the following example are
target high-throughput schema fields. Current Shopverse Outbox rows have
`status` and `claimed_at` and use a per-row claim.

Use one short transaction:

```sql
BEGIN;

SELECT id, topic, message_key, payload
FROM outbox_events
WHERE status = 'PENDING'
  AND next_retry_at <= CURRENT_TIMESTAMP
ORDER BY created_at, id
LIMIT :batchSize
FOR UPDATE SKIP LOCKED;

UPDATE outbox_events
SET status = 'PROCESSING',
    claimed_by = :instanceId,
    claim_token = :claimToken,
    claimed_at = CURRENT_TIMESTAMP
WHERE id IN (:selectedIds)
  AND status = 'PENDING';

COMMIT;
```

The application retains immutable message snapshots from the locked `SELECT`,
or fetches rows afterward by unique `claim_token`. Publish only after the claim
transaction commits.

## Publish And Finalize

```text
short claim transaction
  -> commit PROCESSING

no database transaction
  -> publish to Kafka

short finalization transaction
  -> PUBLISHED or retry/failure state
```

Never hold a database row lock while waiting for a broker acknowledgement.

## Crash Windows

| Crash point | Durable state | Recovery |
|---|---|---|
| before claim commit | `PENDING` | another worker claims normally |
| after claim, before publish | `PROCESSING` | stale timeout returns row to retryable state |
| after Kafka ack, before `PUBLISHED` | Kafka has event, DB says `PROCESSING` | stale recovery republishes; consumer must deduplicate |
| during finalization | broker outcome may be uncertain | reconcile/retry idempotently |

Outbox delivery remains at least once.

## Batch Failure Isolation

Two designs trade throughput for isolation:

```text
claim and process one row per transaction:
  lower throughput, excellent isolation

claim batch, commit, process each claimed row separately:
  high claim throughput, requires claimed_at/claimed_by and stale recovery
```

Do not publish an entire claimed batch in one database transaction. Remote
latency would extend locks, and one failure could roll back unrelated rows.

## Shopverse Recommendation

| Workload | Recommendation |
|---|---|
| reservation expiry | conditional per-row claim plus `REQUIRES_NEW` worker transaction |
| current POC Outbox | retain short per-row pessimistic claim |
| future high-throughput MySQL Outbox | `SKIP LOCKED` batch claim with claim token |
| PostgreSQL Outbox | CTE claim with `UPDATE ... RETURNING` |

Detailed Shopverse examples:

- [Four reservations and two schedulers](../problems/runtime/TWO-SCHEDULER-RESERVATION-EXAMPLE.md)
- [Outbox short transactions and stale claims](../problems/OUTBOX-RUNTIME-PROBLEMS.md)

## Related Canonical Guides

- [JPA optimistic and pessimistic locking](../../spring/jpa/JPA-TRANSACTIONS-LOCKING.md)
- [Transactional Outbox](../OUTBOX-PATTERN.md)
- [Inbox and idempotent consumers](../INBOX-PATTERN.md)
- [Scheduler Locking With ShedLock](SCHEDULER-LOCKING-SHEDLOCK.md)
