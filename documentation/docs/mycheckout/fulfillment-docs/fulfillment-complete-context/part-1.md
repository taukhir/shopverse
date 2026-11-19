---
slug: /mycheckout/fulfillment-docs/fulfillment-complete-context/part-1
title: "mycheckout — Completeness check — Part 1"
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

# mycheckout — Completeness check — Part 1

**Historical source notes.** Fix claims and observations retain their original dates; they have not been reverified against current runtime behavior.

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `fulfillment docs/FULFILLMENT-COMPLETE-CONTEXT.md` |
| Source SHA256 | `3a2c606cf7a59e648467aaac28b2e71642ee2cca63513f259cbb331526dad46e` |
| Guide part | 1 of 2 |

[Part 1](/mycheckout/fulfillment-docs/fulfillment-complete-context/part-1) · [Part 2](/mycheckout/fulfillment-docs/fulfillment-complete-context/part-2)

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-bug-context#shared-e53940a14ac1).

### Completeness check {#completeness-check}

<a id="shared-d715e3c64d0b"></a>

- Both evaluator overloads inspected — yes (DTO + Entity, both confirmed pure).
- All three availability strategies inspected — yes.
- Allocation and reservation callers inspected — yes (including the full parameter chain for AUTO_SOP/REGULAR_VIEW).
- Stock detail and listing flows inspected — yes.
- Audit mapping inspected — yes, in full, including the DTO and repository query.
- DTO serialization / Jackson config inspected — yes.
- Existing unit tests inspected — yes, full inventory taken.
- All stock statuses verified — yes.
- Regular, bundle, shared-stock flows verified — architecturally yes; **no test exists**, flagged below.
- Null handling checked — yes.
- Idempotency and release flows checked — yes, including an unclamped-subtraction gap found in Release.

No files were unreachable; nothing in this report is marked `NOT FOUND – NEEDS SOURCE FILE` for code, only for the Python API runner (confirmed genuinely absent from the repo).

---

#### A. Call flow (unchanged from prior analysis, now reconfirmed) {#a-call-flow-unchanged-from-prior-analysis-now-reconfirmed}

<a id="shared-194c2e0bce35"></a>

| Caller                          | File:line                                                  | Overload | API/flow                                                                                 | View selected                                                                                                                                                                            |
| ------------------------------- | ---------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `buildAllocationEntryWithStock` | StockLevelAllocationHelper.java:259                        | DTO      | `POST /allocations`                                                                      | Via `ViewSelectionService.selectViewForOrderType` (line 254) — AUTO_SOP→SOP_VIEW, else REGULAR_VIEW                                                                                      |
| `applyQuantityLogic`            | ReserveTransactionStockLevelInsertionStrategy.java:137-138 | Entity   | `POST /reservations` (via `StockLevelReservationService`) or direct `POST /stock-levels` | Whatever `atsType` is on the incoming request — `StockLevelReservationService.buildStockLevelRequest:185` **hardcodes `REGULAR_VIEW`**; a direct `/stock-levels` caller can set anything |

<a id="shared-10e64d42fca8"></a>

New finding this round: the `StockLevelAllocationHelper` path is **read-only/in-memory bookkeeping** (mutates a transient `StockLevelResponseDataDto`, never persists), while the `ReserveTransactionStockLevelInsertionStrategy` path is the only one that **persists**. So AUTO_SOP's SOP_VIEW treatment is confined entirely to allocation planning; it never reaches the persisted reservation unless an external caller explicitly sets `atsType=SOP_VIEW` on the `/stock-levels` request directly.

Stock detail/listing/audit flows confirmed as before — detail/listing use `calculate()` only (no evaluator), audit uses neither (raw field dump, see I below).

---

#### B. Mutation audit — reconfirmed, with purity now directly verified at the line level {#b-mutation-audit--reconfirmed-with-purity-now-directly-verified-at-the-line-level}

<a id="shared-dbc0ce530bb0"></a>

