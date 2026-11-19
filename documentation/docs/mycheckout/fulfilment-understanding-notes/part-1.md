---
slug: /mycheckout/fulfilment-understanding-notes/part-1
title: "mycheckout — Fulfilment — Part 1"
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

# mycheckout — Fulfilment — Part 1

**Historical source notes.** Fix claims and observations retain their original dates; they have not been reverified against current runtime behavior.

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `Fulfilment-Understanding-Notes.md` |
| Source SHA256 | `3d47a30bb67c11a68bfacd48438e7c011e39e167a8fffdfb159eac5d0f7cf4c6` |
| Guide part | 1 of 2 |

[Part 1](/mycheckout/fulfilment-understanding-notes/part-1) · [Part 2](/mycheckout/fulfilment-understanding-notes/part-2)

## Fulfilment {#fulfilment}

<a id="shared-be7e547854b0"></a>

**Core model:** each stock version represents the resulting stock state for an item + warehouse + country within the selected tenant. `transactionData` describes the transaction that produced that version. Availability is calculated from the state and the selected view. Allocation planning and persisted reservation are separate operations.

## 1. Audit flow and attribute-change checks {#1-audit-flow-and-attribute-change-checks}

The write path records audit information; the audit GET endpoint formats it later. It does not compare two stock versions at read time.

<a id="shared-e81980c92125"></a>

| Responsibility | Class / method | What it checks or does |
|---|---|---|
| Route stock writes | `StockLevelController` → `StockLevelServiceImpl.createStockLevel()` / `createStockLevelBatch()` | Resolves the transaction strategy and invokes the write flow |
| Check MANUAL duplicates | `ManualTransactionStockLevelInsertionStrategy.checkForDuplicate()` | Uses `transactionId` and `findLatestByTransactionId()`; a matching MANUAL transaction returns the existing response |
| Check update intent | `ManualTransactionStockLevelInsertionStrategy.validateChangeIntent()` | Checks that at least one supported update field was supplied |
| Check actual change | `ManualTransactionStockLevelInsertionStrategy.validateActualChanges()` | Compares supplied fields with `latestEntity`; no latest entity allows first creation; no actual changes on an existing entity throws `BadRequestException` |
| Build state and audit data | `ManualTransactionStockLevelInsertionStrategy.applyQuantityLogic()` | Applies supplied values, carries forward absent fields, creates fresh `StockLevelTransactionData` |
| Fetch audit history | `StockLevelServiceImpl.getStockLevelAudit()` → `StockLevelDataRepository.findLatestManualTransactions()` | Fetches recent MANUAL rows for the selected stock key/country |
| Format audit response | `StockLevelServiceImpl.mapToAuditItem()` | Reads `entity.getTransactionData()` and builds attribute strings |

<a id="shared-5477df3d567a"></a>

**The checks operate at two different levels.** `validateActualChanges()` asks whether anything changed in the request. It does not create a per-field diff. In the shared `applyQuantityLogic()`, the three date fields additionally compare old and new values before writing audit metadata. Numeric fields and `stockLevelStatus` are written to transaction data whenever supplied. Therefore an unchanged numeric value may appear in audit when another supplied field genuinely changed.

**How explicit null is distinguished from an omitted date:** the date request fields use `JsonNullable`.

<a id="shared-e2f3004e584e"></a>

| Request state | Previous value | Resulting entity value | Audit metadata |
|---|---|---|---|
| Field omitted / undefined | Any | Keep previous value | Nothing for this field |
| Field supplied with a different date | Null or another date | New date | Store new date |
| Field supplied with the same date | Same date | Same date | No date change entry |
| Field supplied as JSON `null` | Existing date | Null | Set corresponding `*Cleared = true` |
| Field supplied as JSON `null` | Already null | Null | No clear flag; nothing was removed |

<a id="shared-d8a4595ac8b8"></a>

Presence is tested with `field != null && field.isPresent()`. A present wrapper can contain null; `field.get()` reveals whether the requested operation is setting a date or explicitly clearing it. `JsonNullable` identifies intent; the old/new comparison establishes whether that intent changes state.

