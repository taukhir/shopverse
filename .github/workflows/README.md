# Shopverse GitHub Actions

This folder contains the GitHub Actions workflows used by the Shopverse POC.

Official GitHub Actions references:

- [GitHub Actions documentation](https://docs.github.com/en/actions)
- [Workflow syntax for GitHub Actions](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions)
- [GitHub Actions contexts](https://docs.github.com/en/actions/learn-github-actions/contexts)
- [Encrypted secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

## Workflows

```text
.github/workflows/
  ci.yml
  deploy.yml
  jenkins-trigger.yml
```

| Workflow | Purpose |
| --- | --- |
| `ci.yml` | Validates the repository, builds and tests services, builds Docker images, and runs a Docker Compose smoke test. |
| `deploy.yml` | Builds and pushes service images to GitHub Container Registry, then optionally deploys to a Docker host over SSH. |
| `jenkins-trigger.yml` | Optionally triggers a Jenkins pipeline after GitHub CI succeeds. |

## CI Workflow

File:

```text
.github/workflows/ci.yml
```

Workflow name:

```text
Shopverse CI
```

Triggers:

```text
push        any branch
pull_request any branch
```

Concurrency:

```text
shopverse-ci-${{ github.ref }}
```

This means only one CI run per branch/ref stays active. If a new commit is pushed to the same branch, the older in-progress CI run is cancelled.

Permissions:

```text
contents: read
```

The CI workflow only needs to read repository contents.

### CI Environment

```text
JAVA_VERSION=21
```

All Gradle builds use Java 21 with Temurin.

### CI Job 1: Validate Repository Config

Job id:

```text
validate-config
```

What it does:

1. Checks out the repository.
2. Verifies that required config and observability files exist.

Required files:

```text
docker-compose.yml
cloud-configs/application.yml
cloud-configs/API-GATEWAY.yml
cloud-configs/AUTH-SERVICE.yml
cloud-configs/USER-SERVICE.yml
cloud-configs/ORDER-SERVICE.yml
cloud-configs/PAYMENT-SERVICE.yml
cloud-configs/INVENTORY-SERVICE.yml
cloud-configs/DISCOVERY-SERVER.yml
observability/prometheus-docker.yml
observability/promtail.yml
observability/loki.yml
```

Why it matters:

Shopverse depends on centralized config and observability config. This job catches missing files early, before Gradle or Docker builds start.

### CI Job 2: Build And Test Services

Job id:

```text
build-and-test
```

Depends on:

```text
validate-config
```

Strategy:

```text
matrix
fail-fast: false
```

Services:

```text
config-server
discovery-server
user-service
auth-service
order-service
payment-service
inventory-service
api-gateway
```

What it does for each service:

1. Checks out the repository.
2. Sets up Java 21.
3. Sets up Gradle caching through `gradle/actions/setup-gradle`.
4. Runs:

```bash
chmod +x ./gradlew
./gradlew clean build --no-daemon
```

5. Uploads test reports from:

```text
<service>/build/reports/tests/test
```

Why `fail-fast: false`:

If one service fails, GitHub Actions still runs the remaining service builds. That gives a better picture of the whole POC health.

### CI Job 3: Docker Build

Job id:

```text
docker-build
```

Depends on:

```text
build-and-test
```

Services:

```text
config-server
discovery-server
user-service
auth-service
order-service
payment-service
inventory-service
api-gateway
```

What it does:

1. Checks out the repository.
2. Sets up Docker Buildx.
3. Builds each service Docker image without pushing.

Image tag format:

```text
shopverse/<service>:ci-${{ github.sha }}
```

Example:

```text
shopverse/user-service:ci-<commit-sha>
```

Why it matters:

Gradle can pass while Docker packaging fails. This job verifies each service Dockerfile is valid.

### CI Job 4: Docker Compose Smoke Test

Job id:

```text
compose-smoke-test
```

Depends on:

```text
docker-build
```

Timeout:

```text
20 minutes
```

What it does:

1. Checks out the repository.
2. Starts the full stack:

```bash
docker compose up -d --build
```

3. Waits for API Gateway health:

```text
http://localhost:8080/actuator/health
```

4. Verifies service health endpoints:

```text
http://localhost:8888/actuator/health
http://localhost:8761/actuator/health
http://localhost:8082/actuator/health
http://localhost:8081/actuator/health
http://localhost:8083/actuator/health
http://localhost:8084/actuator/health
http://localhost:8086/actuator/health
http://localhost:8080/actuator/health
```

5. Verifies the public order health API:

```text
http://localhost:8080/api/v1/orders/public/health
http://localhost:8080/api/v1/payments/public/health
http://localhost:8080/api/v1/inventory/public/health
```

6. Verifies Prometheus metrics are exposed:

```text
http://localhost:8082/actuator/prometheus
http://localhost:8083/actuator/prometheus
http://localhost:8084/actuator/prometheus
http://localhost:8086/actuator/prometheus
```

On failure:

```bash
docker compose ps
docker compose logs --tail=500
```

Always cleanup:

```bash
docker compose down -v
```

Why it matters:

This confirms the services can run together, not only compile independently.

## Deploy Workflow

File:

```text
.github/workflows/deploy.yml
```

Workflow name:

```text
Shopverse Deploy
```

Triggers:

```text
workflow_run after Shopverse CI completes on main
workflow_dispatch manual trigger
```

The automatic deployment path only continues when `Shopverse CI` completed successfully.

Manual input:

```text
image_tag
```

Default manual image tag:

```text
latest
```

Permissions:

```text
contents: read
packages: write
```

`packages: write` is required because the workflow pushes Docker images to GitHub Container Registry.

Concurrency:

```text
shopverse-deploy-production
```

This prevents multiple production deploys from running at the same time.

### Deploy Environment

```text
JAVA_VERSION=21
REGISTRY=ghcr.io
```

`REGISTRY` points to GitHub Container Registry.

### Deploy Job 1: Build And Push Images

Job id:

```text
build-and-push-images
```

Runs when:

```text
manual workflow_dispatch
or
Shopverse CI concluded successfully
```

Services:

```text
config-server
discovery-server
user-service
auth-service
order-service
payment-service
inventory-service
api-gateway
```

What it does:

1. Checks out the source commit from the CI run, or the current manual run SHA.
2. Resolves lowercase image namespace from:

```text
${GITHUB_REPOSITORY}
```

3. Sets up Docker Buildx.
4. Logs in to GHCR using:

```text
secrets.GITHUB_TOKEN
```

5. Builds and pushes each service image.

Image tags:

```text
ghcr.io/<owner>/<repo>/<service>:<source-sha>
ghcr.io/<owner>/<repo>/<service>:latest
```

Example:

```text
ghcr.io/taukhir/shopverse/user-service:<commit-sha>
ghcr.io/taukhir/shopverse/user-service:latest
```

Why it matters:

This publishes immutable commit-based images and a convenient `latest` tag.

### Deploy Job 2: Deploy To Docker Host

Job id:

```text
deploy
```

Depends on:

```text
build-and-push-images
```

Runs only when repository variable is:

```text
ENABLE_SSH_DEPLOY=true
```

Environment:

```text
production
```

What it does:

1. Resolves image namespace and image tag.
2. Connects to the deployment host using SSH.
3. Moves into `DEPLOY_PATH`.
4. Pulls the latest repo changes:

```bash
git pull
```

5. Creates `.env.deploy` with:

```text
IMAGE_REGISTRY
IMAGE_NAMESPACE
IMAGE_TAG
```

6. Optionally logs in to GHCR using `GHCR_READ_TOKEN`.
7. Pulls service images using:

```bash
docker compose --env-file .env --env-file .env.deploy -f docker-compose.yml -f docker-compose.deploy.yml pull config-server discovery-server user-service auth-service order-service payment-service inventory-service api-gateway
```

8. Starts/recreates the stack:

```bash
docker compose --env-file .env --env-file .env.deploy -f docker-compose.yml -f docker-compose.deploy.yml up -d
```

9. Prints container status:

```bash
docker compose --env-file .env --env-file .env.deploy -f docker-compose.yml -f docker-compose.deploy.yml ps
```

Why `docker-compose.deploy.yml` exists:

The normal `docker-compose.yml` can build local images. The deploy override replaces service images with GHCR images:

```text
${IMAGE_REGISTRY}/${IMAGE_NAMESPACE}/<service>:${IMAGE_TAG}
```

## Jenkins Trigger Workflow

File:

```text
.github/workflows/jenkins-trigger.yml
```

Workflow name:

```text
Trigger Jenkins
```

Triggers:

```text
workflow_run after Shopverse CI completes on main
workflow_dispatch manual trigger
```

Runs when:

```text
manual workflow_dispatch
or
Shopverse CI concluded successfully
```

What it does:

1. Reads Jenkins connection details from GitHub secrets.
2. Requests a Jenkins CSRF crumb.
3. Calls Jenkins `buildWithParameters`.
4. Passes:

```text
IMAGE_TAG
BUILD_DOCKER_IMAGES=true
RUN_COMPOSE_SMOKE_TEST=false
```

Required secrets:

```text
JENKINS_URL
JENKINS_JOB_PATH
JENKINS_USER
JENKINS_API_TOKEN
```

Example:

```text
JENKINS_URL=http://your-jenkins-url
JENKINS_JOB_PATH=job/shopverse
```

Important:

GitHub-hosted runners cannot call Jenkins running on your laptop at `localhost`. To use this workflow with local Jenkins, use one of these options:

```text
self-hosted GitHub runner on your machine
publicly reachable Jenkins URL
VPN/tunnel that the GitHub runner can reach
```

## Required Repository Variables

For deploy-over-SSH:

```text
ENABLE_SSH_DEPLOY=true
```

If this variable is missing or not `true`, images still build and push, but the SSH deploy job is skipped.

## Required Secrets

For SSH deployment:

```text
DEPLOY_HOST
DEPLOY_USER
DEPLOY_SSH_KEY
DEPLOY_PATH
```

For optional SSH/deploy behavior:

```text
DEPLOY_PORT
GHCR_READ_TOKEN
```

For Jenkins trigger:

```text
JENKINS_URL
JENKINS_JOB_PATH
JENKINS_USER
JENKINS_API_TOKEN
```

## End-To-End Flow

Typical branch flow:

```text
Developer pushes branch
  -> Shopverse CI runs
  -> config validation
  -> service build/test matrix
  -> Docker image build matrix
  -> Docker Compose smoke test
```

Typical main deployment flow:

```text
Developer pushes/merges to main
  -> Shopverse CI runs
  -> Shopverse Deploy starts after CI success
  -> images are built and pushed to GHCR
  -> SSH deploy runs only if ENABLE_SSH_DEPLOY=true
```

Optional Jenkins flow:

```text
Shopverse CI succeeds on main
  -> Trigger Jenkins workflow starts
  -> GitHub calls Jenkins buildWithParameters
  -> Jenkins runs jenkins/Jenkinsfile locally/on-prem
```

## How To Run Manually

Run CI manually:

CI currently runs on `push` and `pull_request`. To manually test the same logic locally, use:

```powershell
docker compose build
docker compose up -d
```

Run deploy manually:

1. Open GitHub repository.
2. Go to **Actions**.
3. Select **Shopverse Deploy**.
4. Click **Run workflow**.
5. Optionally provide `image_tag`.

Run Jenkins trigger manually:

1. Open GitHub repository.
2. Go to **Actions**.
3. Select **Trigger Jenkins**.
4. Click **Run workflow**.
5. Optionally provide `image_tag`.

## Troubleshooting

Missing config file:

```text
Missing required file: cloud-configs/<SERVICE>.yml
```

Fix:

```text
Add the missing centralized config file or update ci.yml if the service was intentionally removed.
```

Docker Compose smoke test fails:

```text
Check the dumped docker compose ps and docker compose logs output in the failed CI job.
```

GHCR push fails:

```text
Check that packages: write permission exists and repository/package permissions allow GitHub Actions to publish images.
```

SSH deploy fails:

```text
Check DEPLOY_HOST, DEPLOY_USER, DEPLOY_SSH_KEY, DEPLOY_PATH, and optional DEPLOY_PORT.
```

Jenkins trigger fails:

```text
Check JENKINS_URL, JENKINS_JOB_PATH, JENKINS_USER, JENKINS_API_TOKEN, and whether Jenkins is reachable from the runner.
```
