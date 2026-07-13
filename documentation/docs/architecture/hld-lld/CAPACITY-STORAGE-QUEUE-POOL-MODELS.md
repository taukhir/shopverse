---
title: "Availability, Storage, Queue, And Pool Models"
description: "Availability, Storage, Queue, And Pool Models with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "Availability, Storage, Queue, And Pool Models"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Availability, Storage, Queue, And Pool Models

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

## Availability

```text
availability =
    successful eligible requests / total eligible requests
```

Approximate maximum downtime:

| Monthly target | Approximate downtime in 30 days |
|---:|---:|
| 99% | 7 hours 12 minutes |
| 99.9% | 43 minutes 12 seconds |
| 99.95% | 21 minutes 36 seconds |
| 99.99% | 4 minutes 19 seconds |

Define what counts as available. A `200` response that violates the business
contract is not meaningful availability.

For sequential dependencies that are all mandatory, end-to-end availability
is approximately:

```text
system availability =
    gateway availability
  x order availability
  x inventory availability
  x payment availability
```

Four components at `99.9%` each produce approximately:

```text
0.999 ^ 4 = 99.6006%
```

This is why optional work, asynchronous processing, fallback, redundancy, and
failure isolation matter.

## Bandwidth

```text
bandwidth =
    messages per second x average message size
```

Example:

```text
2,500 Kafka records/second x 2 KB
    = 5,000 KB/second
    approximately 5 MB/second before protocol overhead and replication
```

For replication factor three, brokers write roughly three copies, although
network and disk behavior depends on leaders, followers, compression, and
batching.

Estimate both ingress and egress. A record consumed by five independent groups
creates substantially more outbound broker traffic.

## Storage

```text
raw daily storage =
    events per second
  x average event size
  x 86,400
```

```text
retained storage =
    raw daily storage
  x retention days
  x replication factor
  x compression factor
```

If:

```text
event rate:          2,500/second
event size:          2 KB
retention:           7 days
replication factor:  3
compression ratio:   0.40
```

Then:

```text
raw daily = 2,500 x 2 KB x 86,400
          approximately 432 GB/day

retained = 432 GB x 7 x 3 x 0.40
         approximately 3.63 TB
```

Add index, metadata, filesystem, compaction, growth, and operational headroom.

Database storage estimates should include:

- row payload;
- primary and secondary indexes;
- transaction and binary logs;
- audit/history tables;
- backups and replicas;
- temporary space for migrations.

## Cache Hit Ratio

```text
cache hit ratio =
    cache hits / (cache hits + cache misses)
```

A 95% hit ratio is not sufficient evidence by itself. Measure:

- latency for hits and misses;
- source load during misses;
- stale-value risk;
- eviction and memory behavior;
- hot-key distribution.

## Queue And Kafka Lag

Queue depth is pending work. Kafka lag is:

```text
lag =
    log-end offset - committed consumer offset
```

Approximate time to drain a backlog:

```text
drain time =
    backlog / (consumer capacity - incoming rate)
```

If:

```text
backlog = 100,000 records
consumer capacity = 2,000 records/second
new arrival rate = 1,500 records/second
```

Then net drain capacity is `500 records/second`:

```text
100,000 / 500 = 200 seconds
```

If capacity is less than or equal to arrival rate, the backlog cannot drain.

## Database Connection Pool Sizing

Application concurrency does not imply that every active request should own a
database connection.

Approximate database connection demand:

```text
DB concurrency =
    DB operations per second x average DB hold time in seconds
```

If a service performs `400` database operations per second and each holds a
connection for `25 ms`:

```text
400 x 0.025 = 10 average active connections
```

Add measured headroom, but avoid oversized pools. Across replicas:

```text
total possible connections =
    service replicas x pool size per replica
```

Ten replicas with a pool of 50 can open 500 connections. The database must
support the combined pools of every service plus administration and migration
work.

Monitor:

- active, idle, and pending connections;
- acquisition time;
- transaction duration;
- slow queries;
- lock waits and deadlocks.

## Instance Count

A simple throughput estimate:

```text
required instances =
    ceiling(
        peak throughput
        / measured safe throughput per instance
    )
```

Add failure and deployment headroom:

```text
peak requirement:                 1,000 RPS
safe measured capacity/instance:    250 RPS
minimum throughput instances:          4

with one-instance failure tolerance:   5
```

"Safe capacity" should be measured below the point where latency and errors
rise sharply. Include rolling deployment, availability-zone loss, and burst
headroom.

## Read And Write Ratio

```text
read/write ratio =
    read operations / write operations
```

Example:

```text
9,000 reads and 1,000 writes per second
read/write ratio = 9:1
```

Read-heavy systems may benefit from caching, replicas, projections, and search
indexes. Write-heavy systems require careful index count, batching,
partitioning, locking, and durability design.

## Recovery Metrics

| Metric | Meaning |
|---|---|
| RTO | maximum acceptable time to restore service |
| RPO | maximum acceptable amount of lost data measured in time |
| MTTR | average time to recover from incidents |
| MTBF | average operating time between failures |

Example:

```text
RPO = 5 minutes
```

The backup/replication design must ensure at most roughly five minutes of
committed data can be lost under the defined disaster.

## Recommended Next

Return to [Performance And Capacity Models](./PERFORMANCE-CAPACITY-MODELS.md) to select the next focused guide.


## Official References

- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)
