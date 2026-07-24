---
title: Oracle Partitioning, Availability, Recovery, And Operations
description: Operate Oracle with partitioning, materialized views, RMAN, Data Guard, RAC, security, upgrades, capacity, and incident runbooks.
difficulty: Advanced
page_type: Production Guide
status: Generic
prerequisites: [Oracle SQL Optimizer And Concurrency]
learning_objectives: [Choose HA and DR controls, Design recoverable operations, Diagnose production capacity and failure scenarios]
technologies: [Oracle Database, RMAN, Data Guard, RAC]
last_reviewed: "2026-07-23"
---

# Oracle Partitioning, Availability, Recovery, And Operations

## Partitioning And Materialized Views

Range partition time-series data, list partition bounded categories, hash partition to
distribute evenly, and compose when requirements justify it. Benefits require partition
pruning, manageable local/global indexes, and lifecycle operations such as exchange,
truncate, and drop. Partitioning does not fix an unselective query automatically.

Materialized views precompute expensive joins/aggregations. Define refresh mode and
freshness contract: complete versus fast refresh, on commit versus scheduled, rewrite
eligibility, log overhead, and behavior after failures.

## Backup Is Not High Availability

| Capability | Solves | Does not solve alone |
|---|---|---|
| RMAN backup | corruption/deletion/media recovery | immediate service continuity |
| ARCHIVELOG + PITR | restore to a chosen time/SCN | zero-RPO synchronous failover |
| Data Guard | database/site disaster recovery | application traffic routing and reconciliation |
| RAC | instance availability and scale across cluster nodes | regional disaster recovery |
| application retry | transient connection failure | ambiguous commit or non-idempotent side effects |

Define RPO and RTO before selecting protection. Test restore and failover; a successful
backup job is not proof of recoverability.

## RMAN And Recovery

Maintain a recoverability policy for full/incremental backups, archived redo, control
file/SPFILE backups, encryption, retention, off-site copies, validation, catalog/control-
file metadata, and restore drills. Test whole-database, tablespace/datafile, and point-in-
time recovery procedures. Record actual restore throughput and dependency ordering.

## Data Guard And RAC

Data Guard ships and applies redo to standby databases. Choose protection mode and
transport based on latency and RPO, monitor transport/apply lag, define observer/broker
behavior, and rehearse switchover, failover, and reinstate/failback.

RAC runs instances against a shared database. It improves instance availability and may
scale suitable workloads, but introduces interconnect/cache-fusion behavior, service
placement, affinity, and connection failover considerations. It is not a substitute for
a remote standby.

## Security

- grant least privilege to roles; avoid application ownership through powerful shared users;
- use network encryption and validate server identity;
- rotate credentials through a secret manager and pool refresh strategy;
- separate schema migration, runtime, reporting, and operations identities;
- audit privileged and sensitive access with retention and alert ownership;
- protect backups, exports, logs, and non-production copies; mask sensitive data;
- use row-level controls or encryption only with a clear threat model and key lifecycle.

## Capacity And Observability

Track database time by wait class, active sessions, CPU, IOPS/latency, redo bytes and
log-file-sync time, buffer gets, parses, enqueue waits, temp/undo usage, tablespace
headroom, archive destination space, replication lag, connection count, and top SQL.
AWR/ASH licensing and availability must be confirmed; use supported alternatives where
necessary.

Connection budget:

```text
safe application connections
  <= database process/session budget
     - admin/monitoring/migration reserve
     - non-application consumers
     - failure and deployment headroom
```

Divide the remainder across pods and workloads. More pool connections can worsen queueing,
CPU contention, and failover storms.

## Incident Runbooks

**Tablespace near full:** identify growth object and reason, preserve headroom, extend/add
capacity safely, fix retention/index/temp/undo cause, forecast recurrence.

**Archive destination full:** preserve evidence, restore archiving capacity, verify backup/
shipping consumers, never delete required redo blindly, validate standby and recovery chain.

**Primary unavailable:** classify instance, host, storage, network, or site failure; invoke
the approved recovery/failover path; fence the old primary; validate application service,
data loss, sequences/jobs, and reconciliation.

**Rolling change:** validate client/server compatibility, backup and restore readiness,
standby strategy, migration expand/contract sequence, service drain, rollback boundary,
and post-change query plans.

## Interview Questions

**RAC versus Data Guard?** RAC primarily protects instance availability against a shared
database; Data Guard maintains standby databases for database/site DR. Many critical
systems use both for different failure domains.

**What is the most important backup metric?** Successful, measured restoration against
the required RPO/RTO—not backup-job count.

**Disk is 90%; what do you do?** Forecast time-to-exhaustion, locate object/archive/temp/
undo growth, protect recovery space, add controlled capacity, fix retention/root cause,
and validate backup/standby implications.

## Official References

- [Oracle Database High Availability overview](https://docs.oracle.com/en/database/oracle/oracle-database/23/haovw/)
- [Oracle Data Guard concepts](https://docs.oracle.com/en/database/oracle/oracle-database/23/sbydb/)
- [Oracle RAC administration](https://docs.oracle.com/en/database/oracle/oracle-database/23/racad/)
- [Oracle Database Security Guide](https://docs.oracle.com/en/database/oracle/oracle-database/23/dbseg/)

## Recommended Next

Finish with [Spring Integration, Production Scenarios, Labs, And Revision](./ORACLE-SPRING-INTERVIEW-REVISION.md).

