# Transactions

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

## Proxy Rules

`@Transactional` is applied by a Spring proxy. Calls from one method to another on `this` do not cross the proxy and therefore do not start a new propagation boundary. Shopverse uses a separate outbox worker bean so `REQUIRES_NEW` is effective.

## Isolation And Locking

Inventory uses optimistic version checks. Outbox publication uses a row lock during state change. Keep transactions short so lock wait and deadlock risk remain bounded.

When a deadlock occurs, the database chooses a victim and rolls it back. Retry only the complete idempotent unit of work with a small bounded policy.

## Kafka Transactions

Kafka producer idempotence is enabled, but Shopverse does not currently use a single Kafka transaction spanning consume-process-produce. Database and Kafka cannot share one native transaction. The transactional outbox is the chosen consistency mechanism.

## Rollback Scenarios

- order save fails: no order, timeline, or outbox row commits;
- inventory reservation fails: stock and outgoing event roll back together;
- payment persistence fails: no payment outcome event commits;
- Kafka unavailable after database commit: outbox remains pending/failed and can be retried;
- downstream SAGA failure: compensation performs a new business transaction.

Compensation is not rollback. It is a later, auditable state transition.
