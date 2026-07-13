---
title: "Testing Modes, CI, And Triage"
description: "Testing Modes, CI, And Triage with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "Testing Modes, CI, And Triage"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Testing Modes, CI, And Triage

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

## Verification Scripts

| Script | Purpose |
|---|---|
| `scripts/Verify-Shopverse.ps1` | orchestrates Quick, Changed, Integration, and Full modes |
| `scripts/Get-ChangedServices.ps1` | maps Git changes to affected services |
| `scripts/Smoke-Test.ps1` | authenticated checkout and timeline verification |
| `scripts/Wait-Service.ps1` | bounded health polling |

Operational command details are kept in the
[testing README](https://github.com/taukhir/shopverse/tree/main/testing).

## Quick Mode

One service:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\Verify-Shopverse.ps1 `
  -Mode Quick `
  -Services order-service
```

The script runs:

```text
gradlew.bat test --no-daemon --max-workers=2
```

All services:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\Verify-Shopverse.ps1 `
  -Mode Quick
```

Prefer one affected service during development.

## Changed Mode

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\Verify-Shopverse.ps1 `
  -Mode Changed `
  -BaseRef origin/main
```

The script detects affected services. Shared-file changes can select all
services. If no services changed, it exits without creating work.

## Integration Mode

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\Verify-Shopverse.ps1 `
  -Mode Integration `
  -TimeoutMinutes 10
```

By default, it runs `integrationTest` sequentially for:

```text
order-service
inventory-service
payment-service
```

Direct service command:

```powershell
cd order-service
.\gradlew.bat integrationTest --no-daemon --max-workers=2
```

Docker must be available. The annotations currently allow tests to be disabled
when Docker is absent; CI is expected to provide Docker.

## Full Mode

Reuse a healthy development stack:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\Verify-Shopverse.ps1 `
  -Mode Full `
  -TimeoutMinutes 10
```

Force a fresh isolated stack:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\Verify-Shopverse.ps1 `
  -Mode Full `
  -TimeoutMinutes 10 `
  -ForceIsolatedStack
```

The isolated mode:

- uses `docker-compose.yml` plus `docker-compose.test.yml`;
- publishes the gateway on `localhost:18080`;
- limits Compose build/start parallelism to two;
- starts application dependencies but omits the heavy observability stack;
- polls gateway health;
- runs the SAGA smoke test;
- prints bounded diagnostics on failure;
- removes containers and volumes unless `-KeepStack` is supplied.

Because the lightweight Full mode omits Prometheus, Loki, Promtail, and Grafana,
it does not verify the complete observability deployment. Observability should
be checked against the normal full development stack or a dedicated scheduled
gate.

## Existing Stack Smoke Test

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\Smoke-Test.ps1
```

Custom gateway and deadline:

```powershell
.\scripts\Smoke-Test.ps1 `
  -GatewayUrl http://localhost:18080 `
  -TimeoutSeconds 45
```

The script returns order ID, order number, status, correlation ID, and the
configured deadline.

## CI Pipeline

`.github/workflows/ci.yml` currently:

1. validates configuration and Compose;
2. detects changed services;
3. runs affected unit-test jobs with maximum parallelism three;
4. runs affected commerce integration jobs with maximum parallelism two;
5. builds affected Docker images;
6. runs a lightweight Compose checkout gate on `main`, manual, and scheduled
   runs;
7. uploads failed Gradle reports;
8. prints bounded Compose diagnostics;
9. always tears down the CI stack.

CI hard limits include:

```text
unit test job:        10 minutes
integration job:     12 minutes
Docker build job:    12 minutes
Compose smoke job:   15 minutes
```

These hard limits are deliberately above the performance targets.

## Resource Controls

- Gradle workers are limited to two.
- Test JVM forks are limited to one per service.
- integration tests execute sequentially inside each service.
- CI matrices have bounded parallelism.
- Compose parallelism is limited to two.
- verification uses an overall deadline.
- container startup and HTTP waits are bounded.
- diagnostics tail a fixed number of lines.
- cleanup runs unless preservation is requested.

These controls reduce deadlocks and resource exhaustion in testing. Production
deadlock prevention still depends on short transactions, lock ordering,
idempotency, and bounded retries.

## Recommended Test Selection

| Change | Minimum verification |
|---|---|
| pure utility/domain rule | unit test |
| controller validation/JSON | controller test or MVC slice |
| authorization expression | Spring security test |
| repository query/mapping | JPA slice or MySQL integration |
| Liquibase change | MySQL Testcontainers integration |
| outbox transaction | transaction integration |
| Kafka serialization/producer | Kafka integration |
| SAGA contract/listener | focused integration plus smoke where needed |
| gateway route/security | gateway test plus E2E smoke |
| Docker/startup configuration | Compose validation and bounded Full mode |
| observability provisioning | normal stack plus target/query checks |

## Failure Triage

### Unit Failure

```powershell
.\order-service\gradlew.bat test `
  --no-daemon `
  --max-workers=2
```

Read:

```text
order-service/build/reports/tests/test/index.html
```

Do not start Docker to diagnose an assertion or compilation failure.

### Integration Failure

```powershell
.\order-service\gradlew.bat integrationTest `
  --no-daemon `
  --max-workers=2
```

Check:

- Docker availability and image pull;
- Testcontainers startup logs;
- dynamic datasource/Kafka properties;
- Liquibase failure;
- MySQL constraint/locking error;
- broker acknowledgement timeout;
- report under `build/reports/tests/integrationTest`.

### E2E Failure

Inspect:

```powershell
docker compose ps
docker compose logs --tail=120 `
  api-gateway order-service inventory-service payment-service kafka mysql
```

Use the generated correlation ID to search logs. Keep the stack only when
additional inspection is required:

```powershell
-KeepStack
```

Clean it manually afterward.

## Current Gaps

- Repository-specific `@DataJpaTest` coverage is limited.
- Automated SAGA failure/compensation scenarios are not as complete as the
  success smoke path.
- DLT persistence/replay is not fully covered by the current E2E script.
- Prometheus, Loki, Zipkin, and Grafana are not verified by the lightweight
  isolated Full mode.
- Consumer processing and lag behavior need deeper Kafka integration tests.
- Concurrent last-item race testing should be automated.
- Event contracts need immutable event IDs before strict consumer-inbox tests.

These are testing roadmap items, not implemented guarantees.

## Next Improvements

1. Add MySQL repository tests for uniqueness, entity graphs, and optimistic
   locking.
2. Add listener integration tests with unique topics and bounded Awaitility.
3. Add automated payment decline, timeout/reconciliation, and compensation
   scenarios.
4. Add DLT persistence and replay integration tests.
5. Add concurrent last-item reservation tests.
6. Add an observability verification job for targets, rules, Loki correlation,
   Zipkin trace, and Grafana health.
7. Report mode duration trends so performance regressions are visible.
8. Fail CI explicitly if required integration suites are skipped.

## Related Guides

- [Spring Boot testing](../spring/SPRING-BOOT-TESTING.md)
- [Testing commands](https://github.com/taukhir/shopverse/tree/main/testing)
- [CI workflows](https://github.com/taukhir/shopverse/tree/main/.github/workflows)
- [Debugging](DEBUGGING.md)
- [Features and demos](../reference/FEATURES-AND-DEMOS.md)

## Recommended Next

Return to [Shopverse Testing Strategy](./TESTING.md) to select the next focused guide.


## Official References

- [Spring Framework reference](https://docs.spring.io/spring-framework/reference/)
- [Spring Boot reference](https://docs.spring.io/spring-boot/reference/)
