---
title: UML Diagrams
---

# UML Diagrams

UML diagrams describe structure and behavior at a level that implementation
teams can discuss before code exists.

## Common UML Diagram Types

| Diagram | Use it for |
|---|---|
| Class diagram | classes, fields, methods, inheritance, associations |
| Sequence diagram | request flow over time |
| State diagram | lifecycle transitions |
| Activity diagram | workflow and decisions |
| Component diagram | high-level modules and dependencies |

## Class Diagram Example

```mermaid
classDiagram
    class Order {
        Long id
        String orderNumber
        OrderStatus status
    }
    class Payment {
        Long id
        PaymentStatus status
        BigDecimal amount
    }
    Order "1" --> "0..1" Payment : has
```

Use class diagrams for LLD discussion. Keep them smaller than the whole
application; large class diagrams become unreadable quickly.

## Sequence Diagram Example

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant Order
    participant Kafka
    participant Inventory
    Client->>Gateway: POST /orders/checkout
    Gateway->>Order: route request
    Order->>Order: persist order + outbox
    Order->>Kafka: publish OrderCreated
    Kafka->>Inventory: consume OrderCreated
```

Use sequence diagrams when the order of calls, retries, or events matters.

## State Diagram Example

```mermaid
stateDiagram-v2
    [*] --> CREATED
    CREATED --> INVENTORY_RESERVED
    INVENTORY_RESERVED --> PAYMENT_PROCESSING
    PAYMENT_PROCESSING --> CONFIRMED
    PAYMENT_PROCESSING --> PAYMENT_FAILED
    PAYMENT_FAILED --> COMPENSATED
```

Use state diagrams for SAGA, payment, inventory reservation, ticketing,
workflow, and approval problems.

## Practical Rules

| Do | Avoid |
|---|---|
| Draw one flow or bounded context per diagram | Put the entire system into one diagram |
| Name important messages and states | Draw unlabeled arrows |
| Keep diagrams versioned with code/docs | Keep stale diagrams as authority |
| Use diagrams to explain trade-offs | Use diagrams as decoration |
