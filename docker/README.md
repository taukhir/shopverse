# Shopverse Docker Runbook

This directory contains Docker-specific supporting files. The root
[`docker-compose.yml`](../docker-compose.yml) is the main entry point.

Detailed explanations of the service Dockerfile, multi-stage builds, BuildKit
cache isolation, non-root users, Compose configuration, MySQL bootstrap, and
every major directive are maintained in:

- [Shopverse Docker implementation](../docs/operations/SHOPVERSE-DOCKER.md)
- [Generic Docker reference](../docs/operations/DOCKER.md)
- [Production problems and solutions](../docs/reliability/PROBLEMS-AND-SOLUTIONS.md)

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
docker compose config
docker compose build
docker compose up -d
docker compose ps
```

`docker compose config` validates interpolation and the final merged model
before Docker creates resources.

## Common Commands

```powershell
# Start or update the complete stack
docker compose up -d

# Rebuild and restart one changed service
docker compose up -d --build order-service

# Follow bounded service logs
docker compose logs --tail=200 -f order-service

# Show container status
docker compose ps

# Stop containers but retain named volumes
docker compose down

# Remove containers and named volumes (destructive)
docker compose down -v

# Build one tagged image directly
docker build -t shopverse/order-service:local ./order-service
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

See the [implementation page](../docs/operations/SHOPVERSE-DOCKER.md) for the
annotated Dockerfile and Compose examples.
