---
slug: /mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-4
title: "mycheckout — Fulfilment Engineering Reference — Part 4"
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

# mycheckout — Fulfilment Engineering Reference — Part 4

**Historical source notes.** Fix claims and observations retain their original dates; they have not been reverified against current runtime behavior.

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `fulfillment docs/Fulfilment-Understanding-Notes.md` |
| Source SHA256 | `a5038e900518beb380d5a45f9410df582bb44b27328c0ea640d9ff9421adaa6a` |
| Guide part | 4 of 4 |

[Part 1](/mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-1) · [Part 2](/mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-2) · [Part 3](/mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-3) · [Part 4](/mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-4)

## 12 Additional diagnostic queries {#12-additional-diagnostic-queries}

These queries use the supplied `stock_level` columns in the selected tenant schema. They are diagnostics, not writes or claims about exact repository SQL.

Inspect all lifecycle events for a reference:

```sql
SELECT item_code, warehouse_code, country, version,
       transaction_type, transaction_id, reference_id,
       created_at, on_hand_quantity, reserved_quantity,
       backorder_reserve, transaction_data
FROM stock_level
WHERE country = :country AND reference_id = :reference_id
ORDER BY created_at, item_code, warehouse_code, version;
```

Compare successive snapshots for one key:

```sql
WITH history AS (
  SELECT s.*,
         LAG(on_hand_quantity) OVER w AS old_on_hand,
         LAG(reserved_quantity) OVER w AS old_reserved,
         LAG(backorder_reserve) OVER w AS old_bo_reserve
  FROM stock_level s
  WHERE country = :country
    AND item_code = :item_code
    AND warehouse_code = :warehouse_code
  WINDOW w AS (ORDER BY version)
)
SELECT version, transaction_type, created_at,
       old_on_hand, on_hand_quantity,
       on_hand_quantity - old_on_hand AS on_hand_delta,
       old_reserved, reserved_quantity,
       reserved_quantity - old_reserved AS reserve_delta,
       old_bo_reserve, backorder_reserve
FROM history
ORDER BY version;
```

<a id="shared-7c295e510a7c"></a>

The first retained row has no available predecessor; its delta is unknown. A version gap can also indicate purged history. `transaction_datetime` is producer/business time, while `created_at` is recorded row time; the as-of query in section 4 answers the latter question.

Inspect date clearing directly:

```sql
SELECT version, created_at, transaction_type,
       backorder_eta, next_availablity_eta,
       discontinuation_date, transaction_data
FROM stock_level
WHERE country = :country
  AND item_code = :item_code
  AND warehouse_code = :warehouse_code
ORDER BY version DESC;
```

## 13 Decisions and implementation gaps {#13-decisions-and-implementation-gaps}

<a id="shared-1fcfceb00cb2"></a>

| ID | Conflict or gap | Required decision or verification |
|---|---|---|
| D01 | Intraday override versus REL delta | Define absolute/delta semantics and duplicate/stale event handling |
| D02 | POS local deduction versus IMS-only update | Confirm one owner; prevent double deduction |
| D03 | Old formulas omit backorder reserve | Align architecture with latest business and reviewed formulas |
| D04 | Reject stale feeds versus accept causal drift | Agree sequence/timestamp, replay and convergence policy |
| D05 | Daily SOD terminology versus EOD mapping; DIS versus DSP | Confirm producer discriminator and transaction mappings |
| D06 | Partial allocation versus no partial fulfilment | Pin order-level success, rollback and response contract |
| D07 | Auto SOP allocation versus REGULAR_VIEW reservation | Align booking with agreed SOP protection rule |
| D08 | Force In-Stock skips release under current status | Verify cleanup of reservations created before status change |
| D09 | Lock signatures and writer coverage differ | Verify tenant scope, consistent keys, ordering and isolation |
| D10 | Audit API shows MANUAL only | Decide whether full lifecycle belongs in API or separate ledger view |
| D11 | Null arithmetic and negative release counters | Define validation/defaults and reject or reconcile invalid release; do not silently hide errors |
| D12 | Missing/zero allocation response fields | Align JSON contract and unavailable/missing-stock responses |
| D13 | Seven-day archive versus configurable purge | Confirm deployed retention and archive recovery |
| D14 | Cancellation mapping and drop/shipment trigger | Confirm RELEASE versus CANCELLED and deduplicate lifecycle events |
| D15 | Free gifts, OSD and service-item exceptions | Confirm channel/item exceptions and EOM representation |
| D16 | Audit offset and missing ID/type/delta fields | Align pagination, DTO and documented examples |

