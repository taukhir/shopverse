---
slug: /mycheckout/fulfillment-docs/fulfillment-end-to-end/part-5
title: "mycheckout — Fulfillment: End-to-End Guide — Part 5"
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

# mycheckout — Fulfillment: End-to-End Guide — Part 5

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `fulfillment docs/FULFILLMENT-END-TO-END.md` |
| Source SHA256 | `5c0985b97fc0201d78f7a2cbf248cb7b16dba20c5e63a9f422c6568376b97eed` |
| Guide part | 5 of 6 |

[Part 1](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-1) · [Part 2](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-2) · [Part 3](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-3) · [Part 4](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-4) · [Part 5](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-5) · [Part 6](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-6)

## 15. Exact availability rules and current allocation limitation {#15-exact-availability-rules-and-current-allocation-limitation}

### 15.1 Stored quantities versus computed ATS {#151-stored-quantities-versus-computed-ats}

<a id="shared-36503b306a87"></a>

Let `OH=onHandQuantity`, `R=reservedQuantity`, `BR=backorderReserve`, `SP=sopProtection`, `BQ=backorderQuantity`. `BQ` is the configured backorder capacity, not a count of customer orders; `BR` consumes that capacity. `beBackorderQuantity` supports bundle/backorder handling and is not subtracted separately in these view formulas.

<a id="shared-bd102a15b417"></a>

| View | On-hand ATS | Backorder ATS |
|---|---|---|
| REGULAR_VIEW | `max(0, OH-R-BR-SP)` | `max(0, BQ-BR)` only for SHIP_ELSE_BACKORDER or FORCE_BACKORDER; otherwise 0 |
| SHIP_TO_HOME_VIEW | `max(0, OH-R-BR-SP)` | Same |
| SOP_VIEW | `max(0, OH-R-BR)` | Same |

<a id="shared-731f74262bbb"></a>

FORCE_TNA/NLA/NYA/NAW override both ATS values to 0. FORCE_IN_STOCK forces a SHP disposition and the fulfillable evaluator returns the full requested quantity even if numerical ATS is zero. It skips ledger reservation. FORCE_BACKORDER forces the BO route. Persisted null counters can still cause unboxing errors; normal builders default/preserve counters, but the arithmetic itself is not null-safe.

### 15.2 All ten status rules {#152-all-ten-status-rules}

<a id="shared-f07908c0a77e"></a>

| Rule | Fulfillable result |
|---|---|
| FORCE_IN_STOCK | SHP for requested quantity |
| FORCE_BACKORDER | BO for `min(requested, backorderATS)` |
| FORCE_TNA / FORCE_NLA / FORCE_NYA / FORCE_NAW | Corresponding disposition, quantity 0 |
| SHIP_ELSE_BACKORDER | TNA if both pools empty; SHP if on-hand covers full request; otherwise BO if backorder covers full request; otherwise SHP for available on-hand in the current implementation |
| SHIP_ELSE_TNA | SHP for up to on-hand ATS; TNA if none |
| SHIP_ELSE_NLA | SHP for up to on-hand ATS; NLA if none |
| SHIP_ELSE_NAW | SHP for up to on-hand ATS; NAW if none |

<a id="shared-ff03c3283025"></a>

This implementation chooses **one disposition/quantity per line**. It does not generally combine 3 on-hand plus 2 backorder into a mixed 5-unit allocation. Reservation validates the selected pool against the requested transaction split and can reject partial quantities.

### 15.3 Earlier fix claim versus current source {#153-earlier-fix-claim-versus-current-source}

<a id="shared-02786c7965d8"></a>

The two overloads of `AvailabilityCalculationStrategy.evaluateFulfillableQuantities` differ. The `StockLevelEntity` overload is pure; the `StockLevelResponseDataDto` overload still calls `setOnHandQuantity` / `setBackorderQuantity` in several branches. `StockLevelAllocationHelper.buildAllocationEntryWithStock` passes the DTO and then increments `reservedQuantity` or `backorderReserve` too. The earlier bug writeup describes the intended correction, not the current implementation of this overload.

<a id="shared-cc9c84e93d24"></a>

**Reproduction by arithmetic, not an executed API test:** start `BQ=999, BR=0, OH=0`, status SHIP_ELSE_BACKORDER. First request 90 returns BO 90, reduces DTO BQ to 909, then helper raises BR to 90. Second request 990 calculates backorder ATS `909-90=819`. Neither pool covers 990, so current fallback is SHP 0. The desired fixed behavior BO 90 then BO 909 is **not established in this workspace**. A similar double consumption exists for on-hand branches. Allocation mutates only the request-local DTO map, not persisted ledger supply.

### 15.4 Worked committed-stock lifecycle {#154-worked-committed-stock-lifecycle}

<a id="shared-3a467cbaeba3"></a>

