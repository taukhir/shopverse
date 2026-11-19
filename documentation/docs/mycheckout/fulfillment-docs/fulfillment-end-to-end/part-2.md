---
slug: /mycheckout/fulfillment-docs/fulfillment-end-to-end/part-2
title: "mycheckout — Fulfillment: End-to-End Guide — Part 2"
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

# mycheckout — Fulfillment: End-to-End Guide — Part 2

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `fulfillment docs/FULFILLMENT-END-TO-END.md` |
| Source SHA256 | `5c0985b97fc0201d78f7a2cbf248cb7b16dba20c5e63a9f422c6568376b97eed` |
| Guide part | 2 of 6 |

[Part 1](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-1) · [Part 2](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-2) · [Part 3](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-3) · [Part 4](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-4) · [Part 5](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-5) · [Part 6](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-6)

## 5. Events reference {#5-events-reference}

### 5.1 Consumed (eventservice, `@Incoming`) {#51-consumed-eventservice-incoming}

<a id="shared-131df011e9d7"></a>

| Channel | Class | Format | Status |
|---|---|---|---|
| `readInventoryAtsEvent` | `As400FeedInventoryEventConsumer` | Protobuf bytes | **Active** |
| `readInventoryAtsEventRlq` | `As400FeedInventoryRlqEventConsumer` | Protobuf bytes | Active (retry) |
| `readSalesOrderEvent` | `SalesOrderEventConsumer` | Avro | **Active** |
| `readSalesOrderRlqEvent` | `SalesOrderRlqEventConsumer` | Avro | Active (retry) |
| `stock-level-cdc-events` | `StockLevelCdcEventConsumer` | Avro (custom deserializer) | **Active** |
| `dailyfeed-inventory-events` | `DailyFeedInventoryEventConsumer` | Avro | `enabled: false` in base yml |
| `intraday-inventory-events` | `IntraDayFeedInventoryEventConsumer` | Avro | `enabled: false` in base yml |
| `inventory-aggregated-in` | `AggregatedDailyFeedInventoryEventConsumer` | Avro | `enabled: false` in base yml |

<a id="shared-9a0a5251e741"></a>

The checked ConfigMaps do not enable the three legacy daily/intraday/aggregated inputs. Japan's shared ConfigMap enables sales-order, sales-order RLQ, stock CDC, AS400 and AS400 RLQ inputs. AP2 QA explicitly disables AS400. These are repository settings, not a live channel inventory; see §16.

Sales-order event types handled: `ORDER_READY_FOR_FULFILLMENT`, `ORDER_COMPLETE` (POS only), `ORDER_CANCELLED`. Anything else is ignored.

### 5.2 Produced (`@Channel`) {#52-produced-channel}

<a id="shared-a81109e23223"></a>

| Channel | Topic | Format | Status |
|---|---|---|---|
| `inventory-availability-events-out` | `commerce_${env}_${tenantCode}_inventory-availability_pub_v1` | JSON | **Active** |
| `readInventoryAtsEventProcessor` | `imsjapan_dv_global_inventorycdm_dlq_error_v1` | bytes | DLQ |
| `readInventoryAtsEventProcessorRlq` | `imsjapan_dv_global_inventorycdm_rlq_error_v1` | bytes | RLQ |
| `readSalesOrderEventProcessor(Rlq)` | `commerce_*_{tenant}_salesorder-comfulfillmentes-{dlq,rlq}_error_v1` | Avro | DLQ / RLQ |
| `stockLevelCdcEvents` | `commerce_*_{tenant}_stocklevel-comfulfillmentes-{dlq,rlq}_error_v1` | Avro | DLQ / RLQ |
| `inventory-aggregated-out`, `dailyfeed-inventory-events-out`, `dailyfeed-inventory-dlq-out` | per env | Avro | `enabled: false` |

<a id="shared-be5eb28146b5"></a>

The `dv` topics above are base/dev values. Japan overrides its AS400 error destinations using `commerce_${INSTANCE_OR_TENANT_ENV}_070_inventorycdm_comfulfillmentes_{dlq,rlq}_error_v1`; incoming AS400 topics use `imsjapan_ts`, `imsjapan_qa`, and `imsjapan_pd` for Japan QA, UAT and prod respectively. See §16.3 before interpreting a base topic as a production destination.

