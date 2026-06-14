# Shopverse Cloud Configs

This README is the reference for configuration-source files. System architecture and cross-cutting behavior are documented in [docs](../documentation/docs/README.mdx).

This folder is the centralized configuration source for the Shopverse POC.

The Config Server runs with the Spring Cloud Config native backend and reads these files:

```text
application.yml
API-GATEWAY.yml
AUTH-SERVICE.yml
USER-SERVICE.yml
ORDER-SERVICE.yml
PAYMENT-SERVICE.yml
INVENTORY-SERVICE.yml
DISCOVERY-SERVER.yml
```

Local services keep only bootstrap properties in their own `application.yaml`; shared runtime settings, tracing, logging, discovery, database, and service-specific properties live here.

Docker Compose mounts this folder into Config Server:

```text
./cloud-configs:/config:ro
```

## Main Shared Settings

`application.yml` contains cross-service defaults such as:

- Eureka client defaults
- Kafka bootstrap server and SAGA topic names
- Kafka idempotent producer, `acks=all`, record acknowledgement, and tracing
- Shared actuator exposure for `health`, `info`, and `prometheus`
- Prometheus metric tags
- Java 21 virtual-thread support
- Micrometer/Brave tracing and Zipkin export
- Logstash JSON output, application fields, and rolling log files

Service-specific files override or add settings for individual services.

`refresh` is exposed only in the JWT-secured Auth, User, Order, Payment, and Inventory service configurations. It is not globally exposed on Config Server, Discovery Server, or API Gateway.

## Gateway Route Boundary

`API-GATEWAY.yml` exposes public client routes such as `/auth/**`, `/api/v1/orders/**`, `/api/v1/users/**`, `/api/v1/roles/**`, and `/api/v1/permissions/**`.

Internal User Service routes such as `/api/v1/internal/users/authenticated` are not routed through API Gateway. Auth Service calls that endpoint directly through Eureka/OpenFeign for internal Basic credential validation during login.
