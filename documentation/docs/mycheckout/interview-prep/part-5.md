---
slug: /mycheckout/interview-prep/part-5
title: "mycheckout — Checkout Platform: Interview Preparation — Part 5"
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

# mycheckout — Checkout Platform: Interview Preparation — Part 5

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `INTERVIEW-PREP.md` |
| Source SHA256 | `d66d6ba6319504f369415902a6e00eb5d3899fda752d33ddc02b69eb911129ef` |
| Guide part | 5 of 7 |

[Part 1](/mycheckout/interview-prep/part-1) · [Part 2](/mycheckout/interview-prep/part-2) · [Part 3](/mycheckout/interview-prep/part-3) · [Part 4](/mycheckout/interview-prep/part-4) · [Part 5](/mycheckout/interview-prep/part-5) · [Part 6](/mycheckout/interview-prep/part-6) · [Part 7](/mycheckout/interview-prep/part-7)

<a id="shared-aa967f3016d2"></a>

## Q11. "How do you use Redis to cache ATS? TTL, invalidation, updates, cache misses, avoiding DB calls?" {#q11-how-do-you-use-redis-to-cache-ats-ttl-invalidation-updates-cache-misses-avoiding-db-calls}

<a id="shared-8f2655d5463b"></a>

This question assumes something that is **not true in our code**. Interviewers often ask it as a probe. Don't invent a Redis ATS cache: a follow-up question will expose it. Correct the premise confidently, explain why, then show you can design one.

### Re-checked in the code {#re-checked-in-the-code}

<a id="shared-0045504bc89f"></a>

- **No ATS or stock data in Redis.** Only the fulfillment data service connects to Redis. It uses two things: a **GEO index** of pickup locations and **plain string keys** for pickup-point validation tokens (code: `RedisConfig` exposes only geo and value commands).
- **No cache layer around ATS** in fulfillment or checkout: no cache annotations, cache managers or Caffeine. Git history of the checkout app tier has no cache-related changes (one branch name mentions "cache-fix" but its commits are infra updates).
- **Other caches found in the workspace:** product app service has an in-memory location cache in config (max size 1000) that is **disabled**; the order app service caches OAuth tokens in memory; master data and feature flags are held in memory by the platform starters. None of these is stock.

### Say this {#say-this-10}

<a id="shared-19e18ecb90e6"></a>

> "We actually **don't cache ATS in Redis**, on purpose. Stock changes with every reservation, feed update and order event, and a stale number means overselling. So on the checkout path we read ATS live from the stock ledger: it's one indexed read of the latest row per item and warehouse, which is cheap. The high-volume reads, product pages and search, never call ATS at all. Every stock change is captured by CDC, and fulfillment **pushes** an availability event to product and search when the disposition changes (in stock, backorder, out of stock). So you could say the cache lives in product/search and it's **invalidated by events, not by TTL**. We use Redis in fulfillment for two other things: the geo index for nearby pickup stores, and short-lived pickup validation tokens with a 360-second TTL."

### Answers to each sub-question (truthful) {#answers-to-each-sub-question-truthful}

<a id="shared-82e04004fb0a"></a>

| They ask | What's true |
|---|---|
| **TTL?** | No ATS cache, so no ATS TTL. Redis TTLs that exist: pickup validation token **360 s** (`config.ttl-for-redis-key`). The geo index keys have **no TTL**. Other TTLs in the system: DynamoDB checkouts 90 days, sales-order staging 1 hour |
| **Invalidation?** | ATS display data: event-driven. Ledger change → CDC (`stocklevel_raw`) → fulfillment compares version N with N−1 → publishes an availability event only if disposition, dates or status changed → product/search update. Geo index: rebuilt by a scheduled job with `GEOADD` (upsert); nothing removes deleted locations (a known gap) |
| **Updating the cache?** | Push model via Kafka as above, i.e. write-through from the source of truth through events. Geo: CronJob-driven loader reads DynamoDB and re-adds points |
| **Cache miss?** | ATS: there's nothing to miss; the ledger is the source. Geo index: if Redis returns nothing, the API returns an empty list; there's **no fallback** to DynamoDB for coordinate searches (a gap to mention) |
| **Avoiding DB calls?** | (1) Browse traffic reads pushed availability, not ATS. (2) Allocation keeps an in-memory stock map per request, so several lines for the same item don't re-read. (3) Reads are by key on the latest version, no scans. (4) Locks only on writes. (5) Postgres is Aurora Serverless, so capacity grows with load |

### If they say "OK, how would you design Redis caching for ATS?" {#if-they-say-ok-how-would-you-design-redis-caching-for-ats}

Make it clear this is a design answer: "If I needed it, I'd do it like this."

<a id="shared-64099f298ef1"></a>

1. **Scope:** cache only for **display** (product page, listing, cart badge). **Reservations never trust the cache**; they always go to the source of truth under a lock.
2. **Key and value:** `ats:{tenant}:{country}:{sku}:{warehouse}` → `{ats, disposition, version, updatedAt}`.
3. **Pattern:** **cache-aside** on read, plus **event-driven update**: the CDC consumer that already sees every ledger change writes the new value to Redis. Use a small Lua script so a write only wins if its `version` is newer, which handles out-of-order events.
4. **TTL:** short safety-net TTL, e.g. 30–60 s with random jitter, so a missed event can't leave stale data forever and keys don't all expire together.
5. **Cache miss:** read from the DB, populate, return. Prevent a **stampede** on a hot SKU with request coalescing (single-flight per key) or a short lock key (`SET NX PX`). Cache "unknown SKU" for a few seconds (negative caching).
6. **Hot keys in a flash sale:** a tiny in-process L1 cache (1–2 s) in front of Redis, or replicate hot keys.
7. **Failure mode:** if Redis is down, fall back to the DB with a circuit breaker and rate limit, rather than failing the page.
8. **Measure:** hit ratio, staleness (event lag), and oversell incidents.
9. **Flash-sale variant:** some retailers make Redis the **reservation authority** (`DECRBY` in a Lua script, checking stock ≥ qty) and persist to the DB asynchronously. It's very fast but needs durability (AOF), reconciliation, and careful recovery. I'd only do it for flash-sale SKUs.

