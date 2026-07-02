# Duplicate Logic Solutions

This directory documents the platform-infrastructure duplication that was
removed from Shopverse services.

## Boundary

Shared platform modules may contain:

- authentication infrastructure
- request correlation and logging
- Kafka parsing and recovery mechanics
- outbox publishing mechanics
- API/web transport helpers

Shared platform modules must not contain:

- order, payment, inventory, product, customer, stock, or checkout models
- domain state transitions
- service-specific endpoint authorization rules
- service database schema ownership

## Implemented Solutions

| Problem | Solution page |
|---|---|
| Repeated API error DTO | [Common Error Contract](common-error.md) |
| Pagination helpers isolated in User Service | [Shared Web Pagination](web-pagination.md) |
| Repeated request logging filters | [Observability Starter](observability.md) |
| Repeated JWT resource-server plumbing | [Security Starter](security.md) |
| Repeated Kafka listener parsing | [Kafka Event Parsing](kafka-parsing.md) |
| Repeated outbox publishing mechanics | [Outbox Starter](outbox.md) |
| Repeated DLT persistence/replay flow | [Kafka Recovery Starter](kafka-recovery.md) |
