---
title: Array Problems 11-20 - Marking, DP, Two Pointers, And Matrices
description: Worked Java solutions for missing values, duplicates, intersections, Dutch flag partitioning, consecutive sequences, product DP, water, 3Sum, and spiral traversal.
sidebar_label: Problems 11-20
sidebar_position: 4
difficulty: Easy to Medium
page_type: Programming Guide
status: maintained
last_reviewed: "2026-07-24"
---

# Array Problems 11-20: Marking, DP, Two Pointers, And Matrices

## 11. Missing Number

XOR cancels paired values and avoids arithmetic-sum overflow.

```java
static int missingNumber(int[] nums) {
    int missing = nums.length;
    for (int i = 0; i < nums.length; i++) {
        missing ^= i ^ nums[i];
    }
    return missing;
}
```

`O(n)` time, `O(1)` space. Contract: values are distinct and drawn from `0..n`.

## 12. Find All Missing Numbers From 1 To N

Use each absolute value as an index and mark presence by negating that position.

```java
static List<Integer> findMissing(int[] nums) {
    for (int value : nums) {
        int index = Math.abs(value) - 1;
        if (nums[index] > 0) nums[index] = -nums[index];
    }

    List<Integer> result = new ArrayList<>();
    for (int i = 0; i < nums.length; i++) {
        if (nums[i] > 0) result.add(i + 1);
    }
    return result;
}
```

`O(n)` time, `O(1)` auxiliary space excluding output, but input is mutated. The
value-domain constraint `1..n` is what makes index marking possible.

## 13. Find The Duplicate Number

Treat `i -> nums[i]` as a linked structure. A repeated value creates a cycle;
Floyd's algorithm finds its entry without modifying the array.

```java
static int findDuplicate(int[] nums) {
    int slow = nums[0];
    int fast = nums[0];
    do {
        slow = nums[slow];
        fast = nums[nums[fast]];
    } while (slow != fast);

    slow = nums[0];
    while (slow != fast) {
        slow = nums[slow];
        fast = nums[fast];
    }
    return slow;
}
```

`O(n)` time, `O(1)` space. Contract: length `n + 1`, values in `1..n`, at least
one duplicate. Explain the value-as-next-index mapping before naming Floyd.

## 14. Intersection Of Two Arrays

For a unique intersection, use membership sets.

```java
static Set<Integer> intersection(int[] first, int[] second) {
    Set<Integer> values = new HashSet<>();
    for (int value : first) values.add(value);

    Set<Integer> result = new HashSet<>();
    for (int value : second) {
        if (values.contains(value)) result.add(value);
    }
    return result;
}
```

Expected `O(m + n)` time and `O(m + result)` space. For multiset intersection,
store frequencies and decrement them when matched.

## 15. Sort Colors

Dutch National Flag invariant:

```text
[0, low) = zeroes
[low, scan) = ones
[scan, high] = unknown
(high, n) = twos
```

```java
static void sortColors(int[] nums) {
    int low = 0;
    int scan = 0;
    int high = nums.length - 1;

    while (scan <= high) {
        if (nums[scan] == 0) {
            swap(nums, low++, scan++);
        } else if (nums[scan] == 2) {
            swap(nums, scan, high--);
        } else {
            scan++;
        }
    }
}
```

Do not increment `scan` after swapping from `high`; the incoming value is still
unclassified. `O(n)` time, `O(1)` space.

## 16. Longest Consecutive Sequence

Only expand a value when its predecessor is absent, so each sequence is traversed
once rather than starting from every member.

```java
static int longestConsecutive(int[] nums) {
    Set<Integer> values = new HashSet<>();
    for (int value : nums) values.add(value);

    int best = 0;
    for (int value : values) {
        if (value != Integer.MIN_VALUE && values.contains(value - 1)) continue;

        int length = 1;
        int current = value;
        while (current != Integer.MAX_VALUE && values.contains(current + 1)) {
            current++;
            length++;
        }
        best = Math.max(best, length);
    }
    return best;
}
```

