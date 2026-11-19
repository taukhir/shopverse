---
slug: /mycheckout/fulfillment-docs/fulfillment-interview-prep/part-2
title: "mycheckout — Fulfillment: Interview Prep Guide — Part 2"
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

# mycheckout — Fulfillment: Interview Prep Guide — Part 2

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `fulfillment docs/FULFILLMENT-INTERVIEW-PREP.md` |
| Source SHA256 | `d7d34dfba3e369822088d37fe08b7a41eb8c28450b1b737c08d5a7a3726f77d8` |
| Guide part | 2 of 3 |

[Part 1](/mycheckout/fulfillment-docs/fulfillment-interview-prep/part-1) · [Part 2](/mycheckout/fulfillment-docs/fulfillment-interview-prep/part-2) · [Part 3](/mycheckout/fulfillment-docs/fulfillment-interview-prep/part-3)

## 6. Scenario: "reserved 89, feed says out of stock" (NEXTGEN) {#6-scenario-reserved-89-feed-says-out-of-stock-nextgen}

<a id="shared-fad9129ab130"></a>

1. **Feed arrives.** `EOD` → on-hand becomes 0 (absolute). `REL` → on-hand drops by the delta. `DSP` → status becomes e.g. FORCE_TNA (stock unchanged).
2. **Reserved stays 89** (the feed does not touch it), unless `EOD` reservation sync is enabled for that SKU, in which case it is set from AS400's `RESERVATION` figure.
3. **Raw availability** is `0 - 89 = -89`; **sellable ATS is clamped to 0** (`Math.max(0, …)`). Disposition follows the rule (BO if backorder capacity, else TNA/NLA/…; FORCE_IN_STOCK still sells).
4. **New shoppers:** disposition follows the stock rule. Reservation fails with `Insufficient stock` / HTTP 409 if the selected pool cannot cover the quantity; allowed backorder capacity can still support a BO reservation. FORCE_IN_STOCK is exempt.
5. **89 is a reserved quantity, not necessarily 89 orders.** The feed does not auto-cancel reservations. A later `ORDER_READY_FOR_FULFILLMENT` event subtracts from on-hand and reserved (can go negative); this event is not proof of physical shipment. Cancellation events produce RELEASE.
6. **Downstream:** if disposition/date/status changes, CDC processing publishes an availability event. Quantity-only changes may not publish. Product/PDP/Search consumers were not inspected.
7. **Who tells AS400/OMS about the reservation?** Nobody, on the NGC path: there is no producer toward AS400, and reservations stay in NGC's table. OMS is told only through the order itself; sales-order events come back carrying `inventoryReservationId`. On the **Manhattan** path the reservation lives in Manhattan.

Business gap to mention: negative raw availability is not alerted on anywhere in code.

---

## 7. Service locations and Redis {#7-service-locations-and-redis}

<a id="shared-efe77e3f10c7"></a>

- **Source of truth:** DynamoDB (`ServiceLocationEntity`). **Redis** holds a geo index (derived) plus short-lived Estafeta check tokens.
- **Loading:** `jobservice` calls `POST /commands` for the beans in the selected country/profile list. Partner loaders upsert DynamoDB with batch cleanup; where configured, the Redis loader runs afterward, full-scans DynamoDB, drops invalid coordinates, and `GEOADD`s to `<COUNTRY>:<fulfillmentType>`. Not every country/profile includes every bean or Redis.
- **Query routing** (`GET /service-locations`): text search → Dynamo; lat/long → Redis `GEOSEARCH` (radius in miles, default from the fulfillment type, ascending); postCode → Dynamo key `postCode#type`; type only → geo around the country's default location (W22 TH, B61 LATAM, J01 JP).
- **Cart pickup (`POST /cart-pickup-locations`):** strategy per fulfillment type: Estafeta (MX, easyDeliveryPoint) calls Estafeta directly; BOPIS adds a **Manhattan per-location stock check** (all items must satisfy on-hand, plus future quantity if `backorder-as-available`); default just returns locations. Common helper also applies OMS shipping restrictions, removes `locationsDisabledForPickup` (unless the NGC admin client), paginates (default 200), and sorts **all-items-available first, then distance**.
- **Redis check tokens:** Estafeta availability token stored under the checkout id with TTL 360 s (`config.ttl-for-redis-key`). Reserve/confirm fails if it expired.
- **Redis config:** hosts from `REDIS_HOST/REDIS_PORT` (ElastiCache over TLS; cluster config in THA/LATAM prod).
- **Known issue:** loader writes `TH:bopis`, search reads `bopis`; no prefix configured anywhere. Geo search would return empty. No code removes stale members either.

