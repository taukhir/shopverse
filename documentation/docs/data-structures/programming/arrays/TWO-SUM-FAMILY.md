---
title: Two Sum Family In Java
description: Eight Two Sum variants with contracts, Java implementations, input/output examples, complexity, edge cases, and collapsible dry runs.
sidebar_label: Two Sum Family
sidebar_position: 2
difficulty: Foundation to Advanced
page_type: Deep Dive
status: maintained
last_reviewed: "2026-07-24"
keywords: [Two Sum Java, all pairs, pair count, closest sum, 3Sum, HashMap, two pointers]
---

# Two Sum Family In Java

Two Sum is not one problem. The algorithm changes when the output changes from
one pair to every index pair, every value pair, a count, unique combinations, or
a closest result.

## Family Map

| # | Contract | Technique | Time | Extra Space |
|---:|---|---|---:|---:|
| 1 | unsorted, return first indices | complement → earlier index map | expected `O(n)` | `O(n)` |
| 2 | unsorted, return all index pairs | complement → all earlier indices | `O(n + p)` | `O(n + p)` |
| 3 | unsorted, return all value pairs | earlier value frequencies | `O(n + p)` | `O(u + p)` |
| 4 | count all index pairs | earlier value frequencies | expected `O(n)` | `O(u)` |
| 5 | sorted, return one pair | opposite pointers | `O(n)` | `O(1)` |
| 6 | closest pair | sort + opposite pointers | `O(n log n)` | copy-dependent |
| 7 | unique value pairs | sort + duplicate skipping | `O(n log n)` | copy-dependent |
| 8 | three values sum to target | sort + fix one + two pointers | `O(n²)` | copy-dependent |

Here `p` is the number of returned pairs and `u` the number of unique values.
Output-sensitive algorithms cannot beat `O(p)` when they must materialize `p`
answers.

## Shared Result Types

```java
record IndexPair(int firstIndex, int secondIndex) {}
record IntPair(int firstValue, int secondValue) {}
record IntTriple(int first, int second, int third) {}
```

Value records provide structural equality, unlike raw `int[]` elements inside a
`List`.

## 1. Two Sum Unsorted — First Pair Of Indices

### Contract And Sample

```text
Input:  nums = [2, 7, 11, 15], target = 9
Output: [0, 1]
Reason: nums[0] + nums[1] = 2 + 7 = 9
```

### Logic

Before processing index `i`, store only values from earlier indices. Look up
`target - nums[i]` before inserting the current value, so one index cannot be
used twice.

```java
static int[] twoSumUnsorted(int[] nums, int target) {
    Map<Integer, Integer> earlierIndexByValue = new HashMap<>();

    for (int i = 0; i < nums.length; i++) {
        long complement = (long) target - nums[i];
        if (complement >= Integer.MIN_VALUE
                && complement <= Integer.MAX_VALUE) {
            Integer earlier = earlierIndexByValue.get((int) complement);
            if (earlier != null) {
                return new int[]{earlier, i};
            }
        }
        earlierIndexByValue.putIfAbsent(nums[i], i);
    }
    return new int[]{-1, -1};
}
```

<ExpandableAnswer title="How the unsorted Two Sum code works">

- The map contains only earlier values and their earliest indices.
- For each value, compute `target - value` in `long` and look for that
  complement before inserting the current index.
- A match therefore uses two distinct indices; `putIfAbsent` keeps deterministic
  earliest-index behavior.
- If the scan ends without a match, return the documented no-result pair.

</ExpandableAnswer>

Expected `O(n)` time and `O(n)` space. `putIfAbsent` preserves the earliest
index when several valid answers exist.

<ExpandableAnswer title="Dry run: [3, 2, 4], target 6">

| `i` | value | complement | earlier map before check | action |
|---:|---:|---:|---|---|
| 0 | 3 | 3 | `{}` | no match; store `3→0` |
| 1 | 2 | 4 | `{3→0}` | no match; store `2→1` |
| 2 | 4 | 2 | `{3→0, 2→1}` | find index `1`; return `[1,2]` |

Checking before insertion also handles `[3,3]`, target `6`: the second `3`
matches the first rather than reusing itself.

</ExpandableAnswer>

## 2. Two Sum Unsorted — All Index Pairs

### Contract And Sample

```text
Input:  nums = [1, 1, 2, 2], target = 3
Output: [(0,2), (1,2), (0,3), (1,3)]
```

Each distinct index combination is a result. A single index per value would lose
duplicate combinations, so store every earlier index.

