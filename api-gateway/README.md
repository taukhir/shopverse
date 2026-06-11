# API Gateway

API Gateway runs on port `8080` and is the normal client entry point.

## Responsibilities

- route requests by service path;
- resolve `lb://SERVICE-NAME` destinations through Eureka and Spring Cloud LoadBalancer;
- enforce public/protected path policy;
- validate bearer JWTs for protected routes;
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
[API Gateway](../docs/development/API-GATEWAY-GENERIC.md).

## Run

```powershell
./gradlew bootRun
```

```powershell
docker compose build api-gateway
docker compose up -d api-gateway
```

## Related Guides

- [System design](../docs/architecture/SYSTEM-DESIGN.md)
- [Spring Boot internals](../docs/development/SPRING-BOOT-INTERNALS.md)
- [API Gateway concepts and filter chain](../docs/development/API-GATEWAY-GENERIC.md)
- [Load balancing](../docs/architecture/LOAD-BALANCING-GENERIC.md)
- [JWT and Spring Security](../docs/security/JWT-OAUTH2-SPRING-SECURITY.md)
- [Generic Spring Security](../docs/security/SPRING-SECURITY-GENERIC.md)
- [MDC and tracing](../docs/observability/MDC-CORRELATION-TRACING.md)