---

## 8. Delivery fee {#8-delivery-fee}

`POST /delivery-fees` (appservice → dataservice) *(code)*:

<a id="shared-0c5ddad91c61"></a>

1. Group requests by fulfillment type (+ service level; if none given, compute for every level).
2. **Total** = sum of line amounts (including bundle lines), **excluding service items**; also PV and BV sums.
3. **Select rules:** only the fee set with the **latest start date already in the past**; filter by user type and order type (exact match first, then `ANY`); among rules with the same minimum threshold pick the exact match.
4. **Choose fee:** sort remaining rules by minimum threshold **descending**; first rule whose total (amount/PV/BV per `thresholdType`) ≥ threshold wins; none → 0.
5. Fee is 0 if no rules or (total 0 and all items are service items).
6. **Free-delivery threshold** returned = threshold of the first zero-fee rule.
7. **Group+combined orders:** totals summed; fee charged once on the first request, others 0.

<a id="shared-7784bd22d614"></a>

Gotchas: allocation responses never carry a fee (`calculateAndUpdateServiceFees` has no production caller). `FulfillmentTypeFilter` hides a type only if *both* restricted order types and restricted user types match.

---

## 9. Delivery dates and slots {#9-delivery-dates-and-slots}

<a id="shared-1c6f7da7bb1e"></a>

`GET /delivery-slots/availability?postalCode=…`: postal code → `postal_code_serviceability` (valid at order time, per country) → zone, warehouse, `timedDelivery`. Timed zones get slots from `DeliveryTimeSlot` master data; available dates come from the `delivery_date` table for the zone from "now" in the country's time zone. Not serviceable → non-recoverable validation error. The same row picks the **warehouse** for allocation; fallback is the country default (WA1 TH, B60 LATAM, JA1 JP).

---

## 10. Jobs and events cheat sheet {#10-jobs-and-events-cheat-sheet}

<a id="shared-312a79c84e39"></a>

**Jobs:** `jobservice` has Kubernetes CronJobs in Helm values: Japan QA/UAT/prod every 15 minutes; TH QA every 15 minutes, TH UAT/prod daily 18:00 by the committed cron; LATAM per-country daily schedules. Actual execution also requires a matching command profile (Japan UAT/prod profiles are absent here). See full guide §16. The stock purge method (`purgeOldStockLevels`, defaults: keep ≥10 versions, delete older than 720 h) has **no caller**.

<a id="shared-e22e077bca60"></a>

**Consumes:** AS400 inventory (+RLQ), sales-order (+RLQ), stock-level CDC; daily/intraday/aggregated feeds exist but are disabled by default.
**Produces:** `inventory-availability_pub_v1` (JSON); DLQ/RLQ topics.
**Sales-order event types handled:** ORDER_READY_FOR_FULFILLMENT, ORDER_COMPLETE (POS only), ORDER_CANCELLED.

---

## 11. Corrections to earlier explanations {#11-corrections-to-earlier-explanations}

<a id="shared-d20a8035e1fb"></a>

| Earlier statement | Correct (from code) |
|---|---|
| REL is an absolute override | `REL` is a **delta** added to on-hand; only `EOD` is absolute |
| EOD takes status from the feed | EOD **keeps the existing status**; feed status used only for the first version |
| Reserving on a TNA item silently reserves nothing | `RESERVE` **throws `STOCK_LEVEL_INSUFFICIENT_STOCK`** |
| ON_HAND_ADJUSTMENT arithmetic unknown | Subtracts the quantity from both on-hand and reserved, unclamped |
| Transaction types: MANUAL, RESERVE, RELEASE, ON_HAND_ADJUSTMENT, DAY_END, INTRA_DAY | Also `BACKORDER_RELEASE` and `BACKORDER_RELEASE_RESERVE` |
| Docs list `FULFILLMENT_READY_EVENT` / `CANCELLED` types | Not in the strategies; sales orders use ON_HAND_ADJUSTMENT / RELEASE |
| All markets use the NGC ledger | Only `nextgen` markets (Japan); base default is Manhattan |
| Allocation groups carry delivery fee | Not populated by the data service |

