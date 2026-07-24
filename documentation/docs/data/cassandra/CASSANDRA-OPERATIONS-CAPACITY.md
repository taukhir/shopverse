---
title: Cassandra Operations Capacity Repair Backup And Incidents
description: Production topology, capacity, security, monitoring, repair, backup and restore, node lifecycle, upgrades, and incident runbooks.
difficulty: Advanced
page_type: Production Guide
status: Generic
prerequisites: [Cassandra storage internals]
learning_objectives: [Size and operate clusters, Plan repair and recovery, Diagnose production incidents safely]
technologies: [Apache Cassandra, nodetool, JMX]
last_reviewed: "2026-07-23"
---

# Cassandra Operations Capacity Repair Backup And Incidents

## Production Topology

Run multiple nodes across real racks/zones, with `NetworkTopologyStrategy`, an
appropriate snitch/topology configuration, durable disks, synchronized clocks,
controlled seeds, and tested failure-domain placement. Keep client local-DC routing
and consistency aligned with the replication design.

Never run simultaneous risky maintenance on replicas for the same token ranges.
Automate one-node-at-a-time changes and continuously verify replica availability.

## Capacity Model

Start with logical ingestion:

```text
logical bytes/day = writes/second * average mutation bytes * 86,400
replicated bytes = logical bytes * replication factor
```

Then add compaction amplification, temporary compaction space, indexes, tombstones,
repair streaming, snapshots/backups, commit logs, filesystem overhead, growth,
failure headroom, and uneven token/key distribution.

Size CPU, heap, page cache, disk IOPS/throughput, network, and compaction capacity.
Cassandra relies heavily on the operating-system page cache; assigning all memory
to JVM heap can reduce performance. Validate the selected collector and heap from
production-shaped load and pause evidence.

Capacity must survive a node or failure-domain loss while meeting latency and
repair/rebuild targets. Average utilization is insufficient; track hottest node,
table, partition, and disk.

## Operational Commands

Use `nodetool` and metrics as evidence, not as a random-command checklist:

| Need | Typical evidence |
|---|---|
| topology and ownership | `status`, token/rack/DC metadata |
| node identity/load | `info` |
| table latency/partitions/SSTables | `tablestats` |
| thread-pool backlogs/drops | `tpstats` |
| pending compaction | `compactionstats` |
| client latency histograms | `tablehistograms` with metrics |
| hints | `statushandoff`, hint metrics |
| repair | `repair`, repair history/metrics |
| snapshots | `snapshot`, `listsnapshots`, `clearsnapshot` |

Command names/options change by release. Confirm the matching documentation before
executing maintenance.

## Repair

Repair compares replica data for common token ranges and streams differences. It
is I/O, CPU, network, and compaction intensive and must be scheduled, monitored,
throttled, and completed within the table's deletion correctness window.

Incremental repair reduces repeated work but does not replace occasional broader
integrity validation. Preview/full/subrange behavior and repair tooling depend on
the release and operating platform. Record successful coverage by token range,
keyspace/table, and time—not merely that a command started.

## Backup And Restore

Snapshots are hard links to immutable SSTables on a node. Incremental backups keep
new SSTable copies. A complete recovery design also preserves schema, topology,
configuration, encryption material, backup catalog, and an independent copy outside
the cluster's failure domain.

Test:

- restore of one table and one keyspace;
- point-in-time strategy where required;
- restore into a clean cluster with compatible schema/version;
- token/topology and multi-DC considerations;
- checksum, row-count, application, and reconciliation validation;
- measured RPO and RTO.

Replication, snapshots on the same disks, and an untested object-store copy are not
independently proven recovery.

## Node Lifecycle

For bootstrap, replacement, decommission, move, or removenode operations:

1. identify affected token ranges and replica availability;
2. confirm cluster health and enough disk/network headroom;
3. avoid concurrent ownership changes;
4. stream data through the documented lifecycle command;
5. monitor pending ranges, compaction, dropped messages, and client latency;
6. clean up/repair according to the release procedure;
7. verify replica coverage and application results.

Do not “fix” a dead node by reusing identity, data directories, or addresses without
following the documented replacement procedure.

## Rolling Upgrades

Read the exact source/target compatibility matrix. Back up, repair/validate health,
test driver compatibility, upgrade one node at a time, avoid unsupported schema or
protocol features during mixed versions, run required SSTable upgrades only when
documented, and preserve rollback limits. Test compaction, repair, backup, restore,
and Spring/driver behavior before production.

## Security

- enable authentication and authorization;
- use TLS for clients and internode traffic as required;
- assign least-privilege roles to keyspaces/tables;
- isolate management/JMX interfaces and secure credentials;
- manage certificates and secrets outside source/config history;
- audit schema, role, and sensitive-data access;
- encrypt disks/backups and test key rotation/recovery;
- segment networks and restrict native transport to approved clients.

## Monitoring And SLOs

Monitor coordinator and replica latency, timeouts/unavailable errors, dropped
messages, thread-pool queues, heap/GC, native memory, CPU, page-cache/disk latency,
disk occupancy, SSTables, compaction backlog, tombstones, large partitions, repair
age/success, hints, pending mutations, client connections, authentication errors,
and backup freshness/restore evidence.

Business freshness and query success by critical access pattern are better SLOs
than “all nodes are up.”

## Incident Runbooks

### One partition is hot

Identify keys/token replicas from application and table metrics. Rate-limit the
source, protect replicas, validate query fan-out, and redesign/bucket/shard the
partition. Adding nodes does not split an existing logical partition.

### Disk reaches 85–90%

Stop nonessential ingestion if required, identify tables/snapshots/compaction
backlog, preserve compaction headroom, clear only verified obsolete snapshots, add
capacity safely, and correct retention/modeling. Forced cleanup or compaction can
consume the remaining disk and worsen the outage.

### Read latency spikes

Split by table/partition/replica, inspect tombstones, partition size, SSTable count,
compaction, disk latency, GC, read repair/speculation, query shape, and consistency
level. Do not raise timeouts before finding the work consuming the latency budget.

### Unavailable versus timeout

Unavailable means the coordinator knows too few replicas are alive for the chosen
consistency. Timeout means enough replicas may exist but did not complete in time.
Their containment and root causes differ.

### Data appears inconsistent

Preserve query keys, timestamps, consistency, replica responses, topology changes,
repair history, clock state, and application mutations. Avoid blind repair until
you understand whether tombstone expiry, restore, timestamp conflict, or missed
writes could propagate incorrect data.

## Official References

- [Operating Cassandra](https://cassandra.apache.org/doc/latest/cassandra/managing/operating/index.html)
- [Repair](https://cassandra.apache.org/doc/latest/cassandra/managing/operating/repair.html)
- [Backups](https://cassandra.apache.org/doc/latest/cassandra/managing/operating/backups.html)
- [Security](https://cassandra.apache.org/doc/latest/cassandra/managing/security/index.html)

## Recommended Next

Continue with [Cassandra Interview, Labs, And Revision](./CASSANDRA-INTERVIEW-LABS-REVISION.md).

