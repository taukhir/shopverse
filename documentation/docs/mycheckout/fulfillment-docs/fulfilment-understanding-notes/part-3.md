---
slug: /mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-3
title: "mycheckout — Fulfilment Engineering Reference — Part 3"
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

# mycheckout — Fulfilment Engineering Reference — Part 3

**Historical source notes.** Fix claims and observations retain their original dates; they have not been reverified against current runtime behavior.

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `fulfillment docs/Fulfilment-Understanding-Notes.md` |
| Source SHA256 | `a5038e900518beb380d5a45f9410df582bb44b27328c0ea640d9ff9421adaa6a` |
| Guide part | 3 of 4 |

[Part 1](/mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-1) · [Part 2](/mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-2) · [Part 3](/mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-3) · [Part 4](/mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-4)

## 9 Inventory ownership and feeds {#9-inventory-ownership-and-feeds}

<a id="shared-011efcf3b1ba"></a>

AS400 IMS owns physical on-hand stock and disposition. NGC maintains shipping reservations and backorder reservations, and computes sellability. The latest business flow is AS400 IMS through WebMethods APIs into NGC; the architecture expands the downstream integration to WebMethods, an inventory Kafka topic, the feed processor, the ATS service and PostgreSQL. Source cadence is controlled by AS400. [S1, S4]

<a id="shared-6be362f7c599"></a>

The architecture names `commerce_{env}_{affiliate_code}_inventorycdm_pub_v1` for IMS updates and `commerce_{env}_{affiliate_code}_salesorder_pub_v1` for order events. It describes a single inventory update per message, using `adaCode` and `warehouseCode`, and a new stock version for each accepted update. The mapping of producer `adaCode` to the stock key must follow the event contract. [S1]

<a id="shared-a55b4916144f"></a>

| Feed | Latest business specification | Attached architecture |
|---|---|---|
| Daily snapshot | Start-of-day on-hand for all SKUs; retain outstanding reserves | EOD can create missing stock and replace on-hand and status |
| Intraday | Override on-hand; retain reserves | REL applies a delta to existing stock, does not create missing stock and ignores incoming stock status |
| Disposition | Reflect damage, blocked stock or operational changes | DSP updates stock status only |

<a id="shared-440a34637040"></a>

**A feed is not a reservation reset.** Day 2 can begin with outstanding reservations from Day 1. An absolute snapshot should preserve these NGC-owned counters. The label start-of-day versus EOD is also an integration naming decision; do not assume the schedule from the transaction type alone. [S4]

<a id="shared-5e2c595a715e"></a>

**Ordering and replay:** the latest specification asks to ignore stale feeds using a producer sequence or timestamp. The architecture instead accepts feed causal drift and convergence at the next snapshot. Choose a single contract for event ordering, duplicate identity and replay; applying a delta twice or treating an absolute value as a delta directly corrupts the balance. [S1, S4]

<a id="shared-57dc6fd382ce"></a>

**Disposition publication:** the architecture sends stock-table changes to a raw event topic. FulfillmentEventService calculates whether disposition changed and publishes changes for Product, PDP and Search consumers. This is a design flow; exact topic names, CDC configuration and delivery guarantees require the integration configuration. [S1]

<a id="shared-af7341998e37"></a>

**Protobuf ingestion:** the supplied architecture selects Kafka `ByteArrayDeserializer` followed by application parsing. Preserve that as the project's recorded approach. Its claims about Quarkus extension availability, native compatibility, schema handling and performance are version-specific assumptions, not revalidated product facts. Verify actual producer framing and schema/version handling; raw protobuf and schema-registry-framed payloads must not be treated as interchangeable. [S1]

## 10 ATS lifecycle and channel rules {#10-ats-lifecycle-and-channel-rules}

### 10 1 Raw ATS and sellable ATS {#10-1-raw-ats-and-sellable-ats}

<a id="shared-0ed203d6f958"></a>

The latest business formulas include backorder reserves: regular/home raw ATS is on-hand minus shipping reserves, backorder reserves and SOP protection; Auto SOP raw ATS omits only SOP protection. Negative raw ATS is retained as an operational signal, while ordinary sellability treats it as zero. Backorder capacity and Force In-Stock follow their own rules. Recalculate whenever any formula input or applicable disposition changes, including backorder reserve and SOP protection. [S4]

<a id="shared-37939e12f9c7"></a>

The architecture's older formulas omit backorder reserve from on-hand ATS. The current business text and previously reviewed view calculations include it. Use the latter as the working business baseline, with the architecture formula correction recorded in section 13. [S1, S3, S4]

The following example assumes backorder reserve and SOP protection are zero. "Cancel 10" is interpreted as 10 units, matching the quantity change in the source.

<a id="shared-f18b55fe871d"></a>

