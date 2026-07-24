---
title: Oracle SQL, PL/SQL, Optimizer, And Concurrency
description: Design SQL and PL/SQL, interpret execution plans, maintain statistics, and reason about Oracle transactions and locks.
difficulty: Advanced
page_type: Deep Dive
status: Generic
prerequisites: [Oracle Architecture Storage Internals]
learning_objectives: [Tune SQL using measured plans, Design safe transactions, Use PL/SQL and indexing deliberately]
technologies: [Oracle SQL, PL/SQL]
last_reviewed: "2026-07-23"
---

# Oracle SQL, PL/SQL, Optimizer, And Concurrency

## SQL Design Essentials

Use explicit columns, deterministic ordering, bind values, bounded result sets, and
set-based operations. Understand `MERGE`, analytic functions, common table expressions,
sequences/identity columns, date/time semantics, and `NULL` three-valued logic.

```sql
select order_id, customer_id, total_amount,
       sum(total_amount) over (
         partition by customer_id order by created_at
         rows between unbounded preceding and current row
       ) as running_total
from orders
where customer_id = :customer_id
  and created_at >= :from_time
order by created_at, order_id;
```

## Index Design

B-tree indexes fit selective equality/range access. Column order should reflect leading
predicates and required ordering, not a slogan about cardinality. Bitmap indexes can
fit low-concurrency analytical workloads but are risky for hot OLTP updates. Function-
based indexes require predicates matching the expression. Invisible indexes enable
controlled evaluation. Every index increases writes, redo, space, statistics, and
maintenance cost.

Avoid hiding an indexed column:

```sql
-- harder to use a normal index on created_at
where trunc(created_at) = :day

-- sargable half-open range
where created_at >= :day and created_at < :day + interval '1' day
```

## Cost-Based Optimizer

The optimizer estimates cardinalities and costs candidate access paths and join orders.
Its decisions depend on object/system statistics, histograms, bind values, transformations,
and optimizer settings. An estimate error early in a plan can multiply downstream.

Use `DBMS_XPLAN.DISPLAY_CURSOR` with runtime statistics. Compare estimated rows (`E-Rows`)
to actual rows (`A-Rows`), starts, buffers, reads, memory/temp, and predicate placement.
`EXPLAIN PLAN` alone may not show the plan and values used by the real execution.

```sql
select /*+ gather_plan_statistics */ ...;

select *
from table(dbms_xplan.display_cursor(null, null, 'ALLSTATS LAST +PEEKED_BINDS'));
```

Typical root causes: stale/missing statistics, skew without useful histograms, implicit
conversion, non-sargable predicates, correlation the optimizer cannot estimate, bind
sensitivity, excessive row-by-row calls, and plan regression.

## Transactions And Isolation

Oracle's default `READ COMMITTED` gives statement-level read consistency. `SERIALIZABLE`
uses transaction-level consistency and can reject conflicting writes. `READ ONLY` is
useful for consistent reporting. Oracle readers normally do not block writers, but
writers can block writers.

```sql
select status from orders where order_id = :id for update nowait;
```

Use `NOWAIT` when waiting is invalid, `WAIT n` for bounded waiting, and `SKIP LOCKED`
for carefully designed work-claim queues. Keep lock order consistent, transactions
short, calls to remote systems outside locks, and retry only errors proven transient.

Optimistic concurrency can use a version column:

```sql
update orders
set status = :next_status, version = version + 1
where order_id = :id and version = :expected_version;
```

Zero updated rows means conflict or absence; the application must distinguish and
apply a business retry/response policy.

## PL/SQL

Use packages to group stable database-side APIs; procedures/functions for set-oriented
work close to data; exceptions with intentional mapping; and bulk operations to avoid
SQL/PL-SQL context switching.

```sql
forall i in indices of l_order_ids save exceptions
  update orders set archived = 1 where order_id = l_order_ids(i);
```

Know `%TYPE`, `%ROWTYPE`, cursors, records, collections, `BULK COLLECT`, `FORALL`,
autonomous-transaction risks, definer versus invoker rights, and edition/deployment
compatibility. Avoid committing inside reusable procedures unless the API explicitly
owns the transaction.

## Production Scenarios

| Symptom | Evidence first | Likely action |
|---|---|---|
| sudden plan regression | SQL ID, plan hash, A/E rows, stats changes | correct stats/query/index; stabilize only with understood baseline/profile |
| sessions blocked | blocker tree, SQL, lock mode, transaction age | fix transaction scope/order; terminate only with impact analysis |
| high hard parses | parse metrics, child cursors, literals | bind correctly and find non-share reasons |
| temporary-space spike | active plan operations and work areas | reduce rows, fix plan, then validate memory/temp capacity |
| deadlocks | trace graph and statement order | make lock ordering consistent and transaction smaller |

## Interview Questions

**Index exists but Oracle scans the table—why?** A scan may be cheaper; the predicate
may not use the leading index columns; statistics/selectivity may be wrong; conversion
or a function may prevent access; or most rows are required.

**Does Oracle READ COMMITTED prevent lost updates?** Not automatically. Use locking,
version checks, atomic conditional updates, or business serialization.

**Why are bind variables not universally sufficient?** They reduce parsing, but skewed
values can need different plans; bind-aware behavior and workload evidence matter.

## Official References

- [Oracle SQL tuning overview](https://docs.oracle.com/en/database/oracle/oracle-database/23/tgsql/introduction-to-sql-tuning.html)
- [Oracle PL/SQL Language Reference](https://docs.oracle.com/en/database/oracle/oracle-database/23/lnpls/)
- [Oracle data concurrency and consistency](https://docs.oracle.com/en/database/oracle/oracle-database/23/cncpt/data-concurrency-and-consistency.html)

## Recommended Next

Continue with [Partitioning, Availability, Recovery, Security, And Operations](./ORACLE-HA-OPERATIONS.md).

