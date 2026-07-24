---
title: Array Problems 1-10 - Core Patterns
description: Worked Java solutions for Two Sum, stock profit, sorted deduplication, zero compaction, Kadane, duplicate detection, rotation, merge, product except self, and majority vote.
sidebar_label: Problems 1-10
sidebar_position: 3
difficulty: Easy to Medium
page_type: Programming Guide
status: maintained
last_reviewed: "2026-07-24"
---

# Array Problems 1-10: Core Patterns

Each solution names the invariant that should drive your interview explanation.
Assume non-null input unless the method validates otherwise; clarify that contract
before coding.

## 1. Two Sum

**Pattern:** prefix lookup. **Invariant:** the map contains only earlier indices.

```java
static int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> indexByValue = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        long wanted = (long) target - nums[i];
        if (wanted >= Integer.MIN_VALUE && wanted <= Integer.MAX_VALUE) {
            Integer earlier = indexByValue.get((int) wanted);
            if (earlier != null) return new int[]{earlier, i};
        }
        indexByValue.put(nums[i], i);
    }
    return new int[]{-1, -1};
}
```

Expected `O(n)` time, `O(n)` space. See the [complete Two Sum family](./TWO-SUM-FAMILY.md).

## 2. Best Time To Buy And Sell Stock

**Pattern:** running optimum. **Invariant:** `minimum` is the lowest price before
or at the current day; `best` is the best legal buy-before-sell profit seen.

```java
static int maxProfit(int[] prices) {
    int minimum = Integer.MAX_VALUE;
    int best = 0;
    for (int price : prices) {
        minimum = Math.min(minimum, price);
        best = Math.max(best, price - minimum);
    }
    return best;
}
```

`O(n)` time and `O(1)` space. The zero result means no profitable transaction.
The unlimited-transactions variant uses a different contract and sums every
positive adjacent increase.

## 3. Remove Duplicates From Sorted Array

**Pattern:** slow/fast pointers. **Invariant:** indices `[0, write)` contain the
unique prefix in final order.

```java
static int removeDuplicates(int[] nums) {
    if (nums.length == 0) return 0;
    int write = 1;
    for (int read = 1; read < nums.length; read++) {
        if (nums[read] != nums[write - 1]) {
            nums[write++] = nums[read];
        }
    }
    return write;
}
```

`O(n)` time, `O(1)` space, input mutated. Values beyond the returned logical
length are unspecified.

## 4. Move Zeroes

**Pattern:** stable compaction. First move every non-zero into the write prefix,
then fill the remaining suffix with zeroes.

```java
static void moveZeroes(int[] nums) {
    int write = 0;
    for (int value : nums) {
        if (value != 0) nums[write++] = value;
    }
    while (write < nums.length) nums[write++] = 0;
}
```

`O(n)` time, `O(1)` space. This preserves relative order. A swapping version can
reduce writes for some inputs but still needs a clearly stated stability policy.

## 5. Maximum Subarray

**Pattern:** Kadane dynamic programming. **Invariant:** `endingHere` is the best
sum of a non-empty subarray ending at the current index.

```java
static long maximumSubarray(int[] nums) {
    if (nums.length == 0) throw new IllegalArgumentException("empty array");
    long endingHere = nums[0];
    long best = nums[0];
    for (int i = 1; i < nums.length; i++) {
        endingHere = Math.max(nums[i], endingHere + nums[i]);
        best = Math.max(best, endingHere);
    }
    return best;
}
```

Initialize from the first value, not zero, or an all-negative array is handled
incorrectly. `O(n)` time and `O(1)` space.

## 6. Contains Duplicate

**Pattern:** membership set.

```java
static boolean containsDuplicate(int[] nums) {
    Set<Integer> seen = new HashSet<>();
    for (int value : nums) {
        if (!seen.add(value)) return true;
    }
    return false;
}
```

Expected `O(n)` time, `O(n)` space. Sorting gives `O(n log n)` time and may avoid
hash storage, but mutates input unless copied.

## 7. Rotate Array Right By K

**Pattern:** three reversals. Normalize `k`, reverse the whole array, then reverse
the rotated prefix and suffix.

```java
static void rotateRight(int[] nums, int k) {
    if (nums.length == 0) return;
    k = Math.floorMod(k, nums.length);
    reverse(nums, 0, nums.length - 1);
    reverse(nums, 0, k - 1);
    reverse(nums, k, nums.length - 1);
}

static void reverse(int[] nums, int left, int right) {
    while (left < right) {
        int temporary = nums[left];
        nums[left++] = nums[right];
        nums[right--] = temporary;
    }
}
```

`Math.floorMod` gives defined behavior for negative rotation counts. `O(n)` time,
`O(1)` space, input mutated.

## 8. Merge Sorted Arrays In Place

Given `first` with capacity for both inputs, merge from the end so unread values
in `first` are not overwritten.

```java
static void merge(int[] first, int m, int[] second, int n) {
    int i = m - 1;
    int j = n - 1;
    int write = m + n - 1;

    while (j >= 0) {
        if (i >= 0 && first[i] > second[j]) {
            first[write--] = first[i--];
        } else {
            first[write--] = second[j--];
        }
    }
}
```

`O(m + n)` time, `O(1)` space. Only `second` must be exhausted; any remaining
prefix of `first` is already correctly placed.

## 9. Product Of Array Except Self

**Pattern:** prefix and suffix products. The result first stores the product to
the left, then multiplies by a running product from the right.

```java
static long[] productExceptSelf(int[] nums) {
    long[] result = new long[nums.length];
    long prefix = 1;
    for (int i = 0; i < nums.length; i++) {
        result[i] = prefix;
        prefix *= nums[i];
    }

    long suffix = 1;
    for (int i = nums.length - 1; i >= 0; i--) {
        result[i] *= suffix;
        suffix *= nums[i];
    }
    return result;
}
```

`O(n)` time and `O(1)` auxiliary space excluding output. It naturally handles
zeroes, unlike division. Even `long` can overflow unless constraints bound products.

## 10. Majority Element

**Pattern:** Boyer-Moore cancellation. Different values cancel; if a strict
majority exists, it survives as the candidate.

```java
static int majorityElement(int[] nums) {
    int candidate = 0;
    int votes = 0;
    for (int value : nums) {
        if (votes == 0) candidate = value;
        votes += value == candidate ? 1 : -1;
    }
    return candidate;
}
```

`O(n)` time, `O(1)` space. If the problem does not guarantee a majority, make a
second pass to verify the candidate occurs more than `n / 2` times.

## Review Questions

- Why does merging from the front corrupt unread input?
- Why is Kadane initialized from `nums[0]`?
- What does Boyer-Moore return when no majority exists?
- Which solutions mutate input and how would you preserve it?
- Which arithmetic needs `long`, and can even `long` overflow?
