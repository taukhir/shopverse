# Shopverse Choreography SAGA

This document explains the simple SAGA pattern used in the Shopverse POC between:

- Order Service
- Inventory Service
- Payment Service
- Kafka

The implementation is intentionally small. It demonstrates the concept without adding a database-backed workflow engine, orchestration service, or complex retry framework.

## What Pattern We Use

Shopverse uses a choreography SAGA.

That means there is no central orchestrator telling each service what to do. Instead:

1. One service publishes an event.
2. Another service listens for that event.
3. That service performs its local action.
4. It publishes the next event.
5. Other services react to the new event.

Kafka is the event broker that connects the services.

## Why Kafka Is Used

Kafka lets services communicate through events instead of direct HTTP calls.

For this POC:

- Order Service does not directly call Inventory Service.
- Inventory Service does not directly call Payment Service.
- Payment Service does not directly call Order Service.

Each service only knows the Kafka topics it publishes to or consumes from.

This makes the services loosely coupled and shows how event-driven microservices can coordinate a business flow.

## Trigger API

The checkout SAGA starts from Order Service.

Through API Gateway:

```powershell
curl.exe -X POST http://localhost:8080/api/v1/orders/checkout `
  -H "Authorization: Bearer <token>"
```

Directly to Order Service:

```powershell
curl.exe -X POST http://localhost:8083/api/v1/orders/checkout `
  -H "Authorization: Bearer <token>"
