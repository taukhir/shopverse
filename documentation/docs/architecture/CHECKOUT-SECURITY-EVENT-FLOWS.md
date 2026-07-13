---
title: "Checkout, Security, And Event Flows"
description: "Checkout, Security, And Event Flows with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "Checkout, Security, And Event Flows"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Checkout, Security, And Event Flows

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

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

## Recommended Next

Return to [Shopverse System Design](./SYSTEM-DESIGN.md) to select the next focused guide.


## Official References

- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)
