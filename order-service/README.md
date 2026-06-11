# Shopverse Order Service

Order Service owns persistent customer orders and starts the Kafka choreography SAGA. It uses MySQL, Spring Data JPA, Liquibase, Bean Validation, caching, OpenFeign, Resilience4j annotations, JWT resource-server security, Micrometer metrics, Zipkin tracing, and structured JSON logging.

## Runtime

| Item | Value |
| --- | --- |
| Application | `ORDER-SERVICE` |
| Port | `8083` |
| Database | `order_service` |
| Config | `cloud-configs/ORDER-SERVICE.yml` |
| Swagger UI | `http://localhost:8083/swagger-ui/index.html` |

## Data Model

- `OrderEntity`: order number, customer, status, amount, correlation ID, payment reference, failure reason.
- `OrderItemEntity`: product, quantity, and the authoritative price captured at checkout.
- `BaseAuditableEntity`: `@CreatedDate` and `@LastModifiedDate` populated by JPA auditing.
- Liquibase owns schema creation; Hibernate runs with `ddl-auto: validate`.

Repositories return entities only inside the service layer. Controllers expose immutable Java records instead of persistence entities.

## APIs

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/orders/public/health` | Public | Health response |
| `GET` | `/api/v1/orders/public/catalog` | Public | Inventory catalog through Feign |
| `GET` | `/api/v1/orders` | Customer/Admin | Current customer's orders |
| `GET` | `/api/v1/orders/{id}` | Owner/Admin | One order |
| `GET` | `/api/v1/orders/{id}/timeline` | Authenticated | Persisted SAGA timeline |
| `POST` | `/api/v1/orders/checkout` | Customer/Admin | Persist order and start SAGA |
| `DELETE` | `/api/v1/orders/{id}` | Admin | Cancel order |
| `GET` | `/api/v1/orders/admin/all` | Admin | All orders |

Checkout request:

```json
{
  "items": [
    {
      "productId": 101,
      "quantity": 1
    }
  ]
}
```

Required headers:

```http
Authorization: Bearer <token>
Idempotency-Key: checkout-user-42-cart-9001
X-Correlation-Id: checkout-demo-101
```

The current SAGA event supports one product per order, so `items` is validated with `@NotEmpty` and `@Size(max = 1)`. Product IDs and quantities use `@NotNull` and `@Positive`. Product name and price are not trusted from the client; Order Service reads them from Inventory Service.

Representative `201 Created` response:

```json
{
  "id": 42,
  "orderNumber": "ORD-10042",
  "correlationId": "checkout-demo-101",
  "idempotencyKey": "checkout-user-42-cart-9001",
  "customerUsername": "admin",
  "status": "PENDING_INVENTORY",
  "totalAmount": 2499.00,
  "items": [
    {
      "productId": 101,
      "productName": "Wireless Keyboard",
      "quantity": 1,
      "unitPrice": 2499.00
    }
  ],
  "createdAt": "2026-06-11T08:30:00Z"
}
```

Generated IDs, order numbers, timestamps, and the eventual SAGA status vary.

## Idempotent Checkout And Duplicate Requests

`Idempotency-Key` is persisted with a unique database constraint:

```java
repository.findWithItemsByIdempotencyKey(idempotencyKey)
        .ifPresent(existing -> returnExistingOrder(existing));
