# ShopVerse Backlog — By Area

Tracked backlog status and ownership view. The previously referenced
`BACKLOG.md` is absent from this checkout; `git ls-files '*BACKLOG*'` lists
only this file. The detailed canonical backlog needs restoration or an
explicit replacement decision before this index can be treated as complete.
This file records **Owner** (the component responsible for the work) and
**Affected** (all impacted components), keeps existing IDs stable, and should
be updated whenever a backlog ID or status changes. [`ROADMAP.md`](ROADMAP.md)
remains a separate prioritization and sequencing view.

## Naming Convention

| Tag | Covers |
|---|---|
| `frontend-site` | Customer-facing storefront (`shopverse-web`'s non-admin routes) |
| `frontend-backoffice` | Admin area (`shopverse-web/features/admin/**`) |
| `order-service` / `inventory-service` / `payment-service` / `auth-service` / `user-service` / `api-gateway` | The one backend service |
| `platform` | Cross-cutting: CI/CD, infra/Docker/K8s/AWS, `shopverse-common` shared libraries, discovery-server/config-server, multi-service features, process/testing-strategy, docs — used as **Owner** when no single service is responsible, and appears in **Affected** whenever shared config/libraries are touched |

**Owner** = who does the work. **Affected** = every component that's
touched or feels the impact, the owner included — an item can have one
owner but several affected components.

---

## Bugs

| ID | Title | Owner | Affected |
|---|---|---|---|
| BUG-001 | Checkout only orders the first cart item *(frontend submits all lines; backend contract/saga rollout remains open)* | platform | frontend-site, order-service, inventory-service, payment-service |
| BUG-002 | Receipt always shows "Pending capture" *(Fixed)* | frontend-site | frontend-site |
| BUG-003 | Checkout unit tests don't cover multi-item carts *(coverage added; 111 frontend unit tests pass locally)* | frontend-site | frontend-site |
| BUG-004/005 | `findByOrderNumberForUpdate` repository bugs *(Fixed)* | inventory-service | inventory-service |
| BUG-006 | payment-service integration test fails in CI *(Fixed)* | payment-service | payment-service |
| BUG-007 | order-service integration test fails in CI *(Fixed)* | order-service | order-service |
| BUG-008 | Service README relative links broken *(Fixed)* | platform | order-service, inventory-service, payment-service, auth-service, user-service, api-gateway, platform |
| BUG-009 | CI "detect affected services" crashes on force-push *(Fixed)* | platform | platform |
| BUG-010 | Product card aria-label doesn't reflect unavailable status *(Fixed)* | frontend-site | frontend-site |
| BUG-011 | `check-spring-labs.mjs` points at old Gradle wrapper path *(Fixed)* | platform | platform |
| BUG-012 | CI Playwright/chromium incompatible with new runner *(Fixed)* | platform | platform, frontend-site |
| BUG-013 | Checkout SAGA ignores inventory events (dead `PENDING_INVENTORY`) | order-service | order-service, inventory-service, payment-service |
| BUG-014 | Inventory expiry job fails on a zero reservation expiry date | inventory-service | inventory-service |
| BUG-015 | Default branch has no enforced PR/CI protection | platform | platform |
| BUG-016 | CodeQL findings don't enforce merge protection | platform | platform |
| BUG-017 | Production deployment has no approval environment | platform | platform |
| BUG-018 | Order Prometheus active-request meter registration fails | order-service | order-service |
| BUG-019 | Error response shape drifted across services | platform | order-service, inventory-service, payment-service, user-service, auth-service, frontend-site |
| BUG-020 | IDOR in payment-service `createIntent` — no ownership check | payment-service | payment-service |
| BUG-021 | config-server and discovery-server have no authentication | platform | platform |
| BUG-022 | Checkout `Idempotency-Key` regenerated on every retry *(stable per checkout through retries; frontend unit suite passes locally)* | frontend-site | frontend-site, order-service |
| BUG-023 | payment-service doesn't tolerate duplicate event delivery | payment-service | payment-service |
| BUG-024 | inventory `reserve()`/`release()` have no row lock | inventory-service | inventory-service |
| BUG-025 | Gateway readiness/metrics endpoints leak internal topology | api-gateway | api-gateway |
| BUG-026 | No CI scan/publish for `shopverse-web`'s Docker image | platform | frontend-site, platform |
| BUG-027 | No rate limiting on `/auth/login` | auth-service | auth-service |
| BUG-028 | Bulkhead/rate-limiter capacity vs. real DB pool mismatch | platform | order-service, inventory-service, payment-service, user-service |
| BUG-029 | order→inventory Feign call has no explicit timeout | order-service | order-service, inventory-service |
| BUG-030 | Unbounded/unpaginated list queries | platform | inventory-service, payment-service, order-service |
| BUG-031 | Inventory scheduled expiry job has no leader election | inventory-service | inventory-service |
| BUG-032 | No backup/recovery strategy for MySQL | platform | platform |
| BUG-033 | Missing index on `orders.customer_username` | order-service | order-service |
| BUG-034 | No version-aware/locked state transitions in any SAGA entity | platform | order-service, inventory-service, payment-service |
| BUG-035 | inventory `release()` can silently un-confirm a paid reservation | inventory-service | inventory-service, order-service, payment-service |
| BUG-036 | payment `process()` mishandles any pre-existing row | payment-service | payment-service, order-service |
| BUG-037 | Order cancellation can race the saga's `confirm()` | order-service | order-service, inventory-service, payment-service |
| BUG-038 | payment admin `reconcile()` vs. `applyWebhook()` lost-update | payment-service | payment-service |
| BUG-039 | Order timeline has no deterministic ordering tiebreak | order-service | order-service |
| BUG-040 | Unauthenticated payment-status forgery via webhook endpoint | payment-service | payment-service, api-gateway, order-service |
| BUG-041 | No self-service password reset flow | user-service | user-service, auth-service |
| BUG-042 | Account lockout is dead code | user-service | user-service, auth-service |
| BUG-043 | Fine-grained RBAC permissions seeded but ignored downstream | platform | user-service, order-service, inventory-service, payment-service |
| BUG-044 | Account deletion doesn't cascade PII removal | user-service | user-service, order-service, payment-service |
| BUG-045 | Admin navigation is missing an accessible landmark label *(Fixed in shared navigation)* | frontend-backoffice | frontend-backoffice |
| BUG-046 | Account profile/address saves are reported missing after reload; frontend address readback added; verify persistence end-to-end | platform | frontend-site, user-service |
| BUG-047 | Public User Service endpoints are not routed/allowed by API Gateway *(frontend API paths covered; Gateway/runtime verification pending)* | api-gateway | api-gateway, user-service, auth-service, frontend-site |
| BUG-048 | Cart reads invoke write-capable cart creation under read-only transaction metadata | user-service | user-service, frontend-site |
| BUG-049 | Cart replace/merge accepts duplicate products and unchecked quantity sums | user-service | user-service, frontend-site |
| BUG-050 | Existing JWT authorities remain valid after user/role changes until expiry *(backend revocation/version strategy required; UI cannot invalidate issued JWT claims)* | platform | auth-service, user-service, api-gateway, frontend-site |
| BUG-051 | Address update ignores an explicit false default flag *(frontend sends false unchanged; verify service persistence semantics)* | user-service | user-service, frontend-site |
| BUG-052 | User Service logs account identifiers and email addresses | user-service | user-service, platform |
| BUG-053 | Admin reservation lookup returns only the first reservation row for a multi-item order *(frontend accepts a list; endpoint remains single-row)* | inventory-service | inventory-service, frontend-backoffice |
| BUG-054 | Auth Service logout integration test fails revocation-store argument verification in CI | auth-service | auth-service |
| BUG-055 | Complete multi-item checkout across Order, Inventory and Payment SAGA | order-service | order-service, inventory-service, payment-service, frontend-site |
| BUG-056 | Return all order reservations from the admin reservation endpoint | inventory-service | inventory-service, frontend-backoffice |
| BUG-057 | Verify profile and address persistence/readback against the User Service database | user-service | user-service, frontend-site |
| BUG-058 | Verify explicit false default-address updates persist correctly | user-service | user-service, frontend-site |
| BUG-059 | Add Gateway-to-User-Service public route/security end-to-end coverage | api-gateway | api-gateway, user-service, frontend-site |
| BUG-060 | Invalidate or refresh authorization after account/role/permission changes | platform | auth-service, user-service, api-gateway, frontend-backoffice |
| BUG-061 | Checkout frontend does not confirm it renders a partial-reservation-failure response from the multi-item saga (BUG-001/BUG-055) correctly, only full success/failure | frontend-site | frontend-site, order-service, inventory-service |

### BUG-053 acceptance criteria

- Preserve the existing reservation lookup contract or provide a compatible migration path.
- Let authorized administrators inspect every reservation for an order, including each product, quantity, status, and expiry.
- Add tests for single-row and multi-row orders and confirm authorization still blocks non-admin access.

### BUG-054 acceptance criteria

- Diagnose why `logoutRevokesTheAuthenticatedTokenIdUntilItsExpiry` fails the Mockito revocation-store argument verification in CI.
- Keep the test assertion aligned with the actual JWT `jti` and `exp` passed to the store; do not weaken it to a call-only assertion.
- Run the focused Auth Service test and the module test task in CI or an equivalent supported environment.

### Backend placeholders for selected frontend work

- **BUG-055 (Order/Inventory/Payment):** remove the single-item checkout contract cap only after defining bounded item count/quantity validation; make reservation, compensation, payment calculation and event handling idempotent per order line; preserve all line details in order/receipt responses; add multi-item success, partial reservation failure, payment failure compensation, duplicate event, and retry tests. Update OpenAPI/event docs and perform a full-stack checkout.
- **BUG-056 (Inventory):** retain the legacy single-row endpoint during migration or version the response; expose every reservation for an order with product, quantity, status and expiry; enforce admin authorization; cover zero, one and multiple rows with integration tests and document the contract.
- **BUG-057 (User):** verify the configured User DB, Liquibase state, transaction commit, and GET readback after profile/address writes; add database-backed tests proving values survive a fresh request/service restart; include profile update and address create/update/delete.
- **BUG-058 (User):** prove that an explicit `defaultAddress=false` persists and does not get defaulted by null/primitive mapping; maintain exactly the intended default-address invariant; add service and repository tests for false, true, omitted and changing the default.
- **BUG-059 (Gateway):** exercise public registration and public user routes through the actual Gateway to User Service; verify anonymous allow-list, protected-route denial, forwarded path, CORS/CSRF expectations and no accidental exposure of internal endpoints.
- **BUG-060 (Auth/User/Gateway):** choose a freshness mechanism (short-lived token plus version lookup, revocation, or session authority refresh) and propagate it to every authorization boundary; role/group/permission changes, disablement and logout must take effect within the documented bound; test existing-token behavior and cache invalidation. The Angular UI cannot rewrite issued JWT claims.
- **FEAT-AU (Order/Payment/Inventory):** implement a return-request state machine with authorized approve/reject transitions, refund idempotency, inventory disposition/restock policy, audit actor/reason, customer-visible status, concurrency protection, and integration tests. Refund execution must not itself imply return approval.
- **ENH-060 (Platform/services):** offer a bounded and paginated cross-service reconciliation query with consistent correlation/order/payment/reservation state, data freshness/partial-source indicators, actionable conflict classification, and durable audit trail; document timeout/failure semantics and integration coverage.
- **ENH-061 (Platform/services):** provide time-bounded aggregates with explicit currency/time zone/denominator definitions, source freshness and partial data states; test aggregate correctness against known fixtures. Do not report loaded UI page totals as authoritative enterprise KPIs.

## Features

| ID | Title | Owner | Affected |
|---|---|---|---|
| REQ-1/2/3/4 | Multi-tenancy | platform | order-service, inventory-service, payment-service, auth-service, user-service, api-gateway, frontend-site |
| FEAT-A | ATS (Available-to-Sell) | inventory-service | inventory-service, order-service |
| FEAT-B | Buy Online, Pick Up In Store (BOPIS) | platform | order-service, inventory-service, frontend-site |
| FEAT-C | Guest checkout | order-service | order-service, user-service, frontend-site |
| FEAT-D | Adopt MapStruct repo-wide | platform | order-service, inventory-service, payment-service, user-service, auth-service, api-gateway |
| FEAT-E | OpenAPI contracts module (`shopverse-contracts`) | platform | order-service, inventory-service, payment-service, user-service |
| FEAT-F | Service split: checkout-service | order-service | order-service |
| FEAT-G | Service split: accounts-service / profile-service | user-service | user-service, auth-service |
| FEAT-H | Tax service (new) | platform | order-service |
| FEAT-I | Promotions service (new) | platform | order-service |
| FEAT-J | Real payment provider adapter | payment-service | payment-service |
| FEAT-K | Delivery-mode strategy | order-service | order-service, frontend-site |
| FEAT-L | Avro event schemas + registry | platform | order-service, inventory-service, payment-service |
| FEAT-M | Split "reserve" into Allocation vs. Reservation | inventory-service | inventory-service, order-service |
| FEAT-N | Centralized secrets management | platform | order-service, inventory-service, payment-service, user-service, auth-service, api-gateway |
| FEAT-O | Centralized error tracking / APM | platform | order-service, inventory-service, payment-service, user-service, auth-service, api-gateway |
| FEAT-P | Feature flags / kill switches | platform | order-service, inventory-service, payment-service, frontend-site, frontend-backoffice |
| FEAT-Q | Gateway-level distributed rate limiting | api-gateway | api-gateway |
| FEAT-R | Load/performance testing | platform | order-service, inventory-service, payment-service |
| FEAT-S | Back-office reconciliation console *(frontend queue uses existing Payment API; cross-service aggregation/audit pending)* | frontend-backoffice | frontend-backoffice, order-service, payment-service, inventory-service |
| FEAT-T | Formal Kafka production hardening | platform | order-service, inventory-service, payment-service |
| FEAT-U | Kubernetes manifests/Helm chart | platform | order-service, inventory-service, payment-service, auth-service, user-service, api-gateway |
| FEAT-V | Canary / rolling deployment strategy | platform | order-service, inventory-service, payment-service, auth-service, user-service, api-gateway |
| FEAT-W | AWS infrastructure (EKS/ECR/EC2/S3) | platform | platform (all services deploy target) |
| FEAT-X | Change Data Capture (Debezium) exploration | platform | inventory-service |
| FEAT-Y | Migrate one service to Quarkus | platform | platform (discovery-server/config-server candidate) |
| FEAT-Z | Reactive (WebFlux) conversion experiment | inventory-service | inventory-service |
| FEAT-AA | Read-only MCP tool server | platform | order-service, inventory-service, payment-service |
| FEAT-AB | Customer-facing AI shopping assistant | platform | inventory-service, frontend-site |
| FEAT-AC | AI Incident Investigator | platform | order-service, inventory-service, payment-service, frontend-backoffice |
| FEAT-AD | Service mesh (Istio) with mTLS | platform | order-service, inventory-service, payment-service, auth-service, user-service, api-gateway |
| FEAT-AE | Migrate tracing export to OpenTelemetry | platform | order-service, inventory-service, payment-service, auth-service, user-service, api-gateway |
| FEAT-AF | API versioning strategy and deprecation policy | platform | order-service, inventory-service, payment-service, user-service, auth-service |
| FEAT-AG | Consumer-driven contract testing for Kafka events | platform | order-service, inventory-service, payment-service |
| FEAT-AH | Chaos engineering / fault-injection harness | platform | order-service, inventory-service, payment-service, auth-service |
| FEAT-AI | Synthetic/canary monitoring for checkout | platform | order-service, inventory-service, payment-service, frontend-site |
| FEAT-AJ | Back-office return/refund approval workflow *(read-only return queue added; decision workflow/API pending)* | frontend-backoffice | frontend-backoffice, order-service, payment-service, inventory-service |
| FEAT-AK | Roles & Permissions management UI *(route/payload regression tests added; runtime verification pending)* | frontend-backoffice | frontend-backoffice, user-service |
| FEAT-AL | Admin analytics/KPI dashboard *(loaded-data attention/return KPIs added; authoritative aggregates pending)* | frontend-backoffice | frontend-backoffice, order-service, inventory-service, payment-service |
| FEAT-AM | Consumer-side staleness/skip gate for saga handlers | platform | order-service, inventory-service, payment-service |
| FEAT-AN | Strategy-pattern registry for payment providers | payment-service | payment-service |
| FEAT-AO | Customer notification inbox and persisted delivery preferences | platform | frontend-site, order-service, payment-service, user-service |
| FEAT-AP | Collapsible mobile navigation menu for storefront and admin *(Implemented; responsive visual verification pending)* | frontend-site | frontend-site, frontend-backoffice |
| FEAT-AQ | Add user groups and group-based role assignment *(implementation added; DB/security verification pending)* | user-service | user-service, auth-service, api-gateway, frontend-backoffice |
| FEAT-AR | Add User Service group administration APIs *(implementation added; contract/security tests pending)* | user-service | user-service, api-gateway, frontend-backoffice |
| FEAT-AS | Extract persisted cart ownership into Cart Service | platform | user-service, api-gateway, frontend-site, platform |
| FEAT-AT | Add back-office group management UI *(route/payload regression tests added; runtime verification pending)* | frontend-backoffice | frontend-backoffice, user-service |
| FEAT-AU | Add audited return/refund decision workflow and backend APIs | payment-service | order-service, payment-service, inventory-service, frontend-backoffice |

## Enhancements

| ID | Title | Owner | Affected |
|---|---|---|---|
| ENH-001 | Distributed/explicit lookup cache | inventory-service | inventory-service, api-gateway |
| ENH-002 | Money math in `BigDecimal`, not `double` | platform | order-service (future tax service) |
| ENH-003 | Consistent idempotency header naming | platform | order-service, frontend-site |
| ENH-004 | Fail-closed on downstream errors | platform | order-service, inventory-service, payment-service |
| ENH-005 | AsyncAPI contracts for Kafka events | platform | order-service, inventory-service, payment-service |
| ENH-006 | RFC 9457 `application/problem+json` audit | platform | order-service, inventory-service, payment-service, user-service, auth-service |
| ENH-007 | Rename `io.shopverse.platform.*` → `io.shopverse.common.*` | platform | order-service, inventory-service, payment-service, user-service, auth-service, api-gateway |
| ENH-008 | Split documentation/ into ShopVerse-specific vs. generic | platform | platform |
| ENH-009 | Standardize contract ↔ internal-DTO mapper pattern | order-service | order-service |
| ENH-010 | Extend OpenAPI contracts to 3 remaining services | platform | inventory-service, payment-service, user-service |
| ENH-011 | JDK 21 → 25 bump *(Done)* | platform | order-service, inventory-service, payment-service, user-service, auth-service, api-gateway |
| ENH-012 | Dependabot grouping for version-locked npm families | platform | frontend-site |
| ENH-013 | Rehearse release/deployment/rollback | platform | order-service, inventory-service, payment-service, user-service, auth-service, api-gateway |
| ENH-014 | Hibernate L1/L2 cache | inventory-service | inventory-service |
| ENH-015 | Database performance tuning pass | platform | order-service, inventory-service, payment-service |
| ENH-016 | PostgreSQL advisory locks exploration | platform | *(service TBD per (a)/(b) decision)* |
| ENH-017 | Liquibase performance tuning | platform | order-service, inventory-service, payment-service, user-service |
| ENH-018 | Flyway side-by-side comparison | platform | *(one throwaway service clone)* |
| ENH-019 | Full OAuth2 Authorization Server, JWT rotation | auth-service | auth-service, api-gateway, order-service, inventory-service, payment-service, user-service |
| ENH-020 | Clarify "use multiple databases" | platform | *(service TBD pending disambiguation)* |
| ENH-021 | inventory-service has zero unit tests for core logic | inventory-service | inventory-service |
| ENH-022 | order-service saga/outbox/recovery paths untested | order-service | order-service |
| ENH-023 | `ShopverseReadinessService`/`SecurityConfig` untested | api-gateway | api-gateway |
| ENH-024 | `shopverse-security-starter` registers unconditional beans | platform | api-gateway |
| ENH-025 | Payment admin endpoints lack method-level `@PreAuthorize` | payment-service | payment-service |
| ENH-026 | Cart has no request ordering/debounce | frontend-site | frontend-site |
| ENH-027 | auth-service's call to user-service has no resilience | auth-service | auth-service, user-service |
| ENH-028 | `CatalogService.getProduct()` has no resilience annotations | order-service | order-service, inventory-service |
| ENH-029 | No security headers (CSP, X-Frame-Options, HSTS) | api-gateway | api-gateway, order-service |
| ENH-030 | Liquibase changelogs have zero `preConditions` guards | platform | order-service, inventory-service, payment-service, user-service |
| ENH-031 | Single-instance topology not flagged as POC-only | platform | platform |
| ENH-032 | Custom `/public/health` endpoints don't check dependencies | platform | order-service, inventory-service |
| ENH-033 | No explicit event versioning/sequencing | platform | order-service, inventory-service, payment-service |
| ENH-034 | `refund()` never notifies any downstream system | payment-service | payment-service |
| ENH-035 | No email verification on signup | user-service | user-service |
| ENH-036 | No graceful shutdown anywhere | platform | order-service, inventory-service, payment-service, user-service, auth-service, api-gateway |
| ENH-037 | No data retention/purge policy | platform | order-service, payment-service, user-service |
| ENH-038 | No license-compliance scanning | platform | order-service, inventory-service, payment-service, user-service, auth-service, api-gateway, frontend-site |
| ENH-039 | No shared test-data fixtures/builders | platform | order-service, inventory-service |
| ENH-040 | No flaky-test tracking/quarantine | platform | order-service, inventory-service, payment-service, user-service, auth-service, api-gateway |
| ENH-041 | No mutation testing anywhere | platform | inventory-service |
| ENH-042 | Admin settings/configuration is scattered *(settings landing links consolidated; configuration centralization remains partial)* | frontend-backoffice | frontend-backoffice, payment-service |
| ENH-043 | Inventory admin's delete action is a disabled stub *(UI now explains deletion is unavailable; full workflow still needs an Inventory Service endpoint)* | frontend-backoffice | frontend-backoffice, inventory-service |
| ENH-044 | Named per-step pipeline metrics for checkout/saga flow | platform | order-service, inventory-service, payment-service |
| ENH-045 | Recovery console must distinguish unavailable services from an empty DLT queue *(UI implementation present; runtime verification pending)* | frontend-backoffice | frontend-backoffice, order-service, inventory-service, payment-service |
| ENH-046 | Checkout receipt should use the placed order's authoritative total and live workflow/payment state | frontend-site | frontend-site, order-service, payment-service |
| ENH-047 | Redesign responsive storefront and admin headers and navigation presentation *(Implemented; responsive visual verification pending)* | frontend-site | frontend-site, frontend-backoffice |
| ENH-048 | Expand accessibility checks across login, checkout, orders, roles/groups, and mobile layouts *(checks added; Playwright workers failed immediately locally, rerun required)* | frontend-site | frontend-site, frontend-backoffice |
| ENH-049 | Add User Service persistence, security, and HTTP integration coverage | user-service | user-service, platform |
| ENH-050 | Define cross-replica role/permission cache invalidation | user-service | user-service |
| ENH-051 | Apply endpoint resilience controls consistently across User Service APIs | user-service | user-service, api-gateway, platform |
| ENH-052 | Define User Service account API and controller boundaries | user-service | user-service, api-gateway, frontend-site, frontend-backoffice |
| ENH-053 | Split account, address, and admin user controllers | user-service | user-service, api-gateway, frontend-site, frontend-backoffice |
| ENH-054 | Publish and migrate to the redesigned User Service API contracts | platform | user-service, api-gateway, frontend-site, frontend-backoffice, shopverse-common |
| ENH-055 | Define account and group authorization semantics and audit events | user-service | user-service, auth-service, api-gateway |
| ENH-056 | Remove superseded Accounts/Profile service split proposal | platform | user-service, auth-service |
| ENH-057 | Redis-backed token/session lifecycle and service-to-service credentials | platform | auth-service, user-service, api-gateway, order-service, inventory-service, payment-service, shopverse-common, platform |
| ENH-058 | Implement scoped API-key authentication for service-to-service calls | platform | auth-service, user-service, api-gateway, order-service, inventory-service, payment-service, shopverse-common, platform |
| ENH-059 | Protect browser authentication tokens with an HttpOnly-cookie or BFF session design | frontend-site | frontend-site, auth-service, api-gateway, platform |
| ENH-060 | Provide cross-service reconciliation query and audit API | platform | order-service, payment-service, inventory-service, frontend-backoffice |
| ENH-061 | Provide bounded, time-based admin analytics aggregates | platform | order-service, inventory-service, payment-service, frontend-backoffice |

### ENH-057 acceptance criteria

- **Phase 1 - access-token foundation (start here):** Define a compatible token response (`accessToken`, `tokenType`, `expiresIn`); specify and validate JWT issuer, audience, stable subject, token ID, issue/expiry times, signing algorithm, and consistent role/permission mapping across Auth Service, Gateway, and resource services. Establish a deliberate short access-token lifetime, key ID handling, overlapping signing-key rotation, configuration/secret requirements, and cross-service negative tests before changing production clients.
- **Phase 2 - refresh-token feature (backlogged; not implemented):** Add an Auth Service refresh endpoint that accepts only a refresh token and returns a new access token (and rotated refresh token). Generate high-entropy opaque refresh tokens; store only a cryptographic hash plus session/user metadata in shared Redis with an absolute expiry. Rotate on every successful refresh, atomically invalidate the presented token, and detect reuse so the affected token family/session can be revoked. Support explicit logout/revocation, expiry, and session-level logout; access tokens must not be accepted by the refresh endpoint or used to call it. Keep refresh tokens out of business APIs and logs; deliver/store them using the client-appropriate secure mechanism. Define Redis HA, persistence, eviction, outage/fail-closed behavior, and token TTL policy. Add focused unit/integration tests for valid refresh, expired/unknown/revoked tokens, rotation, concurrent refresh, reuse detection, logout, and Redis failure. Update Auth API contracts, frontend refresh behavior, and security documentation as part of implementation. Do not store raw refresh tokens or API-key secrets.
- **Phase 3 - revocation and client migration:** Support access-token invalidation through a Redis-backed revocation/session-version check at the trust boundaries, while keeping access tokens short-lived. Define behavior for logout, account disablement, password change, and role/permission changes. Migrate frontend and service clients compatibly and define rollback behavior.
- **Phase 4 - service identity:** Define per-service credentials for internal HTTP calls, including caller identity, scope, expiry, rotation, secret distribution, and audit. Evaluate API keys against OAuth2 client credentials or mTLS and record the selected approach; do not use one shared key across services or expose internal endpoints through the public Gateway.
- Add forward-only persistence/configuration changes, migration and rollout compatibility, key/credential rotation and rollback procedures, and tests for token validation, expiry, invalidation, refresh rotation/reuse, Redis failure, unauthorized service identity, and cross-service authorization.
- Update Auth/Gateway/service documentation and client token handling; never log tokens, API keys, passwords, or authorization headers.

**Sequencing/dependency:** Access-token revocation is already implemented as an initial Phase 3 subset, while the full Phase 1 token contract/validation criteria remain open. Reconcile the existing ENH-019 full OAuth2 Authorization Server/JWT rotation proposal with ENH-057 so signing-key rotation and broader Authorization Server scope are not implemented twice. ENH-057 remains the umbrella; phases should be tracked as linked subtasks when work is assigned.

**Architecture note:** JWT access tokens remain self-contained for API authentication. Redis currently stores access-token revocation markers; shared refresh-token/session state remains planned. Because the previously referenced `BACKLOG.md` is absent from this checkout, this row and its acceptance criteria are recorded in the tracked area view pending restoration or an explicit replacement decision.

### ENH-058 acceptance criteria

- Give each calling service a distinct API key identity; keys must be scoped to the receiving service and permitted operations. Do not share one key across all services or confuse service API keys with user access/refresh tokens.
- Use a key identifier plus high-entropy secret. Store only a one-way hash in the authoritative credential store; reveal the raw key once at creation and distribute it through the approved secrets manager. Never place raw keys in source, ordinary config, logs, URLs, or telemetry.
- Protect service-to-service endpoints at the receiving service, not only at API Gateway. Reject missing, invalid, expired, revoked, wrong-audience, and insufficient-scope keys. Keep internal routes unavailable through public Gateway routing.
- Implement issuance/registration, rotation with an overlap window, revocation, expiry, and audit of key lifecycle actions. Define how receivers obtain current key status and how revocation propagates; if Redis is used as a validation cache, set bounded TTLs and fail closed on cache/authentication-store outage.
- Update each internal HTTP client to send its own credential over TLS using a dedicated header; redact that header from logs and traces. Keep user JWT authorization separate where a call also needs end-user context, and define trusted propagation rules rather than forwarding credentials blindly.
- Add tests for valid service identity/scope, service-to-service denial for invalid/revoked/expired keys, rotation overlap, caller/target isolation, Redis or credential-store failure, and proof that public routes cannot reach internal APIs. Document secret bootstrap, rotation, revocation, incident response, and rollback.

**Dependency:** Coordinate with ENH-057 Phase 4. ENH-058 implements API keys as the explicitly selected service-credential mechanism; revisit OAuth2 client credentials or mTLS only if implementation evidence shows API keys do not meet the required identity or operational controls.

### ENH-059 acceptance criteria

- Audit the Angular login, token storage, HTTP interceptor, refresh/logout, and account/session flows; document the current `sessionStorage` access-token exposure and select a target architecture: preferably a backend-for-frontend (BFF) session, or a direct HttpOnly-cookie design with an explicit backend contract.
- Remove access/refresh token persistence in `sessionStorage` and `localStorage`. Angular must not need to read bearer tokens or treat decoded token claims as authorization authority; use a server-backed session/profile response for UI state while backend services enforce authorization.
- Set session cookies with `HttpOnly`, `Secure` in production, deliberate `SameSite`, narrow `Path`/`Domain`, and bounded lifetime. Configure credentialed CORS for explicit trusted origins only; never combine credentials with wildcard origins.
- Protect state-changing cookie-authenticated requests against CSRF using a documented mechanism (for example, a synchronizer token or correctly implemented double-submit token) and validate `Origin`/`Referer` where appropriate. Cover login CSRF and logout behavior as well as ordinary mutations.
- Coordinate refresh, rotation, expiry, logout, and server-side revocation with ENH-057 Phase 2. Logout must invalidate the server session/token family and clear the browser cookie; do not create a parallel refresh-token lifecycle.
- Provide a compatible migration and rollback plan, then remove any JavaScript-readable token fallback after cutover. Document that HttpOnly limits token theft by JavaScript but does not stop injected scripts from issuing requests as the user.
- Add frontend and backend integration coverage for login, authenticated account calls, expiry/refresh, logout, CSRF rejection, cookie attributes, CORS, and absence of tokens in browser storage. Update authentication/security documentation and verify the deployed cookie/TLS configuration before release.

**Dependency:** ENH-057 Phase 2 must define refresh/session lifecycle and server-side revocation. Track this as the frontend-led browser-storage migration with Auth Service and Gateway contract work as dependencies.

**Implementation update (2026-11-25):** Working-tree implementation replaces Angular JWT storage/Authorization headers with an HttpOnly `SHOPVERSE_ACCESS` cookie, server-backed `/auth/session`, readable CSRF cookie/header, and Gateway trusted-origin plus double-submit validation. Auth Service issues the cookie and clears both access/CSRF cookies on logout while revoking the presented `jti`; downstream relay removes the access cookie. Production requires HTTPS, `BROWSER_COOKIE_SECURE=true`, and an explicit storefront origin allowlist. Focused Angular/Auth/Gateway tests and docs were added; they have not yet run. This uses direct cookie transport, not a BFF. Refresh rotation, session renewal, logout-all/family revocation remain blocked on ENH-057 Phase 2. Complete only after focused/module checks pass and production settings are reviewed.

## Debugging Drills

| ID | Title | Owner | Affected |
|---|---|---|---|
| DRILL-001 | Double-precision money bug | platform | *(not yet seeded)* |

---

Detailed evidence and acceptance criteria for BUG-047-BUG-052 and ENH-049-ENH-051 are in [the User Service audit](docs/user-service-audit.md). BUG-053 is detailed in [the Inventory Service audit](docs/inventory-service-audit.md); the account/API/group/cart redesign sequence remains in [the User Service redesign plan](docs/user-service-redesign-plan.md). BUG-046 and other pre-existing account/security tasks are not duplicated.

## Owner counts

Quick counts were removed on 2026-11-25 because the prior table was not
reconciled with the full set of IDs and became stale as backend placeholders
were added. Generate counts from the canonical backlog when it is restored;
this area view's header records that `BACKLOG.md` is absent from the checkout.
