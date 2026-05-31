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
| `GET` | `/auth/login` | Authenticate and return JWT |
| `GET` | `/auth/.well-known/jwks.json` | Public JWKS keys |
| `GET` | `/auth/verify` | Simple protected verification endpoint |
| `GET` | `/actuator/health` | Service health |
| `GET` | `/actuator/prometheus` | Prometheus metrics |

## Login Example

```powershell
curl -X GET http://localhost:8081/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"username\":\"admin\",\"password\":\"Admin@123\"}"
```

## Docker

From the root project:

```powershell
docker compose build security-service
docker compose up -d security-service
docker compose logs -f security-service
```

The full stack is started from the root:

```powershell
docker compose up -d
```

## Observability

- Logs are written to `/app/logs/security-service.log`.
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
