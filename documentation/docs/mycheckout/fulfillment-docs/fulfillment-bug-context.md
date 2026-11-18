---
slug: /mycheckout/fulfillment-docs/fulfillment-bug-context
title: "mycheckout — Executive summary"
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

# mycheckout — Executive summary

**Historical source notes.** Fix claims and observations retain their original dates; they have not been reverified against current runtime behavior.

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `fulfillment docs/FULFILLMENT-BUG-CONTEXT.md` |
| Source SHA256 | `06e7604d5037e308ff64c5bbef4aef73b73d3acfe5e4515a29a4a157a496561f` |
| Guide part | 1 of 1 |

<a id="shared-e53940a14ac1"></a>

> Verification update (2026-10-22): use [FULFILLMENT-END-TO-END.md](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-1), especially sections 14–20, for the current connected trace. Earlier fix descriptions are historical/proposed: the current DTO evaluator called by allocation still mutates supply and the helper also increments reservation counters; only the entity overload is pure. The expanded guide supersedes claims that this DTO fix is already applied, job schedules are absent, or checkout call order is untraced.

### Executive summary {#executive-summary}

<a id="shared-51df43807285"></a>

The four modified files apply three real fixes correctly in principle (no more double-mutation, SHIP_ELSE_BACKORDER no longer returns SHP/0, forced-unavailable statuses zero their ATS). However, **the fix as it stands on disk will almost certainly fail the existing test suite**, because `RegularViewStrategyTest.java` and `ShipToHomeViewStrategyTest.java` still assert the old, now-removed behavior and were not touched (git status confirms both are unmodified). Separately, two issues from the original ask are **not yet fixed**: an unguarded-null-unboxing NPE risk in all three `calculateInternal` methods, and TNA/NLA/NYA/NAW allocation entries silently omitting `sourcedQuantity`/`backorderableQuantity` from the JSON response instead of explicitly zeroing them.

---

### A. Call flow {#a-call-flow}

Confirmed exactly **two production call sites** for `evaluateFulfillableQuantities`, one per overload — no third hidden caller exists:

<a id="shared-eea619dccc40"></a>

| Caller                                                                          | Overload                    | Chain to entry point                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| StockLevelAllocationHelper.java:259 `buildAllocationEntryWithStock`             | `StockLevelResponseDataDto` | `AllocationsController.generateAllocations` → `AllocationsServiceImpl` → `AllocationHelper`(NEXTGEN=`StockLevelAllocationHelper`) → `buildAllocationGroup`→`buildAllocationEntries`→`buildAllocationEntryInternal`→`buildAllocationEntryWithStock`                                                                                |
| ReserveTransactionStockLevelInsertionStrategy.java:137-138 `applyQuantityLogic` | `StockLevelEntity`          | `StockLevelController.createStockLevel`/`batchCreateStockLevels` **or** `ReservationsController.createReservation`→`StockLevelReservationService`(NEXTGEN) → `StockLevelServiceImpl.createStockLevelBatch` → `StockLevelTransactionHelper.processOneRequest` → `ReserveTransactionStockLevelInsertionStrategy.applyQuantityLogic` |

<a id="shared-bebd84374be5"></a>

`calculateInternal` is **private** and duplicated independently in each of the three strategy classes — no shared/inherited implementation, no cross-class callers. It is reached only via each class's own `calculate(DTO)`/`calculate(Entity)` methods.

**Per-API flow:**

<a id="shared-2191b0d9bcb3"></a>

| API                                          | Uses `evaluateFulfillableQuantities`?                                  | Uses `calculateInternal`?                                                                                                                                                     |
| -------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stock detail (`GET /stock-levels/detail`)    | No                                                                     | Yes, via `calculate()` for all country-applicable strategies                                                                                                                  |
| Stock listing (`GET /stock-levels`)          | No                                                                     | Yes, same path                                                                                                                                                                |
| Allocations (`POST /allocations`)            | Yes — DTO overload                                                     | Yes (indirectly, `calculate()` is called first to build `AvailabilityDetailDataDto`)                                                                                          |
| Reservations (`POST /reservations`, NEXTGEN) | Yes — Entity overload, **always via hardcoded `atsType=REGULAR_VIEW`** | Yes, same                                                                                                                                                                     |
| Audit (`GET /stock-levels/audit`)            | No                                                                     | No — raw field dump, no `AvailabilityCalculationStrategy` involvement at all; there is no dedicated audit mapper class, it's inline in `StockLevelServiceImpl.mapToAuditItem` |