```java
static List<IndexPair> allIndexPairs(int[] nums, int target) {
    Map<Integer, List<Integer>> earlierIndicesByValue = new HashMap<>();
    List<IndexPair> pairs = new ArrayList<>();

    for (int i = 0; i < nums.length; i++) {
        long complement = (long) target - nums[i];
        if (complement >= Integer.MIN_VALUE
                && complement <= Integer.MAX_VALUE) {
            for (int earlier : earlierIndicesByValue.getOrDefault(
                    (int) complement, List.of())) {
                pairs.add(new IndexPair(earlier, i));
            }
        }
        earlierIndicesByValue
                .computeIfAbsent(nums[i], ignored -> new ArrayList<>())
                .add(i);
    }
    return pairs;
}
```

<ExpandableAnswer title="How all index-pair generation works">

- Map each value to every earlier index where it occurred.
- At index `i`, each stored index for the complement forms one distinct pair
  with `i`, so append all of them.
- Store `i` only after emitting matches, preventing self-pairs and duplicates.
- Runtime includes output size because every returned pair must be materialized.

</ExpandableAnswer>

Time is `O(n + p)` and total space is `O(n + p)`, including output.

<ExpandableAnswer title="Dry run: [1, 1, 2, 2], target 3">

- At indices `0` and `1`, store both positions under value `1`.
- At index `2`, value `2` needs `1`; emit `(0,2)` and `(1,2)`.
- Store index `2` under value `2`.
- At index `3`, emit `(0,3)` and `(1,3)`.
- No pair repeats, because only earlier indices are consulted.

</ExpandableAnswer>

## 3. Two Sum Unsorted — All Value Pairs

### Contract And Sample

This version returns one value pair for every valid index pair, so duplicates
remain visible:

```text
Input:  nums = [1, 1, 2, 2], target = 3
Output: [(1,2), (1,2), (1,2), (1,2)]
```

```java
static List<IntPair> allValuePairs(int[] nums, int target) {
    Map<Integer, Integer> earlierFrequency = new HashMap<>();
    List<IntPair> pairs = new ArrayList<>();

    for (int value : nums) {
        long complement = (long) target - value;
        if (complement >= Integer.MIN_VALUE
                && complement <= Integer.MAX_VALUE) {
            int other = (int) complement;
            int occurrences = earlierFrequency.getOrDefault(other, 0);
            for (int copy = 0; copy < occurrences; copy++) {
                pairs.add(new IntPair(other, value));
            }
        }
        earlierFrequency.merge(value, 1, Integer::sum);
    }
    return pairs;
}
```

<ExpandableAnswer title="How all value-pair generation works">

- `earlierFrequency` counts how many earlier indices hold each value.
- For current `value`, every earlier occurrence of its complement represents a
  distinct index pair, so append that many value-pair copies.
- Increment the current frequency afterward to avoid pairing an element with
  itself.
- This preserves multiplicity; it intentionally differs from unique pairs.

</ExpandableAnswer>

Time is `O(n + p)`; working space is `O(u)` excluding output. If the requirement
means unique value combinations instead, use problem 7.

<ExpandableAnswer title="Dry run: [1, 1, 2, 2], target 3">

The earlier frequency of `1` becomes two. Each later `2` therefore emits two
copies of `(1,2)`. Two later `2`s × two earlier `1`s = four value-pair results.

</ExpandableAnswer>

## 4. Two Sum Pair Count

### Contract And Sample

```text
Input:  nums = [1, 1, 1, 1], target = 2
Output: 6
Reason: four indices form 4 choose 2 distinct pairs
```

Instead of materializing matches, add the number of earlier complements.

```java
static long countTwoSumPairs(int[] nums, int target) {
    Map<Integer, Integer> earlierFrequency = new HashMap<>();
    long count = 0;

    for (int value : nums) {
        long complement = (long) target - value;
        if (complement >= Integer.MIN_VALUE
                && complement <= Integer.MAX_VALUE) {
            count += earlierFrequency.getOrDefault((int) complement, 0);
        }
        earlierFrequency.merge(value, 1, Integer::sum);
    }
    return count;
}
```

<ExpandableAnswer title="How pair counting works">

- Keep frequencies only for values at earlier indices.
- The number of earlier complements is exactly the number of new index pairs
  ending at the current element, so add that frequency to `count`.
- Record the current value after counting.
- Use `long` because the number of pairs can be quadratic even though the scan
  itself is linear.

</ExpandableAnswer>

Expected `O(n)` time and `O(u)` space. Use `long`: the pair count can exceed
`Integer.MAX_VALUE`.

