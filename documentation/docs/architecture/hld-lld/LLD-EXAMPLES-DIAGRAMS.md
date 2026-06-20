---
title: LLD Examples And Diagrams
---

# LLD Examples And Diagrams

LLD contents, class example, sequence example, and state diagram example.

Back to [HLD And LLD](../HLD-LLD.md).

## LLD Contents

LLD commonly covers:

1. API request and response contracts;
2. class and interface responsibilities;
3. database tables, keys, indexes, and constraints;
4. event schemas;
5. sequence and state diagrams;
6. validation and error handling;
7. transaction and locking boundaries;
8. algorithms and data structures;
9. test cases and extension points.


## LLD Class Example

```mermaid
classDiagram
    class OrderController {
      +checkout(request, idempotencyKey)
    }
    class CheckoutService {
      +checkout(command)
    }
    class OrderRepository {
      +findByIdempotencyKey(key)
      +save(order)
    }
    class OutboxService {
      +enqueue(event)
    }
    class Order {
      +confirm()
      +cancel(reason)
    }

    OrderController --> CheckoutService
    CheckoutService --> OrderRepository
    CheckoutService --> OutboxService
    CheckoutService --> Order
```


## LLD Sequence Example

```mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant Service
    participant DB
    participant Outbox

    Client->>Controller: POST /checkout + idempotency key
    Controller->>Service: checkout(command)
    Service->>DB: find existing key
    alt existing
        DB-->>Service: existing order
    else new
        Service->>DB: insert order
        Service->>Outbox: insert OrderCreated event
    end
    Service-->>Controller: order response
    Controller-->>Client: 201 or existing result
```


## State Diagram Example

```mermaid
stateDiagram-v2
    [*] --> CREATED
    CREATED --> INVENTORY_RESERVED
    CREATED --> REJECTED
    INVENTORY_RESERVED --> PAYMENT_PROCESSING
    PAYMENT_PROCESSING --> CONFIRMED
    PAYMENT_PROCESSING --> COMPENSATING
    COMPENSATING --> CANCELLED
```

State transitions should identify:

- allowed source and target state;
- triggering command/event;
- transaction boundary;
- idempotent duplicate behavior;
- failure and compensation.





