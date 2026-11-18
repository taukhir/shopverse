---
slug: /mycheckout/fulfillment-docs/fulfillment-end-to-end/part-1
title: "mycheckout — Fulfillment: End-to-End Guide — Part 1"
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

# mycheckout — Fulfillment: End-to-End Guide — Part 1

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `fulfillment docs/FULFILLMENT-END-TO-END.md` |
| Source SHA256 | `5c0985b97fc0201d78f7a2cbf248cb7b16dba20c5e63a9f422c6568376b97eed` |
| Guide part | 1 of 6 |

[Part 1](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-1) · [Part 2](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-2) · [Part 3](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-3) · [Part 4](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-4) · [Part 5](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-5) · [Part 6](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-6)

## Fulfillment: End-to-End Guide {#fulfillment-end-to-end-guide}

<a id="shared-2a8fb33913c4"></a>

Consolidated reference for how the fulfillment domain works: services, APIs, events, jobs, inventory (ATS) feed flow, service locations and Redis, delivery fees, and delivery dates.

<a id="shared-9d76413bf6ad"></a>

**2026-10-26 inventory pass:** start at [FULFILLMENT-REVERSE-ENGINEERING.md](/mycheckout/fulfillment-docs/fulfillment-reverse-engineering/part-1) for the current capability/source map. The exhaustive [API catalog](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1) supersedes the abbreviated endpoint tables below: 37 appservice and 49 dataservice contract operations, including PATCH fulfillment types. Fourteen appservice declarations have no matching handwritten controller method; a contract declaration alone does not prove an implemented endpoint. The [configuration registry](/mycheckout/fulfillment-docs/fulfillment-configuration-catalog) and [machine-readable catalog](/mycheckout/fulfillment%20docs/FULFILLMENT-CATALOG.json) provide further source evidence.

<a id="shared-1119d0850036"></a>

**Expanded verification, 2026-10-22:** this guide now includes the adjacent checkout business service, both place-order implementations, repository CronJob schedules, Japan Kafka overrides, transaction boundaries and replay limitations. Read §14 for the connected customer/order lifecycle, §15 for exact ATS rules, §16 for scheduling, §17 for failures, and §19 for source links. Verification is static inspection of the current workspace, including existing local changes; it is not a statement about deployed behavior. External AS400/WebMethods, Manhattan supply ingestion, OMS execution and downstream event consumers are outside the available implementations.

<a id="shared-690409e69e2f"></a>

