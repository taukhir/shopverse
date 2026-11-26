# User Service

> **Account persistence verification status (2026-11-25):** the web app
> invalidates its address cache and reads the address list back after a save;
> this is not proof that the configured database committed the update.
> BUG-057/058 track DB-backed reload verification and explicit-false
> default-address semantics. BUG-060 tracks authorization freshness after
> role/account changes.

User Service runs on port `8082`. It owns user identity, accounts, customer address books, roles, permissions, groups, and permission-level administration. It still hosts the legacy persisted cart API pending FEAT-AS migration; cart extraction remains a separate task.

## Security Chains

The service intentionally defines two ordered filter chains:

1. internal Basic authentication for `/api/v1/internal/users/**`;
2. JWT Resource Server security for public and administrative APIs.

The internal endpoint supports Auth Service credential validation. Public APIs use bearer JWTs. The JWT decoder verifies the JWKS signature, timestamps, issuer `shopverse-auth-service`, and Redis access-token revocation marker. Revocation lookup fails closed if Redis is unavailable.

## APIs

| Area | Base path | Security |
|---|---|---|
| health | `/api/v1/public/health` | public |
| registration | `/api/v1/public/users/register` | public |
| internal authentication | `/api/v1/internal/users/authenticated` | internal Basic |
| current account | `/api/v1/accounts/current` | `ROLE_CUSTOMER` or `ROLE_ADMIN` |
| account addresses | `/api/v1/accounts/current/addresses` | authenticated owner |
| persisted cart | `/api/v1/cart` | authenticated owner |
| administrative users | `/api/v1/admin/users` | fine-grained user authorities |
| roles | `/api/v1/roles` | `ADMIN_ACCESS` |
| permissions | `/api/v1/permissions` | `ADMIN_ACCESS` |
| groups | `/api/v1/groups` | `ADMIN_ACCESS` |
| admin audit | `/api/v1/admin/audit-events` | `ADMIN_ACCESS` |

Controllers are grouped by responsibility: `controller.account` contains
`AccountController` and `UserAddressController`; `controller.admin` contains
`UserAdminController`, `UserGroupController`, `RoleController`, `PermissionController`, and
`AdminAuditEventController`; `controller.cart`, `controller.internal`, and
`controller.publicapi` contain the cart, internal credential lookup, and public
health/registration endpoints respectively. These are package/controller
boundaries. Canonical paths distinguish account self-service from administration;
legacy `/api/v1/accounts/me/**` and `/api/v1/users/me/**` self-service paths and
`/api/v1/users/**` administrative paths remain temporarily mapped for compatibility.
Profile and administrative partial updates use `PATCH`; full user, address, and
group replacements use `PUT` with complete replacement request DTOs. Roles and
permissions currently expose partial updates with `PATCH` only. Create endpoints
return `201 Created` and a `Location` header; deletes and idempotent relationship
assignment/removal return `204 No Content`. Reads and successful updates return
`200 OK`; missing or non-owned address resources return `404 Not Found`.

The application service layer is grouped by feature (`service.account`,
`service.admin`, `service.identity`, `service.provisioning`, `service.address`,
`service.access`, `service.group`, `service.cart`, `service.audit`,
`service.credentials`, and `service.lookup`). Account profile changes,
administrative user management, identity lookup, and shared user provisioning
are separate use cases. Shared persistence entities and request/response types
remain in `entities`, `model`, and `dto` because multiple features use them.
There is no remaining implementation under the legacy `service.impl` package;
the empty directory may still appear in a local checkout but is not a code
package. This feature organization is source-verified; automated tests are
tracked separately below.

User authorities:

| Operation | Authority |
|---|---|
| list/read | `USER_READ` |
| create | `USER_CREATE` |
| update/password change | `USER_UPDATE` |
| delete | `USER_DELETE` |

