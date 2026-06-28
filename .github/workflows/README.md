# Shopverse GitHub Actions

This is the canonical workflow operations guide. Test-layer design and target runtimes are documented in [Testing strategy](../../documentation/docs/development/TESTING.md).

Shopverse uses GitHub Actions for affected-service CI, Docker image validation,
optional deployment, and optional Jenkins handoff.

Official references:

- [GitHub Actions documentation](https://docs.github.com/en/actions)
- [Workflow syntax](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions)
- [GitHub Actions secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

## Workflow Files

| File | Purpose |
| --- | --- |
| `ci.yml` | Validate config, test affected services, build affected images, and run the SAGA smoke gate |
| `deploy.yml` | Build and push images to GHCR, then optionally deploy through SSH |
| `jenkins-trigger.yml` | Trigger Jenkins after a successful GitHub workflow |
| `docs-site.yml` | Build the Docusaurus knowledge base and deploy it to GitHub Pages |

## CI Triggers

`Shopverse CI` runs for:

- every branch push
- every pull request
- manual `workflow_dispatch`
- daily scheduled verification at `20:30 UTC` (`02:00 Asia/Kolkata`)

Concurrency is grouped by Git ref. A newer commit on the same branch cancels
the older run so obsolete builds do not continue consuming runners.

## CI Stages

### 1. Validate Repository Config

The workflow verifies required centralized-config and observability files, then
parses the merged `docker-compose.yml` and `docker-compose.test.yml` model.
This fails in minutes when a file, variable, or Compose override is invalid.

### 2. Detect Affected Services

Git diff paths are converted into service matrices. A service-only change tests
and builds only that service. Shared changes under these paths select every
service:

```text
cloud-configs/
docker-compose*
docker/
observability/
scripts/
.github/workflows/
README.md
```

Manual and scheduled runs also select every service.

### 3. Unit Tests

Affected services run:

```bash
./gradlew test --no-daemon --max-workers=2
```

The job uses Java 21, the Gradle Actions cache, at most three service jobs in
parallel, and a ten-minute timeout. `clean` is intentionally omitted so the
Gradle build cache remains useful.

### 4. Infrastructure Integration Tests

Changed Order, Inventory, and Payment services run:

```bash
./gradlew integrationTest --no-daemon --max-workers=2
```

These Testcontainers suites use real MySQL and Kafka instances to verify
Liquibase migrations, JPA schema validation, transactional outbox commit and
rollback behavior, and Kafka publishing. They run separately from unit tests
and are limited to two service jobs in parallel.

### 5. Docker Image Build

Only affected service images are built. Buildx reuses a GitHub Actions cache
scoped by service:

```text
shopverse/<service>:ci-<commit-sha>
```

Images are validated but not pushed by the CI workflow.

### 6. Checkout SAGA Smoke Test

The end-to-end gate runs on `master`, manual runs, and scheduled verification.
It starts the lightweight Compose override, not the observability stack:

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.test.yml \
  up -d --build \
  mysql mysql-bootstrap kafka config-server discovery-server \
  user-service auth-service order-service payment-service \
  inventory-service api-gateway
```

The workflow polls `http://localhost:18080/actuator/health`, logs in as the demo
administrator, submits an idempotent checkout, waits for `CONFIRMED`, and
asserts the expected SAGA timeline stages.

On failure it prints container status and the last 120 log lines. Cleanup runs
even when a previous step fails.

## Deploy Workflow

`deploy.yml` runs after successful CI on `master` or through a manual dispatch.
It builds and pushes images to GitHub Container Registry. The optional SSH
deployment requires repository/environment secrets for the target host and
credentials.

Required permission:

```yaml
permissions:
  contents: read
  packages: write
```

Do not store registry tokens, database passwords, SSH keys, or production
credentials in workflow YAML. Use GitHub environment secrets and protected
deployment environments.

## Jenkins Trigger

`jenkins-trigger.yml` is an optional handoff. Use it only when Jenkins is
reachable from the GitHub-hosted runner or through a secure self-hosted runner.
Keep Jenkins credentials in GitHub secrets and configure Jenkins CSRF/API-token
requirements as documented in [jenkins/README.md](../../jenkins/README.md).

## Local Equivalent

The closest local commands are:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Verify-Shopverse.ps1 -Mode Changed
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Verify-Shopverse.ps1 -Mode Integration
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Verify-Shopverse.ps1 -Mode Full
```

See [testing/README.md](../../testing/README.md) for coverage and failure
triage.

## Documentation Workflow

`docs-site.yml` installs the pinned Node dependencies from
`documentation/package-lock.json`, runs the Docusaurus build, uploads the
generated static site, and deploys it to GitHub Pages. Changes under
`documentation/` or the workflow itself trigger this validation.

The complete local setup, customization, image/diagram, search, troubleshooting,
and deployment reference is
[Docusaurus documentation portal](../../documentation/docs/operations/DOCUSAURUS.md).

The local equivalent is:

```powershell
Set-Location documentation
npm ci
npm run typecheck
npm run build
```
