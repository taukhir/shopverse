# Shopverse API Gateway

API Gateway is the public entry point for Shopverse traffic. It routes requests to backend services through Eureka service discovery and participates in centralized logging, metrics, and distributed tracing.

## Responsibilities

- Route external API calls to backend services.
- Register with Eureka as `API-GATEWAY`.
- Load runtime configuration from Config Server.
- Emit request logs with trace/span IDs.
- Expose Prometheus metrics through Actuator.
- Export request traces to Zipkin.

## Port

```text
8080
```

## Important Routes

| Route | Target |
| --- | --- |
| `/api/v1/orders/**` | `ORDER-SERVICE` |
| `/api/v1/payments/**` | `PAYMENT-SERVICE` |
| `/api/v1/inventory/**` | `INVENTORY-SERVICE` |
| `/api/v1/users/**` | `USER-SERVICE` |
| `/api/v1/roles/**` | `USER-SERVICE` |
| `/api/v1/permissions/**` | `USER-SERVICE` |
| `/auth/**` | `AUTH-SERVICE` |

`/api/v1/internal/users/**` is intentionally not exposed through the public API Gateway route table. Auth Service calls User Service directly through Eureka/OpenFeign for internal Basic credential validation.

## Useful URLs

```powershell
curl http://localhost:8080/actuator/health
curl http://localhost:8080/api/v1/orders/public/health
curl http://localhost:8080/api/v1/payments/public/health
curl http://localhost:8080/api/v1/inventory/public/health
```

Authenticated checkout SAGA route:

```powershell
curl.exe -X POST http://localhost:8080/api/v1/orders/checkout `
  -H "Authorization: Bearer <token>"
```

## Docker

From the root project:

```powershell
docker compose build api-gateway
docker compose up -d api-gateway
docker compose logs -f api-gateway
```

The full stack is started from the root:

```powershell
docker compose up -d
```

More Docker commands, flags, and Dockerfile details are in [../docker/README.md](../docker/README.md).

## Observability

- Logs are written to `/app/logs/api-gateway.log`.
- Prometheus scrapes `/actuator/prometheus`.
- Zipkin receives spans at `ZIPKIN_ENDPOINT`.
- Grafana Loki query:

```logql
{application="API-GATEWAY"}
```

## Notes

- Route definitions are maintained centrally in `cloud-configs/API-GATEWAY.yml`.
- Backend services are resolved through Eureka using service IDs such as `ORDER-SERVICE`, `PAYMENT-SERVICE`, and `INVENTORY-SERVICE`.
