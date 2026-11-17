---
title: Db2 Architecture, Storage, And Logging Internals
description: Trace Db2 instances, bufferpools, tablespaces, table/index page organization, and active/archive logging.
difficulty: Advanced
page_type: Deep Dive
status: maintained
prerequisites: [IBM Db2 Architect Learning Path]
learning_objectives: [Distinguish instance, database, and bufferpool, Trace a page read and a commit, Explain Db2 crash recovery]
technologies: [IBM Db2]
last_reviewed: "2026-11-17"
scope: generic
owner: docs-data
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Db2 Architecture, Storage, And Logging Internals

## Instance Versus Database

A Db2 **instance** is a set of processes/threads (DB2 Database Manager) that
can manage one or more **databases**. Each database owns its own bufferpools,
tablespaces, logs, and configuration (`db cfg`), while instance-level settings
(`dbm cfg`) apply to every database the instance hosts.

| Layer | Important parts | Failure symptom |
|---|---|---|
| client | JDBC/CLI driver, Db2 Connect for mainframe access | `SQL30081N` connection errors |
| engine dispatchable unit (EDU) | agent thread serving a connection | high CPU, agent pool exhaustion |
| bufferpool | cached table/index pages | increased physical I/O, `BP_HIT_RATIO` drop |
| tablespace | logical container mapping to containers/storage paths | out-of-space `SQL0289N` |
| logs | active and archive logical logs | log-full `SQL0964N`, recovery delay |

Db2 LUW uses one database per set of bufferpools/tablespaces; Db2 for z/OS
separates subsystem and data-sharing-group concepts further. This page covers
Db2 LUW unless stated otherwise — the two platforms share SQL semantics but
differ materially in operations tooling.

## Bufferpools And Tablespaces

A **bufferpool** caches pages from one or more tablespaces. Multiple
bufferpools let an architect isolate a hot OLTP tablespace from a bulk-loaded
reporting tablespace so one workload cannot evict the other's working set.

```text
Tablespace (SMS or DMS/automatic storage)
  -> container (file or raw device backing the tablespace)
     -> extent (contiguous allocation unit)
        -> page (4K/8K/16K/32K, fixed per tablespace)
           -> rows
```

- **SMS** (System Managed Space) tablespaces let the OS file system manage
  space; simple, but less control over placement.
- **DMS/automatic storage** tablespaces let Db2 manage containers directly and
  support resizing, re-balancing, and better I/O parallelism — the default for
  new databases today.
- Page size is fixed per tablespace at creation and bounds maximum row length
  and index key length; it cannot be changed without rebuilding the tablespace.

## What A Commit Does

1. The agent changes bufferpool pages in place and writes log records
   describing the change to the **log buffer**.
2. On `COMMIT`, Db2 force-writes the log buffer to the **active log** on disk
   (the logical equivalent of Oracle's redo flush).
3. The client receives commit success once the log write is durable; the
   changed data pages themselves may still be flushed to the tablespace later
   by a page cleaner.
4. If the active log fills, Db2 rolls it to the **archive log** (if the
   database is configured for archival/online logging); if archiving cannot
   keep up, new transactions stall with a log-full condition.

This mirrors the general WAL principle: durability is a property of the log,
not of when data pages reach disk — but the Db2-specific failure mode is a
log-full stall, not a redo-buffer spin.

## Crash Recovery

After an instance crash, Db2 replays the active (and, if needed, archive) log
from the last consistent checkpoint: committed transactions are rolled
forward, uncommitted ones are rolled back using the same log records. A
database not configured for roll-forward recovery (circular logging) can only
be restored to the point of its last backup, not to the point of failure —
this is a deliberate availability/complexity trade-off made at database
creation time, not a default every production system should accept silently.

## Internal-Diagnosis Checklist

- Is `BP_HIT_RATIO` falling because of a true working-set change, or because a
  bulk job shares a bufferpool with OLTP traffic?
- Is latency from sort overflow (`SORTHEAP` too small, spilling to temp
  tablespace) rather than from the base table access path?
- Is the active log genuinely full, or is archiving/log-shipping the actual
  bottleneck?
- Does the tablespace have automatic storage headroom, or is a container at
  its configured maximum?

## Tricky Interview Questions

**Why can a commit succeed before the changed data page reaches the
tablespace?** The log write is the durability point; a page cleaner flushes
dirty bufferpool pages asynchronously. Recovery replays the log, not the page
cleaner's backlog.

**A database using circular logging crashed. Can you recover to the moment of
failure?** No — circular logging only supports crash recovery to the last
consistent point using the active log, not roll-forward to an arbitrary point
in time. Roll-forward recovery requires archival logging and a base backup.

**Two bufferpools exist, one for an OLTP tablespace and one for a nightly
batch-load tablespace. Why would a lead engineer insist on this split rather
than one shared bufferpool?** A large sequential batch scan can evict the
OLTP working set from a shared bufferpool, turning cached OLTP reads into
physical I/O during the batch window. Isolating bufferpools bounds that
blast radius; the cost is additional memory to size and monitor separately.

## Official References

- [Db2 memory and storage architecture](https://www.ibm.com/docs/en/db2/11.5?topic=databases-memory)
- [Db2 tablespace design](https://www.ibm.com/docs/en/db2/11.5?topic=spaces-table)
- [Db2 logging and recovery](https://www.ibm.com/docs/en/db2/11.5?topic=recovery-logging)

## Recommended Next

Continue with [SQL PL, Isolation Levels, And Concurrency](./DB2-SQL-ISOLATION-CONCURRENCY.md).