Expected `O(n)` time and `O(n)` space. The integer-boundary guards prevent wraparound.

## 17. Maximum Product Subarray

A negative value swaps the role of the largest and smallest ending products, so
both must be tracked.

```java
static long maximumProduct(int[] nums) {
    if (nums.length == 0) throw new IllegalArgumentException("empty array");
    long maximumEnding = nums[0];
    long minimumEnding = nums[0];
    long best = nums[0];

    for (int i = 1; i < nums.length; i++) {
        long value = nums[i];
        long fromMaximum = maximumEnding * value;
        long fromMinimum = minimumEnding * value;
        maximumEnding = Math.max(value, Math.max(fromMaximum, fromMinimum));
        minimumEnding = Math.min(value, Math.min(fromMaximum, fromMinimum));
        best = Math.max(best, maximumEnding);
    }
    return best;
}
```

`O(n)` time, `O(1)` space. Products may overflow even `long` under unbounded input.

## 18. Container With Most Water

Area is limited by the shorter wall. Moving the taller wall inward reduces width
without removing the current height bottleneck, so it cannot improve the area.

```java
static long maxContainerArea(int[] height) {
    int left = 0;
    int right = height.length - 1;
    long best = 0;

    while (left < right) {
        long area = (long) (right - left) * Math.min(height[left], height[right]);
        best = Math.max(best, area);
        if (height[left] <= height[right]) left++;
        else right--;
    }
    return best;
}
```

`O(n)` time, `O(1)` space.

## 19. 3Sum

Sort, fix one value, and use Two Sum pointers on the suffix. Skip duplicates at
both levels.

```java
static List<List<Integer>> threeSum(int[] nums) {
    Arrays.sort(nums);
    List<List<Integer>> result = new ArrayList<>();

    for (int i = 0; i < nums.length - 2; i++) {
        if (nums[i] > 0) break;
        if (i > 0 && nums[i] == nums[i - 1]) continue;

        int left = i + 1;
        int right = nums.length - 1;
        while (left < right) {
            long sum = (long) nums[i] + nums[left] + nums[right];
            if (sum == 0) {
                result.add(List.of(nums[i], nums[left], nums[right]));
                int a = nums[left], b = nums[right];
                while (left < right && nums[left] == a) left++;
                while (left < right && nums[right] == b) right--;
            } else if (sum < 0) left++;
            else right--;
        }
    }
    return result;
}
```

`O(n^2)` time. This version mutates input by sorting it.

## 20. Spiral Matrix

Maintain four inclusive boundaries. Guard the bottom and left traversals because
a remaining region may contain only one row or one column.

```java
static List<Integer> spiralOrder(int[][] matrix) {
    List<Integer> result = new ArrayList<>();
    if (matrix.length == 0 || matrix[0].length == 0) return result;

    int top = 0, bottom = matrix.length - 1;
    int left = 0, right = matrix[0].length - 1;

    while (top <= bottom && left <= right) {
        for (int column = left; column <= right; column++)
            result.add(matrix[top][column]);
        top++;

        for (int row = top; row <= bottom; row++)
            result.add(matrix[row][right]);
        right--;

        if (top <= bottom) {
            for (int column = right; column >= left; column--)
                result.add(matrix[bottom][column]);
            bottom--;
        }
        if (left <= right) {
            for (int row = bottom; row >= top; row--)
                result.add(matrix[row][left]);
            left++;
        }
    }
    return result;
}
```

`O(rows * columns)` time and `O(1)` auxiliary space excluding output.

```java
static void swap(int[] nums, int first, int second) {
    int temporary = nums[first];
    nums[first] = nums[second];
    nums[second] = temporary;
}
```

## Review Questions

- Which value-domain assumptions make index marking and Floyd possible?
- Why is Maximum Product not ordinary Kadane?
- Prove the shorter-wall movement in Container With Most Water.
- Why must the high-side swap in Sort Colors be inspected again?
- Which methods mutate their inputs?
