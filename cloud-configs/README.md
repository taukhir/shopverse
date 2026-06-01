# Shopverse Cloud Configs

This folder is the centralized configuration source for the Shopverse POC.

The Config Server runs with the Spring Cloud Config native backend and reads these files:

```text
application.yml
API-GATEWAY.yml
AUTH-SERVICE.yml
USER-SERVICE.yml
ORDER-SERVICE.yml
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
- Actuator exposure for `health`, `info`, `prometheus`, and `refresh`
- Prometheus metric tags
- Micrometer tracing and Zipkin export
- log file and trace/span correlation pattern

Service-specific files override or add settings for individual services.
