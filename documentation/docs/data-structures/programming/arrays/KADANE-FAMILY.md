---
title: Kadane Algorithm Family In Java
description: Maximum sum, printed maximum, minimum sum, printed minimum, circular subarray, and stock-profit variants with Java code, samples, logic, and dry runs.
sidebar_label: Kadane Family
sidebar_position: 3
difficulty: All Levels
page_type: Deep Dive
status: maintained
last_reviewed: "2026-07-24"
keywords: [Kadane Java, maximum subarray, minimum subarray, circular subarray, stock profit]
scope: generic
owner: docs-data-structures
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Kadane Algorithm Family In Java

Kadane's algorithm is a one-dimensional dynamic program. At every index, decide
whether the best subarray ending here should extend the previous subarray or
start at the current value.

## Family Map

| Problem | State | Time | Extra Space |
|---|---|---:|---:|
| maximum subarray sum | maximum sum ending here | `O(n)` | `O(1)` |
| print maximum subarray | maximum state + candidate/best indices | `O(n)` | `O(1)` excluding output |
| minimum subarray sum | minimum sum ending here | `O(n)` | `O(1)` |
| print minimum subarray | minimum state + candidate/best indices | `O(n)` | `O(1)` excluding output |
| maximum circular subarray | total + maximum Kadane + minimum Kadane | `O(n)` | `O(1)` |
| best stock trade | minimum price so far, or Kadane over differences | `O(n)` | `O(1)` |

## Core Invariant

For maximum sum at index `i`:

```text
maxEndingHere = max(nums[i], maxEndingHere + nums[i])
```

Every subarray ending at `i` either starts at `i`, or extends a subarray ending
at `i-1`. No third case exists. Retaining only the better choice is therefore
safe. The global answer is the best `maxEndingHere` seen at any index.

<DocCallout type="mistake" title="Do not initialize the answer to zero">

For a non-empty-subarray contract, initializing to zero incorrectly returns an
empty subarray for all-negative input. Initialize from the first element.

</DocCallout>

## Shared Result Type

```java
record SubarrayResult(long sum, int startInclusive, int endInclusive) {}
```

## 1. Maximum Subarray — Kadane

### Contract And Sample

```text
Input:  [-2, 1, -3, 4, -1, 2, 1, -5, 4]
Output: sum = 6
Reason: [4, -1, 2, 1] has the largest contiguous sum
```

### Logic

Track the best sum that must end at the current element and the best sum found
anywhere. Starting fresh is better exactly when the previous ending sum is
negative.

```java
static long maximumSubarraySum(int[] nums) {
    requireNonEmpty(nums);
    long endingHere = nums[0];
    long best = nums[0];

    for (int i = 1; i < nums.length; i++) {
        endingHere = Math.max((long) nums[i], endingHere + nums[i]);
        best = Math.max(best, endingHere);
    }
    return best;
}

static void requireNonEmpty(int[] nums) {
    if (nums == null || nums.length == 0) {
        throw new IllegalArgumentException("A non-empty array is required");
    }
}
```

<ExpandableAnswer title="How maximum-sum Kadane works">

- Initialize from the first element to enforce a non-empty subarray.
- `endingHere` chooses between starting at the current value and extending the
  previous best subarray that ended immediately before it.
- `best` records the largest ending value observed anywhere.
- Every index is processed once with constant state: `O(n)` time, `O(1)` space.

</ExpandableAnswer>

Time is `O(n)`, extra space `O(1)`. `long` prevents sum overflow for large
arrays of `int` values.

<ExpandableAnswer title="Dry run: [-2, 1, -3, 4, -1, 2, 1, -5, 4]">

| value | best ending here | global best | decision |
|---:|---:|---:|---|
| -2 | -2 | -2 | initialize |
| 1 | 1 | 1 | start fresh |
| -3 | -2 | 1 | extend `1` |
| 4 | 4 | 4 | start fresh |
| -1 | 3 | 4 | extend |
| 2 | 5 | 5 | extend |
| 1 | 6 | 6 | extend |
| -5 | 1 | 6 | extend; still positive |
| 4 | 5 | 6 | extend |

The maximum is `6`.

</ExpandableAnswer>

## 2. Print Maximum Subarray — Track Indices

### Contract And Sample

