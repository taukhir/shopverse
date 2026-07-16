---
title: Spring Distributed Locking Options
description: Architect comparison of Spring scheduling, ShedLock, LockRegistry, Redisson, Quartz, advisory locks, leader election, database work claims, leases, and fencing.
difficulty: Advanced
page_type: Architecture Guide
status: Generic
keywords: [Spring distributed lock, ShedLock, LockRegistry, Redisson, Quartz, advisory lock, leader election, fencing]
learning_objectives:
  - Separate scheduler coordination from record ownership and duplicate-delivery safety
  - Select a Spring-compatible coordination mechanism from workload and failure semantics
  - Explain leases, stale owners, fencing, idempotency, and operational trade-offs
technologies: [Spring Boot, Spring Integration, ShedLock, Quartz, Redis, JDBC, Kubernetes]
last_reviewed: "2026-07-16"
---

# Spring Distributed Locking Options

Spring Framework provides local task scheduling and execution abstractions. A
method annotated with `@Scheduled` is registered in each application context, so
deploying three replicas normally creates three independent schedules. Cluster
coordination must be added deliberately.

The first architecture decision is not *which lock library to install*. It is
*what must have one owner*:

```text
scheduled method -> singleton scheduler coordination
database rows     -> atomic record or batch claims
business key      -> keyed lock or partition ownership
broker work       -> consumer-group partition assignment
external resource -> lease plus fencing where stale writes matter
replayed request  -> idempotency key or Inbox record
```

<DocCallout type="production" title="A lock does not provide exactly-once delivery">

A broker acknowledgement can succeed immediately before the publisher crashes.
The outbox row can then be retried and published again. Scheduler coordination
does not close this database-to-broker failure window; consumers must still be
idempotent.

</DocCallout>

## Architect Selection Matrix

| Option | Ownership scope | Parallel work | Best fit | Main limitation |
|---|---|---:|---|---|
| ShedLock | one scheduled invocation | low | simple singleton maintenance jobs | other replicas skip the invocation |
| Spring Integration `LockRegistry` | dynamic logical key | key-dependent | Spring-native resource locking | lease/store semantics vary by implementation |
| Redisson | Redis/Valkey logical key | key-dependent | cross-system locks and richer primitives | adds a second coordination system |
| Quartz JDBC cluster | persistent job/trigger | job-dependent | complex schedules, misfires, pause/resume | not a row-distribution strategy |
| database advisory lock | connection/session logical key | low unless sharded | simple DB-backed singleton work | database and connection semantics matter |
| leader election | long-lived role | usually low | one active coordinator | failover interval and stale work still matter |
| `SKIP LOCKED` batch claim | database rows | high | relational outbox and DB work queues | database-specific SQL and indexed predicates |
| conditional claim update | database rows | medium-high | portable fallback | losing workers perform wasted candidate reads |
| partition ownership | stable key range | very high | ordered high-scale work | assignment and rebalance complexity |

For a relational transactional outbox, row-level work claiming is normally more
efficient than a global distributed lock because every replica can claim a
different bounded batch.

## Spring `@Scheduled`: Local Triggering Only

```java
@Scheduled(fixedDelayString = "${outbox.poll-delay:1000}")
public void poll() {
    // Every application instance invokes this method.
}
```

Thread-pool size controls concurrency inside one JVM. It does not coordinate
replicas. Fixed delay, fixed rate, and cron expressions determine trigger timing;
they do not establish ownership of shared work.

Use plain `@Scheduled` safely when:

- each replica intentionally performs local work;
- the operation is naturally idempotent;
- database rows are claimed atomically;
- a queue or broker assigns independent work.

## ShedLock: Annotation-Oriented Singleton Jobs

ShedLock wraps a scheduled execution with a shared, time-based lock. If another
node holds the same lock name, the competing invocation is skipped rather than
queued.

```java
@Scheduled(cron = "0 0 2 * * *")
@SchedulerLock(
        name = "outboxCleanup",
        lockAtMostFor = "PT30M",
        lockAtLeastFor = "PT1M")
public void cleanupPublishedOutboxRows() {
    cleanupService.archiveExpiredRows();
}
```