<a id="shared-909d6abb037e"></a>

The flags are `backorderEtaCleared`, `nextAvailablityEtaCleared`, and `discontinuationDateCleared`. They live in the existing `transactionData` JSONB alongside changed date values. `mapToAuditItem()` outputs a populated date when present; otherwise, when `Boolean.TRUE.equals(flag)`, it outputs `field: null`. A fresh transaction-data object prevents a previous version's cleared flag from leaking into later transactions.

<a id="shared-b1fbba69c039"></a>

Example: v10 has a backorder ETA. A MANUAL request explicitly clears it, producing v11 with a null entity date and `backorderEtaCleared=true`. A later request changes on-hand quantity and omits the ETA: v12 keeps the date null but does not repeat the clear event.

<a id="shared-1abc3650d015"></a>

The original defect was that `nextAvailablityEta` and `discontinuationDate` reached the entity but were missing from transaction-data population/audit mapping. Persisting the state alone was insufficient to make those changes visible in audit.

**Limits in the shared implementation:**

<a id="shared-570c75dee9e5"></a>

- Audit selects MANUAL only; RESERVE and RELEASE are excluded.
- Attributes contain single values, not automatic `old → new` pairs or quantity deltas.
- The audit DTO exposes `referenceId`, not `transactionId` or `transactionType`.
- The shared MANUAL strategy records `reservedQuantity`, but the shared `mapToAuditItem()` does not render it.
- `page` changes pagination metadata, but the repository call receives `size` without an offset. It therefore fetches the latest N again.
- The pasted code compares `OffsetDateTime` with `Objects.equals()` before converting to `Instant` for JSONB storage. Comparing by `Instant` was discussed earlier, but is not shown in that source snapshot; equivalent instants with different offsets deserve attention.

## 2. Create stock — how data is persisted {#2-create-stock--how-data-is-persisted}

<a id="shared-e486a773d2b8"></a>

1. A request enters `POST /v1/stock-levels` or `POST /v1/stock-levels/batch`. The single-write service wraps its request in a one-element batch.
2. `createStockLevelBatch()` resolves the strategy from the first request's transaction type. The shared method assumes all batch entries use the same type.
3. The strategy checks for duplicates before normal processing. MANUAL uses `transactionId`; absent/blank MANUAL transaction IDs skip that duplicate check.
4. `preProcessStockLevelTransactionRequestsReactive()` converts/prepares the requests for transaction processing.
5. `executeWithRetryReactive()` calls `StockLevelTransactionHelper.processStockLevelBatchWithTransaction()`.
6. The prior helper review traced a stock-key advisory lock before reading the latest entity: `lockStockLevelKey()` uses `pg_advisory_xact_lock(hashtext(itemCode|warehouseCode|country))`.
7. For a new stock key, MANUAL permits creation without an existing entity (`requiresLatestEntity() == false`). It validates update intent, builds the first stock snapshot and fresh transaction data, and persists a new version through the helper/repository flow.
8. The transaction commits and the persisted result is mapped to the response DTO.

<a id="shared-900a31b3596e"></a>

Persistence is tenant-aware PostgreSQL through the reactive service/repository flow. The service has `@WithTransaction` and `@WithTenantAwareTransaction`. The exact physical table/schema, insert statement, initial version number and defaults for omitted first-create fields were not present in the recovered source; do not assume them.

<a id="shared-c2addf06ea0f"></a>

**Two types of data are saved together:** stock-state fields describe the resulting balances/settings; transaction fields and JSONB describe the operation. Availability/disposition are then populated by calculation on read; they must not be confused with raw stored quantities.

## 3. Update stock — how existing stock changes {#3-update-stock--how-existing-stock-changes}

<a id="shared-2ef92d61286f"></a>

An update uses the stock transaction write flow and creates a new version, preserving the previous snapshot subject to retention/purge. There is no separate stock PATCH endpoint in the controller API discussed here.

