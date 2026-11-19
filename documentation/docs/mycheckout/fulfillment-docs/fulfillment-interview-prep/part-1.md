---
slug: /mycheckout/fulfillment-docs/fulfillment-interview-prep/part-1
title: "mycheckout — Fulfillment: Interview Prep Guide — Part 1"
mdx:
  format: md
difficulty: Advanced
page_type: Reference
status: maintained
scope: generic
owner: docs-mycheckout
reviewer: documentation-maintainers
review_evidence: imported-source-documentation-link-and-build-check
last_reviewed: "2026-11-16"
---

# mycheckout — Fulfillment: Interview Prep Guide — Part 1

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `fulfillment docs/FULFILLMENT-INTERVIEW-PREP.md` |
| Source SHA256 | `d7d34dfba3e369822088d37fe08b7a41eb8c28450b1b737c08d5a7a3726f77d8` |
| Guide part | 1 of 3 |

[Part 1](/mycheckout/fulfillment-docs/fulfillment-interview-prep/part-1) · [Part 2](/mycheckout/fulfillment-docs/fulfillment-interview-prep/part-2) · [Part 3](/mycheckout/fulfillment-docs/fulfillment-interview-prep/part-3)

## Fulfillment: Interview Prep Guide {#fulfillment-interview-prep-guide}

<a id="shared-621d0c75fdbf"></a>

