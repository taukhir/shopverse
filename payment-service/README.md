# Payment Service

Payment Service is a Shopverse Spring Boot resource service for the payment API area. In the POC choreography SAGA, it listens for inventory reservation events and publishes payment outcome events.

## Runtime

| Item | Value |
| --- | --- |
| Spring application name | `PAYMENT-SERVICE` |
| Local port | `8084` |
| Gateway route | `/api/v1/payments/**` |
| Config file | `cloud-configs/PAYMENT-SERVICE.yml` |
| Docker image | `shopverse/payment-service:local` |

## Local Endpoints

```powershell
curl.exe http://localhost:8084/actuator/health
curl.exe http://localhost:8084/api/v1/payments/public/health
curl.exe http://localhost:8080/api/v1/payments/public/health
```

Protected payment endpoints should use a JWT bearer token issued by Auth Service.

## Choreography SAGA

Payment Service listens to:

```text
shopverse.inventory.reserved
```

It publishes one of:

```text
shopverse.payment.completed
shopverse.payment.failed
```

For the demo, payments over `10000.00` fail so compensation can be shown. Successful payments publish a reference like `PAY-ORD-1003`.

## Observability

Payment Service imports centralized config from Config Server, registers with Eureka, writes logs to `/app/logs/payment-service.log`, exposes Prometheus metrics at `/actuator/prometheus`, and sends traces to Zipkin.

Useful checks:

```logql
{application="PAYMENT-SERVICE"}
{application="PAYMENT-SERVICE"} |= "Choreography saga"
```

```promql
up{application="PAYMENT-SERVICE"}
sum by (service, outcome) (increase(shopverse_service_requests_logged_total{service="PAYMENT-SERVICE"}[5m]))
```

## Build

```powershell
.\gradlew.bat clean build
docker build -t shopverse/payment-service:local .
```
