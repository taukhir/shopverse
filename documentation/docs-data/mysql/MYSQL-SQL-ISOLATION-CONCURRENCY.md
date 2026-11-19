---
title: MySQL SQL, Isolation Levels, And Concurrency
description: Reason about InnoDB's REPEATABLE READ default, gap and next-key locking, deadlocks, and index design for concurrency.
difficulty: Advanced
page_type: Deep Dive
status: maintained
prerequisites: [MySQL Architecture Storage Internals]
learning_objectives: [Explain what REPEATABLE READ actually prevents in InnoDB, Diagnose gap-lock and deadlock behavior, Design indexes for concurrent OLTP access]
technologies: [MySQL, InnoDB]
last_reviewed: "2026-11-17"
scope: generic
owner: docs-data
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# MySQL SQL, Isolation Levels, And Concurrency

## REPEATABLE READ Is The Default — And It Is Not Oracle's READ COMMITTED

InnoDB's default isolation level is `REPEATABLE READ`, unlike Oracle and
Postgres, which default to `READ COMMITTED`. This is a frequent interview
trap: the same isolation-level *name* exists on every engine on this site,
but the *default* differs, and InnoDB's `REPEATABLE READ` additionally uses
**next-key locking** (a record lock plus a gap lock on the range before it)
on locking reads, which prevents phantom rows in a way plain MVCC snapshots
do not by themselves.

```sql
SELECT status FROM orders
  WHERE customer_id = :id
  FOR UPDATE;
```

Under `REPEATABLE READ`, this statement locks not just matching rows but
the **gap** between index entries, so a concurrent `INSERT` that would match
the same predicate is blocked until the transaction commits — this is what
"prevents phantoms" means concretely, not an abstract guarantee.

## First Working Example: Optimistic Update

```sql
UPDATE orders
   SET status = ?, row_version = row_version + 1
 WHERE order_id = ?
   AND row_version = ?;
```

Check the affected-row count from the driver. Zero rows means either the
order does not exist or another transaction already advanced it — exactly
the same discipline required on Oracle, Postgres, and Db2, implemented here
through InnoDB's row-level locking rather than a database-specific keyword.

## Gap Locks And Next-Key Locking

| Lock type | What it covers | Where it applies |
|---|---|---|
| record lock | an existing index record | equality match on a unique/indexed column |
| gap lock | the open interval between two index records | prevents phantom inserts into a scanned range |
| next-key lock | a record lock plus the gap before it | InnoDB's default locking read behavior at `REPEATABLE READ` |

Gap locks are a common source of unexpected blocking in high-concurrency
insert workloads (e.g., many concurrent order-number allocations within the
same range): two transactions inserting different, non-conflicting values
can still block each other if their insert points fall in the same locked
gap. `READ COMMITTED` removes gap locking for most statements at the cost
of losing the phantom-read protection `REPEATABLE READ` provides.

## Deadlocks

InnoDB detects deadlocks immediately (unlike Db2's periodic detector) and
rolls back the transaction that did the least work, returning error 1213
(`ER_LOCK_DEADLOCK`) to that session. A deadlock is retry-safe by
definition — the rolled-back transaction made no committed change — but
recurring deadlocks under load indicate inconsistent lock-acquisition order
across code paths, not a transient condition to silently retry forever.

## Index Design For Concurrency

A query that cannot use a selective index forces a full scan under a
locking read, which can take next-key locks across far more of the table
than the business logic intends — turning what looks like a single-row
update into a wide, contention-prone range lock. Composite index column
order should match the equality predicates used by the hot write path, not
just the read path, when that write path runs under `REPEATABLE READ`.

## Boundaries And Trade-Offs

- `REPEATABLE READ` + next-key locking gives strong consistency on locking
  reads but increases the risk of gap-lock contention on hot insert ranges.
- Switching to `READ COMMITTED` removes most gap locking (improving
  concurrent insert throughput) but reintroduces phantom-row exposure for
  any logic that depends on a stable result set across re-reads within the
  same transaction.
- MVCC snapshot reads (plain, non-locking `SELECT`) never block writers and
  never get blocked by them, regardless of isolation level — only locking
  reads (`FOR UPDATE`/`FOR SHARE`) and writes take the locks described above.

## Failure Modes, Edge Cases, And Common Mistakes

- Assuming InnoDB's `READ COMMITTED` behaves identically to Oracle's: it
  does for statement-level read consistency, but InnoDB's default is
  `REPEATABLE READ`, so code written and tested on Oracle/Postgres defaults
  can behave differently under concurrent load if deployed against MySQL's
  default isolation level without re-verifying the assumption.
- Treating every 1213 deadlock error the same as application-level
  contention worth investigating: isolated deadlocks under normal load are
  expected and retry-safe; a rising deadlock rate after a deploy is a lock
  ordering regression.
- Using a long-running `REPEATABLE READ` transaction for a report query:
  its open snapshot holds back InnoDB's purge of old undo/history-list
  entries, which can bloat the undo tablespace under sustained write load.

## Tricky Interview Questions

**Two sessions insert different order IDs that fall in the same index gap
under `REPEATABLE READ`. Why can one block the other even though they do
not touch the same row?** InnoDB's next-key locking takes a gap lock across
the open interval a locking read or constrained insert scans, not just a
lock on existing rows; two inserts landing in the same locked gap contend
for that gap lock even with no row in common.

**Why is InnoDB's default isolation level a deliberate choice rather than
"the safe default every engine uses"?** `REPEATABLE READ` with next-key
locking gives InnoDB phantom-row protection without full serialization cost,
which fits MySQL's historically statement-based (and later row-based)
replication model well; Oracle/Postgres instead default to `READ COMMITTED`
and offer `SERIALIZABLE` as an explicit opt-in for the same guarantee.

**A long-running analytics transaction is slowing down an OLTP workload that
never touches the same rows. How, under InnoDB's architecture?** The
long-running transaction's open MVCC snapshot prevents InnoDB's purge
process from discarding old undo-log entries those rows need, growing the
undo tablespace and the history list, which increases read/write overhead
database-wide, not just on the rows the analytics query reads.

## Official References

- [InnoDB transaction model and locking](https://dev.mysql.com/doc/refman/8.0/en/innodb-locking.html)
- [InnoDB transaction isolation levels](https://dev.mysql.com/doc/refman/8.0/en/innodb-transaction-isolation-levels.html)
- [InnoDB next-key locking](https://dev.mysql.com/doc/refman/8.0/en/innodb-locks-set.html)

## Recommended Next

Continue with [Replication, Availability, And Operations](./MYSQL-HA-OPERATIONS.md).
