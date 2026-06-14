# Shopverse Config Server

Cross-cutting architecture and service ownership are documented in the [Shopverse documentation index](../documentation/docs/README.mdx). This README remains focused on Config Server operation and refresh behavior.

Config Server centralizes Shopverse runtime configuration. It loads service config from the root `cloud-configs/` folder and serves it to config clients at startup.

## Why Centralized Config Helps

In a microservices system, each service needs settings such as ports, database URLs, Eureka URLs, tracing endpoints, log levels, JWT/JWK URLs, rate-limit values, and feature flags. Keeping all of that inside every service makes changes slow and error-prone.

Shopverse keeps only minimal bootstrap settings inside each service, such as the application name and Config Server URL. Runtime configuration lives in the centralized `cloud-configs/` folder:

```text
cloud-configs/application.yml        shared defaults for all services
cloud-configs/USER-SERVICE.yml       user-service overrides
cloud-configs/ORDER-SERVICE.yml      order-service overrides
cloud-configs/PAYMENT-SERVICE.yml    payment-service overrides
cloud-configs/INVENTORY-SERVICE.yml  inventory-service overrides
cloud-configs/API-GATEWAY.yml        gateway routes and gateway settings
cloud-configs/AUTH-SERVICE.yml       auth-service settings
cloud-configs/DISCOVERY-SERVER.yml   discovery-server settings
```

This gives us a single place to review and change configuration, keeps service jars/images environment-neutral, and reduces duplicated YAML across services.

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
curl http://localhost:8888/PAYMENT-SERVICE/default
curl http://localhost:8888/INVENTORY-SERVICE/default
```

## How Config Is Loaded

Each service starts with a small local `application.yaml` that points to Config Server:

```yaml
spring:
  application:
    name: USER-SERVICE
  config:
    import: optional:configserver:http://localhost:8888
```

At startup, Spring Boot asks Config Server for:

```text
/{spring.application.name}/{profile}
```

For example:

```text
http://localhost:8888/USER-SERVICE/default
```

Config Server combines shared properties from `application.yml` with service-specific properties from `USER-SERVICE.yml`. Service-specific values override shared defaults.

## Updating Config Without Restarting Services

For many runtime properties, we can update config and refresh a service without rebuilding or restarting the container.

1. Edit the required file in `cloud-configs/`.

   Example:

   ```yaml
   shopverse:
     user-service:
       rate-limit:
         burst-capacity: 200
   ```

2. Confirm Config Server can see the updated value:

   ```powershell
   curl http://localhost:8888/USER-SERVICE/default
   ```

3. Refresh the affected service:

   ```powershell
   curl.exe -X POST http://localhost:8082/actuator/refresh `
     -H "Authorization: Bearer $token"
   ```

4. If more services use that property, refresh each one:

   ```powershell
   curl.exe -X POST http://localhost:8081/actuator/refresh -H "Authorization: Bearer $token"
   curl.exe -X POST http://localhost:8082/actuator/refresh -H "Authorization: Bearer $token"
   curl.exe -X POST http://localhost:8083/actuator/refresh -H "Authorization: Bearer $token"
   curl.exe -X POST http://localhost:8084/actuator/refresh -H "Authorization: Bearer $token"
   curl.exe -X POST http://localhost:8086/actuator/refresh -H "Authorization: Bearer $token"
   ```

The refresh endpoint returns the property keys that changed.

Important notes:

- `/actuator/refresh` is exposed only by the JWT-secured business services. Obtain `$token` from `POST /auth/login` before calling it.
- Refresh works best for Spring-managed configuration, such as `@ConfigurationProperties`, `@Value`, logging levels, and beans using refresh-aware configuration.
- Some values still require a service restart, such as server port, fixed JVM/container environment variables, datasource pool internals, or properties read only once during startup.
- In the current Docker setup, `cloud-configs/` is mounted into Config Server as `/config`, so changing files on the host makes them available to Config Server immediately.
- Without Spring Cloud Bus, refresh is per service instance. If a service has multiple replicas, call `/actuator/refresh` on each replica or add Spring Cloud Bus later.

## Shared Configuration Areas

`cloud-configs/application.yml` contains common settings used across services:

- Eureka client defaults
- Shared actuator exposure for health, info, and Prometheus; refresh is enabled only in secured service-specific configuration
- Micrometer tracing and Zipkin export
- log file path and trace/span correlation pattern
- Kafka bootstrap server
- Kafka topic names for the Order/Inventory/Payment choreography SAGA

Service-specific files keep only overrides such as ports, JWT/JWKS settings, and service-specific values.

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

More Docker commands, flags, Dockerfile details, and the Config Server Compose block explanation are in [../docker/README.md](../docker/README.md).

## Observability

- Logs are written to `/app/logs/config-server.log`.
- Prometheus scrapes `/actuator/prometheus`.
- Prometheus includes standard JVM/process/HTTP metrics.
- Grafana Loki query:

```logql
{application="CONFIG-SERVER"}
```

## Notes

- Docker does not need internet access for runtime config because the config folder is mounted locally.
- Config Server can provide runtime properties, but it cannot provide Gradle dependencies.
