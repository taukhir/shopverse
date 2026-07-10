# API Gateway

API Gateway runs on port `8080` and is the normal client entry point.

## Responsibilities

- route requests by service path;
- resolve `lb://SERVICE-NAME` destinations through Eureka and Spring Cloud LoadBalancer;
- enforce public/protected path policy;
- validate bearer JWT signature, timestamps, and issuer for protected routes;
- propagate correlation and trace context;
- emit gateway request logs and Micrometer metrics.

## Routes

| Prefix | Destination |
|---|---|
| `/auth/**` | Auth Service |
| `/api/v1/users/**`, `/api/v1/roles/**`, `/api/v1/permissions/**` | User Service |
| `/api/v1/orders/**` | Order Service |
| `/api/v1/payments/**` | Payment Service |
| `/api/v1/inventory/**` | Inventory Service |

Exact route and public-path configuration is centralized in `cloud-configs/API-GATEWAY.yml`.

## Request Context

The gateway accepts or creates `X-Correlation-Id`, returns it to the caller, and forwards it downstream. Micrometer handles W3C trace propagation independently.

Gateway logging is reactive; completion logging occurs when the downstream publisher terminates. Avoid blocking code in gateway filters.

For generic API Gateway concepts and the complete Shopverse request lifecycle,
including `GatewayFilterChain`, `chain.filter(...)`, `doFinally(...)`,
correlation handling, timing, metrics, and production practices, see
[API Gateway](../documentation/docs/development/API-GATEWAY-GENERIC.md).

## Configuration

Routes, JWT validation, actuator exposure, resilience, tracing, and logging are
centralized in `cloud-configs/API-GATEWAY.yml`.

## OpenAPI

The gateway does not currently aggregate downstream OpenAPI documents. Use the
service-level Swagger UI on servlet services when running them directly, or use
the [API guide](../documentation/docs/development/API-GUIDE.md) for the gateway
entry-point catalog.

## Tests And Observability

```powershell
./gradlew test
```

Prometheus scrapes `/actuator/prometheus`. Application logs are shipped to Loki
and can be queried with:

```logql
{log_type="application", application="API-GATEWAY"}
```

## Run

```powershell
./gradlew bootRun
```

```powershell
docker compose build api-gateway
docker compose up -d api-gateway
```

## Related Guides

- [System design](../documentation/docs/architecture/SYSTEM-DESIGN.md)
- [Spring Boot internals](../documentation/docs/development/SPRING-BOOT-INTERNALS.md)
- [API Gateway concepts and filter chain](../documentation/docs/development/API-GATEWAY-GENERIC.md)
- [Service discovery](../documentation/docs/architecture/SERVICE-DISCOVERY.md)
- [Load balancing](../documentation/docs/architecture/LOAD-BALANCING-GENERIC.md)
- [JWT and Spring Security](../documentation/docs/security/JWT-OAUTH2-SPRING-SECURITY.md)
- [Generic Spring Security](../documentation/docs/security/SPRING-SECURITY-GENERIC.md)
- [MDC and tracing](../documentation/docs/observability/MDC-CORRELATION-TRACING.md)
