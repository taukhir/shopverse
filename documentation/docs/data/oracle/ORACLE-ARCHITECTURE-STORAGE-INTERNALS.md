---
title: Oracle Architecture, Storage, And Recovery Internals
description: Trace Oracle instances, processes, memory, files, blocks, redo, undo, checkpoints, and crash recovery.
difficulty: Advanced
page_type: Deep Dive
status: Generic
prerequisites: [Oracle Database Architect Learning Path]
learning_objectives: [Distinguish instance and database, Trace reads and commits, Explain crash recovery and storage structures]
technologies: [Oracle Database]
last_reviewed: "2026-07-23"
---

# Oracle Architecture, Storage, And Recovery Internals

## Instance Versus Database

An **instance** is the running SGA plus background processes. A **database** is the
durable collection of datafiles, control files, and online redo logs. Starting an
instance, mounting control files, and opening datafiles are different lifecycle stages.

| Layer | Important parts | Failure symptom |
|---|---|---|
| client | driver, listener address, service name | connection or name-resolution errors |
| server process | executes work for a session | high CPU, waits, or session termination |
| SGA | buffer cache, shared pool, redo log buffer | churn, hard parses, cache pressure |
| PGA | sort/hash/session-private memory | temporary spills or aggregate PGA pressure |
| database files | data, control, redo | media failure or recovery requirement |

Dedicated server gives a client session its own server process; shared-server mode
multiplexes work and changes diagnosis. A listener accepts connections but does not
execute SQL.

## Major Memory Structures

- The **database buffer cache** holds copies of data blocks. Logical reads inspect
  cached blocks; physical reads fetch blocks from storage.
- The **shared pool** holds parsed SQL, plans, and data dictionary information.
  Literal-heavy SQL can cause hard-parse and latch/mutex pressure; bind variables
  improve reuse but can introduce plan-selectivity trade-offs.
- The **redo log buffer** stages change vectors before LGWR writes them.
- The **PGA** holds private session state, sorts, hash joins, and work areas.

## Processes That Matter

| Process | Responsibility |
|---|---|
| DBWn | writes dirty buffers to datafiles; it does not define commit durability |
| LGWR | flushes redo, including for commit; commit can complete before data blocks reach datafiles |
| CKPT | coordinates checkpoints and updates checkpoint metadata |
| SMON | performs instance recovery and system cleanup |
| PMON | cleans failed processes and helps registration/cleanup duties |
| ARCn | archives filled redo logs in ARCHIVELOG mode |

## Logical And Physical Storage

```text
Tablespace
  -> segment (table, index, undo)
     -> extent (allocated contiguous blocks)
        -> Oracle block (smallest database I/O unit)
           -> rows and row pieces
```

A row may migrate or chain when it no longer fits. A high-water mark affects full
scans. Automatic Segment Space Management coordinates free space. Tablespaces are
logical administrative units backed by datafiles; temporary tablespaces support
spills, and undo tablespaces retain prior versions.

## What A Commit Does

1. The session changes cached blocks and generates undo plus redo change vectors.
2. Oracle assigns/advances transaction metadata and requests redo flush.
3. LGWR writes required redo to online redo logs.
4. The client receives commit success after durability conditions are satisfied.
5. DBWn may write data blocks later.

This is why disabling durability to reduce commit latency is a business-data decision,
not an innocent performance flag.

## Undo, MVCC, And Read Consistency

Undo supports rollback and reconstructs older block versions for a query's consistent
snapshot. A long query may fail with `ORA-01555` when the required undo is overwritten.
Treat it as a workload/retention/transaction issue: inspect query duration, undo sizing,
commit frequency, and write rate rather than automatically retrying forever.

## Checkpoints And Recovery

Redo protects changes not yet reflected in datafiles. Following instance failure,
Oracle rolls forward redo and rolls back uncommitted transactions using undo. Control
files describe database structure and checkpoint state. Multiplex redo/control files
across appropriate failure domains.

ARCHIVELOG mode retains completed redo logs for media recovery and point-in-time
recovery. It is not itself a backup.

## Internal-Diagnosis Checklist

- Is latency CPU, concurrency, I/O, commit, network, or parse time?
- Are logical reads excessive even if physical I/O is low?
- Is temporary-space use evidence of under-sized work areas or a bad plan?
- Is redo generation expected for the workload?
- Can the required undo window support long reports?
- Are file redundancy and backup copies independent of the same storage failure?

## Interview Questions

**Why can a commit finish before table data reaches a datafile?** LGWR makes redo
durable; DBWn writes dirty blocks later. Recovery replays redo after a crash.

**SGA versus PGA?** SGA is shared instance memory. PGA is private to a process/session
and holds execution work areas and state.

**Buffer cache hit ratio is high; can SQL still be slow?** Yes. Excessive logical
reads, CPU, locks, parsing, bad joins, and application waits remain possible.

## Official References

- [Oracle Database memory architecture](https://docs.oracle.com/en/database/oracle/oracle-database/23/cncpt/memory-architecture.html)
- [Oracle Database process architecture](https://docs.oracle.com/en/database/oracle/oracle-database/23/cncpt/process-architecture.html)
- [Oracle Database storage structures](https://docs.oracle.com/en/database/oracle/oracle-database/23/cncpt/logical-storage-structures.html)

## Recommended Next

Continue with [SQL, PL/SQL, Optimizer, Transactions, And Concurrency](./ORACLE-SQL-OPTIMIZER-CONCURRENCY.md).