```text
Input:  [-2, 1, -3, 4, -1, 2, 1, -5, 4]
Output: sum = 6, start = 3, end = 6, values = [4, -1, 2, 1]
```

When starting fresh, update the candidate start. When a new global best appears,
snapshot the candidate start and current end.

```java
static SubarrayResult maximumSubarray(int[] nums) {
    requireNonEmpty(nums);
    long endingHere = nums[0];
    long best = nums[0];
    int candidateStart = 0;
    int bestStart = 0;
    int bestEnd = 0;

    for (int i = 1; i < nums.length; i++) {
        if ((long) nums[i] > endingHere + nums[i]) {
            endingHere = nums[i];
            candidateStart = i;
        } else {
            endingHere += nums[i];
        }

        if (endingHere > best) {
            best = endingHere;
            bestStart = candidateStart;
            bestEnd = i;
        }
    }
    return new SubarrayResult(best, bestStart, bestEnd);
}

static int[] copyMaximumSubarray(int[] nums) {
    SubarrayResult result = maximumSubarray(nums);
    return Arrays.copyOfRange(
            nums, result.startInclusive(), result.endInclusive() + 1);
}
```

<ExpandableAnswer title="How maximum-subarray index tracking works">

- When the current value alone is better than extending, reset `endingHere` and
  move `candidateStart` to this index.
- Otherwise extend the current candidate range.
- Whenever `endingHere` improves the global best, snapshot the candidate start
  and current index as the answer boundaries.
- `copyOfRange` uses an exclusive end, so pass `endInclusive + 1`.

</ExpandableAnswer>

The scan is `O(n)` and index tracking is `O(1)`. Copying the result costs
`O(k)` time and space for a subarray of length `k`.

<ExpandableAnswer title="Dry run of index tracking">

- At index `1`, start fresh: `candidateStart = 1` and best range becomes `[1,1]`.
- At index `3`, start fresh again: `candidateStart = 3`, best range `[3,3]`.
- Extending through `-1,2,1` improves the sum at indices `5` and `6`.
- Snapshot `[3,6]` when the sum becomes `6`.
- Later values never exceed `6`, so the printed range remains
  `[4,-1,2,1]`.

</ExpandableAnswer>

## 3. Minimum Subarray Sum — Reverse Kadane

### Contract And Sample

```text
Input:  [3, -4, 2, -3, -1, 7, -5]
Output: -6
Reason: [-4, 2, -3, -1] is the minimum-sum contiguous subarray
```

### Logic

This is the mirror image of maximum Kadane. At each index, the minimum subarray
ending here either starts at the current value or extends the previous minimum.

```text
minEndingHere = min(nums[i], minEndingHere + nums[i])
```

```java
static long minimumSubarraySum(int[] nums) {
    requireNonEmpty(nums);
    long endingHere = nums[0];
    long minimum = nums[0];

    for (int i = 1; i < nums.length; i++) {
        endingHere = Math.min((long) nums[i], endingHere + nums[i]);
        minimum = Math.min(minimum, endingHere);
    }
    return minimum;
}
```

<ExpandableAnswer title="How minimum-sum Kadane works">

- Mirror maximum Kadane by using `Math.min`.
- `endingHere` is the smallest sum of a non-empty subarray forced to end at the
  current index.
- Compare starting fresh with extending, then update the global minimum.
- First-element initialization handles positive-only input without selecting an
  illegal empty range.

</ExpandableAnswer>

Time is `O(n)` and extra space `O(1)`. Initializing from `nums[0]` correctly
handles positive-only arrays: for `[4,2,7]`, the minimum non-empty sum is `2`,
not `0`.

<ExpandableAnswer title="Dry run for minimum sum: [3, -4, 2, -3, -1, 7, -5]">

| value | minimum ending here | global minimum | decision |
|---:|---:|---:|---|
| 3 | 3 | 3 | initialize |
| -4 | -4 | -4 | start fresh |
| 2 | -2 | -4 | extend `-4` |
| -3 | -5 | -5 | extend |
| -1 | -6 | -6 | extend |
| 7 | 1 | -6 | extend; sum becomes positive |
| -5 | -5 | -6 | start fresh at `-5` |

Return only the global minimum, `-6`.

</ExpandableAnswer>

## 4. Print Minimum Subarray — Track Indices

### Contract And Sample