---

## 12. Known issues to mention (shows depth) {#12-known-issues-to-mention-shows-depth}

<a id="shared-a4fc0743fac4"></a>

1. Redis geo key mismatch and no stale removal.
2. Purge has no trigger.
3. RLQ publish failures swallowed.
4. Aggregated daily-feed consumer sends an empty request (channel disabled by default).
5. `EOD` reservation sync can overwrite reserved quantities for flagged SKUs.
6. Release and on-hand adjustment can drive counters negative.
7. Null unboxing risk in view strategies (`backorderReserve`, `backorderQuantity`, `sopProtection`).
8. TNA/NLA/NYA/NAW allocation entries omit sourced/backorderable fields.
9. Audit endpoint: MANUAL only, `page` has no offset effect.
10. Reservation always uses REGULAR_VIEW even for AUTO_SOP allocation.
11. BOPIS availability comes from Manhattan, not the NGC ledger.
12. Stale tests assert removed evaluator mutation.

---

## 13. Interview Q&A bank {#13-interview-qa-bank}

### Architecture {#architecture}

<a id="shared-2162c574af99"></a>

**Q1. What does the fulfillment domain do?** Three things for checkout: ATS (stock, allocation, reservation), service locations (pickup points), delivery fee. Plus fulfillment types, warehouses, serviceability, delivery dates/slots, addresses.
**Q2. Why four services?** Separation of concerns: façade (appservice), logic/storage (dataservice), async integration (eventservice), batch (jobservice). The façade keeps client contracts stable while the data service evolves.
**Q3. Why Quarkus/reactive?** Non-blocking I/O for high-fan-out calls (Manhattan, OMS, DynamoDB, Postgres). Consumers that must do blocking work use `@Blocking`.
**Q4. How does multi-tenancy work?** Tenant/country in request tuples (`TupleService`); Kafka events set tenant from the affiliate code (`TenantContextHolder.setByCode`); per-tenant ConfigMaps and topic patterns.
**Q5. NGC vs Manhattan?** `config.ats-service` switch; see section 3.

### ATS {#ats}

<a id="shared-ac7fb7f47f03"></a>

**Q6. How is ATS calculated?** Section 4.2. Computed on read from the latest ledger row, never stored.
**Q7. Why append-only versions?** Audit/history, optimistic concurrency, CDC friendliness (compare N vs N-1), safe as-of queries; purge bounds growth.
**Q8. How do you stop overselling?** Advisory lock per stock key before read-modify-write; `RESERVE` re-validates against current ATS and throws on shortfall; idempotency by `referenceId`.
**Q9. What are the dispositions?** SHP, BO, TNA, NLA, NYA, NAW; mapping in 4.3.
**Q10. What's the difference between `stockLevelStatus` and `dispositionStatus`?** Status is the configured rule (input); disposition is the calculated outcome (output).
**Q11. What does FORCE_IN_STOCK do to reservations?** Reserve/release are skipped (no ledger row). Risk: reservations made before switching to FORCE_IN_STOCK may not be released.
**Q12. What are SOP protection and SOP view?** Quantity held back for subscription/auto-ship orders; regular views subtract it, SOP view doesn't.
**Q13. Explain backorder reserve.** Counter of quantity promised against backorder capacity; reduces backorder ATS and (in this formula) on-hand ATS.
**Q14. What is `beBackorderQuantity`?** A bundle-related counter bumped when a required bundle line is fulfilled on backorder (protects the non-required lines); released on cancel.
**Q15. What happens when two shoppers reserve the last unit?** Lock serializes them; second sees ATS 0 and gets insufficient stock.
**Q16. How is idempotency done?** Reserve/release/backorder-release by `referenceId`; manual and on-hand adjustment by `transactionId`; batch fast-path returns existing rows if all lines are duplicates.
**Q17. Why is allocation separate from reservation?** Shopping plans without a persisted hold; reservation rechecks and writes under lock. Allocation shares a map across lines, but the current DTO path still has the double-deduction issue (§4.6).
**Q18. How are bundles handled?** Bundle lines are allocated alongside regular lines against the same stock map; bundle fulfillment skips minor lines when the major line is backordered.

