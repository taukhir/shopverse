# Elena Vasquez — Project Knowledge

Append-only. Newest entries at the bottom. Don't rewrite past entries.

## Baseline architecture

ShopVerse is a local-first Docker Compose microservices commerce POC.
Services: `api-gateway` (8080), `auth-service` (8081), `user-service`
(8082), `order-service` (8083), `payment-service` (8084),
`inventory-service` (8086), `discovery-server` (8761, Eureka),
`config-server` (8888). Shared cross-cutting code in `shopverse-platform/`
(outbox, Kafka, Kafka-recovery/DLT, security, observability starters).
Frontend is Angular 22 (`shopverse-web/`, standalone components, signals,
zoneless change detection, OnPush).

Checkout uses Kafka choreography SAGA, not synchronous Order→Inventory→
Payment calls. Order persists state + outbox intent in one local
transaction (transactional outbox pattern), then Kafka drives Inventory
and Payment asynchronously. `shopverse-kafka-recovery-starter` backs DLT +
replay for all three services.

Known pre-existing gaps (full matrix in `../PROGRESS.md`): no real
payment gateway (`StubPaymentProvider`), no reviews/wishlist/coupons/tax/
multi-currency, no server-side search, no transactional consumer inbox for
Kafka dedup, local-only caches (no Redis).

## BUG-004 (fixed): inventory-service failed to boot

`InventoryReservationRepository.findByOrderNumberForUpdate(String)` had
`@Lock(PESSIMISTIC_WRITE)` but no `@Query`, so Spring Data tried to derive
the query from the method name and choked on the `ForUpdate` suffix,
throwing `PropertyReferenceException` and failing the whole Spring context.
Fixed by adding an explicit `@Query`. See
`inventory-service/src/main/java/io/shopverse/inventory_service/repository/InventoryReservationRepository.java`.

## BUG-001 — verified technical facts (read before touching checkout)

1. `order-service/src/main/java/io/shopverse/order/dto/CheckoutRequest.java:11`
   — `@NotEmpty @Size(max = 1) List<@Valid CheckoutItemRequest> items`. The
   backend API itself rejects more than one item.
2. `OrderCreatedEvent.java` carries a single `productId`/`quantity`, built
   from `saved.getItems().getFirst()` in `OrderServiceImpl.java:110-111`.
   This is the Kafka event that drives inventory reservation. Its `amount`
   field is the **order's full total**, not a per-item amount
   (`saved.getTotalAmount()`).
3. `InventorySagaTransactionService.java:20-25` reserves exactly the one
   product from that event. `InventoryReservedEvent` carries the same
   single-item shape onward to payment-service, also with the order's full
   total as `amount`.
4. `InventoryReservation.orderNumber` is `@Column(unique = true)` — a
   database-level constraint. Only one reservation row per order can exist
   today; multi-item support needs a Liquibase migration (likely to a
   unique constraint on `(orderNumber, productId)` instead).
5. What's already fine: `OrderEntity.addItem()` accumulates `totalAmount`
   correctly across multiple calls — the order aggregate itself is
   multi-item-capable. The limitation is the checkout API contract and the
   Kafka choreography, not the order entity.

## Full platform knowledge briefing

**Documentation site:** `../../documentation/` is a Docusaurus site (local:
`cd documentation && npm start`; live at taukhir.github.io/shopverse).
Important: most of its ~875 files are a *generic backend-engineering
learning portal* (Java, Spring, Kafka, databases, leadership, etc.) —
reusable material, not ShopVerse-specific. The ShopVerse-specific content
is concentrated in `documentation/docs/architecture/` (including
`adr/` — 4 ADRs: 001 gateway-discovery-config, 002
kafka-choreography-saga, 003 jwt-jwks-security, 004 observability-stack),
`documentation/docs/case-study/` (`COMPLETE-DEMO.mdx` is the end-to-end
runbook), `documentation/docs/reference/` (`FEATURES-AND-DEMOS.md` splits
into `FEATURES-SECURITY-CHECKOUT.md` and
`FEATURES-RELIABILITY-OBSERVABILITY.md` — the project's own authoritative
Implemented/Partial/Planned status pages), and
`documentation/docs/services/`. Don't assume a doc page is ShopVerse-
specific just because it's in the site — check which folder it's in.

**Implemented capabilities (from README + verified code):** RSA-signed JWT
+ JWKS + role/permission/ownership authorization; API Gateway + Eureka
discovery + LoadBalancer + Feign; independent MySQL schema per service via
Liquibase + JPA; idempotent checkout with immutable shipping snapshot and
persistent order timeline; optimistic inventory locking, reservation
expiry, cancellation release, payment compensation; customer address book
+ persisted cart; customer/admin order cancellation, payment retry/refund,
return request, fulfillment transitions; public catalog with category/
related-product/MinIO images; Kafka choreography with retries, DLT
persistence, replay audit, transactional outbox; Resilience4j RateLimiter/
Bulkhead/Retry/CircuitBreaker; structured JSON logs, correlation
propagation, Prometheus/Grafana/Zipkin; JUnit/Mockito/Spring test slices/
Testcontainers; Docker Compose/GitHub Actions/Jenkins.

