# Shopverse Order Service

Order Service is a simple order API POC. It demonstrates protected order endpoints, public catalog endpoints, choreography SAGA events with Kafka, centralized logs, Prometheus metrics, and Zipkin tracing.

The current implementation uses static sample data so the microservices POC can be tested without adding an order database yet.

## Responsibilities

- Serve public health and sample catalog APIs.
- Serve user order APIs protected by JWT roles.
- Serve admin order APIs protected by `ROLE_ADMIN`.
- Register with Eureka as `ORDER-SERVICE`.
- Validate JWTs using the Auth Service JWKS endpoint.
- Emit request logs and custom Micrometer counters.
- Export traces to Zipkin.
- Start the Order -> Inventory -> Payment choreography SAGA by publishing `shopverse.order.created`.
- Listen for inventory/payment outcome events and log the final saga status.

## Port

```text
8083
```

## Endpoints

| Method | Endpoint | Security | Description |
| --- | --- | --- | --- |
| `GET` | `/api/v1/orders/public/health` | Public | Service health response |
| `GET` | `/api/v1/orders/public/catalog` | Public | Sample product catalog |
| `GET` | `/api/v1/orders` | User/customer role or `ROLE_ADMIN` | Sample current-user orders |
| `GET` | `/api/v1/orders/{id}` | User/customer role or `ROLE_ADMIN` | Sample order by ID |
| `POST` | `/api/v1/orders` | User/customer role or `ROLE_ADMIN` | Returns a sample created order |
| `POST` | `/api/v1/orders/checkout` | User/customer role or `ROLE_ADMIN` | Starts the Kafka choreography SAGA checkout flow |
| `DELETE` | `/api/v1/orders/{id}` | `ROLE_ADMIN` | Returns a sample delete response |
| `GET` | `/api/v1/orders/admin/all` | `ROLE_ADMIN` | Sample admin order list |

Role names must match the JWT. If User Service/Auth Service issues `ROLE_CUSTOMER`, configure Order Service checks with `hasRole("CUSTOMER")`. If Order Service checks `hasRole("USER")`, the JWT must contain `ROLE_USER`.

## Smoke Tests

Public endpoints:

```powershell
curl http://localhost:8083/api/v1/orders/public/health
curl http://localhost:8083/api/v1/orders/public/catalog
```

Through the gateway:

```powershell
curl http://localhost:8080/api/v1/orders/public/health
curl http://localhost:8080/api/v1/orders/public/catalog
```

## Get A JWT Token

Order APIs are protected except `/api/v1/orders/public/**`. Login through API Gateway and copy the returned token:

```powershell
$login = Invoke-RestMethod -Method Post `
  -Uri http://localhost:8080/auth/login `
  -Body (@{username='admin'; password='Admin@123'} | ConvertTo-Json) `
  -ContentType 'application/json'

$token = $login.token
```

Use the token in protected calls:

```powershell
curl.exe http://localhost:8080/api/v1/orders `
  -H "Authorization: Bearer $token"
```

## Choreography SAGA

Order Service starts the POC saga when an order is created:

```text
Order Service publishes shopverse.order.created
Inventory Service publishes shopverse.inventory.reserved or shopverse.inventory.failed
Payment Service publishes shopverse.payment.completed or shopverse.payment.failed
Order Service logs the final confirmed, rejected, or payment-failed status
```

### Checkout URL

Through API Gateway:

```http
POST http://localhost:8080/api/v1/orders/checkout
```

Directly to Order Service:

```http
POST http://localhost:8083/api/v1/orders/checkout
```

### Request Body

Current POC status: checkout does not require a request body yet. The controller creates a fixed sample order from `SampleOrderData`.

You can send no body:

```powershell
curl.exe -X POST http://localhost:8080/api/v1/orders/checkout `
  -H "Authorization: Bearer $token"
```

Or send an empty JSON body for demo tools such as Postman:

```powershell
curl.exe -X POST http://localhost:8080/api/v1/orders/checkout `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d "{}"
```

Sample body for the next improvement, not currently consumed by the controller:

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

### Expected Response

The checkout endpoint returns HTTP `201 Created` with sample order data:

```json
{
  "id": 3,
  "orderNumber": "ORD-1003",
  "customerUsername": "current-user",
  "status": "CREATED",
  "totalAmount": 2499.00,
  "items": [
    {
      "productId": 101,
      "productName": "Wireless Keyboard",
      "quantity": 1,
      "price": 2499.00
    }
  ],
  "createdAt": "2026-06-03T..."
}
```

### Event Published By Order Service

After creating the sample order, Order Service publishes `shopverse.order.created` to Kafka.

Payload shape:

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

Kafka topic configuration comes from centralized config:

```yaml
shopverse:
  kafka:
    topics:
      order-created: shopverse.order.created
      inventory-reserved: shopverse.inventory.reserved
      inventory-failed: shopverse.inventory.failed
      payment-completed: shopverse.payment.completed
      payment-failed: shopverse.payment.failed
