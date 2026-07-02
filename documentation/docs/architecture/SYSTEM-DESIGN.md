# Shopverse System Design

import {DocFigure, ReadingGuide} from '@site/src/components/DocumentationLanding';

Shopverse is an observable, failure-aware commerce microservices POC. It
demonstrates secure and idempotent checkout across independently persisted
services using synchronous discovery-based HTTP calls, asynchronous Kafka
choreography, local transactions, transactional outbox, compensation, and
operational recovery.

This page describes current runtime architecture unless a paragraph explicitly
uses roadmap language such as `planned`, `target`, or `production hardening`.
For precise feature status and demonstration evidence, use the
[Features and demonstrations](../reference/FEATURES-AND-DEMOS.md) matrix.

<DocFigure
  src="/img/diagrams/shopverse-architecture-flow.svg"
  alt="Shopverse runtime architecture with API Gateway, Spring services, Kafka, service databases, configuration, discovery, security, and observability"
  caption="High-level runtime architecture. The Mermaid diagrams below decompose each part of this topology."
/>

<ReadingGuide>

Read this page from top to bottom for the complete platform model. For a faster
walkthrough, focus on **Runtime Architecture**, **Successful Checkout SAGA**,
**Failure And Compensation**, and **Observability Architecture**.

</ReadingGuide>

## System Context

```mermaid
flowchart LR
    Customer["Customer or administrator"] --> Gateway["Shopverse API Gateway"]
    Gateway --> Platform["Commerce platform"]
    Platform --> Identity["Identity and access"]
    Platform --> Commerce["Order, inventory, and payment"]
    Platform --> Ops["Observability and operations"]
    Commerce --> Provider["Stub third-party payment provider"]
```

The payment provider is deliberately a configurable stub. It models success,
decline, and timeout without requiring external credentials.

## Runtime Architecture

```mermaid
flowchart TB
    Client["Client"]
    Gateway["API Gateway :8080"]
    Auth["Auth Service :8081"]
    User["User Service :8082"]
    Order["Order Service :8083"]
    Payment["Payment Service :8084"]
    Inventory["Inventory Service :8086"]

    Client --> Gateway
    Gateway --> Auth
    Gateway --> User
    Gateway --> Order
    Gateway --> Payment
    Gateway --> Inventory

    Auth -->|"Feign + internal Basic authentication"| User
    Order -->|"Feign catalog lookup"| Inventory

    Order <--> Kafka["Kafka"]
    Inventory <--> Kafka
    Payment <--> Kafka

    User --> UserDB[("user_service")]
    Order --> OrderDB[("order_service")]
    Inventory --> InventoryDB[("inventory_service")]
    Payment --> PaymentDB[("payment_service")]
```

Each stateful service owns a separate MySQL schema. There are no cross-service
foreign keys or cross-schema joins. A service accesses another service's data
through an API or event contract.

## Platform Infrastructure

```mermaid
flowchart LR
    Config["Config Server :8888"] --> Gateway
    Config --> Auth
    Config --> User
    Config --> Order
    Config --> Inventory
    Config --> Payment

    Eureka["Eureka :8761"] <--> Gateway
    Eureka <--> Auth
    Eureka <--> User
    Eureka <--> Order
    Eureka <--> Inventory
    Eureka <--> Payment

    Git["cloud-configs"] --> Config
```

Config Server centralizes runtime properties. Eureka records service instances.
The gateway and Feign clients use logical names such as `ORDER-SERVICE`; Spring
Cloud LoadBalancer selects a registered instance.

## Service Responsibilities

| Component | Responsibility |
|---|---|
| API Gateway | Edge routing, JWT validation, correlation handling, request metrics |
| Auth Service | Authenticate through User Service, sign RSA JWTs, expose JWKS |
| User Service | Users, roles, permissions, internal credential lookup, method security |
| Order Service | Idempotent checkout, ownership, order state, timeline, SAGA outcomes |
| Inventory Service | Stock, optimistic locking, reservation, expiry, compensation |
| Payment Service | Payment state machine, provider simulation, reconciliation, refund |
| Config Server | Centralized configuration backed by local files or Git |
| Discovery Server | Eureka registration and logical service discovery |
| Kafka | Durable asynchronous event transport |
| MySQL | Service-owned schemas and Liquibase metadata |
| Prometheus | Metric scraping, rules, SLO signals, and alert evaluation |
| Loki | Central log storage and LogQL querying |
| Promtail | Log discovery, parsing, positions, labeling, and Loki shipping |
| Zipkin | Distributed trace storage and span visualization |
| Grafana | Dashboards and investigation across metrics, logs, and traces |

## Synchronous Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant Eureka
    participant Service
    participant Database

    Client->>Gateway: HTTP request + JWT + optional X-Correlation-Id
    Gateway->>Gateway: Validate route and JWT
    Gateway->>Eureka: Resolve logical service
    Eureka-->>Gateway: Available instances
    Gateway->>Service: Forward request and trace/correlation headers
    Service->>Service: Validate input and authorize resource
    Service->>Database: Execute local transaction
    Database-->>Service: Commit result
    Service-->>Gateway: Stable response
    Gateway-->>Client: Response + X-Correlation-Id
