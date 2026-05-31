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

## Observability

- Logs are written to `/app/logs/discovery-server.log`.
- Prometheus scrapes `/actuator/prometheus`.
- Custom request counter: `shopverse_service_requests_logged_total{service="discovery-server"}`.
- Grafana Loki query:

```logql
{application="discovery-server"}
```
