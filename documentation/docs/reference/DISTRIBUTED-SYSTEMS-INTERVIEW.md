---
title: Distributed Systems Interview Questions
sidebar_position: 7
difficulty: Advanced
page_type: Reference
status: Generic
prerequisites: [Distributed systems consistency messaging and reliability]
learning_objectives: [Explain distributed systems trade-offs clearly, Practice senior-level failure and consistency scenarios]
technologies: [Distributed Systems, Kafka, Databases]
last_reviewed: "2026-07-23"
---

# Distributed Systems Interview Questions

![Eight-step system-design method from requirements and estimates through operations and evolution](/img/diagrams/system-design-method.svg)

*Use the same reasoning loop for every answer: clarify, estimate, define
invariants and data ownership, analyze failure, then defend alternatives.*

These questions emphasize precise guarantees and trade-offs. Strong answers
state assumptions instead of naming a technology as a universal solution.

Use the [Architecture Revision Sheet](../architecture/ARCHITECTURE-REVISION-SHEET.md)
and [Reliability Revision Sheet](../reliability/RELIABILITY-REVISION-SHEET.md) for
rapid recall before answering the scenarios here.

## Foundations

<ExpandableAnswer title="What Is A Distributed System?">

Independent networked processes cooperate to provide a capability. They do not
share memory or a perfectly synchronized clock and can fail independently.

</ExpandableAnswer>
<ExpandableAnswer title="What Makes Distributed Systems Difficult?">

Partial failure, variable latency, message loss/duplication, concurrency,
clock uncertainty, data consistency, coordination, overload, deployment
compatibility, and cross-node observability.

</ExpandableAnswer>
<ExpandableAnswer title="What Is The Difference Between Horizontal And Vertical Scaling?">

Vertical scaling adds capacity to one node. Horizontal scaling adds nodes and
requires load distribution and state/concurrency design.

</ExpandableAnswer>
## Consistency And CAP

### Explain CAP Theorem

During a network partition, a distributed data system must choose whether to
preserve immediate consistency by rejecting/delaying operations or preserve
availability by serving operations that may diverge.

### Strong Versus Eventual Consistency

Strong consistency presents one current authoritative order/value. Eventual
consistency permits temporary divergence but promises convergence if updates
stop.

<ExpandableAnswer title="What Is Strong Eventual Consistency?">

Replicas that receive the same updates converge to equivalent state regardless
of update arrival order, commonly through CRDT-style deterministic merges.

</ExpandableAnswer>
<ExpandableAnswer title="What Is PACELC?">

During a partition choose availability or consistency; else choose latency or
consistency.

</ExpandableAnswer>
<ExpandableAnswer title="What Are Read-Your-Writes And Monotonic Reads?">

Read-your-writes ensures a client sees its own successful updates. Monotonic
reads ensure a client does not later observe an older version.

</ExpandableAnswer>
## Databases

<ExpandableAnswer title="What Is A Distributed Database?">

A database whose data and processing span multiple nodes while coordinating
replication, partitioning, consistency, membership, and failure recovery.

</ExpandableAnswer>
### Replication Versus Sharding

Replication copies the same data for availability/read scale. Sharding divides
different data for storage and write scale.

<ExpandableAnswer title="What Is Sharding?">

Horizontal partitioning by a shard key. It increases aggregate capacity but
complicates cross-shard queries, transactions, uniqueness, and rebalancing.

</ExpandableAnswer>
<ExpandableAnswer title="What Makes A Good Shard Key?">

High cardinality, even distribution, common query locality, stability, and
minimal cross-shard transactions.

</ExpandableAnswer>
<ExpandableAnswer title="What Is Consistent Hashing?">

A key/node mapping that limits key movement when membership changes. Virtual
nodes improve distribution.

</ExpandableAnswer>
<ExpandableAnswer title="How Do You Handle A Hot Shard?">

