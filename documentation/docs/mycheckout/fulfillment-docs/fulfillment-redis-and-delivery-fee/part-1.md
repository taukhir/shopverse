---
slug: /mycheckout/fulfillment-docs/fulfillment-redis-and-delivery-fee/part-1
title: "mycheckout — Redis and Delivery Fee: Deep Dive — Part 1"
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

# mycheckout — Redis and Delivery Fee: Deep Dive — Part 1

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `fulfillment docs/FULFILLMENT-REDIS-AND-DELIVERY-FEE.md` |
| Source SHA256 | `b581f62edae73e51de6333a1796752dfa7f46834b283d64039559afe32c028e4` |
| Guide part | 1 of 2 |

[Part 1](/mycheckout/fulfillment-docs/fulfillment-redis-and-delivery-fee/part-1) · [Part 2](/mycheckout/fulfillment-docs/fulfillment-redis-and-delivery-fee/part-2)

## Redis and Delivery Fee: Deep Dive {#redis-and-delivery-fee-deep-dive}

<a id="shared-40c1362036e3"></a>

Detailed, example-driven explanation of two topics interviewers love: **how Redis is used** and **how delivery fees are calculated**. Read after [FULFILLMENT-INTERVIEW-PREP.md](/mycheckout/fulfillment-docs/fulfillment-interview-prep/part-1). All statements are *(code)* unless marked *(unverified)*.

---

## Part A: Redis {#part-a-redis}

## A1. Where Redis exists {#a1-where-redis-exists}

<a id="shared-909ee68dd635"></a>

| Service | Redis? |
|---|---|
| `dataservice` | **Yes**: the only service that connects. Config: `quarkus.redis.hosts` from `REDIS_HOST`/`REDIS_PORT` (ElastiCache, `rediss://` = TLS). THA/LATAM prod use `clustercfg…` endpoints (cluster mode); dev uses a `master…` endpoint. |
| `jobservice` | No connection. It only names the bean (`redisServiceLocationLoadingCommandStrategy`) to ask the data service to run. |
| `appservice`, `eventservice` | No Redis in main source (searched). |

`RedisConfig` exposes two beans from Quarkus' `ReactiveRedisDataSource`:

- `ReactiveGeoCommands<String,String>`: geo index for service locations.
- `ReactiveValueCommands<String,String>`: plain string keys with TTL (Estafeta pickup checks).

No key prefix, no pub/sub, no cache-invalidation listener exists in code (a comment in `RedisConfig` mentions one; it is stale).

## A2. Use case 1: geo index of service locations {#a2-use-case-1-geo-index-of-service-locations}

### Why Redis here? {#why-redis-here}

<a id="shared-00100c5a1ca8"></a>

DynamoDB cannot do "nearest N locations within R miles" efficiently. Redis `GEO*` commands store points in a sorted set and answer radius queries in memory. DynamoDB stays the **system of record**; Redis is a **derived index** rebuilt by a job.

### Data flow {#data-flow}

```
partners (Kerry, 7-Eleven, Hybris, ...) ──loader commands──▶ DynamoDB (service locations)
                                                      │
        redisServiceLocationLoadingCommandStrategy ◀──┘  full scan
                         │  group by country → fulfillment type, drop invalid coords
                         ▼
              Redis GEOADD  <COUNTRY>:<fulfillmentType>  lon lat locationId ...
                         │
GET /service-locations?fulfillmentType=bopis&latitude=..&longitude=..
                         ▼
        GEOSEARCH <fulfillmentType> FROMLONLAT lon lat BYRADIUS r mi ASC WITHDIST
                         ▼
        page ids in memory → DynamoDB batch get by id → attach distanceInMiles → sort
```

### Building the index (loader) {#building-the-index-loader}

<a id="shared-9ff767ef1193"></a>

1. `findAllServiceLocationsFullScan()` pages through the whole DynamoDB table recursively.
2. Group: `country → fulfillmentType → [locations]`; only the current tenant's country is loaded.
3. **Validity filter**: address present, latitude and longitude non-empty, latitude within ±85.05112878 and longitude within ±180 (Redis geo limits). Invalid rows are logged and skipped.
4. For each fulfillment type: `GEOADD key (lon, lat, locationId)…`. Member = location id. Failures are logged and swallowed (returns 0), so one bad type does not stop the others.
5. Typical shape (example): `TH:bopis → {W22, W23, …}`, `TH:kerry → {…}`.

<a id="shared-fe6b1766e8ad"></a>

Operational properties: `GEOADD` is an upsert (moving a location updates its point). **Nothing removes members** (no `ZREM`/key delete in the code), so a deleted location stays in the index until the key is dropped. A stale id simply fails to hydrate from DynamoDB.

### Querying {#querying}