Use it for cleanup, reconciliation, report generation, cache refresh, and other
jobs that are genuinely singular and small enough for one active executor.

`lockAtMostFor` is a failure safety lease, not a normal runtime target. If work
outlives it, another node can start while the old node is still running. Measure
job duration, leave headroom for pauses, and keep the operation idempotent.

Do not put ShedLock around a high-volume outbox relay if the objective is to make
all replicas publish distinct events. The lock intentionally removes that
parallelism.

Shopverse does not currently include ShedLock. It remains a candidate for
singleton cleanup or reconciliation, not the implemented outbox publication
mechanism.

## Spring Integration `LockRegistry`

Spring Integration exposes a keyed `LockRegistry` abstraction. Different keys
can be held concurrently, which makes it more general than a scheduler-specific
annotation.

```java
lockRegistry.executeLocked(
        "settlement:" + settlementDate,
        Duration.ofSeconds(2),
        () -> settlementService.settle(settlementDate));
```

Relevant implementations include:

| Implementation | Scope | Use |
|---|---|---|
| `DefaultLockRegistry` | one JVM | local concurrency only; not distributed |
| `JdbcLockRegistry` | shared database | keyed locks without another infrastructure service |
| `RedisLockRegistry` | shared Redis | keyed locks where Redis is already operational |
| `ZookeeperLockRegistry` | ZooKeeper ensemble | coordinator-backed locks in an existing ZooKeeper platform |
| `DynamoDbLockRegistry` | DynamoDB through Spring Cloud AWS | AWS-native shared locking |

Modern Spring Integration versions also expose lock renewal/TTL capabilities for
supported distributed implementations. Version-specific APIs must be checked
against the project dependency baseline before copying an example.

Use `LockRegistry` when the key is dynamic and the exclusive section is not tied
only to `@Scheduled`. Do not use one global key to serialize a divisible outbox
table unless that loss of throughput is intentional.

## Redisson Locks

Redisson provides Redis/Valkey-backed reentrant, fair, read/write, semaphore, and
fenced locking primitives.

```java
RLock lock = redissonClient.getLock("external-token-refresh:" + provider);
if (!lock.tryLock(0, 30, TimeUnit.SECONDS)) {
    return;
}
try {
    tokenService.refresh(provider);
} finally {
    if (lock.isHeldByCurrentThread()) {
        lock.unlock();
    }
}
```

This fits short cross-system operations when Redis is already a production
dependency. It is usually inferior to database row claims for a database-backed
outbox because ownership then spans two systems: the database contains the work
while Redis contains the lock.

For critical writes that can reject stale owners, use a fencing token rather
than trusting lease expiry alone. Redisson exposes `RFencedLock`; the protected
resource must store the highest accepted token and reject lower tokens.

## Quartz Clustering

Quartz is a persistent scheduler, not merely a lock. With `JDBCJobStore` and
clustering enabled, scheduler instances share jobs and triggers and provide
cluster failover and load balancing.

```yaml
spring:
  quartz:
    job-store-type: jdbc
    properties:
      org.quartz.scheduler.instanceId: AUTO
      org.quartz.jobStore.isClustered: true
```

Choose Quartz when scheduling is part of the product or operating model:

- persisted or user-configured schedules;
- calendars and complex triggers;
- pause/resume and administrative control;
- explicit misfire behavior;
- durable job and trigger state.

Quartz can decide which cluster node fires a trigger. It does not automatically
divide arbitrary outbox rows, close the broker publication crash window, or make
business effects idempotent. A one-second outbox poller usually does not justify
Quartz's trigger tables and operational surface.

## Database Advisory Locks

PostgreSQL, MySQL, and other databases expose named/application locks. They can
coordinate a small singleton job without an extra lock table.

```sql
-- PostgreSQL transaction-scoped example
SELECT pg_try_advisory_xact_lock(:lock_key);
```

Advisory locks are database-specific. Session-scoped variants are sensitive to
connection ownership, so connection pools require particular care. For rows in
the same database, a conditional update or `SKIP LOCKED` claim is usually more
explicit and more scalable.

