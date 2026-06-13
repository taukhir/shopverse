# User Service

User Service runs on port `8082`. It owns users, roles, permissions, database-backed authentication, and permission-level administration.

## Security Chains

The service intentionally defines two ordered filter chains:

1. internal Basic authentication for `/api/v1/internal/users/**`;
2. JWT Resource Server security for public and administrative APIs.

The internal endpoint supports Auth Service credential validation. Public APIs use bearer JWTs. The JWT decoder verifies the JWKS signature, timestamps, and issuer `shopverse-auth-service`.

## APIs

| Area | Base path | Security |
|---|---|---|
| health | `/api/v1/public/health` | public |
| internal authentication | `/api/v1/internal/users/authenticated` | internal Basic |
| users | `/api/v1/users` | permission authorities |
| roles | `/api/v1/roles` | `ADMIN_ACCESS` |
| permissions | `/api/v1/permissions` | `ADMIN_ACCESS` |

User authorities:

| Operation | Authority |
|---|---|
| list/read | `USER_READ` |
| create | `USER_CREATE` |
| update/password change | `USER_UPDATE` |
| delete | `USER_DELETE` |

Swagger is available at `/swagger-ui/index.html`; use the **Authorize** action with `Bearer <token>`.

## Persistence

Liquibase creates users, roles, permissions, join tables, refresh-token/audit support tables, and bootstrap data. `UserRepository` and `RoleRepository` use `@EntityGraph` to load roles and permissions without an N+1 query sequence.

`DatabaseUserDetailsService` adapts the User repository model to Spring Security's `UserDetailsService` contract. BCrypt compares the supplied password with the stored hash.

## Caching And Resilience

Role and permission lookups use `ConcurrentMapCacheManager`. This is a local cache, not Redis. Mutations evict the related caches.

`UserController` uses annotation-based RateLimiter and semaphore Bulkhead. Lookup operations use a bounded Retry.

## Configuration

`cloud-configs/USER-SERVICE.yml` defines datasource, security, management, resilience, bootstrap, and service settings. Environment variables override values; YAML defaults support local POC startup.

Do not commit `.env`. In production, use a secret manager and replace internal Basic authentication with workload identity or mTLS.

## Tests

Controller tests demonstrate request mapping and validation. Service tests cover
password, lookup, role, permission, and audit behavior. Dedicated method-security
tests should be added for permission allow/deny cases; the standalone MockMvc
controller test does not load the Spring Security filter chain.

## Run

```powershell
./gradlew test
./gradlew bootRun
```

```powershell
docker compose build user-service
docker compose up -d user-service
```

## Related Guides

- [JWT and Spring Security](../docs/security/JWT-OAUTH2-SPRING-SECURITY.md)
- [Generic Spring Security](../docs/security/SPRING-SECURITY-GENERIC.md)
- [Liquibase](../docs/data/LIQUIBASE-GENERIC.md)
- [Shopverse Resilience4j](../docs/reliability/RESILIENCE4J.md)
- [Generic Resilience4j patterns](../docs/reliability/RESILIENCE4J-GENERIC.md)
- [Spring Resilience4j](../docs/spring/SPRING-RESILIENCE4J.md)
- [Spring Boot testing](../docs/spring/SPRING-BOOT-TESTING.md)
- [Shopverse testing strategy](../docs/development/TESTING.md)
