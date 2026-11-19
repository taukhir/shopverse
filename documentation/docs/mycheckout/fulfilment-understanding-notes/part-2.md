---
slug: /mycheckout/fulfilment-understanding-notes/part-2
title: "mycheckout — Fulfilment — Part 2"
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

# mycheckout — Fulfilment — Part 2

**Historical source notes.** Fix claims and observations retain their original dates; they have not been reverified against current runtime behavior.

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `Fulfilment-Understanding-Notes.md` |
| Source SHA256 | `3d47a30bb67c11a68bfacd48438e7c011e39e167a8fffdfb159eac5d0f7cf4c6` |
| Guide part | 2 of 2 |

[Part 1](/mycheckout/fulfilment-understanding-notes/part-1) · [Part 2](/mycheckout/fulfilment-understanding-notes/part-2)

## 6. Transaction types identified so far {#6-transaction-types-identified-so-far}

<a id="shared-8f36e56bdeab"></a>

| Type | Behaviour established from the shared work | Implementation / deduplication |
|---|---|---|
| `MANUAL` | Create first state or assign supplied absolute values; reject unchanged-only updates | `ManualTransactionStockLevelInsertionStrategy`; `transactionId` |
| `RESERVE` | Calculate eligible quantity and add to `reservedQuantity` for SHP or `backorderReserve` for BO | `ReserveTransactionStockLevelInsertionStrategy`; `referenceId` |
| `RELEASE` | Subtract applicable released quantities from reservation counters | `ReleaseTransactionStockLevelInsertionStrategy`; `referenceId` |
| `ON_HAND_ADJUSTMENT` | Existence and batch-idempotency tests were identified in the 7 October review | Exact arithmetic, fields and strategy implementation need source verification |

<a id="shared-7cb938e8dc0c"></a>

This is the verified set encountered, not a claim that the complete generated enum has only four values. Inspect `StockLevelTransactionTypeDataDto`, the strategy resolver and relevant strategies for an exhaustive contract.

To see types actually present in retained data:

```sql
SELECT transaction_type, COUNT(*) AS row_count
FROM YOUR_SCHEMA.YOUR_STOCK_TABLE
WHERE country = :country
GROUP BY transaction_type
ORDER BY transaction_type;
```

<a id="shared-1f348098e057"></a>

Observed database values cannot prove that an unused enum value is unsupported. A repeated reservation reference returns the existing result; a different reference with identical quantities represents another operation and may reserve again.

## 7. Disposition statuses, formulas and decision order {#7-disposition-statuses-formulas-and-decision-order}

<a id="shared-d80e49f01fde"></a>

`stockLevelStatus` is the configured stock rule. `dispositionStatus` is the calculated outcome. The reviewed disposition values are SHP (ship), BO (backorder), TNA (temporarily unavailable), NLA (no longer available), NYA (not yet available), and NAW (unavailable at the warehouse). Use the product contract for exact UI wording.

Let O = on-hand, R = reserved, BR = backorder reserve, B = backorder quantity, P = SOP protection. The earlier confirmed formulas are:

<a id="shared-0c7a3e9e3c81"></a>

| View | On-hand ATS before forced-status override |
|---|---|
| `REGULAR_VIEW` | `max(0, O - R - BR - P)` |
| `SHIP_TO_HOME_VIEW` | `max(0, O - R - BR - P)` |
| `SOP_VIEW` | `max(0, O - R - BR)` |

<a id="shared-897b4cfc4830"></a>

Backorder ATS is `max(0, B - BR)` only for `SHIP_ELSE_BACKORDER` or `FORCE_BACKORDER`; otherwise it is zero. Forced TNA/NLA/NYA/NAW override both ATS quantities to zero. Physical stock may still be positive.

Example: O=100, R=10, BR=5, P=10, B=50 gives regular/home on-hand ATS=75, SOP on-hand ATS=85, and permitted backorder ATS=45.

<a id="shared-4c4f7f494958"></a>

`calculateInternal()` belongs separately to each of `RegularViewStrategy`, `ShipToHomeViewStrategy`, and `SopViewStrategy`. Shared `AvailabilityCalculationStrategy.determineDispositionStatus()` maps the rule and computed ATS to the displayed disposition. The recovered decision code does not branch on `lowStockThreshold`, `beBackorderQuantity`, or date fields; their other business roles need separate tracing.

<a id="shared-9e3c62c7a5be"></a>

| Configured stock rule | Listing/detail disposition | Requested-quantity behaviour |
|---|---|---|
| `FORCE_IN_STOCK` | SHP | Return requested quantity, even if computed on-hand ATS is lower |
| `FORCE_BACKORDER` | BO | `min(requested, backorder ATS)`; no shipping fallback |
| `FORCE_TNA` | TNA; both ATS zero | Quantity zero |
| `FORCE_NLA` | NLA; both ATS zero | Quantity zero |
| `FORCE_NYA` | NYA; both ATS zero | Quantity zero |
| `FORCE_NAW` | NAW; both ATS zero | Quantity zero |
| `SHIP_ELSE_BACKORDER` | SHP if on-hand ATS > 0; otherwise BO if backorder ATS > 0; otherwise TNA | Follow ordered rules below |
| `SHIP_ELSE_TNA` | SHP if on-hand ATS > 0; otherwise TNA | Ship `min(requested, on-hand ATS)` or zero |
| `SHIP_ELSE_NLA` | SHP if on-hand ATS > 0; otherwise NLA | Ship `min(requested, on-hand ATS)` or zero |
| `SHIP_ELSE_NAW` | SHP if on-hand ATS > 0; otherwise NAW | Ship `min(requested, on-hand ATS)` or zero |

