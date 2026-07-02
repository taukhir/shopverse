---
title: SAGA Pattern
---

# SAGA Pattern

A SAGA coordinates one business operation across services that own separate
databases. Instead of one distributed ACID transaction, each participant
commits a local transaction and communicates the result to the next
participant.

If a later step fails, the system executes compensating business actions for
earlier committed work.

## Why A SAGA Is Needed

Consider checkout:

```text
Create Order -> Reserve Inventory -> Process Payment -> Confirm Order
```

Each step belongs to a different service and database. A local transaction can
atomically update only one service's resources. Holding one transaction across
several databases and a message broker creates tight coupling, long locks, and
difficult failure recovery.

A SAGA accepts temporary inconsistency and drives the system toward a valid
final state.

## Local Transaction Model

```mermaid
flowchart LR
    O["Order local transaction"] --> E1["OrderCreated event"]
    E1 --> I["Inventory local transaction"]
    I --> E2["InventoryReserved event"]
    E2 --> P["Payment local transaction"]
    P --> E3["PaymentCompleted event"]
    E3 --> F["Order confirmation transaction"]
```

Each transaction is independently atomic. The complete flow is eventually
consistent.

## Choreography And Orchestration

### Choreography

Services react to events without a central coordinator:

```mermaid
sequenceDiagram
    participant Order
    participant Inventory
    participant Payment

    Order-->>Inventory: OrderCreated
    Inventory-->>Payment: InventoryReserved
    Payment-->>Order: PaymentCompleted
```

Advantages:

- loose runtime coupling;
- natural event-driven flow;
- participants remain autonomous.

Trade-offs:

- flow is distributed across listeners;
- event dependencies can become difficult to understand;
- debugging requires correlation, timeline, and event visibility.

### Orchestration

A coordinator sends commands and receives outcomes:

```mermaid
sequenceDiagram
    participant Orchestrator
    participant Order
    participant Inventory
    participant Payment

    Orchestrator->>Order: Create order
    Orchestrator->>Inventory: Reserve stock
    Orchestrator->>Payment: Process payment
    Orchestrator->>Order: Confirm order
```

Advantages:

- workflow and state are visible in one component;
- complex branching and timeouts are easier to model.

Trade-offs:

- coordinator availability and complexity;
- stronger coupling to participant contracts;
- risk of putting domain logic into the orchestrator.

Choose based on workflow complexity, ownership, failure handling, and
operational visibility rather than service count alone.

## Compensation

Compensation is a new business transaction that semantically reverses or
neutralizes an earlier action.

Examples:

- release reserved inventory;
- refund or void a payment;
- cancel an order;
- restore a usage quota.

Compensation is not a database rollback. The earlier transaction already
committed and may have been observed by other systems.

Compensations should be:

- idempotent;
- safe to retry;
- auditable;
- valid when the resource is already compensated;
- explicit about partial or irreversible outcomes.

## Consistency

### Local Consistency

Within one service transaction, database constraints and transaction isolation
maintain local correctness.

### Eventual Consistency

Across services, states can temporarily disagree:

```text
Order = PAYMENT_PROCESSING
Payment = CAPTURED
Order confirmation event = not consumed yet
```

This is valid intermediate state if the event remains recoverable and the
system eventually converges.

### Semantic Consistency

The final business outcome matters more than identical instantaneous database
state. For example, a failed payment should eventually produce a cancelled
order and released reservation.

## Isolation Problems

SAGAs can expose intermediate state. Common risks include:

- dirty business reads of an unfinished workflow;
- two SAGAs competing for the same stock;
- stale or out-of-order events;
- a compensation racing with successful completion;
- duplicate event delivery;
- a user retrying while the first request is still progressing.

Controls include:

- explicit state machines;
- optimistic locking;
- database uniqueness;
- idempotency keys;
- event IDs and processed-event records;
- version or sequence checks;
- reservation expiry;
- ownership of one aggregate by one service.

## Idempotency

At-least-once messaging means a handler may receive the same event more than
once. Processing the duplicate must not repeat the business effect.

Common techniques:

- unique business keys;
- a `processed_events` or inbox table keyed by event ID;
- checking the aggregate's current state;
- compare-and-set state transitions;
- database unique constraints;
- idempotency keys on external commands.

An existence check without a database constraint can still race under
concurrency. Strong idempotency should be enforced by durable storage.

---

## Transactional Outbox Pattern

The transactional outbox solves the dual-write problem. For a focused
problem/solution and implementation guide, see
[Transactional outbox pattern](OUTBOX-PATTERN.md). For the consumer-side
deduplication partner, see [Inbox pattern](INBOX-PATTERN.md).

## The Dual-Write Failure

Without an outbox:

```java
orderRepository.save(order);
kafkaTemplate.send("order.created", event);
```

The database commit and Kafka send are separate operations. Failures create
inconsistent outcomes:

| Database | Kafka | Result |
|---|---|---|
| commit | send succeeds | expected |
| commit | send fails | state changed but no event |
| rollback | send succeeds | event describes state that does not exist |

No ordinary local transaction can atomically commit a MySQL update and a Kafka
send.

## Outbox Solution

Write the domain change and an event record to the same database transaction:

```mermaid
flowchart TB
    BEGIN["Begin local DB transaction"] --> DOMAIN["Update domain tables"]
    DOMAIN --> OUTBOX["Insert outbox row"]
    OUTBOX --> COMMIT{"Commit"}
    COMMIT -->|"Success"| DURABLE["Domain state and event are durable"]
    COMMIT -->|"Failure"| ROLLBACK["Both roll back"]
    DURABLE --> PUBLISHER["Separate outbox publisher"]
    PUBLISHER --> BROKER["Kafka or another broker"]
```

The outbox row is durable evidence that an event still needs publication.

## Typical Outbox Schema

```text
id
aggregate_type
aggregate_id
event_type
topic
message_key
payload
correlation_id
status
publish_attempts
created_at
published_at
next_attempt_at
last_error
```

Useful indexes include:

```text
(status, next_attempt_at, created_at)
```

The event should also have a globally unique event ID when consumers use an
inbox or processed-event table.

## Writer Transaction

```java
@Transactional
public void changeState(Command command) {
    Aggregate aggregate = repository.save(...);
    outboxRepository.save(OutboxEvent.from(aggregate));
}
```

If serialization or outbox insertion fails, the transaction must fail. Do not
catch and ignore that failure, because the domain update would then commit
without a recoverable event.

## Publisher Transaction

A polling publisher usually:

1. selects eligible pending rows;
2. claims or locks a bounded batch;
3. sends each event;
4. waits for broker acknowledgement;
5. marks the row published;
6. records attempts and errors on failure.

Use short transactions and bounded batches. Multiple publisher replicas need a
claiming strategy such as row locking, skip-locked selection, or atomic status
updates.

## Polling Publisher Versus CDC

### Polling

The application queries the outbox table on a schedule.

Advantages:

- simple application ownership;
- no separate change-data-capture platform;
- easy to understand in a POC.

Trade-offs:

- database polling load;
- publication delay;
- concurrency and cleanup logic reside in the application.

### Change Data Capture

A CDC tool reads the database transaction log and publishes new outbox rows.

Advantages:

- low-latency publication;
- less application polling;
- scales well for high event volume.

Trade-offs:

- additional infrastructure and operational knowledge;
- connector offsets, schema evolution, and failure recovery must be managed.

Debezium is a common CDC implementation, but the pattern is not tied to one
product.

## Delivery Guarantee

The outbox prevents **lost events after a committed domain change**, but it
does not create global exactly-once processing.

A crash can occur after Kafka accepts an event but before the publisher marks
the row `PUBLISHED`:

```text
Kafka accepted event
        |
        v
Publisher process crashes
        |
        v
Outbox row still appears pending
        |
        v
Event is published again
```

Therefore, outbox delivery is normally at least once. Consumers must be
idempotent.

## SAGA Implementation Maturity

Many systems implement the first working SAGA path before they implement every
failure guard. Document the maturity level explicitly:

| Level | Typical evidence |
|---|---|
| Happy-path choreography | Events move the workflow through the expected success path. |
| Recoverable local transactions | Each service commits domain state and outgoing event intent atomically. |
| Idempotent consumption | Duplicate messages and client retries do not duplicate business effects. |
| Operational baseline | DLT, replay audit, correlation IDs, metrics, and bounded retries exist. |
| Production hardening | Event IDs, schema versioning, inbox/processed-event tables, backoff, terminal failure, alerting, and replay policy are in place. |

When writing architecture docs, do not collapse these levels into one word such
as "reliable". State exactly which guarantees exist and which are target
hardening work.

## Ordering

Global ordering is expensive and usually unnecessary. Preserve ordering only
where the domain requires it:

- use the aggregate ID as the broker message key;
- keep events for one aggregate in one partition;
- store aggregate version or sequence number;
- reject or defer stale transitions.

Concurrent publishers must not reorder events for the same aggregate.

## Retry And Backoff

A production publisher should support:

- attempt count;
- exponential backoff with jitter;
- `next_attempt_at`;
- maximum attempts or terminal failed status;
- alerts for old pending and terminal rows;
- operator replay after root-cause correction.

Retrying every failed row on every scheduler tick can overload the database,
broker, and logs during a prolonged outage.

## Cleanup And Retention

Published rows should not grow forever. Options include:

- delete after a retention period;
- archive to cheaper storage;
- partition the table by date;
- retain failures longer than successes.

Cleanup must not remove pending or still-required audit records.

## Observability

Monitor:

- pending row count;
- age of the oldest pending row;
- publication success/failure rate;
- attempt count;
- publish latency from `created_at` to `published_at`;
- terminal failures;
- consumer lag and duplicate handling.

Log event ID, aggregate ID, event type, topic, and correlation ID. Do not log
sensitive payloads by default.

## Outbox Production Practices

1. Insert domain state and outbox row in one local transaction.
2. fail the transaction when event serialization fails.
3. assign a unique event ID.
4. use a stable aggregate message key.
5. publish bounded batches.
6. coordinate multiple publishers safely.
7. wait for broker acknowledgement before marking published.
8. make consumers idempotent.
9. use bounded retry and backoff.
10. monitor pending age, not only pending count.
11. define cleanup and replay policies.
12. evolve event schemas compatibly.

## Related Guides

- [Shopverse SAGA and outbox implementation](SAGA-OUTBOX.md)
- [Apache Kafka](../integration/APACHE-KAFKA.md)
- [Spring Kafka](../spring/SPRING-KAFKA.md)
- [Shopverse transactions](TRANSACTIONS.md)
- [Spring transaction concepts](../spring/SPRING-TRANSACTIONS.md)
- [Distributed systems](../architecture/DISTRIBUTED-SYSTEMS.md)
