---
title: API Gateway Implementation Guide
sidebar_position: 9
---

# API Gateway Implementation Guide

This guide explains how the Shopverse API Gateway is implemented. For general
gateway concepts, see [API Gateway](API-GATEWAY-GENERIC.md). For advanced
Spring Cloud Gateway behavior, see [Spring Cloud Gateway advanced](SPRING-CLOUD-GATEWAY-ADVANCED.md).

## Shopverse Gateway Stack

| Component | Role |
|---|---|
| Spring Cloud Gateway Server WebFlux | Reactive edge router. |
| Eureka client | Discovers backend service instances. |
| Spring Cloud LoadBalancer | Resolves `lb://SERVICE-NAME` routes. |
| Spring Security OAuth2 Resource Server | Validates JWT bearer tokens. |
| Resilience4j | Adds selected circuit breaker/retry behavior. |
| Micrometer | Emits gateway request metrics. |
| Correlation filter | Accepts or creates `X-Correlation-Id` and forwards it downstream. |

The gateway is the external entry point, but downstream services still validate
tokens and enforce domain authorization.

![Animated Shopverse API Gateway request flow showing correlation ID handling, security validation, route resolution, Eureka lookup, and downstream service forwarding](/img/diagrams/shopverse-gateway-animated.gif)

## Step 1: Add Gateway Dependencies

Core dependencies:

```gradle
implementation 'org.springframework.boot:spring-boot-starter-webflux'
implementation 'org.springframework.cloud:spring-cloud-starter-gateway-server-webflux'
implementation 'org.springframework.cloud:spring-cloud-starter-netflix-eureka-client'
implementation 'org.springframework.boot:spring-boot-starter-security'
implementation 'org.springframework.boot:spring-boot-starter-oauth2-resource-server'
implementation 'org.springframework.boot:spring-boot-starter-actuator'
runtimeOnly 'io.micrometer:micrometer-registry-prometheus'
```

Add circuit breaker dependencies only for routes that need bounded retries or
fallback behavior.

## Step 2: Register With Discovery

The gateway registers with Eureka and resolves backend services by logical
name:

```yaml
eureka:
  client:
    service-url:
      defaultZone: ${EUREKA_CLIENT_SERVICEURL_DEFAULTZONE}
```

Routes should point to service IDs:

```yaml
uri: lb://ORDER-SERVICE
```

This keeps route configuration independent of individual container IPs.

## Step 3: Configure Routes

Each route needs an ID, path predicate, and destination:

```yaml
spring:
  cloud:
    gateway:
      server:
        webflux:
          routes:
            - id: order-service
              uri: lb://ORDER-SERVICE
              predicates:
                - Path=/api/v1/orders/**
```

Keep route ownership simple:

| Path | Owning service |
|---|---|
| `/auth/**` | Auth Service |
| `/api/v1/users/**` | User Service |
| `/api/v1/orders/**` | Order Service |
| `/api/v1/inventory/**` | Inventory Service |
| `/api/v1/payments/**` | Payment Service |

## Step 4: Validate JWTs At The Edge

The gateway validates bearer tokens so invalid requests are rejected early:

```java
@Bean
SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
    return http
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
            .authorizeExchange(exchanges -> exchanges
                    .pathMatchers("/actuator/health", "/actuator/prometheus").permitAll()
                    .pathMatchers("/auth/**").permitAll()
                    .anyExchange().authenticated()
            )
            .build();
}
```

Gateway security is not the only security boundary. Resource services must also
validate JWTs.

## Step 5: Add Correlation ID Handling

The gateway accepts `X-Correlation-Id` when supplied, or creates one when it is
missing. It should:

1. place the value in request logs;
2. forward it to downstream services;
3. return it in the response header;
4. avoid trusting unrelated identity headers from clients.

Example behavior:

```text
incoming request without X-Correlation-Id
  -> gateway creates correlation ID
  -> forwards header to Order Service
  -> response includes same header
```

## Step 6: Add Gateway Metrics And Logs

Gateway request logging should skip noisy actuator traffic and record bounded
fields:

```text
method
path template or route
status
outcome
correlationId
duration
```

Metrics should avoid raw paths when they contain identifiers. Use route IDs or
known URI templates to prevent high-cardinality time series.

Useful PromQL:

```promql
sum(rate(shopverse_gateway_requests_logged_total[5m])) by (method, outcome)
```

## Step 7: Add Resilience Carefully

Gateway retries should be limited:

- retry only safe or idempotent requests;
- avoid retrying validation or authentication failures;
- keep retry time inside the client deadline;
- avoid multiplying retries with service-level retries.

Prefer explicit fallbacks for known dependency failures rather than hiding
unknown errors.

## Step 8: Expose Operational Endpoints

Expose only the actuator endpoints needed by health checks and Prometheus:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus
```

The gateway should be visible in Prometheus and Grafana like any other service.

## Step 9: Verify Routing

Verification checklist:

1. Gateway health endpoint returns `UP`.
2. Gateway is registered in Eureka.
3. Route config points to `lb://` service names.
4. Public auth endpoints work without a JWT.
5. Protected APIs reject missing or invalid JWTs.
6. Protected APIs work with a valid JWT.
7. `X-Correlation-Id` is returned and appears in downstream logs.
8. Gateway metrics appear in `/actuator/prometheus`.
9. Direct service access still validates authorization.

## Related Guides

- [API Gateway](API-GATEWAY-GENERIC.md)
- [Spring Cloud Gateway advanced](SPRING-CLOUD-GATEWAY-ADVANCED.md)
- [Security implementation guide](../security/SECURITY-IMPLEMENTATION-GUIDE.md)
- [MDC, correlation IDs, and tracing](../observability/MDC-CORRELATION-TRACING.md)
- [Micrometer metrics](../observability/MICROMETER-METRICS.md)
