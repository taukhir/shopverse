# Auth Service

Auth Service runs on port `8081`. It authenticates credentials through User Service, issues RSA-signed JWT access tokens, and exposes the public JWKS used by resource services.

## APIs

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/auth/login` | authenticate username/password and issue JWT |
| `GET` | `/auth/.well-known/jwks.json` | publish the RSA public key set |
| `GET` | `/actuator/health` | runtime health |
| `GET` | `/actuator/prometheus` | Prometheus metrics |

Login request:

```json
{
  "username": "admin",
  "password": "<password>"
}
```

## Authentication Flow

1. Auth Service receives validated credentials.
2. its Feign client calls `/api/v1/internal/users/authenticated` on `USER-SERVICE`.
3. an interceptor supplies internal Basic authentication.
4. User Service loads the database user, roles, and permissions and verifies BCrypt credentials.
5. Auth Service creates claims and signs the JWT through `JwtEncoder`.

The token contains issuer, subject, issue/expiry time, ID, roles, and permissions. The issuer is `shopverse-auth-service`.

## Feign And Tracing

The client uses the Eureka name `USER-SERVICE`. Spring Cloud LoadBalancer chooses an instance. `FeignCorrelationConfig` forwards `X-Correlation-Id`; Micrometer instrumentation propagates trace headers.

See:

- [Feign clients](../docs/integration/FEIGN-CLIENTS.md)
- [JWT and Spring Security](../docs/security/JWT-OAUTH2-SPRING-SECURITY.md)
- [MDC and tracing](../docs/observability/MDC-CORRELATION-TRACING.md)

## Configuration

Runtime configuration comes from `cloud-configs/AUTH-SERVICE.yml` through Config Server. Important environment values include RSA key material/path, JWT issuer, internal User Service credentials, Eureka URL, Zipkin endpoint, and log path.

Real credentials and private keys must not be committed. Local POC values may be supplied through `.env`.

## Run

```powershell
./gradlew bootRun
```

```powershell
docker compose build auth-service
docker compose up -d auth-service
```

## Notes

Shopverse uses JWT bearer tokens and Resource Server validation. This service is not a complete OAuth2 Authorization Server and does not currently issue refresh tokens.
