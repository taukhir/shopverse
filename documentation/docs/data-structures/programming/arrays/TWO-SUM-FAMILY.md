---
title: Two Sum Family In Java
description: In-depth interview guide to exact, sorted, closest, counting, unique-pair, streaming data-structure, difference, 3Sum, and K-sum patterns.
sidebar_label: Two Sum Family
sidebar_position: 2
difficulty: Foundation to Advanced
page_type: Deep Dive
status: maintained
last_reviewed: "2026-07-24"
keywords: [Two Sum Java, 3Sum, HashMap, two pointers, coding interview]
---

# Two Sum Family In Java

Two Sum is a family of contracts, not one problem. Before choosing an algorithm,
clarify whether the interviewer wants indices, values, all index combinations,
unique value combinations, a count, the closest sum, or repeated `add/find` calls.

## Contract Matrix

| Contract | Preferred Technique | Expected Time | Auxiliary Space |
|---|---|---:|---:|
| first indices, unsorted | value-to-index map | `O(n)` | `O(n)` |
| first values, unsorted | membership set | `O(n)` | `O(n)` |
| first pair, sorted | opposite pointers | `O(n)` | `O(1)` |
| count all index pairs | frequency map | `O(n)` | `O(n)` |
| all index pairs | value-to-list-of-indices map | `O(n + output)` | `O(n + output)` |
| unique value pairs | sort and skip duplicates | `O(n log n)` | sort-dependent |
| closest pair | sort and two pointers | `O(n log n)` | sort-dependent |
| maximum sum below `k` | sort and two pointers | `O(n log n)` | sort-dependent |
| repeated `add` and `find` | frequency map | add `O(1)`, find `O(u)` | `O(u)` |
| three values sum to target | fix one plus two pointers | `O(n^2)` | sort-dependent |

## 1. First Pair Of Indices In Unsorted Input

### Invariant

Before index `i` is inserted, the map represents only earlier indices. If the
complement exists, the returned pair contains two distinct positions.

```java
static int[] twoSumIndices(int[] nums, int target) {
    if (nums == null || nums.length < 2) {
        return new int[]{-1, -1};
    }

    Map<Integer, Integer> indexByValue = new HashMap<>();

    for (int i = 0; i < nums.length; i++) {
        long complement = (long) target - nums[i];

        if (complement >= Integer.MIN_VALUE
                && complement <= Integer.MAX_VALUE) {
            Integer earlierIndex = indexByValue.get((int) complement);
            if (earlierIndex != null) {
                return new int[]{earlierIndex, i};
            }
        }

        indexByValue.put(nums[i], i);
    }

    return new int[]{-1, -1};
}
```

Checking before `put` matters for `[3, 3]` and target `6`: the first `3` is stored,
then the second `3` matches it. Inserting and checking the current entry can reuse
the same index incorrectly.

## 2. First Pair In Sorted Input

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

### Pointer Proof

If `nums[left] + nums[right]` is below the target, pairing `nums[left]` with any
smaller right-side value is also too small. Therefore `left` cannot participate
in a solution within the current range and may be discarded. The greater-than
case is symmetric.

## 3. Count Every Index Pair

This counts multiplicity. For `[1, 1, 1, 1]` and target `2`, the answer is six,
not one, because four distinct indices form `4 choose 2` pairs.

```java
static long countPairs(int[] nums, int target) {
    Map<Integer, Integer> frequency = new HashMap<>();
    long count = 0;

    for (int value : nums) {
        long complement = (long) target - value;
        if (complement >= Integer.MIN_VALUE
                && complement <= Integer.MAX_VALUE) {
            count += frequency.getOrDefault((int) complement, 0);
        }
        frequency.merge(value, 1, Integer::sum);
    }

    return count;
}
```

Use `long` for the count: an array with many duplicates can produce more than
`Integer.MAX_VALUE` pairs.

## 4. All Index Pairs

A single value-to-index map loses earlier duplicate indices. Store every earlier
index per value and append one result for each matching earlier index.

```java
record IndexPair(int first, int second) {}

static List<IndexPair> allIndexPairs(int[] nums, int target) {
    Map<Integer, List<Integer>> indicesByValue = new HashMap<>();
    List<IndexPair> result = new ArrayList<>();

    for (int i = 0; i < nums.length; i++) {
        long complement = (long) target - nums[i];
        if (complement >= Integer.MIN_VALUE
                && complement <= Integer.MAX_VALUE) {
            for (int earlier : indicesByValue.getOrDefault(
                    (int) complement, List.of())) {
                result.add(new IndexPair(earlier, i));
            }
        }
        indicesByValue.computeIfAbsent(nums[i], ignored -> new ArrayList<>())
                .add(i);
    }

    return result;
}
```

The time is `O(n + output)`. No algorithm can return `p` pairs in less than
`O(p)` output time.

## 5. Unique Value Pairs

