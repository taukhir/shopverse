---
title: Db2 SQL PL, Isolation Levels, And Concurrency
description: Use Db2's isolation levels correctly, diagnose lock waits and escalation, and write SQL PL procedures safely.
difficulty: Advanced
page_type: Deep Dive
status: maintained
prerequisites: [Db2 Architecture Storage Internals]
learning_objectives: [Choose the correct Db2 isolation level from a consistency requirement, Diagnose lock waits and escalation, Write safe SQL PL procedures]
technologies: [IBM Db2, SQL PL]
last_reviewed: "2026-11-17"
scope: generic
owner: docs-data
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Db2 SQL PL, Isolation Levels, And Concurrency

## Db2 Isolation Levels Are Not ANSI Names

Db2 exposes four isolation levels with their own names and semantics. Mapping
them to the ANSI terms used for Oracle/Postgres/MySQL elsewhere in this site
is a common interview trap:

| Db2 level | Closest ANSI equivalent | Behavior |
|---|---|---|
| **UR** (Uncommitted Read) | weaker than READ UNCOMMITTED | reads uncommitted data from other transactions ("dirty read") |
| **CS** (Cursor Stability) | close to READ COMMITTED | holds a lock only on the row the cursor currently points to |
| **RS** (Read Stability) | close to REPEATABLE READ | locks every row the transaction has read; new rows can still appear (phantom) |
| **RR** (Repeatable Read) | close to SERIALIZABLE | locks the access range, blocking phantoms too |

`CS` is the Db2 default and is appropriate for most OLTP work. `UR` is a
deliberate trade of correctness for throughput (dashboards, approximate
counts) — never use it for a balance check or an inventory decrement.

```sql
SELECT status FROM orders
  WHERE order_id = :id
  WITH RS;
```

## First Working Example: Optimistic Update

```sql
UPDATE orders
   SET status = :nextStatus, row_version = row_version + 1
 WHERE order_id = :id
   AND row_version = :expectedVersion;
```

Check the update count returned by the driver. Zero rows means either the
order does not exist or another transaction already advanced it — the caller
must distinguish those cases from a query, not assume success.

## Locking And Escalation

Db2 takes row locks for normal OLTP access, but will **escalate** to a
table-level lock when a single transaction accumulates more row locks than
`LOCKLIST`/`MAXLOCKS` allow for one application. Escalation is a capacity
signal, not a bug: a transaction touching far more rows than expected (a
missing `WHERE` clause, an unbounded batch) is the usual root cause, and the
fix is to shrink the transaction's working set, not to blindly raise
`LOCKLIST`.

Deadlocks are detected by a background deadlock detector (`dlchktime`
interval) rather than immediately; one of the two transactions is rolled back
with `SQL0911N` reason code `2`. Keep a consistent lock-acquisition order
across code paths to avoid them recurring under load.

## SQL PL

SQL PL (the Db2 procedural SQL dialect, part of the SQL/PSM standard) is used
for set-oriented work that should live close to the data:

```sql
CREATE OR REPLACE PROCEDURE archive_expired_orders(IN cutoff DATE)
LANGUAGE SQL
BEGIN
  UPDATE orders
     SET archived = 1
   WHERE created_at < cutoff
     AND status = 'COMPLETED';
END
```

Favor set-based `UPDATE`/`MERGE` statements over row-by-row cursors inside SQL
PL; a `FOR` loop that issues one statement per row inside a procedure defeats
the optimizer's ability to batch work, the same anti-pattern as row-by-row
PL/SQL on Oracle.

## Boundaries And Trade-Offs

- `RR` gives the strongest consistency but holds more locks for longer,
  increasing contention under write-heavy concurrent load.
- `UR` removes blocking entirely but can read values that are later rolled
  back — acceptable for approximate reporting, never for a financial or
  inventory decision.
- Lock escalation thresholds are a shared-resource budget across every
  concurrent application on the database, not a per-transaction setting to
  raise freely.

## Failure Modes, Edge Cases, And Common Mistakes

- Using `UR` for an inventory check-then-decrement is a classic lost-update
  bug: the read can observe stock that another, still-uncommitted transaction
  is about to roll back.
- Catching `SQL0911N` and retrying blindly without checking the reason code
  conflates a deadlock (safe to retry) with a lock-timeout (may indicate a
  stuck blocker that retrying will not fix).
- Running a large unbounded `DELETE`/`UPDATE` without a `WHERE` clause or
  batching will escalate to a table lock and can stall every other writer on
  that table.

## Tricky Interview Questions

**A report needs an approximate row count from a busy OLTP table without
blocking writers. Which isolation level, and what do you give up?** `UR` —
it avoids taking or waiting on locks, at the cost of possibly counting rows
that are later rolled back. State that trade-off explicitly rather than
treating it as "a faster SELECT".

**A transaction that should touch 50 rows is escalating to a table lock.
What do you check first, and why is raising `LOCKLIST` not the first move?**
Check whether the transaction's predicate is actually matching far more rows
than expected (missing index, wrong `WHERE` clause, unbounded batch size).
Raising `LOCKLIST` only postpones the same problem at a higher row count and
consumes shared instance memory other applications also depend on.

**Why does `RS` still allow phantom rows while `RR` does not?** `RS` locks
only the rows already read by the transaction; a new row inserted by another
transaction that matches the same predicate is not locked and can appear on
a re-read. `RR` locks the access range itself (via next-key-style locking on
the index), so no row matching that range can be inserted until the
transaction completes.

## Official References

- [Db2 isolation levels](https://www.ibm.com/docs/en/db2/11.5?topic=concepts-isolation-levels)
- [Db2 locking](https://www.ibm.com/docs/en/db2/11.5?topic=concepts-locking)
- [Db2 SQL PL language reference](https://www.ibm.com/docs/en/db2/11.5?topic=overview-sql-procedural-language)

## Recommended Next

Continue with [HADR, pureScale, And Operations](./DB2-HA-OPERATIONS.md).