<a id="shared-1f066f730527"></a>

There is no `SHIP_ELSE_NYA` in the ten reviewed cases. `FORCE_BACKORDER` can retain BO disposition with zero fulfillable quantity. `FORCE_IN_STOCK` does not imply its displayed ATS is infinite.

For a positive requested quantity Q, the reviewed `SHIP_ELSE_BACKORDER` evaluator chooses:

<a id="shared-51090f154473"></a>

1. Both pools exhausted → TNA, 0.
2. On-hand ATS covers Q → SHP, Q.
3. Otherwise backorder ATS covers Q → BO, Q.
4. Otherwise some on-hand remains → SHP, available on-hand quantity.
5. Otherwise some backorder remains → BO, available backorder quantity.

<a id="shared-228f617de927"></a>

This branch chooses one pool; it does not combine partial on-hand and backorder into one fulfilled quantity. For example, on-hand ATS=5, backorder ATS=20 and Q=10 produces BO/10 even though listing/detail shows SHP because some on-hand exists. Availability display and order fulfilment answer different questions.

<a id="shared-33f9cb355514"></a>

The 5 October pasted source had the partial-backorder fix in the DTO overload but still lacked it in the entity overload. The 7 October review reports both fixed. These notes describe that later reviewed behaviour, not a claim that the older attachment contains both fixes.

## 8. Other important information {#8-other-important-information}

<a id="shared-0e0c13d591f8"></a>

**Allocation versus reservation.** `StockLevelAllocationHelper` uses a transient stock map shared across regular and bundle entries, updates in-memory reservation counters, and does not persist stock. `ReserveTransactionStockLevelInsertionStrategy` persists reservation counters. The evaluator is intended to be pure: it returns disposition/quantity without deducting stock itself. Removing its setters fixed double consumption alongside the helper's deductions.

<a id="shared-dbbe388a8dc7"></a>

**View selection.** Allocation selects SOP_VIEW for AUTO_SOP and otherwise REGULAR_VIEW, subject to applicability/fallback configuration. The reviewed `StockLevelReservationService.buildStockLevelRequest()` hardcodes REGULAR_VIEW. That difference is confirmed behaviour requiring business agreement if changed; it is not evidence that SOP reservations already use SOP_VIEW. Country configuration controls which views appear on listing/detail responses.

<a id="shared-b5435b6ab03d"></a>

**Checkout guest conversion is separate.** The previously traced checkout Biz `InventoryServiceImpl.handleGuestCheckoutBackorder()` converts guest BO entries to TNA and clears backorder quantity/ETA. Guest detection requires guest checkout configuration plus the anonymous-user condition. This downstream conversion can explain checkout showing TNA when fulfilment itself calculated BO; it is not a stock persistence change.

<a id="shared-28457268eda7"></a>

**Retention limits historical lookup.** `StockLevelServiceImpl.purgeOldStockLevels()` passes minimum retained versions and a retention-hours cutoff to the repository. Once a historical row is purged, the live stock table may no longer answer an old as-of request. The exact repository retention predicate still needs verification.

<a id="shared-4f5982adc95e"></a>

**Issues recorded in earlier reviews, without later closure verified here:** nullable stock inputs can fail during arithmetic; over-release subtraction lacked a non-negative guard; unavailable allocation quantities could be omitted rather than zero; audit pagination and audit field coverage were incomplete; allocation and reservation view rules differed. Stale evaluator-mutation test assertions also remained in the 8 October uploaded tests. Treat these as dated findings, not a fresh statement of the current branch's test status.

<a id="shared-e67f53bd5af6"></a>

**Practical investigation order:** confirm tenant/country and item/warehouse → inspect latest raw state and version → inspect selected view and ATS → inspect stock rule/disposition → check requested quantity evaluator → distinguish allocation from reservation writes → inspect all transaction rows if reservation history matters → check any downstream checkout conversion.

<a id="shared-9daed171d097"></a>

**Remaining source needed for exact completion:** `StockLevelDataRepository`, `StockLevelEntity`, `AbstractStockLevelInsertionStrategy`, `StockLevelTransactionHelper`, the generated transaction enum, and ON_HAND_ADJUSTMENT strategy. These would replace SQL placeholders, establish complete transaction semantics, and verify persistence defaults/constraints. The main audit, MANUAL update and API routing explanations above are directly supported by the recovered source.

## Source record {#source-record}

<a id="shared-dbad21a77f97"></a>

- `Pasted markdown (2)(5).md`, 5 October: MANUAL insertion strategy, validation and date-cleared flags.
- `Pasted markdown(20261005-094908).md`: StockLevelServiceImpl, listing/detail routing, audit mapping and purge entry point.
- `Pasted markdown(20261005-142000).md`: AvailabilityCalculationStrategy, displayed disposition rules and requested-quantity decision order.
- `Pasted markdown(20261007-171641).md` and `Pasted markdown(20261007-174717).md`: later implementation reviews for both evaluators, forced ATS, reservations, locking and audit limitations. Some prose examples in the earlier review conflict with the source; the source's ordered decision logic is used here.
- `Pasted markdown(20261008-111246).md`: inspected beginning of uploaded tests, including stale mutation expectations.
- Earlier discussion retrieved for the confirmed regular/home/SOP formulas and the separate guest checkout conversion.

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
