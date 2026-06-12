# Distributed Systems In Shopverse

A distributed system fails differently from a single application. A service
can commit while another is unavailable, a response can be lost after work
succeeds, messages can be duplicated, clocks can differ, and caches can become
stale.

Shopverse demonstrates practical controls for these problems without claiming
global ACID or exactly-once business processing.

## System Guarantees

| Area | Current guarantee |
|---|---|
| Service database update | local ACID transaction |
| Domain update plus outgoing event | atomic local outbox write |
| Kafka delivery | at least once |
| Event ordering | per partition; order number is the key |
| Checkout retry | idempotency key plus database uniqueness |
| Inventory concurrency | optimistic version check |
| Outbox publisher concurrency | pessimistic row lock |
| Cross-service state | eventual and semantic consistency |
| DLT persistence deduplication | application-level baseline, not race-safe |
| Cache consistency | per-instance local cache only |

## CAP And Trade-Offs

During a network partition, a distributed service cannot guarantee both
immediate consistency and availability for every operation.

Shopverse chooses:

- local consistency inside each service database;
- availability of independently healthy services;
- eventual convergence through Kafka and compensation;
- explicit failure states rather than pretending all services commit together.

Checkout can return an Order resource while Inventory or Payment remains
pending. The timeline exposes that intermediate state.

## Partial Failure

Example:

```text
Order commits successfully
Kafka is unavailable
Inventory never receives order.created yet
```

Without recovery, this is a lost workflow. Shopverse writes an outbox row in
the same transaction as the Order:

```java
@Transactional
public OrderResponse checkout(...) {
    OrderEntity order = orderRepository.save(...);
    outboxService.enqueue(...);
    return map(order);
}
```

The durable pending row allows publication after Kafka recovers.

## Dual Writes And Transactional Outbox

This is unsafe:

```java
repository.save(order);
kafkaTemplate.send(topic, payload);
```

MySQL and Kafka do not share one native local commit. The database can commit
while sending fails, or Kafka can accept an event before the database rolls
back.

Shopverse uses:

```text
transaction 1:
  domain update
  outbox insert
  commit

transaction 2:
  lock outbox row
  publish to Kafka
  mark published
```

The remaining failure window can produce a duplicate, not a lost event: Kafka
may accept a record before the publisher crashes without marking it published.
Consumers must therefore be idempotent.

## SAGA And Eventual Consistency

The checkout SAGA is choreography-based:

```text
Order created
  -> Inventory reserved
  -> Payment completed
  -> Order confirmed
```

Each arrow represents a later local transaction. Intermediate disagreement is
expected:

```text
Payment = CAPTURED
Order = PAYMENT_PROCESSING
payment.completed event = waiting for Order consumer
```

This state is acceptable when the event remains durable and the system
converges. Compensation handles business failure:

```text
Payment declined
  -> Order becomes PAYMENT_FAILED
  -> Inventory reservation becomes RELEASED
```

Compensation is not rollback. It is a new auditable transaction.

## Idempotency And Duplicate Delivery

Duplicates can come from:

- client retries after a response timeout;
- producer retry or outbox republish;
- consumer crash before offset commit;
- DLT replay;
- operator or test re-publication.

Shopverse controls include:

- unique checkout idempotency key;
- order number as stable aggregate key;
- unique order/payment relationship;
- state-aware transition methods;
- optimistic version checks;
- release logic that cannot release more than reserved;
- audited replay.

An existence check alone is not concurrency-safe:

```java
if (!repository.existsByEventId(eventId)) {
    repository.save(...);
}
```

Two transactions can both observe absence. The production solution is a
database unique constraint and transactional inbox:

```java
@Transactional
public void consume(Event event) {
    processedEvents.insertUnique(event.eventId(), consumerName);
    applyBusinessChange(event);
    outboxService.enqueue(...);
}
```

Universal event IDs and an inbox are planned rather than currently complete.

## Message Ordering