| Step and event | On hand | Reserved | Raw ATS | Sellable ATS |
|---|---:|---:|---:|---:|
| 1 Day 1 initial snapshot | 100 | 0 | 100 | 100 |
| 2 Place orders for 40 | 100 | 40 | 60 | 60 |
| 3 Drop 20 downstream | 80 | 20 | 60 | 60 |
| 4 Intraday snapshot 70 | 70 | 20 | 50 | 50 |
| 5 Intraday snapshot 10 | 10 | 20 | -10 | 0 |
| 6 Cancel 10 reserved units | 10 | 10 | 0 | 0 |
| 7 Day 2 snapshot 100 | 100 | 10 | 90 | 90 |
| 8 Drop remaining 10 | 90 | 0 | 90 | 90 |

<a id="shared-f29d6719e0a5"></a>

Dropping the same quantity from on-hand and reserved leaves their difference unchanged. Cancellation releases the reservation without a physical deduction. Avoid processing both drop and shipment as separate deductions for the same quantity. [S4]

### 10 2 Backorder conversion {#10-2-backorder-conversion}

<a id="shared-1ee20af276f5"></a>

Hybris OMS triggers backorder release. For a quantity Q moving into normal reservation, the intended counter movement is `backorderReserve -= Q` and `reservedQuantity += Q`; this is a conversion, not cancellation. Because both counters are deducted in the current on-hand formula, this transfer alone leaves raw on-hand ATS unchanged, assuming the other inputs do not change. [S4]

<a id="shared-58568cd97848"></a>

The architecture routes backorder release through stock-level batch RESERVE and mentions depleting backorder quantities. Exact request fields and changes to `backorderQuantity` versus its reservation counter must be confirmed in the strategy. Do not equate the business phrase "backorder release" with generic RELEASE. The conversion should be atomic and replay-safe as a requirement. [S1]

### 10 3 Channel and item exceptions {#10-3-channel-and-item-exceptions}

<a id="shared-7c7d30873804"></a>

| Flow | Availability validation | Reservation | Downstream expectation |
|---|---|---|---|
| Normal web order | ATS and disposition | Shipping or BO counters | Regular reservation lifecycle |
| Auto SOP | ATS excluding SOP protection | Required for eligible stock | Reviewed reservation view currently needs alignment |
| POS | Bypass ATS and disposition | None | No reservation ID; allocated quantity 0; unallocated quantity equals ordered quantity |
| OSD no-charge order | Business asks to treat like POS | None under stated rule | Same no-reservation representation |
| Force In-Stock | Bypass stock constraint | None | Same no-reservation representation |
| Service item | Force In-Stock unless configured otherwise | None by default | Do not fail solely because no IMS feed exists |

<a id="shared-7d14b25ac060"></a>

These are business requirements, not blanket confirmation of each implementation path. The architecture additionally reports that reserve and release strategies skip ledger writes for current `FORCE_IN_STOCK` and omit those response entries. Callers must distinguish a legitimate skipped line from a failed reservation. If a previously reserved item changes to FORCE_IN_STOCK before release, verify how the outstanding reservation is cleared; skipping by current status alone may strand it. [S1, S4]

<a id="shared-9a14c1ac642a"></a>

**POS stock ownership remains contradictory in the supplied text.** One passage says directly deduct on-hand; the later exception says no on-hand deduction or reservation release from NGC and inventory updates only through IMS. Working interpretation: POS/OSD bypasses validation and reservation, while physical stock updates arrive from IMS. The local deduction question remains open before implementation. Negative ATS may still appear when a feed lowers shared physical stock below outstanding reservations. [S4]

<a id="shared-2804d03ce316"></a>

**Japan:** no BOPIS channel is described. Each Plaza POS location has a separate warehouse; separate shelf/promotion buckets are not required for the stated JP model. Reconciliation is described for warehouse/web orders. These JP rules should not be generalised to other markets. [S4]

<a id="shared-98d936351f9c"></a>

**Free gifts:** the supplied note says any POS cart item is considered in stock and the order is placed, while retaining questions about gifts not physically picked and promotion ATS validation. Record the bypass direction, but obtain a specific business decision on automated gifts rather than silently inventing a validation exception. [S4]

### 10 4 Other exceptions {#10-4-other-exceptions}

<a id="shared-9afae6080fb2"></a>

- Delayed feed: continue with last cached state and expose freshness operationally.
- Positive physical quantity with TNA/NLA/NYA/NAW: disposition blocks normal sale.
- Partial drop: reduce on-hand and reservation only by the dropped quantity.
- Missing stock: business default is non-sellable, except configured service items. A SKU absent from one incremental message is not necessarily missing from inventory; define full-snapshot completeness and absence semantics.
- Backorder: absence of on-hand ATS validation does not mean unlimited backorders; the oversell/backorder capacity still matters.
- Force out-of-stock: a business concept that must be mapped to supported status values; the reviewed ten-case switch has no separately verified `FORCE_OUT_OF_STOCK` enum. [S4, S6]