### Feed {#feed}

<a id="shared-204a9fa84794"></a>

**Q19. How does the feed arrive?** Section 5.
**Q20. Absolute vs delta?** `EOD` absolute; `REL` delta; `DSP` status only.
**Q21. What if the feed arrives for an unknown item?** `EOD` can create the first version; `REL`/`DSP` require an existing row and fail (client error → DLQ).
**Q22. What if the feed is malformed?** Parse tries several header strategies; if all fail → illegal argument → DLQ. Validation failure → DLQ.
**Q23. How do you avoid losing events?** Ack after processing, RLQ for retryable errors, DLQ for the rest. Caveat: RLQ publish errors are swallowed.
**Q24. Ordering/duplicates?** Kafka partition order per key (partitioning key not verified); duplicates handled by `transactionId = AS400 eventID` for stored rows; stale-event rejection is not implemented.
**Q25. What is the refresh rate?** Event-driven, not polled. Cadence set by AS400; consumer fetch wait ≤ 0.5 s; sequential processing. No measured latency in repo.
**Q26. How does checkout see the change?** Next allocation reads the latest row, so it sees it immediately after commit; PDP/Search via CDC-driven availability events.
**Q27. What triggers an availability event?** Disposition change for a view, ETA/discontinuation change, or status change (section 5).
**Q28. How do you reconcile feed vs reservations?** Feed owns on-hand; NGC owns reservations; `EOD` reservation sync (flagged SKUs) is the only reconcile hook.

### Locations / Redis {#locations--redis}

<a id="shared-dc87fae151ce"></a>

**Q29. Where is Redis used?** Geo index for locations; Estafeta check tokens (TTL 360 s).
**Q30. How do you find nearest locations?** `GEOSEARCH` by radius (miles) ascending; hydrate from DynamoDB; page in memory.
**Q31. How is Redis refreshed?** By the Redis loader command (full scan → `GEOADD`) where the country/profile command list includes it, usually last. Mexico prod and Japan QA lists do not include it.
**Q32. What if Redis is stale or empty?** Geo results empty/outdated; fallback is not implemented for coordinate queries. (And the key mismatch issue.)
**Q33. How is BOPIS availability determined?** Manhattan inventory per item and location; all items must meet requested quantity.
**Q34. How are locations sorted?** Available first, then distance.
**Q35. How do you hide a location?** `config.locationsDisabledForPickup` (hidden from non-admin clients).

### Delivery fee / dates {#delivery-fee--dates}

<a id="shared-7387e9558f9a"></a>

**Q36. How is the delivery fee computed?** Section 8.
**Q37. How is free delivery shown?** Threshold of the first zero-fee rule.
**Q38. How are PV/BV used?** As alternative threshold types for fee rules.
**Q39. How are delivery dates determined?** Section 9.

### Reliability / design judgement {#reliability--design-judgement}

<a id="shared-2244bfe9fa71"></a>

**Q40. What would you improve?** Fix Redis key; wire/remove purge; guard nulls; floor release at 0 or alert; alert on negative raw ATS; make RLQ publish failures fail loudly; add integration tests for shared-stock allocation; consider batching consumer writes.
**Q41. What are the risks of the design?** Single-writer lock hot SKUs; sequential feed processing; unclamped counters; provider split causes divergent behaviour; hard-coded REGULAR_VIEW in reservations.
**Q42. How would you test the feed?** Unit-test each strategy arithmetic, an API runner for lifecycle (stock → allocate → reserve → release → restore), plus idempotency and negative scenarios.

---

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
