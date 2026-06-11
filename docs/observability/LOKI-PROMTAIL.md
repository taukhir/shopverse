# Loki And Promtail

Promtail discovers log sources, parses JSON, attaches labels, tracks read positions, and pushes batches to Loki. Loki indexes labels and stores compressed log chunks.

## Collection Jobs

| Job | Source | Purpose |
|---|---|---|
| `shopverse-service-volume-files` | Docker-mounted application files | Main application logs |
| `local-service-log-files` | Local workspace log files | Non-container development |
| `shopverse-health-log-files` | `*-health.log` | Probe logs isolated from business traffic |
| `docker-containers` | Docker socket | Container stdout and startup output |

Promtail extracts JSON fields, but only `level` and `application` become labels. Trace and correlation IDs remain parsed fields to avoid high-cardinality indexes.

## LogQL

All application file logs:

```logql
{log_type="application"}
```

One service:

```logql
{application="ORDER-SERVICE"}
```

Exclude health logs:

```logql
{job=~"shopverse-service-volume-files|shopverse-local-files|docker-containers"}
```

Health logs only:

```logql
{log_type="health"}
```

One correlation ID:

```logql
{job=~"shopverse-service-volume-files|shopverse-local-files|docker-containers"}
| json
| correlationId="CORRELATION_ID"
```

One trace ID:

```logql
{job=~"shopverse-service-volume-files|shopverse-local-files|docker-containers"}
| json
| traceId="TRACE_ID"
```

Errors in one service:

```logql
{application="PAYMENT-SERVICE"} | json | level="ERROR"
```

SAGA messages:

```logql
{log_type="application"} | json | message=~".*(saga|SAGA|Outbox).*"
```

## Retention

Application file retention is controlled by Logback: seven days and 256 MB per service file set. Health files use three days and 64 MB. Loki retention is a separate backend setting; local POC data persists in its Docker volume until the configured retention or volume removal.

## Duplicate Logs

Because Promtail reads both stdout and files, the same business entry may appear twice. Filter by a single job for clean counting. This redundancy is useful during the POC but should be simplified for production.