Change/split the key space, isolate large tenants, salt suitable writes, cache
reads, rate limit, or redesign access. More nodes alone do not split one hot
key.

</ExpandableAnswer>
<ExpandableAnswer title="What Is Replication Lag?">

Delay before a committed source write becomes visible on replicas. It causes
stale reads and affects failover data loss.

</ExpandableAnswer>
## Transactions And Concurrency

### Local Versus Distributed Transaction

A local transaction has one resource manager. A distributed transaction
coordinates independent resources over a network and has additional failure
and uncertainty.

### Explain Two-Phase Commit

Participants first prepare and vote, then the coordinator orders commit or
rollback. It provides atomic coordination but can block and hold resources
during failures.

<ExpandableAnswer title="What Is A SAGA?">

A sequence of local transactions with compensating actions for later business
failure. It provides eventual semantic consistency, not global rollback.

</ExpandableAnswer>
<ExpandableAnswer title="What Is Transactional Outbox?">

The service commits domain state and an outgoing event record in one database
transaction. A publisher later sends the event, avoiding the lost dual-write
window.

</ExpandableAnswer>
<ExpandableAnswer title="What Is A Distributed Lock?">

A lease/ownership mechanism coordinating exclusive work across nodes.
Correctness may require fencing tokens so expired holders cannot write.

</ExpandableAnswer>
<ExpandableAnswer title="When Should You Avoid A Distributed Lock?">

When database uniqueness, atomic updates, optimistic locking, partition
ownership, or idempotency solve the invariant with fewer failure modes.

</ExpandableAnswer>
### Common Concurrency-Control Mechanisms

- optimistic versioning;
- pessimistic row locks;
- atomic compare-and-set/conditional updates;
- serializable transactions;
- unique constraints;
- distributed leases with fencing;
- partition/actor ownership;
- consensus-ordered state machines;
- idempotency and deduplication.

### Optimistic Versus Pessimistic Locking

Optimistic locking detects conflict at update/commit and suits uncommon
conflicts. Pessimistic locking reserves resources and suits short high-conflict
critical sections but reduces concurrency and can deadlock.

## Messaging

<ExpandableAnswer title="Why Must Consumers Be Idempotent?">

At-least-once delivery, crashes, offset timing, retry, and replay can deliver
the same event more than once.

</ExpandableAnswer>
<ExpandableAnswer title="How Do You Preserve Event Ordering?">

Use a stable aggregate key to route related records to one partition and carry
aggregate versions. Retry topics and replay can still affect processing order.

</ExpandableAnswer>
<ExpandableAnswer title="What Is Backpressure?">

Controlling or rejecting incoming work when consumers cannot keep pace, using
bounded queues, rate/concurrency limits, and producer/consumer flow control.

</ExpandableAnswer>
## Failure And Consensus

<ExpandableAnswer title="How Do You Handle Failures?">

Classify failures; use redundancy, replication, timeouts, bounded retry,
circuit breakers, bulkheads, load shedding, durable queues, idempotency,
failover, backups, observability, and tested recovery.

</ExpandableAnswer>
<ExpandableAnswer title="What Is Consensus?">

Nodes agree on a value or replicated-log order despite crashes and network
delay, normally through majority quorum.

</ExpandableAnswer>
### Raft Versus Paxos

Both address consensus. Raft organizes an understandable leader-based
replicated log; Paxos is a broader foundational protocol family.

<ExpandableAnswer title="What Is Split-Brain?">

Several nodes believe they are authoritative and accept conflicting writes.
Prevent it with quorum leadership and fencing.

</ExpandableAnswer>
<ExpandableAnswer title="Why Is Failure Detection Imperfect?">

A timeout cannot distinguish a dead node from a slow node, delayed network, or
partition.

</ExpandableAnswer>
<ExpandableAnswer title="What Is Failover?">

Detecting an unavailable owner, safely establishing a replacement, fencing the
old owner, updating routing, and restoring capacity.

