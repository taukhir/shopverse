---
title: Array Programming Overview And Pattern Map
description: Beginner-to-senior guide to recognizing array interview patterns, invariants, complexity, mutation, duplicates, and Java-specific risks.
sidebar_label: Array Overview
sidebar_position: 1
difficulty: Foundation to Advanced
page_type: Overview
status: maintained
last_reviewed: "2026-07-24"
keywords: [Java arrays, array patterns, two pointers, prefix sum, Kadane, matrix]
---

# Array Programming Overview And Pattern Map

An array gives constant-time indexed access, but most array interview questions
are really tests of **state selection**. The important decision is what information
must survive as the scan advances.

## Pattern Selection Map

| Signal In The Requirement | Likely Pattern | State To Maintain |
|---|---|---|
| find a complement in unsorted input | hash map or set | value to index, membership, or frequency |
| sorted input and a pair/triple condition | two pointers | left and right candidate boundaries |
| contiguous range sum/count | prefix sum | earlier prefix values or their frequencies |
| best contiguous sum/product | dynamic programming | best result ending at current position |
| move or remove values in place | same-direction pointers | write boundary and scan boundary |
| values constrained to `1..n` | index marking or cyclic placement | array positions as a hash structure |
| rotated or monotonic search space | binary search | candidate interval plus sorted half |
| next greater/smaller relationship | monotonic stack | unresolved indices in monotonic order |
| matrix traversal or mutation | boundary simulation | top, bottom, left, right or marker row/column |
| overlapping ranges | sort and sweep | current merged interval |

## The Main Array Invariants

### Prefix Lookup

Before processing index `i`, the map contains only elements from indices smaller
than `i`. Therefore, a found complement cannot reuse the current element.

```java
Map<Integer, Integer> indexByValue = new HashMap<>();

for (int i = 0; i < nums.length; i++) {
    long complement = (long) target - nums[i];
    if (complement >= Integer.MIN_VALUE
            && complement <= Integer.MAX_VALUE
            && indexByValue.containsKey((int) complement)) {
        return new int[]{indexByValue.get((int) complement), i};
    }
    indexByValue.put(nums[i], i);
}
```

### Opposite-Direction Two Pointers

For ascending data, if the current sum is too small, moving `right` left cannot
help because it only decreases the sum. Advancing `left` is the only movement that
can reach the target. The symmetric argument applies when the sum is too large.

### Same-Direction Compaction

Indices before `write` already contain the final compacted prefix. `read` scans
the unclassified suffix. This invariant powers Move Zeroes and Remove Duplicates.

### Prefix Frequency

For prefix sum `prefix`, a subarray ending now sums to `k` when an earlier prefix
equaled `prefix - k`. Frequencies are required because several earlier positions
may have the same prefix sum.

### Kadane

At index `i`, `endingHere` is the maximum sum of any subarray that must end at
`i`. It either extends the previous subarray or starts fresh at the current value.

```java
endingHere = Math.max(nums[i], endingHere + nums[i]);
best = Math.max(best, endingHere);
```

## Contract Questions To Ask First

- May the input be null or empty?
- Is it sorted? If so, ascending or descending?
- May the method mutate the array?
- Return indices, values, count, or all combinations?
- Are duplicate indices distinct results?
- Must value combinations be unique?
- What should happen if no result exists?
- Can values or the answer exceed `int`?
- Is stable result order required?

## Java-Specific Risks

### Overflow

Cast before performing arithmetic:

```java
long sum = (long) nums[left] + nums[right];
long difference = Math.abs(sum - (long) target);
```

`Math.abs(Integer.MIN_VALUE)` is still negative because its positive magnitude
does not fit in an `int`.

### Input Mutation

Sorting is observable by the caller:

```java
int[] sorted = Arrays.copyOf(nums, nums.length);
Arrays.sort(sorted);
```

State the extra `O(n)` copy cost if the input must be preserved.

### Result Semantics

`List<int[]>` uses reference equality for elements. If results must be compared,
deduplicated, or exposed as a domain API, prefer a value type:

```java
record IntPair(int first, int second) {}
```

### Hashing Complexity

Java `HashMap` lookup is expected/amortized `O(1)`, not an unconditional worst-case
promise. For interview analysis, `O(n)` expected time is the conventional answer.

## Edge-Case Matrix

| Case | Why It Matters |
|---|---|
| `[]`, `[1]` | insufficient input |
| `[3, 3]`, target `6` | two distinct indices with equal values |
| `[1, 1, 5, 5]` | index pairs versus unique value pairs |
| all negative values | invalidates zero-based initialization in maximum problems |
| several zeroes | division and product edge cases |
| `Integer.MIN_VALUE/MAX_VALUE` | arithmetic overflow |
| already sorted/reverse sorted | best and worst pointer movement |
| all values identical | duplicate skipping and frequency counting |

## Interview Explanation Template

> The brute-force solution examines every pair and costs `O(n^2)`. The repeated
> work is searching the already processed prefix for a complement. I store that
> prefix in a hash map, so each lookup is expected `O(1)`. I check before inserting,
> which prevents reusing the same index. The algorithm is expected `O(n)` time and
> `O(n)` auxiliary space. I use `long` for complement arithmetic if the input can
> contain extreme integers.

Continue with [The Two Sum Family](./TWO-SUM-FAMILY.md), then work through the
[30-Problem Roadmap](./ARRAY-30-PROBLEM-ROADMAP.md).
