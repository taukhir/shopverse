---
title: Add Docker Compose Profiles
status: "maintained"
last_reviewed: "2026-07-13"
---

# Add Docker Compose Profiles

Back to [Optimization Solutions](../OPTIMIZATION-SOLUTIONS.md).

## Status

Implemented.

Changed:

- added `apps` profile to application services
- added `observability` profile to Prometheus, Loki, Promtail, and Grafana
- added `assets` profile to MinIO and MinIO initialization
- kept core infrastructure in the default Compose set
- removed Prometheus' hard `depends_on` on `api-gateway` so observability can start independently and discover targets when they are available

Default Compose now starts only core infrastructure:

```text
zipkin
config-server
discovery-server
kafka
mysql
mysql-bootstrap
```

Before profiles, a normal service resolution included 18 services. After
profiles, the default set is 6 services.

## How This Helps

Profiles reduce local cost by letting us start only the workflow we need.

| Workflow | Before | After |
|---|---:|---:|
| Basic infra startup | 18 services were in the default Compose model | 6 default services |
| Backend app development | full stack was implied | enable `apps` only when needed |
| Dashboard/logging work | observability always appeared in the main model | enable `observability` only when needed |
| MinIO/product image work | MinIO always appeared in the main model | enable `assets` only when needed |

Practical benefits:

- faster local startup when only infrastructure is needed
- less memory and CPU pressure on Docker Desktop
- fewer healthchecks running in the background
- fewer logs to scan during app debugging
- less accidental rebuild/start of services unrelated to the current task
- observability and assets remain available through explicit profiles

## Problem

The current Compose file has no `profiles:` entries. A normal Compose workflow
contains infrastructure, all application services, and the full observability
stack.

Command:

```powershell
docker compose config --services
```

Result:

```text
loki
minio
config-server
discovery-server
mysql
mysql-bootstrap
zipkin
user-service
auth-service
kafka
order-service
payment-service
inventory-service
api-gateway
prometheus
grafana
promtail
minio-init
```

That is 18 services. Most local development tasks do not need all of them.

## Implemented Solution

Use Compose profiles to make startup explicit.

Implemented profiles:

| Profile | Services |
|---|---|
| default | `mysql`, `mysql-bootstrap`, `kafka`, `config-server`, `discovery-server`, `zipkin` |
| `apps` | `user-service`, `auth-service`, `order-service`, `payment-service`, `inventory-service`, `api-gateway` |
| `observability` | `prometheus`, `grafana`, `loki`, `promtail` |
| `assets` | `minio`, `minio-init` |

Zipkin stays in the default set because application services depend on it as a
trace endpoint. Keeping it default avoids profile dependency surprises when
starting app services.

## Step 1: Keep Core Infrastructure Default

No profile was added to core infrastructure. These services start with a normal
`docker compose up`:

- `mysql`
- `mysql-bootstrap`
- `kafka`
- `config-server`
- `discovery-server`
- `zipkin`

## Step 2: Add Profiles To Application Services

```yaml
user-service:
  profiles: ["apps"]

auth-service:
  profiles: ["apps"]

order-service:
  profiles: ["apps"]

payment-service:
  profiles: ["apps"]

inventory-service:
  profiles: ["apps"]

api-gateway:
  profiles: ["apps"]
```

## Step 3: Add Profiles To Observability

```yaml
prometheus:
  profiles: ["observability"]

grafana:
  profiles: ["observability"]

loki:
  profiles: ["observability"]

promtail:
  profiles: ["observability"]
```

Prometheus no longer has a hard Compose dependency on `api-gateway`. It can
start before app services and scrape targets when they become available.

## Step 4: Add Profiles To MinIO Assets

```yaml
minio:
  profiles: ["assets"]

minio-init:
  profiles: ["assets"]
```

## Step 5: Use Explicit Startup Commands

Core infrastructure only:

```powershell
docker compose up -d
```

Core infrastructure plus applications:

```powershell
docker compose --profile apps up -d
```

Full stack:

```powershell
docker compose --profile apps --profile observability --profile assets up -d
```

Observability with core infrastructure:

```powershell
docker compose --profile observability up -d
```

MinIO assets with core infrastructure:

```powershell
docker compose --profile assets up -d
```

## Step 6: Verify

Check resolved services:

```powershell
docker compose config --services
docker compose --profile apps config --services
docker compose --profile observability config --services
docker compose --profile assets config --services
```

Implemented results:

Default:

```text
zipkin
config-server
discovery-server
kafka
mysql
mysql-bootstrap
```

With `apps`:

```text
mysql
mysql-bootstrap
config-server
discovery-server
zipkin
user-service
auth-service
kafka
order-service
inventory-service
payment-service
api-gateway
```

With `observability`:

```text
config-server
loki
prometheus
zipkin
grafana
kafka
mysql
promtail
discovery-server
mysql-bootstrap
```

With `assets`:

```text
config-server
discovery-server
kafka
minio
minio-init
mysql
mysql-bootstrap
zipkin
```

Validate the full model:

```powershell
docker compose --profile apps --profile observability --profile assets config --quiet
```

Check running containers:

```powershell
docker compose ps
```

Check resource use:

```powershell
docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}}"
```

## Measured Results

After rebuilding the optimized service images and resetting stale service log
volumes, default Compose started successfully.

Command:

```powershell
$sw=[Diagnostics.Stopwatch]::StartNew()
docker compose up -d
$sw.Stop()
"compose_default_start_seconds=$([math]::Round($sw.Elapsed.TotalSeconds,2))"
docker compose ps
docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}}"
```

Result:

```text
compose_default_start_seconds=46.6
config-server      healthy  261.9MiB
discovery-server   healthy  350.5MiB
kafka              healthy  370.1MiB
mysql              healthy  434.2MiB
zipkin             healthy  286.7MiB
```

Starting the application profile on top of already-running core infrastructure:

```powershell
$sw=[Diagnostics.Stopwatch]::StartNew()
docker compose --profile apps up -d
$sw.Stop()
"compose_apps_start_seconds=$([math]::Round($sw.Elapsed.TotalSeconds,2))"
docker compose --profile apps ps
docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}}"
```

Result:

```text
compose_apps_start_seconds=174.03
api-gateway         healthy  320.4MiB
auth-service        healthy  284.3MiB
inventory-service   healthy  562.7MiB
order-service       healthy  565.9MiB
payment-service     healthy  545.6MiB
user-service        healthy  538.5MiB
```

## Existing Developer Migration Note

If a developer already had log volumes from older root-based images, services
can fail with:

```text
Permission denied: /app/logs/<service>.log
```

Remove only service log volumes:

```powershell
docker compose --profile apps --profile observability --profile assets down --remove-orphans
docker volume ls --format "{{.Name}}" |
  Select-String "shopverse_.*-logs|shopverse.*-logs" |
  ForEach-Object { docker volume rm $_.Line }
```

Do not use `docker compose down -v` unless deleting database and object-storage
data is acceptable.

## Risk

Profiles change local workflow expectations. Document the commands clearly so
developers know which profile set to use.