<a id="shared-039c413b709c"></a>

This matters: **fixes #1 and #2 (double-deduction, partial backorder) only affect Allocations and Reservations.** Fix [#3](https://github.com/mycheckoutCommon/commerce-fulfillment-dataservice/issues/3) (forced-unavailable ATS zeroing, done in `calculateInternal`) affects *all* of stock detail/listing/allocations/reservations, since every path eventually calls `calculate()`.

---

### B. Mutation audit {#b-mutation-audit}

<a id="shared-3c808c3fb7a9"></a>

| Setter                                                  | File:line                                                                  | Classification                             | Expected?                          | Double-deduction risk?                                                                                                            |
| ------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `setOnHandQuantity`/`setBackorderQuantity`              | AvailabilityCalculationStrategy.java — only in `/* BEFORE */` comments now | n/a (removed)                              | —                                  | **No longer present** — this is the fix                                                                                           |
| `setReservedQuantity`/`setBackorderReserve`             | StockLevelAllocationHelper.java:270,280 `buildAllocationEntryWithStock`    | Reservation (in-memory pooling)            | Yes — intentional, single site now | **Not within one call**, but see F7 below — relies on `stockLevelMap` being keyed/shared correctly across standalone+bundle lines |
| `builder.reservedQuantity/backorderReserve`             | ReserveTransactionStockLevelInsertionStrategy.java:151-173                 | Reservation (persisted)                    | Yes                                | No — guarded by per-key advisory lock + idempotency check in `StockLevelTransactionHelper`                                        |
| `builder.reservedQuantity/backorderReserve` (decrement) | `ReleaseTransactionStockLevelInsertionStrategy.java:113-114`               | Restoration                                | Yes                                | No — same guards                                                                                                                  |
| `transactionData.setOnHandQuantity` etc.                | `ManualTransactionStockLevelInsertionStrategy.java:130-216`                | Audit snapshot (separate object)           | Yes                                | No                                                                                                                                |
| `tempDto.setOnHandQuantity` etc.                        | `StockLevelServiceImpl.java:563-576`                                       | Calculation (fresh transient DTO per call) | Yes                                | No                                                                                                                                |

<a id="shared-aad162ecaf63"></a>

**Verdict:** the double-mutation bug is fixed — `evaluateFulfillableQuantities` is now pure in both overloads, and `StockLevelAllocationHelper` is the sole mutator of `reservedQuantity`/`backorderReserve` in the allocation path.

---

<a id="shared-9ec6db079f5e"></a>

### C. Status table (post-fix, as computed by `calculateInternal` + `evaluateFulfillableQuantities`) {#c-status-table-post-fix-as-computed-by-calculateinternal--evaluatefulfillablequantities}

<a id="shared-3b83f7b13ee8"></a>

| Status                | On-hand ATS       | Backorder ATS     | Disposition                | Allocation qty                | Expected API behavior |
| --------------------- | ----------------- | ----------------- | -------------------------- | ----------------------------- | --------------------- |
| FORCE_IN_STOCK        | computed normally | 0                 | SHP                        | requested qty                 | Ship full qty         |
| FORCE_BACKORDER       | computed normally | computed normally | BO                         | min(backorder ATS, requested) | Backorder             |
| FORCE_TNA             | **0** (forced)    | **0** (forced)    | TNA                        | 0                             | Unavailable           |
| FORCE_NLA             | **0** (forced)    | **0** (forced)    | NLA                        | 0                             | Unavailable           |
| FORCE_NYA             | **0** (forced)    | **0** (forced)    | NYA                        | 0                             | Unavailable           |
| FORCE_NAW             | **0** (forced)    | **0** (forced)    | NAW                        | 0                             | Unavailable           |
| SHIP_ELSE_BACKORDER   | >0                | —                 | SHP                        | min(onHandATS, requested)     | Ship                  |
| SHIP_ELSE_BACKORDER   | 0                 | >0                | **BO** (fixed — was SHP/0) | backorder ATS                 | Backorder             |
| SHIP_ELSE_BACKORDER   | 0                 | 0                 | TNA                        | 0                             | Unavailable           |
| SHIP_ELSE_TNA/NLA/NAW | >0                | n/a               | SHP                        | min(onHandATS, requested)     | Ship                  |
| SHIP_ELSE_TNA/NLA/NAW | 0                 | n/a               | TNA/NLA/NAW                | 0                             | Unavailable           |

