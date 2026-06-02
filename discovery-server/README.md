# Shopverse Discovery Server

Discovery Server is the Eureka registry for Shopverse services.

## Responsibilities

- Run Eureka server on port `8761`.
- Let services register themselves by application name.
- Let clients discover services such as `USER-SERVICE`, `ORDER-SERVICE`, and `AUTH-SERVICE`.
- Expose health and Prometheus metrics.
- Emit startup and request logs for centralized logging.

## Port

```text
8761
```

## Useful URLs

```text
http://localhost:8761
```

```powershell
curl http://localhost:8761/actuator/health
curl http://localhost:8761/actuator/prometheus
```

## Docker

From the root project:

```powershell
docker compose build discovery-server
docker compose up -d discovery-server
docker compose logs -f discovery-server
```

The full stack is started from the root:

```powershell
docker compose up -d
```

## Jenkins Pipeline

Discovery Server is the Eureka server for Shopverse. It has a service-specific Jenkins pipeline:

```text
discovery-server/Jenkinsfile
```

Use this when you want Jenkins to build and test only the Eureka server, build its Docker image, and optionally deploy it to your local Docker Compose stack.

### Create The Jenkins Job

1. Start Jenkins from the Shopverse root folder:

```powershell
docker compose -f jenkins/docker-compose.yml up -d
```

2. Open Jenkins:

```text
http://localhost:8085
```

3. Login:

```text
admin / admin
```

4. Click **New Item**.
5. Enter:

```text
shopverse-discovery-server
```

6. Select **Pipeline**.
7. Under **Pipeline**, choose **Pipeline script from SCM**.
8. Select **Git**.
9. Add the Shopverse GitHub repository URL.
10. Set **Branch Specifier** to your branch, for example:

```text
*/main
```

11. Set **Script Path** to:

```text
discovery-server/Jenkinsfile
```

12. Save.
13. Click **Build with Parameters**.

### Jenkins Parameters

| Parameter | Default | Use |
| --- | --- | --- |
| `BUILD_DOCKER_IMAGE` | `true` | Builds the discovery-server Docker image after Gradle build/test. |
| `DEPLOY_LOCALLY` | `false` | Tags the image as `shopverse/discovery-server:local` and deploys it through root Docker Compose. |
| `IMAGE_NAME` | `shopverse/discovery-server` | Docker image repository/name. |
| `IMAGE_TAG` | empty | Optional tag. If empty, Jenkins uses `<build-number>-<git-sha>`. |

### Pipeline Stages

| Stage | What it does |
| --- | --- |
| `Checkout` | Pulls the latest code from GitHub using Jenkins SCM. |
| `Resolve Image Tag` | Creates the Docker image tag used by later stages. |
| `Build And Test` | Runs `./gradlew clean build --no-daemon` inside `discovery-server`. |
| `Build Docker Image` | Builds `shopverse/discovery-server:<tag>` using the service Dockerfile. |
| `Verify Docker Image` | Runs `docker image inspect` to confirm the image exists. |
| `Deploy Locally` | Optional. Re-tags the image as `shopverse/discovery-server:local`, runs `docker compose up -d discovery-server`, and waits for container health. |

### Deploy Locally From Jenkins

Use these parameters:

```text
BUILD_DOCKER_IMAGE=true
DEPLOY_LOCALLY=true
IMAGE_NAME=shopverse/discovery-server
IMAGE_TAG=
```

What Jenkins does:

1. Builds and tests `discovery-server`.
2. Builds an image such as:

```text
shopverse/discovery-server:<build-number>-<git-sha>
```

3. Tags that same image as:

```text
shopverse/discovery-server:local
```

4. Runs:

```powershell
docker compose up -d discovery-server
```

5. Waits for:

```text
shopverse-discovery-server
```

to become healthy.

### Deploy Stage Shell Commands Explained

The deploy stage uses these shell commands:

```bash
docker tag "${DISCOVERY_SERVER_IMAGE}" shopverse/discovery-server:local
```

This creates the local image tag expected by root `docker-compose.yml`. Compose runs Discovery Server with:

```text
shopverse/discovery-server:local
```

So Jenkins builds a unique image tag first, then also tags it as `local` for deployment.

```bash
docker compose up -d discovery-server
```

This starts or recreates only the `discovery-server` service from the root Compose file. The `-d` flag runs it in the background. Compose also starts required dependencies, such as `config-server`, if they are not already running.

```bash
for attempt in $(seq 1 40); do
```

This starts a retry loop with 40 attempts.

```bash
status=$(docker inspect -f '{{.State.Health.Status}}' shopverse-discovery-server 2>/dev/null || true)
```

This reads the Docker health status of the container. The `2>/dev/null` hides errors if the container is not ready yet. The `|| true` prevents the shell from failing the pipeline immediately while the container is still starting.

```bash
if [ "$status" = "healthy" ]; then
  echo "discovery-server is healthy"
  exit 0
fi
```

If Docker reports the container as `healthy`, Jenkins marks the deploy stage successful.

```bash
echo "Waiting for discovery-server health... attempt ${attempt}/40 current=${status:-unknown}"
sleep 5
```

This prints progress and waits 5 seconds before checking again.

```bash
docker compose ps discovery-server
docker compose logs --tail=200 discovery-server
exit 1
```

If the service never becomes healthy, Jenkins prints the service status and the last 200 log lines, then fails the build.

### Docker Image Commands

Build manually from the Shopverse root:

```powershell
docker build -t shopverse/discovery-server:local ./discovery-server
```

Build with Docker Compose:

```powershell
docker compose build discovery-server
```

Deploy/recreate only Discovery Server:

```powershell
docker compose up -d --force-recreate discovery-server
```

List images:

```powershell
docker image ls shopverse/discovery-server
```

Inspect an image:

```powershell
docker image inspect shopverse/discovery-server:<tag>
```

Verify after deployment:

```powershell
curl.exe http://localhost:8761/actuator/health
curl.exe http://localhost:8761/actuator/prometheus
docker compose logs -f discovery-server
```

Important notes:

- Discovery Server depends on Config Server in the root Compose stack.
- If Discovery Server restarts, other services may briefly reconnect to Eureka.
- Jenkins deploys locally because the Jenkins container mounts `/var/run/docker.sock`.
- The deployed image tag must be `shopverse/discovery-server:local` because that is what root `docker-compose.yml` uses.

## Observability

- Logs are written to `/app/logs/discovery-server.log`.
- Prometheus scrapes `/actuator/prometheus`.
- Prometheus includes standard JVM/process/HTTP metrics.
- Grafana Loki query:

```logql
{application="discovery-server"}
```