```text
Input:  [3, -4, 2, -3, -1, 7, -5]
Output: sum = -6, start = 1, end = 4, values = [-4, 2, -3, -1]
```

Use the same minimum-ending invariant, but track where a newly started candidate
begins and snapshot its boundaries whenever the global minimum improves.

```java
static SubarrayResult minimumSubarray(int[] nums) {
    requireNonEmpty(nums);
    long endingHere = nums[0];
    long best = nums[0];
    int candidateStart = 0;
    int bestStart = 0;
    int bestEnd = 0;

    for (int i = 1; i < nums.length; i++) {
        if ((long) nums[i] < endingHere + nums[i]) {
            endingHere = nums[i];
            candidateStart = i;
        } else {
            endingHere += nums[i];
        }

        if (endingHere < best) {
            best = endingHere;
            bestStart = candidateStart;
            bestEnd = i;
        }
    }
    return new SubarrayResult(best, bestStart, bestEnd);
}
```

<ExpandableAnswer title="How minimum-subarray index tracking works">

- Reset the candidate start when the current value alone is smaller than
  extending the previous minimum-ending range.
- Otherwise extend the existing candidate.
- When that ending sum is a new global minimum, snapshot candidate start and
  current index.
- Return the sum and inclusive boundaries; callers may copy that exact range.

</ExpandableAnswer>

Time is `O(n)` and extra space `O(1)`.

<ExpandableAnswer title="Dry run for minimum indices: [3, -4, 2, -3, -1, 7, -5]">

| value | minimum ending here | global minimum |
|---:|---:|---:|
| 3 | 3 | 3 |
| -4 | -4 | -4 |
| 2 | -2 | -4 |
| -3 | -5 | -5 |
| -1 | -6 | -6 |
| 7 | 1 | -6 |
| -5 | -5 | -6 |

The minimum range starts when `-4` starts fresh and ends when the running
minimum reaches `-6` at index `4`.

</ExpandableAnswer>

## 5. Maximum Circular Subarray

### Contract And Sample

```text
Input:  [5, -3, 5]
Output: sum = 10, wrapped values = [5] + [5]
Reason: take the suffix at index 2 and prefix at index 0
```

The best circular subarray is either:

1. non-wrapping—the ordinary maximum subarray; or
2. wrapping—everything except one contiguous minimum subarray.

Therefore `wrappingSum = totalSum - minimumSubarraySum`.

```java
record CircularResult(long sum, int start, int end, boolean wraps) {}

static CircularResult maximumCircularSubarray(int[] nums) {
    requireNonEmpty(nums);
    SubarrayResult maximum = maximumSubarray(nums);

    // All-negative: excluding the minimum would select an empty subarray.
    if (maximum.sum() < 0) {
        return new CircularResult(
                maximum.sum(), maximum.startInclusive(),
                maximum.endInclusive(), false);
    }

    long total = 0;
    for (int value : nums) total += value;
    SubarrayResult minimum = minimumSubarray(nums);
    long wrappingSum = total - minimum.sum();

    if (maximum.sum() >= wrappingSum) {
        return new CircularResult(
                maximum.sum(), maximum.startInclusive(),
                maximum.endInclusive(), false);
    }

    int start = (minimum.endInclusive() + 1) % nums.length;
    int end = (minimum.startInclusive() - 1 + nums.length) % nums.length;
    return new CircularResult(wrappingSum, start, end, true);
}
```

<ExpandableAnswer title="How maximum circular subarray works">

- Compute the best ordinary maximum range first.
- A wrapping range includes everything except one contiguous minimum range, so
  compute total sum and the indexed minimum subarray.
- Compare ordinary sum with `total - minimum.sum()` and derive wrapped boundaries
  from the excluded range.
- Return the ordinary result for all-negative input because excluding the whole
  array would create an invalid empty answer.

</ExpandableAnswer>

Time is `O(n)` and extra space `O(1)`. For a wrapped result, traverse from
`start` to the array end, then from index `0` through `end`.

<ExpandableAnswer title="Dry run: [5, -3, 5]">

- Ordinary maximum is `7` from `[5,-3,5]`.
- Total is `7`.
- Minimum subarray is `[-3]` with sum `-3`.
- Excluding it gives `7 - (-3) = 10`.
- The wrapped range starts after index `1`, at index `2`, then wraps to end at
  index `0`: `[5] + [5]`.