```

### How To Verify The SAGA

Start the stack:

```powershell
docker compose up -d
```

Follow SAGA logs:

```powershell
docker compose logs -f order-service inventory-service payment-service kafka
```

Trigger checkout:

```powershell
curl.exe -X POST http://localhost:8080/api/v1/orders/checkout `
  -H "Authorization: Bearer $token"
```

Expected log sequence:

```text
ORDER-SERVICE     Choreography saga started orderNumber=ORD-1003 topic=shopverse.order.created
INVENTORY-SERVICE Inventory reserved ... topic=shopverse.inventory.reserved
PAYMENT-SERVICE   Payment completed ... topic=shopverse.payment.completed
ORDER-SERVICE     Choreography saga completed orderNumber=ORD-1003 ... nextAction=MARK_ORDER_CONFIRMED
```

If inventory or payment fails, Order Service logs a cancellation message instead:

```text
Choreography saga cancelled orderNumber=ORD-1003 ... nextAction=MARK_ORDER_REJECTED
Choreography saga cancelled orderNumber=ORD-1003 ... nextAction=MARK_ORDER_PAYMENT_FAILED
```

Detailed event flow, payloads, and code snippets are in [../saga/README.md](../saga/README.md).

### Other Protected Order Calls

```powershell
curl http://localhost:8080/api/v1/orders `
  -H "Authorization: Bearer <token>"

curl -X POST http://localhost:8080/api/v1/orders/checkout `
  -H "Authorization: Bearer <token>"
```

## Docker

From the root project:

```powershell
docker compose build order-service
docker compose up -d order-service
docker compose logs -f order-service
```

The full stack is started from the root:

```powershell
docker compose up -d
```

More Docker commands, flags, and Dockerfile details are in [../docker/README.md](../docker/README.md).

## Jenkins Pipeline

Order Service has a small service-specific Jenkins pipeline:

```text
order-service/Jenkinsfile
```

Use this when you want Jenkins to build and test only `order-service`, then optionally build its Docker image.

Create the Jenkins job:

1. Open Jenkins at `http://localhost:8085`.
2. Login with `admin / admin`.
3. Click **New Item**.
4. Enter:

```text
shopverse-order-service
```

5. Select **Pipeline**.
6. Under **Pipeline**, choose **Pipeline script from SCM**.
7. Select **Git**.
8. Add the Shopverse GitHub repository URL.
9. Set **Branch Specifier** to your branch, for example:

```text
*/main
```

10. Set **Script Path** to:

```text
order-service/Jenkinsfile
```

11. Save.
12. Click **Build with Parameters**.

Useful parameters:

| Parameter | Default | Use |
| --- | --- | --- |
| `BUILD_DOCKER_IMAGE` | `true` | Builds the order-service Docker image after Gradle build/test. |
| `IMAGE_NAME` | `shopverse/order-service` | Docker image repository/name. |
| `IMAGE_TAG` | empty | Optional tag. If empty, Jenkins uses `<build-number>-<git-sha>`. |

Pipeline stages:

| Stage | What it does |
| --- | --- |
| `Checkout` | Pulls the latest code from GitHub using Jenkins SCM. |
| `Resolve Image Tag` | Creates the Docker image tag used by later stages. |
| `Build And Test` | Runs `./gradlew clean build --no-daemon` inside `order-service`. |
| `Build Docker Image` | Builds `shopverse/order-service:<tag>` using the service Dockerfile. |
| `Verify Docker Image` | Runs `docker image inspect` to confirm the image exists. |

Verify the image from PowerShell:

```powershell
docker image ls shopverse/order-service
```

## Observability

- Logs are written to `/app/logs/order-service.log`.
- Prometheus scrapes `/actuator/prometheus`.
- Custom request counter: `shopverse_service_requests_logged_total{service="ORDER-SERVICE"}`.
- Zipkin receives request spans.
- Grafana Loki query:

```logql
{application="ORDER-SERVICE"}
{application="ORDER-SERVICE"} |= "Choreography saga"
```

## Next Improvements

- Replace static sample data with a real order database.
- Add a real checkout request DTO so the sample request body controls order items and quantities.
- Add DTO validation for create/update APIs.
- Add order state transitions and payment/shipping events.
- Add integration tests with Spring Security JWT test support.
