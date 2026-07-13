---
title: "Platform Migration Checklist"
description: "Platform Migration Checklist: practical concepts, Shopverse context, production trade-offs, and operational guidance."
sidebar_label: "Platform Migration Checklist"
tags:
  - "platform"
  - "shopverse"
  - "production"
page_type: "Guide"
difficulty: "Intermediate"
status: "maintained"
last_reviewed: "2026-07-13"
---
# Platform Migration Checklist

Use this checklist when moving duplicate infrastructure logic from a service
into `shopverse-platform`.

## Service Checklist

| Service | Platform modules | Required local adapters | Keep local |
|---|---|---|---|
| `user-service` | `shopverse-common-error`, `shopverse-web`, `shopverse-observability-starter`, `shopverse-security-starter` | none | exception status policy, endpoint authorization, allowed page sort fields |
| `order-service` | `shopverse-common-error`, `shopverse-observability-starter`, `shopverse-security-starter`, `shopverse-kafka-starter`, `shopverse-outbox-starter`, `shopverse-kafka-recovery-starter` | `OrderOutboxEventStore`, `OrderFailedKafkaEventStore`, `OrderKafkaReplayOutbox` | order entities, order events, repositories, outbox schema |
| `payment-service` | `shopverse-common-error`, `shopverse-observability-starter`, `shopverse-security-starter`, `shopverse-kafka-starter`, `shopverse-outbox-starter`, `shopverse-kafka-recovery-starter` | `PaymentOutboxEventStore`, `PaymentFailedKafkaEventStore`, `PaymentKafkaReplayOutbox` | payment entities, payment events, repositories, outbox schema |
| `inventory-service` | `shopverse-common-error`, `shopverse-observability-starter`, `shopverse-security-starter`, `shopverse-kafka-starter`, `shopverse-outbox-starter`, `shopverse-kafka-recovery-starter` | `InventoryOutboxEventStore`, `InventoryFailedKafkaEventStore`, `InventoryKafkaReplayOutbox` | inventory entities, inventory events, repositories, outbox schema |
| `auth-service` | `shopverse-observability-starter` | none | token issuing, auth-specific security, user credential logic |
| `config-server` | `shopverse-observability-starter` | none | config server behavior |
| `discovery-server` | `shopverse-observability-starter` | none | Eureka server behavior |
| `api-gateway` | not migrated to servlet starters | none | reactive WebFlux filters and gateway security |

## Per-Service Steps

1. Add the platform composite build.

```groovy
// settings.gradle
includeBuild('../shopverse-platform')
```

2. Add only the platform dependencies the service uses.

```groovy
dependencies {
    implementation 'io.shopverse.platform:shopverse-observability-starter:0.0.1-SNAPSHOT'
    implementation 'io.shopverse.platform:shopverse-security-starter:0.0.1-SNAPSHOT'
}
```

3. Remove local infrastructure classes that duplicate the starter.

Examples:

- request logging filters
- JWT authority converters
- Kafka parser try/catch helpers
- outbox publisher loops
- failed Kafka event replay services

4. Add service-local adapters only where the starter must call service-owned
repositories or outbox services.

Adapters are needed for:

- `OutboxEventStore`
- `FailedKafkaEventStore`
- `KafkaReplayOutbox`

5. Keep domain and API policy in the service.

Do not move:

- JPA entities
- repositories
- Liquibase changelogs
- event payload records
- controller endpoints
- endpoint authorization rules
- service business workflows

6. Add service configuration where the starter needs it.

```yaml
shopverse:
  kafka-recovery:
    service-name: payment
```

7. Run the service tests and the docs build.

```powershell
.\gradlew.bat test --no-daemon
```

```powershell
cd documentation
npm.cmd run build
```
