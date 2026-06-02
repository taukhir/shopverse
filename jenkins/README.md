# Shopverse Jenkins

This folder contains the local Jenkins setup for the Shopverse POC.

Official Jenkins references:

- [Using a Jenkinsfile](https://www.jenkins.io/doc/book/pipeline/jenkinsfile/)
- [Pipeline syntax](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Pipeline as Code](https://www.jenkins.io/doc/book/pipeline/pipeline-as-code/)

## What Jenkins Does

Jenkins is a CI/CD automation server. In this POC, we use it to demonstrate how a team can build and test all microservices from one pipeline, build Docker images, optionally push images to a registry, and optionally run local Docker Compose smoke tests.

GitHub Actions already gives us hosted CI/CD. Jenkins gives us a local or company-hosted CI/CD option where we control the machine, Docker daemon, build cache, installed tools, and deployment access.

## Files

```text
jenkins/
  Dockerfile
  Jenkinsfile
  README.md
  docker-compose.yml
  plugins.txt
  init.groovy.d/01-basic-security.groovy
```

| File | Purpose |
| --- | --- |
| `Dockerfile` | Builds a Jenkins image with JDK 21, Docker CLI, buildx, Docker Compose, Git, and required Jenkins plugins. |
| `docker-compose.yml` | Runs Jenkins locally on port `8085` and mounts the Shopverse repo plus Docker socket. |
| `Jenkinsfile` | Defines the Shopverse CI pipeline. |
| `plugins.txt` | Jenkins plugins installed during image build. |
| `init.groovy.d/01-basic-security.groovy` | Creates the local admin user and disables first-run setup wizard. |

## Start Jenkins

From the Shopverse root folder:

```powershell
docker compose -f jenkins/docker-compose.yml build
docker compose -f jenkins/docker-compose.yml up -d
```

Open Jenkins:

```text
http://localhost:8085
```

Default local login:

```text
admin / admin
```

Check logs:

```powershell
docker compose -f jenkins/docker-compose.yml logs -f jenkins
```

Stop Jenkins:

```powershell
docker compose -f jenkins/docker-compose.yml down
```

Reset Jenkins data:

```powershell
docker compose -f jenkins/docker-compose.yml down -v
```

Use `down -v` carefully because it deletes the Jenkins home volume.

## Create The Jenkins Pipeline Job

1. Open `http://localhost:8085`.
2. Login with `admin / admin`.
3. Click **New Item**.
4. Enter a name like `shopverse`.
5. Select **Pipeline**.
6. Under **Pipeline**, choose **Pipeline script from SCM**.
7. Select **Git**.
8. Add your Shopverse GitHub repository URL.
9. Set **Branch Specifier** to your branch, for example `*/main`.
10. Set **Script Path** to:

```text
jenkins/Jenkinsfile
```

11. Save.
12. Run **Build with Parameters**.

For a local mounted workspace smoke run, you can also create a pipeline job with an inline script, but the preferred POC setup is `Pipeline script from SCM` so Jenkins checks out the latest code from GitHub.

## Pipeline Parameters

| Parameter | Default | Use |
| --- | --- | --- |
| `BUILD_DOCKER_IMAGES` | `true` | Builds Docker images after Gradle build/test. |
| `RUN_COMPOSE_SMOKE_TEST` | `false` | Starts the full stack and verifies health endpoints. |
| `PUSH_DOCKER_IMAGES` | `false` | Pushes images to a registry. |
| `IMAGE_REGISTRY` | empty | Optional registry host, for example `ghcr.io`. |
| `IMAGE_NAMESPACE` | `shopverse` | Image namespace or owner/repo path. |
| `IMAGE_TAG` | auto | Optional fixed image tag. |
| `DOCKER_CREDENTIALS_ID` | empty | Optional Jenkins username/password credential for Docker login. |

## Pipeline Stages

### 1. Checkout Latest Code

Jenkins checks out the latest source from the configured Git SCM. If the job is run from a locally mounted workspace without SCM, it falls back to:

```text
git fetch --all --prune
git pull --ff-only
```

This keeps the build input aligned with the latest GitHub code.

### 2. Initialize

The pipeline creates a Docker image tag. If `IMAGE_TAG` is not provided, it uses:

```text
<jenkins-build-number>-<short-git-sha>
```

### 3. Validate Repository

The pipeline checks that required files exist, including:

```text
docker-compose.yml
cloud-configs/*.yml
observability/prometheus-docker.yml
observability/promtail.yml
observability/loki.yml
```

This catches missing config before spending time on builds.

### 4. Build And Test Services

All services are built and tested in parallel:

```text
config-server
discovery-server
user-service
auth-service
order-service
api-gateway
```

Each service runs:

```text
./gradlew clean build --no-daemon
```

Jenkins also collects JUnit test reports and archives test report HTML folders when present.

### 5. Build Docker Images

When `BUILD_DOCKER_IMAGES=true`, Jenkins builds one Docker image per service:

```text
docker build -t <image-name> ./<service>
```

BuildKit is enabled because the service Dockerfiles use cache mounts.

Example image:

```text
shopverse/config-server:<build-number>-<git-sha>
```

### 6. Push Docker Images

When `PUSH_DOCKER_IMAGES=true`, Jenkins optionally logs in using `DOCKER_CREDENTIALS_ID` and pushes every built service image.

For GHCR, use:

```text
IMAGE_REGISTRY=ghcr.io
IMAGE_NAMESPACE=<owner>/<repo>
```

### 7. Docker Compose Smoke Test

When `RUN_COMPOSE_SMOKE_TEST=true`, Jenkins starts the full local stack:

```text
docker compose up -d --build
```

Then it verifies service health endpoints and the public order health API. If the smoke test fails, Jenkins prints `docker compose ps` and recent logs.

## One-Service Build Demo

We tested Jenkins with a small one-service smoke pipeline that built:

```text
shopverse/config-server:jenkins-api-smoke
```

That confirms Jenkins can:

1. Access the Shopverse workspace.
2. Use Docker from inside the Jenkins container.
3. Use BuildKit/buildx.
4. Build a service image successfully.

The full `jenkins/Jenkinsfile` uses the same Docker path, but applies it to all six services.

## Useful Commands

Verify Jenkins is running:

```powershell
docker compose -f jenkins/docker-compose.yml ps
```

Verify Jenkins can access Docker:

```powershell
docker exec shopverse-jenkins docker version
docker exec shopverse-jenkins docker buildx version
docker exec shopverse-jenkins docker compose version
```

Build one image from inside Jenkins:

```powershell
docker exec shopverse-jenkins sh -c "cd /workspace/shopverse && DOCKER_BUILDKIT=1 docker build -t shopverse/config-server:jenkins-smoke ./config-server"
```

Check the image:

```powershell
docker image inspect shopverse/config-server:jenkins-smoke
```

## Notes

- Jenkins runs on host port `8085` because the API Gateway uses `8080`.
- The Jenkins container mounts `/var/run/docker.sock`, so it can build images on the host Docker daemon.
- A clean Jenkins image build needs internet access to `updates.jenkins.io` for plugin installation.
- The local default password is only for the POC. Use a stronger password outside local demos.