- `AvailabilityCalculationStrategy.java` entity overload (lines 261-372): only reads `stockLevel.getStockLevelStatus()` (line 274); zero setters. Comments at 304-312 document the removed bug.
- DTO overload (107-249): two `/* BEFORE (incorrect) */` blocks (157-167, 174-184) show the removed `setBackorderQuantity`/`setOnHandQuantity` calls — comment-only now.
- Reserve: ReserveTransactionStockLevelInsertionStrategy.java:145-163,165-177 — additive: `builder.reservedQuantity(latestStockLevel.getReservedQuantity() + viewAndAts.getRight())`, same pattern for `backorderReserve`. Never overwrites.
- Release: ReleaseTransactionStockLevelInsertionStrategy.java:113-114,121-127 — **unclamped subtraction**, no `Math.max(0, ...)` anywhere in the class. New confirmed finding (not in the original audit): a double/over-release with a *different* `referenceId* than the original reserve (so it bypasses the referenceId-keyed idempotency check) could drive `reservedQuantity`/`backorderReserve\` negative.

<a id="shared-7fd42ae71d9f"></a>

**Verdict unchanged:** double-mutation bug fixed; `StockLevelAllocationHelper` + the Reserve/Release strategies are the only legitimate mutators, each singly-guarded by advisory lock + idempotency (see H below). **New gap: Release has no floor-at-zero guard.**

---

#### C–D. Status table and strategy consistency {#cd-status-table-and-strategy-consistency}

<a id="shared-493f2c0b193c"></a>

Unchanged from the prior analysis — all 10 statuses confirmed to produce the table given previously; all three strategies apply the FORCE_TNA/NLA/NYA/NAW zeroing identically. No new contradicting evidence surfaced.

---

#### E. ViewSelectionService — one correction to the prior analysis {#e-viewselectionservice--one-correction-to-the-prior-analysis}

<a id="shared-d4083df34caf"></a>

The claim "reservation flow never uses the selected view" needed the fuller chain, now traced: `StockLevelReservationService.buildStockLevelRequest:185` hardcodes `REGULAR_VIEW` for every reservation it builds — confirmed, and confirmed **intentional/tested**, not an oversight: StockLevelReservationServiceTest.java:326 explicitly asserts `assertEquals("REGULAR_VIEW", request.getAtsType())`. So this is **test-confirmed current behavior**, which reclassifies J7 from "requires business confirmation" to "requires business confirmation that the *test's* expectation is actually the desired business rule" — i.e., someone decided this and wrote a test for it; the open question is only whether that decision is still correct for AUTO_SOP orders now that allocation-time SOP_VIEW exists.

`selectViewForTransaction` dead code / `BACKORDER_VIEW` no-impl landmine — reconfirmed, unchanged.

---

#### F. Null/zero handling — unchanged; NPE risk reconfirmed present, still unfixed. {#f-nullzero-handling--unchanged-npe-risk-reconfirmed-present-still-unfixed}

---

<a id="shared-6bc79f168ba7"></a>

#### G. Allocation scenarios 1–14 — unchanged from prior analysis (all verified analytically; scenario 13's shared-stock case still has zero test coverage). {#g-allocation-scenarios-114--unchanged-from-prior-analysis-all-verified-analytically-scenario-13s-shared-stock-case-still-has-zero-test-coverage}

**Scenarios 15 & 16 (new, reservation-side, now verified against actual code):**

<a id="shared-2fedbffdb534"></a>

- **15. Repeated transaction ID** → confirmed **idempotent no-op**. StockLevelServiceImpl.java:368-390 calls `checkForDuplicateTransactionReactive` (line 379) *before* `processStockLevelBatchWithTransaction` (line 437) is ever reached — on a match, the already-persisted response is returned unchanged (line 382), with the same pattern independently re-verified inside `ReserveTransactionStockLevelInsertionStrategy.checkForDuplicate` (lines 302-343, keyed on `referenceId` via `findLatestByReferenceId`) and `ReleaseTransactionStockLevelInsertionStrategy.checkForDuplicate` (238-278). No partial re-apply is possible — duplicate detection strictly precedes mutation.
- **16. New transaction ID, same item/warehouse/quantity as a prior transaction** → confirmed **correctly treated as a new reservation** (increments again). Idempotency is keyed strictly on `referenceId`, never on requested values — there is no value-based dedup gate anywhere in `checkForDuplicate` or `applyQuantityLogic`. No dedicated test exists for this exact scenario, but the code path has no mechanism that could produce the wrong (deduped) outcome.

---

#### H. Reservation scenarios {#h-reservation-scenarios}

<a id="shared-0635cbf03053"></a>

| Item                     | Finding                                                                                                                                                                    | File:line                                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Entity overload purity   | Confirmed pure                                                                                                                                                             | `AvailabilityCalculationStrategy.java:261-372`                                                                    |
| Reserve mechanics        | Additive, reads-then-adds                                                                                                                                                  | `ReserveTransactionStockLevelInsertionStrategy.java:145-177`                                                      |
| Release mechanics        | Subtractive, **unclamped**                                                                                                                                                 | `ReleaseTransactionStockLevelInsertionStrategy.java:113-127`                                                      |
| Advisory locking         | `pg_advisory_xact_lock(hashtext(itemCode\|warehouseCode\|country))`, acquired before read                                                                                  | `StockLevelDataRepository` lockStockLevelKey (\~196-204); `StockLevelTransactionHelper.processOneRequest:149-152` |
| Idempotency key          | `referenceId` (NOT `transactionId` — that's reserved for MANUAL-only dedup via `findLatestByTransactionId`)                                                                | confirmed across both strategies                                                                                  |
| AUTO_SOP vs REGULAR_VIEW | `StockLevelReservationService` always REGULAR_VIEW (hardcoded, test-asserted); only a direct external `/stock-levels` caller could set SOP_VIEW on a persisted reservation | `StockLevelReservationService.java:185`; `StockLevelReservationServiceTest.java:326`                              |
| Repeated txn ID          | Idempotent no-op                                                                                                                                                           | see G15                                                                                                           |
| New txn ID, same values  | New reservation, correctly incremented                                                                                                                                     | see G16                                                                                                           |

**Test coverage gaps found:**

<a id="shared-b991d6506128"></a>

- No test exercises Release going negative (over-release) — `ReleaseTransactionStockLevelInsertionStrategyTest.java` **does not exist as a dedicated file**; the only Release test (`StockLevelInsertionStrategiesTest.testReleaseStrategy_decreasesReservedAndBackorderReserve`, lines 152-173) only tests a safe, non-negative-outcome case.
- No test asserts evaluator purity directly (structural-only, by code inspection).
- No test exists for scenario 16 (new id, same values).

---

#### I. Audit scenarios — new findings, more serious than originally scoped {#i-audit-scenarios--new-findings-more-serious-than-originally-scoped}

Confirmed: no dedicated AuditService/AuditMapper; inline in `StockLevelServiceImpl.mapToAuditItem` (lines 662-719).

<a id="shared-129aaf1a4b0f"></a>

- **Transaction ID**: audit DTO (`StockLevelTransactionAuditItemResponseDataDto`) exposes only `referenceId` (line 54, mapped at `StockLevelServiceImpl.java:669`) — **`transactionId` has no field on the DTO at all** and is never surfaced, despite existing on the entity.
- **Transaction type**: **the audit DTO has no transactionType field**, and worse — the repository query `findLatestManualTransactions` (StockLevelDataRepository.java:659-673) hard-filters `WHERE s.transaction_type = 'MANUAL'` (line 667). **RESERVE and RELEASE transactions never appear in the audit trail at all** — this is a significant, previously-unflagged gap: the audit endpoint cannot show reservation or release history, only manual admin adjustments.
- **Status changes**: no before/after pair; current status isn't even mapped — only an ad-hoc attribute string, populated only if that specific MANUAL request happened to set it.
- **Quantity changes**: only absolute snapshots, never deltas, despite the DTO's own generated `@ApiModelProperty` example showing an arrow format (`"onHandQuantity: 100 -> 109"`) that the actual mapping code never produces (`StockLevelServiceImpl.java:676-713` emits single values, no delta). `reservedQuantity`/`backorderReserve` deltas exist on the underlying `StockLevelTransactionData` entity (lines 25-27) but are never read into the audit response at all — because, again, only MANUAL rows are queried.
- **Ordering**: `ORDER BY s.created_at DESC`, no offset applied despite a `page` parameter accepted upstream (StockLevelServiceImpl.java:623-624,632) — **a latent pagination bug**: `page` is accepted by the API but not actually applied as an offset to the query.
- **Date field**: `createdAt` is DB `nullable=false`, never omitted in practice.
- **Cleared flags**: `backorderEtaCleared`/`nextAvailablityEtaCleared`/`discontinuationDateCleared` exist and are correctly surfaced as explicit `"field: null"` attribute entries only for MANUAL transactions.
- **Null serialization**: `referenceId` (DB-nullable) and `version` can be null and are silently dropped from JSON by the global `NON_NULL` config (`JacksonCustomizer.java:54`), same mechanism as J4's allocation-field gap.
- **Test coverage**: `StockLevelControllerTest.testGetStockLevelAudit` (lines 207-222) mocks the service entirely and asserts only HTTP 200 + same-object-reference echo — **zero field-level assertions**. `StockLevelServiceImplTest` has no audit test at all.

---

#### K. Test coverage gap analysis {#k-test-coverage-gap-analysis}

<a id="shared-721524be8c39"></a>

**Covered by API runner:** none — there is **no Python API runner anywhere in this repository** (confirmed via full-repo search of `*.py`, `pytest.ini`, `conftest.py`, directories named tests/api-tests/qa/automation/postman/newman, and all docs/CI references). The only non-Java test tooling that exists is `test-as-code/` (bash + k6, not Python): `run-smoke-tests.sh` hits `GET /v1/stock-levels`, `GET /v1/stock-levels/detail`, `POST /v1/stock-levels` with only a non-5xx status check (no business assertions), and a k6 perf script against `POST /v1/stock-levels/batch` measuring latency/throughput under load, not correctness. **Marking per your instruction: NOT FOUND – NEEDS SOURCE FILE** for any Python-based functional API coverage; none of the 1-16 allocation/reservation/audit scenarios are covered by it because it does not exist.

**Covered by unit tests:**

<a id="shared-a8bc08342b3d"></a>

- Disposition logic (10 statuses × Regular/ShipToHome) — `RegularViewStrategyTest.java`, `ShipToHomeViewStrategyTest.java` (with stale assertions, see J1/J2).
- Advisory-lock ordering — `StockLevelTransactionHelperTest.testProcessBatch_locksKeyBeforeReadingLatestEntity`.
- Reserve additive increment, Reserve/Release duplicate-returns-existing — `ReserveTransactionStockLevelInsertionStrategyTest.java`, `StockLevelInsertionStrategiesTest.java` (lines 152-173, 202-232).
- REGULAR_VIEW hardcoding for reservations — `StockLevelReservationServiceTest.java:326`.
- Batch idempotency for `ON_HAND_ADJUSTMENT` — `StockLevelInsertionStrategiesTest.java:443-521`.

<a id="shared-d0590190d797"></a>

**Covered by integration tests:** none identified as a distinct integration-test layer beyond the above (all tests found are Mockito-based unit tests at the strategy/service/controller mock level, including `StockLevelControllerTest`, which is a mocked-service test, not a true integration test).

**Not covered:**

<a id="shared-f29918c72f51"></a>

- `SopViewStrategyTest.java` — does not exist at all.
- `ShipToHomeViewStrategyTest` missing FORCE_NLA/FORCE_NAW/SHIP_ELSE_NLA/SHIP_ELSE_NAW.
- Standalone+bundle shared-stock-map scenario (allocation scenario 13) — no test anywhere.
- Allocation entry zero/omission for TNA/NLA/NYA/NAW `sourcedQuantity`/`backorderableQuantity` — no test.
- Null-handling for `backorderReserve`/`backorderQuantity`/`sopProtection` — no test.
- Release-strategy over-release/negative-value scenario — no test; `ReleaseTransactionStockLevelInsertionStrategyTest.java` doesn't exist as its own file.
- New-id-same-values reservation scenario (16) — no test.
- Audit transactionType/status-change/quantity-delta/transactionId fields — not just untested, **structurally absent from the DTO and query** (RESERVE/RELEASE excluded entirely).
- Audit pagination offset — no test, and the code itself appears not to apply `page` as an offset.
- End-to-end controller-level bundle allocation, forced-status allocation, SHIP_ELSE_BACKORDER partial-backorder, duplicate-transaction-id — only `AllocationsControllerTest.testGenerateAllocations` exists (single happy-path case).

**Requires business confirmation:**

<a id="shared-af82a4320e76"></a>

- Whether RESERVE/RELEASE transactions *should* appear in the audit trail (currently structurally excluded — this may be an intentional "audit = manual override log" design, or a real functional gap, depending on what the audit endpoint is meant to represent).
- Whether `StockLevelReservationService`'s hardcoded REGULAR_VIEW for reservations is still correct now that AUTO_SOP orders get SOP_VIEW at allocation time (J7, reconfirmed test-locked-in behavior, not an accidental gap).
- REGULAR_VIEW vs SHIP_TO_HOME_VIEW identical formulas (J8).

---

#### L. Final classification {#l-final-classification}

<a id="shared-4b20585f25f9"></a>

| #   | File:line                                                                                                                                                                                        | Current behavior                                                                                                                                       | Expected behavior                                                                                   | Impact                                                                                                                                   | Classification                                                                                                                                          | Recommended change                                                                          | Test needed                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| L1  | RegularViewStrategyTest.java:155,174,193,231,269                                                                                                                                                 | Asserts `onHandQuantity` mutated to 80/25                                                                                                              | Should assert it stays unchanged (100)                                                              | Build-breaking                                                                                                                           | **Test regression**                                                                                                                                     | Update/remove the 5 stale assertions                                                        | Replace with assertions on returned Pair\<status,qty> only                                               |
| L2  | ShipToHomeViewStrategyTest.java:86,103                                                                                                                                                           | Asserts non-zero ATS (325/480) for FORCE_TNA/NYA                                                                                                       | Should assert 0                                                                                     | Build-breaking                                                                                                                           | **Test regression**                                                                                                                                     | Update assertions to expect 0                                                               | n/a once fixed                                                                                           |
| L3  | `RegularViewStrategy`/`ShipToHomeViewStrategy`/`SopViewStrategy` `calculateInternal`, e.g. RegularViewStrategy.java:102-103                                                                      | Unguarded unboxing of nullable `backorderReserve`/`backorderQuantity`/`sopProtection`                                                                  | Null should default to 0 before arithmetic                                                          | NPE in production if any of these DB columns is ever null (schema permits it)                                                            | **Confirmed bug**                                                                                                                                       | Guard with `Objects.requireNonNullElse(x, 0)` before arithmetic in all three classes        | Unit test with each nullable field set to null individually                                              |
| L4  | StockLevelAllocationHelper.java `buildAllocationEntryWithStock`                                                                                                                                  | TNA/NLA/NYA/NAW leave `sourcedQuantity`/`backorderableQuantity` null → omitted from JSON by `NON_NULL` config, contradicting DTO's `required=true`     | Explicit 0                                                                                          | Response contract violation for 4 of 10 statuses                                                                                         | **Confirmed bug**                                                                                                                                       | Add an `else` branch setting both fields to 0                                               | Allocation test asserting both fields present and `0` for each forced status                             |
| L5  | `AvailabilityCalculationStrategy.java` lines \~149-196 vs \~303-333                                                                                                                              | SHIP_ELSE_BACKORDER duplicated as two independently-shaped branches, one per overload                                                                  | Single shared implementation                                                                        | Maintenance drift risk, not a live bug                                                                                                   | **Possible regression risk**                                                                                                                            | Extract one shared private helper taking both onHandAts/backorderAts                        | Characterization test pinning both overloads to identical output for same inputs                         |
| L6  | ViewSelectionService.java:75-90                                                                                                                                                                  | `selectViewForTransaction` dead code; `BACKORDER_VIEW` has no strategy impl                                                                            | Either wire it up with an impl, or delete both                                                      | Latent `NoSuchElementException` if ever reconnected                                                                                      | **Dead code/cleanup**                                                                                                                                   | Delete `selectViewForTransaction` + `BACKORDER_VIEW`, or implement `BackorderViewStrategy`  | n/a (cleanup) or new strategy test if implemented                                                        |
| L7  | StockLevelReservationService.java:185, test-locked at StockLevelReservationServiceTest.java:326                                                                                                  | Reservation always REGULAR_VIEW regardless of order type, intentionally test-asserted                                                                  | Unclear if AUTO_SOP reservations should instead use SOP_VIEW                                        | Cross-flow inconsistency for AUTO_SOP orders between allocation-time and reservation-time ATS treatment                                  | **Requires business confirmation**                                                                                                                      | None without product input                                                                  | If changed: new test asserting SOP_VIEW passed through for AUTO_SOP                                      |
| L8  | `RegularViewStrategy`/`ShipToHomeViewStrategy` `calculateInternal`                                                                                                                               | Byte-for-byte identical formulas                                                                                                                       | Unclear if views should differ                                                                      | None currently (same output)                                                                                                             | **Requires business confirmation**                                                                                                                      | None without product input                                                                  | n/a                                                                                                      |
| L9  | Double-mutation evaluator, SHIP_ELSE_BACKORDER SHP/0 bug, forced-unavailable zeroing (all 3 views)                                                                                               | All verified fixed                                                                                                                                     | —                                                                                                   | —                                                                                                                                        | **Already fixed**                                                                                                                                       | None                                                                                        | None additional beyond L1/L2                                                                             |
| L10 | ReleaseTransactionStockLevelInsertionStrategy.java:113-114,121-127                                                                                                                               | Unclamped subtraction on release                                                                                                                       | Should floor at 0 (`Math.max(0, ...)`) or treat as a hard invariant violation                       | A release with a different referenceId than its reserve (bypassing idempotency) can drive `reservedQuantity`/`backorderReserve` negative | **Confirmed bug** (new this round)                                                                                                                      | Add `Math.max(0, ...)` guard, or assert-and-alarm if it would go negative                   | Over-release unit test asserting floor behavior                                                          |
| L11 | StockLevelDataRepository.java:659-673, StockLevelServiceImpl.java:623-632                                                                                                                        | Audit query hard-filters `transaction_type = 'MANUAL'`; RESERVE/RELEASE never appear in audit; `page` param accepted but not applied as a query offset | Unclear whether audit should include RESERVE/RELEASE; pagination should apply the offset it accepts | Audit trail cannot show reservation/release history at all; `page` parameter is a no-op                                                  | **Confirmed bug** (pagination no-op) + **Requires business confirmation** (scope of audit)                                                              | Fix pagination offset regardless of the scope decision                                      | Pagination test with page>0 returning distinct results; if scope expands, new tests per transaction type |
| L12 | Audit DTO (`StockLevelTransactionAuditItemResponseDataDto`), `StockLevelServiceImpl.mapToAuditItem:662-719`                                                                                      | No `transactionType`/`transactionId` field; status/quantity shown as single absolute value despite DTO's generated doc-comment implying a delta format | Align DTO docs/fields with actual data, or populate deltas as documented                            | Misleading API contract; consumers following the generated example string will get wrong expectations                                    | **Confirmed bug** (doc/implementation mismatch)                                                                                                         | Either implement delta-formatted attributes as documented, or correct the generated example | Audit test asserting actual attribute string format                                                      |
| L13 | StockLevelControllerTest.java:207-222                                                                                                                                                            | Mocks service, asserts only HTTP 200 + same-object echo                                                                                                | Should assert actual mapped field values                                                            | No regression protection for any audit field                                                                                             | **Missing test coverage**                                                                                                                               | —                                                                                           | Full `mapToAuditItem` unit test with real entity fixtures                                                |
| L14 | No `*.py` anywhere in repo (confirmed by full-repo search)                                                                                                                                       | —                                                                                                                                                      | User referenced a "Python API runner" that does not exist in this codebase                          | Cannot verify any of scenarios 1-16 against it                                                                                           | **Dead code/cleanup** classification doesn't fit — mark as **NOT FOUND – NEEDS SOURCE FILE**: if such a runner exists, it lives outside this repository | Confirm location with the user, or build one                                                | n/a until located                                                                                        |
| L15 | Standalone+bundle shared-stock scenario (G13), `SopViewStrategyTest`, FORCE_NLA/NAW+SHIP_ELSE_NLA/NAW in ShipToHome, null-handling, allocation zero/omission, over-release, audit field coverage | No tests exist                                                                                                                                         | —                                                                                                   | Largest unmitigated risk area in the whole change set                                                                                    | **Missing test coverage**                                                                                                                               | —                                                                                           | See K above, itemized                                                                                    |

<a id="shared-4c6411a86c4e"></a>

**Bottom line:** the four stated fixes are mostly solid (3 of 4 fully correct — L9), but L1/L2 (stale tests) make the current diff **unmergeable as-is**, L3/L4/L10 are real correctness gaps still open, and L11/L12 surface a previously-unscoped but genuine problem: the audit endpoint structurally cannot show reservation/release activity and its pagination parameter is inert. No Python API runner exists anywhere in this repository to lean on for coverage (L14) — all sixteen allocation/reservation scenarios and the audit scenarios are currently verified only by direct code reading in this session, not by any automated test.

---

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
