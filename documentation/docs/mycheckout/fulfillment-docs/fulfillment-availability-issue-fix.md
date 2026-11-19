---
slug: /mycheckout/fulfillment-docs/fulfillment-availability-issue-fix
title: "mycheckout — Fulfillment Availability Calculation Fix"
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

# mycheckout — Fulfillment Availability Calculation Fix

**Historical source notes.** Fix claims and observations retain their original dates; they have not been reverified against current runtime behavior.

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `fulfillment docs/fulfillment-availability-issue-fix.md` |
| Source SHA256 | `4553da278e016c1c7ee779d059c7960251e745676e661bf08b0ea4a49ae1fa0b` |
| Guide part | 1 of 1 |

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-bug-context#shared-e53940a14ac1).

## Fulfillment Availability Calculation Fix {#fulfillment-availability-calculation-fix}

## Summary {#summary}

Two defects were identified in the stock allocation flow for `SHIP_ELSE_BACKORDER` items:

1. Stock was deducted twice during sequential allocation.
2. A partial backorder was incorrectly returned as `SHP` with quantity `0` instead of `BO` with the remaining quantity.

## Request example {#request-example}

Stock before allocation:

```text
onHandQuantity   = 0
backorderQuantity = 999
reservedQuantity = 0
backorderReserve = 0
stockLevelStatus = SHIP_ELSE_BACKORDER
```

Requested lines:

```text
Line 1 = 90
Line 2 = 990
```

## Calculation location {#calculation-location}

The ATS calculation is performed in:

```text
ShipToHomeViewStrategy.calculateInternal(...)
SopViewStrategy.calculateInternal(...)
```

The common disposition decision is performed in:

```text
AvailabilityCalculationStrategy.evaluateFulfillableQuantities(...)
```

The caller is:

```text
StockLevelAllocationHelper.buildAllocationEntryWithStock(...)
```

## Issue 1: double deduction {#issue-1-double-deduction}

### Before the fix {#before-the-fix}

The evaluator changed `backorderQuantity`, while the allocation helper also increased `backorderReserve`.

For line 1:

```text
backorder ATS = 999 - 0 = 999
allocated     = 90
```

The old code then performed both updates:

```text
backorderQuantity = 999 - 90 = 909   // evaluator
backorderReserve  = 0 + 90 = 90       // helper
```

For line 2, the next ATS became:

```text
909 - 90 = 819
```

The same quantity was effectively deducted twice.

### After the fix {#after-the-fix}

The evaluator only calculates and returns the allocation result. It no longer changes `backorderQuantity`.

The helper alone updates the reservation:

```java
stockLevel.setBackorderReserve(
    stockLevel.getBackorderReserve()
        + calculatedAvailability.getRight());
```

After line 1:

```text
backorderQuantity = 999
backorderReserve  = 90
```

The next ATS is correctly calculated as:

```text
999 - 90 = 909
```

## Issue 2: incorrect partial-backorder status {#issue-2-incorrect-partial-backorder-status}

### Before the fix {#before-the-fix-1}

When on-hand quantity was zero and the remaining backorder quantity was less than the requested quantity, the old fallback returned:

```java
Pair.of(DispositionStatusDataDto.SHP, availableQuantity)
```

With:

```text
availableQuantity = 0
availableBackOrderQuantity = 909
```

the response became:

```text
SHP, 0
```

This was incorrect because no quantity could be sourced from on-hand stock.

### After the fix {#after-the-fix-1}

The corrected fallback is:

```java
if (availableQuantity > 0) {
    dispositionAndAts = Pair.of(
        DispositionStatusDataDto.SHP,
        availableQuantity);
} else {
    dispositionAndAts = Pair.of(
        DispositionStatusDataDto.BO,
        availableBackOrderQuantity);
}
```

Therefore:

```text
availableQuantity          = 0
availableBackOrderQuantity = 909
```

returns:

```text
BO, 909
```

## Final calculation after both fixes {#final-calculation-after-both-fixes}

### Line 1: requested 90 {#line-1-requested-90}

```text
Initial backorder ATS = 999 - 0 = 999
Allocated quantity    = 90
Result                = BO, 90
backorderReserve      = 0 + 90 = 90
```

### Line 2: requested 990 {#line-2-requested-990}

```text
backorder ATS = 999 - 90 = 909
Allocated quantity = 909
Result = BO, 909
backorderReserve = 90 + 909 = 999
```

Final allocation:

```text
Line 1: BO, 90
Line 2: BO, 909
Total:   999
```

## Code responsibility after the fix {#code-responsibility-after-the-fix}

<a id="shared-727d200281fb"></a>

| Component | Responsibility |
|---|---|
| `calculateInternal(...)` | Calculate on-hand ATS and backorder ATS |
| `evaluateFulfillableQuantities(...)` | Select disposition and fulfillable quantity |
| `StockLevelAllocationHelper` | Update `reservedQuantity` or `backorderReserve` |

This separation prevents stock from being mutated during calculation and ensures sequential allocations consume the available quantity exactly once.

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
