---
title: Build, JAR, Docker, And Compose Optimization Solutions
status: "maintained"
last_reviewed: "2026-07-13"
---

# Build, JAR, Docker, And Compose Optimization Solutions

Back to [Shopverse Problems And Solutions](../PROBLEMS-AND-SOLUTIONS.md).

This is the umbrella page for Shopverse build and runtime optimization work.
Start from the measured baseline, then apply one focused solution at a time.

## Baseline

Before making optimization changes, capture the current numbers:

- Gradle dependency resolution
- clean assemble time
- no-change incremental assemble time
- test time
- generated JAR size
- Docker image size
- Docker Compose runtime state

Current measured baseline:

[Optimization Baseline](./optimization/OPTIMIZATION-BASELINE.md)

## Solution Order

Apply these in order.

| Order | Solution | Why first |
|---:|---|---|
| 1 | [Fix Docker Build Context For Platform Modules](./optimization/DOCKER-BUILD-CONTEXT-PLATFORM.md) | Docker rebuilds are currently broken after adding `shopverse-platform` |
| 2 | [Optimize Order Service Tests](./optimization/ORDER-SERVICE-TEST-OPTIMIZATION.md) | `order-service` test time is the largest build bottleneck |
| 3 | [Reduce Docker Image Size](./optimization/DOCKER-IMAGE-SIZE-OPTIMIZATION.md) | service images are roughly 493 to 643 MB |
| 4 | [Reduce Spring Boot JAR Size](./optimization/JAR-SIZE-OPTIMIZATION.md) | order, payment, and inventory JARs are about 119 MB |
| 5 | [Add Docker Compose Profiles](./optimization/DOCKER-COMPOSE-PROFILES.md) | local Compose starts too much by default |
| 6 | [Gradle Dependency Optimization](./optimization/GRADLE-DEPENDENCY-OPTIMIZATION.md) | platform modules and services should expose fewer duplicated and unnecessary dependencies |
| 7 | [Gradle Build Performance](./optimization/GRADLE-BUILD-PERFORMANCE.md) | daemon/cache/config-cache were enabled, but parallel execution was disabled |
| 8 | [Runtime Optimization](./optimization/RUNTIME-OPTIMIZATION.md) | JVM, DB pool, Kafka, outbox, logging, and metrics tuning need measured runtime data |
| 9 | [Verification And Documentation](./optimization/VERIFICATION-AND-DOCUMENTATION.md) | every optimization needs commands, before/after numbers, and risks documented |

## Current Key Findings

| Area | Finding |
|---|---|
| Docker build correctness | service Dockerfiles cannot see `../shopverse-platform` from service-only build contexts |
| Tests | `OrderServiceApplicationTests` and `OrderOwnershipAuthorizationTest` dominate `order-service` test time |
| Docker images | most image size comes from the Temurin Jammy runtime base, not only the application JAR |
| JAR size | heavy dependency groups include Eureka, OpenAPI UI, Zipkin/tracing, Kafka, Liquibase, JPA, Resilience4j, and Prometheus |
| Compose | no `profiles:` are currently used, so default Compose includes infrastructure, apps, and observability |
| Gradle dependencies | repeated direct declarations and broad platform `api` scopes make dependency ownership harder to reason about |
| Gradle performance | Gradle cache and config cache were enabled, but `org.gradle.parallel=false` limited parallel module work |
| Runtime | default Compose and `apps` profile startup/memory are now measured; hard memory limits still need load testing before use |

## Verification Rule

After each optimization, rerun the relevant slice of the baseline and write the
before/after result into the solution page.

Minimum verification:

```powershell
.\gradlew.bat test --no-daemon
```

```powershell
.\gradlew.bat clean assemble -x test --no-daemon
```

```powershell
docker compose config
```

```powershell
docker images --format "{{.Repository}},{{.Tag}},{{.Size}}"
```

Runtime profile checks:

```powershell
docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}}"
```

Latest measured runtime results:

```text
default Compose: 46.6 seconds to healthy core infrastructure
apps profile: 174.03 seconds to healthy application services after core infra was already running
```
