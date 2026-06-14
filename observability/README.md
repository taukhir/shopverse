# Shopverse Observability Runbook

This directory contains Prometheus, Loki, Promtail, Grafana, and alerting
configuration used by the local Shopverse stack.

Canonical documentation:

- [Shopverse observability operations](../documentation/docs/observability/SHOPVERSE-OBSERVABILITY-OPERATIONS.md)
- [Observability architecture](../documentation/docs/observability/OBSERVABILITY.md)
- [Structured logging](../documentation/docs/observability/STRUCTURED-LOGGING.md)
- [MDC, correlation, and tracing](../documentation/docs/observability/MDC-CORRELATION-TRACING.md)

## Components

| Component | Responsibility |
|---|---|
| Micrometer/Actuator | produce and expose application metrics |
| Prometheus | scrape and store time-series metrics |
| Logback | emit structured JSON logs to stdout and files |
| Promtail | discover, parse, label, and push logs |
| Loki | store and query aggregated logs |
| Micrometer Tracing/Zipkin | propagate and visualize traces |
| Grafana | query data sources and display dashboards/Explore |

## Start

```powershell
docker compose up -d prometheus loki promtail zipkin grafana
docker compose ps
```

| Component | URL |
|---|---|
| Grafana | `http://localhost:3000` |
| Prometheus | `http://localhost:9090` |
| Zipkin | `http://localhost:9411` |
| Loki readiness | `http://localhost:3100/ready` |

## End-To-End Check

```powershell
$token = "<customer-jwt>"
$correlationId = "checkout-observe-101"

curl.exe -X POST http://localhost:8080/api/v1/orders/checkout `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -H "Idempotency-Key: checkout-observe-101" `
  -H "X-Correlation-Id: $correlationId" `
  -d '{"items":[{"productId":101,"quantity":1}]}'
```

Then search:

```logql
{log_type="application"} | json | correlationId="checkout-observe-101"
```

If JSON parsing does not match the current stream, start with:

```logql
{log_type="application"} |= "checkout-observe-101"
```

## Useful Loki Queries

```logql
# All Shopverse logs
{log_type="application"}

# One service
{log_type="application", application="ORDER-SERVICE"}

# One trace
{log_type="application"} | json | traceId="TRACE_ID"

# Errors without health traffic
{log_type="application"} | json | level="ERROR" != "/actuator/health"
```

## Useful Prometheus Queries

```promql
# Target health
up

# Request rate
sum(rate(http_server_requests_seconds_count[5m])) by (application)

# 5xx rate
sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m])) by (application)

# Average latency
sum(rate(http_server_requests_seconds_sum[5m])) by (application)
/
sum(rate(http_server_requests_seconds_count[5m])) by (application)
```

The full query catalog, timer/counter explanation, cardinality guidance, and
troubleshooting procedure are in the
[operations page](../documentation/docs/observability/SHOPVERSE-OBSERVABILITY-OPERATIONS.md).

## Configuration

| Path | Purpose |
|---|---|
| `prometheus.yml` | service scrape targets |
| `prometheus-rules.yml` | alerting and recording rules |
| `promtail.yml` | log sources, JSON pipeline, and labels |
| `loki.yml` | log storage and retention |
| `grafana/provisioning` | data sources and dashboards |

## Diagnostics

```powershell
docker compose logs --tail=200 prometheus
docker compose logs --tail=200 promtail
docker compose logs --tail=200 loki
docker compose logs --tail=200 grafana
```

Use bounded output. Start with Prometheus targets, Loki readiness, and a broad
Loki query before debugging individual labels.
