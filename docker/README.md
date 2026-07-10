# Shopverse Docker Runbook

This directory contains Docker-specific supporting files. The root
[`docker-compose.yml`](../docker-compose.yml) is the main entry point.

Detailed explanations of the service Dockerfile, multi-stage builds, BuildKit
cache isolation, non-root users, Compose configuration, MySQL bootstrap, and
every major directive are maintained in:

- [Shopverse Docker implementation](../documentation/docs/operations/SHOPVERSE-DOCKER.md)
- [Generic Docker reference](../documentation/docs/operations/DOCKER.md)
- [Production problems and solutions](../documentation/docs/reliability/PROBLEMS-AND-SOLUTIONS.md)

## Prerequisites

- Docker Desktop with Compose v2
- at least 8 GB memory available to Docker for the complete stack
- a root `.env` created from `.env.example`

```powershell
Copy-Item .env.example .env
```

The `.env` file is for local POC secrets and is ignored by Git. Replace all
placeholder passwords and keys before exposing the stack outside a development
machine.

## Start

From the repository root:

```powershell
docker compose --profile apps --profile assets config --quiet
docker compose --profile apps --profile assets up --build -d
docker compose ps
```

`docker compose --profile apps --profile assets config --quiet` validates interpolation and the final merged model
before Docker creates resources.

## Common Commands

```powershell
# Start or update the complete stack
docker compose --profile apps --profile assets up -d

# Rebuild and restart one changed service
docker compose --profile apps up -d --build order-service

# Follow bounded service logs
docker compose logs --tail=200 -f order-service

# Show container status
docker compose ps

# Stop containers but retain named volumes
docker compose down

# Remove containers and named volumes (destructive)
docker compose down -v

# Build one tagged image directly
docker build -f order-service/Dockerfile -t shopverse/order-service:local .
```

Important flags:

| Flag | Meaning |
|---|---|
| `-d` | run containers in the background |
| `-f FILE` | use a specified Compose file |
| `--build` | build images before starting |
| `--no-cache` | rebuild all Dockerfile layers; use only for cache diagnosis |
| `-t NAME:TAG` | assign a repository name and tag to an image |
| `--tail=N` | bound the number of log lines |
| `-v` on `down` | remove named volumes and their persistent data |

## Lightweight Verification

The verification override starts only the dependencies required by the
automated checkout path:

```powershell
docker compose -f docker-compose.yml -f docker-compose.test.yml up -d --build
```

Use the repository scripts for bounded checks:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Verify-Shopverse.ps1 `
  -Mode Quick -TimeoutMinutes 1

powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Verify-Shopverse.ps1 `
  -Mode Integration -TimeoutMinutes 5

powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Verify-Shopverse.ps1 `
  -Mode Full -TimeoutMinutes 10 -ForceIsolatedStack
```

The full script is intended to have an explicit timeout and bounded diagnostic
output. Do not replace it with an unbounded `docker compose logs -f` in CI.

## MySQL Databases

Shopverse uses one MySQL server container for local efficiency, but separate
logical schemas and credentials for service ownership. The
`mysql-bootstrap` container initializes the schemas before dependent services
start.

```powershell
docker compose logs --tail=200 mysql-bootstrap
docker compose exec mysql mysql -uroot -p
```

Production deployments should use managed/database-per-service isolation as
required by scale, security, and availability objectives.

## MinIO Product Media

MinIO provides local S3-compatible object storage for Inventory catalog images.
MySQL stores product metadata plus `imageKey` and `imageUrl`; it does not store
image bytes. The `minio-init` one-shot service creates the
`shopverse-product-images` bucket, makes it downloadable for the public POC
catalog, and uploads the committed files from `assets/products/products`.

Add these local-only values to `.env` before any Compose build or startup:

```properties
MINIO_ROOT_USER=shopverse-minio
MINIO_ROOT_PASSWORD=replace-with-a-strong-local-password
```

Compose validates every required variable before it builds any individual
service. Therefore a missing MinIO password can block `docker compose build
order-service`; use `docker compose config` first to diagnose interpolation.

```powershell
docker compose --profile assets config --quiet
docker compose --profile assets up -d minio minio-init
docker compose ps minio minio-init
docker compose logs --tail=100 minio-init
```

Expected result: `minio` is healthy and `minio-init` exits with code `0`.
The object API is `http://localhost:9000`; the local administration console is
`http://localhost:9001`. Use `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` only
for the console. The frontend uses the public per-product URL returned by
Inventory and never receives root credentials.

After changing or adding a file below `assets/products/products`, rerun only
the initializer:

```powershell
docker compose --profile assets up -d --force-recreate minio-init
docker compose logs --tail=100 minio-init
```

## Health And Diagnostics

```powershell
docker compose ps
docker compose logs --tail=200 config-server
docker compose logs --tail=200 discovery-server
docker compose logs --tail=200 api-gateway
docker compose logs --tail=200 order-service inventory-service payment-service
```

Avoid repeatedly dumping every container's complete history. Start with health
status, then inspect the affected service and its direct dependencies.

## Local URLs

| Component | URL |
|---|---|
| API Gateway | `http://localhost:8080` |
| Config Server | `http://localhost:8888` |
| Discovery Server | `http://localhost:8761` |
| Grafana | `http://localhost:3000` |
| Prometheus | `http://localhost:9090` |
| Zipkin | `http://localhost:9411` |
| MinIO object API | `http://localhost:9000` |
| MinIO console | `http://localhost:9001` |
| Jenkins | `http://localhost:8085` |

Credentials are environment-driven; do not assume a fixed username/password
from documentation.

## Image Design

All Spring Boot service images follow the same principles:

- build in a JDK stage and run in a smaller JRE stage;
- use a unique BuildKit Gradle cache ID per service;
- copy the JAR with the final runtime owner to avoid a duplicate ownership
  layer;
- run as a non-root user;
- include only runtime files in the final image;
- expose Actuator health checks;
- write application files under `/app/logs`.

See the [implementation page](../documentation/docs/operations/SHOPVERSE-DOCKER.md) for the
annotated Dockerfile and Compose examples.
