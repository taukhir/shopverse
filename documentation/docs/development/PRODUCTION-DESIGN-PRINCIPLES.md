---
title: "Production Design Principles"
description: "Production Design Principles with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "Production Design Principles"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Production Design Principles

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

## DRY

DRY means one authoritative representation of knowledge. It does not mean that
all visually similar code must be generalized.

Good uses:

- common correlation header names;
- event topic configuration;
- shared error response conventions;
- one canonical documentation page per cross-cutting concept.

Poor uses:

- a generic service base class that hides unrelated domain behavior;
- sharing JPA entities between independently owned microservices;
- one universal DTO for unrelated API contracts.

Prefer small duplication over the wrong abstraction. Extract after the shared
concept is understood.

## Cohesion And Coupling

High cohesion keeps related behavior together. Low coupling minimizes the
knowledge one component has about another.

```text
Order Service owns order state and timeline.
Inventory Service owns stock and reservations.
Payment Service owns payment state.
Kafka events expose outcomes without sharing database tables.
```

## Composition Over Inheritance

Spring applications generally benefit from constructor-injected collaborators:

```java
@Service
@RequiredArgsConstructor
class CheckoutService {
    private final OrderRepository orders;
    private final CatalogService catalog;
    private final OutboxService outbox;
}
```

Composition makes dependencies visible and avoids fragile base-class behavior.

## Tell, Do Not Ask

Put state transitions on the domain object when they enforce invariants:

```java
event.claim();
event.markPublished();
event.markFailed(exception);
```

This is stronger than exposing setters that allow invalid combinations such as
`PUBLISHED` with no publication timestamp.

## Fail Explicitly

Do not encode infrastructure failures as successful empty values:

```java
throw new ServiceUnavailableException(
        "Inventory catalog is temporarily unavailable",
        cause
);
```

Callers can distinguish a retryable `503` from a genuine `404`.

## Immutability

Use records for immutable messages and configuration:

```java
record OutboxMessage(
        Long id,
        String topic,
        String messageKey,
        String payload,
        String correlationId
) {}
```

Immutable snapshots are useful when data leaves a transaction or thread.

## Boundary Validation

Validate untrusted input at HTTP and message boundaries:

```java
public record CheckoutItemRequest(
        @NotNull @Positive Long productId,
        @Positive int quantity
) {}
```

Business invariants still belong in the service/domain layer because events,
scheduled jobs, and internal calls may bypass controllers.

## Error Taxonomy

| Error class | Example | Typical HTTP status |
|---|---|---:|
| Validation | quantity is negative | 400 |
| Authentication | token missing or invalid | 401 |
| Authorization | another customer's order | 403 |
| Missing resource | product does not exist | 404 |
| Conflict | reused idempotency key with different owner | 409 |
| Dependency outage | Inventory unavailable | 503 |

## Production Review Checklist

- Is the transaction boundary smaller than external network calls?
- Can retries duplicate a write or charge?
- Is failure represented explicitly?
- Is sensitive data excluded from logs?
- Are metrics tags bounded?
- Can a worker crash leave permanent intermediate state?
- Is the query plan supported by indexes?
- Does the test verify behavior instead of implementation details?
- Is documentation marked Implemented, Partial, or Planned?

## Documentation As Engineering Evidence

Architecture documentation should preserve the difference between what exists,
what is intentionally limited, and what is planned. Treat docs as part of the
engineering system:

| Claim type | Required support |
|---|---|
| Implemented behavior | Code path, configuration, test, demo command, or observable runtime evidence |
| Operational baseline | Runbook, metric/log/trace evidence, bounded failure behavior, and known limits |
| Known gap | Impact, current mitigation, and owner or roadmap link |
| Target design | Clearly marked as planned, with migration or validation criteria |

Good docs avoid two failure modes: under-documenting real behavior so the
system looks weaker than it is, and overstating target design so readers assume
hardening already exists. Add context instead of deleting detail when a page
mixes current and future behavior.

## Related Guides

- [Design Patterns](DESIGN-PATTERNS.md)
- [HLD And LLD](../architecture/HLD-LLD.md)
- [Microservice Architecture](../architecture/MICROSERVICES-GENERIC.md)

## Recommended Next

Return to [Engineering Principles](./ENGINEERING-PRINCIPLES.md) to select the next focused guide.


## Official References

- [Spring Framework reference](https://docs.spring.io/spring-framework/reference/)
- [Spring Boot reference](https://docs.spring.io/spring-boot/reference/)