### 5.3 Error routing (AS400 and sales order consumers) {#53-error-routing-as400-and-sales-order-consumers}

<a id="shared-3b37c55561e3"></a>

| Error | Destination |
|---|---|
| `RecoverableException` (wrapped network failures, 503, 504) | RLQ (retry), then ack |
| `ClientErrorException` / `ServerErrorException` / `EventValidationException` | DLQ, then ack |
| Unknown exception | DLQ, then **nack** |

The CDC consumer sends any failure to its DLQ and acks.

<a id="shared-5fe2c2cc56ae"></a>

**HTTP classification detail:** `StockLevelServiceImpl` checks all 4xx statuses before its recoverable-status check. Therefore 429 and 403 go to DLQ as client errors; although 403 appears in `isRecoverableError`, that branch cannot win for it. Other nonrecoverable HTTP responses, including 500, map to `ServerErrorException` and go to DLQ. Do not assume every transient-looking HTTP error is retried.

**RLQ retry mechanics (AS400 RLQ consumer, `consumeRlq`)** *(code)*:

<a id="shared-d3dda4f8459a"></a>

1. The first failure is published to the RLQ topic with headers `retry-count` and `error-reason`.
2. The RLQ consumer waits until `rlq.retry.timeout.ms` (30 s) has passed since the record's publish timestamp, then reprocesses it on a worker thread. Reprocessing runs the same parse, validate and strategy path as the main consumer.
3. On another `RecoverableException`: if `retry-count >= rlq.max.retries` (3) the message goes to the DLQ, otherwise it is republished to the RLQ with `retry-count + 1`.
4. Client, server, validation and unknown errors go straight to the DLQ. The RLQ consumer always acks.
5. **Message-loss risk:** `As400FeedInventoryRlqEventProducer.publishEvent` catches all exceptions and only logs them. If the RLQ publish fails or times out (30 s), the caller still acks the original, so that event is dropped.
6. **Sales-order RLQ (now verified):** uses the same timestamp-based delay and retry-count limit. Recoverable failures republish to RLQ or go to DLQ on exhaustion, then ack; client/server/validation errors go to DLQ then ack. Unknown exceptions publish to DLQ and **nack**, unlike AS400 RLQ's unknown-error ack. Tenant context is cleared in `finally`.

### 5.4 Event contracts (`commerce-fulfillment-api`) {#54-event-contracts-commerce-fulfillment-api}

<a id="shared-b5c4d1030d4a"></a>

`inventory-availability-event` v1.2.0, `stocklevel-internal-event` v1.2.0, `shippingaddress-internal-event` v1.1.0. Topic naming: `commerce_{env}_{id}_{capability}_{direction}_v{n}`.

---

## 6. Service locations {#6-service-locations}

### 6.1 Data model and storage {#61-data-model-and-storage}

<a id="shared-0677d0d89230"></a>

- **System of record: DynamoDB** (`ServiceLocationEntity`: id, fulfillmentType, countryIsoCode, address incl. latitude/longitude and post code, schedule, batch id).
- Lookups are by id, by fulfillment type, by `postCode#provider`, by text search, or by full scan.
- **Redis is a derived geo index**, not the source of truth (see 6.3).

### 6.2 How locations get loaded (the "jobs") {#62-how-locations-get-loaded-the-jobs}

```
jobservice (run-once, config.enable-execution=true)
  └─ for each command configured for the country (application-<country>-<env>.yml):
       POST dataservice /v1/commands  {beanId, idempotency-key}
       poll GET /v1/commands/{id} until COMPLETED / FAILED / max polls
dataservice CommandsServiceImpl → @Named CommandStrategy bean
```

<a id="shared-5abc46f23495"></a>

