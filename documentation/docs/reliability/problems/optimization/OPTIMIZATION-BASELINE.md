---
title: Optimization Baseline
status: "maintained"
last_reviewed: "2026-07-13"
---

# Optimization Baseline

Back to [Optimization Solutions](../OPTIMIZATION-SOLUTIONS.md).

## Problem

Before optimizing Gradle dependencies, build time, JAR size, Docker images, or
Docker Compose startup, we need a baseline. Without measured numbers, it is too
easy to make changes that feel faster but do not actually improve the system.

This baseline captures:

- Gradle dependency resolution time
- clean assemble time per service
- no-change incremental assemble time
- test time per service
- generated Spring Boot JAR sizes
- local Docker image sizes
- Docker Compose availability and service list
- current Docker runtime status

## Environment

Measured locally from:

```text
D:\BE Projects\shopverse
```

Java was set for the shell before Gradle commands:

```powershell
$env:JAVA_HOME='C:\Users\Ahmed\.jdks\openjdk-24.0.2+12-54'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
```

Docker CLI and Compose were installed. Docker daemon became available for image
inspection, but no Compose containers were running during the final runtime
snapshot.

## Services Measured

```powershell
Get-ChildItem -Directory |
  Where-Object { Test-Path (Join-Path $_.FullName 'gradlew.bat') } |
  Select-Object -ExpandProperty Name
```

Result:

| Service |
|---|
| `api-gateway` |
| `auth-service` |
| `config-server` |
| `discovery-server` |
| `inventory-service` |
| `order-service` |
| `payment-service` |
| `user-service` |

## Gradle Dependency Resolution Baseline

Command pattern:

```powershell
$services = @(
  'discovery-server',
  'config-server',
  'auth-service',
  'user-service',
  'order-service',
  'payment-service',
  'inventory-service',
  'api-gateway'
)

foreach ($svc in $services) {
  Push-Location $svc
  $sw = [Diagnostics.Stopwatch]::StartNew()
  .\gradlew.bat dependencies --configuration runtimeClasspath --quiet *> $null
  $code = $LASTEXITCODE
  $sw.Stop()
  Pop-Location
  "$svc,$([math]::Round($sw.Elapsed.TotalSeconds,2)),$code"
}
```

Result:

| Service | Runtime classpath dependency resolution | Exit code |
|---|---:|---:|
| `discovery-server` | 2.31s | 0 |
| `config-server` | 2.23s | 0 |
| `auth-service` | 2.19s | 0 |
| `user-service` | 2.28s | 0 |
| `order-service` | 2.23s | 0 |
| `payment-service` | 2.42s | 0 |
| `inventory-service` | 2.34s | 0 |
| `api-gateway` | 2.23s | 0 |

Note: this is a warm-cache baseline. It does not measure a full cold download
after deleting the Gradle cache.

## Clean Assemble Baseline

Command pattern:

```powershell
foreach ($svc in $services) {
  Push-Location $svc
  $sw = [Diagnostics.Stopwatch]::StartNew()
  .\gradlew.bat clean assemble -x test --quiet
  $code = $LASTEXITCODE
  $sw.Stop()
  Pop-Location
  "$svc,$([math]::Round($sw.Elapsed.TotalSeconds,2)),$code"
}
```

Result:

| Service | `clean assemble -x test` | Exit code |
|---|---:|---:|
| `discovery-server` | 9.00s | 0 |
| `config-server` | 5.45s | 0 |
| `auth-service` | 14.23s | 0 |
| `user-service` | 19.15s | 0 |
| `order-service` | 24.29s | 0 |
| `payment-service` | 21.57s | 0 |
| `inventory-service` | 13.71s | 0 |
| `api-gateway` | 12.65s | 0 |

## No-Change Incremental Assemble Baseline

Command pattern:

```powershell
foreach ($svc in $services) {
  Push-Location $svc
  $sw = [Diagnostics.Stopwatch]::StartNew()
  .\gradlew.bat assemble -x test --quiet
  $code = $LASTEXITCODE
  $sw.Stop()
  Pop-Location
  "$svc,$([math]::Round($sw.Elapsed.TotalSeconds,2)),$code"
}
```

Result:

| Service | `assemble -x test` after previous build | Exit code |
|---|---:|---:|
| `discovery-server` | 5.33s | 0 |
| `config-server` | 4.33s | 0 |
| `auth-service` | 4.63s | 0 |
| `user-service` | 6.02s | 0 |
| `order-service` | 6.31s | 0 |
| `payment-service` | 7.28s | 0 |
| `inventory-service` | 6.70s | 0 |
| `api-gateway` | 3.99s | 0 |

The no-change build still costs roughly 4 to 7 seconds per service. This points
to Gradle startup and configuration overhead as a useful optimization target.

## Test Time Baseline

Command pattern:

```powershell
foreach ($svc in $services) {
  Push-Location $svc
  $sw = [Diagnostics.Stopwatch]::StartNew()
  .\gradlew.bat test --quiet
  $code = $LASTEXITCODE
  $sw.Stop()
  Pop-Location
  "$svc,$([math]::Round($sw.Elapsed.TotalSeconds,2)),$code"
}
```

