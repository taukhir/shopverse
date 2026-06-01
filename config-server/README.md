# Shopverse Config Server

Config Server centralizes Shopverse runtime configuration. It loads service config from the root `cloud-configs/` folder and serves it to config clients at startup.

## Responsibilities

- Run Spring Cloud Config Server on port `8888`.
- Read centralized config from `cloud-configs/` through the Spring Cloud Config native backend.
- Serve common and service-specific YAML properties.
- Expose health and Prometheus metrics.
- Emit startup and request logs for centralized logging.

## Port

```text
8888
```

## Useful URLs

```powershell
curl http://localhost:8888/actuator/health
curl http://localhost:8888/actuator/prometheus
curl http://localhost:8888/USER-SERVICE/default
curl http://localhost:8888/ORDER-SERVICE/default
```

## Docker

From the root project:

```powershell
docker compose build config-server
docker compose up -d config-server
docker compose logs -f config-server
```

In Docker Compose, `./cloud-configs` is mounted into the container as `/config` and Config Server is started with:

```text
SPRING_PROFILES_ACTIVE=native
CONFIG_SEARCH_LOCATIONS=file:/config
```

The full stack is started from the root:

```powershell
docker compose up -d
```

## Observability

- Logs are written to `/app/logs/config-server.log`.
- Prometheus scrapes `/actuator/prometheus`.
- Prometheus includes standard JVM/process/HTTP metrics.
- Grafana Loki query:

```logql
{application="config-server"}
```

## Notes

- Docker does not need internet access for runtime config because the config folder is mounted locally.
- Config Server can provide runtime properties, but it cannot provide Gradle dependencies.