| Command bean | Source | Markets seen in config |
|---|---|---|
| `bopisServiceLocationsLoadingCommandStrategy` | mycheckout stores (BOPIS) | THA, LATAM |
| `walkinServiceLocationsLoadingCommandStrategy` | mycheckout walk-in | THA |
| `kerryServiceLocationsLoadingCommandStrategy` | Kerry | THA |
| `sevenElevenServiceLocationsLoadingCommandStrategy` | 7-Eleven | THA |
| `pickitServiceLocationsLoadingCommandStrategy` | Pickit | LATAM |
| `easyDeliveryPointServiceLocationsLoadingCommandStrategy` | Easy Delivery Point | LATAM (CO) |
| `hybrisServiceLocationsLoadingCommandStrategy` | Hybris | JP |
| `redisServiceLocationLoadingCommandStrategy` | **DynamoDB → Redis** | THA, LATAM (listed last) |

<a id="shared-29ae13e90acc"></a>

Partner location loaders write DynamoDB and use batch-based cleanup where implemented. The Redis command reads DynamoDB rather than writing partner locations. Command lists are country/profile-specific: Thailand and most LATAM countries put Redis last; Mexico prod does not list Redis, and the supplied Japan QA profile lists BOPIS only. A bean's existence does not prove it is scheduled.

<a id="shared-7af9d7fc1b2f"></a>

CronJob schedules **are in this workspace**, under `commerce-fulfillment-jobservice/deployment-config/ngcom-microservice/values-*.yaml`. See §16 for the complete schedule matrix and the distinction between a scheduled pod and an executable Spring profile.

### 6.3 Where Redis is used and how it works {#63-where-redis-is-used-and-how-it-works}

Redis (AWS ElastiCache, TLS; `quarkus.redis.hosts = rediss://…:6379`, cluster or standalone via config) is used in `dataservice` for two things *(code)*:

**1. Geo index for locations**

<a id="shared-caac95b5d4e1"></a>

- `RedisServiceLocationLoadingCommandStrategy` full-scans DynamoDB, groups by country then fulfillment type, **drops rows without valid coordinates** (latitude within ±85.05112878 and longitude within ±180, the Redis geo limits), and runs `GEOADD` per group.
- Key written: `<COUNTRY>:<fulfillmentType>` (for example `TH:bopis`), member = service-location id.
- Query-time: `GEOSEARCH` from the customer's coordinate, by radius in **miles**, ascending, with distance. Results are paged in memory using the last returned id, then the full records are fetched from DynamoDB by id (`findAllById`) and `distanceInMiles` is attached.

**2. Short-lived pickup-location check tokens (Estafeta / LATAM)**

<a id="shared-8fe6938df1ea"></a>

- `evaluatePickupAvailabiliy` calls Estafeta `validateLocation`. If available, it stores `availabilityCheckId` in Redis under the checkout id with **TTL `config.ttl-for-redis-key` (default 360 s)**. If it is not available it throws `PickupLocationNotAvailableException`.
- `confirmPickupLocationIfApplicable` (`.../pickup-reservations`) reads the token. If it has expired, the call fails with "Validation Id not available anymore". Otherwise it calls Estafeta `confirmLocation` and requires `result == 0`.
- `GET/PUT /pickup-location-checks/{checkKey}` read and write the same keys.

**Two issues worth checking** *(code, but behaviour in a live Redis is unverified)*:

<a id="shared-ce869d25c5b0"></a>

1. **Key mismatch (confirmed in code and config).** The loader writes `<COUNTRY>:<fulfillmentType>` (`RedisServiceLocationLoadingCommandStrategy.java:63`) but the search reads key `<fulfillmentType>` only (`ServiceLocationsServiceImpl.java:209`). `RedisConfig` builds the geo commands with no key prefix. The ConfigMaps (`app-configs/configmap*.yml`), `application-dev.yml` and the Helm values set only `quarkus.redis.hosts` (`REDIS_HOST`/`REDIS_PORT`). None sets a key prefix. So, as written, `GEOSEARCH` on `bopis` queries a key the loader never populates and returns empty. The unit test mocks `geoadd(anyString(), …)`, so it cannot catch this. Whether production data was loaded by an older version that used the bare key is unverified.
2. **No removal.** I found no code that removes stale members from the geo set. `GEOADD` only adds or updates. A deleted location stays in the index until the key is dropped. It would then not be found in DynamoDB, so it is probably dropped silently at `findAllById`.

The comment in `RedisConfig` mentions a `CacheInvalidationListener` and Redis pub/sub. I found no such class, so the comment looks stale.