<ExpandableAnswer title="Dry run: [1, 1, 1, 1], target 2">

The four values contribute `0 + 1 + 2 + 3 = 6` earlier matches. Each unordered
index pair is counted exactly when its later index is processed.

</ExpandableAnswer>

## 5. Two Sum Sorted

### Contract And Sample

```text
Input:  nums = [1, 2, 4, 6, 10], target = 8
Output: [1, 3]
Reason: nums[1] + nums[3] = 2 + 6
```

If the sum is too small, discard the left value; pairing it with any smaller
right value cannot help. If too large, discard the right value symmetrically.

```java
static int[] twoSumSorted(int[] nums, int target) {
    int left = 0;
    int right = nums.length - 1;

    while (left < right) {
        long sum = (long) nums[left] + nums[right];
        if (sum == target) {
            return new int[]{left, right};
        }
        if (sum < target) {
            left++;
        } else {
            right--;
        }
    }
    return new int[]{-1, -1};
}
```

<ExpandableAnswer title="How sorted Two Sum works">

- Start with the smallest and largest remaining values.
- If their sum is too small, the current left value cannot work with any smaller
  right value, so advance `left`.
- If too large, the current right value cannot work with any larger left value,
  so retreat `right`.
- Equality returns the pair; pointer convergence proves no pair exists.

</ExpandableAnswer>

Time is `O(n)` and extra space `O(1)`.

<ExpandableAnswer title="Dry run: [1, 2, 4, 6, 10], target 8">

| left/right values | sum | decision |
|---|---:|---|
| `1 + 10` | 11 | too large → move right |
| `1 + 6` | 7 | too small → move left |
| `2 + 6` | 8 | return indices `[1,3]` |

</ExpandableAnswer>

## 6. Two Sum Closest

### Contract And Sample

```text
Input:  nums = [-1, 2, 4, 8], target = 6
Output: (2, 4), sum = 6, absolute difference = 0
```

For unsorted input, sort a copy and run two pointers while tracking the smallest
absolute `long` difference. This version returns values; attach original indices
to values before sorting if indices are required.

```java
static IntPair twoSumClosest(int[] nums, int target) {
    if (nums.length < 2) {
        throw new IllegalArgumentException("At least two values are required");
    }

    int[] sorted = Arrays.copyOf(nums, nums.length);
    Arrays.sort(sorted);
    int left = 0;
    int right = sorted.length - 1;
    IntPair best = new IntPair(sorted[left], sorted[right]);
    long bestDifference = Long.MAX_VALUE;

    while (left < right) {
        long sum = (long) sorted[left] + sorted[right];
        long difference = Math.abs(sum - (long) target);
        if (difference < bestDifference) {
            bestDifference = difference;
            best = new IntPair(sorted[left], sorted[right]);
        }
        if (sum < target) {
            left++;
        } else if (sum > target) {
            right--;
        } else {
            break;
        }
    }
    return best;
}
```

<ExpandableAnswer title="How closest Two Sum works">

- Sort a copy so pointer movement changes the sum predictably without mutating
  caller input.
- At every pointer pair, compare its absolute `long` distance from the target
  with the best distance seen.
- Move left for a small sum and right for a large sum; an exact match is optimal.
- The strict comparison preserves the first equally close pair as the tie rule.

</ExpandableAnswer>

Time is `O(n log n)` and the copy uses `O(n)` space. The strict `<` keeps the
first pair on equal differences; document another tie-breaker if required.

<ExpandableAnswer title="Dry run: [-1, 2, 4, 8], target 6">

`-1+8=7` gives difference `1`, so it becomes best. Move right. `-1+4=3` gives
difference `3`; keep the previous best and move left. `2+4=6` gives difference
`0`, which is optimal, so return `(2,4)`.

</ExpandableAnswer>

## 7. Unique Value Pairs

### Contract And Sample

```text
Input:  nums = [1, 1, 2, 2, 3, 4], target = 5
Output: [(1,4), (2,3)]
```

Sort a copy. After recording a match, skip every duplicate of both matched
values.

```java
static List<IntPair> uniqueValuePairs(int[] nums, int target) {
    int[] sorted = Arrays.copyOf(nums, nums.length);
    Arrays.sort(sorted);
    List<IntPair> pairs = new ArrayList<>();
    int left = 0;
    int right = sorted.length - 1;

    while (left < right) {
        long sum = (long) sorted[left] + sorted[right];
        if (sum == target) {
            int low = sorted[left];
            int high = sorted[right];
            pairs.add(new IntPair(low, high));
            while (left < right && sorted[left] == low) left++;
            while (left < right && sorted[right] == high) right--;
        } else if (sum < target) {
            left++;
        } else {
            right--;
        }
    }
    return pairs;
}
```