Self-service endpoints:

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/v1/public/users/register` | create a customer account |
| `GET` | `/api/v1/accounts/current` | read current account (`200`) |
| `PATCH` | `/api/v1/accounts/current` | partially update current account (`200`) |
| `GET` | `/api/v1/accounts/current/addresses` | list owned addresses (`200`) |
| `GET` | `/api/v1/accounts/current/addresses/{addressId}` | read an owned address (`200`, `404` if absent or not owned) |
| `POST` | `/api/v1/accounts/current/addresses` | create address (`201`, `Location`) |
| `PUT` | `/api/v1/accounts/current/addresses/{addressId}` | replace owned address (`200`) |
| `DELETE` | `/api/v1/accounts/current/addresses/{addressId}` | delete owned address (`204`) |
| `GET` | `/api/v1/admin/users` | list users (`200`) |
| `POST` | `/api/v1/admin/users` | create user (`201`, `Location`) |
| `GET/PUT/PATCH/DELETE` | `/api/v1/admin/users/{userId}` | read/replace/partially update/soft-delete user (`200`/`204`) |
| `GET` | `/api/v1/groups` | list groups (`200`) |
| `POST` | `/api/v1/groups` | create group (`201`, `Location`) |
| `GET/PUT/PATCH/DELETE` | `/api/v1/groups/{groupId}` | read/replace/partially update/delete group (`200`/`204`) |
| `GET` | `/api/v1/groups/{groupId}/members` | list group members |
| `PUT/DELETE` | `/api/v1/groups/{groupId}/members/{userId}` | add/remove membership idempotently (`204`) |
| `PUT/DELETE` | `/api/v1/groups/{groupId}/roles/{roleId}` | assign/unassign a role idempotently (`204`) |
| `GET` | `/api/v1/roles` | list roles (`200`) |
| `POST` | `/api/v1/roles` | create role (`201`, `Location`) |
| `GET/PATCH/DELETE` | `/api/v1/roles/{roleId}` | read/partially update/delete role (`200`/`204`) |
| `GET` | `/api/v1/permissions` | list permissions (`200`) |
| `POST` | `/api/v1/permissions` | create permission (`201`, `Location`) |
| `GET/PATCH/DELETE` | `/api/v1/permissions/{permissionId}` | read/partially update/delete permission (`200`/`204`) |

Groups augment direct user roles; nested groups are not supported. Group and
membership changes appear in JWT authorities when Auth Service issues a new token;
they do not automatically revoke existing tokens. A caller can revoke the presented
token through Auth Service logout.

Cart endpoints:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/cart` | load current user's cart |
| `PUT` | `/api/v1/cart` | replace cart items |
| `POST` | `/api/v1/cart/merge` | merge local/browser cart into account cart |
| `POST` | `/api/v1/cart/validate` | structural cart validation |
| `DELETE` | `/api/v1/cart/items/{productId}` | remove product from cart |

Cart validation is structural in User Service. Inventory-aware validation
belongs at the Inventory/checkout boundary because User Service does not own
product availability rules.

Admin audit endpoints:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/admin/audit-events` | list paged immutable admin audit events |
| `GET` | `/api/v1/admin/audit-events/{id}` | inspect one admin audit event |

The first implementation records User Service administrative/account actions
such as user, role, permission, group, membership, and password changes. Other services can later
write to the same audit contract or move the contract into a dedicated audit
service without changing the Angular route.

Swagger is available at `/swagger-ui/index.html`; use the **Authorize** action with `Bearer <token>`.

## Persistence

Liquibase creates users, roles, permissions, groups, membership/role join tables,
refresh-token/audit support tables, address tables, cart tables, and bootstrap data.
`UserRepository` and `RoleRepository` use `@EntityGraph` to load roles and
permissions without an N+1 query sequence.

Mutable entities (`User`, `UserAddress`, `Cart`, `CartItem`, `Role`,
`Permission`, `UserGroup`, and `RefreshToken`) extend `BaseAuditableEntity` and
receive `createdAt`, `createdBy`, `updatedAt`, `updatedBy`, and optimistic-lock
`version` values through Spring Data JPA auditing. `createdBy` and `updatedBy`
use the authenticated Spring Security principal name; unauthenticated operations
have no auditor and may leave actor fields null. Append-only event/history
entities keep their event-specific actor and timestamp fields. The address
default-switch bulk update explicitly writes modification actor/time because
bulk JPQL bypasses JPA entity listeners.

`DatabaseUserDetailsService` adapts the User repository model to Spring Security's `UserDetailsService` contract. BCrypt compares the supplied password with the stored hash.

Local Liquibase data includes `admin`, `customer1`, `customer2`, `support1`,
and `inventory1`. Credentials
are listed in the root `demo-credentials.local.md`, which is ignored by Git.
Customer passwords are stored as delegated BCrypt hashes. All seeded accounts
remain local POC identities and must not be reused in a deployed environment.

Generate a delegated development hash with the tooling-only Gradle task. The
utility is compiled from test sources and is not included in the service JAR:

```powershell
$env:SHOPVERSE_HASH_PASSWORD = '<LOCAL_PASSWORD_PLACEHOLDER>'
.\gradlew.bat generatePasswordHash --no-daemon
Remove-Item Env:SHOPVERSE_HASH_PASSWORD
```

The task reads only the environment variable so the password is not stored in
Gradle configuration-cache state or supplied as a command-line argument.

```powershell
docker compose exec mysql sh -lc '
  MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot user_service -e "
    SELECT u.username, u.status, r.role_name
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    ORDER BY u.username;
  "
