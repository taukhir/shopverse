# Shopverse Platform

Shared infrastructure modules for Shopverse services.

This build exists to remove repeated platform code without creating a shared
domain library. Domain concepts such as orders, payments, inventory, products,
customers, stock, and checkout rules remain owned by their services.

## Problem Statement

Shopverse services had repeated infrastructure logic across multiple codebases:

| Duplicate logic | Previous impact | Platform solution |
|---|---|---|
| JWT resource-server config | Repeated JWKS, issuer validation, and authority mapping | `shopverse-security-starter` |
| Request logging and correlation | Repeated MDC setup, correlation headers, request metrics, and actuator exclusions | `shopverse-observability-starter` |
| Kafka event parsing | Repeated `ObjectMapper` try/catch blocks in listeners | `shopverse-kafka-starter` |
| Outbox publisher | Repeated claim, publish, stale-claim release, metrics, and logging | `shopverse-outbox-starter` |
| Kafka DLT recovery | Repeated failed-event record/list/replay flow | `shopverse-kafka-recovery-starter` |
| API error response contract | Repeated response DTO shape | `shopverse-common-error` |
| Page response helpers | Pagination DTO and mapping utilities lived in one service | `shopverse-web` |

The solution is a set of small Gradle modules that provide infrastructure
contracts, helper APIs, and Spring Boot auto-configuration.

## Module Guide

| Module | Use when a service needs | Keep local |
|---|---|---|
| `shopverse-common-error` | Common API error response records | Exception classes and service-specific handler policy |
| `shopverse-web` | `PageResponse`, `PageMapper`, pagination validation | Endpoint-specific allowed sort fields |
| `shopverse-observability-starter` | Servlet request logging, MDC correlation, correlation helpers, request metrics | Reactive gateway filters and service-specific log messages that are not common |
| `shopverse-security-starter` | Servlet resource-server JWT decoder, issuer validation, roles/permissions authority mapping | Endpoint authorization rules, Basic auth, token issuing, gateway reactive security |
| `shopverse-kafka-starter` | Shared Kafka event payload parsing | Event payload records and listener business handling |
| `shopverse-outbox-starter` | Outbox publisher loop, worker, metrics, Kafka send, shared store contract | Outbox entity, repository, table schema, event creation |
| `shopverse-kafka-recovery-starter` | DLT failed-event record/list/replay flow and contracts | Failed-event entity, repository, response DTO, controller endpoints |

## Solution Pages

- [Duplicate Logic Overview](docs/duplicate-logic/README.md)
- [Common Error Contract](docs/duplicate-logic/common-error.md)
- [Shared Web Pagination](docs/duplicate-logic/web-pagination.md)
- [Observability Starter](docs/duplicate-logic/observability.md)
- [Security Starter](docs/duplicate-logic/security.md)
- [Kafka Event Parsing](docs/duplicate-logic/kafka-parsing.md)
- [Outbox Starter](docs/duplicate-logic/outbox.md)
- [Kafka Recovery Starter](docs/duplicate-logic/kafka-recovery.md)

## Local Consumption

Services consume the platform build through Gradle composite builds:

```gradle
includeBuild('../shopverse-platform')
```

Then add only the modules the service actually needs:

```gradle
implementation 'io.shopverse.platform:shopverse-observability-starter:0.0.1-SNAPSHOT'
implementation 'io.shopverse.platform:shopverse-security-starter:0.0.1-SNAPSHOT'
```

## Current Adoption

| Service | Platform modules adopted |
|---|---|
| `user-service` | common error, web, observability, security |
| `order-service` | observability, security, Kafka parsing, outbox, Kafka recovery |
| `payment-service` | observability, security, Kafka parsing, outbox, Kafka recovery |
| `inventory-service` | observability, security, Kafka parsing, outbox, Kafka recovery |
| `auth-service` | observability |
| `config-server` | observability |
| `discovery-server` | observability |

`api-gateway` is reactive Spring WebFlux and is intentionally not migrated to
the servlet starters.

## Verification

Run module tests from the repository root with an available JDK:

```powershell
.\order-service\gradlew.bat -p shopverse-platform build --no-daemon
```

Run service tests from each service:

```powershell
.\payment-service\gradlew.bat -p payment-service test --no-daemon
```
