# Transactions

This file records Shopverse's implemented transaction boundaries. See
[Spring and Kafka transactions](TRANSACTIONS-GENERIC.md) for propagation,
isolation, rollback, proxy internals, locking, Kafka transactions, and
production guidance.

## Spring Transactions

Service classes default to `@Transactional(readOnly = true)`. State-changing methods override this with `@Transactional`.

```java
@Transactional
public OrderResponse checkout(...) {
    // order, items, timeline, and outbox commit together
}
```

Unchecked exceptions mark the transaction for rollback by default. Do not catch and suppress an exception when the operation must roll back.

## Boundaries

- controllers validate and delegate; they do not own transactions;
- one service transaction touches only that service's database;
- remote Feign and Kafka calls are not held inside long database transactions;
- outbox insertion is part of the domain transaction;
- outbox publication uses `REQUIRES_NEW` per record;
- outbox insertion requires an existing transaction through `MANDATORY`.

The inventory SAGA step demonstrates the atomic local boundary:

```java
@Transactional
public void handleOrderCreated(OrderCreatedEvent event) {
    boolean reserved = inventoryService.reserve(...);
    Object outgoingEvent = reserved
            ? new InventoryReservedEvent(...)
            : new InventoryFailedEvent(...);
    outboxService.enqueue(..., outgoingEvent, event.correlationId());
}
```

The stock change and outgoing event either commit together or roll back
together.

`OutboxService` rejects calls outside an existing domain transaction:

```java
@Transactional(propagation = Propagation.MANDATORY)
public void enqueue(...) {
    repository.save(new OutboxEvent(...));
}
```

The publisher processes each event independently:

```java
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void publish(Long eventId) {
    OutboxEvent event = repository.findByIdForUpdate(eventId).orElse(null);
    // publish and update this outbox row
}
```

## Proxy Rules

`@Transactional` is applied by a Spring proxy. Calls from one method to another on `this` do not cross the proxy and therefore do not start a new propagation boundary. Shopverse uses a separate outbox worker bean so `REQUIRES_NEW` is effective.

## Isolation And Locking

Inventory uses JPA `@Version` optimistic locking to detect concurrent stock
updates. Outbox publication uses `PESSIMISTIC_WRITE` while changing one event's
publication state. Keep transactions short so lock wait and deadlock risk
remain bounded.

When a deadlock occurs, the database chooses a victim and rolls it back. Retry only the complete idempotent unit of work with a small bounded policy.

## Kafka Transactions

Kafka producer idempotence and `acks=all` are enabled in centralized
configuration. Shopverse does not configure a Kafka transaction ID prefix or a
single Kafka transaction spanning consume-process-produce. Database and Kafka
cannot share one native local transaction. The transactional outbox is the
chosen consistency mechanism.

See [SAGA and transactional outbox patterns](SAGA-GENERIC.md) for the generic
dual-write problem, writer and publisher transactions, delivery guarantees,
polling versus CDC, retries, ordering, and cleanup.

## Rollback Scenarios

- order save fails: no order, timeline, or outbox row commits;
- inventory reservation fails: stock and outgoing event roll back together;
- payment persistence fails: no payment outcome event commits;
- Kafka unavailable after database commit: outbox remains pending/failed and can be retried;
- downstream SAGA failure: compensation performs a new business transaction.

Compensation is not rollback. It is a later, auditable state transition.

## Related Guides

- [Generic transactions](TRANSACTIONS-GENERIC.md)
- [SAGA and outbox implementation](SAGA-OUTBOX.md)
- [Generic SAGA and outbox patterns](SAGA-GENERIC.md)
- [Kafka](../integration/KAFKA.md)
- [Liquibase](../data/LIQUIBASE-GENERIC.md)
