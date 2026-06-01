# Config Repo Snippets

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

## Important

The Spring Boot services must still keep the dependency changes in this application repo:

```gradle
runtimeOnly 'io.micrometer:micrometer-registry-prometheus'
implementation 'org.springframework.boot:spring-boot-starter-zipkin'
```

Config Server can only provide properties. It cannot add runtime libraries to a service.

## Optional Service Overrides

If a service needs a different value, add it to that service's own config file in the config repo, for example:

```text
ORDER-SERVICE.yml
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
