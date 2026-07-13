---
title: "Platform Config Property Reference"
description: "Platform Config Property Reference: practical concepts, Shopverse context, production trade-offs, and operational guidance."
sidebar_label: "Platform Config Property Reference"
tags:
  - "platform"
  - "shopverse"
  - "production"
page_type: "Guide"
difficulty: "Intermediate"
status: "maintained"
last_reviewed: "2026-07-13"
---
# Platform Config Property Reference

This page lists the service configuration consumed by the platform modules.

## Observability Starter

Prefix:

```yaml
shopverse:
  observability:
    request-logging:
```

| Property | Default | Purpose |
|---|---:|---|
| `shopverse.observability.request-logging.enabled` | `true` | Enables the servlet request logging filter |
| `shopverse.observability.request-logging.service-name` | `spring.application.name`, fallback `UNKNOWN-SERVICE` | Service tag used in logs and metrics |
| `shopverse.observability.request-logging.metric-name` | `shopverse.service.requests.logged` | Counter name for logged requests |
| `shopverse.observability.request-logging.actuator-path-prefix` | `/actuator/` | Paths excluded from normal request logging |

Example:

```yaml
shopverse:
  observability:
    request-logging:
      enabled: true
      service-name: payment-service
      metric-name: shopverse.service.requests.logged
      actuator-path-prefix: /actuator/
```

## Security Starter

The security starter uses standard Spring resource-server configuration plus
the local issuer property.

| Property | Required | Purpose |
|---|---|---|
| `security.jwt.issuer` | yes | Expected token issuer |
| `spring.security.oauth2.resourceserver.jwt.jwk-set-uri` | yes | JWKS endpoint used by the JWT decoder |

Example:

```yaml
security:
  jwt:
    issuer: http://auth-service:8081

spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          jwk-set-uri: http://auth-service:8081/.well-known/jwks.json
```

## Outbox Starter

Prefix:

```yaml
shopverse:
  outbox:
```

| Property | Default | Purpose |
|---|---:|---|
| `shopverse.outbox.batch-size` | `50` | Maximum pending event IDs loaded per publish cycle |
| `shopverse.outbox.publish-delay-ms` | `1000` | Delay between scheduled publish cycles |
| `shopverse.outbox.claim-timeout-ms` | `30000` | Processing claim age after which the starter releases stale claims |
| `shopverse.outbox.send-timeout-seconds` | `10` | Maximum wait for Kafka send completion |

Example from shared config:

```yaml
shopverse:
  outbox:
    publish-delay-ms: ${OUTBOX_PUBLISH_DELAY_MS:1000}
    send-timeout-seconds: ${OUTBOX_SEND_TIMEOUT_SECONDS:10}
    claim-timeout-ms: ${OUTBOX_CLAIM_TIMEOUT_MS:30000}
```

## Kafka Recovery Starter

Prefix:

```yaml
shopverse:
  kafka-recovery:
```

| Property | Default | Purpose |
|---|---:|---|
| `shopverse.kafka-recovery.service-name` | `unknown` | Service tag for recovery logs and metrics |
| `shopverse.kafka-recovery.replay-metric-name` | `shopverse.kafka.dlt.replays` | Counter name for replay attempts |
| `shopverse.kafka-recovery.failed-metric-name` | `shopverse.kafka.dlt.events` | Counter name for recorded failed events |

Example:

```yaml
shopverse:
  kafka-recovery:
    service-name: payment
    replay-metric-name: shopverse.kafka.dlt.replays
    failed-metric-name: shopverse.kafka.dlt.events
```

Configured services:

- `payment`
- `inventory`
- `order`

## Kafka Starter

`shopverse-kafka-starter` does not currently define custom configuration
properties. It auto-configures `KafkaEventParser` using the existing
`ObjectMapper`.

## Common Error And Web Modules

`shopverse-common-error` and `shopverse-web` do not define configuration
properties.