Kafka guarantees order inside a partition. Shopverse uses order number as the
key, so events for one order normally share a partition.

Ordering can still be affected by:

- retry topics, which allow later main-topic records to progress;
- replay;
- producers using inconsistent keys;
- events representing stale aggregate versions.

Production event contracts should carry `eventId`, `aggregateId`,
`aggregateVersion`, `occurredAt`, and `schemaVersion`. Consumers can then reject
or defer stale transitions.

## Concurrency And Locks

### Optimistic Inventory Lock

```java
@Version
private long version;
```

Two buyers can read the same stock version, but only one update succeeds. The
loser receives an optimistic locking exception and must retry the complete
idempotent operation or return a conflict.

### Pessimistic Outbox Lock

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
Optional<OutboxEvent> findByIdForUpdate(Long id);
```

This prevents two publisher workers from changing the same outbox row
concurrently. The transaction must remain short.

### Database Constraints

Uniqueness provides the final invariant for idempotency and one-to-one business
relationships. Application pre-checks improve error messages but do not replace
constraints.

### Distributed Locks

Shopverse does not currently use Redis, ZooKeeper, or another global lock.
That is intentional: a database-owned aggregate is usually safer with local
constraints and optimistic locking. Distributed locks add lease expiry,
fencing, clock, and split-brain concerns.

Use a distributed lock only when one resource truly has no single durable
owner, and use fencing tokens so an expired lock holder cannot write stale
state.

## Database Isolation And Deadlocks

Transactions are kept within one service database. Deadlocks can still occur
when transactions lock rows in different order.

Controls:

- access rows in a consistent order;
- index update predicates;
- keep transactions short;
- do not call remote services while holding locks;
- bound batches;
- monitor lock waits and deadlocks;
- retry only the complete idempotent unit with bounded backoff.

Increasing isolation to `SERIALIZABLE` is not a universal fix; it can reduce
throughput and increase serialization failures.

## Delivery, Retry, And Poison Events

Shopverse uses:

```text
producer: acks=all + idempotence
consumer: auto commit disabled + RECORD acknowledgment
listener: @RetryableTopic(attempts = "3")
terminal: DLT + persisted failed_kafka_events record
```

Retry only transient failures. Malformed payloads and invalid permanent state
should reach recovery quickly rather than consume resources repeatedly.

One poison event should represent one unresolved operator incident. Current
Shopverse code suppresses common duplicates by source topic and payload, but a
unique event identity and database constraint are still needed for a strict
concurrency guarantee.

## Backpressure And Consumer Lag

If producers create records faster than consumers commit them, lag grows.

Possible causes:

- slow SQL or lock contention;
- remote calls inside listener processing;
- poison-event retry loops;
- too few partitions or consumers;
- one hot message key;
- database connection-pool exhaustion;
- frequent rebalances.

Response:

1. measure processing duration and lag trend;
2. remove unnecessary work and remote waits;
3. fix poison events;
4. add partitions and consumers only when work can run concurrently;
5. cap concurrency at database/downstream capacity;
6. use bounded queues and retry budgets.

More consumers can amplify a failing database. Scaling is not a substitute for
finding the bottleneck.

## Timeouts, Retries, And Cascading Failure

Every remote call needs a deadline. A retry consumes additional time and load.
Nested gateway, Feign, and service retries can multiply one client request into
many downstream attempts.

Production rules:

- retry only transient and safe/idempotent operations;
- keep total retries inside the caller deadline;
- use exponential backoff and jitter;
- use circuit breakers to stop repeated unhealthy calls;
- use bulkheads to protect threads/connections;
- use rate limits for admission control;
- expose degraded behavior rather than hiding permanent errors.

## Service Discovery Failure

Eureka provides a registry, not a guarantee that an instance is currently
healthy. Registrations can be stale during failure detection.

Controls include:

- health checks and lease expiry;
- client connection/read timeouts;
- bounded retry to another instance for safe calls;
- circuit breakers;
- readiness that includes critical local dependencies;
- monitoring registered and actually reachable instances.

## Cache Consistency

Current caches are local:

- Order, catalog, Inventory, and Payment use Spring's simple cache provider.
- User role and permission lookups use `ConcurrentMapCacheManager`.

Advantages:

- no network dependency;
- simple and fast for one replica.

Limitations:

- each replica can hold different data;
- eviction on one instance does not invalidate others;
- data is lost on restart;
- cache stampedes remain possible.

Redis is appropriate only when multi-replica consistency, shared rate state,
or distributed invalidation is required. A distributed cache still needs TTL,
key design, invalidation, serialization compatibility, failure behavior, and
stampede protection.

## Tracing, Logging, And Correlation

Micrometer tracing instruments supported HTTP, Feign, and Kafka boundaries.
Zipkin stores technical traces. Structured JSON logs are collected by Promtail
and stored in Loki.

`X-Correlation-Id` identifies the wider business journey. A SAGA can use one
correlation ID across several trace IDs.

```text
correlation ID -> complete checkout and recovery
trace ID       -> one technical distributed execution
span ID        -> one operation
```

Metrics must not use these high-cardinality IDs as labels.

## Clock And Time

Distributed clocks can differ. Do not infer strict global ordering only from
timestamps.

Use:

- Kafka partition offset for order inside a partition;
- aggregate version for domain ordering;
- database-generated audit timestamps for one schema;
- UTC timestamps in contracts and logs;
- NTP/time synchronization for operational accuracy.

## Schema And Deployment Compatibility

Services deploy independently, so consumers can receive events from an older or
newer producer.

Use:

- additive fields;
- explicit schema versions;
- tolerant readers;
- contract tests;
- expand-and-contract database migrations;
- no simultaneous breaking event and consumer deployment.

Java record duplication across services is suitable for the POC but a governed
event contract strategy is required at scale.

## Security In A Distributed System

- Validate JWTs in every resource service.
- Authorize resource ownership, not only routes.
- Use TLS and service identities for production traffic.
- Protect Kafka with authentication, ACLs, and encryption.
- Keep secrets outside images and Git.
- Restrict internal APIs at the network and application layers.
- Treat correlation IDs and headers as untrusted input.
- Redact credentials and personal/payment data from logs and events.
- Apply least-privilege database accounts per service.

## Production Problem Matrix

| Problem | Signal | Current/Recommended response |
|---|---|---|
| Kafka unavailable | pending outbox, publish failures | retain outbox, bounded retry/backoff, alert oldest age |
| Consumer slow | rising lag and SAGA duration | profile handler, remove waits, then scale partitions/consumers |
| Duplicate event | repeated transition or constraint error | idempotent state, unique event inbox |
| Poison event | retry and DLT activity | persist once, fix cause, audited replay |
| Overselling race | optimistic-lock conflicts | versioning, fresh retry, database invariant |
| Deadlock | DB victim rollback | consistent lock order, short transactions, bounded retry |
| Stale cache | replicas disagree | TTL/invalidation or shared Redis when justified |
| Service outage | timeout/circuit opens | bounded retry, breaker, fallback, SAGA recovery |
| Lost response | client retries successful work | idempotency key and stable lookup |
| Breaking deployment | deserialization/SQL failures | compatible schemas and expand-contract |
| Disk exhaustion | broker/log/database failures | retention, quotas, alerts, capacity planning |
| Cardinality explosion | Prometheus/Loki cost | bounded labels; IDs remain fields |

## Related Guides

- [System design](SYSTEM-DESIGN.md)
- [Spring Transactions](../spring/SPRING-TRANSACTIONS.md)
- [SAGA and outbox](../reliability/SAGA-GENERIC.md)
- [Apache Kafka](../integration/APACHE-KAFKA.md)
- [Spring Kafka](../spring/SPRING-KAFKA.md)
- [Resilience4j](../reliability/RESILIENCE4J-GENERIC.md)
- [Observability](../observability/OBSERVABILITY.md)