Purpose: let you explain the fulfillment domain end to end and answer follow-up questions with confidence. It complements [FULFILLMENT-END-TO-END.md](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-1) (the full reference) and corrects a few things I said earlier (see [section 11](/mycheckout/fulfillment-docs/fulfillment-interview-prep/part-2#11-corrections-to-earlier-explanations)).

<a id="shared-58c300e40605"></a>

**Visual walkthrough added 2026-11-12:** [architecture, reservation sequence, provider flow, stepwise answers and code examples](/mycheckout/fulfillment-docs/fulfillment-interview-prep/part-3#17-visual-interview-walkthrough). The diagrams distinguish NEXTGEN ledger behavior from Manhattan behavior.

<a id="shared-119898d6c2dd"></a>

For the 2026-10-26 reverse-engineering inventory, see [the reference](/mycheckout/fulfillment-docs/fulfillment-reverse-engineering/part-1) and [API catalog](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1). They distinguish 86 contract operations from concrete implementation matches, and expand fee maintenance, warehouses, disabled legacy feeds, storage and failure behavior.

<a id="shared-a829dd14f68a"></a>

For Redis and delivery-fee depth with worked examples and rapid-fire probes, see [FULFILLMENT-REDIS-AND-DELIVERY-FEE.md](/mycheckout/fulfillment-docs/fulfillment-redis-and-delivery-fee/part-1).

<a id="shared-586ccade4d08"></a>

Evidence labels: *(code)* = read from source on 2026-10-22. *(docs)* = from the older notes, not re-verified. *(unverified)* = inference, say so in an interview rather than assert it.

---

## 1. The 60-second pitch {#1-the-60-second-pitch}

<a id="shared-8b035f4e62d0"></a>

> Fulfillment is the NextGen Commerce domain that answers three questions for checkout: **can we ship this (ATS)?**, **where can the customer pick it up (service locations)?**, and **what does delivery cost (delivery fee)?** It is split into an app service (façade), a data service (business logic and storage), an event service (Kafka consumers/producers) and a job service (batch loaders). Inventory comes from AS400 over Kafka as Protobuf, is written as an append-only versioned ledger in Postgres, and availability is **calculated at read time**, never stored. Reservations are counters on that ledger. Pickup locations live in DynamoDB with a Redis geo index. Delivery fees are rule tables on service levels, selected by effective date, user type, order type and a threshold on the order total.

<a id="shared-830efff84ff4"></a>

Say the **two caveats** up front: (1) the ledger design applies to markets configured `ats-service: nextgen` (Japan); other markets default to **Manhattan**; (2) these are source/configuration findings, not measured production behavior. AS400 cadence remains external; location-job cron schedules are in the repository. Checkout callers and both place-order implementations are traced in [the full guide §14–19](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-4#14-the-connected-fulfillment-lifecycle-including-checkout).

---

## 2. Services (one line each) {#2-services-one-line-each}

<a id="shared-d3b85716000c"></a>

| Service | Role | Remember |
|---|---|---|
| appservice (`comfulfillmentas`) | Façade for clients | Filters, orchestrates, calls dataservice, Manhattan, OMS, Estafeta |
| dataservice (`comfulfillmentds`) | Logic + storage | ATS, allocations, reservations, locations, fees, dates, commands |
| eventservice (`comfulfillmentes`) | Kafka | Consumes AS400/sales-order/CDC; publishes availability events |
| jobservice | Run-once batch | Triggers "commands" that load service locations |
| api repo | Contracts | OpenAPI + AsyncAPI specs |

<a id="shared-384ee48c9d7d"></a>

Stack: Quarkus + Mutiny (reactive `Uni`/`Multi`), Hibernate Reactive/Postgres, DynamoDB, Redis, SmallRye Kafka, Avro/Protobuf. (CLAUDE.md files in app/data service say Spring Boot; the code was migrated to Quarkus.)

---

## 3. The provider switch (very likely interview question) {#3-the-provider-switch-very-likely-interview-question}

`config.ats-service` chooses the ATS provider *(code)*:

<a id="shared-96b8658af340"></a>

| Value | Where set | Allocation | Reservation | Stock source of truth |
|---|---|---|---|---|
| `nextgen` | Japan QA/UAT/prod ConfigMaps, dev | `StockLevelAllocationHelper` | `StockLevelReservationService` | NGC Postgres ledger |
| `manhattan` | Base ConfigMap default (THA/LATAM don't override) | `ManhattanAllocationHelper` (ATP via shipping/pickup strategies) | `ReservationsServiceImpl` (Manhattan promising + IMS reservation) | Manhattan (MAO) |

<a id="shared-537c6b317b03"></a>

- **Manhattan path:** allocation calls Manhattan cart ATP (`evaluateAtpForCart`) plus OMS shipping restrictions in parallel; reservation sends a `RESERVATION` promising request (`isConfirmed=true`, promising config chosen by fulfillment type + medical/non-medical + channel) and maps back reserved, backorder (supply type `BACKORDER`) and sourced (supply type `PICKLINE`) quantities. Delete calls the IMS delete-reservation API by request id.
- **Be honest:** how Manhattan gets its on-hand stock is not in these repos *(unverified)*.
- Everything in sections 4–6 is the **NEXTGEN (ledger)** path.

---

## 4. ATS in depth (NEXTGEN) {#4-ats-in-depth-nextgen}

### 4.1 Core idea {#41-core-idea}

Each write creates a new row in `stock_level` (key: item, warehouse, version, country). The **latest version is current state**. Availability is derived on read.

<a id="shared-701cfea221e8"></a>

### 4.2 Availability formulas *(code, RegularViewStrategy; SOP view omits sopProtection per docs)* {#42-availability-formulas-code-regularviewstrategy-sop-view-omits-sopprotection-per-docs}

```
onHandATS    = max(0, onHand - reserved - backorderReserve - sopProtection)
backorderATS = max(0, backorderQty - backorderReserve)      # only SHIP_ELSE_BACKORDER or FORCE_BACKORDER, else 0
FORCE_TNA / NLA / NYA / NAW  =>  both ATS = 0
```

<a id="shared-228c5df25086"></a>

Views: `REGULAR_VIEW`, `SHIP_TO_HOME_VIEW` (identical formula to regular), `SOP_VIEW` (ignores SOP protection). Allocation uses SOP_VIEW for AUTO_SOP orders; reservation is hardcoded to REGULAR_VIEW.

### 4.3 Stock rules → disposition {#43-stock-rules--disposition}

<a id="shared-0b257f61fecb"></a>

| Rule | Result |
|---|---|
| FORCE_IN_STOCK | SHP, requested quantity regardless of stock |
| FORCE_BACKORDER | BO, `min(requested, backorderATS)`, never falls back to shipping |
| FORCE_TNA/NLA/NYA/NAW | that status, quantity 0 |
| SHIP_ELSE_BACKORDER | SHP if onHandATS>0, else BO if backorderATS>0, else TNA |
| SHIP_ELSE_TNA/NLA/NAW | SHP if onHandATS>0, else TNA/NLA/NAW |

<a id="shared-58e68a3b227e"></a>

`SHIP_ELSE_BACKORDER` for requested Q picks **one pool**: on-hand covers Q → SHP,Q; else backorder covers Q → BO,Q; else partial on-hand → SHP, onHandATS; else partial backorder → BO, backorderATS. It never mixes pools.

### 4.4 Transaction types and their exact arithmetic *(code)* {#44-transaction-types-and-their-exact-arithmetic-code}

<a id="shared-bd30f74b04d7"></a>

| Type | Effect on the new version | Notes |
|---|---|---|
| `DAY_END_EVENT` (AS400 `EOD`) | `onHand = feed value` (**absolute**). `reserved` carried forward unless the request supplies `reservedQuantity` (reservation sync). **Existing `stockLevelStatus` is kept** (feed cannot override it); feed status used only for the first version. | Can create first version. The class Javadoc says "resets reserved to 0"; the code does not. |
| `INTRA_DAY_EVENT` (AS400 `REL` and `DSP`) | `onHand = current + transactionQuantity` (**delta**). Status updated if supplied. `reserved` untouched. | Requires an existing row. `DSP` sends null quantity so only status changes. `REL` sends null status. |
| `RESERVE` | If disposition is SHP and fulfillable == requested on-hand → `reserved += qty`. If BO and fulfillable == requested backorder → `backorderReserve += qty`. **Otherwise throws `STOCK_LEVEL_INSUFFICIENT_STOCK`.** | Uses `atsType` view (REGULAR_VIEW). **Skipped entirely for FORCE_IN_STOCK.** All-or-nothing per line (no partial). |
| `RELEASE` | `reserved -= onHandQty`, `backorderReserve -= backorderQty`, reverts bundle `beBackorderQuantity`. | **No floor at 0.** Skipped for FORCE_IN_STOCK. |
| `ON_HAND_ADJUSTMENT` | `reserved -= q` and `onHand -= q` (the order shipped). | **No floor at 0** (can go negative). Idempotent by `transactionId`. |
| `BACKORDER_RELEASE_RESERVE` | `backorderReserve -= q`, `reserved += q` (backorder converted to normal reservation). | Idempotent by `referenceId`. Raw on-hand ATS unchanged. |
| `BACKORDER_RELEASE` | `beBackorderQuantity -= q` | Bundle-related counter. |
| `MANUAL` | Absolute assignment of supplied fields; requires an actual change; writes audit data. | Idempotent by `transactionId`. |

<a id="shared-41035d285fb2"></a>

Concurrency: a transaction-scoped Postgres advisory lock on `(item|warehouse|country)` is taken before reading the latest row; retries on conflict are enabled for these strategies. Duplicate protection is by `referenceId` (reserve/release) or `transactionId` (manual, on-hand adjustment).

### 4.5 Allocation vs reservation (classic question) {#45-allocation-vs-reservation-classic-question}

<a id="shared-5361e01f9b76"></a>

- **Allocation** (`POST /allocations`) = read-only planning. Calculates ATS per line; keeps an **in-memory** stock map shared across lines (regular + bundle) so line 2 sees line 1's consumption. Persists nothing.
- **Reservation** (`POST /reservations`) = persists. The request carries the allocation entries back; each becomes a `RESERVE` with `onHandTransactionQuantity = sourcedQuantity` and `backOrderTransactionQuantity = backorderableQuantity`, `referenceId = reservationId`, `transactionId = reservationId_lineId`. **It re-validates against current stock** and fails with insufficient stock if stock changed since allocation.
- **Cancel/delete reservation** finds the latest `RESERVE` for the reservation id, then issues `RELEASE` for every row with the same transaction time, using the quantities stored in each row's `transactionData`.

### 4.6 The double-deduction bug (current source versus proposed fix) {#46-the-double-deduction-bug-current-source-versus-proposed-fix}

<a id="shared-2a1dabea9236"></a>

- Symptom: backorder 999, requests 90 and 990. Line 2's ATS was 819 instead of 909, and a partial backorder came back as `SHP, 0`.
- Cause: `evaluateFulfillableQuantities` mutated `backorderQuantity` while `StockLevelAllocationHelper` also bumped `backorderReserve`, so the same quantity was deducted twice. Separately, the fallback returned SHP with availableQuantity 0.
- **Current source correction:** only the entity overload is pure. The DTO overload actually called by allocation still mutates supply, and the helper increments reservation counters too. Current fallback can still return SHP 0. Do not claim the allocation fix is applied or deployed.
- **Intended fix/result:** make the DTO evaluator pure and allow the partial-BO fallback; then the example should become `BO 90`, `BO 909`. This is the proposed behavior in the earlier fix writeup, not verified running behavior.
- Known follow-ups: stale test assertions, null-unboxing NPE risk, missing zero fields for TNA/NLA/NYA/NAW entries.

---

## 5. Feed flow end to end (AS400 → checkout) {#5-feed-flow-end-to-end-as400--checkout}

```
AS400 IMS → WebMethods → Kafka imsjapan_*_inventorycdm_pub_v1 (Protobuf)
 → eventservice As400FeedInventoryEventConsumer (@Blocking, one message at a time)
     parse protobuf → validate → populator → StockLevelTransactionRequest
     → dataservice POST /v1/stock-levels
 → dataservice: advisory lock → read latest → strategy (DAY_END / INTRA_DAY) → insert version N+1
 → CDC → Kafka stocklevel_raw_v1 → eventservice StockLevelCdcEventConsumer
     → GET version N and N-1 → per view: publish only if disposition/ETA/status changed
 → Kafka inventory-availability_pub_v1 (JSON) → Product / PDP / Search
```

### How each AS400 code is applied {#how-each-as400-code-is-applied}

<a id="shared-8bedfe39dcc0"></a>

| AS400 code | Type | Quantity | Status |
|---|---|---|---|
| `EOD` | `DAY_END_EVENT` | Absolute on-hand = `AVAILABLE` quantity | Ignored if row already has a status; used for first version |
| `REL` | `INTRA_DAY_EVENT` | Delta added to on-hand | Not sent |
| `DSP` | `INTRA_DAY_EVENT` | None | Mapped and applied |

<a id="shared-3543b5d41849"></a>

Status mapping: SHP/S/S→FORCE_IN_STOCK, TNA/FORCEOUTOFSTOCK→FORCE_TNA, NYA/NLA/NAW→FORCE_*, B/O→FORCE_BACKORDER, S/B/blank/unknown→SHIP_ELSE_BACKORDER, S/N→SHIP_ELSE_NLA, S/T→SHIP_ELSE_TNA.

<a id="shared-fb3a1d795778"></a>

Extras: warehouse code can be remapped by config; for `EOD`, if the reservation-sync feature flag is on (or the SKU is in `fulfillment.reserve.sync.skus`) the feed's `RESERVATION` quantity is written to `reservedQuantity`. `transactionId = referenceId = AS400 eventID`.

### Order events also write to the ledger {#order-events-also-write-to-the-ledger}

<a id="shared-06c0bf2b0bb6"></a>

- `ORDER_READY_FOR_FULFILLMENT` (and `ORDER_COMPLETE` for Point of Sale only) → `ON_HAND_ADJUSTMENT` per eligible line.
- `ORDER_CANCELLED` → `RELEASE` per line (backorder portion if `qtyInitiallyBackordered`, else on-hand portion).
- Fulfillment skips lines without `inventoryReservationLineId`, backordered lines, and bundle minor lines whose major line is backordered.

### "How real-time is it?" {#how-real-time-is-it}

<a id="shared-9534b93cb21c"></a>

- **Reads are live:** allocation/detail/listing compute from the latest committed row. No cache.
- **Writes serialized** per item/warehouse/country by advisory lock.
- **Latency** includes source publication delay, broker/network/queueing, REST/DB work and CDC for display events. The 0.5 s fetch wait is one broker setting, not a total-latency bound. Individual-record blocking handlers do not prove a single global worker; partitions and replicas matter. No end-to-end latency was measured.
- Consumer config: `max.poll.records=500`, `fetch.min.bytes=1024`, `fetch.max.wait.ms=500`, `auto.offset.reset=earliest`, `batch=false`.

### Failure handling {#failure-handling}

<a id="shared-a18ea595eb0a"></a>

| Error | Destination |
|---|---|
| Recoverable (wrapped network failure, 503, 504) | RLQ with `retry-count` header; reprocessed after 30 s; retry-count limit 3; then DLQ |
| Client/server/validation | DLQ |
| Unknown | DLQ, then nack |
| CDC consumer | Any failure → DLQ, ack |

Risk: RLQ publish failures are only logged, and the original is still acked, so an event can be lost.

---

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
