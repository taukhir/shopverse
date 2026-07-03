---
title: Runtime Optimization
---

# Runtime Optimization

Back to [Optimization Solutions](../OPTIMIZATION-SOLUTIONS.md).

## Status

Implemented as a measured local-runtime pass, with a second pass that makes
per-service runtime tuning explicit in Compose.

Changed:

- added local JVM heap percentage overrides through Compose `JAVA_OPTS`
- added shared Hikari pool defaults in `cloud-configs/application.yml`
- added shared Kafka listener concurrency default in `cloud-configs/application.yml`
- added shared Kafka consumer poll-size and producer batching/compression defaults
- added shared outbox batch-size default
- added service-specific local Compose defaults for DB pool size, Kafka poll size, outbox batch size, and tracing sample rate
- added failed-event replay indexes in `order-service`, `payment-service`, and `inventory-service`
- verified default Compose and `apps` profile startup after rebuilding the optimized images

Hard Compose memory limits were not added in this pass. Current app containers
run successfully without them, and hard limits should be introduced only after
load testing the request, Kafka, and outbox paths.

## Problem

After build and Docker optimizations, runtime cost still depends on:

- JVM memory behavior
- Hikari connection pools
- Kafka listener concurrency
- logging volume
- actuator and metrics overhead
- outbox/recovery query indexes
- scheduler and listener concurrency

The original setup let every service use broad default runtime settings. That
is convenient, but local Compose can become heavier than necessary, and replay
queries can slow down as failed-event tables grow.

## Implemented Solution

### Step 1: Add Local JVM Caps Through Compose

Every Java service now exposes a service-specific `JAVA_OPTS` override in
`docker-compose.yml`.

Example:

```yaml
order-service:
  environment:
    JAVA_OPTS: ${ORDER_SERVICE_JAVA_OPTS:--XX:MaxRAMPercentage=60 -XX:+UseContainerSupport -XX:+ExitOnOutOfMemoryError}
```

Use:

```powershell
$env:ORDER_SERVICE_JAVA_OPTS="-XX:MaxRAMPercentage=50 -XX:+UseContainerSupport -XX:+ExitOnOutOfMemoryError"
docker compose --profile apps up -d order-service
```

Why this helps:

- keeps local service heap growth bounded relative to the container
- allows per-service tuning without editing Dockerfiles
- preserves the same immutable image across environments

### Step 2: Bound Hikari Pools In Shared Config

`cloud-configs/application.yml` now provides shared pool defaults:

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: ${DB_POOL_MAX_SIZE:5}
      minimum-idle: ${DB_POOL_MIN_IDLE:1}
      connection-timeout: ${DB_POOL_CONNECTION_TIMEOUT_MS:30000}
```

Use per service:

```powershell
$env:ORDER_SERVICE_DB_POOL_MAX_SIZE="3"
docker compose --profile apps up -d order-service
```

Why this helps:

- reduces MySQL connection pressure in local Compose
- prevents every service from opening large default pools
- makes pool sizing explicit and configurable

Tradeoff:

- too small a pool can throttle request handling, outbox workers, and replay jobs

### Step 3: Add Kafka Listener Concurrency Default

`cloud-configs/application.yml` now exposes listener concurrency:

```yaml
spring:
  kafka:
    listener:
      concurrency: ${KAFKA_LISTENER_CONCURRENCY:1}
```

Use:

```powershell
$env:KAFKA_LISTENER_CONCURRENCY="2"
docker compose --profile apps up -d order-service payment-service inventory-service
```

Why this helps:

- keeps local Kafka consumption predictable by default
- allows targeted concurrency increases during replay or load testing
- avoids hard-coding concurrency inside individual listeners

### Step 4: Add Failed-Event Replay Indexes

Added Liquibase changesets:

- `order-service/src/main/resources/db/changelog/005-failed-event-indexes.yml`
- `payment-service/src/main/resources/db/changelog/006-failed-event-indexes.yml`
- `inventory-service/src/main/resources/db/changelog/007-failed-event-indexes.yml`

Each service now indexes replay-oriented failed-event access:

```yaml
- createIndex:
    tableName: failed_kafka_events
    indexName: idx_failed_kafka_events_replayed_failed_at
    columns:
      - column:
          name: replayed
      - column:
          name: failed_at
```

```yaml
- createIndex:
    tableName: failed_kafka_events
    indexName: idx_failed_kafka_events_source_topic_replayed
    columns:
      - column:
          name: source_topic
      - column:
          name: replayed
```

Why this helps:

- replay workers can find unreplayed failures without scanning the whole table
- source-topic recovery views can filter by topic and replay state efficiently
- the indexes match the recovery service behavior instead of adding a broad shared domain model

### Step 5: Fix Stale Log Volumes After Non-Root Images

After switching service images to non-root Alpine runtimes, old named log
volumes may still be owned by root. The symptom is:

```text
openFile(/app/logs/config-server.log,true) call failed. java.io.FileNotFoundException: /app/logs/config-server.log (Permission denied)
```

The Dockerfiles now create `/app/logs` and assign it to the `shopverse` runtime
user. For existing local environments, remove only stale service log volumes:

```powershell
docker compose --profile apps --profile observability --profile assets down --remove-orphans
docker volume ls --format "{{.Name}}" |
  Select-String "shopverse_.*-logs|shopverse.*-logs" |
  ForEach-Object { docker volume rm $_.Line }
