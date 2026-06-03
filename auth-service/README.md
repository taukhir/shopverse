# Shopverse Auth Service

Auth Service authenticates users, issues asymmetric JWTs, and exposes JWKS public keys for resource services.

## Responsibilities

- Authenticate users by loading user details from `USER-SERVICE` through OpenFeign.
- Validate passwords with Spring Security password encoding.
- Issue JWT access tokens signed with an RSA private key.
- Expose public JWKS keys for resource-service JWT validation.
- Register with Eureka as `AUTH-SERVICE`.
- Emit centralized logs, metrics, and traces.

## Port

```text
8081
```

## Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/auth/login` | Authenticate and return JWT |
| `GET` | `/auth/login` | Compatibility login endpoint |
| `GET` | `/auth/.well-known/jwks.json` | Public JWKS keys |
| `GET` | `/auth/verify` | Simple protected verification endpoint |
| `GET` | `/actuator/health` | Service health |
| `GET` | `/actuator/prometheus` | Prometheus metrics |

## Login Example

```powershell
curl.exe -X POST http://localhost:8081/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"username\":\"admin\",\"password\":\"Admin@123\"}"
```

## Feign Client To User Service

Auth Service uses Spring Cloud OpenFeign to call User Service during login. This keeps Auth Service focused on authentication while User Service remains the source of user, role, permission, and password data.

Feign is enabled in `AuthServiceApplication` with:

```java
@EnableFeignClients
```

The actual client is declared as:

```java
@FeignClient(name = "USER-SERVICE")
public interface UserClient {
    @GetMapping("/api/v1/internal/users/username/{username}")
    User loadByUsername(@PathVariable String username);
}
```

Because the Feign client uses `name = "USER-SERVICE"`, Auth Service does not need a hardcoded User Service host and port. Spring Cloud uses Eureka service discovery and load balancing to resolve a running `USER-SERVICE` instance.

### Login Flow

1. Client calls `POST /auth/login`.
2. `AuthService` receives the username and password.
3. `AuthService` calls `UserServiceClient`.
4. `UserServiceClient` delegates to the OpenFeign `UserClient`.
5. `UserClient` calls User Service through `GET /api/v1/internal/users/username/{username}`.
6. Auth Service validates the password.
7. Auth Service signs and returns the JWT.

### Trace Propagation

Auth Service also has a Feign request interceptor in `FeignTracePropagationConfig`.

That interceptor reads the current `traceId` and `spanId` from MDC and forwards them to User Service using:

- W3C `traceparent`
- B3 headers: `X-B3-TraceId`, `X-B3-SpanId`, `X-B3-Sampled`

This helps Zipkin and Loki connect logs from Auth Service and User Service under the same distributed trace when a login request calls both services.

### How To Verify

Start the stack and follow both service logs:

```powershell
docker compose logs -f auth-service user-service
```

Call login:

```powershell
curl.exe -X POST http://localhost:8081/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"username\":\"admin\",\"password\":\"Admin@123\"}"
```

In Loki, query both services together and filter by the trace id from the Auth Service log:

```logql
{application=~"AUTH-SERVICE|USER-SERVICE"} |= "trace-id-here"
```

## Docker

From the root project:

```powershell
docker compose build auth-service
docker compose up -d auth-service
docker compose logs -f auth-service
```

The full stack is started from the root:

```powershell
docker compose up -d
```

More Docker commands, flags, and Dockerfile details are in [../docker/README.md](../docker/README.md).

## Observability

- Logs are written to `/app/logs/auth-service.log`.
- Prometheus scrapes `/actuator/prometheus`.
- Custom request counter: `shopverse_service_requests_logged_total{service="AUTH-SERVICE"}`.
- Zipkin receives request spans.
- Grafana Loki query:

```logql
{application="AUTH-SERVICE"}
```

## Security Notes

- RSA private/public keys are currently bundled for POC use.
- Replace bundled keys with mounted secrets or a secrets manager before production.
- Avoid logging passwords, tokens, private keys, or full authorization headers.
