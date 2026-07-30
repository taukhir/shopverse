---
title: Database Production Mastery
description: Lead and architect roadmap for relational internals, transactions, query diagnosis, ORM behavior, resilience, Cassandra, Oracle, and database incidents.
difficulty: Advanced
page_type: Learning Path
status: maintained
prerequisites: [SQL, transactions, Spring Data fundamentals]
technologies: [PostgreSQL, Oracle, Cassandra, Hibernate, HikariCP, Spring Data]
last_reviewed: "2026-07-28"
scope: generic
owner: docs-data
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Database Production Mastery

<DocLabels items={[
  {label: 'Architect path', tone: 'advanced'},
  {label: 'Production diagnosis', tone: 'production'},
  {label: 'Interview mastery', tone: 'interview'},
]} />

This is the umbrella for database preparation. It does not repeat every engine manual.
It connects the concepts, implementation guides, evidence, failure modes, and interview
scenarios a lead engineer should be able to defend.

## The Runtime Mental Model

```text
request or event
  -> application concurrency limit
  -> connection-pool acquisition
  -> JDBC driver and network
  -> database session and transaction
  -> parser and optimizer
  -> execution plan
  -> buffer/page cache, WAL/redo and storage
  -> locks/MVCC/replication
  -> commit acknowledgement
```

A slow endpoint may be waiting at any stage. "The database is slow" is not a diagnosis.
Correlate application latency with pool wait, database wait events, plans, locks, resource
pressure, replication state, and the deployment timeline.

## Coverage Map

| Area | Required mastery | Primary guide |
|---|---|---|
| relational internals | pages, buffer cache, WAL/redo, parsing, statistics, cardinality, join algorithms, plans | [Database Engine Internals](./DATABASE-ENGINE-INTERNALS.md) |
| modeling and SQL | normalization, denormalization, constraints, access paths, pagination | [Relational Modeling And Query Performance](./RELATIONAL-MODELING-QUERY-PERFORMANCE.md) |
| indexes | B-tree/hash/specialized indexes, composite order, covering, partial, expression, selectivity, write cost | [Indexes And Query Plans](./database-selection/INDEXES-QUERY-PLANS.md) |
| query diagnosis | baselines, plans, row-estimate errors, joins, sorts, spills, N+1, safe verification | [Database Query Optimization](./database-selection/DATABASE-QUERY-OPTIMIZATION.md) |
| transactions | ACID, isolation anomalies, MVCC, locking, deadlocks, retries, timeouts, boundaries | [Spring Transactions](../spring/SPRING-TRANSACTIONS.md) |
| JPA and Hibernate | persistence context, dirty checking, flush, fetching, batching, locking, pagination, caches | [Spring Data JPA Architect Path](../spring/SPRING-DATA-JPA.md) |
| pools | Hikari sizing, acquisition waits, leaks, lifetime, failure recovery, metrics | [Connection Pools And Database Failover](./database-selection/DATABASE-CONNECTION-POOL-FAILOVER.md) |
| Oracle | architecture, SQL/optimizer, PL/SQL, locking, RMAN, Data Guard, RAC | [Oracle Database Architect Path](./ORACLE-DATABASE-ARCHITECT-PATH.md) |
| Cassandra | partition-first modeling, consistency, storage, tombstones, repair, capacity, incidents | [Cassandra Architect Path](./CASSANDRA-ARCHITECT-PATH.md) |
| scaling and DR | replicas, lag, sharding, failover, fencing, RPO/RTO, backups, restore | [Replication, Backup, And Recovery](./database-selection/DATABASE-REPLICATION-BACKUP-RECOVERY.md) |
| migrations | expand/contract, compatibility, backfills, locks, rollback boundaries | [Database Migrations And Operations](./database-selection/DATABASE-MIGRATIONS-OPERATIONS.md) |
| incidents | CPU, I/O, pools, locks, memory, lag, overload, evidence and containment | [Database Load Incident Runbook](./database-selection/DATABASE-LOAD-INCIDENT-RUNBOOK.md) |

## What You Must Explain, Not Memorize

### Optimizer and plan behavior

