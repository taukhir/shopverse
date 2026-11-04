# User Service Guidance

## Scope And Invariants

- This service owns users, credentials, roles, permissions, addresses, persisted carts,
  and its admin audit events. Do not move product availability into cart validation.
- Preserve ordered internal-Basic and JWT filter chains, service-layer method security,
  customer ownership, password hashing, lockout behavior, and immutable audit evidence.
- UI visibility and standalone controller tests are not authorization proof.
- Role/permission cache changes require mutation eviction and multi-replica analysis.
- Add only forward Liquibase changelogs; never log credentials, hashes, tokens, or real
  user records.

## Verification

Run `./gradlew test` and relevant integration tests. Include method-security allow/deny,
cross-customer ownership, password/account boundaries, cache invalidation, migration,
audit, address, and cart scenarios.