`ServiceLocationsServiceImpl.findServiceLocationsForGeoAndRadius`:

<a id="shared-8de24ae1b1bb"></a>

1. **Radius**: `radiusInMiles` from the request, else the fulfillment type's `defaultRadiusInMiles`.
2. `GEOSEARCH <fulfillmentType> FROMLONLAT lon lat BYRADIUS radius MI ASC WITHDIST`. Note: Redis returns **all** members in the circle (no `COUNT`).
3. Build an ordered id list and a `id → distance` map.
4. **Pagination is done in the application**: the "last evaluated key" is the last returned location id. The next page starts at `indexOf(lastId)+1`; `limit` cuts the sublist. The response metadata carries the new last id (encoded).
5. Hydrate with DynamoDB `findAllById(pageIds)`, set `distanceInMiles` and `allItemsAvailable=false` on each, optionally sort by distance, return.
6. If no coordinates but a fulfillment type is given, the service uses the **country default service location** (config `default-service-location`: W22 TH, B61 LATAM, J01 JP) as the reference point and sorts by distance from it.

### Worked example {#worked-example}

Customer in Bangkok asks for BOPIS points within 10 miles; 3 hits at 1.2, 3.8 and 9.5 mi; page size 2.

<a id="shared-7978bcced505"></a>

- Redis returns `[W22 (1.2), W41 (3.8), W07 (9.5)]`.
- Page 1: ids `[W22, W41]`, last key = `W41`. Page 2: start at index of `W41`+1 → `[W07]`, last key null.
- App service then adds Manhattan stock per location and re-sorts: *all-items-available first, then distance*.

### Known defect (important) {#known-defect-important}

<a id="shared-23f275dece60"></a>

The loader's key is `<COUNTRY>:<fulfillmentType>` (e.g. `TH:bopis`), while the search reads `<fulfillmentType>` (e.g. `bopis`). No prefix is configured in any ConfigMap, Helm value or `RedisConfig`. As written, coordinate searches query a key that the loader never populates. Existing production data might have been loaded by an older version *(unverified)*. The unit test mocks `geoadd(anyString(), …)` so it cannot catch this.

## A3. Use case 2: Estafeta pickup-check tokens (LATAM/Mexico) {#a3-use-case-2-estafeta-pickup-check-tokens-latammexico}

Purpose: Estafeta needs a *validate → confirm* handshake. NGC remembers the validation id between the two calls.

<a id="shared-eba3ca141011"></a>

| Step | Endpoint | Redis |
|---|---|---|
| Validate | `POST /service-locations/{id}/pickup-availability` | Calls Estafeta `validateLocation`. If `isAvailable`, `SET <checkoutId> <availabilityCheckId> EX ttl`. If not available → `PickupLocationNotAvailableException`. |
| Read/write directly | `GET/PUT /pickup-location-checks/{checkKey}` | `GET key` (404 if missing/empty) / `SET key value EX ttl` |
| Confirm | `POST /service-locations/{id}/pickup-reservations` | `GET availabilityCheckKey`; missing → "Validation Id not available anymore"; else Estafeta `confirmLocation(validationId, locationId)` and require `result == 0`. |

<a id="shared-46d9d271fd48"></a>

TTL: `config.ttl-for-redis-key`, default and configured value **360 seconds**. So the shopper has 6 minutes between validating a pickup point and placing the order. Key = the checkout/allocation id of the first request in the list.

Failure modes: Redis down → validate fails (set error) / confirm fails; TTL expiry → customer must re-select the point.

## A4. Redis interview answers {#a4-redis-interview-answers}

<a id="shared-46b935f52c4a"></a>

- **Why Redis and not DynamoDB geohash or Postgres PostGIS?** The location table already lives in DynamoDB; Redis geo gives radius queries with ordered distance cheaply. Trade-off: derived index must be rebuilt by a job.
- **Is Redis authoritative?** No. DynamoDB is. Redis can be rebuilt any time by running the Redis loader command.
- **What if Redis is cold or empty?** Coordinate searches return empty. Text, postcode and plain list queries still work from DynamoDB. There is no fallback for the geo path.
- **How do you refresh it?** Run the loader command where the country/profile lists it, usually last. CronJobs are declared in jobservice Helm values: TH UAT/prod daily, TH QA and Japan every 15 minutes, LATAM country-specific daily times. A job schedule does not establish a Redis refresh: Japan QA lists BOPIS only, Mexico prod lists easyDeliveryPoint/BOPIS without Redis, and Japan UAT/prod command profiles are absent. See the full guide §16.
- **What are the risks?** Key mismatch, stale members never removed, failures swallowed silently, in-memory pagination of the full radius result for large radii.
- **How does cluster mode matter?** Each geo key is a single key (single slot), so cluster is fine; all `GEOSEARCH` calls hit one node per key.