### 6.4 How we decide which service locations to show {#64-how-we-decide-which-service-locations-to-show}

**Step A: data service query routing** (`GET /v1/service-locations`):

<a id="shared-26ffff388f04"></a>

| Inputs present | Behaviour |
|---|---|
| `fulfillmentType` + `searchText` | DynamoDB text search |
| `fulfillmentType` + `latitude`/`longitude` | **Redis geo search**, radius = `radiusInMiles` or the type's `defaultRadiusInMiles`, sorted by distance |
| `fulfillmentType` + `postCode` | DynamoDB lookup by `postCode#fulfillmentType` |
| `fulfillmentType` only | Geo search around the **country's default service location** (`W22` TH, `B61` LATAM, `J01` JP) if it has coordinates, else plain DynamoDB list |
| no `fulfillmentType` | All locations (scan, paged) |

**Step B: appservice `POST /cart-pickup-locations`.** One strategy is chosen by `supports(...)`:

<a id="shared-11d72e1f6f6a"></a>

| Strategy | Chosen when | What it does |
|---|---|---|
| `EstafetaPickupLocationStrategy` | country MX and fulfillment type `easyDeliveryPoint`, with items | Calls the Estafeta API directly (no Redis and no DynamoDB). Maps opening hours (Spanish to English weekdays). |
| `BopisPickupLocationStrategy` | fulfillment type `bopis`, with items | Gets locations, **checks per-location stock in Manhattan** (see below), and sets `allItemsAvailable`. |
| `DefaultPickupLocationStrategy` | fallback | Gets locations and shipping restrictions. |

Common steps in `PickupLocationStrategyHelper`:

<a id="shared-8db762d9c8e0"></a>

1. Get the fulfillment type, the service locations and the **OMS shipping restrictions** in parallel. Restrictions apply only if `shippingrestriction.applicable = true`. If the restriction response names this delivery option, the type is marked `isRestricted`.
2. Location query: `searchText` first, then coordinates, then `postCode`, else none. Pagination defaults to 200 (`pagination-enable`, `pagination-limit`).
3. Remove locations in `config.locationsDisabledForPickup` (skipped for the NGC admin client).
4. **BOPIS availability:** requested quantity per item is summed across lines and bundles (bundle quantity multiplies line quantity). Manhattan is asked for each item at each location in the fulfillment type's `viewName`. A location is `allItemsAvailable` only if **every** item has `onHand` (plus `futureQuantity` when `config.backorder-as-available = true`) at or above the requested quantity.
5. **Sort:** `allItemsAvailable = true` first, then `distanceInMiles` ascending (nulls last).

> The data service sets `allItemsAvailable = false` on geo results by default, so only the BOPIS strategy produces a meaningful value.

---

## 7. Allocations (what checkout asks "can I ship this?") {#7-allocations-what-checkout-asks-can-i-ship-this}

`POST /v1/allocations` *(code)*:

<a id="shared-571d43a0c1ab"></a>

1. If `orderType == GO`, each request is processed on its own. Otherwise all requests are **merged** (line ids become `<requestId>_<lineId>`), allocated once, then split back out per request.
2. For the requested fulfillment type, one **allocation group per service level** is built (or one group if there are no levels).
3. **Warehouse choice:** if the fulfillment type has `evaluateShipping`, the warehouse comes from `postalcode_serviceability` for the delivery postal code. If that is missing it falls back to the country default (`WA1` TH, `B60` LATAM, `JA1` JP). Otherwise the request's `warehouseId` is used.
4. All item stock rows for that warehouse are fetched in a single query. For each line the ATS strategy picks the disposition and quantity.
5. View: `SOP_VIEW` for AUTO_SOP orders, otherwise `REGULAR_VIEW`.
6. **Allocation responses carry no fee from this service.** `ServiceFeesService.calculateAndUpdateServiceFees` is meant to fill each group's `fee`, but it has **no production caller**: only `ServiceFeesServiceImplTest` invokes it *(code, searched all modules)*. Delivery fees reach clients only through `POST /delivery-fees` (§8). If any consumer expects `fee` on allocation groups, it will be empty.

Reservation (`POST /reservations`) is the separate, persisting step.

---

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