</ExpandableAnswer>

## 6. Best Time To Buy And Sell Stock

### Contract And Sample

One buy must occur before one sell; making no transaction is allowed.

```text
Input:  prices = [7, 1, 5, 3, 6, 4]
Output: profit = 5, buy index = 1, sell index = 4
Reason: buy at 1 and sell at 6
```

### Greedy Form

The best trade ending today buys at the minimum price seen before today. Track
that minimum and the best profit.

```java
record TradeResult(long profit, int buyIndex, int sellIndex) {}

static TradeResult bestStockTrade(int[] prices) {
    if (prices == null || prices.length < 2) {
        return new TradeResult(0, -1, -1);
    }

    int minimumPriceIndex = 0;
    long bestProfit = 0;
    int bestBuy = -1;
    int bestSell = -1;

    for (int sell = 1; sell < prices.length; sell++) {
        long profit = (long) prices[sell] - prices[minimumPriceIndex];
        if (profit > bestProfit) {
            bestProfit = profit;
            bestBuy = minimumPriceIndex;
            bestSell = sell;
        }
        if (prices[sell] < prices[minimumPriceIndex]) {
            minimumPriceIndex = sell;
        }
    }
    return new TradeResult(bestProfit, bestBuy, bestSell);
}
```

<ExpandableAnswer title="How the stock-trade code works">

- `minimumPriceIndex` always identifies the cheapest day seen before or at the
  current sell day.
- Compute the profit for selling today after buying on that cheapest day.
- Snapshot buy/sell indices only when profit strictly improves, giving a stable
  tie rule.
- Update the minimum after evaluating the sale; a day can become the buy point
  for future days. Zero profit represents no transaction.

</ExpandableAnswer>

Time is `O(n)` and extra space `O(1)`. Decreasing prices return profit `0` and
indices `-1,-1`, representing no trade.

### Difference-Array Connection To Kadane

For prices `[7,1,5,3,6,4]`, daily differences are `[-6,4,-2,3,-2]`. A contiguous
sum of differences from day `b+1` through day `s` equals `price[s]-price[b]`.
Therefore the maximum profitable trade is the maximum subarray of the difference
array. The greedy solution is preferable because it avoids allocating that array.

<ExpandableAnswer title="Dry run: prices [7, 1, 5, 3, 6, 4]">

| sell day/price | minimum earlier price | candidate profit | best trade |
|---|---:|---:|---|
| 1 / 1 | 7 | -6 | no trade; new minimum is day 1 |
| 2 / 5 | 1 | 4 | buy 1, sell 2 |
| 3 / 3 | 1 | 2 | keep previous |
| 4 / 6 | 1 | 5 | buy 1, sell 4 |
| 5 / 4 | 1 | 3 | keep profit 5 |

</ExpandableAnswer>

## Common Mistakes

- returning zero for all-negative maximum-subarray input when a non-empty range
  is required;
- tracking only sums, then trying to reconstruct indices after the scan;
- resetting the candidate start without snapshotting it when the global best
  changes;
- using `int` for a sum that can overflow;
- using `total - minimum` for an all-negative circular array, which selects an
  empty wrapped range;
- allowing sell before buy in the stock problem;
- confusing maximum subarray with maximum subsequence, where contiguity is not
  required;
- leaving tie-breaking undefined when several ranges have the same sum.

## Test Matrix

| Input shape | Expected concern |
|---|---|
| `[5]` | single-element range |
| `[-8,-3,-6]` | all-negative maximum is `-3`, not zero |
| `[1,2,3]` | whole array is maximum |
| `[5,-3,5]` | wrapped maximum |
| `[3,-1,2,-1]` | tie policy and whole-range behavior |
| extreme `int` values | sum/profit overflow |
| falling stock prices | no-transaction result |

## Revision Summary

```text
Maximum sum       -> max(current, previousMaxEnding + current)
Print maximum     -> also track candidate start and best [start,end]
Minimum sum       -> min(current, previousMinEnding + current)
Print minimum     -> also track candidate start and best [start,end]
Circular maximum  -> max(ordinary maximum, total - minimum), guard all-negative
One stock trade   -> minimum price so far; equivalent to Kadane on differences
```

## Official References

- [Java language arithmetic operators](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html)
- [Java `Math` API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html)
