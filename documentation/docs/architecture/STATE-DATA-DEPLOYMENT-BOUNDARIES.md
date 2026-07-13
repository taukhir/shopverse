---
title: "State, Data, Deployment, And Failure Boundaries"
description: "State, Data, Deployment, And Failure Boundaries with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "State, Data, Deployment, And Failure Boundaries"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# State, Data, Deployment, And Failure Boundaries

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

## State Machines

### Order

```mermaid
stateDiagram-v2
    [*] --> ORDER_CREATED
    ORDER_CREATED --> PENDING_INVENTORY
    PENDING_INVENTORY --> INVENTORY_RESERVED
    PENDING_INVENTORY --> INVENTORY_REJECTED
    INVENTORY_RESERVED --> PAYMENT_PROCESSING
    PAYMENT_PROCESSING --> CONFIRMED
    PAYMENT_PROCESSING --> PAYMENT_FAILED
    ORDER_CREATED --> CANCELLED
    PENDING_INVENTORY --> CANCELLED
    INVENTORY_RESERVED --> CANCELLED
```

Order timeline stages are:

```text
ORDER_CREATED
INVENTORY_RESERVED
INVENTORY_REJECTED
PAYMENT_PROCESSING
PAYMENT_COMPLETED
PAYMENT_FAILED
ORDER_CONFIRMED
ORDER_CANCELLED
```

### Payment

```mermaid
stateDiagram-v2
    [*] --> PENDING
    PENDING --> AUTHORIZED
    AUTHORIZED --> CAPTURED
    PENDING --> DECLINED
    PENDING --> TIMED_OUT
    TIMED_OUT --> CAPTURED: reconciliation
    CAPTURED --> REFUNDED
```

The stub provider supports `SUCCESS`, `DECLINE`, and `TIMEOUT`.

### Inventory Reservation

```mermaid
stateDiagram-v2
    [*] --> RESERVED
    RESERVED --> RELEASED: payment failure or compensation
    RESERVED --> EXPIRED: reservation TTL elapsed
```

## Logical Data Ownership

```mermaid
erDiagram
    USER ||--o{ USER_ROLE : has
    ROLE ||--o{ USER_ROLE : assigned
    ROLE ||--o{ ROLE_PERMISSION : grants
    PERMISSION ||--o{ ROLE_PERMISSION : included
    USER ||--o{ LOGIN_AUDIT : creates
    USER ||--o{ PASSWORD_HISTORY : owns
    USER ||--o{ REFRESH_TOKEN : owns

    ORDER ||--|{ ORDER_ITEM : contains
    ORDER ||--o{ ORDER_TIMELINE_EVENT : records

    INVENTORY_ITEM ||--o{ INVENTORY_RESERVATION : reserves

    ORDER_OUTBOX_EVENT {
        bigint id
        string aggregate_id
        string event_type
        string status
    }
    INVENTORY_OUTBOX_EVENT {
        bigint id
        string aggregate_id
        string event_type
        string status
    }
    PAYMENT_OUTBOX_EVENT {
        bigint id
        string aggregate_id
        string event_type
        string status
    }

    PAYMENT {
        bigint id
        string order_number
        string customer_username
        string status
    }
```

This is a logical overview. Relationships do not cross schema boundaries.
Outbox and failed-event tables belong to Order, Inventory, and Payment
independently.

## Core Class Collaboration

```mermaid
classDiagram
    class OrderController
    class OrderService
    class OrderRepository
    class OutboxService
    class OutboxPublisher
    class KafkaTemplate
    class OrderSagaListener
    class FailedKafkaEventService

    OrderController --> OrderService
    OrderService --> OrderRepository
    OrderService --> OutboxService
    OutboxPublisher --> KafkaTemplate
    OutboxPublisher --> OutboxService
    OrderSagaListener --> OrderService
    OrderSagaListener --> FailedKafkaEventService
```

Controllers handle transport concerns. Services own authorization-aware
business operations and transactions. Repositories own persistence. Kafka
listeners restore correlation context and delegate transactional work.

## Observability Architecture

```mermaid
flowchart LR
    Services["Shopverse services"]
    Services -->|"/actuator/prometheus"| Prometheus
    Services -->|"JSON stdout and rolling files"| Promtail
    Promtail --> Loki
    Services -->|"Micrometer spans"| Zipkin
    Prometheus --> Grafana
    Loki --> Grafana
    Zipkin --> Grafana
```

Correlation IDs connect the business journey across several traces. Trace IDs
connect spans inside one distributed technical execution.

## Deployment Topology

```mermaid
flowchart TB
    Compose["Docker Compose network: shopverse"]
    Compose --> Apps["Gateway and seven Spring services"]
    Compose --> Data["MySQL and Kafka"]
    Compose --> Discovery["Config Server and Eureka"]
    Compose --> Observe["Prometheus, Grafana, Loki, Promtail, Zipkin"]
    Apps --> Volumes["Per-service log volumes"]
    Data --> DataVolumes["Persistent data volumes"]
    Observe --> ObsVolumes["Loki, Grafana, and Prometheus volumes"]
```

Docker Compose is the current local deployment model. The production
deployment list below is a hardening target, not implemented runtime behavior:
secret management, TLS, broker authentication, backups, multi-node
Kafka/Loki/Prometheus strategy, alert delivery, and orchestrator
health/resource controls.

## Consistency And Failure Boundaries

| Concern | Current control |
|---|---|
| Duplicate checkout | idempotency key lookup and database uniqueness |
| Concurrent stock purchase | JPA `@Version` optimistic locking |
| Domain change plus outgoing event | transactional outbox |
| Duplicate Kafka delivery | state checks and business/database uniqueness |
| Publisher contention | pessimistic lock on one outbox row |
| Transient listener failure | bounded `@RetryableTopic` attempts |
| Poison event | DLT plus persisted replay record |
| Long business workflow | SAGA state and compensation |
| Cross-service diagnosis | correlation ID, trace ID, timeline, logs, metrics |

Current DLT deduplication uses an application existence check and is not
strictly race-safe. A database-unique event ID/inbox remains planned.

## Current Runtime Boundaries

- Checkout currently accepts one item.
- Cache providers are local in-memory caches, not distributed Redis.
- Payment integration is a configurable stub.
- Kafka processing is at least once; exactly-once business processing is not
  claimed.
- Outbox status is `PENDING` or `PUBLISHED`; bounded terminal failure/backoff
  policy remains a hardening item.
- Full OAuth2 Authorization Server behavior is planned; current authentication
  issues custom RSA-signed JWTs.
- The observability stack is single-node and intended for the POC.

## Related Guides

- [Features and demonstrations](../reference/FEATURES-AND-DEMOS.md)
- [Distributed systems](DISTRIBUTED-SYSTEMS.md)
- [Apache Kafka](../integration/APACHE-KAFKA.md)
- [Spring Kafka](../spring/SPRING-KAFKA.md)
- [SAGA and outbox](../reliability/SAGA-OUTBOX.md)
- [Security](../security/JWT-OAUTH2-SPRING-SECURITY.md)
- [Observability](../observability/OBSERVABILITY.md)

## Official References

- [Google Site Reliability Engineering book](https://sre.google/sre-book/table-of-contents/)
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)

## Recommended Next

Return to [Shopverse System Design](./SYSTEM-DESIGN.md) to select the next focused guide.
