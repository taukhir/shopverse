---
title: Platform Infrastructure
---

# Platform Infrastructure

This section documents the shared infrastructure modules under
`shopverse-platform`.

Use these pages when you are removing duplicated platform code from services or
when you need to understand which starter owns a cross-cutting behavior.

## Boundary

Platform modules are infrastructure only.

They may contain:

- API error contracts
- pagination helpers
- request correlation and logging
- JWT resource-server configuration
- Kafka listener parsing
- outbox publishing mechanics
- failed Kafka event persistence and replay mechanics

They must not contain:

- order, payment, inventory, product, cart, stock, customer, or checkout models
- service-owned JPA entities
- service-owned repositories
- domain state transitions
- endpoint-specific authorization decisions

## Read In This Order

| Step | Page | Purpose |
|---:|---|---|
| 1 | [Duplicate Logic Solutions](./DUPLICATE-LOGIC.md) | Problem statement and implemented platform module map. |
| 2 | [Migration Checklist](./MIGRATION-CHECKLIST.md) | Service-by-service migration flow. |
| 3 | [Config Property Reference](./CONFIG-PROPERTIES.md) | Runtime properties exposed by starters. |
| 4 | [Troubleshooting](./TROUBLESHOOTING.md) | Common integration failures and fixes. |
| 5 | [Before And After Files](./BEFORE-AFTER-FILES.md) | Local classes removed or replaced by platform modules. |

## Module Pages

| Module | Use For |
|---|---|
| [Common Error Contract](./COMMON-ERROR.md) | Shared API error response shape. |
| [Shared Web Pagination](./WEB-PAGINATION.md) | Shared page response DTOs and pagination mapping. |
| [Observability Starter](./OBSERVABILITY-STARTER.md) | Correlation IDs, MDC, request logs, metrics tags. |
| [Security Starter](./SECURITY-STARTER.md) | Servlet resource-server JWT/JWKS setup. |
| [Kafka Event Parsing](./KAFKA-PARSING.md) | Shared listener parsing and ObjectMapper error handling. |
| [Outbox Starter](./OUTBOX-STARTER.md) | Claim, publish, stale-claim release, metrics, logging. |
| [Kafka Recovery Starter](./KAFKA-RECOVERY-STARTER.md) | Failed-event persistence and replay support. |

## Module Page Standard

Each module page follows the same structure:

- status
- purpose
- problem
- when to use
- provided API
- current service usage
- Gradle dependency
- service-owned boundary
- configuration properties
- migration steps
- verification
- troubleshooting
- related docs

Keep future platform pages in this format so service migrations are easy to
compare.

## Related Docs

- [Optimization Solutions](../reliability/problems/OPTIMIZATION-SOLUTIONS.md)
- [Shopverse Problems And Solutions](../reliability/PROBLEMS-AND-SOLUTIONS.md)
- [Spring Kafka](../spring/SPRING-KAFKA.md)
- [JWT And Spring Security](../security/JWT-OAUTH2-SPRING-SECURITY.md)
