# ShopVerse Backlog — By Area

Companion index to [`BACKLOG.md`](BACKLOG.md), which stays the source of
truth for full detail (requirement, evidence, citations). This file adds
two things `BACKLOG.md` doesn't have: **Owner** (the single component
responsible for fixing/building it) and **Affected** (every component
that's touched or impacted, including the owner). Same relationship
[`ROADMAP.md`](ROADMAP.md) has to `BACKLOG.md` — a different view on the
same data, IDs never renumbered here. Update this file when a new
`BACKLOG.md` row is added.

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
| BUG-001 | Checkout only orders the first cart item *(still blocked — product decision pending on the backend option; not started this round)* | platform | frontend-site, order-service, inventory-service, payment-service |
| BUG-002 | Receipt always shows "Pending capture" *(Fixed)* | frontend-site | frontend-site |
| BUG-003 | Checkout unit tests don't cover multi-item carts | frontend-site | frontend-site |
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
| BUG-022 | Checkout `Idempotency-Key` regenerated on every retry | frontend-site | frontend-site, order-service |
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
| BUG-045 | Admin navigation is missing an accessible landmark label | frontend-backoffice | frontend-backoffice |
| BUG-046 | Account profile/address saves are reported missing after reload; verify persistence and readback | platform | frontend-site, user-service |
| BUG-047 | Public User Service endpoints are not routed/allowed by API Gateway *(code updated; verification pending)* | api-gateway | api-gateway, user-service, auth-service, frontend-site |
| BUG-048 | Cart reads invoke write-capable cart creation under read-only transaction metadata | user-service | user-service, frontend-site |
| BUG-049 | Cart replace/merge accepts duplicate products and unchecked quantity sums | user-service | user-service, frontend-site |
| BUG-050 | Existing JWT authorities remain valid after user/role changes until expiry | platform | auth-service, user-service, api-gateway, frontend-site |
| BUG-051 | Address update ignores an explicit false default flag | user-service | user-service, frontend-site |
| BUG-052 | User Service logs account identifiers and email addresses | user-service | user-service, platform |

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
| FEAT-S | Back-office reconciliation console | frontend-backoffice | frontend-backoffice, order-service, payment-service, inventory-service |
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
| FEAT-AJ | Back-office return/refund approval workflow | frontend-backoffice | frontend-backoffice, order-service, payment-service, inventory-service |
| FEAT-AK | Roles & Permissions management UI | frontend-backoffice | frontend-backoffice, user-service |
| FEAT-AL | Admin analytics/KPI dashboard | frontend-backoffice | frontend-backoffice, order-service, inventory-service, payment-service |
| FEAT-AM | Consumer-side staleness/skip gate for saga handlers | platform | order-service, inventory-service, payment-service |
| FEAT-AN | Strategy-pattern registry for payment providers | payment-service | payment-service |
| FEAT-AO | Customer notification inbox and persisted delivery preferences | platform | frontend-site, order-service, payment-service, user-service |
| FEAT-AP | Collapsible mobile navigation menu for storefront and admin | frontend-site | frontend-site, frontend-backoffice |
| FEAT-AQ | Add user groups and group-based role assignment | user-service | user-service, auth-service, api-gateway, frontend-backoffice |
| FEAT-AR | Add User Service group administration APIs | user-service | user-service, api-gateway, frontend-backoffice |
| FEAT-AS | Extract persisted cart ownership into Cart Service | platform | user-service, api-gateway, frontend-site, platform |
| FEAT-AT | Add back-office group management UI | frontend-backoffice | frontend-backoffice, user-service |

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
| ENH-042 | Admin settings/configuration is scattered | frontend-backoffice | frontend-backoffice, payment-service |
| ENH-043 | Inventory admin's delete action is a disabled stub | frontend-backoffice | frontend-backoffice, inventory-service |
| ENH-044 | Named per-step pipeline metrics for checkout/saga flow | platform | order-service, inventory-service, payment-service |
| ENH-045 | Recovery console must distinguish unavailable services from an empty DLT queue | frontend-backoffice | frontend-backoffice, order-service, inventory-service, payment-service |
| ENH-046 | Checkout receipt should use the placed order's authoritative total and live workflow/payment state | frontend-site | frontend-site, order-service, payment-service |
| ENH-047 | Redesign responsive storefront and admin headers and navigation presentation | frontend-site | frontend-site, frontend-backoffice |
| ENH-048 | Expand accessibility checks across key routes and mobile layouts | frontend-site | frontend-site, frontend-backoffice |
| ENH-049 | Add User Service persistence, security, and HTTP integration coverage | user-service | user-service, platform |
| ENH-050 | Define cross-replica role/permission cache invalidation | user-service | user-service |
| ENH-051 | Apply endpoint resilience controls consistently across User Service APIs | user-service | user-service, api-gateway, platform |
| ENH-052 | Define User Service account API and controller boundaries | user-service | user-service, api-gateway, frontend-site, frontend-backoffice |
| ENH-053 | Split account, address, and admin user controllers | user-service | user-service, api-gateway, frontend-site, frontend-backoffice |
| ENH-054 | Publish and migrate to the redesigned User Service API contracts | platform | user-service, api-gateway, frontend-site, frontend-backoffice, shopverse-common |
| ENH-055 | Define account and group authorization semantics and audit events | user-service | user-service, auth-service, api-gateway |
| ENH-056 | Remove superseded Accounts/Profile service split proposal | platform | user-service, auth-service |

## Debugging Drills

| ID | Title | Owner | Affected |
|---|---|---|---|
| DRILL-001 | Double-precision money bug | platform | *(not yet seeded)* |

---

Detailed evidence and acceptance criteria for BUG-047-BUG-052 and ENH-049-ENH-051 are in [the User Service audit](docs/user-service-audit.md). The account/API/group/cart redesign task sequence and acceptance criteria are in [the User Service redesign plan](docs/user-service-redesign-plan.md). BUG-046 and other pre-existing account/security tasks are not duplicated.

## Quick counts (2026-11-23) - by Owner

| Owner | Bugs | Features | Enhancements |
|---|---|---|---|
| frontend-site | 6 | 2 | 4 |
| frontend-backoffice | 1 | 6 | 3 |
| order-service | 7 | 3 | 2 |
| inventory-service | 5 | 3 | 3 |
| payment-service | 5 | 2 | 2 |
| auth-service | 1 | 0 | 2 |
| user-service | 7 | 3 | 7 |
| api-gateway | 2 | 1 | 3 |
| **platform** | **19** | **27** | **25** |

`platform` is still the largest owner bucket by far — that's structurally
expected (it owns everything cross-cutting), not a sign the backlog is
unbalanced. If this is used for sprint planning, `platform`-owned items
still need a *second* split (CI/CD vs. infra vs. shared-libraries vs.
multi-service features) before handing the bucket to one person — flagged
previously, not yet done.
