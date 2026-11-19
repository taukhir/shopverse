---
slug: /mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-2
title: "mycheckout — Fulfilment Engineering Reference — Part 2"
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

# mycheckout — Fulfilment Engineering Reference — Part 2

**Historical source notes.** Fix claims and observations retain their original dates; they have not been reverified against current runtime behavior.

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `fulfillment docs/Fulfilment-Understanding-Notes.md` |
| Source SHA256 | `a5038e900518beb380d5a45f9410df582bb44b27328c0ea640d9ff9421adaa6a` |
| Guide part | 2 of 4 |

[Part 1](/mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-1) · [Part 2](/mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-2) · [Part 3](/mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-3) · [Part 4](/mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-4)

## 5 Stock listing and stock detail APIs {#5-stock-listing-and-stock-detail-apis}

Paths below are relative to the deployed service root.

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-1#shared-f566c1ecdacf).

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-1#shared-9b22dc27cd1f).

Examples:

```http
GET /v1/stock-levels?itemCode=100016J&warehouseCode=J01&page=0&size=20
GET /v1/stock-levels?stockLevelStatus=SHIP_ELSE_BACKORDER&page=0&size=20
GET /v1/stock-levels/detail?itemCode=100016J&warehouseCode=J01&page=0&size=20
GET /v1/stock-levels/detail?itemCode=100016J&warehouseCode=J01&version=52&page=0&size=20
GET /v1/stock-levels/detail?hasBackorderReservations=true&page=0&size=20
GET /v1/stock-levels/audit?itemCode=100016J&warehouseCode=J01&page=0&size=20
```

Use the environment's service root and tenant/country headers, for example JP tenant `jpn:070` and country `JP`. Pages are zero-based (`offset = page * size`).

Logical SQL for a current-stock listing filtered by status:

```sql
WITH latest AS (
    SELECT DISTINCT ON (s.country, s.item_code, s.warehouse_code) s.*
    FROM stock_level s
    WHERE s.country = :country
    ORDER BY s.country, s.item_code, s.warehouse_code, s.version DESC
)
SELECT l.*, COUNT(*) OVER () AS total_count
FROM latest l
WHERE l.stock_level_status = :stock_level_status
ORDER BY l.item_code, l.warehouse_code
LIMIT :page_size OFFSET :offset;
```

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-1#shared-b82c63968f22).

Explicit version lookup:

```sql
SELECT s.*
FROM stock_level s
WHERE s.country = :country
  AND s.item_code = :item_code
  AND s.warehouse_code = :warehouse_code
  AND s.version = :version;
```

<a id="shared-2dd19748f138"></a>

These diagnostic statements express the intended selection semantics; exact repository SQL remains a separate implementation check. One separate implementation concern is visible: internal `getStockLevel(..., version, ...)` uses `findByFilters()`, which fetches latest rows and then filters by version in memory. That cannot retrieve an older version. The detail endpoint uses the different `findByFiltersAndVersionWithCount()` route; do not conflate them.

## 6 Transaction types and event mapping {#6-transaction-types-and-event-mapping}

<a id="shared-db78555753d7"></a>

| Type or feed code | Meaning | Evidence and qualification |
|---|---|---|
| `MANUAL` | Assign absolute stock/configuration values | Reviewed MANUAL strategy; duplicate key `transactionId` |
| `RESERVE` | Add shipping or backorder reservations | Reviewed reserve strategy; duplicate key `referenceId` |
| `RELEASE` | Release reservations | Reviewed release strategy; duplicate key `referenceId` |
| `ON_HAND_ADJUSTMENT` | Stock adjustment type identified in tests | Review confirms existence; exact arithmetic not established |
| `DAY_END_EVENT` | Snapshot feed stock update | Architecture mapping; verify generated enum and handler |
| `INTRA_DAY_EVENT` | Intraday inventory event | Architecture mapping; absolute versus delta conflict in section 13 |
| `FULFILLMENT_READY_EVENT` | Drop/completion reduces on-hand and reservation | Architecture mapping; choose one authoritative trigger |
| `CANCELLED` | Candidate cancellation mapping | Explicitly unresolved against `RELEASE` in architecture |
| `EOD`, `REL`, `DSP` | Inbound feed discriminators | Feed codes, not automatically transaction enum values |

<a id="shared-55df36e256e1"></a>

The complete executable enum remains authoritative. The architecture does not establish a transaction enum mapping for DSP. Business text also uses DIS, while the detailed feed rules use DSP; settle the producer contract before coding either spelling. [S1]

To see types actually present in retained data:

```sql
SELECT transaction_type, COUNT(*) AS row_count
FROM stock_level
WHERE country = :country
GROUP BY transaction_type
ORDER BY transaction_type;
```

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-2#shared-1f348098e057).

## 7 Disposition statuses and decision order {#7-disposition-statuses-and-decision-order}

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-2#shared-d80e49f01fde).

Let O = on-hand, R = reserved, BR = backorder reserve, B = backorder quantity, P = SOP protection. The earlier confirmed formulas are:

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-2#shared-0c7a3e9e3c81).

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-2#shared-897b4cfc4830).

Example: O=100, R=10, BR=5, P=10, B=50 gives regular/home on-hand ATS=75, SOP on-hand ATS=85, and permitted backorder ATS=45.

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-2#shared-4c4f7f494958).

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-2#shared-9e3c62c7a5be).

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-2#shared-1f066f730527).

For a positive requested quantity Q, the reviewed `SHIP_ELSE_BACKORDER` evaluator chooses:

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-2#shared-51090f154473).

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-2#shared-228f617de927).

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-2#shared-33f9cb355514).

## 8 Other important information {#8-other-important-information}

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-2#shared-0e0c13d591f8).

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-2#shared-dbbe388a8dc7).

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-2#shared-b5435b6ab03d).

<a id="shared-517399fa15be"></a>

**Retention limits historical lookup.** The architecture proposes seven days of full history with older versions archived offline. The reviewed `purgeOldStockLevels()` actually reads configurable minimum retained versions and a retention-hours cutoff. Seven days and functioning archival are therefore design targets, not confirmed runtime settings. A purged table cannot answer older as-of queries without the archive. [S1, S5]

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-2#shared-4f5982adc95e).

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-2#shared-e67f53bd5af6).

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