<a id="shared-acb167eb4626"></a>

Positive physical stock with a forced unavailable disposition is already an established blocking rule. Forced-status ATS zeroing, partial-backorder fallback and evaluator purity were reported fixed in the earlier review. Keep those findings separate from the unresolved decisions above. [S2, S3]

## 14 Regression evidence and operations {#14-regression-evidence-and-operations}

### 14 1 Test chronology {#14-1-test-chronology}

<a id="shared-2a742ca36d4d"></a>

The 7 October review did not find a Python runner inside the Java repository. This is not evidence that no external runner exists: the later conversation identifies `fulfillment-api-tests` as a separate folder and reports a run with 66 PASS, 1 FAIL, 4 BLOCKED and restoration PASS, for 71 scenarios total. The same conversation later reports five failing Java tests; these are a different test set. Neither result establishes today's pass/fail status. [S2, S7]

<a id="shared-0fa6c977587d"></a>

Earlier stale assertions expected the evaluator to mutate stock; the fixed evaluator is pure. Assertions should check returned disposition/quantity and that the input remains unchanged. Forced unavailable strategies should return zero ATS. A later retrieved conversation reports the report generator improvements and 52 offline tests passing; that is reporting-tool validation, not 52 service regression scenarios. [S3, S7]

<a id="shared-8482a917ef57"></a>

The requested reporting model is a summary page with total/pass/fail/blocked/not-run metrics, separate flow/test/request pages, paginated assertions, short payload previews and full JSON links. The retrieved history reports delivery of `rebuild_report.py` for regenerating reports. Keep stock restoration as a separately visible outcome. [S7]

### 14 2 Regression checklist {#14-2-regression-checklist}

<a id="shared-28173bfdd5dc"></a>

- Audit: omitted date, changed date, same date, explicit clear and null-to-null; verify metadata does not leak across versions; numeric supplied-but-unchanged behaviour; page offsets and rendered fields.
- Stock: first create, partial update, same-value rejection, duplicate MANUAL transaction, version history, tenant/country isolation and restore.
- Availability: all ten rules across regular/home/SOP; positive stock with forced unavailable; BO allowed only for the two BO rules; requested quantity below/equal/above both pools.
- Allocation: normal plus bundle entries sharing one stock key; no persisted mutation; missing stock and explicit zero fields.
- Reservation: POST create, DELETE by reservation ID, repeated reference, new reference/same values, reserve-release-reserve reuse and Force In-Stock skip semantics.
- Invariants: over-release, null quantities, multi-key failure, deterministic locks, concurrent duplicates and duplicate drop events.
- Feeds: first snapshot, daily snapshot preserving reserves, confirmed REL semantics, DSP-only change, out-of-order and replay events.
- Channel rules: POS/OSD/service/Force In-Stock no reservation, EOM quantities, SOP protection, partial drops and backorder conversion.

<a id="shared-c5c62c597b0d"></a>

For sequential BO reservation of 90 then 990 against capacity 999, only 909 remains for the second operation, assuming no other changes. If the calls are independent allocation requests that do not persist reservations, each starts from unchanged persisted stock. Do not reuse the incorrect earlier review example that returns 999 for a request of 990. FORCE_BACKORDER also never falls back to shipping in the reviewed evaluator. [S3, S6]

### 14 3 Observability {#14-3-observability}

<a id="shared-10bb726d2151"></a>

The Genie dashboard work covered per-HTTP-code RPS using `istio_requests_total`, batch size from the log text `Starting batch creation for`, error/timeout logs, Kafka lag and container memory. For batch size, use time on X and requests per batch on Y; show average and maximum per interval. Batch size is not request throughput. [S7]

