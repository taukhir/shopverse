# Shopverse Discovery Server

For reusable concepts such as registration, leases, stale instances,
client/server-side discovery, DNS, and Kubernetes discovery, see
[Service discovery](../documentation/docs/architecture/SERVICE-DISCOVERY.md). For the
complete Shopverse topology, see
[System design](../documentation/docs/architecture/SYSTEM-DESIGN.md). This README covers only
Shopverse Discovery Server operation.

Discovery Server is the Eureka registry for Shopverse services.

## Responsibilities

- Run Eureka server on port `8761`.
- Let services register themselves by application name.
- Let clients discover services such as `USER-SERVICE`, `ORDER-SERVICE`, `PAYMENT-SERVICE`, `INVENTORY-SERVICE`, and `AUTH-SERVICE`.
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

More Docker commands, flags, and Dockerfile details are in [../docker/README.md](../docker/README.md).

## Jenkins Pipeline

The service-specific pipeline is `discovery-server/Jenkinsfile`. Configure a
Pipeline-from-SCM job with that script path.

| Parameter | Purpose |
|---|---|
| `BUILD_DOCKER_IMAGE` | build the service image after Gradle validation |
| `DEPLOY_LOCALLY` | tag the image as `shopverse/discovery-server:local` and recreate the Compose service |
| `IMAGE_NAME` / `IMAGE_TAG` | control the immutable image identity |

The pipeline checks out code, builds/tests the service, optionally builds and
inspects the image, deploys it locally, and waits for Docker health.

For generic Jenkins syntax, stages, `when`, `options`, credentials, and
production practices, see [Jenkins](../documentation/docs/operations/JENKINS.md). For the
complete Shopverse Jenkins setup, see [jenkins/README.md](../jenkins/README.md).

## Observability

- Logs are written to `/app/logs/discovery-server.log`.
- Prometheus scrapes `/actuator/prometheus`.
- Prometheus includes standard JVM/process/HTTP metrics.
- Grafana Loki query:

```logql
{application="DISCOVERY-SERVER"}
```

## Configuration And Tests

Runtime settings come from `cloud-configs/DISCOVERY-SERVER.yml`. Run the
service checks with:

```powershell
./gradlew test
```
