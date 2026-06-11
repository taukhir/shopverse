# Shopverse System Design

Shopverse is an observable, failure-aware commerce POC. It demonstrates authenticated checkout across independently persisted services using synchronous discovery-based calls and asynchronous Kafka choreography.

## Runtime Architecture

```mermaid
flowchart LR
    C[Client] --> G[API Gateway :8080]
    G --> A[Auth Service :8081]
    G --> U[User Service :8082]
    G --> O[Order Service :8083]
    G --> P[Payment Service :8084]
    G --> I[Inventory Service :8086]

    A -->|Feign + Basic auth| U
    O -->|Feign catalog lookup| I

    O <--> K[(Kafka)]
    I <--> K
    P <--> K

    U --> UDB[(user_service)]
    O --> ODB[(order_service)]
    I --> IDB[(inventory_service)]
    P --> PDB[(payment_service)]

    CS[Config Server :8888] --> A
    CS --> U
    CS --> O
    CS --> P
    CS --> I
    E[Eureka :8761] <--> G
    E <--> A
    E <--> U
    E <--> O
    E <--> P
    E <--> I
```

Each stateful service owns a separate MySQL schema. Services do not join across another service's tables.

## Checkout Flow

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

    Client->>Gateway: POST /api/v1/orders/checkout + JWT + Idempotency-Key
    Gateway->>Order: Route request and propagate trace/correlation headers
    Order->>OrderDB: Save order, timeline, and ORDER_CREATED outbox row
    Order-->>Client: 201 order response
    OrderDB->>Kafka: Scheduled outbox publisher sends order.created
    Kafka->>Inventory: @KafkaListener consumes order.created
    Inventory->>InventoryDB: Reserve stock and save outgoing outbox row
    InventoryDB->>Kafka: Publish inventory.reserved or inventory.failed
    Kafka->>Payment: Consume inventory.reserved
    Payment->>PaymentDB: Persist payment and outgoing outbox row
    PaymentDB->>Kafka: Publish payment.completed or payment.failed
    Kafka->>Order: Update order state and timeline
    Kafka->>Inventory: Release stock when payment.failed
```

## Services

| Component | Responsibility |
|---|---|
| API Gateway | Routing, JWT enforcement, correlation handling, gateway metrics |
| Auth Service | Credential authentication through User Service and RSA-signed JWT issuance |
| User Service | Users, roles, permissions, internal Basic-auth lookup, method security |
| Order Service | Idempotent checkout, order ownership, timeline, SAGA state |
| Inventory Service | Stock, optimistic locking, reservations, expiry, compensation |
| Payment Service | Payment state machine, provider stub, timeout reconciliation, refunds |
| Config Server | Centralized configuration backed by the local or Git repository |
| Discovery Server | Eureka registration and logical service discovery |
| Kafka | Asynchronous domain event transport |
| MySQL | Independent persistence schemas and Liquibase metadata |
| Prometheus | Metric scraping, recording rules, and alert evaluation |
| Loki/Promtail | Central log storage and collection |
| Zipkin | Trace storage and visualization |
| Grafana | Dashboards and exploration across metrics, logs, and traces |

## Domain Events

| Event | Producer | Consumers | Purpose |
|---|---|---|---|
| `shopverse.order.created` | Order | Inventory | Begin reservation |
| `shopverse.inventory.reserved` | Inventory | Order, Payment | Advance to payment |
| `shopverse.inventory.failed` | Inventory | Order | Reject checkout |
| `shopverse.payment.completed` | Payment | Order | Confirm order |
| `shopverse.payment.failed` | Payment | Order, Inventory | Fail order and compensate stock |

Events carry an order identifier, order number, and business `correlationId`. Kafka keys use the order number to preserve per-order partition ordering.

## State Models

Order states:

```text
ORDER_CREATED -> PENDING_INVENTORY -> INVENTORY_RESERVED
              -> PAYMENT_PROCESSING -> CONFIRMED
              -> INVENTORY_REJECTED | PAYMENT_FAILED | CANCELLED
```

Payment states:

```text
PENDING -> AUTHORIZED -> CAPTURED
        -> DECLINED | TIMED_OUT -> CAPTURED after reconciliation
CAPTURED -> REFUNDED
```

Inventory reservation states:

```text
RESERVED -> RELEASED
         -> EXPIRED
```

## Data Model

```mermaid
erDiagram
    USER ||--o{ USER_ROLE : has
    ROLE ||--o{ USER_ROLE : assigned
    ROLE ||--o{ ROLE_PERMISSION : grants
    PERMISSION ||--o{ ROLE_PERMISSION : included

    ORDER ||--|{ ORDER_ITEM : contains
    ORDER ||--o{ ORDER_TIMELINE_EVENT : records
    ORDER ||--o{ ORDER_OUTBOX_EVENT : emits

    INVENTORY_ITEM ||--o{ INVENTORY_RESERVATION : reserves
    INVENTORY_RESERVATION ||--o{ INVENTORY_OUTBOX_EVENT : emits

    PAYMENT ||--o{ PAYMENT_OUTBOX_EVENT : emits
```

The diagram expresses logical relationships. The schemas remain isolated and there are no cross-service foreign keys.

## Current Boundaries

- Checkout accepts one item because `CheckoutRequest` currently has `@Size(max = 1)`.
- Cache providers are local in-memory caches, not a distributed Redis cache.
- Payment integration is a configurable stub with `SUCCESS`, `DECLINE`, and `TIMEOUT`.
- Kafka processing is at-least-once. Database uniqueness, state checks, and idempotency keys are therefore essential.
