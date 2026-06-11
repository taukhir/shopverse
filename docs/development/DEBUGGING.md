# Debugging Guide

## 1. Identify The Layer

| Symptom | First place to check |
|---|---|
| `401` | gateway/resource-server security and token validity |
| `403` | roles, permissions, ownership, method security |
| `429` | Resilience4j rate limiter |
| `5xx` | service logs and trace |
| checkout stuck | order timeline, outbox, Kafka lag, DLT |
| stock incorrect | reservation rows, optimistic-lock errors, expiry task |
| payment uncertain | payment status and reconciliation endpoint |
| no logs in Loki | source file/stdout, Promtail positions and labels |
| no trace in Zipkin | sampling, exporter endpoint, instrumentation |
| no metric | actuator endpoint, Prometheus target, metric name |

## 2. Container State

```powershell
docker compose ps
docker compose logs --tail=200 order-service
docker inspect --format '{{json .State.Health}}' shopverse-order-service
```

Start with one affected service. Avoid streaming every container unless investigating a startup dependency chain.

## 3. Correlate The Request

Use or capture `X-Correlation-Id`, then search Loki:

```logql
{log_type="application"} | json | correlationId="CORRELATION_ID"
```

Use `traceId` in Zipkin for timing and downstream relationships.

## 4. Check Persistent State

For SAGA issues inspect:

- Order: `orders`, `order_timeline_events`, `outbox_events`, `failed_kafka_events`;
- Inventory: `inventory_items`, `inventory_reservations`, `outbox_events`, `failed_kafka_events`;
- Payment: `payments`, `outbox_events`, `failed_kafka_events`;
- Liquibase: `DATABASECHANGELOG`, `DATABASECHANGELOGLOCK`.

Never repair state manually before preserving evidence and understanding the failed transition.

## 5. Check Kafka

```powershell
docker compose exec kafka kafka-topics.sh `
  --bootstrap-server localhost:9092 --list

docker compose exec kafka kafka-consumer-groups.sh `
  --bootstrap-server localhost:9092 --describe --all-groups
```

Growing lag means consumers are slower than producers or repeatedly failing. Check retry and DLT topics.

## 6. Check Observability

Prometheus:

```promql
up{job="shopverse-services"}
```

```promql
sum by (outcome) (increase(shopverse_outbox_publish_total[15m]))
```

Loki:

```logql
{application="ORDER-SERVICE"} | json | level=~"WARN|ERROR"
```

Zipkin: search the exact trace ID and compare server/client spans.

## Common Cases

### Public Endpoint Returns 401

Confirm the gateway route and its public path matcher both allow the exact path. The downstream service must also permit the path.

### Loki Has Only One Service

The request may not have reached the next service, or the asynchronous event may have a different trace. Search by correlation ID, widen the time window, and choose application-file or Docker job consistently.

### Outbox Stays Pending

Check scheduler health, Kafka availability, row-lock errors, and `shopverse_outbox_publish_total{outcome="failed"}`. The pending row is recoverable; do not create a duplicate domain command.

### Liquibase Lock Remains

Confirm no migration process is active before clearing a stale lock. Inspect startup logs and `DATABASECHANGELOGLOCK`.

### Tests Hang

Check Testcontainers startup, Docker capacity, unbounded Awaitility calls, and non-daemon executors. Add a timeout at the test, polling, and process levels.