Start `OH=100, R=10, BR=0, SP=5, BQ=50`: regular ATS is 85. Reserve 4 sourced units → `R=14`, regular ATS 81. On a later ready-for-fulfillment event for those 4 → `OH=96, R=10`, ATS stays 81. Alternatively cancel before consumption → `OH=100, R=10`, ATS returns to 85. Do not execute both terminal operations for the same quantity as though they were independent legitimate consumption.

<a id="shared-115e7f72c987"></a>

For the “reserved 89” case, EOD with `OH=0` and **no supplied reservation-sync quantity** preserves `R=89`; raw ATS is negative and returned ATS clamps to 0. If BO capacity remains and the status permits it, new backorder reservations can still be possible; "all reservations fail" is only true when no allowed pool covers the requested quantity. A flagged EOD sync can instead overwrite R. A later consumption adjustment has no floor and can make OH negative; clamping the read result does not repair those stored counters.

## 16. Job schedules and environment routing {#16-job-schedules-and-environment-routing}

### 16.1 CronJob schedule matrix {#161-cronjob-schedule-matrix}

<a id="shared-6a2451ae89a6"></a>

Source: jobservice Helm `values-*.yaml`. Times below are the cron fields as committed; comments describe them as UTC. No explicit `timeZone` field was found in these values, so controller/chart behavior must be checked before treating UTC as a deployed guarantee.

<a id="shared-5b837a6b6f23"></a>

| Tenant/environment | Country | Cron | Repository interpretation |
|---|---|---|---|
| Global dev | inspect job args | `*/15 * * * *` | Every 15 minutes |
| Japan QA/UAT/prod | JP | `*/15 * * * *` | Every 15 minutes |
| Thailand QA | TH | `*/15 * * * *` | Every 15 minutes |
| Thailand UAT/prod | TH | `0 18 * * *` | Daily 18:00, comment says 01:00 Thailand |
| LATAM QA/UAT/prod | CO | `0 6 * * *` | Daily 06:00 |
| LATAM QA/prod | MX | `0 8 * * *` | Daily 08:00 |
| LATAM UAT | MX | `0 10 * * *` | Daily 10:00; differs from QA/prod |
| LATAM QA/UAT/prod | AR | `10 3 * * *` | Daily 03:10 |
| LATAM QA/UAT/prod | CL | `20 4 * * *` | Daily 04:20 |
| LATAM QA/UAT/prod | CR | `30 6 * * *` | Daily 06:30 |
| LATAM QA/UAT/prod | SV | `40 6 * * *` | Daily 06:40 |
| LATAM QA/UAT/prod | GT | `50 6 * * *` | Daily 06:50 |
| LATAM QA/UAT/prod | HN | `20 7 * * *` | Daily 07:20 |
| LATAM QA/UAT/prod | PA | `10 6 * * *` | Daily 06:10 |

### 16.2 What a scheduled run actually does {#162-what-a-scheduled-run-actually-does}

<a id="shared-f724c3300e08"></a>

The job is a Spring `CommandLineRunner`, gated by `config.enable-execution`, supplied with `--country=...` and tenant environment/name. Helm values declare `concurrencyPolicy: Forbid` and `restartPolicy: Never`; Forbid applies to overlapping runs of that CronJob, not to every manual command or all countries globally.

<a id="shared-3192bb47b152"></a>

`CommandExecutionService` reads `countySpecificConfigMap` (the spelling is in the code). It generates a new UUID per command, POSTs a bean id, then GETs command status until COMPLETED/FAILED or its poll limit. Profiles commonly configure a 10-second polling gap, 5 polls, and Thailand's 7-Eleven uses 20. Null/error paths and exhausted polling can log and proceed; a completed process alone does not prove every location source refreshed.

<a id="shared-203f51c40ce0"></a>

The current Quarkus `CommandsServiceImpl` saves INITIATED, **awaits the strategy within the POST reactive chain**, then saves COMPLETED or FAILED and returns. It is not a detached background launch. The job may therefore receive a terminal status before its first GET; a long-running POST can hit client/network timeout before polling starts. Repeated command ids recover an existing entity and still enter strategy execution; the idempotency-derived id is not proof the strategy runs exactly once.

<a id="shared-2b9959b160d5"></a>

Japan has QA/UAT/prod CronJob manifests, but only `application-jpn-qa.yml` is supplied among Japan-specific job source profiles. It lists BOPIS only. There is no checked-in Japan UAT/prod command profile establishing their command lists; values files alone do not close that configuration gap. Global dev and local lists may differ. Hybris loader existence is not evidence it runs in Japan prod. Mexico prod lists easyDeliveryPoint and BOPIS with no Redis step, unlike most LATAM countries.

### 16.3 Japan Kafka configuration {#163-japan-kafka-configuration}

<a id="shared-23187ce2e918"></a>

The shared `configmap_jpn.yml` declares tenant `070`, enables the five main/retry inputs, maps warehouse `65→J07`, `08→JA1`, `55→J02`, and supplies tenant-aware error topic patterns. Environment files select AS400 input topics:

<a id="shared-72e7ee79f0e7"></a>

| Japan environment | AS400 topic |
|---|---|
| QA | `imsjapan_ts_global_inventorycdm_pub_v1` |
| UAT | `imsjapan_qa_global_inventorycdm_pub_v1` |
| Prod | `imsjapan_pd_global_inventorycdm_pub_v1` |

<a id="shared-fa45df9ef8a4"></a>

Legacy Avro daily/intraday/aggregated inputs are disabled in base `application.yml`; no enabling override was found in the checked eventservice ConfigMaps. The AS400 topic names do not establish a feed frequency. `fetch.max.wait.ms` is a broker fetch setting, not an AS400 schedule or maximum end-to-end latency. `@Blocking` and `batch=false` describe handler processing; throughput also depends on partitions, consumers, replicas, queueing and downstream latency.

## 17. Failure, replay and consistency boundaries {#17-failure-replay-and-consistency-boundaries}

<a id="shared-26e6ff864563"></a>

| Boundary | Source-backed behavior and practical consequence |
|---|---|
| Allocation → reserve | No persisted hold from allocation. Reserve reads under lock and can reject stock that was available a moment earlier. |
| Within a ledger batch | Transactional writes, deterministic lock order, original response order restored. The selected insertion strategy comes from the first request; do not invent mixed-type batch semantics. |
| Across checkout/payment/stock | Separate service calls and compensation, not one transaction. Japan validates reservations first; default normal flow uses parallel subscription. |
| Checkout create-reservation call | Client timeout/errors are logged and converted to `Optional.empty()`. Japan reservation validation can turn absence/mismatch into a modification; an empty value does not mean success. |
| Invalid Japan reservation | `handleInvalidReservation` attempts deletes for returned reservation ids. Deletion failures can be swallowed at the client. Unknown results after a timeout require reconciliation; the client may not have the successful server response. |
| Handled payment failure | `PaymentServiceImpl.handleFailure` deletes supplied reservations and handles loyalty/adjustment cleanup; the code has explicit loyalty-only skip behavior and empty-map handling. Do not claim universal cleanup on every error/exception. |
| Reserve/release deduplication | Strategies query by reference id and transaction type/latest state. These are implementation-specific checks; locks serialize writes but do not by themselves prove exactly-once behavior for simultaneous duplicate requests. |
| On-hand adjustment | Checks transaction id, including per-line logic. This is different from order-level reference checks. |
| AS400 duplicate/reorder | EOD/REL insertion strategies inherit the default empty duplicate check. Setting event id fields is not a deduplication guard. Replayed REL can add its delta again; a delayed EOD can overwrite newer on-hand state. No source timestamp rejection was established. |
| AS400 validation/defaults | Event validator checks ISO country; missing-event-id rejection is commented out. Unknown event codes are logged by the populator but fall through to INTRA_DAY_EVENT mapping. Missing AVAILABLE quantity defaults to 0 (EOD can therefore set OH to 0); invalid numeric text throws. The populator stamps processing time rather than source-event time, so dataservice's future-time check does not establish source freshness/order. These are validation gaps, not automatic corrections. |
| CDC availability events | Compares disposition, ETA/discontinuation dates and stock status. It does **not** compare ATS numeric fields or low-stock threshold in the predicate. A SHP→SHP quantity-only change may not publish even though emitted payloads contain quantities. |
| Availability producer send | `InventoryAvailabilityEventProducer` waits for send completion up to its timeout but catches/logs exceptions. A send failure can therefore be hidden from the caller; an input ack is not proof of successful availability publication. |
| CDC historical reads | `StockLevelDataClient` calls `/stock-levels/detail` with version and page 0/size 1; the controller reaches the count-aware historical-version query. A separate unused-by-this-client overload filters latest rows in memory. The eventservice history wrapper catches request errors and returns null: a missing previous version triggers publication, but a missing current version can fail processing. |
| Redis geo refresh | Loader/search key mismatch, swallowed load errors, and no stale-member removal remain. A COMPLETED command can coexist with unsuccessful per-type GEOADD. |
| Retention | `purgeOldStockLevels` has no located trigger. The 720-hour/10-version defaults describe a dormant method, not a daily purge or actual DB retention guarantee. |
| Availability propagation | CDC connector deployment, delivery guarantees and Product/Search application are outside the inspected implementation. There is no verified end-to-end exactly-once guarantee. |

<a id="shared-d4f02f2bd836"></a>

Operationally correlate country, item, warehouse, transaction id, reference id, version and event id. Compare latest ledger counters with the specific view/request first; then inspect reservation API outcomes, sales-order lifecycle events, Kafka lag/error topics and CDC versions. For missing locations compare the literal Redis write/read keys and hydrate the ids from DynamoDB. For a fee discrepancy compare fulfillment rules with checkout exemptions, promotions and fallback configuration. These are diagnostic steps, not checks executed against production.

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