### Likely follow-ups {#likely-follow-ups-10}

<a id="shared-147425311339"></a>

- **"Isn't reading the DB on every checkout slow?"** It's one indexed read per item/warehouse, only on the checkout path, which is a small fraction of browse traffic. Correctness matters more there.
- **"How stale can product pages be?"** As stale as the CDC + Kafka lag, normally seconds. The reservation re-check (409 → out-of-stock message) is the safety net.
- **"Why push instead of TTL?"** TTL guesses at freshness; events tell you exactly when something changed, and only meaningful changes are published, which keeps volume down.

---

## Q12. How do we use Redis to show nearby stores (pickup points) in checkout? {#q12-how-do-we-use-redis-to-show-nearby-stores-pickup-points-in-checkout}

### Say this {#say-this-11}

<a id="shared-ad4a2e9d039c"></a>

> "Pickup locations live in **DynamoDB** as the source of truth. A scheduled job loads them into a **Redis GEO index**, one sorted set per fulfillment type, with the location id as the member. When the customer picks 'pick up in store' at checkout, the storefront calls the fulfillment app service with their coordinates. The data service runs `GEOSEARCH` by radius, ascending by distance, gets the ids and distances, then loads the full records from DynamoDB in a batch. For buy-online-pick-up-in-store, the app service then checks stock per store and sorts **stores with all items available first, then by distance**."

### Go deeper (code, fulfillment data and app services) {#go-deeper-code-fulfillment-data-and-app-services}

**Loading the index**

<a id="shared-5c7249b13073"></a>

- A Kubernetes **CronJob** (fulfillment job service, `concurrencyPolicy: Forbid`) calls the data service's command API for a list of loaders per country. Partner loaders (store systems and carriers) upsert DynamoDB; where configured, the **Redis loader runs last**.
- Redis loader: full scan of the locations table → group by country and fulfillment type → drop invalid coordinates (Redis geo limits: latitude ±85.05, longitude ±180) → `GEOADD <COUNTRY>:<fulfillmentType> lon lat locationId`.
- Redis is **ElastiCache over TLS**, cluster mode in some prod tenants.

<a id="shared-f9a983b23571"></a>

**Querying** (`GET /service-locations`)
| Input | Path |
|---|---|
| Latitude + longitude | Redis `GEOSEARCH key FROMLONLAT lon lat BYRADIUS r MI ASC WITHDIST`; radius from the request or the fulfillment type's default |
| Post code | DynamoDB key lookup |
| Free text | DynamoDB search |
| Fulfillment type only | Geo search around the country's default store |

Then: page the id list in memory (the "last key" is the last id returned), batch-get those ids from DynamoDB, attach distance, return.

<a id="shared-abc42d773584"></a>

**At checkout** (`POST /cart-pickup-locations`, app service): a strategy per fulfillment type. Store pickup adds a **stock check per location** with the inventory system; a Mexico carrier pickup calls the carrier; all paths apply shipping restrictions, hide disabled locations, paginate (default 200) and sort available-first then distance.

<a id="shared-d9ea636ee229"></a>

**Pickup validation token** (carrier pickup points in Mexico): validate with the carrier → `SET <checkoutId> <validationId> EX 360` → at place order, read the key and confirm with the carrier; if it expired, the customer must re-select. This is separate from stock reservation.

### Why Redis here (reasoned) {#why-redis-here-reasoned}

<a id="shared-39b45cbb3deb"></a>

DynamoDB can't answer "nearest N within R km" efficiently. Redis GEO (geohash in a sorted set) answers radius queries in memory in milliseconds. DynamoDB stays the source of truth, Redis is a **derived, rebuildable index**.

### Known gaps (good to mention as findings, briefly) {#known-gaps-good-to-mention-as-findings-briefly}

<a id="shared-e8bd6ea1cef4"></a>

1. **Key mismatch:** the loader writes `<COUNTRY>:<type>` but the search reads `<type>`, with no prefix configured. As written, coordinate search would hit an empty key. Production may hold data from an older version; not verifiable here.
2. **No removal:** deleted locations stay in the index (a stale id just fails to load from DynamoDB).
3. **No `COUNT`:** the whole radius is returned and paged in memory.
4. **No fallback** if Redis is empty or down.
5. GEOADD errors per type are logged and swallowed.

<a id="shared-edc59e98f397"></a>

**Fixes I'd propose:** one key-building function used by both writer and reader; rebuild into a temp key and `RENAME` atomically (removes stale members); `ZREM` on location delete; `GEOSEARCH … COUNT n`; fall back to post-code search on Redis failure; alert when an index is empty.

### Likely follow-ups {#likely-follow-ups-11}

<a id="shared-6d2bdeb837f8"></a>

- **"How does GEOSEARCH work?"** Coordinates are encoded as a 52-bit geohash used as the sorted-set score; a radius search checks the neighbouring geohash cells and filters by exact distance.
- **"How often is the index refreshed?"** By CronJob per tenant and country (schedules are in the job service Helm values). Not real time; fine because stores change rarely.
- **"Why not OpenSearch/PostGIS?"** Either works. Redis was already available, it's fast and simple for pure radius queries; OpenSearch would add text + geo in one query.

---

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
