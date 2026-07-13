---
title: Distributed Transactions
sidebar_position: 3
status: "maintained"
last_reviewed: "2026-07-13"
---

# Distributed Transactions

A local transaction coordinates changes through one transaction manager and
resource, usually one database. A distributed transaction coordinates changes
across independent databases, brokers, services, or shards.

Locking and worker ownership are now organized under
[Locking And Work Ownership](locking/LOCKING-AND-WORK-OWNERSHIP.md).

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

## Distributed Locks And Work Ownership

The detailed material has moved to focused guides so transaction protocols do
not compete with lock, scheduler, and queue ownership theory on this page:

- [Locking And Work Ownership](locking/LOCKING-AND-WORK-OWNERSHIP.md)
- [Distributed Locks And Fencing](locking/DISTRIBUTED-LOCKS-AND-FENCING.md)
- [Scheduler Locking With ShedLock](locking/SCHEDULER-LOCKING-SHEDLOCK.md)
- [Database Locking And Work Claims](locking/DATABASE-LOCKING-AND-CLAIMS.md)
- [Partition And Queue Ownership](locking/PARTITION-AND-QUEUE-OWNERSHIP.md)

## Interview Questions

<ExpandableAnswer title="What Is The Difference Between A Local And Distributed Transaction?">

A local transaction commits through one resource manager. A distributed
transaction coordinates several independent resources over a network and has
additional uncertainty and failure modes.

</ExpandableAnswer>
<ExpandableAnswer title="Why Is 2PC Considered Blocking?">

After participants prepare, they can hold resources while waiting for the
coordinator's final decision. A coordinator/network failure can prolong that
uncertainty.

</ExpandableAnswer>
<ExpandableAnswer title="Why Use SAGA Instead Of 2PC?">

SAGA preserves service autonomy and availability through local commits and
compensation, accepting intermediate inconsistency and more application-level
recovery logic.

</ExpandableAnswer>
<ExpandableAnswer title="Why Is A Distributed Lock Necessary?">

See [Distributed Locks And Fencing](locking/DISTRIBUTED-LOCKS-AND-FENCING.md).

</ExpandableAnswer>
<ExpandableAnswer title="Why Are Fencing Tokens Important?">

See [Distributed Locks And Fencing](locking/DISTRIBUTED-LOCKS-AND-FENCING.md#fencing-tokens).

</ExpandableAnswer>
## Related Guides

- [Spring Transactions](../spring/SPRING-TRANSACTIONS.md)
- [SAGA And Outbox](SAGA-GENERIC.md)
- [Distributed Databases](../data/DISTRIBUTED-DATABASES.md)
- [Caching Principles](../architecture/CACHING-GENERIC.md)
