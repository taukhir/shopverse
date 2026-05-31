# Shopverse Observability POC

This stack gives the Shopverse services a small local observability setup:

- Prometheus scrapes Spring Boot Actuator metrics from each service.
- Loki stores centralized service logs.
- Promtail ships Docker container logs and local service log files to Loki.
- Grafana includes Prometheus, Loki, and Zipkin datasources plus a starter dashboard.
- Zipkin is included so trace IDs in logs can be correlated with traces.

## Start The Stack

From this directory:

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

## Service Requirements

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

Each service also writes a local log file under:

```text
<service>/logs/<spring.application.name>.log
```

Promtail scrapes those files from the mounted workspace and also scrapes Docker container stdout logs.

## Useful Grafana Queries

Recent logs:

```logql
{job="shopverse-local-files"}
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