```

This endpoint is authenticated. It requires `ROLE_USER` or `ROLE_ADMIN` because it is protected by the existing Order Service security rule:

```text
POST /api/v1/orders/** -> ROLE_USER or ROLE_ADMIN
```

## Success Flow

```mermaid
sequenceDiagram
    participant Client
    participant Gateway as API Gateway
    participant Order as Order Service
    participant Kafka
    participant Inventory as Inventory Service
    participant Payment as Payment Service

    Client->>Gateway: POST /api/v1/orders/checkout
    Gateway->>Order: Forward authenticated request
    Order->>Kafka: publish shopverse.order.created
    Kafka->>Inventory: consume order.created
    Inventory->>Kafka: publish shopverse.inventory.reserved
    Kafka->>Payment: consume inventory.reserved
    Payment->>Kafka: publish shopverse.payment.completed
    Kafka->>Order: consume payment.completed
    Order->>Order: log order confirmed
```

## Failure And Compensation Flow

Inventory failure:

```mermaid
sequenceDiagram
    participant Order as Order Service
    participant Kafka
    participant Inventory as Inventory Service

    Order->>Kafka: publish shopverse.order.created
    Kafka->>Inventory: consume order.created
    Inventory->>Kafka: publish shopverse.inventory.failed
    Kafka->>Order: consume inventory.failed
    Order->>Order: log order rejected
```

Payment failure:

```mermaid
sequenceDiagram
    participant Order as Order Service
    participant Kafka
    participant Inventory as Inventory Service
    participant Payment as Payment Service

    Order->>Kafka: publish shopverse.order.created
    Kafka->>Inventory: consume order.created
    Inventory->>Kafka: publish shopverse.inventory.reserved
    Kafka->>Payment: consume inventory.reserved
    Payment->>Kafka: publish shopverse.payment.failed
    Kafka->>Order: consume payment.failed
    Kafka->>Inventory: consume payment.failed
    Order->>Order: log payment failed
    Inventory->>Inventory: log inventory release compensation
```

In this POC, compensation is logged instead of updating a database. In a production system, Inventory Service would release reserved stock in its own database.

## Kafka Topics

| Topic | Published by | Consumed by | Meaning |
| --- | --- | --- | --- |
| `shopverse.order.created` | Order Service | Inventory Service | A checkout/order was created and inventory should be reserved. |
| `shopverse.inventory.reserved` | Inventory Service | Payment Service | Inventory is available and payment can be attempted. |
| `shopverse.inventory.failed` | Inventory Service | Order Service | Inventory was not available; order should be rejected. |
| `shopverse.payment.completed` | Payment Service | Order Service | Payment succeeded; order can be confirmed. |
| `shopverse.payment.failed` | Payment Service | Order Service, Inventory Service | Payment failed; order should fail and inventory reservation should be released. |

Topic names are centralized in:

```text
cloud-configs/application.yml
```

## Data Flow

### 1. Order Service Publishes `order.created`

When `/api/v1/orders/checkout` is called, Order Service creates sample order data and publishes:

```json
{
  "orderId": 3,
  "orderNumber": "ORD-1003",
  "customerUsername": "current-user",
  "productId": 101,
  "quantity": 1,
  "amount": 2499.00
}
```

Log shape:

```text
Choreography saga started orderNumber=ORD-1003 topic=shopverse.order.created payload=...
```

### 2. Inventory Service Consumes `order.created`

Inventory Service reads the order event and checks a simple demo rule:

```text
if productId == 103 or quantity > 5 -> inventory fails
otherwise -> inventory is reserved
```

On success, it publishes:

```json
{
  "orderId": 3,
  "orderNumber": "ORD-1003",
  "productId": 101,
  "quantity": 1,
  "amount": 2499.00
}
```

Log shape:

```text
Choreography saga inventory reserved orderNumber=ORD-1003 topic=shopverse.inventory.reserved payload=...
```

On failure, it publishes:

```json
{
  "orderId": 3,
  "orderNumber": "ORD-1003",
  "reason": "Inventory not available for product 103"
}
```

### 3. Payment Service Consumes `inventory.reserved`

Payment Service reads the inventory reservation event and checks a simple demo rule:

```text
if amount > 10000.00 -> payment fails
otherwise -> payment succeeds
```

On success, it publishes:

```json
{
  "orderId": 3,
  "orderNumber": "ORD-1003",
  "paymentReference": "PAY-ORD-1003",
  "amount": 2499.00
}
```

Log shape:

```text
Choreography saga payment completed orderNumber=ORD-1003 topic=shopverse.payment.completed payload=...
```

On failure, it publishes:

```json
{
  "orderId": 3,
  "orderNumber": "ORD-1003",
  "reason": "Demo payment limit exceeded"
}
```

### 4. Order Service Consumes Final Events

Order Service listens for:

```text
shopverse.inventory.failed
shopverse.payment.completed
shopverse.payment.failed
```

It logs the final state:

```text
Choreography saga completed orderNumber=ORD-1003 paymentReference=PAY-ORD-1003 amount=2499.00 nextAction=MARK_ORDER_CONFIRMED
```

or:

```text
Choreography saga cancelled orderNumber=ORD-1003 reason=... nextAction=MARK_ORDER_REJECTED
```

or:

```text
Choreography saga cancelled orderNumber=ORD-1003 reason=... nextAction=MARK_ORDER_PAYMENT_FAILED
```

### 5. Inventory Service Compensates On Payment Failure

Inventory Service also listens for:

```text
shopverse.payment.failed
```

It logs the compensation step:

```text
Choreography saga compensation released inventory orderNumber=ORD-1003 reason=Demo payment limit exceeded
```

## Where The Code Lives

| Service | Package |
| --- | --- |
| Order Service | `order-service/src/main/java/io/shopverse/order/saga` |
| Inventory Service | `inventory-service/src/main/java/io/shopverse/inventory_service/saga` |
| Payment Service | `payment-service/src/main/java/io/shopverse/payment_service/saga` |

## How To Test

Start the stack:

```powershell
docker compose up -d --build
```

Login and copy the JWT token:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:8080/auth/login `
  -Body (@{username='admin'; password='Admin@123'} | ConvertTo-Json) `
  -ContentType 'application/json'
```

Trigger checkout:

```powershell
curl.exe -X POST http://localhost:8080/api/v1/orders/checkout `
  -H "Authorization: Bearer <token>"
```

Follow logs:

```powershell
docker compose logs -f order-service inventory-service payment-service kafka
```

Expected success logs:

```text
Choreography saga started
Choreography saga inventory step started
Choreography saga inventory reserved
Choreography saga payment step started
Choreography saga payment completed
Choreography saga completed
```

## Grafana Loki Query

Open Grafana:

```text
http://localhost:3000
```

Use Loki Explore:

```logql
{application=~"ORDER-SERVICE|INVENTORY-SERVICE|PAYMENT-SERVICE"} |= "Choreography saga"
```

## Current POC Limitations

This SAGA is intentionally simple:

- No order database is updated.
- No inventory database is updated.
- No payment provider is called.
- No dead-letter topics are configured.
- No retry topic strategy is configured.
- Compensation is logged instead of persisted.

Those are good future improvements, but leaving them out keeps this POC easy to understand.