**Known gaps (full matrix in `../PROGRESS.md`):** no real payment
gateway (`StubPaymentProvider`, no webhook signature verification); no
reviews/ratings, wishlist, coupons/discounts, tax calculation, multi-
currency; no server-side search (Elasticsearch is documented as future
work only); no notification/email service; no transactional consumer
inbox (Kafka dedup via state checks only, not a formal inbox pattern); no
distributed cache (local Caffeine only, won't stay consistent across
replicas); no full OAuth2 authorization server (custom JWT issuance, no
audience validation, no refresh rotation); admin audit trail covers User
Service only, not Order/Inventory/Payment/DLT recovery; frontend has no
i18n, no dark mode, no payment-method-selection UI, no guest checkout; 94
frontend component unit tests were added this engagement (previously ~0).
**BUG-001 is the newest-found gap:** checkout is single-item end-to-end at
the API contract, Kafka event, and DB-constraint layers — see the
dedicated section above.

## Enterprise architecture reference (external, from comparable Amway codebase)

Senior Developer pointed me at real docs from the comparable Amway
checkout/fulfillment/taxation codebase
(`D:\BE Projects\checkout\fulfillment\commerce-fulfillment-dataservice\docs\`).
Confirmed real patterns worth adopting, now tracked as `BACKLOG.md`
FEAT-E (generalized), FEAT-L, FEAT-M:

- **Per-domain `-api` contract module**, not a shared cross-service DTO
  module. The real codebase has `commerce-checkout-api`,
  `commerce-tax-api` — one contract module per domain, not one shared
  module across domains. Corrected the Senior Developer's initial
  "one shopverse-rest-api for everyone" proposal on this basis — that
  would violate this repo's own "each service owns its data" invariant.
- **Allocation vs. Reservation as distinct concepts** (`purchaseflow.md`,
  `glossary.md`): Allocation simulates sourcing without committing;
  Reservation is the irreversible commit. ShopVerse's inventory-service
  conflates these into one `reserve()` call today.
- **Avro for event schemas**, confirmed as a real pattern in the
  comparable fulfillment-service (Avro for sales-order events), not just
  a nice-to-have. Directly relevant to the `OrderCreatedEvent`
  multi-item redesign question BUG-001 raises.
- **"Fixed forward" as an explicit written assumption**
  (`assumptions.md`): the comparable system documents that an order is
  placed even if reservation fails. ShopVerse should have equivalently
  explicit, written assumptions rather than implicit undocumented
  behavior.

## EOM design finalization (discussion-06) — real external reference + cross-tool coordination

Reviewed the real Amway `checkout-eom-rest/v1/openapi-rest.yml` contract
directly. Key structural facts worth remembering: `SalesOrder` envelope
= `id`/`countryIsoCode`/`eventInfo`/`entity`/`orderEventStatus`+
`orderEventStatusReason`/`isBinary`/`retry`. `OrderLine` tracks 8
separate quantity states (ordered/allocated/unallocated/pending/shipped/
cancelled/backordered/returned) plus per-line `fulfillmentType` and
per-line dates. `Entity` (order header) is ~90 fields, dominated by
Amway-specific PV/BV/ABO/commission/subscription fields — not a generic
pattern, explicitly rejected for ShopVerse.

**Cross-tool coordination note:** `AGENTS.md` now names Codex (a separate
AI session) as the team's Product Manager, maintaining
`Team/product-manager/`. That folder already held real, non-duplicate
engineering analysis (outbox publisher uses `KafkaTemplate<String,String>`,
saga listener parses `String` via `KafkaEventParser` including retry/DLT
paths) and caught two real issues in this session's own draft: an
overclaim (`eventId` alone isn't dedup) and a genuine tension (shared
Avro module vs. `AGENTS.md`'s "event records copied per service"
convention — resolved as "shared schema source, independently compiled
per service," preserving the convention). Read Codex's files for
continuity; did not write to them — same ownership principle Diego
applies to the Senior Developer's discussion-03.

## New finding (meeting round 2) — payment dedup risk under option (b)/(c)

If order-service is changed to emit one `OrderCreatedEvent` per line item
(same `orderNumber`, different `productId`/`quantity`) to avoid an
event-schema break, and each one carries the order's full `amount` (as
today's single-item event does), then N successfully-reserved items would
produce **N separate `InventoryReservedEvent`s for one order**, each
carrying the full order total, flowing to payment-service.

`payment-service/AGENTS.md` states: "A duplicate `InventoryReserved` event
must not create or complete payment more than once for the same business
operation." **Not yet verified: does the existing dedup guard protect
against multiple *distinct* reservation events for the same order (i.e.
keyed on orderNumber), or only against duplicate *delivery* of the *same*
event (i.e. keyed on a Kafka-level dedup/offset)?** These are different
guarantees. If it's the latter, a naive per-item-event design could trigger
duplicate payment processing — a real production risk, not a hypothetical
one. This must be checked in `PaymentSagaTransactionService` /
`PaymentSagaListener` and its persistence layer before option (b) or any
phased variant of it is approved.

## 2026-11-04 — Team coordination update

Tauqeer reassigned Codex from Product Manager to Senior Solutions Architect. Current memory: ../senior-solutions-architect/index.md; old product-manager paths are historical pointers. Elena remains Product Architect. A separate Cybersecurity Engineer agent is now assigned an initial independent Order REST review; see ../cybersecurity-engineer/index.md. This updates current role routing without changing the earlier meeting history.
