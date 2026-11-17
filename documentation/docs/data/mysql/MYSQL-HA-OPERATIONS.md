---
title: MySQL Replication, Availability, And Operations
description: Operate MySQL with binlog/GTID replication, Group Replication/Galera clustering, backup, and monitoring.
difficulty: Advanced
page_type: Guide
status: maintained
prerequisites: [MySQL SQL Isolation Concurrency]
learning_objectives: [Choose a replication and HA topology for a given requirement, Design recoverable backup operations, Diagnose replication lag and failover scenarios]
technologies: [MySQL, Group Replication, Galera]
last_reviewed: "2026-11-17"
scope: generic
owner: docs-data
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# MySQL Replication, Availability, And Operations

## Backup Is Not High Availability

| Capability | Solves | Does not solve alone |
|---|---|---|
| `mysqldump`/logical backup | small databases, portability, selective restore | fast restore of a large dataset |
| Percona XtraBackup (physical/hot backup) | fast, consistent backup of a large InnoDB dataset with minimal locking | zero-RPO failover |
| Async/semi-sync replication | read scaling, a promotable standby | guaranteed zero data loss on primary failure (async) |
| Group Replication / Galera | multi-primary or single-primary clustering with automatic failover | regional disaster recovery by itself |
| application retry/reconciliation | a transient connection failure | an ambiguous commit outcome after a dropped connection |

## Binlog And GTID Replication

The **binary log (binlog)** records every change in `ROW`, `STATEMENT`, or
`MIXED` format; `ROW` is the production default because it replicates exact
row changes rather than re-executing a statement that could behave
differently on a replica (a non-deterministic function, a different
`auto_increment` state).

**GTID** (Global Transaction Identifier) replication assigns every
transaction a unique ID, letting a replica resume from the correct position
after a failover without manually calculating binlog file/offset
coordinates — the modern default over legacy file-and-position replication.

```text
Primary: executes transaction -> writes to binlog -> assigns GTID
Replica: IO thread fetches binlog -> relay log
         SQL/apply thread replays transaction -> advances executed GTID set
```

**Async** replication acknowledges the client's commit before any replica
has applied it — fast, but the primary can fail with committed transactions
the replica never received. **Semi-sync** replication requires at least one
replica to acknowledge receipt (not application) of the transaction before
the primary's commit returns, bounding — but not eliminating — data loss on
failover.

## Group Replication And Galera

Both **MySQL Group Replication** and **Galera Cluster** provide
multi-primary (or enforced single-primary) clustering with automatic
conflict detection and failover, replacing manual promote-a-replica
procedures with a consensus-based membership protocol. They trade
additional write latency (certification across the group) and
operational complexity for continuous availability through node failure —
appropriate when failover time itself, not just data durability, is a
hard requirement.

Managed-service note: Amazon Aurora MySQL is wire-compatible with MySQL but
replaces InnoDB's local redo log and replication with its own distributed
storage layer — its replication/failover characteristics are not identical
to self-managed MySQL replication and should be verified against its own
documentation rather than assumed.

## Backup Strategy

- **Logical** (`mysqldump`, `mysqlpump`) is portable and good for small
  databases or selective restores, but slow to restore at scale and can
  require locking for a fully consistent snapshot without extra flags.
- **Physical/hot** (Percona XtraBackup, MySQL Enterprise Backup) copies
  InnoDB data files directly with minimal locking, restoring far faster for
  large datasets — the production default for sizeable OLTP systems.
- Combine with binlog retention so a physical backup can be replayed
  forward to a precise point in time, not just to the backup's own
  snapshot moment.
- A backup job finishing successfully is not evidence of recoverability —
  only a measured restore, tested against the actual RPO/RTO, is.

## Monitoring

Track `performance_schema` and `sys` schema views for buffer-pool hit
ratio, lock waits, and statement latency; monitor `Seconds_Behind_Source`
(replica lag) and GTID executed-set divergence; alert on binlog disk
growth if a replica or backup consumer falls behind and prevents purge of
old binlog files.

## Incident Runbooks

**Replica lag is growing under write load.** Check whether the replica's
apply thread is single-threaded (legacy) or using multi-threaded replication
(`replica_parallel_workers`), and whether the lag correlates with a specific
large transaction or DDL rather than steady-state throughput; parallel
replication settings on the replica often need to match primary write
concurrency.

**Primary host failed.** Classify host, storage, network, or site failure;
promote the most caught-up replica (by GTID position, not just binlog
file/offset) via the group's own failover mechanism where Group
Replication/Galera is in use, or a tested manual promotion runbook
otherwise; redirect application traffic; reconcile any transactions the old
primary had acknowledged but not yet shipped under async replication.

**Disk usage spiking on a replica.** Check whether binlog or relay-log
retention is being held back by a stalled downstream consumer (another
replica, a CDC connector, a backup process) rather than assuming it is
simple data growth.

**Rolling schema change across a replicated cluster.** Validate the change
is compatible with both old and new application versions reading the same
replicated data mid-rollout (expand/migrate/contract), and confirm DDL
replication mode (online DDL support) will not stall replica apply threads
for the duration of the change.

## Tricky Interview Questions

**Why does semi-sync replication reduce, but not eliminate, data-loss risk
on failover?** It only requires acknowledgment of *receipt* by at least one
replica before the primary's commit returns — not that the replica has
already applied/committed the transaction, and not that more than one
replica has it. A failure that takes out both the primary and that one
acknowledging replica before full application can still lose data.

**A replica is lagging only during specific large batch jobs, not steady
state. What would you check before adding more replicas?** Whether the
replica's apply path is a bottleneck for that specific transaction shape
(a single huge transaction serializes on one apply thread even with
parallel replication enabled for independent transactions) — adding more
replicas does not parallelize the replay of one large transaction on any
single replica.

**Why might a team choose Group Replication over classic async replication
with manual promotion, given the added operational complexity?** When
failover time itself is a hard requirement (automatic detection and
promotion in seconds rather than a human-triggered runbook) and the
business can accept the additional write-path latency from group
certification — a deliberate trade-off, not a strictly better default.

## Official References

- [MySQL replication overview](https://dev.mysql.com/doc/refman/8.0/en/replication.html)
- [MySQL Group Replication](https://dev.mysql.com/doc/refman/8.0/en/group-replication.html)
- [Percona XtraBackup documentation](https://docs.percona.com/percona-xtrabackup/8.0/)

## Recommended Next

Finish with [Spring Integration, Production Scenarios, And Revision](./MYSQL-SPRING-INTERVIEW-REVISION.md).
