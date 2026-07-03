---
title: Gradle Build Performance
---

# Gradle Build Performance

Back to [Optimization Solutions](../OPTIMIZATION-SOLUTIONS.md).

## Status

Implemented first safe build-performance pass.

Changed:

- enabled Gradle parallel execution in all service `gradle.properties`
- added `shopverse-platform/gradle.properties`
- kept the existing conservative worker cap: `org.gradle.workers.max=2`

Before:

```properties
org.gradle.caching=true
org.gradle.configuration-cache=true
org.gradle.daemon=true
org.gradle.parallel=false
org.gradle.workers.max=2
```

After:

```properties
org.gradle.caching=true
org.gradle.configuration-cache=true
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.workers.max=2
```

## Problem

The baseline showed no-change Gradle assemble still costs several seconds per
service:

| Service | No-change assemble |
|---|---:|
| `discovery-server` | 5.33s |
| `config-server` | 4.33s |
| `auth-service` | 4.63s |
| `user-service` | 6.02s |
| `order-service` | 6.31s |
| `payment-service` | 7.28s |
| `inventory-service` | 6.70s |
| `api-gateway` | 3.99s |

Caching and configuration cache were already enabled, but parallel task
execution was disabled.

## Solution

Enable Gradle parallel execution consistently.

This helps when a service build includes the `shopverse-platform` composite
build because independent platform modules can compile/test in parallel within
the worker cap.

We kept:

```properties
org.gradle.workers.max=2
```

That avoids overloading local Docker Desktop and the JVM while still allowing
some parallel work.

## Verification

Platform build:

```powershell
cd order-service
.\gradlew.bat -p ..\shopverse-platform clean build --no-daemon --quiet
```

Result:

```text
platform_build_exit=0
```

Composite service compile:

```powershell
cd order-service
.\gradlew.bat clean compileJava --no-daemon --quiet
```

Result:

```text
order_compile_exit=0
```

Representative warm assemble:

```powershell
cd api-gateway
$sw=[Diagnostics.Stopwatch]::StartNew()
.\gradlew.bat assemble -x test --quiet
$code=$LASTEXITCODE
$sw.Stop()
"api_gateway_incremental_assemble_seconds=$([math]::Round($sw.Elapsed.TotalSeconds,2));exit=$code"
```

Result:

```text
api_gateway_incremental_assemble_seconds=6.74;exit=0
```

## Local Usage Guidance

For normal local development, prefer daemon-enabled commands:

```powershell
.\gradlew.bat test
.\gradlew.bat assemble -x test
```

Use `--no-daemon` mainly for controlled measurements, CI-like checks, or when
debugging stuck daemon state.

## Test Task Configuration

Current service tests use JUnit Platform. Checkout services also separate
integration tests:

```groovy
tasks.register('integrationTest', Test) {
    description = 'Runs MySQL and Kafka Testcontainers integration tests.'
    group = 'verification'
    shouldRunAfter tasks.named('test')
}
```

Keep this split:

- `test`: fast unit/slice tests
- `integrationTest`: Testcontainers, Kafka, MySQL, and infrastructure tests

The `order-service` optimization showed why this matters: moving expensive
full-context behavior out of the fast path reduced test time from `144.81s` to
`13.07s`.

## Annotation Processors

Lombok is already scoped correctly in services:

```groovy
compileOnly 'org.projectlombok:lombok'
annotationProcessor 'org.projectlombok:lombok'
testCompileOnly 'org.projectlombok:lombok'
testAnnotationProcessor 'org.projectlombok:lombok'
```

Do not move Lombok to `implementation`; it is not needed at runtime.

## Next Checks

1. Rerun the full baseline after all optimization work.
2. Compare warm no-change assemble with daemon enabled.
3. Inspect configuration-cache reuse messages in slow builds.
4. Keep `maxParallelForks = 1` for tests unless a specific suite is proven safe
   to run in parallel.

## Risk

Parallel Gradle builds can expose hidden task coupling. The current change is
low risk because:

- worker count remains capped at 2
- platform build passed
- a composite service compile passed
- existing task graph is mostly standard Java/Spring tasks