<ExpandableAnswer title="How unique value-pair generation works">

- Sorting groups equal values and enables opposite-pointer elimination.
- On a match, emit the two values once, remember them, and advance past every
  duplicate on both sides.
- On a small or large sum, move only the pointer that can correct it.
- Duplicate skipping makes the output unique by values rather than indices.

</ExpandableAnswer>

Time is `O(n log n)` and the copy uses `O(n)` space.

<ExpandableAnswer title="Dry run: [1, 1, 2, 2, 3, 4], target 5">

- `1+4=5`: emit `(1,4)`, skip both `1`s and the `4`.
- `2+3=5`: emit `(2,3)`, skip both `2`s and the `3`.
- Pointers meet; output contains each value combination once.

</ExpandableAnswer>

## 8. Three Sum

### Contract And Sample

```text
Input:  nums = [-1, 0, 1, 2, -1, -4], target = 0
Output: [(-1,-1,2), (-1,0,1)]
```

Sort, fix one value, and solve a sorted Two Sum on its suffix. Skip duplicate
fixed and pointer values so triples are unique.

```java
static List<IntTriple> threeSum(int[] nums, int target) {
    int[] sorted = Arrays.copyOf(nums, nums.length);
    Arrays.sort(sorted);
    List<IntTriple> triples = new ArrayList<>();

    for (int i = 0; i < sorted.length - 2; i++) {
        if (i > 0 && sorted[i] == sorted[i - 1]) continue;
        int left = i + 1;
        int right = sorted.length - 1;

        while (left < right) {
            long sum = (long) sorted[i] + sorted[left] + sorted[right];
            if (sum == target) {
                triples.add(new IntTriple(sorted[i], sorted[left], sorted[right]));
                int low = sorted[left];
                int high = sorted[right];
                while (left < right && sorted[left] == low) left++;
                while (left < right && sorted[right] == high) right--;
            } else if (sum < target) {
                left++;
            } else {
                right--;
            }
        }
    }
    return triples;
}
```

<ExpandableAnswer title="How Three Sum works">

- Sort a copy, fix one value at index `i`, and solve a sorted Two Sum on the
  suffix for `target - sorted[i]`.
- Pointer comparisons move toward the required total.
- After a match, skip repeated left/right values; the outer loop also skips a
  repeated fixed value.
- Fixing `n` candidates with a linear pointer scan yields `O(n²)` time.

</ExpandableAnswer>

Time is `O(n²)` after sorting; the preserved-input copy uses `O(n)` space,
excluding output.

<ExpandableAnswer title="Dry run: [-1, 0, 1, 2, -1, -4], target 0">

Sorted input is `[-4,-1,-1,0,1,2]`. Fix `-4`: no pair reaches `4`. Fix the first
`-1`: pointers discover `(-1,-1,2)` and `(-1,0,1)`. Skip the second fixed `-1`
because it would reproduce the same triples. Later fixed values produce none.

</ExpandableAnswer>

## Decision And Edge-Case Checklist

- Clarify indices versus values, one result versus all, and multiplicity versus
  unique combinations.
- Use `long` for sums, complements, absolute differences, and pair counts.
- Check before inserting so the current index cannot match itself.
- Do not sort caller input unless mutation is part of the contract.
- Test empty/singleton inputs, `[3,3]`, many duplicates, negatives, zeroes,
  extreme integers, no result, several valid answers, and closest-pair ties.
- A sentinel such as `-1` is unsafe when negative sums are valid; prefer a
  result type or `Optional` for production APIs.

## Related But Different

`Subarray Sum Equals K` is a contiguous-range problem solved with prefix-sum
frequencies, not Two Sum over individual values. Repeated `add/find`, difference
equals `k`, maximum sum below `k`, 4Sum, and K-Sum are useful follow-ups after
the eight core contracts above.

## Revision Summary

```text
First unsorted indices -> value to earlier index
All index pairs         -> value to all earlier indices
All value pairs         -> earlier frequency + materialize multiplicity
Pair count              -> earlier frequency + add multiplicity
Sorted pair             -> opposite pointers
Closest pair            -> sort + pointers + best absolute difference
Unique value pairs      -> sort + pointers + duplicate skipping
Three Sum               -> sort + fix one + Two Sum
```

## Official References

- [Java `HashMap` API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html)
- [Java `Arrays` API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html)