For MANUAL:

<a id="shared-80bccaecf240"></a>

1. Read the latest state under the transaction's stock-key lock.
2. Validate that an update was requested and at least one supplied value differs.
3. Set supplied numeric/status fields to their requested values. MANUAL is an absolute assignment, not an increment.
4. Carry forward fields that were omitted; apply explicit date nulls using `JsonNullable`.
5. Build fresh transaction data and persist the next version.

<a id="shared-9010690f8db9"></a>

| Example | Previous state | Request/action | Result |
|---|---|---|---|
| MANUAL on-hand | 100 | `onHandQuantity = 80` | New on-hand = 80, not 180 |
| MANUAL field omitted | SOP protection = 10 | No SOP protection supplied | Keep 10 |
| MANUAL unchanged-only request | On-hand = 100 | `onHandQuantity = 100`, no other changes | Reject as no actual changes |
| RESERVE shipping quantity | Reserved = 10 | Reserve 5 eligible units | New reserved = 15 |
| RELEASE shipping quantity | Reserved = 15 | Release 5 applicable units | New reserved = 10 |

<a id="shared-007b0994ecd2"></a>

For backordered reservations, reserve/release changes `backorderReserve` instead. MANUAL can directly assign reservation counters in the shared strategy, so its semantics differ from RESERVE/RELEASE.

<a id="shared-cd80736f2934"></a>

The service supports retries on qualifying persistence/constraint failures only when `strategy.retryOnConflict()` allows them. The shared MANUAL strategy returns false. Locking and duplicate checks are useful protections, but the source excerpts do not establish a complete proof of concurrent duplicate-request safety.

## 4. Queries — latest stock, history, and stock at a point in time {#4-queries--latest-stock-history-and-stock-at-a-point-in-time}

<a id="shared-2c8e7abe3a61"></a>

**These are read-only PostgreSQL templates, not copied repository SQL.** Replace `YOUR_SCHEMA.YOUR_STOCK_TABLE` with the verified relation. Confirm the columns first, especially the country discriminator. Use the correct tenant schema/database as well as country. Named parameters use SQL-client bind syntax.

Find candidate tables and inspect their columns:

```sql
SELECT table_schema, table_name
FROM information_schema.columns
GROUP BY table_schema, table_name
HAVING COUNT(*) FILTER (WHERE column_name = 'item_code') > 0
   AND COUNT(*) FILTER (WHERE column_name = 'warehouse_code') > 0
   AND COUNT(*) FILTER (WHERE column_name = 'version') > 0
ORDER BY table_schema, table_name;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = :schema_name
  AND table_name = :table_name
ORDER BY ordinal_position;
```

Latest persisted stock for one item/warehouse/country:

```sql
SELECT s.*
FROM YOUR_SCHEMA.YOUR_STOCK_TABLE s
WHERE s.item_code = :item_code
  AND s.warehouse_code = :warehouse_code
  AND s.country = :country
ORDER BY s.version DESC
LIMIT 1;
```

Stock as recorded at or before a timestamp:

```sql
SELECT s.*
FROM YOUR_SCHEMA.YOUR_STOCK_TABLE s
WHERE s.item_code = :item_code
  AND s.warehouse_code = :warehouse_code
  AND s.country = :country
  AND s.created_at <= CAST(:as_of AS timestamptz)
ORDER BY s.version DESC
LIMIT 1;
```

<a id="shared-32ba2bdec18c"></a>

Example parameters: `item_code = '100016J'`, `warehouse_code = 'J01'`, `country = 'JP'`, `as_of = '2026-10-12T10:00:00+05:30'`. This assumes version increases with successive stock snapshots. It uses recorded creation time, not a proven database commit-time or external event-time history. A missing result can mean no earlier stock or purged history; it does not mean zero stock.

All stock keys at that time:

```sql
SELECT DISTINCT ON (s.country, s.item_code, s.warehouse_code) s.*
FROM YOUR_SCHEMA.YOUR_STOCK_TABLE s
WHERE s.country = :country
  AND s.created_at <= CAST(:as_of AS timestamptz)
ORDER BY s.country, s.item_code, s.warehouse_code, s.version DESC;
```

Full transaction history for a stock key, including reservation/release rows:

```sql
SELECT s.*
FROM YOUR_SCHEMA.YOUR_STOCK_TABLE s
WHERE s.item_code = :item_code
  AND s.warehouse_code = :warehouse_code
  AND s.country = :country
ORDER BY s.version DESC;
```

<a id="shared-4ab585e4aad6"></a>

Do not sum the versioned snapshot balances: that double-counts successive states. Historical ATS additionally depends on the view/formulas applicable at that time. Today's calculation over an old snapshot is not automatically the exact response the historical API returned.

## 5. Stock listing versus stock detail API {#5-stock-listing-versus-stock-detail-api}

Paths below are relative to the deployed service root.

<a id="shared-f566c1ecdacf"></a>

| Aspect | `GET /v1/stock-levels` | `GET /v1/stock-levels/detail` |
|---|---|---|
| Purpose | Compact current-stock listing | Detailed stock state / version inspection |
| Service method | `getStockLevelsListing()` | `getStockLevelDetail()` → `getStockLevelWithCount()` |
| Item / warehouse filters | Supported, comma-separated values | Supported, comma-separated values |
| Status filter | `stockLevelStatus` | Not in the shared method signature |
| Version filter | Not exposed here | `version`; omitted means latest per key |
| Backorder reservation filter | Not exposed here | `hasBackorderReservations=true`: latest row must have `backorderReserve > 0` |
| Result DTO | `StockLevelsListingItemResponseDataDto` | `StockLevelResponseDataDto` |
| Content | Identifiers, version/status, timestamps and calculated availability in compact form | Full stock response including raw stock quantities and calculated availability |
| Calculation | Projection → temporary response DTO → country-applicable strategies | Entity → response DTO → country-applicable strategies |
| Repository route | `findStockLevelsWithCount()` | Latest: `findLatestWithFiltersAndCount()` or single-key lookup; explicit version: `findByFiltersAndVersionWithCount()` |

<a id="shared-9b22dc27cd1f"></a>

Both calculate availability through `calculate()`; neither calls the requested-quantity evaluator. In detail, `hasBackorderReservations=false` means do not apply this filter, not “only rows with no reservations.” When `version` is supplied, the reservation filter is ignored.

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
    FROM YOUR_SCHEMA.YOUR_STOCK_TABLE s
    WHERE s.country = :country
    ORDER BY s.country, s.item_code, s.warehouse_code, s.version DESC
)
SELECT l.*, COUNT(*) OVER () AS total_count
FROM latest l
WHERE l.stock_level_status = :stock_level_status
ORDER BY l.item_code, l.warehouse_code
LIMIT :page_size OFFSET :offset;
```

<a id="shared-b82c63968f22"></a>

For detail with `hasBackorderReservations=true`, use the same latest CTE and replace the outer predicate with `l.backorder_reserve > 0`. Apply mutable-state filters after selecting the latest version; otherwise an old matching version can incorrectly appear as current stock. A window count is unavailable when the requested page returns no rows; a separate count query is needed if the client must report totals for an out-of-range page.

Explicit version lookup:

```sql
SELECT s.*
FROM YOUR_SCHEMA.YOUR_STOCK_TABLE s
WHERE s.country = :country
  AND s.item_code = :item_code
  AND s.warehouse_code = :warehouse_code
  AND s.version = :version;
```

<a id="shared-757b03ee480f"></a>

The physical repository SQL was not recovered, so the templates express the intended selection semantics. One separate implementation concern is visible: internal `getStockLevel(..., version, ...)` uses `findByFilters()`, which fetches latest rows and then filters by version in memory. That cannot retrieve an older version. The detail endpoint uses the different `findByFiltersAndVersionWithCount()` route; do not conflate them.

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