Sorting makes duplicate semantics explicit. This implementation preserves caller
input by sorting a copy.

```java
record IntPair(int first, int second) {}

static List<IntPair> uniqueValuePairs(int[] nums, int target) {
    int[] sorted = Arrays.copyOf(nums, nums.length);
    Arrays.sort(sorted);

    List<IntPair> result = new ArrayList<>();
    int left = 0;
    int right = sorted.length - 1;

    while (left < right) {
        long sum = (long) sorted[left] + sorted[right];

        if (sum == target) {
            int leftValue = sorted[left];
            int rightValue = sorted[right];
            result.add(new IntPair(leftValue, rightValue));

            while (left < right && sorted[left] == leftValue) {
                left++;
            }
            while (left < right && sorted[right] == rightValue) {
                right--;
            }
        } else if (sum < target) {
            left++;
        } else {
            right--;
        }
    }

    return result;
}
```

## 6. Closest Pair

The common bug is comparing signed differences:

```java
// Wrong: a very negative value appears artificially better.
int difference = sum - target;
```

Compare absolute `long` differences instead.

```java
static int[] closestPairIndicesInSortedArray(int[] nums, int target) {
    if (nums == null || nums.length < 2) {
        throw new IllegalArgumentException("At least two values are required");
    }

    int left = 0;
    int right = nums.length - 1;
    int bestLeft = left;
    int bestRight = right;
    long bestDifference = Long.MAX_VALUE;

    while (left < right) {
        long sum = (long) nums[left] + nums[right];
        long difference = Math.abs(sum - (long) target);

        if (difference < bestDifference) {
            bestDifference = difference;
            bestLeft = left;
            bestRight = right;
        }

        if (sum == target) {
            return new int[]{left, right};
        }
        if (sum < target) {
            left++;
        } else {
            right--;
        }
    }

    return new int[]{bestLeft, bestRight};
}
```

Define tie-breaking explicitly. With `<`, the first equally close pair remains.
Using `<=` selects the later pair encountered. A production API may instead prefer
the smaller sum, lexicographically smaller pair, or earlier original indices.

### Preserve Original Indices When Sorting

```java
record Element(int value, int originalIndex) {}
```

Create an `Element[]`, sort by value, run two pointers, and return the stored
original indices. This costs `O(n)` additional space.

## 7. Maximum Pair Sum Strictly Below K

```java
static long twoSumLessThanK(int[] nums, int k) {
    int[] sorted = Arrays.copyOf(nums, nums.length);
    Arrays.sort(sorted);

    int left = 0;
    int right = sorted.length - 1;
    long best = Long.MIN_VALUE;

    while (left < right) {
        long sum = (long) sorted[left] + sorted[right];
        if (sum < k) {
            best = Math.max(best, sum);
            left++;
        } else {
            right--;
        }
    }

    return best;
}
```

Do not use `-1` as a universal no-result marker if negative sums are valid. An
`OptionalLong` or documented sentinel is safer in a production API.

## 8. Pair Difference Equals K

For unique value pairs satisfying `|a - b| = k`, `k` cannot be negative. The
`k == 0` case needs a frequency of at least two.

```java
static List<IntPair> pairsWithDifference(int[] nums, int k) {
    if (k < 0) {
        return List.of();
    }

    Map<Integer, Integer> frequency = new HashMap<>();
    for (int value : nums) {
        frequency.merge(value, 1, Integer::sum);
    }

    List<IntPair> result = new ArrayList<>();
    for (Map.Entry<Integer, Integer> entry : frequency.entrySet()) {
        int value = entry.getKey();
        if (k == 0) {
            if (entry.getValue() >= 2) {
                result.add(new IntPair(value, value));
            }
        } else {
            long other = (long) value + k;
            if (other <= Integer.MAX_VALUE
                    && frequency.containsKey((int) other)) {
                result.add(new IntPair(value, (int) other));
            }
        }
    }
    return result;
}
```

## 9. Two Sum Data Structure

The operation ratio determines the design.

### Fast Add, Linear Find

```java
final class TwoSumIndex {
    private final Map<Integer, Integer> frequency = new HashMap<>();

    void add(int number) {
        frequency.merge(number, 1, Integer::sum);
    }

    boolean find(int target) {
        for (Map.Entry<Integer, Integer> entry : frequency.entrySet()) {
            int number = entry.getKey();
            long complement = (long) target - number;

            if (complement < Integer.MIN_VALUE
                    || complement > Integer.MAX_VALUE) {
                continue;
            }

            int other = (int) complement;
            if (number != other && frequency.containsKey(other)) {
                return true;
            }
            if (number == other && entry.getValue() >= 2) {
                return true;
            }
        }
        return false;
    }
}
```

If `u` is the number of unique values, `add` is expected `O(1)`, `find` is `O(u)`,
and memory is `O(u)`.

### Precomputed Pair Sums

