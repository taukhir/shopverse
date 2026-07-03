# Duplicate Logic Solutions

Back to [Platform Infrastructure](./README.md).

This page documents the platform-infrastructure duplication that was removed
from Shopverse services.

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
| Repeated API error DTO | [Common Error Contract](./COMMON-ERROR.md) |
| Pagination helpers isolated in User Service | [Shared Web Pagination](./WEB-PAGINATION.md) |
| Repeated request logging filters | [Observability Starter](./OBSERVABILITY-STARTER.md) |
| Repeated JWT resource-server plumbing | [Security Starter](./SECURITY-STARTER.md) |
| Repeated Kafka listener parsing | [Kafka Event Parsing](./KAFKA-PARSING.md) |
| Repeated outbox publishing mechanics | [Outbox Starter](./OUTBOX-STARTER.md) |
| Repeated DLT persistence/replay flow | [Kafka Recovery Starter](./KAFKA-RECOVERY-STARTER.md) |

## Operational References

- [Migration Checklist](./MIGRATION-CHECKLIST.md)
- [Before And After File Inventory](./BEFORE-AFTER-FILES.md)
- [Config Property Reference](./CONFIG-PROPERTIES.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

## General Adoption Flow

Each service consumes the platform modules through the local composite build.

```groovy
// settings.gradle in the service
rootProject.name = 'payment-service'

includeBuild('../shopverse-platform')
```

Then add only the modules that service actually needs.

```groovy
dependencies {
    implementation 'io.shopverse.platform:shopverse-observability-starter:0.0.1-SNAPSHOT'
    implementation 'io.shopverse.platform:shopverse-security-starter:0.0.1-SNAPSHOT'
    implementation 'io.shopverse.platform:shopverse-kafka-starter:0.0.1-SNAPSHOT'
}
```

After the dependency is added, remove the duplicated local infrastructure class
and either inject the platform bean directly or add a small service-local
adapter. Adapters are used when the platform needs to call service-owned
repositories or outbox services.

## What Stays Local

Do not move domain types into `shopverse-platform`.

Examples that stay in services:

- `Order`, `Payment`, `Inventory`, `Product`, `Cart`, `Stock`, `Customer`
- domain event payload records
- endpoint authorization rules
- database entities and Liquibase changelogs
- repositories
- controllers and response DTOs
- business workflow methods such as reserve inventory, capture payment, or cancel order
