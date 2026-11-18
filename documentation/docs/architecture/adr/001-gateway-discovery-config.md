---
title: "ADR 001: API Gateway, Service Discovery, And Centralized Configuration"
status: maintained
last_reviewed: "2026-11-17"
page_type: Guide
difficulty: Intermediate
scope: shopverse
owner: docs-architecture
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# ADR 001: API Gateway, Service Discovery, And Centralized Configuration

## Context

Shopverse is eight independently deployable services (`services/*`). Three
cross-cutting problems exist before any business logic can run:

- A client should not need to know which host/port each of the six backend
  services (order, inventory, payment, user, auth, plus future services)
  currently runs on, and that address can change across restarts/replicas.
- Every service needs the same environment-specific properties (Kafka
  bootstrap servers, tracing export target, management-endpoint exposure)
  without baking them into each service's own artifact.
- Public and authenticated traffic need one enforcement point for
  "has a valid token" before it reaches a service, without every service
  reimplementing edge concerns like retries against a flaky downstream.

## Decision

Eureka for discovery, Spring Cloud Config Server for centralized
configuration, and a reactive Spring Cloud Gateway as the single HTTP entry
point — each service still enforces its own authorization at its own trust
boundary (per this repository's invariant that API Gateway auth is not a
substitute for service-level ownership checks).

**Discovery.** `discovery-server` runs a standalone Eureka server
(`DiscoveryServerApplication`, `infra/cloud-configs` port `8761`) with
`register-with-eureka: false`/`fetch-registry: false` on the server itself.
Every other service registers under its logical name and calls peers
through that name — for example `inventory-service` is called as
`lb://INVENTORY-SERVICE`, resolved by the gateway's load balancer, not a
hard-coded host.

**Configuration.** `config-server` fronts `infra/cloud-configs/`:
`application.yml` holds properties every service shares (Kafka topic names,
`management.tracing`, structured-logging format); each uppercase file
(`API-GATEWAY.yml`, etc.) holds that one service's overrides. Per this
directory's own `AGENTS.md`, route, actuator, JWT/JWKS, datasource, Kafka,
retry, timeout, and consumer-group changes in these files are treated as
contract changes, not routine config edits.

**Gateway.** `api-gateway`'s routes are declarative, not a Java
`RouteLocator` bean — defined in `infra/cloud-configs/API-GATEWAY.yml`:

```yaml
spring:
  cloud:
    gateway:
      server:
        webflux:
          default-filters:
            - name: CircuitBreaker
              args: { name: gateway-downstream }
            - name: Retry
              args: { retries: 2, methods: [GET], statuses: [BAD_GATEWAY, SERVICE_UNAVAILABLE, GATEWAY_TIMEOUT] }
          routes:
            - id: order-service
              uri: lb://ORDER-SERVICE
              predicates: [ "Path=/api/v1/orders/**" ]
            # inventory-service, payment-service, auth-service, user-service follow the same shape
```

Every route gets the same `CircuitBreaker` + bounded `Retry` (2 attempts,
`GET` only, on `502`/`503`/`504`) as a default filter — a per-route opt-out
would be the exception, not something each route declares individually.

The gateway's own `SecurityConfig`
(`services/api-gateway/src/main/java/io/shopverse/gateway/config/SecurityConfig.java`)
is where authentication is actually enforced: it builds a
`NimbusReactiveJwtDecoder` against the auth-service JWKS endpoint, validates
issuer via `JwtValidators.createDefaultWithIssuer(...)`, permits
`/auth/**`, `/api/v1/*/public/**`, and the actuator health/info/prometheus/
readiness paths, and requires authentication on everything else. It does
**not** evaluate roles, permissions, or resource ownership — those checks
happen downstream in each service's own `@PreAuthorize` rules, which is the
deliberate split: the gateway proves *who* the caller is; each service
decides *what that caller may do to its own data*.

## Options Considered

**Hard-coded service URLs instead of Eureka.** Rejected outright — any
service restart or replica change would require redeploying every caller's
configuration. Not evaluated further; the cost of this is immediate at even
small scale.

**Gateway-side authorization (roles/ownership) instead of per-service.**
Would reduce duplicate `@PreAuthorize` logic, but violates this
repository's "each service owns its data" invariant and would let one
misconfigured gateway rule silently open every service's data. Rejected —
the gateway stays an authentication boundary only, not an authorization
boundary.

**Spring Cloud Gateway MVC (servlet) instead of WebFlux.** The gateway is
reactive specifically because it is a thin I/O-bound proxy with no business
logic of its own — the case reactive stacks are actually good at, unlike
the services behind it (see
[MVC Versus WebFlux](../../spring/decisions/MVC-VS-WEBFLUX.md) for when
that tradeoff flips). Kept as WebFlux.

## Consequences

- A service outage shows up as `CircuitBreaker` open + bounded `Retry`
  exhaustion at the gateway, not an unbounded hang — but the circuit's
  `sliding-window-size: 20` / `failure-rate-threshold: 50` is shared across
  **all** downstream routes via one `gateway-downstream` instance name, so a
  struggling inventory-service can trip the same breaker state that
  order-service traffic reads, unless this is split into per-route instance
  names as the service count grows.
- `shopverse.readiness.required-services`/`required-route-ids`
  (`ShopverseReadinessService`) gate the gateway's own readiness probe on
  Eureka registration, so a half-started stack fails readiness visibly
  instead of silently routing into services that aren't up yet.
- Config Server changes to Kafka topics, datasources, or JWT/JWKS settings
  need the affected-service list, effective-value verification, and
  rollback plan `infra/cloud-configs/AGENTS.md` requires — these are not
  low-risk YAML edits even though they look like simple property files.
- `/api/v1/internal/**` is deliberately excluded from gateway routes
  (service-to-service traffic only) — a route added carelessly for a new
  service could accidentally expose internal-only endpoints publicly.

## Related Documentation

- [ADR 003: JWT And JWKS Authentication](003-jwt-jwks-security.md)
- [Service Discovery](../SERVICE-DISCOVERY.md)
- [Resilience4j Composition And Operations](../../reliability/RESILIENCE4J-COMPOSITION-OPERATIONS.md)
