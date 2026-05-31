# Shopverse

Shopverse is a Spring Boot microservices proof of concept for an e-commerce backend. It demonstrates service discovery, centralized configuration, API gateway routing, asymmetric JWT security, service-to-service communication, distributed tracing, centralized logging, and metrics dashboards.

## Architecture Overview

### Components

| Component | Port | Responsibility |
| --- | ---: | --- |
| Config Server | `8888` | Loads centralized service configuration from `https://github.com/taukhir/spring-cloud-configs`. |
| Discovery Server | `8761` | Eureka service registry for service discovery. |
| API Gateway | `8080` | Single entry point for clients and route forwarding to backend services. |
| Auth Service | `8081` | Authenticates users, issues asymmetric JWTs, exposes JWKS public keys. |
| User Service | `8082` | Manages users, roles, permissions, password lifecycle, and internal user lookup APIs. |
| Order Service | `8083` | Order API POC protected by JWT authorization rules. |
| Observability Stack | `3000`, `9090`, `3100`, `9411` | Grafana, Prometheus, Loki, and Zipkin. |

### How Requests Flow

```text
Client
  -> API Gateway
  -> Target service through Eureka discovery
  -> Service validates JWT using Auth Service JWKS endpoint
  -> Service handles request
  -> Logs go to Loki through Promtail
  -> Metrics are scraped by Prometheus
  -> Traces are exported to Zipkin
  -> Grafana visualizes logs and metrics
```

### Key Patterns Used

- **Centralized config:** Spring Cloud Config Server reads service config from GitHub.
- **Service discovery:** Eureka lets services register and discover each other by service name.
- **API gateway:** Spring Cloud Gateway routes external traffic to internal services.
- **Asymmetric JWT:** Auth Service signs tokens with an RSA private key; resource services validate using JWKS public keys.
- **Feign client:** Auth Service calls User Service using `@FeignClient(name = "USER-SERVICE")`.
- **Distributed tracing:** Spring Boot Zipkin starter creates trace/span IDs and exports traces to Zipkin.
- **Centralized logging:** Services log to console/file; Promtail ships logs to Loki; Grafana queries Loki.
- **Metrics:** Actuator + Micrometer Prometheus registry expose `/actuator/prometheus` for Prometheus scraping.

## Local Run Order

Start services in this order:

```text
1. config-server
2. discovery-server
3. user-service
4. security-service
5. order-service
6. api-gateway
```

Health checks:

```powershell
curl http://localhost:8888/actuator/health
curl http://localhost:8761/actuator/health
curl http://localhost:8082/actuator/health
curl http://localhost:8081/actuator/health
curl http://localhost:8083/actuator/health
curl http://localhost:8080/actuator/health
```

Eureka dashboard:

```text
http://localhost:8761
```

## Centralized Config

Runtime configuration is maintained in:

```text
https://github.com/taukhir/spring-cloud-configs
```

Local service `application.yaml` files should mostly contain bootstrap config:

```yaml
spring:
  application:
    name: USER-SERVICE
  config:
    import: optional:configserver:http://localhost:8888
```

