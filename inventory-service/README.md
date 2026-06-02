# Inventory Service

Inventory Service is a Shopverse Spring Boot resource service for the inventory API area.

## Runtime

| Item | Value |
| --- | --- |
| Spring application name | `INVENTORY-SERVICE` |
| Local port | `8086` |
| Gateway route | `/api/v1/inventory/**` |
| Config file | `cloud-configs/INVENTORY-SERVICE.yml` |
| Docker image | `shopverse/inventory-service:local` |

## Local Endpoints

```powershell
curl.exe http://localhost:8086/actuator/health
curl.exe http://localhost:8086/api/v1/inventory/public/health
curl.exe http://localhost:8080/api/v1/inventory/public/health
```

Protected inventory endpoints should use a JWT bearer token issued by Auth Service.

## Observability

Inventory Service imports centralized config from Config Server, registers with Eureka, writes logs to `/app/logs/inventory-service.log`, exposes Prometheus metrics at `/actuator/prometheus`, and sends traces to Zipkin.

Useful checks:

```logql
{application="INVENTORY-SERVICE"}
```

```promql
up{application="INVENTORY-SERVICE"}
sum by (service, outcome) (increase(shopverse_service_requests_logged_total{service="INVENTORY-SERVICE"}[5m]))
```

## Build

```powershell
.\gradlew.bat clean build
docker build -t shopverse/inventory-service:local .
```
