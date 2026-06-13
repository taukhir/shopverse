# Shopverse Testing And Verification

This file contains executable commands for the repository scripts. Shopverse
coverage and the three bounded verification modes are documented in
[Testing strategy](../docs/development/TESTING.md). Reusable JUnit, Mockito,
Spring Test, controller/service/repository, Testcontainers, and E2E concepts
are documented in
[Spring Boot testing](../docs/spring/SPRING-BOOT-TESTING.md).

Shopverse uses layered verification so a small code change does not require a
full Docker rebuild. Each layer has a bounded purpose and timeout.

## Verification Layers

| Layer | Command | Purpose |
| --- | --- | --- |
| Unit | `test` | Fast controller, service, security, and domain tests |
| Infrastructure | `integrationTest` | Real MySQL migrations, transaction rollback, outbox persistence, and Kafka publishing through Testcontainers |
| Smoke | `Smoke-Test.ps1` | Authenticated checkout and SAGA timeline against an already running stack |
| Full | `Verify-Shopverse.ps1 -Mode Full` | Isolated lightweight Compose stack plus the authenticated SAGA smoke test |

Unit tests and integration tests are separate Gradle tasks. A normal `test`
run never starts Docker containers.

## Local Commands

Run unit tests only for one service:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Verify-Shopverse.ps1 `
  -Mode Quick -Services order-service
```

Run unit tests only for changed services:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Verify-Shopverse.ps1 `
  -Mode Changed
```

Compare against a specific branch:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Verify-Shopverse.ps1 `
  -Mode Changed -BaseRef origin/main
```

Run the MySQL and Kafka Testcontainers suites:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Verify-Shopverse.ps1 `
  -Mode Integration -TimeoutMinutes 10
```

Run checkout verification against the normal local stack:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Smoke-Test.ps1
```

Run a fresh isolated stack and checkout verification:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Verify-Shopverse.ps1 `
  -Mode Full -TimeoutMinutes 10 -ForceIsolatedStack
```

Without `-ForceIsolatedStack`, Full mode reuses a healthy development stack on
`localhost:8080`. This prevents Docker Desktop from running two complete
Shopverse environments at once. The forced isolated gate uses
`docker-compose.test.yml`, publishes only API Gateway on `localhost:18080`, and
does not start Prometheus, Loki, Promtail, or Grafana. Stop the development
stack first on lower-memory machines.

## Testcontainers Coverage

Order, Inventory, and Payment each use disposable:

- MySQL 8.4 for Liquibase and JPA schema validation
- Kafka 3.9.1 for producer connectivity

The suites verify:

1. Liquibase creates the service tables on a clean MySQL database.
2. Domain state and its outbox event commit in the same transaction.
3. A forced rollback leaves neither domain nor outbox data committed.
4. Kafka accepts the serialized outbox payload.

`@Testcontainers(disabledWithoutDocker = true)` lets unit-only development
continue when Docker is unavailable. CI runners are expected to provide Docker.

## Resource And Deadlock Controls

- Gradle build cache and configuration cache are enabled.
- Each service is limited to two Gradle workers.
- Test JVM forks are limited to one per service.
- Integration suites are sequential inside each service.
- CI service matrices have bounded parallelism.
- Compose builds and starts at most two services concurrently.
- The isolated Compose override caps container memory and Java heaps.
- Every local and CI gate has a timeout.
- Health checks use polling rather than fixed long sleeps.
- Failure diagnostics use bounded log tails.
- Full verification cleans up containers and volumes unless `-KeepStack` is supplied.

These controls prevent a failed startup from consuming resources indefinitely.
They do not replace database lock timeouts or production transaction design;
the commerce services still use short transaction boundaries, optimistic
locking, idempotent state transitions, and transactional outbox writes.

## CI Policy

`.github/workflows/ci.yml` applies these gates:

1. Validate required configuration and the merged Compose model.
2. Detect affected services from the Git diff.
3. Run unit tests only for affected services.
4. Run Testcontainers suites only for affected commerce services.
5. Build only affected Docker images with GitHub Actions layer caching.
6. Run the lightweight end-to-end SAGA gate on `main`, manual runs, and the
   scheduled full verification.

The scheduled workflow runs daily at `02:00 Asia/Kolkata` (`20:30 UTC`).

## Failure Triage

Start with the first failing layer. Do not run the full stack to diagnose a
unit-test failure.

```powershell
# Unit failure
.\order-service\gradlew.bat test --no-daemon --max-workers=2

# MySQL, migration, outbox, or Kafka failure
.\order-service\gradlew.bat integrationTest --no-daemon --max-workers=2

# Existing stack checkout failure
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Smoke-Test.ps1
```

Full verification prints container status and only the final 120 log lines on
failure. Use `-KeepStack` when deeper inspection is required.
