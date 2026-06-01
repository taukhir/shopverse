# Shopverse

Shopverse is a Spring Boot microservices proof of concept for an e-commerce backend. It demonstrates service discovery, centralized configuration, API gateway routing, asymmetric JWT security, service-to-service communication, distributed tracing, centralized logging, and metrics dashboards.

## Architecture Overview

### Components

| Component | Port | Responsibility |
| --- | ---: | --- |
| Config Server | `8888` | Loads centralized service configuration from the root `cloud-configs/` folder. |
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

- **Centralized config:** Spring Cloud Config Server reads shared and service-specific config from `cloud-configs/`.
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

## Run Everything With Docker Compose

The root [docker-compose.yml](docker-compose.yml) starts the full Shopverse POC:

- MySQL
- Config Server
- Discovery Server
- User Service
- Auth Service
- Order Service
- API Gateway
- Prometheus
- Loki
- Promtail
- Zipkin
- Grafana

Each service has a production-minded Dockerfile with:

- Multi-stage Java 21 build/runtime images.
- Gradle dependency caching.
- Non-root runtime user.
- Container-aware JVM settings.
- Actuator healthcheck.
- App logs written under `/app/logs`.

### 1. Create Local Environment File

```powershell
Copy-Item .env.example .env
```

Adjust `.env` if needed:

```text
MYSQL_DATABASE=user_service
MYSQL_USER=ahmed
MYSQL_PASSWORD=Ahm3d@123
MYSQL_ROOT_PASSWORD=root
GRAFANA_ADMIN_PASSWORD=admin
```

### 2. Build Images

```powershell
docker compose build
```

### 3. Start The Full Stack

```powershell
docker compose up -d
```

### 4. Watch Startup Logs

```powershell
docker compose logs -f config-server discovery-server mysql
```

Then:

```powershell
docker compose logs -f user-service security-service order-service api-gateway
```

### 5. Check Container Health

```powershell
docker compose ps
```

Expected important containers should eventually show `healthy`:

```text
shopverse-config-server
shopverse-discovery-server
shopverse-user-service
shopverse-security-service
shopverse-order-service
shopverse-api-gateway
shopverse-mysql
```

### 6. Smoke Test APIs

```powershell
curl http://localhost:8888/actuator/health
curl http://localhost:8761/actuator/health
curl http://localhost:8082/actuator/health
curl http://localhost:8081/actuator/health
curl http://localhost:8083/actuator/health
curl http://localhost:8080/actuator/health
curl http://localhost:8080/api/v1/orders/public/health
```

### 7. Open UIs

| Tool | URL |
| --- | --- |
| API Gateway | `http://localhost:8080` |
| Eureka | `http://localhost:8761` |
| Grafana | `http://localhost:3000` |
| Prometheus | `http://localhost:9090` |
| Loki | `http://localhost:3100` |
| Zipkin | `http://localhost:9411` |

Grafana credentials:

```text
admin / value from GRAFANA_ADMIN_PASSWORD
```

### 8. Stop The Stack

```powershell
docker compose down
```

Stop and remove volumes, including MySQL, Loki, Prometheus, and Grafana data:

```powershell
docker compose down -v
```

### Docker Notes

The Docker Compose file uses container DNS names instead of `localhost`:

```text
config-server:8888
discovery-server:8761
mysql:3306
zipkin:9411
security-service:8081
```

This matters because `localhost` inside a container means the container itself, not your host machine.

The Config Server uses the native profile in Docker and mounts `./cloud-configs` as a read-only config folder at `/config`.

## Docker Command Reference

Run these commands from the root `shopverse` folder:

```powershell
cd "D:\BE Projects\shopverse"
```

### Build Images

Build all service images:

```powershell
docker compose build
```

Build one service image:

```powershell
docker compose build user-service
docker compose build security-service
docker compose build order-service
docker compose build api-gateway
docker compose build config-server
docker compose build discovery-server
```

Build without Docker cache:

```powershell
docker compose build --no-cache user-service
```

List Shopverse images:

```powershell
docker images "shopverse/*"
```

### Start Services

Start the full stack:

```powershell
docker compose up -d
```

Start only infrastructure first:

```powershell
docker compose up -d mysql config-server discovery-server zipkin loki promtail prometheus grafana
```

Start application services:

```powershell
docker compose up -d user-service security-service order-service api-gateway
```

Start one service:

```powershell
docker compose up -d user-service
```

Recreate one service after config or image changes:

```powershell
docker compose up -d --force-recreate user-service
```

Recreate a service and its dependent runtime path:

```powershell
docker compose up -d --force-recreate user-service security-service order-service api-gateway prometheus
```

### Stop And Restart

Stop all containers without removing them:

```powershell
docker compose stop
```

Stop one service:

```powershell
docker compose stop user-service
```

Restart one service:

```powershell
docker compose restart user-service
```

Restart services that depend on config changes:

```powershell
docker compose restart user-service security-service order-service api-gateway
```

Stop and remove containers, but keep volumes:

```powershell
docker compose down
```

Stop and remove containers plus volumes:

```powershell
docker compose down -v
```

Use `down -v` carefully because it removes MySQL, Loki, Prometheus, Grafana, and service log volumes.

### Check Status And Health

List running containers:

```powershell
docker compose ps
```

List all containers:

```powershell
docker ps -a
```

Inspect one container:

```powershell
docker inspect shopverse-user-service
```

Check container resource usage:

```powershell
docker stats
```

Check Docker volumes:

```powershell
docker volume ls
```

### Docker Logs

Show logs for all services:

```powershell
docker compose logs
```

Follow all logs live:

```powershell
docker compose logs -f
```

Show only the last 100 lines:

```powershell
docker compose logs --tail=100
```

Follow one service:

```powershell
docker compose logs -f user-service
docker compose logs -f security-service
docker compose logs -f order-service
docker compose logs -f api-gateway
docker compose logs -f config-server
docker compose logs -f discovery-server
```

Check observability logs:

```powershell
docker compose logs -f promtail
docker compose logs -f loki
docker compose logs -f prometheus
docker compose logs -f grafana
docker compose logs -f zipkin
```

Use container names directly:

```powershell
docker logs -f shopverse-user-service
docker logs -f shopverse-order-service
docker logs -f shopverse-api-gateway
docker logs -f shopverse-promtail
```

Show recent logs:

```powershell
docker logs --tail 50 shopverse-user-service
docker logs --since 10m shopverse-user-service
docker logs -f --tail 100 shopverse-user-service
```

Search logs in PowerShell:

```powershell
docker compose logs user-service | Select-String "ERROR"
docker compose logs | Select-String "Exception"
docker compose logs | Select-String "traceId"
```

### Execute Commands Inside Containers

Open a shell inside a container:

```powershell
docker exec -it shopverse-user-service sh
```

Check service log files inside a container:

```powershell
docker exec -it shopverse-user-service sh -c "ls -la /app/logs"
```

Check environment variables inside a container:

```powershell
docker exec -it shopverse-user-service sh -c "env | sort"
```

Check MySQL from inside the MySQL container:

```powershell
docker exec -it shopverse-mysql mysql -uahmed -pAhm3d@123 user_service
```

### Smoke Test Endpoints

Use `curl.exe` in PowerShell to avoid the PowerShell `curl` alias:

```powershell
curl.exe http://localhost:8888/actuator/health
curl.exe http://localhost:8761/actuator/health
curl.exe http://localhost:8082/actuator/health
curl.exe http://localhost:8081/actuator/health
curl.exe http://localhost:8083/actuator/health
curl.exe http://localhost:8080/actuator/health
```

Public order health through API Gateway:

```powershell
curl.exe http://localhost:8080/api/v1/orders/public/health
```

Check Prometheus metrics endpoint:

```powershell
curl.exe http://localhost:8082/actuator/prometheus
curl.exe http://localhost:8083/actuator/prometheus
```

Refresh user-service config after Config Server changes:

```powershell
curl.exe -X POST http://localhost:8082/actuator/refresh
```

### Authentication Test

Login as the seeded admin user through the API Gateway:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:8080/auth/login `
  -Body (@{username='admin'; password='Admin@123'} | ConvertTo-Json) `
  -ContentType 'application/json'
