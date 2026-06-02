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
| `GET` | `/api/v1/orders` | `ROLE_USER` or `ROLE_ADMIN` | Sample current-user orders |
| `GET` | `/api/v1/orders/{id}` | `ROLE_USER` or `ROLE_ADMIN` | Sample order by ID |
| `POST` | `/api/v1/orders` | `ROLE_USER` or `ROLE_ADMIN` | Returns a sample created order |
| `POST` | `/api/v1/orders/checkout` | `ROLE_USER` or `ROLE_ADMIN` | Starts the Kafka choreography SAGA checkout flow |
| `DELETE` | `/api/v1/orders/{id}` | `ROLE_ADMIN` | Returns a sample delete response |
| `GET` | `/api/v1/orders/admin/all` | `ROLE_ADMIN` | Sample admin order list |

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

## Choreography SAGA

Order Service starts the POC saga when an order is created:

```text
Order Service publishes shopverse.order.created
Inventory Service publishes shopverse.inventory.reserved or shopverse.inventory.failed
Payment Service publishes shopverse.payment.completed or shopverse.payment.failed
Order Service logs the final confirmed, rejected, or payment-failed status
```

Useful log command:

```powershell
docker compose logs -f order-service inventory-service payment-service kafka
```

Protected endpoint:

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
- Add DTO validation for create/update APIs.
- Add order state transitions and payment/shipping events.
- Add integration tests with Spring Security JWT test support.