## Leader Election

Leader election gives one replica a longer-lived active role rather than
acquiring a lock independently for every schedule tick. Spring Integration can
build leadership events on `LockRegistry`; Spring Cloud Kubernetes also provides
a Kubernetes-backed leader-election integration.

```java
@Bean
LockRegistryLeaderInitiator leaderInitiator(LockRegistry registry) {
    return new LockRegistryLeaderInitiator(registry);
}
```

Use leadership when one active coordinator owns several related activities and
the application has a clear response to grant, revocation, and leaderless
intervals. Leadership still needs idempotent work and ownership validation after
pauses or failover.

## Fencing And Stale Owners

Every time-based lock or lease has this failure mode:

```text
worker A acquires lease 41
worker A pauses beyond expiry
worker B acquires lease 42 and writes
worker A resumes and attempts a stale write
```

A monotonically increasing fencing token lets the protected resource reject
token 41 after accepting token 42. If the protected resource cannot validate a
token, design the effect to be idempotent and use conditional ownership checks.

## Recommended Shopverse Split

| Work | Recommended coordination | Status |
|---|---|---|
| Outbox publication | every replica polls; short per-row claim today, bounded `SKIP LOCKED` batch claim as a future optimization | current plus target |
| Published-row cleanup | one ShedLock/JDBC-locked execution | candidate, not installed |
| Inventory expiry | conditional record ownership or bounded claims as volume grows | current scheduler requires duplicate-safe effects |
| Kafka consumption | consumer-group partition assignment plus business idempotency | implemented baseline |
| Cross-system singleton resource | keyed `LockRegistry` or fenced Redisson lock only when the resource cannot use DB ownership | decision-specific |
| User-configured persistent jobs | Quartz cluster | future only if scheduling becomes a domain capability |

## Production Review Checklist

- Define whether ownership covers a method, row, key, partition, or external
  resource.
- Specify acquisition wait, lease duration, renewal, release, and crash behavior.
- Use a shared authoritative time source where the mechanism supports it.
- Reject stale completion with owner token, claim version, or fencing token.
- Keep remote calls outside database-lock transactions.
- Bound acquired work, threads, broker requests, retries, and memory.
- Measure acquisition latency, contention, lease loss, stale-write rejection,
  backlog age, and recovery time.
- Test process crash, long pause, network partition, store failover, lease expiry,
  and duplicate delivery.
- Preserve idempotency even after coordination appears correct.

## Official References

- [Spring Framework task execution and scheduling](https://docs.spring.io/spring-framework/reference/integration/scheduling.html)
- [Spring Integration distributed locks](https://docs.spring.io/spring-integration/reference/distributed-locks.html)
- [Spring Integration leadership event handling](https://docs.spring.io/spring-integration/reference/leadership-event-handling.html)
- [Spring Cloud Kubernetes leader election](https://docs.spring.io/spring-cloud-kubernetes/reference/leader-election.html)
- [ShedLock project documentation](https://github.com/lukas-krecan/shedlock)
- [Redisson locks and synchronizers](https://redisson.pro/docs/data-and-services/locks-and-synchronizers/)
- [Quartz Scheduler introduction and clustering](https://www.quartz-scheduler.org/documentation/quartz-2.5.x/introduction.html)

## Related Guides

- [Locking And Work Ownership](LOCKING-AND-WORK-OWNERSHIP.md)
- [Distributed Schedulers And Safe Work Claiming](../DISTRIBUTED-SCHEDULER-WORK-CLAIMS.md)
- [Database Locking And Work Claims](DATABASE-LOCKING-AND-CLAIMS.md)
- [Distributed Locks And Fencing](DISTRIBUTED-LOCKS-AND-FENCING.md)
- [Scheduler Locking With ShedLock](SCHEDULER-LOCKING-SHEDLOCK.md)
- [Partition And Queue Ownership](PARTITION-AND-QUEUE-OWNERSHIP.md)
- [Inbox Pattern And Idempotent Consumers](../INBOX-PATTERN.md)