Shared observability settings should live in the config repo's common `application.yaml`:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus
  metrics:
    tags:
      application: ${spring.application.name}
  tracing:
    enabled: ${TRACING_ENABLED:true}
    sampling:
      probability: ${TRACING_SAMPLING_PROBABILITY:1.0}
    export:
      zipkin:
        endpoint: ${ZIPKIN_ENDPOINT:http://localhost:9411/api/v2/spans}

logging:
  include-application-name: false
  file:
    name: ${LOG_FILE:logs/${spring.application.name}.log}
  pattern:
    correlation: "[${spring.application.name:},%X{traceId:-},%X{spanId:-}] "
```

Important: dependencies still belong in each service `build.gradle`. Config Server can provide properties, but it cannot add libraries to a running app.

## Security And JWT

Auth Service uses RSA keys for asymmetric JWT:

- Private key signs JWTs.
- Public key is exposed through JWKS.
- Resource services validate incoming JWTs using the JWKS endpoint.

JWKS endpoint:

```powershell
curl http://localhost:8081/auth/.well-known/jwks.json
```

Login endpoint:

```powershell
curl -X GET http://localhost:8081/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"username\":\"admin\",\"password\":\"password\"}"
```

Use the returned token against protected APIs:

```powershell
curl http://localhost:8080/api/v1/orders `
  -H "Authorization: Bearer <token>"
```

## Observability Stack

The local observability stack is in:

```text
observability/
```

Start it:

```powershell
cd "D:\BE Projects\shopverse\observability"
docker compose up -d
```

Open:

| Tool | URL | Purpose |
| --- | --- | --- |
| Grafana | `http://localhost:3000` | Logs and metrics dashboards. Login: `admin/admin`. |
| Prometheus | `http://localhost:9090` | Metrics scraping and PromQL. |
| Loki | `http://localhost:3100` | Centralized log storage. |
| Zipkin | `http://localhost:9411` | Distributed trace search. |

Grafana has provisioned datasources for Prometheus, Loki, and Zipkin, plus a starter dashboard:

```text
Dashboards -> Shopverse -> Shopverse Observability Overview
```

## Check Centralized Logging

### 1. Generate Logs

Call a few endpoints:

```powershell
curl http://localhost:8080/api/v1/orders/public/health
curl http://localhost:8083/api/v1/orders/public/health
curl http://localhost:8081/auth/verify
curl http://localhost:8888/actuator/health
curl http://localhost:8761/actuator/health
```

Expected service logs look like:

```text
Order service request started method=GET path=/api/v1/orders/public/health
Order service request completed method=GET path=/api/v1/orders/public/health status=200 durationMs=12
```

### 2. Query Logs In Grafana

Open:

```text
Grafana -> Explore -> Loki
```

All local service log files:

```logql
{job="shopverse-local-files"}
```

One service:

```logql
{application="ORDER-SERVICE"}
```

Gateway:

```logql
{application="API-GATEWAY"}
```

Auth service:

```logql
{application="AUTH-SERVICE"}
```

Search by trace ID:

```logql
{traceId="paste-trace-id-here"}
```

Promtail reads:

- local files: `<service>/logs/*.log`
- Docker container stdout logs

`/actuator/prometheus` requests are intentionally not logged by custom request filters to avoid scrape noise.

## Check Metrics

Each service exposes:

```text
/actuator/prometheus
```

Examples:

```powershell
curl http://localhost:8080/actuator/prometheus
curl http://localhost:8083/actuator/prometheus
```

Open:

```text
Grafana -> Explore -> Prometheus
```

Service scrape health:

```promql
up{job="shopverse-services"}
```

HTTP request rate by application:

```promql
sum by (application) (rate(http_server_requests_seconds_count[1m]))
```

Custom logged request counters:

```promql
sum by (service, status) (shopverse_service_requests_logged_total)
```

Gateway request counter:

```promql
sum by (method, status) (shopverse_gateway_requests_logged_total)
```

## Check Distributed Tracing

### 1. Start Zipkin

Zipkin is included in the observability compose stack:

```powershell
cd "D:\BE Projects\shopverse\observability"
docker compose up -d zipkin
```

Open:

```text
http://localhost:9411
```

### 2. Generate A Traced Request

Call through the gateway so the trace crosses service boundaries:

```powershell
curl http://localhost:8080/api/v1/orders/public/health
```

For an authenticated flow:

```powershell
curl http://localhost:8080/api/v1/orders `
  -H "Authorization: Bearer <token>"
```

### 3. Verify Logs Have Trace IDs

Logs should contain correlation fields:

```text
[ORDER-SERVICE,<traceId>,<spanId>]
```

In Grafana Loki:

```logql
{application="ORDER-SERVICE"}
```

Copy a `traceId`, then search all logs:

```logql
{traceId="paste-trace-id-here"}
```

### 4. Verify Trace In Zipkin

In Zipkin:

```text
Service Name -> API-GATEWAY / ORDER-SERVICE / USER-SERVICE / AUTH-SERVICE
```

Click a trace to see spans and timings.

## Useful Ports

| Port | Service |
| ---: | --- |
| `3000` | Grafana |
| `3100` | Loki |
| `9090` | Prometheus |
| `9411` | Zipkin |
| `8888` | Config Server |
| `8761` | Discovery Server |
| `8080` | API Gateway |
| `8081` | Auth Service |
| `8082` | User Service |
| `8083` | Order Service |

## Troubleshooting

### Logs Do Not Appear In Grafana

Check services are writing files:

```powershell
Get-ChildItem -Recurse -Path . -Filter *.log
```

Check Promtail is running:

```powershell
docker logs shopverse-promtail
```

Run a broad Loki query:

```logql
{job=~"shopverse-local-files|docker-containers"}
```

### Prometheus Shows Services Down

Check the service actuator endpoint directly:

```powershell
curl http://localhost:8083/actuator/prometheus
```

Check targets:

```text
http://localhost:9090/targets
```

### Trace IDs Are Empty In Logs

Confirm these dependencies exist in request-handling services:

```gradle
implementation 'org.springframework.boot:spring-boot-starter-zipkin'
```

Confirm tracing config is available through Config Server or local fallback:

```yaml
management:
  tracing:
    sampling:
      probability: 1.0
```

Restart the service after dependency or config changes.