'
```

## Caching And Resilience

Role and permission lookups use `ConcurrentMapCacheManager`. This is a local cache, not Redis. Mutations evict the related caches.

Account, address, and administrative user controllers use the configured
annotation-based RateLimiter and semaphore Bulkhead. Lookup operations use a
bounded Retry.

## Configuration

`cloud-configs/USER-SERVICE.yml` defines datasource, security, management, resilience, bootstrap, and service settings. Environment variables override values; YAML defaults support local POC startup.

Do not commit `.env`. In production, use a secret manager and replace internal Basic authentication with workload identity or mTLS.

## Tests

Controller tests demonstrate request mapping and validation. Feature service tests cover
account, user provisioning/administration, password, lookup, role, permission, and audit behavior. Dedicated method-security
tests should be added for permission allow/deny cases; the standalone MockMvc
controller test does not load the Spring Security filter chain.

## Observability And Operational Limits

- Query `/actuator/health` and `/actuator/prometheus`; correlate requests through
  `X-Correlation-Id`, trace IDs, and `{log_type="application", application="USER-SERVICE"}`.
- Alert on authentication lookup latency/failures, authorization denials, account
  lockouts, cache load failures, Liquibase failures, and datasource saturation.
- The role/permission cache is local to each replica; eviction is not distributed.
- Audit retention and export are POC-level and need an explicit production policy.
- Internal Basic authentication is a local baseline and should become workload
  identity or mTLS in a deployed environment.
- Dedicated method-security allow/deny tests remain required before treating the
  authorization boundary as production-proven.

## Run

```powershell
./gradlew test
./gradlew bootRun
```

```powershell
docker compose build user-service
docker compose up -d user-service
```

## AI-Assisted Development

AI tools can trace identity, role, permission, ownership, caching, audit, and
migration behavior; generate negative authorization cases; and review sensitive
logging. Follow scoped [`AGENTS.md`](AGENTS.md), imported by
[`CLAUDE.md`](CLAUDE.md), and use the
[security-review](../../dev-tools/ai-workflows/prompts/security-review.md),
[feature](../../dev-tools/ai-workflows/prompts/implement-feature.md), and
[incident](../../dev-tools/ai-workflows/prompts/incident-investigation.md) workflows.

Never provide passwords, password hashes, internal credentials, access tokens,
or real user records to an AI tool. Require service-layer authorization evidence;
standalone controller tests and hidden UI controls do not prove method security.

The deterministic identity-security evaluation covers method-security, credential,
JWKS, and secret boundaries. Executable cache-invalidation and full filter-chain
allow/deny coverage remains required in the service test suite.

## Related Guides

- [JWT and Spring Security](https://taukhir.github.io/shopverse-docs/security/JWT-OAUTH2-SPRING-SECURITY)
- [Generic Spring Security](https://taukhir.github.io/shopverse-docs/security/SPRING-SECURITY-GENERIC)
- [Liquibase](https://taukhir.github.io/shopverse-docs/data/LIQUIBASE-GENERIC)
- [Shopverse Resilience4j](https://taukhir.github.io/shopverse-docs/reliability/RESILIENCE4J)
- [Generic Resilience4j patterns](https://taukhir.github.io/shopverse-docs/reliability/RESILIENCE4J-GENERIC)
- [Spring Resilience4j](https://taukhir.github.io/shopverse-docs/spring/SPRING-RESILIENCE4J)
- [Spring Boot testing](https://taukhir.github.io/shopverse-docs/spring/SPRING-BOOT-TESTING)
- [Shopverse testing strategy](https://taukhir.github.io/shopverse-docs/development/TESTING)
