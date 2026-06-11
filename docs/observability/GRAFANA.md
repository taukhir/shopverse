# Grafana

Grafana is the visualization and investigation layer. It does not collect or permanently store Shopverse metrics, logs, or traces; it queries Prometheus, Loki, and Zipkin.

## Provisioned Dashboards

- **Shopverse Observability Overview**: request rate, service scrape health, and recent logs.
- **Shopverse Commerce Operations**: active SAGAs, transitions, payment outcomes, reservation conflicts, and expired reservations.

## Investigation Workflow

1. Open the overview dashboard and select the incident time window.
2. Confirm service health and compare request/error/latency panels.
3. Open Commerce Operations for domain failure indicators.
4. Use Explore with Loki and search the correlation ID.
5. Follow the trace link or open Zipkin using the trace ID.
6. Inspect DLT/replay APIs if the event flow stopped after retries.

## Correlation Link Pattern

A dashboard data link can open Loki Explore with a correlation filter:

```text
{log_type="application"} | json | correlationId="$correlationId"
```

Trace links should use `traceId`, not correlation ID, because Zipkin indexes traces by trace identifier.

## Dashboard Practices

- Use Prometheus for rates, counts, percentiles, and SLOs.
- Use Loki for exact business context and exception details.
- Use Zipkin for service timing and span relationships.
- Keep variables and metric labels bounded.
- Display unit, time range, and service clearly on every panel.
