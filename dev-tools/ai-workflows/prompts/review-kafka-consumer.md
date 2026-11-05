# Review A Kafka Consumer

Use this workflow before changing a consumer or reviewing event-driven code.

## Inputs

```text
Consumer/service: [name]
Listener symbol: [symbol or discover it]
Consumed event/topic: [name or discover it]
Business side effect: [expected effect]
Review scope: [files, diff, or branch]
```

## Workflow Prompt

```text
Review without editing. Trace the consumer from deserialization to acknowledgment
and every local side effect. Cite files, symbols, configuration, migrations, and
tests for each material claim.

Analyze:
- event identity, aggregate identity, Kafka key, topic, partition, and schema;
- consumer group, concurrency, acknowledgment, and transaction boundaries;
- database mutation and outbox enqueue atomicity;
- duplicate delivery before, during, and after transaction commit;
- concurrent delivery of the same business event;
- stale and out-of-order events and valid state transitions;
- retryable versus terminal failures;
- backoff, retry topic, DLT persistence, replay, and audit behavior;
- poison messages and deserialization failures;
- metrics, logs, traces, correlation, and sensitive-data handling;
- shutdown, rebalance, and partial-processing behavior;
- unit, database integration, concurrency, and replay tests.

Distinguish Kafka offset, idempotency key, aggregate ID, and inbox/event ID. Do
not describe at-least-once delivery as global exactly-once processing.

If an inbox pattern is present, verify that the uniqueness constraint and domain
mutation share the intended local transaction, rollback permits retry, and
duplicates return without repeating side effects. If no inbox is implemented,
state the actual deduplication mechanism rather than assuming one.

Return findings ordered by severity. Every finding must include a concrete
failure scenario, evidence, smallest remediation, and regression test. End with
verified strengths, missing evidence, and residual risk.
```

## Stop Conditions

Stop and request a design decision before recommending changes to event schemas,
partition keys, topic topology, delivery guarantees, database constraints, or
cross-service compensation contracts.