```

Sequential retries return the original order instead of creating another
order or payment. The unique constraint remains authoritative if two service
instances receive the key concurrently. The key is also bound to the customer,
so another user cannot claim an existing checkout.

This is stronger than an in-memory map because it survives restarts and works
across replicas. The API does not use a distributed Redis lock: locks expire,
whereas the database uniqueness invariant is permanent.

## Queryable Order Timeline

Each transition is appended to `order_timeline_events`:

```text
ORDER_CREATED
INVENTORY_RESERVED
PAYMENT_PROCESSING
PAYMENT_COMPLETED
ORDER_CONFIRMED
```

Failure states include `INVENTORY_REJECTED`, `PAYMENT_FAILED`, and
`ORDER_CANCELLED`.

```http
GET /api/v1/orders/{id}/timeline
```

Representative response:

```json
[
  {
    "orderNumber": "ORD-10042",
    "correlationId": "checkout-demo-101",
    "stage": "ORDER_CREATED",
    "detail": "Order persisted and ready for inventory reservation",
    "occurredAt": "2026-06-11T08:30:00Z"
  }
]
```

Each timeline row contains `orderNumber`, `correlationId`, stage, detail, and
timestamp. Use the correlation ID to move from the business timeline to Loki,
and use a log's trace ID to open the technical execution in Zipkin.

```powershell
$login = Invoke-RestMethod -Method Post `
  -Uri http://localhost:8080/auth/login `
  -ContentType application/json `
  -Body (@{username='admin'; password='Admin@123'} | ConvertTo-Json)

curl.exe -X POST http://localhost:8080/api/v1/orders/checkout `
  -H "Authorization: Bearer $($login.token)" `
  -H "Content-Type: application/json" `
  -H "X-Correlation-Id: checkout-demo-101" `
  -d '{\"items\":[{\"productId\":101,\"quantity\":1}]}'
```

## Synchronous And Asynchronous Communication

`InventoryClient` is an OpenFeign client. `CatalogService` wraps it with annotation-driven resilience and caching:

```java
@Retry(name = "inventory-client")
@CircuitBreaker(name = "inventory-client", fallbackMethod = "fallbackCatalog")
@Cacheable(cacheNames = "catalog")
public List<CatalogItemResponse> getCatalog() {
    return inventoryClient.getCatalog().stream().map(...).toList();
}
```

The Feign interceptor propagates `X-Correlation-Id`. Micrometer instrumentation propagates W3C trace context.

After the order transaction commits, `KafkaTemplate.send(...)` schedules `shopverse.order.created`. It already returns a `CompletableFuture`, so adding `@Async` would only add another executor without improving Kafka delivery semantics. Consumers use `@KafkaListener`; listener concurrency should be controlled by Kafka partitions and container concurrency.

SAGA outcomes update persisted order state:

```text
PENDING_INVENTORY -> CONFIRMED
PENDING_INVENTORY -> INVENTORY_REJECTED
PENDING_INVENTORY -> PAYMENT_FAILED
```

For a stricter production design, use a transactional outbox so database persistence and event publication cannot diverge.

## Resilience, Caching, And Threads

- `@RateLimiter(name = "order-api")` protects controller traffic.
- `@Bulkhead(name = "order-api", type = SEMAPHORE)` limits concurrent calls.
- `@Retry` and `@CircuitBreaker` protect the Inventory Feign call.
- `@Cacheable` caches catalog/order reads; `@CacheEvict` invalidates writes.
- Java 21 virtual threads are enabled centrally with `spring.threads.virtual.enabled=true`.

Resilience instances and limits live in centralized config instead of Java `@Bean` factories.

## Observability

The request filter creates or accepts `X-Correlation-Id`, writes it to MDC, returns it in the response, logs request duration, and increments `shopverse_service_requests_logged_total`. Kafka events carry the same business correlation ID.

Logs use Spring Boot's Logstash-compatible structured JSON encoder:

```json
{
  "@timestamp": "2026-06-11T02:52:30.918+05:30",
  "level": "INFO",
  "application": "ORDER-SERVICE",
  "traceId": "...",
  "spanId": "...",
  "correlationId": "checkout-demo-101",
  "message": "Order persisted and ready for inventory reservation",
  "orderNumber": "ORD-..."
}
```

Health logs are routed to a separate rolling file. See [Observability](../observability/README.md) and [SAGA](../saga/README.md).

## Build

```powershell
.\gradlew.bat clean test
docker compose build order-service
docker compose up -d order-service
docker compose logs -f order-service
```
