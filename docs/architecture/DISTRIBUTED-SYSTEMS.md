# Distributed Systems In Shopverse

## Consistency Model

Shopverse does not attempt a database transaction across services. Each service commits local state and an outbox row atomically, then Kafka carries the change to the next participant. The system is eventually consistent.

## Distributed Tracing

Micrometer Tracing instruments HTTP, Feign, and Kafka. Trace and span headers describe technical execution. Zipkin receives exported spans and reconstructs the call graph.

The business `X-Correlation-Id` is separate. It survives asynchronous boundaries and identifies the complete checkout journey even when several traces are created over time.

See [MDC, correlation IDs, and tracing](../observability/MDC-CORRELATION-TRACING.md).

## Distributed Logging

Services emit structured JSON to stdout and rolling files. Promtail reads Docker output and mounted files, adds low-cardinality labels, and pushes records to Loki. Grafana queries Loki.

## Caching

Current caches use Spring Cache with local providers:

- Order, catalog, inventory, and payment use `spring.cache.type=simple`.
- User role and permission lookups use `ConcurrentMapCacheManager`.

These caches reduce repeated reads inside one service instance but are not distributed. Multiple replicas can temporarily hold different values. Redis is a future option when cross-instance invalidation becomes necessary.

## Concurrency And Locking

- Inventory uses `@Version` optimistic locking to reject concurrent stale updates.
- The reservation transaction checks available stock before decrementing it.
- Idempotency keys have database uniqueness and application-level lookup.
- Outbox workers lock records with repository `findByIdForUpdate` before publication.

These controls prevent common duplicate and overselling paths. They are not a general distributed lock. Shopverse intentionally prefers database constraints, optimistic concurrency, and idempotent processing over a global lock.

## Delivery Guarantees

- Kafka producer: `acks=all`, idempotence enabled.
- Consumer: manual offset management through record acknowledgement configuration.
- Outbox: local state and outgoing event are committed together.
- Listener retries: `@RetryableTopic(attempts = "3")`.
- Unresolved failures: DLT plus one persisted recovery record for operator inspection and replay.

Exactly-once business processing is not claimed. The design targets at-least-once delivery with idempotent state transitions.