<a id="shared-f6327e758569"></a>

This matches the intended fix [#2](https://github.com/mycheckoutCommon/commerce-fulfillment-dataservice/issues/2) and [#3](https://github.com/mycheckoutCommon/commerce-fulfillment-dataservice/issues/3) exactly.

---

### D. View consistency {#d-view-consistency}

<a id="shared-dc8c4356d34d"></a>

`RegularViewStrategy`, `ShipToHomeViewStrategy`, `SopViewStrategy` all contain the **identical** FORCE_TNA/NLA/NYA/NAW zeroing block (byte-for-byte, confirmed by diff) immediately before calling the shared `determineDispositionStatus`. No divergence there.

**Two things worth flagging, not bugs in the current diff but pre-existing/adjacent:**

<a id="shared-bfaf08d1bfbd"></a>

- `RegularViewStrategy.calculateInternal` and `ShipToHomeViewStrategy.calculateInternal` are **byte-for-byte identical formulas** — REGULAR_VIEW and SHIP_TO_HOME_VIEW currently produce identical ATS results. If that's intentional (business says SHIP_TO_HOME should equal REGULAR), fine; otherwise it's a sign one of them is missing its distinguishing logic. **Requires business confirmation.**
- `SopViewStrategy` omits the `sopProtection` deduction (by design per its own doc comment) — consistent with fix [#3](https://github.com/mycheckoutCommon/commerce-fulfillment-dataservice/issues/3)'s SOP_VIEW requirement, just noting the asymmetry is deliberate.

---

### E. ViewSelectionService {#e-viewselectionservice}

<a id="shared-40c92ec99e88"></a>

- `selectViewForOrderType` (used by `StockLevelAllocationHelper`) and `validateAndSelectView`'s fallback chain (country-not-applicable → REGULAR_VIEW → first configured applicable view → REGULAR_VIEW) are logically sound and log accurately at each branch (`warn` on fallback, `info` on success, `error` on invalid config).
- **`selectViewForTransaction` is dead code** — zero production callers (grep confirms only `ViewSelectionServiceTest.java` calls it). ViewSelectionService.java:75-90
- `StockLevelView.BACKORDER_VIEW` has **no** `AvailabilityCalculationStrategy` implementation. If `selectViewForTransaction` were ever wired up and selected it, the downstream `.filter(...).findAny().orElseThrow()` lookup in both `StockLevelAllocationHelper` and `ReserveTransactionStockLevelInsertionStrategy` would throw `NoSuchElementException`. Currently unreachable, but latent.
- **Asymmetry:** `StockLevelReservationService.buildStockLevelRequest` (line 185) **hardcodes `atsType = REGULAR_VIEW.toString()`** for every reservation, bypassing `ViewSelectionService` entirely. An AUTO_SOP order gets `SOP_VIEW` treatment during allocation but always `REGULAR_VIEW` treatment when the resulting reservation is booked. **Requires business confirmation** — may be intentional (SOP protection shouldn't apply to the reservation step) or a real inconsistency.

---

### F. Null/zero handling {#f-nullzero-handling}

**Confirmed, unguarded NPE risk — not fixed by this diff:**

```
// RegularViewStrategy.java:102-103, ShipToHomeViewStrategy.java:103-104 (identical), SopViewStrategy.java:99
Integer onHandAts = onHandQuantity - reservedQuantity - backorderReserve - sopProtection;
```

<a id="shared-dda161b8ca77"></a>

`StockLevelEntity`'s `backorderReserve`, `backorderQuantity`, `sopProtection` columns have **no `nullable = false`** constraint (unlike `onHandQuantity`/`reservedQuantity`, which do). A null in any of them throws NPE on unboxing, with zero null-guards anywhere in the three strategy classes (confirmed via grep — no `Objects.requireNonNullElse` exists in this package at all).

<a id="shared-f43131c97f39"></a>

**Confirmed field-omission issue:**\
`StockLevelAllocationHelper.buildAllocationEntryWithStock` only sets `sourcedQuantity`/`backorderableQuantity` in its SHP and BO branches — there's no `else` for TNA/NLA/NYA/NAW, so those fields stay at their default `null`. The server's effective Jackson config (JacksonCustomizer.java:54, `serializationInclusion(NON_NULL)`) then **drops the keys from the JSON response entirely** — not `0`, not `null`, absent — which contradicts the generated DTO's `@JsonProperty(required = true)` on `sourcedQuantity`. The `buildAllocationEntryWithoutStock` (missing-stock-record) path has the same gap for `backorderableQuantity`.

<a id="shared-c3ad45e823be"></a>

**Missing stock-level record:** `buildAllocationEntryInternal` falls back to `buildAllocationEntryWithoutStock`, which sets only `sourcedQuantity=0`; `backorderableQuantity`/`dispositionStatus` are left null (also omitted from JSON).

---

### G. Allocation scenarios — analytical walkthrough {#g-allocation-scenarios--analytical-walkthrough}

<a id="shared-dee009622381"></a>

1. onHand=0, backorder=999, req=90/990 → both SHIP_ELSE_BACKORDER: onHandATS=0, backorderATS=999 → **BO, qty 90** and **BO, qty 999** (not 990 — correctly clamped) respectively. Matches fix [#2](https://github.com/mycheckoutCommon/commerce-fulfillment-dataservice/issues/2).
2. onHand=999, backorder=999, req=90/990 → onHandATS≥req both times → **SHP, qty 90** / **SHP, qty 990**.
3. onHand=100, backorder=0, req=40/60/1 → FORCE_BACKORDER or SHIP_ELSE_BACKORDER with backorder exhausted: all **SHP** at requested qty (40/60/1), since onHand covers all three.
4. onHand=0, backorder=100, req=40/60/1 → all **BO** at requested qty — this is the exact shape of the original bug report; now correctly returns BO rather than SHP/0.\
   5-8. positive stock + FORCE_TNA/NLA/NYA/NAW → ATS forced to 0 regardless of actual on-hand/backorder values → disposition TNA/NLA/NYA/NAW, qty 0. Confirmed by the added zeroing block.\
   9-10. existing `reservedQuantity`/`backorderReserve` → correctly subtracted in the ATS formula (pre-existing, unaffected by this diff).\
   11-12. regular vs. bundle line items → **this is the original bug's exact scenario** and the one area with zero test coverage anywhere in the repo (see I below) despite being the trigger for this whole investigation. Architecturally the fix is sound (single mutation point, shared `stockLevelMap` object accumulates correctly across sequential calls — see B), but it is unverified by any automated test.

---

### H. API-level impact {#h-api-level-impact}

<a id="shared-673d7262776c"></a>

| Method changed                                   | Endpoint(s) impacted                                | Response fields                                                                                              | Entity/DB fields              | Audit | Tests                                                                     | Backward compat                                                                                                                                         |
| ------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------- | ----- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `evaluateFulfillableQuantities` (both overloads) | Allocations, Reservations/direct stock-level create | `dispositionStatus`, `sourcedQuantity`/`backorderableQuantity` on allocation entries                         | None directly (pure calc now) | None  | **5 stale assertions in RegularViewStrategyTest will likely now fail**    | Clients that previously saw SHP/0 for exhausted-on-hand-with-backorder will now see BO — this is a disposition change on the wire, worth a release note |
| `calculateInternal` (×3 strategies)              | Stock detail, listing, allocations, reservations    | `onHandQuantityAvailableToSell`/`backorderQuantityAvailableToSell` now forced to 0 for FORCE_TNA/NLA/NYA/NAW | None                          | None  | **2 stale assertions in ShipToHomeViewStrategyTest will likely now fail** | Any client reading non-zero ATS for forced-unavailable statuses previously will now see 0 — also a wire-visible change                                  |

---

### I. Missing tests (prioritized) {#i-missing-tests-prioritized}

<a id="shared-8bac1ed8bfc5"></a>

1. **Shared stock-level aliasing** (the original bug's exact scenario) — no test exists at `StockLevelAllocationHelper` level anywhere; still no automated regression lock for the bug that started this investigation.
2. **`SopViewStrategyTest.java` does not exist at all** — zero coverage of SOP_VIEW for any of the 10 statuses.
3. `ShipToHomeViewStrategyTest` missing FORCE_NLA, FORCE_NAW, SHIP_ELSE_NLA, SHIP_ELSE_NAW entirely.
4. No test anywhere verifies `sourcedQuantity`/`backorderableQuantity` are 0 (or correctly omitted) for TNA/NLA/NYA/NAW allocation entries.
5. No null-handling tests (`null` `reservedQuantity`/`backorderReserve`/`sopProtection`) anywhere — matches the NPE risk in F.
6. No audit-record test beyond "status 200" — no disposition/quantity assertions.

---

### J. Final classified findings {#j-final-classified-findings}

<a id="shared-9b9c45fe3bec"></a>

| #   | File:line                                                                                                                                                                                                                            | Finding                                                                                                                                                                                                         | Classification                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| J1  | RegularViewStrategyTest.java:155,174,193,231,269                                                                                                                                                                                     | Asserts `stockLevel.getOnHandQuantity()` was mutated to 80/25 by `evaluateFulfillableQuantities`; current production code never mutates it (stays 100). **These assertions will fail against the current fix.** | **Confirmed bug (test regression) — blocks the fix from being mergeable as-is**                          |
| J2  | ShipToHomeViewStrategyTest.java:86,103                                                                                                                                                                                               | Asserts `onHandQuantityAvailableToSell`=325/480 for FORCE_TNA/FORCE_NYA; current code forces this to 0. **Will fail.**                                                                                          | **Confirmed bug (test regression)**                                                                      |
| J3  | `RegularViewStrategy.java`/`ShipToHomeViewStrategy.java`/`SopViewStrategy.java`, `calculateInternal`                                                                                                                                 | Unguarded unboxing of nullable `backorderReserve`/`backorderQuantity`/`sopProtection` → NPE risk                                                                                                                | **Confirmed bug — not addressed by this diff**                                                           |
| J4  | StockLevelAllocationHelper.java `buildAllocationEntryWithStock`                                                                                                                                                                      | `sourcedQuantity`/`backorderableQuantity` left null (not zeroed) for TNA/NLA/NYA/NAW, then omitted from JSON by global `NON_NULL` Jackson config, conflicting with the DTO's `required=true`                    | **Confirmed bug — not addressed by this diff; task item #4 unresolved**                                  |
| J5  | `AvailabilityCalculationStrategy.java` lines 149-196 vs 303-333                                                                                                                                                                      | SHIP_ELSE_BACKORDER logic duplicated as two independently-shaped branches (one per overload) instead of one shared implementation                                                                               | **Possible regression risk (maintenance drift)** — currently correct, but easy to desync in future edits |
| J6  | ViewSelectionService.java:75-90                                                                                                                                                                                                      | `selectViewForTransaction` dead code; `BACKORDER_VIEW` has no strategy impl                                                                                                                                     | **Expected behavior / cleanup candidate**, not a live bug                                                |
| J7  | StockLevelReservationService.java:185                                                                                                                                                                                                | Reservation always uses `REGULAR_VIEW`, ignoring the view selected during allocation                                                                                                                            | **Requires business confirmation**                                                                       |
| J8  | `RegularViewStrategy`/`ShipToHomeViewStrategy` `calculateInternal`                                                                                                                                                                   | Byte-for-byte identical formulas                                                                                                                                                                                | **Requires business confirmation**                                                                       |
| J9  | Core double-mutation (`AvailabilityCalculationStrategy` evaluator), SHIP_ELSE_BACKORDER SHP/0 bug, forced-unavailable ATS zeroing                                                                                                    | All three verified fixed and architecturally sound                                                                                                                                                              | **Already fixed**                                                                                        |
| J10 | No test for standalone+bundle shared-stock scenario; no `SopViewStrategyTest`; missing FORCE_NLA/NAW/SHIP_ELSE_NLA/NAW coverage in ShipToHome; no null-handling tests; no zero/omission tests for TNA/NLA/NYA/NAW allocation entries | **Confirmed test-coverage gap** across the board                                                                                                                                                                |                                                                                                          |

<a id="shared-6d3ad528475f"></a>

**Immediate action needed before this can ship:** fix J1/J2 (update or remove the 5+2 stale assertions) or the build is red; and decide on J3/J4, which are real correctness gaps the stated bug-fix scope (items 3 and 4 in your list) implies should already be closed but aren't.

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