- Why stale statistics or correlated predicates cause cardinality errors.
- Why a valid index can still be more expensive than a scan.
- How nested-loop, hash, and merge joins trade startup cost, memory, ordering, and row count.
- Why a sort/hash spill changes latency abruptly rather than gradually.
- How bind values, prepared plans, and data skew can make one plan unsafe for all inputs.
- Why a faster plan in a small test is not proof for production distributions.

### Index design

- Start from a high-value query and its predicates, joins, ordering, and projected columns.
- Match composite leading columns to real access patterns; do not apply a universal
  "most selective first" slogan without testing equality, range, and order requirements.
- Account for inserts, updates, vacuum/maintenance, storage, cache pressure, and deployment time.
- Verify with representative plans and workload metrics, then remove redundant indexes safely.

### Transaction boundaries

- Keep a transaction around one consistency invariant, not an entire remote workflow.
- Never assume `@Transactional` fixes dual writes, external API effects, or self-invocation.
- Use optimistic locking for detectable write conflicts, pessimistic locking when blocking is
  justified, and bounded deadlock retries only for operations proven safe to repeat.
- Treat long transactions as concurrency and recovery risks: they retain locks/versions,
  occupy connections, enlarge rollback work, and can delay cleanup.

### Production evidence

For every change, capture a before/after comparison:

```text
traffic and query mix
plan plus actual rows/timing
pool active/idle/pending/acquisition time
database CPU, I/O and wait classes
lock/deadlock and transaction age
replication lag and commit latency
p50/p95/p99 plus errors/timeouts
```

## Failure-Scenario Curriculum

Practise these as timed incident explanations:

1. Pool pending rises while database CPU stays low.
2. Database CPU reaches 95% after a deployment.
3. One query becomes slow only for one tenant or bind value.
4. A new index improves reads but collapses write throughput.
5. A transaction deadlocks intermittently during peak load.
6. A consumer holds a database connection while waiting on an HTTP dependency.
7. Primary fails after commit was sent but before the client receives the result.
8. Read replica returns stale state immediately after a successful write.
9. Migration adds a constraint and blocks production writes.
10. Cassandra tombstones or a hot partition create tail-latency spikes.
11. Backups report success, but the restore misses the required recovery point.
12. Failover succeeds technically, but stale clients keep writing to the former primary.

For each scenario answer seven questions: what happened internally, why the design was
selected, what can fail, how to diagnose it, how to contain it, how to scale/secure it,
and what evidence proves recovery.

## Completion Standard

You are ready for a lead/architect interview when you can:

- read an execution plan and challenge row estimates rather than only spot scans;
- separate pool saturation, lock waits, I/O pressure, CPU saturation, and slow SQL;
- choose transaction and consistency boundaries and explain their failure windows;
- prevent ORM convenience from hiding N+1 queries, cartesian fetches, or unsafe pagination;
- size concurrency from database capacity rather than HTTP-thread count;
- distinguish replication, high availability, backup, and disaster recovery;
- design idempotent retry and reconciliation for ambiguous commits;
- defend relational, distributed SQL, Cassandra, cache, and search-engine choices;
- lead a safe database incident without deleting evidence or amplifying load.

## Recommended Sequence

1. Engine internals and relational modeling.
2. Indexes, plans, and query diagnosis.
3. Transactions, concurrency, and Spring boundaries.
4. JPA/Hibernate runtime behavior.
5. Pools, overload, and failover.
6. Oracle and Cassandra engine paths.
7. Replication, backup, migrations, and disaster recovery.
8. Revision questions and incident drills.

Finish with [Database Revision Sheet](./DATABASE-REVISION-SHEET.md) and
[Database Interview Exercises](./database-selection/DATABASE-INTERVIEW-EXERCISES.md).

## Recommended Next

Use the [Database Revision Sheet](./DATABASE-REVISION-SHEET.md), then complete a
timed incident drill from [Database Interview Exercises](./database-selection/DATABASE-INTERVIEW-EXERCISES.md).

## Official References

- [PostgreSQL performance tips](https://www.postgresql.org/docs/current/performance-tips.html)
- [MySQL Reference Manual](https://dev.mysql.com/doc/refman/8.4/en/)
