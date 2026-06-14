---
title: Distributed Transactions And Locks
sidebar_position: 3
---

# Distributed Transactions And Locks

A local transaction coordinates changes through one transaction manager and
resource, usually one database. A distributed transaction coordinates changes
across independent databases, brokers, services, or shards.

## Local Versus Distributed Transaction

| Local | Distributed |
|---|---|
| one resource/transaction manager | multiple independent resources |
| low coordination latency | network coordination |
| native rollback | participants may commit at different times |
| simpler failure model | coordinator and participant failure |
| normal database isolation | cross-resource consistency protocol |

```java
@Transactional
public void reserveInventory() {
    inventoryRepository.update(...);
    reservationRepository.save(...);
}
```

This is local when both repositories use the same database transaction.

## Two-Phase Commit

2PC uses a coordinator.

### Phase 1: Prepare

```text
coordinator -> participants: can you commit?
participants: persist tentative state/locks and vote
```

### Phase 2: Commit Or Rollback

```text
all vote yes -> commit
any vote no  -> rollback
```

Advantages:

- atomic decision across supported resources;
- familiar transaction semantics.

Costs:

- participants can hold locks while waiting;
- coordinator failure creates uncertainty;
- higher latency and lower availability;
- operational coupling;
- not all cloud services/brokers participate in XA/JTA.

2PC can be appropriate inside controlled infrastructure with strict atomicity,
but it is usually avoided across independently deployed microservices.

## Three-Phase Commit

3PC adds a pre-commit phase to reduce some blocking scenarios. It assumes
bounded delays and failure conditions that are difficult to guarantee in
real-world asynchronous networks. Consensus-based replication is more common
for modern distributed state machines.

## SAGA

A SAGA decomposes one business operation into local transactions:

```text
create order
  -> reserve inventory
  -> authorize payment
  -> confirm order
```

Failure triggers compensating transactions:

```text
payment declined
  -> release inventory
  -> cancel order
```

Compensation is not rollback; earlier commits remain historical facts.

## Transactional Outbox

Write domain state and outgoing event in one local transaction:

```java
@Transactional
public void createOrder(Order order) {
    orderRepository.save(order);
    outboxRepository.save(OutboxEvent.created(order));
}
```

A publisher later sends the durable outbox event. Crash after broker acceptance
but before marking published can cause duplicate delivery, so consumers remain
idempotent.

## Inbox And Idempotent Consumer

```java
@Transactional
public void consume(Event event) {
    if (!processedEvents.insertUnique(event.id(), consumerName)) {
        return;
    }

    applyBusinessChange(event);
    outboxRepository.save(nextEvent(event));
}
```

The unique event identity, business change, and outgoing event commit together.

## Concurrency Control

### Optimistic

```java
@Version
private long version;
```

Best when conflicts are uncommon. A conflicting update fails and the complete
idempotent operation can be retried with fresh state.

### Pessimistic

```sql
select *
from inventory
where product_id = ?
for update;
```

Best for short, measured exclusive sections. It reduces concurrency and can
deadlock.

### Atomic Conditional Update

```sql
update inventory
set available = available - :quantity
where product_id = :productId
  and available >= :quantity;
```

The affected row count determines success without a separate read lock.

### Serialization Through Ownership

Route all changes for one key to one partition or actor:

```text
orderNumber -> Kafka partition -> sequential consumer
```

This simplifies ordering but the database still needs invariants for replay,
multiple writers, and operational mistakes.

## Distributed Locks

A distributed lock coordinates processes on different nodes so one holder is
allowed to perform an operation for a resource.

Examples:

- one scheduled settlement job;
- exclusive external device operation;
- one migration/coordinator task;
- cross-node leader election.

Do not use a distributed lock when database uniqueness, an atomic update,
partition ownership, or idempotency solves the problem more safely.

## Lease-Based Lock

Distributed locks normally use a lease:

```text
acquire lock for 30 seconds
renew while work continues
expire if holder disappears
```

Failure scenario:

1. process A acquires lock;
2. A pauses for longer than lease;
3. lock expires;
4. process B acquires lock;
5. A resumes and writes stale data.

Mutual exclusion has been violated from the resource's perspective.

## Fencing Tokens

Every lock acquisition receives an increasing token:

```text
A gets token 41
B later gets token 42
```

The protected resource rejects operations using a token older than the latest:

```sql
update resource
set value = ?, fencing_token = 42
where id = ?
  and fencing_token < 42;
```

Leases control coordination; fencing protects the resource from stale holders.

## Redis Locks

A basic single-node Redis lock uses:

```text
SET lock-key unique-owner-value NX PX 30000
```

Release must delete only when the stored value matches the owner, commonly
through an atomic script.

Consider:

- Redis failover semantics;
- lease duration and renewal;
- fencing;
- clock/process pauses;
- protected resource validation.

A lock library does not remove these system-design questions.

## Database Advisory Locks

Some databases provide advisory/application locks. They are useful when:

- all contenders use the same database;
- lock lifetime and connection behavior are understood;
- the protected resource is tied to that database.

They can be simpler than introducing a separate lock service.

## Deadlocks

Deadlock:

```text
transaction A holds row 1, waits for row 2
transaction B holds row 2, waits for row 1
```

Controls:

- consistent lock ordering;
- short transactions;
- indexed predicates;
- bounded batch size;
- no network calls while holding locks;
- bounded retry of the complete idempotent unit.

## Idempotency Versus Locking

Locks try to prevent concurrent execution. Idempotency makes duplicate
execution safe.

In distributed systems, idempotency is often more robust because locks can
expire, owners can pause, and responses can be lost. Some invariants still need
exclusive coordination or atomic database constraints.

## Interview Questions

### What Is The Difference Between A Local And Distributed Transaction?

A local transaction commits through one resource manager. A distributed
transaction coordinates several independent resources over a network and has
additional uncertainty and failure modes.

### Why Is 2PC Considered Blocking?

After participants prepare, they can hold resources while waiting for the
coordinator's final decision. A coordinator/network failure can prolong that
uncertainty.

### Why Use SAGA Instead Of 2PC?

SAGA preserves service autonomy and availability through local commits and
compensation, accepting intermediate inconsistency and more application-level
recovery logic.

### Why Is A Distributed Lock Necessary?

Only when multiple nodes must coordinate exclusive access to a resource that
cannot be protected by one local database invariant or ownership mechanism.

### Why Are Fencing Tokens Important?

They prevent a paused or expired lock holder from writing after a newer holder
has taken ownership.

## Related Guides

- [Spring Transactions](../spring/SPRING-TRANSACTIONS.md)
- [SAGA And Outbox](SAGA-GENERIC.md)
- [Distributed Databases](../data/DISTRIBUTED-DATABASES.md)
- [Caching Principles](../architecture/CACHING-GENERIC.md)

