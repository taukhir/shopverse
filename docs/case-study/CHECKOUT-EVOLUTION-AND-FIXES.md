# Checkout: Evolution And Fixes

This page tracks how ShopVerse's checkout/order-placement contract and
implementation evolved, and the concrete problems found and fixed along the
way. It is scoped to checkout and order placement only — see
[Problems and solutions](https://taukhir.github.io/shopverse-docs/reliability/PROBLEMS-AND-SOLUTIONS)
for the platform-wide list.

## Contract Evolution

### 1. Single-call checkout (original)

`POST /api/v1/orders/checkout` validated items/address, created the Order,
and started the Kafka choreography SAGA — all in one call. Idempotent via a
required `Idempotency-Key` header, but gave the customer no way to see
totals or confirm before the order (and the SAGA) actually started.

### 2. Stateless review (intermediate)

Added `POST /api/v1/orders/checkout/review`: validated items/address against
the live catalog and returned computed totals, with no persistence, no
order, and no SAGA — a pure quote. The original `/orders/checkout` call
remained the real "place order" step. This closed the "see totals before
committing" gap but still gave no way to recover from a conflict, since
nothing about the reviewed quote was durable.

### 3. Persisted Checkout resource (current)

Replaced both of the above with a dedicated, persisted `Checkout` resource:

- `POST /api/v1/checkouts` — creates a priced, versioned, expiring quote
  (`checkoutId`, `version`, `expiresAt`). No order, no SAGA yet.
- `GET /api/v1/checkouts/{checkoutId}` — fetches the current checkout state;
  the recovery path for a stale-version or expired-quote conflict.
- `PUT /api/v1/checkouts/{checkoutId}` — re-validates items/address, bumps
  `version`, and always refreshes `expiresAt` (including on a previously
  expired checkout — a `PUT` is by definition a fresh quote).
- `POST /api/v1/checkouts/{checkoutId}/place-order` — confirms the exact
  reviewed version, creates the Order, and starts the SAGA exactly as the
  original single-call endpoint did. Idempotent per `Idempotency-Key`, scoped
  to the checkout; replaying the same key returns the original order even
  past expiry.

A stale `checkoutVersion`, an expired unplaced checkout, or reusing a
different key on an already-placed checkout returns `409`, each with a
distinct error message so the client can tell them apart.

## Problems Found And Fixed

### BUG-013 — Checkout SAGA ignored inventory events for newly created orders

`OrderEntity`'s constructor left every new order at `ORDER_CREATED`, and
nothing assigned `PENDING_INVENTORY` — so the saga guards that gate on that
status silently no-op'd, and a real checkout never reached a terminal state.
Fixed by assigning `PENDING_INVENTORY` in `checkout()` before enqueuing the
outbox event. See
[Order Status Dead-Transition Problem](https://taukhir.github.io/shopverse-docs/reliability/problems/ORDER-STATUS-DEAD-TRANSITION-PROBLEM)
for the full root-cause writeup.

### No way to recover from a checkout conflict (fixed)

Before `GET`/`PUT /api/v1/checkouts/{checkoutId}` existed, a 409 on
place-order (stale version, expired quote, already placed) left the customer
stuck resubmitting the same stale request — it would just 409 again. The
frontend now classifies the three conflict cases from the response detail
and recovers automatically: a stale version re-fetches the current checkout
via `GET`, an expired quote re-prices via `PUT`, and an already-placed
checkout clears the stale review and points the customer at their order
history — each with its own, distinct message instead of one generic
"conflict" string.

### BUG-002 — Receipt always showed "Pending capture" regardless of actual order status

The checkout page's post-purchase receipt hardcoded `paymentStatus: 'Pending
capture'` unconditionally. Fixed by deriving the label from the real order
status returned by `place-order` (`CONFIRMED`/`PACKING`/... → "Captured",
`PAYMENT_FAILED` → "Failed", `PAYMENT_PROCESSING` → "Processing",
`CANCELLED` → "Cancelled", anything else → "Pending capture").

### Stale documentation referencing the removed single-call endpoint

Several docs and runbooks still referenced the removed
`POST /api/v1/orders/checkout` after the persisted-checkout migration,
including runnable demo scripts and architecture sequence diagrams that
would have 404'd if followed literally: `shopverse-web/README.md`,
`services/order-service/README.md`, `docs/development/API-GUIDE.md`,
`docs/case-study/DEMO-SEED-CHECKOUT-SAGA.md`,
`docs/case-study/DEMO-IDEMPOTENCY-OUTBOX-RECOVERY.md`,
`docs/case-study/SHOPVERSE-ARCHITECTURE-CURRENT-STATE.md`,
`docs/observability/SHOPVERSE-OBSERVABILITY-OPERATIONS.md`,
`infra/observability/README.md`, and `saga/README.md`. Fixed by updating
every reference to the real two-step `/api/v1/checkouts` +
`/api/v1/checkouts/{checkoutId}/place-order` flow.

## Still Open

- **BUG-001** — checkout only ever submits the first cart item
  (`cart.items()[0]`), never the full multi-item cart. Deliberately left
  blocked: the backend option (contract shape for multi-item checkout) is
  still an open product decision, and the frontend multi-item UI is blocked
  on that landing first.
- **BUG-003** — checkout unit tests don't cover multi-item carts. Tied to
  BUG-001; moot until that's unblocked.
- The richer `Problem` error shape (machine-readable `code`, `correlationId`,
  `fieldErrors`) proposed during contract design remains a separate,
  platform-wide item — today's checkout conflicts still use the real
  `ProblemDetail` shape (`type`/`title`/`status`/`detail`) shared by every
  service.