```

Use the returned token:

```powershell
curl.exe http://localhost:8080/api/v1/orders `
  -H "Authorization: Bearer <token>"
```

### Observability Checks

Open UIs:

```text
Grafana: http://localhost:3000
Prometheus: http://localhost:9090
Loki: http://localhost:3100
Zipkin: http://localhost:9411
Eureka: http://localhost:8761
```

Check Prometheus targets:

```text
http://localhost:9090/targets
```

Check Grafana dashboard:

```text
http://localhost:3000
```

Useful Loki queries in Grafana Explore:

```logql
{application="USER-SERVICE"}
{application="ORDER-SERVICE"}
{application="AUTH-SERVICE"}
{job=~"shopverse-local-files|shopverse-service-volume-files|docker-containers"}
{traceId="paste-trace-id-here"}
```

Useful Prometheus queries in Grafana Explore:

```promql
up
http_server_requests_seconds_count
sum by (application) (rate(http_server_requests_seconds_count[1m]))
sum by (service, outcome) (increase(shopverse_service_requests_logged_total[5m]))
```

### Cleanup

Remove stopped containers:

```powershell
docker container prune
```

Remove unused images:

```powershell
docker image prune
```

Remove unused volumes:

```powershell
docker volume prune
```

Remove unused Docker resources:

```powershell
docker system prune
```

Full reset for this POC:

```powershell
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

The full reset deletes database data, logs, metrics history, and Grafana data because it removes volumes.

## Centralized Config

Runtime configuration is maintained in the root project folder:

```text
cloud-configs/
```

Local service `application.yaml` files should mostly contain bootstrap config:

```yaml
spring:
  application:
    name: USER-SERVICE
  config:
    import: optional:configserver:http://localhost:8888
```

Shared observability settings should live in `cloud-configs/application.yml`:

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

Use this observability-only compose file when you are running the Spring services from IntelliJ, Gradle, or terminals on your host machine.

Start only observability:

```powershell
cd "D:\BE Projects\shopverse\observability"
docker compose up -d
```

If you want Docker to run MySQL, all Spring services, and observability together, use the root compose file instead:

```powershell
cd "D:\BE Projects\shopverse"
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
{job=~"shopverse-local-files|shopverse-service-volume-files"}
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
{job=~"shopverse-local-files|shopverse-service-volume-files|docker-containers"}
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

## Component Glossary

### Spring Boot

The main framework used to build each microservice. It provides auto-configuration, embedded servers, Actuator endpoints, security integration, and production-ready defaults.

### Spring Cloud Config Server

Centralized configuration service. Instead of copying the same YAML properties into every service, services fetch their runtime configuration from the Config Server, which reads from:

```text
cloud-configs/
```

In this POC, shared settings like actuator exposure, logging patterns, tracing config, database URLs, and service-specific properties are managed from that centralized folder. Docker mounts it into Config Server as `/config`.

### Spring Cloud Gateway

The API Gateway and single entry point for client traffic. Clients call the gateway on port `8080`, and the gateway forwards requests to internal services such as `ORDER-SERVICE`, `USER-SERVICE`, and `AUTH-SERVICE`.

It helps centralize routing, cross-cutting filters, and external API exposure.

### Eureka Discovery Server

Service registry. Microservices register themselves with Eureka, and other services can discover them by name instead of hardcoded host/port values.

Example:

```text
AUTH-SERVICE -> USER-SERVICE
```

The Auth Service can call User Service by service name through Feign and Eureka.

### Spring Security

Provides authentication and authorization support. In this POC, services use Spring Security to protect APIs and validate JWT access tokens.

### Asymmetric JWT

JWT authentication using an RSA key pair:

- Auth Service signs JWTs using the private key.
- Other services validate JWTs using the public key.
- The public key is exposed through the JWKS endpoint:

```text
/auth/.well-known/jwks.json
```

This is safer than sharing a single secret across all services.

### JWKS

JSON Web Key Set. It is a standard format for exposing public keys used to verify JWT signatures.

Resource services use the JWKS endpoint to validate tokens issued by the Auth Service.

### OpenFeign

Declarative HTTP client used for service-to-service calls.

In this POC, Auth Service uses Feign to call User Service:

```java
@FeignClient(name = "USER-SERVICE")
```

Feign works nicely with Eureka, so the service can be called by name instead of a fixed URL.

### Spring Boot Actuator

Production monitoring endpoints for each service.

Important endpoints in this POC:

```text
/actuator/health
/actuator/info
/actuator/prometheus
```

Prometheus scrapes `/actuator/prometheus` to collect service metrics.

### Micrometer

Metrics and observability facade used by Spring Boot.

Micrometer gives the app a common API for metrics, while different backends can consume those metrics. In this POC, Micrometer exposes metrics in Prometheus format through:

```gradle
runtimeOnly 'io.micrometer:micrometer-registry-prometheus'
```

It also provides the foundation for tracing integration through Spring Boot observability.

### Prometheus

Metrics database and scraper.

Prometheus periodically calls each service's:

```text
/actuator/prometheus
```

Then it stores metrics such as request counts, request durations, JVM memory, CPU usage, and custom counters like:

```promql
shopverse_service_requests_logged_total
shopverse_gateway_requests_logged_total
```

Prometheus answers metric queries using PromQL.

### Grafana

Visualization and exploration UI.

Grafana connects to:

- Prometheus for metrics.
- Loki for logs.
- Zipkin for traces.

In this POC, Grafana is used to see dashboards, query logs, inspect service health, and correlate logs with trace IDs.

### Loki

Centralized log storage from Grafana Labs.

Loki stores logs with labels such as:

```text
application
traceId
spanId
level
job
```

You query Loki from Grafana using LogQL.

Example:

```logql
{application="ORDER-SERVICE"}
```

### Promtail

Log shipper for Loki.

Promtail reads logs and sends them to Loki. In this POC, it reads:

- local service log files: `<service>/logs/*.log`
- Docker container stdout logs

Promtail also extracts labels like `application`, `traceId`, and `spanId` from log lines.

### Zipkin

Distributed tracing backend.

Zipkin receives spans from services and shows request timelines across services. It helps answer questions like:

- Which services were involved in this request?
- How long did each service take?
- Where did the request fail?

In this POC, services send traces to:

```text
http://localhost:9411/api/v2/spans
```

### Distributed Tracing

Distributed tracing follows one request as it moves across multiple services.

Each request gets:

- `traceId`: same ID across the full request journey.
- `spanId`: ID for one operation inside that trace.

Example:

```text
Client -> API Gateway -> Order Service
```

The gateway and order service logs should share the same `traceId`, making it easier to debug one request across services.

### OpenTelemetry

OpenTelemetry is an open standard for traces, metrics, and logs.

In this current POC, we are not directly using OpenTelemetry as the tracing implementation. We are using:

```text
Spring Boot Zipkin starter -> Micrometer Tracing -> Zipkin
```

OpenTelemetry could be introduced later if we want vendor-neutral exporting to observability platforms such as Grafana Tempo, Jaeger, Honeycomb, New Relic, Datadog, or an OpenTelemetry Collector.

### Centralized Logging

Centralized logging means logs from all services are collected in one place instead of checking each terminal separately.

In this POC:

```text
Spring Boot logs
  -> local log file / Docker stdout
  -> Promtail
  -> Loki
  -> Grafana
```

This lets us search logs across all services by application, level, or trace ID.

### Docker Compose

Used to run the local observability stack with one command:

```powershell
docker compose up -d
```

The compose file starts:

- Grafana
- Prometheus
- Loki
- Promtail
- Zipkin

### Gradle

Build tool used by each service. Dependencies such as Spring Boot, Prometheus registry, Zipkin starter, Lombok, and Spring Cloud libraries are declared in each service's `build.gradle`.

Config Server cannot provide Gradle dependencies. It only provides runtime properties.

### Lombok

Reduces Java boilerplate.

Examples used in the project:

```java
@Slf4j
@RequiredArgsConstructor
```

`@Slf4j` creates the logger used for centralized logging.