---

## Part B: Delivery fee {#part-b-delivery-fee}

## B1. Entry points and data model {#b1-entry-points-and-data-model}

<a id="shared-696e3f30c2d5"></a>

- **Client call**: `POST /delivery-fees` on appservice → `DeliveryFeesServiceImpl` (maps DTOs) → dataservice `POST /v1/delivery-fees` → `ServiceFeesServiceImpl.getDeliveryFees`.
- **Request** (one item per order/shipment): `id`, `fulfillmentTypeId`, optional `serviceLevelId`, `userType`, `orderType`, `isGroupOrder`, `isCombinedOrder`, `lineItems` / `bundleItems` with `lineAmount` (and optional PV/BV), product flags.
- **Validation**: each request needs at least one line or bundle, and every line needs `lineAmount`.
- **Where rules live**: each `FulfillmentType` has `serviceLevels` (standard, express, premium …), each with a list of **ServiceFee** rules:

<a id="shared-a5ebfadb142e"></a>

| Field | Meaning |
|---|---|
| `startDate` / `endDate` | validity window of this rule version (only `startDate` is used in the calculation) |
| `userType[]` | any of ANY, EMPLOYEE, MEMBER_PLUS, MEMBER, CUSTOMER, BUSINESS_OWNER |
| `orderType[]` | ANY, NORMAL, PROXY, GCO, GO, AUTO_SOP, SOP, AUTO_RENEWAL, RENEWAL, REGISTRATION, … |
| `minimumThresholdAmount` | threshold the order total must reach (in `thresholdType` units) |
| `thresholdType` | `AMOUNT` (default branch), `PV` (point value), `BV` (business volume) |
| `serviceFee` | the fee charged when this rule is chosen (0 = free delivery) |

Fulfillment type visibility is separate: `FulfillmentTypeFilter` hides a type only if both its restricted order types and restricted user types match the request.

## B2. The algorithm, step by step {#b2-the-algorithm-step-by-step}

For each fulfillment-type/service-level group:

<a id="shared-d5820e72123f"></a>

**Step 1: order total.** Sum `lineAmount` over all lines and bundle lines, rounded to 2 dp (HALF_EVEN), **excluding lines whose product is flagged `isServiceItem`**. PV and BV are summed over the same lines. Currency is taken from the first line.

<a id="shared-64b642f1bc7d"></a>

**Step 2: is a fee applicable at all?** If there are no fee rules → 0. If the total is 0, a fee still applies only when at least one line is **not** a service item (so a 0-priced gift order of real products still gets evaluated; an order of only service items pays 0).

**Step 3: pick the effective rule set** (`ServiceFeesFilter`):

<a id="shared-6c26046d8c3b"></a>

1. Keep rules whose `startDate` is in the past; of those, keep only the ones at the **latest start date**. (Older generations are ignored; future ones not yet active.)
2. Narrow by criteria with priority `USER_TYPE` then `ORDER_TYPE`:
   - First prefer rules that match by user type; if none, by order type; if still none, keep all.
   - Group by `minimumThresholdAmount`. For each threshold keep rules where (`userType` contains the user's type **or ANY**) **and** (`orderType` contains the order's type **or ANY**).
   - If several rules share a threshold, prefer one that matches **both** exactly; else fall back by the priority rule; take the first.
   - Result: at most one rule per threshold.

**Step 4: choose the fee.** Sort remaining rules by `minimumThresholdAmount` **descending** and take the first rule where `measuredTotal >= minimumThresholdAmount`:

<a id="shared-7515219fd322"></a>

- `AMOUNT` → order total, `PV` → total point value, `BV` → total business volume.
- If none qualifies → fee = 0 (and no match means "free" by default; the highest-threshold-first order makes the first match the best-applicable tier).

<a id="shared-aca0da88d0c0"></a>

**Step 5: free-delivery threshold** (shown in UI as "spend X for free delivery"): across the applicable rules, the **first rule with `serviceFee == 0`** → its `minimumThresholdAmount`, currency and `thresholdType`. None → 0.

<a id="shared-117a323b87fb"></a>

**Step 6: group + combined orders** (`isGroupOrder && isCombinedOrder`): totals of all requests are summed first; the fee is calculated **once** and attached to the **first (parent) request**; every other request gets fee 0.

<a id="shared-652417aaab1a"></a>

**Output**: per `fulfillmentTypeId` + `serviceLevelId`: `deliveryfees[] {id, fee}` and `freeDeliveryThresholdAmount`. (The schema also has `totalApplicableFee`, but this service does not set it.)

If `serviceLevelId` is omitted, a result is returned for **every** service level of the fulfillment type (for the "choose standard/express" UI).

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
