---
title: Observability Starter
status: "maintained"
last_reviewed: "2026-07-13"
---

# Observability Starter

Back to [Platform Infrastructure](./README.md).

## Status

Implemented for servlet services.

## Purpose

Use `shopverse-observability-starter` to share servlet request correlation,
MDC population, request logging, actuator-path exclusion, response correlation
headers, and request logging metrics.

## Problem

Servlet services repeated request logging filters with the same correlation
header extraction, MDC population, actuator exclusion, request metrics, and
response header propagation.

## When To Use

Use this starter in Spring MVC or servlet-based Spring Boot services.

Do not use it in `api-gateway`. The gateway uses Spring WebFlux, and this
starter registers a servlet `OncePerRequestFilter`.

## Solution

`shopverse-observability-starter` provides:

- `CorrelationConstants`
- `CorrelationContext`
- `ShopverseRequestLoggingFilter`
- `ShopverseObservabilityAutoConfiguration`
- `ShopverseObservabilityProperties`

## Used By

- `user-service`
- `order-service`
- `payment-service`
- `inventory-service`
- `auth-service`
- `config-server`
- `discovery-server`

## Service-Owned Code

`api-gateway` is reactive and remains local. Gateway observability should use a
WebFlux-specific implementation if it is extracted later.

## Gradle Dependency

```groovy
dependencies {
    implementation 'io.shopverse.platform:shopverse-observability-starter:0.0.1-SNAPSHOT'
}
```

## Configuration Properties

Prefix:

```yaml
shopverse:
  observability:
    request-logging:
```

| Property | Default | Purpose |
|---|---|---|
| `enabled` | `true` | Enables the servlet request logging filter. |
| `service-name` | `spring.application.name`, fallback `UNKNOWN-SERVICE` | Service tag used in logs and metrics. |
| `metric-name` | `shopverse.service.requests.logged` | Counter name for logged requests. |
| `actuator-path-prefix` | `/actuator/` | Path prefix excluded from normal request logging. |

## Migration Steps

Add the starter dependency.

```groovy
dependencies {
    implementation 'io.shopverse.platform:shopverse-observability-starter:0.0.1-SNAPSHOT'
}
```

Delete duplicated local servlet filter classes such as:

```text
observability/CorrelationConstants.java
observability/CorrelationContext.java
observability/RequestLoggingFilter.java
```

The starter auto-configures the servlet request logging filter. No service
configuration class is required for the common filter.

Use `CorrelationContext` from the platform module when service code needs to
carry correlation IDs into asynchronous work or message handling.

```java
import io.shopverse.platform.observability.CorrelationContext;

public void onMessage(OrderCreatedEvent event) {
    CorrelationContext.run(
            event.correlationId(),
            () -> handleOrderCreated(event)
    );
}
```

When forwarding correlation IDs through clients, import the platform constants
instead of redefining header names.

```java
import io.shopverse.platform.observability.CorrelationConstants;

template.header(
        CorrelationConstants.CORRELATION_ID_HEADER,
        CorrelationContext.currentCorrelationId()
);
```

Do not use this starter in `api-gateway` yet. The current starter is servlet
based, while the gateway runs on Spring WebFlux.

## Verification

Run service tests:

```powershell
.\gradlew.bat test --no-daemon
```

Then start a servlet service and call a non-actuator endpoint:

```powershell
docker compose --profile apps up -d order-service
curl.exe -i http://localhost:8083/actuator/health
```

Check that actuator health is not logged as a normal application request, and
that normal API responses include the correlation header.

## Troubleshooting

| Symptom | Check |
|---|---|
| No request logs | `shopverse.observability.request-logging.enabled` may be false, or the service may not be servlet-based. |
| Missing correlation ID in logs | Confirm the service imports platform `CorrelationContext` and does not clear MDC early. |
| Gateway fails on startup | Remove this servlet starter from `api-gateway`; use a WebFlux implementation there. |
| Actuator paths are noisy | Check `actuator-path-prefix` matches the service actuator path. |

## Related Docs

- [Config Property Reference](./CONFIG-PROPERTIES.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Structured Logging](../observability/STRUCTURED-LOGGING.md)
