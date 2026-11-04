# ShopVerse Backlog

Single tracker for bugs, feature requests, and enhancements raised during
product-owner/UAT review and the comparative analysis of the Amway-style
checkout/fulfillment/taxation codebase. Companion to [`PROGRESS.md`](PROGRESS.md)
(which tracks ShopVerse's own implemented-vs-pending feature matrix) — this
file tracks actionable work items instead.

## How To Read This

**Priority** (business urgency):

| Level | Meaning |
|---|---|
| Must | Blocks the next milestone or demo |
| Should | Important, not blocking |
| Could | Nice to have, no fixed timeline |

**Severity** (bugs only — impact if unfixed):

| Level | Meaning |
|---|---|
| Critical | Data loss, security exposure, or core flow broken for all users |
| High | Core flow broken for a subset of cases, or silent incorrect data |
| Medium | Degraded experience, workaround exists |
| Low | Cosmetic or edge-case only |

**Status:** Open / In Progress / Fixed / Won't Do

Update status in place as work lands; add new rows at the bottom of each
table rather than reordering, so history stays readable in diffs.

---

## Bugs

| ID | Title | Requirement | Expected Result | Priority | Severity | Status | Source |
|---|---|---|---|---|---|---|---|
| BUG-001 | Checkout only orders the first cart item | Checkout must submit every item in the cart, not just `items()[0]` | An order with N distinct products creates one order with N line items; receipt total matches the full cart | Must | Critical | Resizing — cross-service contract + event-schema + DB migration; effort TBD pending option (a)/(b)/(c) decision. Scope corrected 2026 by Architect review — do not re-commit a sprint estimate until a phased-scope decision is made with Client. | UAT — [checkout-page.component.ts:71](../../shopverse-web/src/app/features/checkout/checkout-page.component.ts:71); scope correction detail in [product-architect/context.md](product-architect/context.md) |
| BUG-002 | Receipt always shows "Pending capture" | Receipt must reflect the real payment status returned by the order/payment APIs | A declined or captured payment shows its actual status, not a hardcoded string | Should | Medium | Open | UAT — [checkout-page.component.ts:96](../../shopverse-web/src/app/features/checkout/checkout-page.component.ts:96) |
| BUG-003 | Checkout unit tests don't cover multi-item carts | Checkout spec must include a multi-item cart case so BUG-001-class regressions fail CI | A test with a 2+ item cart asserts all items appear in the checkout request | Should | Low | Open | Self-review of [checkout-page.component.spec.ts](../../shopverse-web/src/app/features/checkout/checkout-page.component.spec.ts) |
| BUG-004 | `findByOrderNumberForUpdate` fails Spring context load | Repository method name must not be parsed as a derived query when only `@Lock` is intended | Service boots cleanly; `contextLoads()` passes | Must | Critical | **Fixed** | Full backend test run — [InventoryReservationRepository.java](../../services/inventory-service/src/main/java/io/shopverse/inventory_service/repository/InventoryReservationRepository.java) |

---

## Features

| ID | Title | Requirement | Expected Result | Priority | Severity | Status | Source |
|---|---|---|---|---|---|---|---|
| REQ-1 | Tenant creation | Platform admin can create a tenant with ID, name, currency, status | Only a platform admin can create a tenant; non-admin attempts are rejected | Must | — | Open | PO requirements |
| REQ-2 | Tenant data isolation | A tenant's token can never read another tenant's catalog, orders, or users | Cross-tenant ID-guessing attempts return 403/404, covered by an automated test | Must | — | Open | PO requirements |
| REQ-3 | Tenant-scoped catalog and pricing | Same product ID can exist in two tenants with independent prices | Two tenants carrying product 101 at different prices never leak into each other's responses | Must | — | Open | PO requirements |
| REQ-4 | Tenant-aware tracing | Tenant ID present in logs, traces, and Kafka event headers | Any order is traceable end-to-end by tenant + correlation ID | Should | — | Open | PO requirements |
| FEAT-A | ATS (Available-to-Sell) | ATS = on-hand − reserved − safety stock − allocated, computed per location and channel | Two customers racing for the last unit produce exactly one reservation; replay never double-counts; expiry/cancellation restores ATS | Must | — | Open | PO requirements; validated against real Amway fulfillment design |
| FEAT-B | Buy Online, Pick Up In Store (BOPIS) | Store entity (ID, address, hours, stock); pick-up chosen at checkout; order states PLACED → READY_FOR_PICKUP → PICKED_UP, plus expiry/release | Pick-up order reserves stock from the chosen store only; customer gets a pick-up code; associate can verify and complete it | Must | — | Open | PO requirements. **Note:** the real Amway codebase has the *same* gap — pickup-location lookup exists but no ready-for-pickup/code/expiry lifecycle, in either checkout or fulfillment |
| FEAT-C | Guest checkout | Customer can check out without an account using email + address | Guest can look up their order via order number + email (or signed link); cannot see other orders; idempotency keys still apply; can link to an account later | Must | — | Open | PO requirements |
| FEAT-D | Adopt MapStruct for DTO↔entity mapping | Replace hand-written mappers with compile-time generated `@Mapper` interfaces | Unmapped target properties fail the build; existing mapper behavior (null-handling, collections) unchanged per tests | Should | — | Open | Client request; no `mapstruct` dependency exists today in any `build.gradle` |
| FEAT-E | OpenAPI contracts via one `shopverse-contracts` module, namespaced per service | Checked-in OpenAPI contracts and request/response DTOs live in one Gradle module (`shopverse-common/shopverse-contracts`) under per-service packages (`io.shopverse.contracts.order`, `.inventory`, `.payment`, etc.) — each package owned by its corresponding service, not freely shared. Order-service's Order resource redesigned to an enterprise shape (line-items array, address block, audit/traceability fields, status, links) as part of its contract | CI fails if the running API drifts from the checked-in contract; no service edits another service's package; **explicit tripwire:** if a package's DTO change ever forces coordinating a rebuild/redeploy of a service that didn't actually change, split that package into its own module — not before | Should | — | **Next up — active pre-Nov-12 work** | Originally proposed as one `-api` module per service (mirroring Amway's `commerce-checkout-api`/`commerce-tax-api`); revised to one module with per-service packages as a pragmatic middle ground at ShopVerse's current scale, with an explicit split-trigger so this doesn't become permanent shared-kernel coupling by default |
| FEAT-F | Service split: checkout-service | Extract checkout orchestration out of order-service into its own service | Checkout flow behaves identically; order-service keeps only SAGA/order-state ownership | Could | — | Open | Client request item #5; needs an ADR (changes SAGA ownership per AGENTS.md) |
| FEAT-G | Service split: accounts-service / profile-service | Split user-service into identity (auth/accounts) and profile (addresses/preferences) | Existing `/api/v1/users/*` behavior unchanged from the client's perspective | Could | — | Open | Client request items #6–7 |
| FEAT-H | Tax service | New service for tax calculation, called from checkout | Checkout receipt includes a correct tax line; service callable independently | Should | — | Open | Client request item #8 |
| FEAT-I | Promotions service | New service for promotions/pricing rules, called from checkout | Checkout applies a promotion correctly; service callable independently | Should | — | Open | Client request item #9 |
| FEAT-J | Real payment provider adapter | Replace `StubPaymentProvider` with a real/sandbox gateway integration + webhook signature verification | A test payment through the sandbox gateway completes and is reconciled | Must | — | Open | Already tracked in [PROGRESS.md](PROGRESS.md) as priority #1 |
| FEAT-K | Delivery-mode strategy (home delivery, pick-up, etc.) | Replace ad hoc shipping-address-only flow with a real delivery-mode abstraction | Adding a new delivery mode requires no changes to existing modes' code | Should | — | Open | Client request item #11 |
| FEAT-L | Avro event schemas + registry for Kafka choreography | Replace plain-JSON-string Kafka payloads (`KafkaEventParser.parse(payload, X.class)`, no schema enforcement) with Avro + a schema registry enforcing backward/forward compatibility, schemas held in one `shopverse-avro-schemas` module namespaced per service (same pattern as FEAT-E) | A producer/consumer schema mismatch is caught at publish/registry time, not silently at runtime | Should | — | **Next up — active pre-Nov-12 work** | Client request; confirmed as a real pattern in the comparable Amway fulfillment-service (Avro for sales-order events). **Note (Diego Alvarez, Senior Microservices Developer):** not a hard blocker for BUG-001's option (a) fix — a disciplined two-phase backward-compatible JSON rollout works without this. Being done now anyway per the Senior Developer's decision to use the pre-Nov-12 window for foundational work; BUG-001's actual option (a) implementation is a separate, still-unscheduled item — see Elena's note in `product-architect/discussions.md` |
| FEAT-M | Split inventory "reserve" into Allocation (simulate) vs. Reservation (commit) | Mirror the comparable fulfillment-service's explicit split: Allocation evaluates ETAs/available quantities/dispositions without committing; Reservation is the irreversible commit against a request ID | Checkout can show real-time availability (Allocation) without mutating stock, then commit (Reservation) only at order placement | Should | — | Open | Pattern confirmed in `purchaseflow.md`/`glossary.md` of the comparable Amway fulfillment-service; directly relevant to FEAT-A (ATS) |

---

## Enhancements

| ID | Title | Requirement | Expected Result | Priority | Severity | Status | Source |
|---|---|---|---|---|---|---|---|
| ENH-001 | Distributed/explicit lookup cache | Replace local-only Caffeine/in-memory caches with a cache that survives multiple replicas, with explicit TTL and invalidation on admin writes | Catalog/price lookups stay fast; an admin upsert on one replica is visible to all replicas within the TTL | Should | — | Open | Client request item #4; confirmed absent/weak in checkout, fulfillment, and taxation in the real codebase too |
| ENH-002 | Money math in `BigDecimal`, not `double`, on any new tax/pricing code | Any new FEAT-H (tax service) work must never sum or round money as `double`/`float` | A property-based test with repeating decimals (e.g. 0.1 + 0.2 over N lines) produces an exact, correctly-rounded result | Must | High (as a design constraint) | Open | Observed real bug in the comparable taxation service: `mapToDouble(...).sum()` drops configured rounding |
| ENH-003 | Consistent idempotency header naming | Pick one header name (e.g. `Idempotency-Key`) and use it everywhere instead of multiple variants | grep for idempotency header names returns exactly one constant across the codebase | Could | — | Open | Observed in comparable codebase: `Idempotency-Key`, `X-Idempotency-Key`, `Idempotent-Response` all coexist |
| ENH-004 | Fail-closed on downstream errors, not fail-open-as-business-outcome | A 5xx from a downstream (e.g. pickup-location, tax) must surface as a service error, never get mapped to a false business result like "not available" | Simulated 503 from a downstream dependency produces a 5xx/retry to the client, not a silent "item unavailable" | Should | — | Open | Observed real bug pattern: pickup-location 5xx mapped to "pickup not available" |
| ENH-005 | AsyncAPI contracts for Kafka events | Document event schemas (order/inventory/payment topics) as checked-in AsyncAPI specs, mirroring FEAT-E for REST | A schema change to any event requires a corresponding AsyncAPI diff reviewed in the same PR | Could | — | Open | Client follow-up ("other things") — proposed, pending confirmation |
| ENH-006 | RFC 9457 `application/problem+json` audit | Verify `shopverse-common-error`'s `ApiErrors` actually conforms to RFC 9457 and is used consistently across all 5 services | A sampled error response from each service matches the RFC 9457 shape | Could | — | Open | Client follow-up ("other things") — proposed, pending confirmation |
| ENH-007 | Rename `io.shopverse.platform.*` package/group to `io.shopverse.common.*` | `shopverse-platform/` was renamed to `shopverse-common/` at the folder/build-wiring level only; the Maven group (`io.shopverse.platform`) and every Java package under it still say `platform`, mismatching the folder name | Every `build.gradle` coordinate and every `package`/`import` statement across all starter modules and consuming services says `io.shopverse.common`; all services still compile and pass tests | Could | — (cosmetic — folder/group/package mismatch has zero functional impact, already verified working) | Open | Deliberately deferred 2026-11-05: doing it now would force editing files that currently hold in-progress contract-migration work (e.g. `OrderController.java` imports `io.shopverse.platform.observability.CorrelationConstants`). Do as its own isolated pass once that WIP is committed, not bundled with other work |

---

## Debugging Drills (not bugs — intentional practice)

Tracked separately since these are deliberately seeded, not discovered. Use
[`ai-workflows/prompts/debug-distributed-checkout.md`](ai-workflows/prompts/debug-distributed-checkout.md)
or [`ai-workflows/prompts/incident-investigation.md`](ai-workflows/prompts/incident-investigation.md)
as the investigation format.

| ID | Pattern | Status |
|---|---|---|
| DRILL-001 | Double-precision money bug (modeled on ENH-002's real-world counterpart) | Not yet seeded |