```

Do not use `docker compose down -v` unless you intentionally want to delete
database and MinIO data volumes too.

### Step 6: Make Local Runtime Knobs Explicit Per Service

`cloud-configs/application.yml` now exposes these shared runtime defaults:

```yaml
spring:
  kafka:
    consumer:
      properties:
        max.poll.records: ${KAFKA_CONSUMER_MAX_POLL_RECORDS:50}
    producer:
      properties:
        linger.ms: ${KAFKA_PRODUCER_LINGER_MS:5}
        compression.type: ${KAFKA_PRODUCER_COMPRESSION_TYPE:lz4}

shopverse:
  outbox:
    batch-size: ${OUTBOX_BATCH_SIZE:25}
```

The Compose file then sets local defaults per service instead of relying only
on broad shared defaults:

```yaml
order-service:
  environment:
    DB_POOL_MAX_SIZE: ${ORDER_SERVICE_DB_POOL_MAX_SIZE:-4}
    DB_POOL_MIN_IDLE: ${ORDER_SERVICE_DB_POOL_MIN_IDLE:-1}
    TRACING_SAMPLING_PROBABILITY: ${ORDER_SERVICE_TRACING_SAMPLING_PROBABILITY:-0.1}
    KAFKA_LISTENER_CONCURRENCY: ${ORDER_SERVICE_KAFKA_LISTENER_CONCURRENCY:-1}
    KAFKA_CONSUMER_MAX_POLL_RECORDS: ${ORDER_SERVICE_KAFKA_CONSUMER_MAX_POLL_RECORDS:-25}
    OUTBOX_BATCH_SIZE: ${ORDER_SERVICE_OUTBOX_BATCH_SIZE:-25}
```

The same variables are listed in `.env.example` so local developers can copy
and adjust them without editing Compose.

Why this helps:

- local MySQL connection usage is bounded service by service
- local Kafka consumers process smaller batches by default, which avoids large bursts during recovery
- outbox publishers claim smaller batches locally, reducing DB lock time and Kafka send pressure
- tracing is sampled at `0.1` for application services and `0.0` for config/discovery by default, reducing local Zipkin and logging overhead
- production can still override every value without changing the image or source code

Suggested local overrides:

```powershell
$env:ORDER_SERVICE_DB_POOL_MAX_SIZE="6"
$env:ORDER_SERVICE_KAFKA_LISTENER_CONCURRENCY="2"
$env:ORDER_SERVICE_KAFKA_CONSUMER_MAX_POLL_RECORDS="100"
$env:ORDER_SERVICE_OUTBOX_BATCH_SIZE="50"
$env:ORDER_SERVICE_TRACING_SAMPLING_PROBABILITY="1.0"
docker compose --profile apps up -d order-service
```

Use larger values only when measuring throughput or replay behavior. For
normal local development, the smaller defaults reduce memory, DB connection,
Kafka, and tracing pressure.

## Verification Commands And Results

Rebuild service images:

```powershell
docker compose build config-server discovery-server user-service auth-service order-service payment-service inventory-service api-gateway
```

Result:

```text
Image shopverse/config-server:local Built
Image shopverse/discovery-server:local Built
Image shopverse/user-service:local Built
Image shopverse/auth-service:local Built
Image shopverse/order-service:local Built
Image shopverse/payment-service:local Built
Image shopverse/inventory-service:local Built
Image shopverse/api-gateway:local Built
```

Start default Compose:

```powershell
$sw=[Diagnostics.Stopwatch]::StartNew()
docker compose up -d
$sw.Stop()
"compose_default_start_seconds=$([math]::Round($sw.Elapsed.TotalSeconds,2))"
docker compose ps
docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}}"
```

Measured result:

```text
compose_default_start_seconds=46.6
config-server      healthy  261.9MiB
discovery-server   healthy  350.5MiB
kafka              healthy  370.1MiB
mysql              healthy  434.2MiB
zipkin             healthy  286.7MiB
```

Start apps profile:

```powershell
$sw=[Diagnostics.Stopwatch]::StartNew()
docker compose --profile apps up -d
$sw.Stop()
"compose_apps_start_seconds=$([math]::Round($sw.Elapsed.TotalSeconds,2))"
docker compose --profile apps ps
docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}}"
```

Measured result from already-running core infrastructure:

```text
compose_apps_start_seconds=174.03
api-gateway         healthy  320.4MiB
auth-service        healthy  284.3MiB
inventory-service   healthy  562.7MiB
order-service       healthy  565.9MiB
payment-service     healthy  545.6MiB
user-service        healthy  538.5MiB
```

Service tests:

```powershell
cd order-service
.\gradlew.bat test --no-daemon --quiet

cd ..\payment-service
.\gradlew.bat test --no-daemon --quiet

cd ..\inventory-service
.\gradlew.bat test --no-daemon --quiet
```

Result:

```text
order-service tests passed
payment-service tests passed
inventory-service tests passed
```

On Windows, do not run multiple service Gradle builds in parallel when they use
the same included `shopverse-platform` composite build. Parallel service builds
can race on shared included-build output files and fail with file-lock errors.

## Remaining Runtime Candidates

- add hard Compose memory limits after a load test proves safe limits
- review request logging volume under realistic traffic
- tune service-specific Hikari pools from measured DB connection usage
- tune Kafka listener concurrency per topic after replay/load tests
- add explain-plan checks for outbox and failed-event worker queries
- review high-cardinality metric tags after observability traffic is enabled
