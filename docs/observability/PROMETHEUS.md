# Prometheus

Prometheus periodically pulls metrics from `/actuator/prometheus`. It stores time series, evaluates recording rules and alerts, and supplies Grafana with metric data.

Application code creates and updates meters through Micrometer's
`MeterRegistry`. See [Micrometer metrics](MICROMETER-METRICS.md) for the
`meterRegistry.counter(...)` flow, meter types, dependencies, and tag
cardinality practices.

## Useful PromQL

Service health:

```promql
up{job="shopverse-services"}
```

Request rate by service:

```promql
sum by (application) (rate(http_server_requests_seconds_count[5m]))
```

5xx rate:

```promql
sum by (application) (
  rate(http_server_requests_seconds_count{status=~"5.."}[5m])
)
```

p95 latency:

```promql
histogram_quantile(
  0.95,
  sum by (le, application) (rate(http_server_requests_seconds_bucket[5m]))
)
```

SAGA transitions:

```promql
sum by (stage) (increase(shopverse_saga_transitions_total[15m]))
```

Payment outcomes:

```promql
sum by (status) (increase(shopverse_payment_outcomes_total[15m]))
```

Inventory conflicts and expirations:

```promql
sum by (reason) (increase(shopverse_inventory_reservation_conflicts_total[15m]))
```

```promql
sum(increase(shopverse_inventory_reservations_expired_total[15m]))
```

Outbox publication:

```promql
sum by (outcome) (increase(shopverse_outbox_publish_total[15m]))
```

DLT and replay:

```promql
sum by (service) (increase(shopverse_kafka_dlt_events_total[1h]))
```

```promql
sum by (service) (increase(shopverse_kafka_dlt_replays_total[1h]))
```

## Investigation Workflow

1. Check `up` to confirm scrape health.
2. Compare request rate, errors, and latency.
3. Inspect SAGA, payment, inventory, outbox, and DLT counters.
4. Move to Loki with the affected time range and correlation ID.
5. Use Zipkin when the problem is latency or a broken call chain.

Prometheus does not store application logs and cannot search a correlation ID.
