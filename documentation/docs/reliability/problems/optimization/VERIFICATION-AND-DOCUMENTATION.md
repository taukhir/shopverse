---
title: Verification And Documentation
status: "maintained"
last_reviewed: "2026-07-13"
---

# Verification And Documentation

Back to [Optimization Solutions](../OPTIMIZATION-SOLUTIONS.md).

## Problem

Optimization work is risky when changes are not measured. A build can look
cleaner while becoming slower, or an image can become smaller while breaking
runtime behavior.

Every optimization needs:

- a baseline
- a focused change
- verification commands
- before/after numbers
- documentation of tradeoffs

## Solution

Use one page per optimization area and keep changes small.

Current optimization pages:

- [Optimization Baseline](./OPTIMIZATION-BASELINE.md)
- [Fix Docker Build Context For Platform Modules](./DOCKER-BUILD-CONTEXT-PLATFORM.md)
- [Optimize Order Service Tests](./ORDER-SERVICE-TEST-OPTIMIZATION.md)
- [Reduce Docker Image Size](./DOCKER-IMAGE-SIZE-OPTIMIZATION.md)
- [Reduce Spring Boot JAR Size](./JAR-SIZE-OPTIMIZATION.md)
- [Add Docker Compose Profiles](./DOCKER-COMPOSE-PROFILES.md)
- [Gradle Dependency Optimization](./GRADLE-DEPENDENCY-OPTIMIZATION.md)
- [Gradle Build Performance](./GRADLE-BUILD-PERFORMANCE.md)
- [Runtime Optimization](./RUNTIME-OPTIMIZATION.md)

## Standard Verification Set

Gradle:

```powershell
.\gradlew.bat clean assemble -x test --no-daemon
.\gradlew.bat test --no-daemon
```

Platform composite build:

```powershell
cd order-service
.\gradlew.bat -p ..\shopverse-platform clean build --no-daemon
```

Docker:

```powershell
docker compose config --quiet
docker compose build order-service
docker images --format "{{.Repository}},{{.Tag}},{{.Size}}"
```

Compose profiles:

```powershell
docker compose config --services
docker compose --profile apps config --services
docker compose --profile observability config --services
docker compose --profile assets config --services
docker compose --profile apps --profile observability --profile assets config --quiet
```

Runtime:

```powershell
docker compose --profile apps up -d
docker compose ps
docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}}"
```

Runtime startup measurement:

```powershell
$sw=[Diagnostics.Stopwatch]::StartNew()
docker compose up -d
$sw.Stop()
"compose_default_start_seconds=$([math]::Round($sw.Elapsed.TotalSeconds,2))"
```

Application profile startup measurement:

```powershell
$sw=[Diagnostics.Stopwatch]::StartNew()
docker compose --profile apps up -d
$sw.Stop()
"compose_apps_start_seconds=$([math]::Round($sw.Elapsed.TotalSeconds,2))"
```

Docs:

```powershell
cd documentation
npm.cmd run build
```

## Documentation Rule

Each optimization page should include:

- problem
- how we identified it
- exact commands
- before numbers
- implemented solution
- after numbers
- risks
- next candidates

## Latest Runtime Measurements

Default Compose:

```text
compose_default_start_seconds=46.6
config-server      healthy  261.9MiB
discovery-server   healthy  350.5MiB
kafka              healthy  370.1MiB
mysql              healthy  434.2MiB
zipkin             healthy  286.7MiB
```

Application profile on top of already-running core infrastructure:

```text
compose_apps_start_seconds=174.03
api-gateway         healthy  320.4MiB
auth-service        healthy  284.3MiB
inventory-service   healthy  562.7MiB
order-service       healthy  565.9MiB
payment-service     healthy  545.6MiB
user-service        healthy  538.5MiB
```

## Verification Caveats

On Windows, run service Gradle builds sequentially when they share the included
`shopverse-platform` composite build. Running multiple service builds in
parallel can race on shared included-build output files and fail with file-lock
errors.

After changing service images from root to non-root runtime users, stale named
log volumes can still be root-owned. Remove only the service log volumes if a
service fails with `/app/logs/<service>.log` permission errors.

## Risk

Do not combine unrelated optimizations in one change. Build tuning, image
tuning, dependency cleanup, Compose topology, and runtime tuning should stay
separate so a regression can be traced quickly.
