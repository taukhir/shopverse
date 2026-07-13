---
title: Distributed Failure And Consensus
sidebar_position: 6
status: "maintained"
last_reviewed: "2026-07-13"
---

# Distributed Failure And Consensus

Distributed systems must make progress despite process crashes, network delay,
partitions, overload, and ambiguous outcomes.

## Failure Types

| Failure | Example |
|---|---|
| Crash | process or machine stops |
| Omission | message/request is lost |
| Timing | response arrives after deadline |
| Partition | groups of nodes cannot communicate |
| Byzantine | node behaves arbitrarily or maliciously |
| Overload | healthy component lacks capacity |
| Dependency degradation | slow database, DNS, broker, or identity provider |

Most application architectures assume crash/omission failures, not Byzantine
behavior. State the model explicitly.

## Failure Detection

No timeout proves a remote process is dead; it proves only that a response did
not arrive before the deadline.

Signals:

- heartbeats and leases;
- TCP/application health checks;
- missed polls;
- membership protocols;
- request timeouts;
- process/container status.

Avoid aggressive thresholds that cause false failover during temporary pauses.

## Timeouts

Every remote operation needs a deadline:

```text
client deadline: 2 seconds
  gateway budget: 1.8 seconds
    service dependency budget: 1 second
```

Nested calls must fit the original deadline. A read timeout alone does not
bound connection-pool waiting, retries, DNS, or queueing.

## Retry

Retry only:

- transient failures;
- safe/idempotent operations;
- within a bounded deadline;
- with exponential backoff and jitter.

Retry amplifies load. If three layers each attempt three times, one request can
create up to 27 downstream attempts.

## Circuit Breaker

```text
CLOSED -> failures exceed threshold -> OPEN
OPEN -> delay -> HALF_OPEN
HALF_OPEN -> successful probes -> CLOSED
```

It prevents repeated calls to an unhealthy dependency and gives it recovery
time. It does not repair the dependency.

## Bulkhead And Load Shedding

Bulkheads isolate resource pools so one dependency/workload cannot consume all
threads or connections.

Load shedding rejects work before overload destroys latency for every request:

- rate limiting;
- bounded queues;
- concurrency limits;
- `429` or `503`;
- disabling optional work.

## Replication

Replication provides redundant state:

```text
leader -> follower 1
       -> follower 2
```

It improves availability and recovery but introduces freshness, failover, and
split-brain concerns.

## Failover

Safe failover:

1. detect suspected failure;
2. establish new ownership/leader;
3. fence old owner;
4. update routing;
5. restore capacity;
6. reconcile and reintegrate old node.

Failover can cause a temporary outage and is not equivalent to zero downtime.

## Consensus

Consensus lets nodes agree on a value or ordered log despite failures. It is
used for:

- leader election;
- replicated state machines;
- cluster metadata;
- membership;
- configuration coordination.

Typical assumptions:

- a majority of nodes remain available;
- messages can be delayed or reordered;
- nodes can crash and recover.

## Quorum

For a group of `N` voters, majority quorum is:

```text
floor(N / 2) + 1
```

Examples:

| Nodes | Majority | Failures tolerated while making progress |
|---:|---:|---:|
| 3 | 2 | 1 |
| 5 | 3 | 2 |
| 7 | 4 | 3 |

Even-sized groups generally do not tolerate more failures than the preceding
odd size but cost an extra node.

## Raft

Raft organizes consensus around:

- follower, candidate, and leader roles;
- election terms;
- randomized election timeout;
- replicated log;
- majority commit;
- leader completeness and log matching.

Simplified flow:

```text
followers miss leader heartbeat
  -> candidate starts election
  -> majority elects leader
  -> leader appends commands
  -> majority replicates
  -> entry commits and applies
```

Raft makes consensus understandable; it does not make deployment and recovery
automatic. Membership changes, snapshots, disk failure, and client retries
still matter.

## Paxos