Result:

| Service | `test` | Exit code |
|---|---:|---:|
| `discovery-server` | 5.30s | 0 |
| `config-server` | 4.11s | 0 |
| `auth-service` | 29.34s | 0 |
| `user-service` | 24.56s | 0 |
| `order-service` | 144.81s | 0 |
| `payment-service` | 10.25s | 0 |
| `inventory-service` | 6.58s | 0 |
| `api-gateway` | 27.49s | 0 |

Main finding: `order-service` is the clear test-time outlier at 144.81 seconds.

## Generated JAR Size Baseline

Command:

```powershell
$services = @(
  'discovery-server',
  'config-server',
  'auth-service',
  'user-service',
  'order-service',
  'payment-service',
  'inventory-service',
  'api-gateway'
)

foreach ($svc in $services) {
  Get-ChildItem "$svc\build\libs" -Filter "*.jar" -ErrorAction SilentlyContinue |
    Sort-Object Length -Descending |
    ForEach-Object {
      "$svc,$($_.Name),$([math]::Round($_.Length / 1MB, 2))"
    }
}
```

Result:

| Service | Boot JAR | Size |
|---|---|---:|
| `discovery-server` | `discovery-server-0.0.1-SNAPSHOT.jar` | 62.68 MB |
| `config-server` | `config-server-0.0.1-SNAPSHOT.jar` | 44.90 MB |
| `auth-service` | `auth-service-0.0.1-SNAPSHOT.jar` | 57.42 MB |
| `user-service` | `user-service-0.0.1-SNAPSHOT.jar` | 98.11 MB |
| `order-service` | `order-service-0.0.1-SNAPSHOT.jar` | 119.63 MB |
| `payment-service` | `payment-service-0.0.1-SNAPSHOT.jar` | 119.03 MB |
| `inventory-service` | `inventory-service-0.0.1-SNAPSHOT.jar` | 119.04 MB |
| `api-gateway` | `api-gateway-0.0.1-SNAPSHOT.jar` | 71.24 MB |

Main finding: `order-service`, `payment-service`, and `inventory-service` are
all around 119 MB.

## Gradle Properties Snapshot

Command:

```powershell
foreach ($svc in $services) {
  "$svc,$((Get-Content "$svc\gradle.properties" -Raw).Trim() -replace "`r?`n", '; ')"
}
```

Result:

| Service | Gradle properties |
|---|---|
| all services | `org.gradle.caching=true; org.gradle.configuration-cache=true; org.gradle.daemon=true; org.gradle.parallel=false; org.gradle.workers.max=2` |

Main finding: caching and configuration cache are already enabled, but
`org.gradle.parallel=false` is set everywhere. Parallelism should be tested
carefully before changing it globally.

## Docker Image Size Baseline

Command:

```powershell
docker images --format "{{.Repository}},{{.Tag}},{{.Size}}"
```

Result for Shopverse images:

| Image | Tag | Size |
|---|---|---:|
| `shopverse/inventory-service` | `local` | 642 MB |
| `shopverse/order-service` | `local` | 643 MB |
| `shopverse/user-service` | `local` | 599 MB |
| `shopverse/payment-service` | `local` | 642 MB |
| `shopverse/discovery-server` | `local` | 528 MB |
| `shopverse/config-server` | `local` | 493 MB |
| `shopverse/api-gateway` | `local` | 546 MB |
| `shopverse/auth-service` | `local` | 518 MB |

Main finding: service images are large for local Java services, roughly 493 to
643 MB each.

## Docker And Compose Runtime Snapshot

Commands:

```powershell
docker info --format "ServerVersion={{.ServerVersion}}; CPUs={{.NCPU}}; Memory={{.MemTotal}}; Driver={{.Driver}}"
```

```powershell
docker ps --format "{{.Names}},{{.Status}},{{.Image}},{{.Ports}}"
```

```powershell
docker compose ps
```

```powershell
docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}}"
```

Results:

| Check | Result |
|---|---|
| Docker server | `29.5.3` |
| Docker CPUs | `16` |
| Docker memory | about `8 GB` |
| Docker driver | `overlayfs` |
| Running containers | none |
| Compose services running | none |
| Current Compose CPU/memory footprint | not measurable because no containers were running |

Compose service list:

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

Compose startup time was not measured because that requires starting the full
stack.

## Optimization Targets From This Baseline

| Priority | Area | Why |
|---:|---|---|
| 1 | `order-service` tests | 144.81s is much slower than the other service test suites |
| 2 | Docker image size | service images are roughly 493 to 643 MB |
| 3 | Boot JAR size | order, payment, and inventory JARs are about 119 MB |
| 4 | no-change Gradle build time | still 4 to 7 seconds per service |
| 5 | Compose profiles/startup | full Compose stack has 18 services and should not all be required for every local workflow |

## Next Solution Direction

Recommended next checks:

1. Inspect `order-service` test reports to find slow test classes.
2. Run dependency analysis on the 119 MB service JARs.
3. Inspect Dockerfiles and image layers for duplicated JARs or oversized bases.
4. Test Gradle parallelism in a branch before changing all services.
5. Add Docker Compose profiles for smaller local startup sets.
