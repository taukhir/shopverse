# Shopverse Observability POC

This folder contains the local observability stack for the Shopverse microservices POC. It helps us answer three operational questions:

- Are the services healthy and receiving traffic?
- What happened inside each service during a request?
- Can we connect logs, metrics, and traces for the same request?

The stack includes:

- Prometheus scrapes Spring Boot Actuator metrics from each service.
- Loki stores centralized service logs.
- Promtail ships Docker container logs and local service log files to Loki.
- Grafana includes Prometheus, Loki, and Zipkin datasources plus a starter dashboard.
- Zipkin is included so trace IDs in logs can be correlated with traces.

## How It Works

```text
Spring Boot services
  -> logs to console and /app/logs/*.log
  -> exposes /actuator/prometheus
  -> sends tracing spans to Zipkin

Promtail
  -> reads service log files and Docker container logs
  -> extracts labels like application, level, traceId, spanId
  -> pushes logs to Loki

Prometheus
  -> scrapes /actuator/prometheus from each service
  -> stores metrics time series

Loki
  -> stores centralized logs
  -> keeps labels for filtering and correlation

Grafana
  -> queries Prometheus for metrics
  -> queries Loki for logs
  -> queries Zipkin for traces
```

## Start The Stack

From the root `shopverse` folder, start the full POC stack:

```powershell
docker compose up -d
```

You can also start only the standalone observability stack from this folder:

```powershell
docker compose up -d
```

Open:

- Grafana: http://localhost:3000
- Prometheus: http://localhost:9090
- Loki: http://localhost:3100
- Zipkin: http://localhost:9411

Grafana login:

- Username: `admin`
- Password: `admin`

## Service-Side Logging Config

Shared logging config is managed through the centralized config folder:

```text
../cloud-configs/application.yml
```

Important configuration:

```yaml
logging:
  include-application-name: false
  file:
    name: ${LOG_FILE:logs/${spring.application.name}.log}
  pattern:
    correlation: "[${spring.application.name:},%X{traceId:-},%X{spanId:-}] "
```

This makes every service write logs to a file and include correlation data in the log line:

```text
[USER-SERVICE,<traceId>,<spanId>]
```

Example log shape:

```text
2026-05-26T14:38:09.317+05:30 INFO [ORDER-SERVICE,abc123,def456] ... Health check requested for order service
```

The `traceId` and `spanId` values come from Micrometer tracing. They allow us to search logs for one request and connect those logs to Zipkin traces.

## Application Logs Added In Services

The services use Lombok SLF4J with `@Slf4j`.

Examples:

```java
@Slf4j
public class UserController {
    // log.info(...), log.warn(...)
}
```

Logs were added around useful business and request events, for example:

- user creation, update, password change, password reset, and deletion
- user lookup and validation failures
- authentication start, success, and failure
- order health check, catalog lookup, order creation, and order deletion
- request start/completion with method, path, status, and duration

Request logging filters were added in services such as user, order, and auth service. These filters log:

```text
method
path
status
durationMs
```

They skip `/actuator/prometheus` so Prometheus scraping does not create noisy logs.

The same filters also increment a custom Micrometer counter:

```text
shopverse.service.requests.logged
```

Labels on this metric include:

```text
service
method
status
outcome
```

## Docker Logging Setup

In the root `docker-compose.yml`, each service receives a `LOG_FILE` environment variable:

```yaml
LOG_FILE: /app/logs/user-service.log
LOG_FILE: /app/logs/order-service.log
LOG_FILE: /app/logs/security-service.log
LOG_FILE: /app/logs/api-gateway.log
```

Each service also mounts a Docker volume at `/app/logs`:

```yaml
volumes:
  - user-service-logs:/app/logs
```

This keeps logs outside the application container filesystem. If a service container is recreated, its log volume can still exist unless the Docker volume is removed.

## Promtail Log Collection

Promtail is configured in:

```text
promtail.yml
```

It collects logs from three places:

```text
/service-logs/*/*.log
/workspace/*/logs/*.log
Docker container stdout/stderr logs
```

Promtail uses regex pipeline stages to parse Spring Boot log lines and extract labels:

```text
level
application
traceId
spanId
container
compose_service
stream
```

Those labels make logs easy to query in Grafana.

Example:

```logql
{application="USER-SERVICE"}
```

or:

```logql
{traceId="paste-trace-id-here"}
```

## Loki Log Storage

Loki is configured in:

```text
loki.yml
```

For this POC, Loki stores data on the local filesystem inside the Docker volume:

```text
loki-data:/loki
```

Retention is enabled:

```yaml
limits_config:
  retention_period: 168h
```

That means logs are kept for about 7 days.

This POC does not currently use JSON logs. The services produce standard Spring Boot text logs with a correlation pattern, and Promtail parses those logs using regex. JSON logs can be added later if we want stronger structured logging.

## Metrics Collection

Each Spring service exposes metrics at:

```text
/actuator/prometheus
```

Prometheus scrapes these local ports from inside Docker via `host.docker.internal`:

- API Gateway: `8080`
- Auth Service: `8081`
- User Service: `8082`
- Order Service: `8083`
- Discovery Server: `8761`
- Config Server: `8888`

Micrometer produces JVM, HTTP, process, and custom application metrics. Prometheus scrapes those metrics and Grafana displays them.

Useful metric examples:

```promql
up
```

```promql
http_server_requests_seconds_count
```

```promql
jvm_memory_used_bytes
```

```promql
shopverse_service_requests_logged_total
```

## Grafana Datasources

Grafana datasources are provisioned from:

```text
grafana/provisioning/datasources/datasources.yml
```

Configured datasources:

- `Prometheus`: metrics
- `Loki`: centralized logs
- `Zipkin`: distributed traces

Grafana is the main UI for checking aggregated logs and metrics.

## Useful Grafana Queries

Recent logs:

```logql
{job=~"shopverse-local-files|shopverse-service-volume-files|docker-containers"}
```

Logs for one service:

```logql
{application="ORDER-SERVICE"}
```

Logs for one trace:

```logql
{traceId="paste-trace-id-here"}
```

HTTP request rate:

```promql
sum by (application) (rate(http_server_requests_seconds_count[1m]))
```

Service scrape health:

```promql
up{job="shopverse-services"}
```

Custom request log counter:

```promql
sum by (service, outcome) (increase(shopverse_service_requests_logged_total[5m]))
```

Logs with errors:

```logql
{job=~"shopverse-local-files|shopverse-service-volume-files|docker-containers"} |= "ERROR"
```

Logs for auth failures:

```logql
{application="AUTH-SERVICE"} |= "Authentication failed"
```

## Checking The Flow

Generate traffic:

```powershell
curl.exe http://localhost:8080/api/v1/orders/public/health
```

Open Grafana:

```text
http://localhost:3000
```

Check logs:

1. Go to Explore.
2. Select the Loki datasource.
3. Run:

```logql
{application="ORDER-SERVICE"}
```

Check metrics:

1. Go to Explore.
2. Select the Prometheus datasource.
3. Run:

```promql
sum by (application) (rate(http_server_requests_seconds_count[1m]))
```

Check traces:

1. Open Zipkin at `http://localhost:9411`.
2. Search for recent traces.
3. Copy a trace ID.
4. In Grafana Loki, search:

```logql
{traceId="paste-trace-id-here"}
```

This connects one request across traces and logs.

## Common Troubleshooting

If logs do not appear in Grafana:

- Check Promtail is running: `docker compose ps promtail`
- Check Promtail logs: `docker logs shopverse-promtail`
- Check Loki is running: `docker compose ps loki`
- Confirm service logs exist in the mounted volumes.
- Generate new traffic after the stack is up.

If metrics do not appear:

- Open Prometheus: `http://localhost:9090`
- Go to Status, then Targets.
- Confirm service targets are `UP`.
- Check a service endpoint directly, for example:

```text
http://localhost:8082/actuator/prometheus
```

If trace IDs are empty in logs:

- Confirm tracing is enabled in centralized config.
- Confirm the service has Micrometer tracing/Zipkin dependencies.
- Generate traffic through the API Gateway so trace context can flow across services.
