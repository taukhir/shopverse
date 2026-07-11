---
title: Local Docker Implementation Guide
sidebar_position: 4
---

# Local Docker Implementation Guide

This guide explains how the Shopverse local Docker environment is assembled.
For Docker fundamentals, see [Docker](DOCKER.md). For the detailed current
Docker implementation, see [Shopverse Docker implementation](SHOPVERSE-DOCKER.md).

For measured startup, memory, and profile results, see
[Docker Compose Profiles](../reliability/problems/optimization/DOCKER-COMPOSE-PROFILES.md)
and [Runtime Optimization](../reliability/problems/optimization/RUNTIME-OPTIMIZATION.md).

## Shopverse Local Docker Stack

| Component | Role |
|---|---|
| Docker Compose | Starts infrastructure, services, networks, volumes, and health checks. |
| Config Server | Serves shared Spring configuration from `cloud-configs`. |
| Eureka Discovery Server | Allows services and the gateway to find each other by service name. |
| MySQL | Hosts service-owned schemas for user, order, inventory, and payment data. |
| Kafka | Carries SAGA and integration events. |
| MinIO | Provides local object-storage-compatible infrastructure where needed. |
| Spring Boot services | Run API Gateway, Auth, User, Order, Inventory, and Payment. |
| Observability stack | Runs Prometheus, Loki, Promtail, Zipkin, and Grafana. |

The local environment is intended for reproducible development, demos, and
smoke testing. It is not a production deployment model.

![Animated Shopverse local Docker startup flow showing environment values, infrastructure, platform services, Spring Boot services, observability, and verification](/img/diagrams/shopverse-docker-startup-animated.gif)

## Step 1: Define Environment Values

Keep local values in `.env` and commit only `.env.example`.

Typical values include:

```text
GRAFANA_ADMIN_PASSWORD
MYSQL_ROOT_PASSWORD
MINIO_ROOT_USER
MINIO_ROOT_PASSWORD
JWT_ISSUER
```

Do not commit real secrets. Use placeholders in examples.

## Step 2: Create The Compose Network

All services run on the same Compose network so they can reach each other by
service name:

```yaml
networks:
  shopverse:
```

Inside Docker, use service names:

```text
http://config-server:8888
http://discovery-server:8761/eureka
http://zipkin:9411
```

Avoid `localhost` between containers. Inside a container, `localhost` means the
same container.

## Step 3: Add Persistent Volumes

Use named volumes for data that should survive container recreation:

```yaml
volumes:
  mysql-data:
  kafka-data:
  grafana-data:
  prometheus-data:
  loki-data:
```

Use bind mounts for source-controlled configuration:

```yaml
volumes:
  - ./cloud-configs:/config:ro
  - ./observability/prometheus-docker.yml:/etc/prometheus/prometheus.yml:ro
```

## Step 4: Start Infrastructure First

Foundation services should start before business services:

```text
MySQL
Kafka
Config Server
Discovery Server
Observability tools
```

Compose health checks help dependent services wait for usable infrastructure:

```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -fsS http://localhost:8888/actuator/health | grep -q UP"]
  interval: 15s
  timeout: 5s
  retries: 15
  start_period: 90s
```

`depends_on` with health conditions improves startup order, but services still
need normal retry behavior because containers can restart later.

Shopverse also uses Compose profiles so the default local stack stays smaller:

```bash
docker compose up -d
docker compose --profile apps up -d
docker compose --profile assets up -d
docker compose --profile apps --profile assets up -d
docker compose --profile apps --profile observability --profile assets up -d
```

Default Compose starts core infrastructure. Application, observability, and
asset services are opt-in profiles.

## Step 5: Build Spring Boot Images

Shopverse service images use a multi-stage pattern:

```text
JDK build stage -> bootJar -> JRE runtime stage -> non-root user -> actuator health check
```

Useful commands:

```bash
docker compose --profile apps --profile assets config --quiet
docker compose --profile apps --profile assets build
docker compose --profile apps build order-service
```

Use targeted builds while developing one service.

## Step 6: Configure Services Through Config Server

Runtime settings live mostly in `cloud-configs`:

```text
cloud-configs/application.yml
cloud-configs/ORDER-SERVICE.yml
cloud-configs/INVENTORY-SERVICE.yml
cloud-configs/PAYMENT-SERVICE.yml
```

Local service `application.yml` files should stay focused on bootstrap values:

```yaml
spring:
  config:
    import: optional:configserver:${CONFIG_SERVER_URL}
```

This keeps service images reusable while Compose supplies environment-specific
values.

## Step 7: Add Health Checks

Every Spring Boot service should expose and use:

```text
/actuator/health
```

Compose health checks make failures visible:

```bash
docker compose ps
```

They also help operators identify whether a service is starting, unhealthy, or
ready.

## Step 8: Add Logs And Observability Volumes

Services write structured logs to stdout and `/app/logs`. Promtail reads those
logs and sends them to Loki. Prometheus scrapes `/actuator/prometheus`.

Observability containers:

```text
prometheus
loki
promtail
zipkin
grafana
```

Start only the observability tools when needed:

```bash
docker compose up -d prometheus loki promtail zipkin grafana
```

## Step 9: Run The Stack

Normal local startup:

```bash
docker compose up -d
docker compose ps
```

Follow bounded logs:

```bash
docker compose logs --tail=200 order-service
docker compose logs -f --tail=100 api-gateway
```

Stop while preserving volumes:

```bash
docker compose down
```

Delete volumes only when intentionally resetting local state:

```bash
docker compose down -v
```

## Step 10: Verify Local Environment

Verification checklist:

1. `docker compose config` succeeds.
2. Infrastructure containers are healthy.
3. Config Server health returns `UP`.
4. Discovery Server health returns `UP`.
5. Business services register with Eureka.
6. API Gateway health returns `UP`.
7. Gateway can route to Auth and Order APIs.
8. MySQL schemas and Liquibase migrations are applied.
9. Kafka topics exist or are created by the services.
10. Grafana, Prometheus, Loki, and Zipkin are reachable when observability is running.

## Related Guides

- [Shopverse Docker implementation](SHOPVERSE-DOCKER.md)
- [Docker](DOCKER.md)
- [Operations cheatsheet](OPERATIONS-CHEATSHEET.md)
- [Complete demo](../case-study/COMPLETE-DEMO.mdx)
- [Observability implementation guide](../observability/OBSERVABILITY-IMPLEMENTATION-GUIDE.md)
