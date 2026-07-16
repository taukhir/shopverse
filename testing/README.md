# Shopverse Testing And Verification

This file contains executable commands for the repository scripts. Shopverse
coverage and the four bounded verification modes are documented in
[Testing strategy](../documentation/docs/development/TESTING.md). Reusable JUnit, Mockito,
Spring Test, controller/service/repository, Testcontainers, and E2E concepts
are documented in
[Spring Boot testing](../documentation/docs/spring/SPRING-BOOT-TESTING.md).

Shopverse uses layered verification so a small code change does not require a
full Docker rebuild. Each layer has a bounded purpose and timeout.

The local verification script separates Gradle-wrapper bootstrap from the test
execution budget. It reuses one Gradle daemon across the selected services,
runs service builds sequentially to avoid shared-cache lock contention, and
stops the daemon when the suite finishes. A failed or timed-out child process
prints its final 160 stdout/stderr lines before the summary.

## Verification Layers

| Layer | Command | Purpose |
| --- | --- | --- |
| Unit | `test` | Fast controller, service, security, and domain tests |
| Infrastructure | `integrationTest` | Real MySQL migrations, transaction rollback, outbox persistence, and Kafka publishing through Testcontainers |
| Smoke | `Smoke-Test.ps1` | Authenticated checkout and SAGA timeline against an already running stack |
| Full | `Verify-Shopverse.ps1 -Mode Full` | Isolated lightweight Compose stack plus the authenticated SAGA smoke test |
| Web quick | `npm run check:web:quick` in `shopverse-web` | Angular production build, unit tests, mocked E2E, accessibility, and Lighthouse |
| Full-stack web | `Test-ShopverseFullStack.ps1 -Mode Smoke` | Isolated Docker stack plus API SAGA smoke and real Angular/nginx browser smoke |
| Release checklist | `Test-ShopverseRelease.ps1 -Mode Full` | One go-live command that runs frontend/docs verification, full-stack verification, and writes a JSON report |

Unit tests and integration tests are separate Gradle tasks. A normal `test`
run never starts Docker containers.

## Local Commands

Run unit tests only for one service:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Verify-Shopverse.ps1 `
  -Mode Quick -Services order-service
```

Override the suite and individual-task budgets independently:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Verify-Shopverse.ps1 `
  -Mode Quick `
  -TimeoutMinutes 10 `
  -TaskTimeoutMinutes 4 `
  -BootstrapTimeoutMinutes 5
```

`TimeoutMinutes` starts after wrapper bootstrap. A cold wrapper download cannot
consume the budget intended for tests. The default per-task budget is four
minutes for unit tests and eight minutes for integration tests.

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

Verify every direct local service health endpoint:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Test-ShopverseHealthEndpoints.ps1
```

Verify the API Gateway production readiness contract:

```powershell
curl.exe http://localhost:8080/actuator/shopverse-readiness
```

`/actuator/shopverse-readiness` is stricter than `/actuator/health`. It checks
required discovery registrations, required gateway route IDs, downstream
service health, baseline inventory catalog data, and configured MiniIO product
image object reachability. `Test-ShopverseFullStack.ps1` waits for this
endpoint before running checkout smoke tests.

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

Run a fresh isolated stack with Angular and documentation containers:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Test-ShopverseFullStack.ps1 `
  -Mode Smoke -TimeoutMinutes 35
```

This publishes only test ports:

| Surface | URL |
|---|---|
| API Gateway | `http://127.0.0.1:18080` |
| Angular storefront/admin | `http://127.0.0.1:14200` |
| Docusaurus documentation | `http://127.0.0.1:13001` |

Use `-SkipBrowser` for backend-only Docker smoke, `-SkipDocs` to avoid building
the docs image, and `-KeepStack` when a failure needs manual inspection.

Run the structured release checklist:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Test-ShopverseRelease.ps1 `
  -Mode Full -TimeoutMinutes 60
```

The release checklist writes `testing/reports/shopverse-release-report.json`
with start/end timestamps, Git branch/commit, dirty-file count, phase results,
duration, and any failure message. Use these focused variants when needed:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Test-ShopverseRelease.ps1 `
  -Mode Quick -SkipFullStack -SkipBrowsers

powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Test-ShopverseRelease.ps1 `
  -Mode Quick -SkipFrontend -SkipBrowsers