## 11 Persistence and reservation lifecycle design {#11-persistence-and-reservation-lifecycle-design}

### 11 1 Schema and versioning {#11-1-schema-and-versioning}

<a id="shared-7ee83648dbb4"></a>

The architecture defines `stock_level` as an append-only versioned table. The composite primary key contains item, warehouse, version and country. Country is not a substitute for tenant isolation. Its sample indexes and audit query refer to `inventory`; those names conflict with its `stock_level` DDL and must be corrected before use. [S1]

<a id="shared-65cf9d6235f9"></a>

| Field group | Fields in the supplied DDL |
|---|---|
| Identity | `item_code`, `warehouse_code`, `version`, `country` |
| Quantities | `on_hand_quantity`, `reserved_quantity`, `be_backorder_quantity`, `backorder_reserve`, `backorder_quantity` |
| Dates and thresholds | `backorder_eta`, `next_availablity_eta`, `discontinuation_date`, `sop_protection`, `low_stock_threshold` |
| Transaction metadata | `transaction_quantity`, `transaction_datetime`, `transaction_type`, `transaction_id`, `source`, `reference_id` |
| Result metadata | `stock_level_status`, `created_at`, `transaction_data` JSONB |

<a id="shared-e11a74d08612"></a>

Preserve the actual spelling `next_availablity_eta` / `nextAvailablityEta` in integrations. The audit display uses `nextAvailabilityEta`. Do not rename storage or contract fields merely to correct the spelling. [S1, S5]

### 11 2 Reservation state and atomicity {#11-2-reservation-state-and-atomicity}

<a id="shared-365280b665c9"></a>

The architecture treats reservation ID as intent reusable across completed reserve/release cycles: latest RESERVE means duplicate reserve succeeds without another write; latest RELEASE allows a fresh reserve attempt; duplicate release succeeds; release without a previous reservation fails. The earlier code review identifies `referenceId` as the reserve/release duplicate key and `transactionId` for MANUAL. Exact order ID, reservation ID, line reference and transaction ID mappings need to be pinned together. [S1, S2]

<a id="shared-4f5254d8bd6b"></a>

The design requires all-or-none order reservation, deterministic processing and rollback on failure. Its prose alternates between one transaction and per-line retry plus compensation. These are different guarantees: database rollback can hide all failed-order writes, whereas committed per-line writes followed by compensation can be visible temporarily. Trace actual transaction boundaries and test multi-line failure before declaring full atomicity. A partial quantity returned by an allocation evaluator is also not proof that partial order fulfilment is permitted. [S1]

<a id="shared-30e7f594a0a6"></a>

Bundle pre-processing is described as moving non-required lines' on-hand transaction quantities into `beBackorderTransactionQuantity` when a required bundle line is fulfilled on backorder, with symmetric release. Preserve this as architecture-described behaviour pending source validation. Do not collapse `beBackorderQuantity` into ordinary backorder capacity. [S1]

### 11 3 Concurrency requirements {#11-3-concurrency-requirements}

<a id="shared-445d7ee99546"></a>

1. Acquire a transaction-scoped lock for the stock key before reading the latest state.
2. Use one consistent lock key and tenant scope across every writer.
3. Read current stock after acquiring the lock, under the required isolation semantics.
4. Apply lifecycle and availability validation, build the next version and insert it.
5. Hold the lock through commit/rollback. For multiple keys, acquire all keys in one deterministic global order.

<a id="shared-8c987c75ee46"></a>

The architecture suggests sorting by warehouse, item and line ID, and gives a two-argument lock using `hashtext(itemCode || '_' || warehouseCode)` plus `hashtext(country)`. The prior review gives a single combined-key expression. These are alternative descriptions, not proven equivalent keys. Align the actual repository implementation and every feed/manual/reserve path. Hash collisions can cause extra contention; a country hash alone does not identify tenants. [S1, S2]

<a id="shared-2bd7c44bbfb9"></a>

The phrase "no multi-SKU locking" in the architecture conflicts with its explanation that an order holds one lock for each touched SKU. The intended distinction appears to be per-key locks rather than a table/range lock, while still allowing multiple per-key locks in one order. Treat this interpretation as a clarification to confirm. [S1]

<a id="shared-0047876ddb8a"></a>

The architecture proposes a 500 ms lock timeout, pool size 60, approximately 10 ms transactions and approximately 5 TPS per hot SKU. These are sizing assumptions, not current measurements or configuration. Its illustrative per-key ceiling is about 1000 / transaction milliseconds; waiting transactions also consume connections. Locking alone does not prove no overselling: all writers, input validity, validation, isolation, idempotency and deliberate POS/Force In-Stock exceptions must also align. [S1]

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
