# ADR 002: Kafka Choreography SAGA for Checkout

## Context

Checkout spans order creation, inventory reservation, and payment processing.
A single distributed database transaction would couple services and reduce
resilience.

## Decision

Use Kafka choreography with service-owned state, transactional outbox tables,
idempotent handlers, DLT persistence, replay audit, and compensation paths.

## Consequences

- Each service owns its data and transaction boundary.
- Checkout can continue through asynchronous events.
- Failure states remain visible through timelines and audit tables.
- Compensation logic is explicit instead of hidden in infrastructure.
- The design is operationally more complex than synchronous calls, so
  observability and replay tooling are required parts of the architecture.