Paxos is a family of consensus protocols using proposer, acceptor, and learner
roles. It is foundational but often considered harder to explain and implement
than Raft. Multi-Paxos uses a stable leader for a sequence of decisions.

Interview-level distinction:

- both solve crash-fault consensus under assumptions;
- Raft emphasizes an understandable replicated-log design;
- Paxos describes a broader protocol family.

## Split-Brain

Split-brain occurs when multiple nodes believe they are leader/owner and accept
conflicting work.

Controls:

- quorum-based leadership;
- fencing tokens/epochs;
- single-writer routing;
- storage-level rejection of stale leaders;
- avoid automatic promotion without freshness/quorum evidence.

## Replication Is Not Consensus

Copying state does not decide:

- which node may accept writes;
- which value wins;
- whether a write is committed;
- how membership changes.

Consensus or another ownership protocol supplies the decision rules.

## Disaster Recovery

Define:

- RTO: maximum recovery duration;
- RPO: maximum acceptable data loss;
- backup frequency and retention;
- restore process;
- regional failover;
- dependency and DNS changes;
- regular recovery testing.

## Cloud Deployment Challenges

### Ephemeral Infrastructure

Instances restart and addresses change. Use service discovery and external
durable state.

### Autoscaling Delay

Scaling begins after signals rise and new instances need startup/readiness
time. Maintain headroom and shed load during the gap.

### Multi-Zone Cost

Cross-zone traffic improves resilience but adds latency and cost. Quorum
placement must tolerate the required zone loss.

### Multi-Region Consistency

Synchronous cross-region writes add latency. Asynchronous replication permits
lag and conflict. Choose per data type and operation.

### Managed-Service Limits

Account for quotas, connection limits, API throttles, maintenance, and provider
failover semantics.

### Observability Fragmentation

Correlate application, platform, network, load balancer, database, and broker
signals. Provider health alone does not prove business health.

### Deployment Compatibility

Rolling deployments run old and new versions simultaneously. APIs, events, and
database schemas must remain compatible.

### Security

Use workload identity, least privilege, network policy, encryption, secret
rotation, audit logs, and controlled administrative access.

## Failure Testing

- terminate instances;
- inject dependency latency;
- block network paths;
- exhaust pools in controlled tests;
- pause Kafka consumers;
- simulate stale cache and duplicate events;
- verify backup restore;
- test zone/region recovery where required.

Chaos experiments require a hypothesis, bounded blast radius, monitoring, and
abort conditions.

## Interview Questions

<ExpandableAnswer title="How Do You Handle Failures In A Distributed System?">

Use redundancy, replication, quorum/consensus where shared decisions are
required, timeouts, bounded retries, circuit breakers, bulkheads, load
shedding, durable queues, idempotency, failover, backups, and observability.
The exact combination depends on correctness and availability requirements.

</ExpandableAnswer>
<ExpandableAnswer title="What Is Consensus?">

A protocol allowing nodes to agree on a value or ordered log despite failures,
normally requiring a quorum.

</ExpandableAnswer>
<ExpandableAnswer title="Why Can A Timeout Not Tell Whether Work Succeeded?">

The request may have reached the server and committed while only the response
was delayed or lost. Retry therefore needs idempotency or result lookup.

</ExpandableAnswer>
<ExpandableAnswer title="What Is Split-Brain?">

Multiple nodes simultaneously act as authoritative leader/owner, risking
conflicting writes. Quorum and fencing prevent stale ownership.

</ExpandableAnswer>
<ExpandableAnswer title="Replication Or Backup?">

Replication supports availability and failover. Backup protects against
logical corruption, deletion, and disasters and must be independently
restorable.

</ExpandableAnswer>
## Related Guides

- [Resilience4j](RESILIENCE4J-GENERIC.md)
- [Distributed Transactions And Locks](DISTRIBUTED-TRANSACTIONS-LOCKS.md)
- [Load Balancing](../architecture/LOAD-BALANCING-GENERIC.md)
- [Deployment Strategies](../operations/DEPLOYMENT-STRATEGIES.md)

