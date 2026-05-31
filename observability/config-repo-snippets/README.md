# Config Repo Snippets

Copy these files into the centralized Spring Cloud Config repository:

```text
https://github.com/taukhir/spring-cloud-configs
```

## Recommended Files

Add `application.yaml` to the config repo for shared observability settings across all config clients.

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
ORDER-SERVICE.yaml
USER-SERVICE.yaml
AUTH-SERVICE.yaml
API-GATEWAY.yaml
```

Example:

```yaml
management:
  tracing:
    sampling:
      probability: 0.25
```