**How this was built.** Everything marked *(code)* was read directly from the source in this workspace on 2026-10-22. Everything marked *(docs)* comes from the existing notes listed in [Related docs](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-3#12-related-docs) and was not re-verified. Anything marked *(unverified)* is an inference or a gap.

---

## 1. The three responsibilities (and what else the domain does) {#1-the-three-responsibilities-and-what-else-the-domain-does}

Fulfillment owns three main capabilities:

<a id="shared-24bb76acba0d"></a>

| # | Capability | Where it lives | Storage |
|---|---|---|---|
| 1 | **ATS** (available-to-sell, stock levels, allocations, reservations) | `dataservice`, fed by `eventservice` | PostgreSQL (`stock_level`, append-only versions) |
| 2 | **Service locations** (pickup and delivery points) | `dataservice` (+ `appservice` pass-through and filtering) | DynamoDB (source of truth) + Redis geo index |
| 3 | **Delivery fee** | `dataservice` (calculation), `appservice` (façade) | Fee tables are embedded in fulfillment types / service levels |

It also owns supporting capabilities:

<a id="shared-aa260568b04f"></a>

- Fulfillment types and service levels
- Warehouses
- Postal-code serviceability, delivery dates and delivery slots
- Shipping addresses, plus address lookups (districts, postal codes, states, subdistricts, DANE codes)
- OTP challenges (appservice)
- Pickup-location checks (Estafeta availability tokens, kept in Redis)

---

## 2. Services and how they fit together {#2-services-and-how-they-fit-together}

<a id="shared-cef7729f0052"></a>

| Service | Backstage name | Stack | Role |
|---|---|---|---|
| `commerce-fulfillment-appservice` | `comfulfillmentas` | Quarkus (CLAUDE.md says Spring Boot; the code uses Quarkus and Mutiny) | Client-facing façade. Validates, filters, orchestrates and calls `dataservice` and other systems. |
| `commerce-fulfillment-dataservice` | `comfulfillmentds` | Quarkus, Hibernate Reactive, DynamoDB, Redis | System of record and business logic: ATS, allocations, reservations, locations, fees, dates. |
| `commerce-fulfillment-eventservice` | `comfulfillmentes` | Quarkus, SmallRye Kafka | Kafka consumers and producers: inventory feed in, sales-order events in, stock CDC in, availability events out. |
| `commerce-fulfillment-jobservice` | — | Spring Boot `CommandLineRunner` | Run-once batch that triggers "commands" (location loads) on `dataservice`. |
| `commerce-fulfillment-api` | `commerce-fulfillment-apis` | OpenAPI and AsyncAPI specs | Contracts only (`fulfillment-app-rest` v1.17.0, `fulfillment-data-rest` v1.21.0 and the event specs). |

```
                     ┌────────────────────┐
 Checkout / Storefront│  appservice (as)   │  /fulfillment-types, /service-locations,
 ───────────────────▶ │  façade + filters  │  /cart-pickup-locations, /delivery-fees, ...
                     └─────────┬──────────┘
                               │ REST (FulfillmentDataServiceClient)
                               ▼
 AS400 IMS ─▶ WebMethods ─▶ Kafka ─▶ ┌────────────────────┐ ◀── jobservice (commands)
 Sales orders ─▶ Kafka ───────────▶ │ eventservice (es)   │
                                    └─────────┬──────────┘
                                              │ REST
                                              ▼
                       ┌─────────────────────────────────────────┐
                       │ dataservice (ds)                         │
                       │  PostgreSQL: stock_level, postal codes,  │
                       │              delivery dates              │
                       │  DynamoDB:   service locations, fulfil.  │
                       │              types, commands             │
                       │  Redis:      geo index + pickup checks   │
                       └──────────┬──────────────────────────────┘
                                  │ CDC (stock_level) → Kafka → eventservice
                                  ▼
                   inventory-availability topic → Product / PDP / Search
```

<a id="shared-f029844271a3"></a>

External systems called: Manhattan Active Omni (MAO: ATP, inventory, promising, org, order), OMS / Value Chain (shipping restrictions), Hybris (Japan locations), Kerry, 7-Eleven, Pickit, Estafeta (LATAM) and the OTP identity service.

<a id="shared-8ee7061e908c"></a>

**ATS provider switch** *(code)*. `config.ats-service` selects the allocation implementation. `NEXTGEN` uses `StockLevelAllocationHelper` (our own stock ledger). The other value uses `ManhattanAllocationHelper`. The rest of this document describes the NEXTGEN path.

<a id="shared-6f7eed685869"></a>

**Which markets use which provider** *(code, `app-configs`)*: the base `configmap.yml` sets `ats-service: 'manhattan'`. Only the Japan ConfigMaps (`configmap_jpn_qa/uat/prod.yml`) and `application-dev.yml` set `nextgen`. THA and LATAM ConfigMaps do not override it, so they appear to run on **Manhattan**. The same switch also selects the reservation service: `StockLevelReservationService` (NEXTGEN, our ledger) vs `ReservationsServiceImpl` (MANHATTAN, which calls Manhattan promising and IMS reservation APIs). The ledger, AS400 feed and reserved-quantity behaviour described in this document therefore applies to **Japan** (and dev). Effective values in deployed environments should still be confirmed.

---

## 3. API inventory {#3-api-inventory}

All data-service paths are under `/comfulfillmentds/v1`, taken from the generated spec and the `@Path` annotations *(code)*.

### 3.1 dataservice (`/v1/...`) {#31-dataservice-v1}

<a id="shared-7a95f67fdcca"></a>

| Area | Endpoints |
|---|---|
| Fulfillment types | `GET/POST /fulfillment-types`, `GET/PUT/PATCH/DELETE /fulfillment-types/{id}` |
| Allocations | `POST /allocations` |
| Reservations | `POST /reservations`, `DELETE /reservations/{reservationId}` |
| Stock levels | `GET/POST /stock-levels`, `GET /stock-levels/detail`, `POST /stock-levels/batch`, `GET /stock-levels/audit` |
| Service locations | `GET/POST /service-locations`, `GET/PUT/DELETE /service-locations/{id}`, `POST /service-locations/{id}/pickup-availability`, `POST /service-locations/{id}/pickup-reservations` |
| Pickup checks | `GET/PUT /pickup-location-checks/{checkKey}` (Redis-backed) |
| Post locations | `GET/POST /post-locations`, `/post-locations/{id}` |
| Delivery fees | `POST /delivery-fees` |
| Delivery dates / slots | `GET/POST /delivery-dates`, `/delivery-dates/{id}`, `GET /delivery-slots/availability` |
| Serviceability | `GET/POST /postalcode-serviceabilities`, `/postalcode-serviceabilities/{id}` |
| Warehouses | `GET /warehouses` |
| Addresses | `/shipping-addresses`, `/shipping-addresses/{id}` |
| Commands | `POST /commands`, `GET /commands/{commandId}` |

### 3.2 appservice {#32-appservice}

<a id="shared-5b4a8a127268"></a>

| Area | Endpoints |
|---|---|
| Cart pickup | `POST /cart-pickup-locations` |
| Fulfillment types | `GET /fulfillment-types` |
| Fees | `GET/POST /service-fees`, `/service-fees/{id}`, `POST /delivery-fees` |
| Service locations | `GET /service-locations`, `GET /service-locations/{id}` |
| Warehouses | `GET /warehouses` |
| Stock | `GET/POST /stock-levels`, `/stock-levels/detail`, `/stock-levels/batch`, `/stock-levels/audit` |
| Delivery | `GET /delivery-slots/availability`, `/delivery-dates`, `/postalcode-serviceabilities` (+ `{id}`) |
| Addresses | `/shipping-addresses`, `/districts`, `/postalcodes`, `/states`, `/subdistricts`, `/daneCodes` |
| Security | `POST /challenges` (OTP) |

---

## 4. ATS: the inventory feed end to end {#4-ats-the-inventory-feed-end-to-end}

### 4.1 Stored state vs. calculated availability {#41-stored-state-vs-calculated-availability}

<a id="shared-c6bbe1d9e3e1"></a>

- Each write to `stock_level` creates a **new version**. The latest version is current state. `transactionData` (JSONB) describes the transaction that produced it.
- **Availability is never stored.** It is computed on every read from the latest row plus the selected view. See [Fulfilment-Understanding-Notes.md §7](/mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-1) for the formulas and the ten stock-rule dispositions.

### 4.2 AS400 feed: how it arrives {#42-as400-feed-how-it-arrives}

```
AS400 IMS → WebMethods → Kafka  imsjapan_*_inventorycdm_pub_v1   (Protobuf bytes)
  → eventservice  As400FeedInventoryEventConsumer  (@Incoming readInventoryAtsEvent, @Blocking)
      1. parse protobuf (direct → skip 5-byte Confluent header → try 1/4/6/8/10-byte headers)
      2. TenantContextHolder.setByCode(affiliateCode)
      3. As400 validator  (invalid → DLQ)
      4. As400InventoryEventStrategyImpl → As400InventoryEventDataPopulator
      5. StockLevelService.createStockLevel  → dataservice POST /v1/stock-levels
  → dataservice  StockLevelTransactionHelper  (advisory lock → read latest → write version N+1)
```

**Event code → transaction type** *(code)*:

<a id="shared-b6586bb5092e"></a>

| AS400 code | Transaction type | Notes |
|---|---|---|
| `EOD` | `DAY_END_EVENT` | **Absolute** on-hand = the `AVAILABLE` quantity. Reserved is carried forward unless the reservation sync supplies it. The **existing `stockLevelStatus` is kept** (feed status is used only when creating the first version). Can create the first version. |
| `REL` | `INTRA_DAY_EVENT` | **Delta**: `onHand = current + quantity`. Stock status not sent. Requires an existing row. |
| `DSP` | `INTRA_DAY_EVENT` | Quantity forced to null, so it is a status-only update (the only feed path that changes status on an existing row). |

<a id="shared-ec2a81668368"></a>

- `transactionId` and `referenceId` are both set to the AS400 `eventID`.
- `transactionQuantity` is the quantity entry whose type is `AVAILABLE`.
- The warehouse code can be remapped by `warehouse.code.mapping`.
- Reservation sync (`EOD` only) happens when the feature flag `FULFILLMENT_ATS_FEED_EVENT_RESERVATION_QUANTITY_SYNC_ENABLE` is on, or the SKU is in `fulfillment.reserve.sync.skus`. This **can overwrite NGC reservation counters from the feed**, which differs from the "feeds never reset reservations" principle in the notes.

**AS400 status code → `stockLevelStatus`** *(code)*:

<a id="shared-cba3d385fb23"></a>

| AS400 | Stock rule |
|---|---|
| `SHP`, `S/S` | `FORCE_IN_STOCK` |
| `TNA`, `FORCEOUTOFSTOCK` | `FORCE_TNA` |
| `NYA` / `NLA` / `NAW` | `FORCE_NYA` / `FORCE_NLA` / `FORCE_NAW` |
| `B/O` | `FORCE_BACKORDER` |
| `S/B`, blank, unknown | `SHIP_ELSE_BACKORDER` |
| `S/N` / `S/T` | `SHIP_ELSE_NLA` / `SHIP_ELSE_TNA` |

### 4.3 Other writers into the ledger {#43-other-writers-into-the-ledger}

<a id="shared-ddeb43e6a4c5"></a>

| Source | Mechanism | Transaction written |
|---|---|---|
| Checkout reservation | `POST /reservations` | `RESERVE`, always `REGULAR_VIEW` *(code, test-locked)*. Re-validates ATS and **throws `STOCK_LEVEL_INSUFFICIENT_STOCK`** if the line cannot be fully fulfilled; skipped for `FORCE_IN_STOCK`. |
| Reservation delete | `DELETE /reservations/{id}` | `RELEASE` per original `RESERVE` row (same transaction time), using quantities stored in each row's `transactionData` *(code)* |
| Backorder release (OMS-triggered) | stock-level batch | `BACKORDER_RELEASE_RESERVE` (`backorderReserve -= q`, `reserved += q`) and `BACKORDER_RELEASE` (`beBackorderQuantity -= q`) *(code)* |
| Sales order `ORDER_READY_FOR_FULFILLMENT` | `SalesOrderFulfillmentEventStrategyImpl` → `createStockLevelBatch` | `ON_HAND_ADJUSTMENT` (quantity = `orderedQuantity`, `referenceId` = `inventoryReservationId`). Arithmetic *(code)*: `reserved -= q` and `onHand -= q`, **no floor at 0**; idempotent by `transactionId`. |
| Sales order `ORDER_COMPLETE` | same strategy | same, but only for `salesChannelCode = "Point of Sale"` |
| Sales order `ORDER_CANCELLED` | `SalesOrderCancelEventStrategyImpl` → batch | **`RELEASE`** *(code)*. Quantity = `cancelledQuantity`, sent as `backOrderTransactionQuantity` if the line was initially backordered, else `onHandTransactionQuantity`. `transactionId` = `inventoryReservationLineId`, `referenceId` = `inventoryReservationId`. Cancel does not skip backordered lines (fulfillment does). |
| Manual admin edit | `POST /stock-levels` with `MANUAL` | Absolute assignment, with audit data |

<a id="shared-805848c18ced"></a>

**Sales-order fulfillment skips lines that have** no `inventoryReservationLineId`, a backordered quantity > 0, or a bundle "minor" line whose major line (`fulfillmentDependsOn`) is backordered.

### 4.4 How stock updates reach everyone else (CDC → availability event) {#44-how-stock-updates-reach-everyone-else-cdc--availability-event}

```
stock_level row insert → CDC → Kafka  commerce_*_stocklevel_raw_v1 (Avro)
 → eventservice StockLevelCdcEventConsumer (@Incoming stock-level-cdc-events)
 → StockLevelEventProcessor.process(after):
     GET stock level @ version N and N-1 from dataservice
     for each view (REGULAR_VIEW, SHIP_TO_HOME_VIEW, SOP_VIEW, ...):
       publish only if: no previous version, OR disposition changed,
                        OR backorderEta / nextAvailablityEta / discontinuationDate changed,
                        OR stockLevelStatus changed
 → Kafka  commerce_*_inventory-availability_pub_v1   (JSON)
 → Product, PDP, Search
```

`StockLevelViewConfig.mappings` can clone one view's data under extra view names. Each clone is published as an extra event.

### 4.5 How this keeps checkout's ATS real-time {#45-how-this-keeps-checkouts-ats-real-time}

<a id="shared-b3cd9a665248"></a>

1. **Checkout does not read a cache.** Allocation (`POST /allocations`), stock detail and stock listing all compute ATS **on request** from the latest `stock_level` row. As soon as a feed or reservation commits, the next allocation sees it.
2. **Writes are serialized per stock key.** A transaction-scoped advisory lock on `(item, warehouse, country)` is taken before reading the latest row. Two concurrent reservations cannot both consume the same last unit.
3. **Reservations are explicit and versioned.** Checkout reserves (`RESERVE`) and `reservedQuantity` or `backorderReserve` rises immediately. Cancel or release lowers it.
4. **Allocation shares an in-memory stock map across lines, but currently double-deducts in the DTO path.** `StockLevelAllocationHelper` calls the `StockLevelResponseDataDto` evaluator, which still mutates on-hand/backorder supply; the helper also increments reserved/backorder-reserve. The entity evaluator used for reservation is pure. The earlier fix document describes a correction that is not present in this DTO overload in the current checkout. See §15.3.
5. **Downstream availability events are selective.** The CDC predicate compares disposition, dates and stock status, not numerical ATS changes alone. A quantity change that leaves disposition unchanged produces no event. Product/PDP/Search subscription and application behavior were not traced; see §17.

<a id="shared-7461e92668b1"></a>

> Checkout callers are now traced in §14. Checkout bizservice calls fulfillment **dataservice directly** for allocation, reservation, fees and pickup confirmation; appservice is a separate storefront façade.

### 4.6 Refresh rate {#46-refresh-rate}

<a id="shared-14c37529eb84"></a>

- **There is no polling interval for stock in this codebase.** Stock changes when a message arrives (event-driven). **How often AS400 publishes is outside this repo** (set by AS400/WebMethods; the notes say "source cadence is controlled by AS400").
- **Consumer-side settings** *(code, `eventservice/application.yml`)*:
  - `readInventoryAtsEvent`: `max.poll.records = 500`, `fetch.min.bytes = 1024`, `fetch.max.wait.ms = 500`, `batch: false`, `auto.offset.reset = earliest`.
  - Practical effect: the configured broker fetch wait is 0.5 s; messages use an individual-record blocking handler with a REST/DB write per event. This is not a total-latency bound or proof of a single global worker; partitions, replicas and queueing affect throughput.
  - RLQ consumers use `max.poll.interval.ms = 300000` and RLQ retries use `rlq.retry.timeout.ms = 30000` with `max.retries = 3`.
- **End-to-end latency** (AS400 publish → visible in an allocation call) is therefore broker latency + one blocking REST/DB write per message. For display events add CDC latency + two GETs + a publish.
- **No latency number is measured or configured in the repo.** The architecture notes quote assumptions only (about 10 ms per transaction, 500 ms lock timeout, about 5 TPS per hot SKU), which are targets, not measurements.
- Redis geo data (service locations) refreshes only when the job service runs (see §6.3).

---

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
