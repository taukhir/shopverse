# Shopverse Order Service

Order Service is a simple order API POC. It demonstrates protected order endpoints, public catalog endpoints, centralized logs, Prometheus metrics, and Zipkin tracing.

The current implementation uses static sample data so the microservices POC can be tested without adding an order database yet.

## Responsibilities

- Serve public health and sample catalog APIs.
- Serve user order APIs protected by JWT roles.
- Serve admin order APIs protected by `ROLE_ADMIN`.
- Register with Eureka as `ORDER-SERVICE`.
- Validate JWTs using the Auth Service JWKS endpoint.
- Emit request logs and custom Micrometer counters.
- Export traces to Zipkin.

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

Protected endpoint:

```powershell
curl http://localhost:8080/api/v1/orders `
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

## Observability

- Logs are written to `/app/logs/order-service.log`.
- Prometheus scrapes `/actuator/prometheus`.
- Custom request counter: `shopverse_service_requests_logged_total{service="ORDER-SERVICE"}`.
- Zipkin receives request spans.
- Grafana Loki query:

```logql
{application="ORDER-SERVICE"}
```

## Next Improvements

- Replace static sample data with a real order database.
- Add DTO validation for create/update APIs.
- Add order state transitions and payment/shipping events.
- Add integration tests with Spring Security JWT test support.