```

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

## API Local Data Seeder

`scripts/Seed-ShopverseData.ps1` populates a running local stack through the
API Gateway. It deliberately exercises the same authentication, authorization,
validation, inventory upsert, idempotent checkout, Kafka SAGA, outbox, logging,
and tracing paths used by a normal client. It is not a Liquibase migration and
must never be used against a production environment.

The default data set contains 20 named customer accounts, 20 realistic catalog
items, and 50 one-item checkout requests. User creation accepts duplicate
users, product creation is a `PUT` upsert, and every checkout has a stable
`Idempotency-Key`. This means a rerun resumes the same data set instead of
silently creating another 50 logical checkouts.

To wipe all local database/object-store data and recreate the current baseline:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Reset-ShopverseLocalData.ps1 `
  -CustomerCount 20 -ProductCount 20 -OrderCount 50
```

The reset script runs `docker compose --profile apps --profile assets down -v`,
starts a fresh stack, waits for `/actuator/shopverse-readiness`, and then calls
`Seed-ShopverseData.ps1`.

Stable verification credentials and records:

| Purpose | Value |
|---|---|
| Administrator | `admin / Admin@123` |
| Customer one | `customer1 / Customer@123` |
| Customer two | `customer2 / Buyer@123` |
| Always-used smoke product | `101` |

Fresh local resets no longer keep legacy `DEMO-ORD-*` rows. Use
`.tmp/shopverse-api-seed-manifest.json` for the current order numbers,
correlation IDs, and idempotency keys.

Current API-seeded customer accounts are also written to the ignored maintained
credentials file `shopverse-local-credentials.md`.

| Username | Password |
|---|---|
| `john.smith` | `Shopverse!2026` |
| `emily.johnson` | `Shopverse!2026` |
| `michael.brown` | `Shopverse!2026` |
| `sarah.williams` | `Shopverse!2026` |
| `david.jones` | `Shopverse!2026` |
| `jessica.garcia` | `Shopverse!2026` |
| `daniel.miller` | `Shopverse!2026` |
| `laura.davis` | `Shopverse!2026` |
| `robert.martinez` | `Shopverse!2026` |
| `amanda.wilson` | `Shopverse!2026` |
| `christopher.anderson` | `Shopverse!2026` |
| `olivia.thomas` | `Shopverse!2026` |
| `matthew.taylor` | `Shopverse!2026` |
| `sophia.moore` | `Shopverse!2026` |
| `andrew.jackson` | `Shopverse!2026` |
| `natalie.white` | `Shopverse!2026` |
| `joshua.harris` | `Shopverse!2026` |
| `rachel.martin` | `Shopverse!2026` |
| `kevin.thompson` | `Shopverse!2026` |
| `megan.clark` | `Shopverse!2026` |

Start the Compose stack and seed it:

```powershell
$env:SHOPVERSE_ADMIN_PASSWORD = "Admin@123"
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Seed-ShopverseData.ps1
Remove-Item Env:SHOPVERSE_ADMIN_PASSWORD
```

For a smaller workstation run, lower the counts and concurrency:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Seed-ShopverseData.ps1 `
  -CustomerCount 5 -ProductCount 10 -OrderCount 20 -BatchSize 2
```

The script prompts for the administrator password when neither
`-AdminPassword` nor `SHOPVERSE_ADMIN_PASSWORD` is set. It writes generated
customer credentials to the ignored root file `shopverse-local-credentials.md` and
the full result, order identifiers, correlation IDs, and idempotency keys to
the ignored `.tmp/shopverse-api-seed-manifest.json`.

Use the manifest to investigate an individual checkout:

```powershell
$seed = Get-Content .\.tmp\shopverse-api-seed-manifest.json -Raw | ConvertFrom-Json
$seed.orders | Where-Object OrderIndex -eq 1 | Format-List
```

The correlation format is `api-seed-correlation-0001`, so it can be searched
directly in Grafana Explore/Loki. The matching order idempotency key is
`api-seed-checkout-0001`.

## Resource And Deadlock Controls

- Gradle build cache and configuration cache are enabled.
- Local suites reuse one bounded Gradle daemon and stop it afterward.
- Wrapper bootstrap has an independent timeout and reported duration.
- Every Gradle task has its own timeout in addition to the suite deadline.
- Failed tasks print bounded Gradle stdout and stderr before exiting.
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