<a id="shared-0e4f31c850b6"></a>

Suggested operational additions are feed freshness/lag, stale and duplicate feed counts, raw negative ATS, negative reservation counters, lock wait and timeout, version conflicts, reservation failures by reason, and failed stock restoration. These are proposed metrics; availability of concrete Dynatrace metric keys is not assumed.

## 15 Genie context and source record {#15-genie-context-and-source-record}

### 15 1 Related project facts {#15-1-related-project-facts}

<a id="shared-0440a5eb7465"></a>

The directly relevant conversations include Stock Audit (14 September), Bundle TNA investigation (18 September), Ship Else Backorder issue (25 September onward), Dynatrace dashboards (30 September), Allocation bug fix files and Reservation code review (5 to 8 October), and the current fulfilment consolidation (12 October). [S7]

<a id="shared-52b0c88fce54"></a>

The wider Genie context also records checkout out-of-stock messaging: `createModificationForValidateInventoryOutOfStock()` selects a partial title when any entry has available quantity greater than zero. All-zero entries select the full out-of-stock title. This is downstream messaging, not ATS calculation. The localisation work involved Java `.properties` Unicode escapes and updated strategy tests. [S7]

<a id="shared-7e256e821f4e"></a>

The origin-IP trace separates normal DynamoDB Streams/Kafka Connect publication from manual Java publication for large/binary orders. The corrected entity attribute is `clientIPAddressAtPlacement`, matching Avro. This is an EOM mapping concern, separate from stock updates. The JP guest name work distinguishes recipient `careOfName` and the guest account fallback. These adjacent facts are retained for continuity without changing fulfilment rules. [S7]

<a id="shared-957a07d460cd"></a>

Environment context: tenant values include `global:000`, `latam:170`, `tha:200`, `jpn:070`; requests use tenant/country/channel headers. The known checkout app path `/comcheckoutas` must not be assumed to be the fulfilment service root. Earlier local troubleshooting established that startup logs determine the actual port, and HTTP 405 requires checking the HTTP method against the registered path. Local Quarkus debugging used terminal `quarkusDev` plus IntelliJ remote attach. [S7]

### 15 2 Evidence catalogue {#15-2-evidence-catalogue}

<a id="shared-147305b10efa"></a>

| Source | Material | Role |
|---|---|---|
| S1 | `Pasted text(9).txt`, supplied 12 October | ATS architecture, DDL, feeds, lifecycle and stated design guarantees |
| S2 | `Pasted markdown (2)(7).md`, supplied 12 October | Expanded prior implementation review and API-test plan |
| S3 | `Pasted markdown (3)(4).md`, supplied 12 October | Prior implementation review, disposition logic and test gaps |
| S4 | Inventory business specification pasted 12 October | Latest business requirements, eight-step ATS example and channel exceptions |
| S5 | Earlier MANUAL strategy and StockLevelServiceImpl source | Audit, create/update routing, listing/detail and purge implementation |
| S6 | Earlier AvailabilityCalculationStrategy source | Display and requested-quantity decision logic; later review supersedes its incomplete entity fallback |
| S7 | Available Genie conversation context and retrieved history | Dated project decisions, fixes, test reports and adjacent integration context |

<a id="shared-fa0b2073b079"></a>

The source archive contains the three original attachments, a transcription of S4 preserving conflicting statements, earlier retrieved code snapshots, the previous notes, retrieved history excerpts and this updated reference. The archive index records source identities and retrieval coverage. Use source dates and evidence types when resolving disagreements; a newer upload of an old review does not make its findings a new execution result.

### 15 3 Maintenance {#15-3-maintenance}

<a id="shared-c6cef856327a"></a>

Continue updates in this master reference and record the date, changed rule, supporting source and affected tests. Resolve D01 to D16 by replacing an open decision with its approved rule and evidence. Preserve the original sources when corrections are made. The current update adds the supplied schema, feed/event mappings, POS/OSD/service rules, backorder conversion, concurrency design, test chronology and decision register while retaining the original eight-part walkthrough.

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
