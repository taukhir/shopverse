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
| `/api/v1/users/**`, `/api/v1/cart/**`, `/api/v1/roles/**`, `/api/v1/permissions/**`, `/api/v1/admin/**` | User Service |
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

Use `GET /actuator/shopverse-readiness` for the Shopverse dependency check. It
verifies required Eureka registrations, configured route IDs, catalog reachability,
and the optional MinIO object boundary. A healthy gateway process is not sufficient
evidence that the storefront journey is ready.

## Failure And Security Boundaries

- The default retry applies only to `GET`; never retry checkout, payment, or other
  mutation requests at the gateway without an idempotency contract.
- Circuit-breaker fallback must return an explicit unavailable response and must
  not fabricate a successful downstream result.
- Public route configuration is an edge policy. Every downstream service still
  validates JWT authorities and resource ownership.
- Keep `/api/v1/internal/**` outside gateway routing.
- Diagnose failures in this order: readiness result, route ID, Eureka instance,
  downstream health, JWT/JWKS validation, then timeout/circuit-breaker metrics.

## Run

```powershell
./gradlew bootRun
```

```powershell
docker compose build api-gateway
docker compose up -d api-gateway
```

## AI-Assisted Development

This module has scoped [`AGENTS.md`](AGENTS.md) guidance imported by
[`CLAUDE.md`](CLAUDE.md). AI tools can help trace routes and filter order, review JWT and correlation
propagation, diagnose discovery/load-balancing failures, inspect reactive latency,
and generate focused gateway tests. Start with the repository
[`AGENTS.md`](../AGENTS.md) and use these reviewed workflows:

- [Implement a bounded feature](../ai-workflows/prompts/implement-feature.md)
- [Security review](../ai-workflows/prompts/security-review.md)
- [Optimize performance](../ai-workflows/prompts/optimize-performance.md)
- [Incident investigation](../ai-workflows/prompts/incident-investigation.md)

Keep route configuration, gateway code, and downstream authorization boundaries
distinct. AI must not expose internal-only routes, weaken JWT validation, log
tokens, or treat edge authentication as a replacement for service ownership
checks. Validate focused tests and the complete gateway Gradle test suite.

The deterministic evaluation suite includes gateway route exposure, JWT,
non-blocking filter, retry, and dependency-readiness review.

## Related Guides

- [System design](../documentation/docs/architecture/SYSTEM-DESIGN.md)
- [Spring Boot internals](../documentation/docs/development/SPRING-BOOT-INTERNALS.md)
- [API Gateway concepts and filter chain](../documentation/docs/development/API-GATEWAY-GENERIC.md)
- [Service discovery](../documentation/docs/architecture/SERVICE-DISCOVERY.md)
- [Load balancing](../documentation/docs/architecture/LOAD-BALANCING-GENERIC.md)
- [JWT and Spring Security](../documentation/docs/security/JWT-OAUTH2-SPRING-SECURITY.md)
- [Generic Spring Security](../documentation/docs/security/SPRING-SECURITY-GENERIC.md)
- [MDC and tracing](../documentation/docs/observability/MDC-CORRELATION-TRACING.md)
