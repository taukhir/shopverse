# Shopverse API Gateway

API Gateway is the public reactive entry point. It loads routes from Config
Server, discovers instances through Eureka, balances traffic, validates JWTs,
applies downstream resilience, and propagates observability context.

## Routes

| Path | Target |
| --- | --- |
| `/auth/**` | `AUTH-SERVICE` |
| `/api/v1/users/**` | `USER-SERVICE` |
| `/api/v1/roles/**` | `USER-SERVICE` |
| `/api/v1/permissions/**` | `USER-SERVICE` |
| `/api/v1/orders/**` | `ORDER-SERVICE` |
| `/api/v1/payments/**` | `PAYMENT-SERVICE` |
| `/api/v1/inventory/**` | `INVENTORY-SERVICE` |

Internal User Service authentication endpoints are intentionally not routed.
Auth Service reaches them directly through OpenFeign.

## Load-Balanced Routing

Routes are centralized in `cloud-configs/API-GATEWAY.yml`:

```yaml
- id: order-service
  uri: lb://ORDER-SERVICE
  predicates:
    - Path=/api/v1/orders/**
```

The `lb://` URI asks Spring Cloud LoadBalancer for instances supplied by
Eureka. No service host or port is hardcoded.

## Security

The Gateway is a reactive OAuth2 resource server. It allows `/auth/**`,
`/api/v1/*/public/**`, and selected Actuator endpoints. Other requests require
a bearer JWT. Public keys are loaded from Auth Service's JWKS endpoint.

Backend services validate the JWT again. Gateway validation protects the edge;
service validation preserves zero-trust boundaries when a service is reached
without the Gateway.

## Resilience

Global Gateway filters protect downstream calls:

```yaml
default-filters:
  - name: CircuitBreaker
    args:
      name: gateway-downstream
  - name: Retry
    args:
      retries: 2
      methods: GET
```

Retries are restricted to GET. Retrying checkout, payment, or other writes
without idempotency controls can duplicate state changes.

Service-level Resilience4j annotations still protect business boundaries:
Gateway resilience handles route failures; service resilience handles local
concurrency and specific downstream clients.

## Correlation And Tracing

`GatewayRequestLoggingFilter` accepts or generates `X-Correlation-Id`, returns
it to the client, and forwards it:

```java
ServerWebExchange correlatedExchange = exchange.mutate()
        .request(request -> request.headers(headers ->
                headers.set("X-Correlation-Id", correlationId)))
        .build();
```

Micrometer/Brave independently propagates W3C `traceparent`. The trace ID
describes one technical execution; the correlation ID describes the business
operation.

Logs are structured JSON:

```logql
{application="API-GATEWAY"} | json
```

## Run

```powershell
docker compose build api-gateway
docker compose up -d api-gateway
docker compose logs -f api-gateway
```

Health: `http://localhost:8080/actuator/health`

See [Observability](../observability/README.md), [Cloud Config](../cloud-configs/README.md), and [Docker](../docker/README.md).