</ExpandableAnswer>
## Caching

### Local Versus Distributed Cache

Local cache has lower latency but independent per-instance state. Distributed
cache is shared but introduces a network dependency and centralized capacity.

<ExpandableAnswer title="What Is Cache Stampede?">

Many requests simultaneously reload one expired value. Use synchronized
loading, request coalescing, jittered TTLs, or refresh-ahead.

</ExpandableAnswer>
<ExpandableAnswer title="How Do You Keep Cache And Database Consistent?">

Usually update the database transaction first and invalidate/update cache
after commit. Accept a defined staleness window or use durable invalidation
events. Ordinary cache-aside is not strongly atomic.

</ExpandableAnswer>
## Cloud Operations

### Common Cloud Deployment Challenges

- ephemeral instances and changing addresses;
- zone/region failure;
- cross-zone latency and cost;
- autoscaling delay;
- quotas and managed-service behavior;
- secrets and workload identity;
- rolling-version compatibility;
- observability fragmentation;
- backup and disaster recovery;
- noisy neighbors and resource limits.

<ExpandableAnswer title="How Do You Design For One-Zone Failure?">

Spread stateless instances and state replicas across zones, ensure quorum
survives, avoid zone-local dependencies, balance traffic, and test failover.

</ExpandableAnswer>
<ExpandableAnswer title="How Do You Deploy Without Breaking Compatibility?">

Use backward-compatible APIs/events, expand-and-contract schema migrations,
tolerant consumers, feature flags, and rolling/canary deployment.

</ExpandableAnswer>
## Scenario Questions

<ExpandableAnswer title="A Client Times Out But The Server May Have Completed A Payment. What Now?">

Use an idempotency key and provider transaction reference. Retry/result lookup
must return the original outcome rather than create another charge.

</ExpandableAnswer>
<ExpandableAnswer title="Two Customers Buy The Last Item Concurrently. How Do You Prevent Oversell?">

Use an atomic conditional update, optimistic version, or short row lock plus a
database invariant. Make retry/idempotency explicit.

</ExpandableAnswer>
<ExpandableAnswer title="Kafka Consumer Lag Is Growing. What Do You Check?">

Partition-level lag, processing duration, database/remote latency, poison
events, retries, hot keys, rebalances, connection pools, partition count, and
consumer capacity.

</ExpandableAnswer>
<ExpandableAnswer title="Cache Is Down And Database Load Spikes. What Design Helps?">

Short cache timeouts, fallback limits, request coalescing, bulkheads, rate
limits, local near-cache where safe, and source capacity planning.

</ExpandableAnswer>
### Region A And Region B Accept Conflicting Writes

Choose an ownership or conflict model: single writer, quorum/consensus,
version vectors, deterministic merge/CRDT, or business reconciliation. Do not
use timestamps blindly.

## Answering Senior Interviews

1. State the business invariant.
2. State the failure and consistency model.
3. Present the simplest design.
4. Explain duplicate, timeout, and partition behavior.
5. Quantify latency, throughput, and recovery targets.
6. Discuss alternatives and trade-offs.
7. Include security, observability, deployment, and testing.

## Related Guides

- [Distributed Systems Fundamentals](../architecture/DISTRIBUTED-SYSTEMS-GENERIC.md)
- [Consistency And CAP](../architecture/DISTRIBUTED-CONSISTENCY-CAP.md)
- [Distributed Databases](../data/DISTRIBUTED-DATABASES.md)
- [Transactions And Locks](../reliability/DISTRIBUTED-TRANSACTIONS-LOCKS.md)
- [Failure And Consensus](../reliability/DISTRIBUTED-FAILURE-CONSENSUS.md)

## Official References

- [Spring Framework reference](https://docs.spring.io/spring-framework/reference/)
- [Google Site Reliability Engineering book](https://sre.google/sre-book/table-of-contents/)
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
