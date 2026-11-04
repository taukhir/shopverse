# ShopVerse Progress Tracker

Implemented vs. pending status, verified against source code on 2026-09-11
(not only against documentation claims — see methodology note at the bottom).
For narrative status labels the project already maintains, see
`documentation/docs/reference/FEATURES-SECURITY-CHECKOUT.md` and
`FEATURES-RELIABILITY-OBSERVABILITY.md`; this file adds a code-verified,
feature-shaped view (including gaps those pages don't frame as a checklist)
and is meant to be updated as work lands.

## How To Read This

- **Done** — implemented and traceable to real code.
- **Partial** — a real baseline exists but a meaningful piece is missing.
- **Missing** — no implementation found anywhere in the codebase.

## Core Commerce Flow

| Feature | Status | Evidence |
|---|---|---|
| Auth (login, RSA JWT, JWKS) | Done | `auth-service` `AuthController` (`/auth/login`, `/auth/.well-known/jwks.json`) |
| User accounts, roles, permissions | Done | `user-service` `UserController`, `RoleController`, `PermissionController` |
| Address book | Done | `user-service` `/api/v1/users/me/addresses/*` |
| Persisted cart | Done | `user-service` `CartController` |
| Product catalog (browse, detail, category, related) | Done | `inventory-service` `InventoryController` public endpoints |
| Checkout (idempotent, shipping snapshot, SAGA) | Done | `order-service` `OrderController` + `OrderSagaListener` |
| Order timeline / audit trail | Done | `OrderTimelineEvent`, `/api/v1/orders/{id}/timeline` |
| Order cancellation, return request | Done | `order-service` customer endpoints |
| Admin fulfillment (pack/ship/deliver/cancel) | Done | `order-service` admin endpoints |
| Inventory reservation + expiry | Partial | TTL + release-on-cancel/failure exist; atomic multi-replica claim and the successful-payment terminal transition are still open (project's own FEATURES doc) |
| Payment intent/retry/refund | Partial | Endpoints exist and function; backed by `StubPaymentProvider` — no real gateway |
| Payment provider integration (Stripe/PayPal/etc.) | Missing | No provider SDK anywhere; only a named stub with a simulation-mode toggle |
| Payment webhook signature verification | Missing | Webhook endpoint exists; signature verification not implemented |
| Cross-service admin audit trail | Partial | Implemented for User Service only; not yet extended to Order/Inventory/Payment/DLT recovery |

## Search, Discovery & Merchandising

| Feature | Status | Evidence |
|---|---|---|
| Category filter | Done | `inventory-service` categories endpoint |
| "Related products" | Partial | Simple lookup, not scored/ranked — `InventoryController.java:71-74` |
| Server-side full-text search / Elasticsearch | Missing | Not wired anywhere in code; explicitly listed as future work in `services/inventory-service/README.md:111` |
| Client-side catalog search filter (frontend) | Done | `catalog-page.component.html` search input, filters already-loaded catalog |
| Recommendation engine | Missing | No scoring/ML component; only the basic "related" lookup |
| Product reviews / ratings | Missing | No entity, controller, or UI found |
| Wishlist / saved items | Missing | No backend model; frontend has an explicit placeholder: "Wishlist-style cart parking is ready for a backend model... once product favorites or saved carts exist" (`cart-page.component.html:68-69`) |
| Coupons / discount codes | Missing | No code anywhere in backend or frontend |
| Tax calculation | Missing | No implementation |

## Checkout & Payment UX

| Feature | Status | Evidence |
|---|---|---|
| Payment method selection (card/UPI/wallet) | Missing | Checkout page shows placeholder copy: "Payment method: Card / UPI / Wallet later" (`checkout-page.component.html:71,86,135-138`) |
| Guest checkout | Missing | `checkout` route is `authGuard`-protected; login/registration required |
| Multi-currency | Missing | Only a `BigDecimal` rounding comment mentions "currency"; no currency feature |
| Shipping-provider integration (carrier API) | Missing | Address snapshot and internal ship/deliver state transitions exist; no external carrier integration |
| Notification/email service (order confirmations, etc.) | Missing | No email-sending code in any service |
| In-app notifications/toasts | Done | `toast.service.ts`, `toast-outlet.component`, dedicated notifications page |

## Platform / Reliability

| Feature | Status | Evidence |
|---|---|---|
| Transactional outbox | Done | `shopverse-outbox-starter`, used by order/inventory/payment |
| Kafka retries + DLT persistence + replay | Done | `shopverse-kafka-recovery-starter`, `*RecoveryController`s |
| Transactional consumer inbox / event-ID dedup | Missing | Current consumers use state checks/constraints, not a formal inbox — project's own roadmap item |
| Distributed cache (Redis) | Missing | Current caches are local/in-process (Caffeine); planned only if a real multi-replica consistency need is demonstrated |
| Full OAuth2 Authorization Server (refresh rotation, audience validation, service identities) | Missing | Current login is custom JWT issuance without an audience validator |
| Resilience4j (RateLimiter/Bulkhead/Retry/CircuitBreaker) | Done | Annotation-based, per project README |
| Observability (logs, metrics, traces, dashboards) | Done | Prometheus, Grafana, Loki/Promtail, Zipkin, structured JSON logs |
| AI Incident Investigator (timeline+Loki+Zipkin+Prometheus+outbox+DLT synthesis) | Missing | Documented as planned only |

## Frontend (Angular)

| Feature | Status | Evidence |
|---|---|---|
| Storefront, product detail, cart, checkout, order history/detail | Done | routes in `app.routes.ts` |
| Admin console (users, orders, inventory, payments, recovery, activity) | Done | operational CRUD tooling |
| Admin analytics/metrics dashboard (charts) | Missing | Admin views are operational, not analytics |
| Accessibility (aria attributes, axe checks) | Done | 16+ files with `aria-*`; `npm run a11y` gate exists |
| i18n / multi-language | Missing | No i18n/ngx-translate usage found |
| Dark mode | Missing | No theme-toggle code found |
| Component-level unit tests (`.spec.ts`) | Partial | Added Vitest specs for all core/shared logic (cart, session, guards, interceptor, toast, confirm, network-status, idle-preload, image-fallback directive) plus `CatalogService` and `CheckoutPageComponent` — 94 tests, ~5s. Thin CRUD components (admin/account/orders pages) still rely on Playwright e2e only, by design (little logic to isolate) |

## Recommended Priority (highest leverage first)

1. **Payment gateway integration + webhook signature verification** — the single biggest gap between "demo" and "usable POC"; everything downstream (refunds, reconciliation) currently rests on a stub.
2. **Payment method selection + guest checkout in the UI** — cheap, high-visibility UX gaps for anyone evaluating the storefront.
3. **Reviews/ratings and wishlist** — most commonly expected commerce features that are entirely absent; frontend already has a wishlist placeholder acknowledging this.
4. **Server-side search (Elasticsearch)** — already documented as intended; closes the gap between the "commerce reference app" framing and actual catalog UX at scale.
5. **Transactional consumer inbox (event-ID dedup)** — closes a real correctness gap in the choreography (duplicate delivery is currently handled only by ad hoc state checks).
6. **Component-level frontend unit tests** — current strategy is e2e-only, which is slow to run and weak at isolating regressions in individual components.
7. **Coupons/discounts, tax calculation, multi-currency** — expected for a "commerce" app but plausibly out of scope for a distributed-systems-focused portfolio piece; worth an explicit scope decision rather than silent omission.

## Methodology Note

This file was produced by reading actual controllers, entities, Kafka
listeners, and frontend components/routes across all services (not by
summarizing existing docs), then cross-checked against the project's own
self-reported `Partial`/`Planned` items in
`documentation/docs/reference/FEATURES-*` and
`documentation/docs/services/SERVICE-README-AI-CAPABILITY-GAP-MATRIX.md`.
Re-verify specific rows before relying on them for release decisions — this
is a snapshot, not a live system.

To refresh this file, run the
[Audit progress tracker](ai-workflows/prompts/progress-audit.md) workflow
rather than hand-editing status labels without re-checking the code.