```

The downstream service repeats JWT validation and resource authorization.
Gateway security is not the sole protection for a service.

## Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant Auth
    participant User
    participant UserDB

    Client->>Gateway: POST /auth/login with credentials
    Gateway->>Auth: Route public login request
    Auth->>User: Feign GET internal authenticated user + Basic credentials
    User->>UserDB: Load user, roles, permissions, password hash
    User->>User: Verify credentials through Spring Security
    User-->>Auth: Authenticated user authorities
    Auth->>Auth: Create claims and sign JWT with RSA private key
    Auth-->>Client: Access token
    Client->>Gateway: Protected API + Bearer JWT
    Gateway->>Auth: Read public key from JWKS when required
    Gateway->>Gateway: Verify signature and claims
```

Resource services use the Auth Service JWKS endpoint to verify tokens. They do
not receive or share the RSA private signing key.

## Successful Checkout SAGA

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant Order
    participant OrderDB
    participant Kafka
    participant Inventory
    participant InventoryDB
    participant Payment
    participant PaymentDB

    Client->>Gateway: POST checkout + JWT + Idempotency-Key
    Gateway->>Order: Route with identity and correlation headers
    Order->>OrderDB: Save order, item, timeline, and outbox
    OrderDB-->>Order: Commit
    Order-->>Client: 201 Created
    Order->>Kafka: Publish order.created from outbox
    Kafka-->>Inventory: OrderCreatedEvent
    Inventory->>InventoryDB: Reserve stock and save outbox
    InventoryDB-->>Inventory: Commit
    Inventory->>Kafka: Publish inventory.reserved
    Kafka-->>Order: Mark inventory reserved/payment processing
    Kafka-->>Payment: InventoryReservedEvent
    Payment->>PaymentDB: Persist captured payment and outbox
    PaymentDB-->>Payment: Commit
    Payment->>Kafka: Publish payment.completed
    Kafka-->>Order: Confirm order and append timeline
```

The HTTP response confirms creation of the Order resource. It does not imply
that asynchronous inventory and payment processing has completed.

## Failure And Compensation

```mermaid
flowchart TD
    Created["ORDER_CREATED"] --> Reserve{"Inventory available?"}
    Reserve -->|"No"| Rejected["INVENTORY_REJECTED"]
    Reserve -->|"Yes"| Reserved["INVENTORY_RESERVED"]
    Reserved --> Pay{"Payment outcome"}
    Pay -->|"Captured"| Confirmed["CONFIRMED"]
    Pay -->|"Declined"| Failed["PAYMENT_FAILED"]
    Failed --> Release["Release inventory reservation"]
    Pay -->|"Timed out"| Uncertain["Payment TIMED_OUT"]
    Uncertain --> Reconcile{"Admin reconciliation"}
    Reconcile -->|"Captured later"| Confirmed
```

Compensation is a later business transaction. It is not a rollback of the
already committed Inventory transaction.

## Transactional Outbox Flow

```mermaid
sequenceDiagram
    participant Handler
    participant Database
    participant Publisher
    participant Kafka

    Handler->>Database: Begin local transaction
    Handler->>Database: Update domain tables
    Handler->>Database: Insert PENDING outbox row
    Handler->>Database: Commit both
    Publisher->>Database: Lock one pending row
    Publisher->>Kafka: Send key and JSON payload
    Kafka-->>Publisher: Topic, partition, and offset
    Publisher->>Database: Mark outbox PUBLISHED
```

If Kafka is unavailable, the committed outbox row remains recoverable. A crash
after Kafka accepts a record but before the row is marked published can cause
duplicate delivery, so consumers must be idempotent.

## Event Topology

```mermaid
flowchart LR
    OC["shopverse.order.created"] --> Inventory
    Inventory --> IR["shopverse.inventory.reserved"]
    Inventory --> IF["shopverse.inventory.failed"]
    IR --> Order
    IR --> Payment
    IF --> Order
    Payment --> PC["shopverse.payment.completed"]
    Payment --> PF["shopverse.payment.failed"]
    PC --> Order
    PF --> Order
    PF --> Inventory
```

| Event | Producer | Consumers | Purpose |
|---|---|---|---|
| `shopverse.order.created` | Order | Inventory | Begin stock reservation |
| `shopverse.inventory.reserved` | Inventory | Order, Payment | Advance order and begin payment |
| `shopverse.inventory.failed` | Inventory | Order | Reject checkout |
| `shopverse.payment.completed` | Payment | Order | Confirm the order |
| `shopverse.payment.failed` | Payment | Order, Inventory | Fail order and release stock |

Event contracts currently carry order ID, order number, correlation ID, and
the fields needed by the consumer. Order number is the Kafka key to preserve
per-order partition ordering. A universal immutable event ID and schema version
are production hardening items.

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
