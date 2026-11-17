---
title: Db2 HADR, pureScale, And Operations
description: Operate Db2 with HADR disaster recovery, pureScale clustering, RUNSTATS/REORG maintenance, backup, and monitoring.
difficulty: Advanced
page_type: Guide
status: maintained
prerequisites: [Db2 SQL PL Isolation Concurrency]
learning_objectives: [Choose HADR versus pureScale for a given requirement, Keep statistics and storage healthy, Diagnose production Db2 incidents]
technologies: [IBM Db2, HADR, pureScale]
last_reviewed: "2026-11-17"
scope: generic
owner: docs-data
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Db2 HADR, pureScale, And Operations

## HADR Is Not pureScale

| Capability | Solves | Does not solve alone |
|---|---|---|
| Backup (online/offline) | corruption, accidental deletion, point-in-time restore | immediate failover for a live outage |
| HADR | database/site disaster recovery via log shipping to a standby | horizontal write scale-out |
| pureScale | multiple members sharing one database for scale and availability | regional disaster recovery by itself |
| application retry/reconciliation | transient connection loss | an ambiguous commit outcome after a dropped connection |

**HADR** (High Availability Disaster Recovery) ships log records from a
primary database to one or more standby databases, which replay them
continuously. Choose `SYNC`, `NEARSYNC`, or `ASYNC` based on the RPO the
business requires and the latency the standby link can sustain — `SYNC`
guarantees no committed-transaction data loss on failover but adds commit
latency proportional to the link's round-trip time.

**pureScale** runs multiple Db2 members against one shared database (via a
cluster caching facility), giving continued availability if one member fails
and allowing read/write capacity to scale across members. It is an
availability/scale architecture for one database, not a substitute for a
geographically separate standby.

## Statistics And Maintenance

- `RUNSTATS` refreshes the optimizer's table/index statistics; stale
  statistics after a large load or delete is the single most common cause of
  a sudden Db2 plan regression — the same failure class as stale statistics
  on Oracle or Postgres, just triggered by a different command.
- `REORG` reclaims space and restores clustering after heavy
  update/delete/insert churn fragments table or index pages. A table with a
  high percentage of overflow/fragmented pages degrades scan and index
  performance even though `RUNSTATS` looks current.
- `REORGCHK` reports whether a table or index is a `REORG` candidate before
  you commit to a maintenance window.

## Backup And Recovery

Maintain a policy covering full/incremental/delta backups, archival logging
retention (required for roll-forward recovery, see the architecture page),
backup compression and encryption, off-site copies, and scheduled restore
drills. A green backup job is not evidence of recoverability — only a tested
restore, measured against the business's RPO/RTO, is.

## Monitoring

Use `db2pd` (lightweight, non-locking diagnostic snapshots) and the
`MON_GET_*` table functions (`MON_GET_CONNECTION`, `MON_GET_LOCKS`,
`MON_GET_PKG_CACHE_STMT`, `MON_GET_BUFFERPOOL`) for live monitoring without
the overhead of older event-monitor tooling. Track bufferpool hit ratio,
lock-wait time and escalation counts, sort overflows, log-space utilization,
and HADR log-gap (the replay lag between primary and standby) as the core
production signals.

## Incident Runbooks

**Active log is near full.** Determine whether archiving is keeping pace with
the log-generation rate; a stalled archive device or network path to
log-shipping will eventually block new transactions outright. Fix the
archiving path before the log genuinely fills — do not disable logging as a
workaround.

**HADR log gap is growing.** Check standby replay rate versus primary commit
rate and network bandwidth/latency between sites. A growing gap under `SYNC`
mode will itself slow the primary's commits; under `ASYNC` it silently grows
the RPO exposure until it is investigated.

**Sudden plan regression after a bulk load.** Run `RUNSTATS` on the affected
table/indexes first and compare before/after plans; if statistics were
already current, check for lock contention or bufferpool eviction caused by
the load sharing a bufferpool with OLTP traffic.

**pureScale member failure.** Confirm the cluster caching facility
redistributed in-flight work to surviving members and that application
connections failed over; investigate the failed member's root cause
separately from restoring capacity.

## Tricky Interview Questions

**When would you choose pureScale over simply adding a bigger single-member
instance?** When write/read capacity needs to scale beyond one host's limits
or when continued availability through a single member's failure matters
more than the added operational complexity of a shared-data cluster — not
as a default first choice for every workload.

**A restore test was never performed, but backups have run successfully for
a year. What is actually known about recoverability?** Nothing reliable —
job success only proves the backup process ran; only a measured restore
against the real RPO/RTO proves recoverability, and format/version drift or
missing archive logs can make an untested backup chain unrestorable.

**Why does `SYNC` HADR mode add commit latency but `ASYNC` does not?** `SYNC`
requires the standby to acknowledge the log write before the primary
considers the commit durable, so commit latency includes the round trip to
the standby. `ASYNC` lets the primary commit locally and ship the log
afterward, trading a non-zero RPO for lower commit latency.

## Official References

- [Db2 HADR overview](https://www.ibm.com/docs/en/db2/11.5?topic=hadr-high-availability-disaster-recovery)
- [Db2 pureScale overview](https://www.ibm.com/docs/en/db2/11.5?topic=feature-db2-purescale)
- [Db2 RUNSTATS and REORG](https://www.ibm.com/docs/en/db2/11.5?topic=statistics-runstats-command)
- [Db2 monitoring table functions](https://www.ibm.com/docs/en/db2/11.5?topic=views-monitoring)

## Recommended Next

Finish with [Spring Integration, Production Scenarios, And Revision](./DB2-SPRING-INTERVIEW-REVISION.md).