Precomputing every new sum makes `find` expected `O(1)`, but `add` becomes `O(n)`
and pair-sum storage can grow to `O(n^2)`. This only makes sense when queries
greatly outnumber inserts and the memory bound is acceptable. It must retain
duplicates so adding a second `3` creates sum `6`.

### Concurrency Follow-up

`HashMap` is not thread-safe. A concurrent implementation needs an explicit
consistency contract. A read/write lock can protect atomic `add` and `find`, while
a `ConcurrentHashMap` alone does not make the multi-step `find` snapshot atomic.
Ask whether weakly consistent answers are permitted before choosing.

## 10. 3Sum

3Sum reduces one dimension: sort, fix `nums[i]`, then solve a sorted Two Sum for
the remaining target. Duplicate skipping is part of correctness, not decoration.

```java
static List<List<Integer>> threeSum(int[] nums) {
    int[] sorted = Arrays.copyOf(nums, nums.length);
    Arrays.sort(sorted);
    List<List<Integer>> result = new ArrayList<>();

    for (int i = 0; i < sorted.length - 2; i++) {
        if (sorted[i] > 0) {
            break;
        }
        if (i > 0 && sorted[i] == sorted[i - 1]) {
            continue;
        }

        int left = i + 1;
        int right = sorted.length - 1;

        while (left < right) {
            long sum = (long) sorted[i] + sorted[left] + sorted[right];

            if (sum == 0) {
                result.add(List.of(sorted[i], sorted[left], sorted[right]));
                int leftValue = sorted[left];
                int rightValue = sorted[right];

                while (left < right && sorted[left] == leftValue) {
                    left++;
                }
                while (left < right && sorted[right] == rightValue) {
                    right--;
                }
            } else if (sum < 0) {
                left++;
            } else {
                right--;
            }
        }
    }

    return result;
}
```

The total time is `O(n^2)` after sorting; auxiliary space depends on the sorting
and input-preservation choice, excluding output.

## 11. 3Sum Closest, 4Sum, And K-Sum

- **3Sum Closest:** fix one element and run the closest-pair algorithm on the suffix.
- **4Sum:** fix two elements and run sorted Two Sum on the remaining suffix.
- **K-Sum:** recursively fix one element until the base case is sorted Two Sum.

For K-Sum, use `long` for the remaining target, skip duplicates at each recursion
depth, and prune using the smallest and largest possible sums.

## Important Non-Variants

### Subarray Sum Equals K

This is not Two Sum over array values. It asks for a contiguous range and uses
prefix-sum frequencies:

```text
prefix[j] - prefix[i] = k
therefore prefix[i] = prefix[j] - k
```

### Pair Product Equals K

Division introduces zero, sign, and divisibility edge cases. It is less reusable
than the additive family; define zero handling before implementing it.

## Common Bugs In Candidate Solutions

- using signed rather than absolute difference for closest sum;
- using `int` for sum, complement, difference, or pair count;
- returning all pairs with only a `Set`, thereby losing multiplicity;
- failing to distinguish unique value pairs from distinct index pairs;
- sorting the input without declaring mutation;
- inserting before checking and reusing the current index;
- forgetting that equal values require two occurrences;
- skipping duplicates before recording a valid 3Sum result;
- claiming hash operations are guaranteed worst-case `O(1)`;
- returning a sentinel that is also a valid answer.

## Top Interview Questions

### Why Map Instead Of Set?

A set answers membership. A map additionally stores an index, frequency, or all
indices. Choose based on the required output rather than habit.

### Hashing Or Sorting?

Hashing gives expected `O(n)` time and preserves original indices at `O(n)` space.
Sorting costs `O(n log n)`, enables `O(1)` two-pointer state, groups duplicates,
and may mutate input or require a copy.

### How Would You Handle A Stream?

For one fixed target, maintain seen values or frequencies and report matches as
new numbers arrive. For arbitrary future targets, use the Two Sum data structure;
the insert/query trade-off depends on workload and memory.

### What If The Data Does Not Fit In Memory?

Options include external sorting plus a two-pointer-style merge process, hash
partitioning values by a target-compatible scheme, or a distributed batch job.
The exact design depends on whether one target or many targets are queried and
whether exact results are mandatory.

### How Do You Test It?

Cover no result, first/last pair, duplicate equal values, many duplicates, negative
values, zeroes, multiple valid answers, extreme integers, mutation expectations,
and deterministic tie-breaking for closest pairs.

## Revision Summary

```text
Unsorted exact pair       -> HashMap
Sorted exact pair         -> Two pointers
Count index pairs         -> Frequency map
All index pairs           -> Map<Value, List<Index>>
Unique value pairs        -> Sort + skip duplicates
Closest / less than K     -> Sort + two pointers
Repeated add/find         -> Operation-ratio data-structure trade-off
3Sum                      -> Fix one + sorted Two Sum
Subarray Sum Equals K     -> Prefix frequencies, not Two Sum
```
