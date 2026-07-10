---
title: Operations Cheat Sheet
sidebar_position: 3
---

# Operations Cheat Sheet

## Docker

```powershell
docker compose --profile apps --profile assets config --quiet
docker compose --profile apps --profile assets up --build -d
docker compose ps
docker compose logs -f --tail 200
docker compose restart order-service
docker compose down
```

Use `docker compose down -v` only when intentionally deleting persistent
volumes.

## Service Logs

```powershell
docker compose logs --tail 200 order-service
docker compose logs -f order-service inventory-service payment-service
```

## Loki / Grafana LogQL

All Shopverse application logs:

```logql
{job="shopverse-service-files"}
```

One service:

```logql
{job="shopverse-service-files", service="ORDER-SERVICE"}
```

One correlation ID:

```logql
{job="shopverse-service-files"} | json
| correlationId="demo-checkout-9001"
```

One trace ID:

```logql
{job="shopverse-service-files"} | json
| traceId="6a1e660de4db49fe47911954296ecce5"
```

Errors:

```logql
{job="shopverse-service-files"} | json | level="ERROR"
```

Promtail ships logs; it does not provide the query language. Log queries run
against Loki, usually through Grafana Explore.

## Prometheus / Grafana PromQL

Healthy scrape targets:

```promql
up
```

Request rate:

```promql
sum by (application) (
  rate(http_server_requests_seconds_count[5m])
)
```

5xx rate:

```promql
sum by (application) (
  rate(http_server_requests_seconds_count{status=~"5.."}[5m])
)
```

P95 latency:

```promql
histogram_quantile(
  0.95,
  sum by (le, application) (
    rate(http_server_requests_seconds_bucket[5m])
  )
)
```

Outbox publication outcomes:

```promql
sum by (application, outcome) (
  rate(shopverse_outbox_publish_total[5m])
)
```

## Zipkin

1. Open `http://localhost:9411`.
2. Choose a service or paste a trace ID.
3. Inspect span duration, parent/child relationships, tags, and errors.
4. Use the correlation ID in Loki when one business workflow spans multiple
   asynchronous traces.

## Grafana

Open `http://localhost:3000`.

- Explore Loki for logs.
- Explore Prometheus for metrics.
- Use Zipkin-derived links for traces.
- Open provisioned Shopverse dashboards for SAGA and platform health.

## Verification

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\Verify-Shopverse.ps1 `
  -Mode Quick
```

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\Verify-Shopverse.ps1 `
  -Mode Integration
```

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\Verify-Shopverse.ps1 `
  -Mode Full `
  -TimeoutMinutes 10 `
  -ForceIsolatedStack
```

## Detailed References

- [Docker guide](https://github.com/taukhir/shopverse/tree/main/docker)
- [Loki queries](../observability/LOKI.md)
- [Prometheus queries](../observability/PROMETHEUS.md)
- [Grafana](../observability/GRAFANA.md)
- [Promtail](../observability/PROMTAIL.md)
- [Debugging guide](../development/DEBUGGING.md)
