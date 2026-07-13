---
title: Current Problems And Solutions
last_reviewed: "2026-07-13"
status: "maintained"
---

# Current Problems And Solutions

This page tracks the current Shopverse implementation problems, the solution
already applied, and the remaining hardening work. Use it to understand what is
solved, what is partially solved, and what still needs production-grade follow-up.

## Runtime And Business Workflow

| Status | Problem | Current solution | Remaining hardening |
|---|---|---|---|
| Solved baseline | Checkout spans Order, Inventory, and Payment databases | choreography SAGA, local transactions, transactional outbox, compensation events, and queryable order timeline | add contract tests that replay every SAGA transition |
| Solved baseline | Checkout retry could create duplicate orders | mandatory `Idempotency-Key`, same-customer lookup, and database uniqueness | expose idempotency outcome metadata in API responses |
| Solved baseline | Cancelled orders could leave Inventory stock reserved | Order emits `OrderCancelledEvent`; Inventory consumes it and releases the reservation | add end-to-end Kafka cancellation compensation test |
| Solved baseline | Checkout lacked durable delivery details | User address book plus immutable Order shipping snapshot | add address validation and country/state normalization |
| Solved baseline | Customer cart was browser-only | User Service persisted cart APIs plus Angular local-to-account cart merge | add inventory-aware cart validation before checkout |
| Solved baseline | Product detail and related products required broad catalog reads | Inventory public detail, category, and related-product APIs | add search, pagination, filtering, and recommendation scoring |
| Solved baseline | Customer payment retry/refund and return actions were placeholders | owner-protected payment retry/refund APIs and order return-request endpoint | add richer refund policy, refund audit trail, and return approval workflow |
| Solved baseline | Operations could not progress fulfillment | admin pack, ship/out-for-delivery, and deliver transitions | add carrier/tracking number, shipment events, and delivery proof |
| Partial | Payment timeout leaves customer uncertainty | payment query, retry, admin reconcile, refund APIs, and timeline visibility | integrate a real provider and reconciliation job |
| Partial | Provider callback surface was missing | payment webhook baseline endpoint | add provider signature verification, replay protection, and provider-specific adapter |
| Partial | Reservation expiry is single-worker baseline | scheduled expiry restores stock after TTL | implement multi-replica atomic claim and late-payment refund choreography |

## API, Security, And Ownership

| Status | Problem | Current solution | Remaining hardening |
|---|---|---|---|
| Solved baseline | A customer JWT could be used to guess another customer's order/payment ID | owner-or-admin checks in Order and Payment APIs | add negative authorization tests for every customer-owned endpoint |
| Solved baseline | Account details were read-only in the UI | `GET/PUT/PATCH /api/v1/users/me` plus Angular account editing | add field-level validation messages and profile history if required |
| Solved baseline | Address book was missing from customer account | `GET/POST/PUT/DELETE /api/v1/users/me/addresses` | add default-address constraints and richer address formats |
| Solved baseline | Admin inventory images needed a backend surface | `POST /api/v1/inventory/admin/items/{productId}/image` stores media through MinIO-backed Inventory flow | add image size/type policy and image cleanup for replacements |
| Solved baseline | Catalog cache could become stale after inventory changes | `POST /api/v1/orders/admin/catalog-cache/evict` | replace manual eviction with event-driven cache invalidation |
| Partial | Webhook endpoint is public by necessity | endpoint is isolated under `/api/v1/payments/webhooks/provider` | require provider signatures and idempotent event storage before production payment use |

## Reliability And Recovery

| Status | Problem | Current solution | Remaining hardening |
|---|---|---|---|
| Solved baseline | Domain state could commit while outgoing Kafka event was lost | transactional outbox row is inserted atomically with domain state | continue adding outbox coverage to new business flows |
| Solved baseline | Poison Kafka events could block progress | retry topics, DLT persistence, and replay endpoints | add operator runbooks and replay safety checks |
| Solved baseline | Outbox database lock was held while waiting for Kafka | short claim and finalization transactions | measure lock wait under higher concurrency |
| Solved baseline | Worker crash could strand a claimed outbox event | timestamped claims and stale-claim recovery | add alerting for old claimed rows |
| Solved baseline | Inventory outage returned product-not-found semantics | explicit dependency failure mapped to service-unavailable behavior | add customer-facing degraded-state messaging across all dependent flows |
| Partial | Some recovery operations are admin-only but manual | admin dead-letter list/replay APIs exist for Order, Inventory, and Payment | add guided admin UI flows and replay audit approvals |

## Frontend And Customer Experience

| Status | Problem | Current solution | Remaining hardening |
|---|---|---|---|
| Solved baseline | Customers had unclear feedback when backend services were slow/unavailable | global network/service degraded banner | add service-specific degradation messaging |
| Solved baseline | Product images could slow catalog rendering | lazy product images, responsive dimensions, and fallbacks | serve optimized image variants from object storage/CDN |
| Solved baseline | Checkout success lacked operational transaction details | post-checkout transaction card with order number, transaction ID, idempotency key, correlation ID, and copy actions | align transaction metadata with final payment provider fields |
| Solved baseline | Long admin tables required excessive scrolling | reusable paginated table controls | add server-side pagination for very large datasets |
| Partial | UI polish is broad and ongoing | shared components, common styles, admin/customer layouts, breadcrumbs, and empty states | complete visual QA on mobile/tablet and production Lighthouse budget |

## Build, Docker, And Verification

| Status | Problem | Current solution | Remaining hardening |
|---|---|---|---|
| Solved baseline | Parallel Docker builds shared Gradle cache metadata | unique BuildKit cache ID per service | monitor cache size and invalidation behavior |
| Solved baseline | JAR ownership changed in a later immutable image layer | `COPY --chown` and targeted log-directory ownership | keep image layer checks in CI |
| Solved baseline | Build tooling could remain in deployable images | separate JDK build and JRE runtime stages | consider custom JRE only after measurement |
| Solved baseline | Container processes could run as root | dedicated non-root `shopverse` user | enforce with image policy checks |
| Solved baseline | Verification commands could run indefinitely | bounded scripts with global deadlines and process-tree termination | run bounded checks in CI for every PR |
| Solved baseline | Windows web probe produced false failures | bounded `curl.exe` status and content checks | keep OS-specific smoke scripts separate |
| Solved baseline | Config Server exported irrelevant traces during isolated tests | zero sampling in isolated test Compose profile | keep test-only tracing settings out of production profiles |

## Current Verification Status

The latest local verification for the documented API-contract update:

| Area | Command | Result |
|---|---|---|
| User Service | `.\gradlew.bat test --no-daemon` | passed |
| Order Service | `.\gradlew.bat test --no-daemon --console=plain` | passed |
| Inventory Service | `.\gradlew.bat test --no-daemon` | passed |
| Payment Service | `.\gradlew.bat test --no-daemon` | passed |
| Docs changed-page validation | `npm.cmd run check:docs:changed` | passed |

## Related Pages

- [Problems Summary And Links](./PROBLEMS-SUMMARY-LINKS.md)
- [Runtime Reliability Problems](./RUNTIME-RELIABILITY-PROBLEMS.md)
- [Multi-Replica Reservation Expiry](./runtime/MULTI-REPLICA-RESERVATION-EXPIRY.md)
- [Payment Timeout Reconciliation](./runtime/PAYMENT-TIMEOUT-RECONCILIATION.md)
- [API Guide](../../development/API-GUIDE.md)
- [Complete Shopverse Demo](../../case-study/COMPLETE-DEMO.mdx)
