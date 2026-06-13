# Config Repo Snippets

These snippets are examples only. The active centralized configuration is under [`cloud-configs`](../../cloud-configs/README.md), and the canonical observability concepts are under [`docs/observability`](../../docs/README.md).

These snippets show the shared observability properties that belong in centralized Spring Cloud Config.

```text
cloud-configs/application.yml
```

## Recommended Files

Add the shared properties to `cloud-configs/application.yml` for all config clients.

The shared config enables:

- `/actuator/prometheus`
- Prometheus `application` metric tag
- Zipkin trace export
- trace/span correlation in logs
- local service log files for Promtail
- Kafka bootstrap and SAGA topic names when services use the choreography SAGA

`/actuator/refresh` is intentionally **not** exposed by the shared
`application.yml`. It is enabled only in the JWT-secured Auth, User, Order,
Payment, and Inventory service files. Config Server, Discovery Server, and API
Gateway do not inherit a public refresh endpoint.

## Important

The Spring Boot services must still keep the dependency changes in this application repo:

```gradle
runtimeOnly 'io.micrometer:micrometer-registry-prometheus'
implementation 'org.springframework.boot:spring-boot-starter-zipkin'
implementation 'org.springframework.boot:spring-boot-starter-kafka'
```

Config Server can only provide properties. It cannot add runtime libraries to a service.

## Optional Service Overrides

If a service needs a different value, add it to that service's own config file in the config repo, for example:

```text
ORDER-SERVICE.yml
PAYMENT-SERVICE.yml
INVENTORY-SERVICE.yml
USER-SERVICE.yml
AUTH-SERVICE.yml
API-GATEWAY.yml
DISCOVERY-SERVER.yml
```

Example:

```yaml
management:
  tracing:
    sampling:
      probability: 0.25
```
