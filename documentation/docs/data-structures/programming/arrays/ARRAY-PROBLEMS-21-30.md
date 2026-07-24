---
title: Array Problems 21-30 - Search, Prefix State, Stacks, And Intervals
description: Worked Java solutions for matrix rotation and zeroing, rotated search, peaks, prefix-frequency counting, circular Kadane, rain water, next greater values, and intervals.
sidebar_label: Problems 21-30
sidebar_position: 5
difficulty: Medium
page_type: Programming Guide
status: maintained
last_reviewed: "2026-07-24"
---

# Array Problems 21-30: Search, Prefix State, Stacks, And Intervals

## 21. Rotate Image 90 Degrees Clockwise

For a square matrix, transpose across the main diagonal, then reverse each row.

```java
static void rotateClockwise(int[][] matrix) {
    int n = matrix.length;
    for (int row = 0; row < n; row++) {
        if (matrix[row].length != n)
            throw new IllegalArgumentException("matrix must be square");
        for (int column = row + 1; column < n; column++) {
            int temporary = matrix[row][column];
            matrix[row][column] = matrix[column][row];
            matrix[column][row] = temporary;
        }
    }

    for (int[] row : matrix) {
        for (int left = 0, right = n - 1; left < right; left++, right--) {
            int temporary = row[left];
            row[left] = row[right];
            row[right] = temporary;
        }
    }
}
```

`O(n^2)` time, `O(1)` space, input mutated. Rectangular matrices require a new
matrix because their dimensions change.

## 22. Set Matrix Zeroes

Use the first row and column as marker storage, with separate flags for their
original zero state.

```java
static void setZeroes(int[][] matrix) {
    int rows = matrix.length;
    int columns = matrix[0].length;
    boolean zeroFirstRow = false;
    boolean zeroFirstColumn = false;

    for (int column = 0; column < columns; column++)
        if (matrix[0][column] == 0) zeroFirstRow = true;
    for (int row = 0; row < rows; row++)
        if (matrix[row][0] == 0) zeroFirstColumn = true;

    for (int row = 1; row < rows; row++) {
        for (int column = 1; column < columns; column++) {
            if (matrix[row][column] == 0) {
                matrix[row][0] = 0;
                matrix[0][column] = 0;
            }
        }
    }

    for (int row = 1; row < rows; row++) {
        for (int column = 1; column < columns; column++) {
            if (matrix[row][0] == 0 || matrix[0][column] == 0)
                matrix[row][column] = 0;
        }
    }

    if (zeroFirstRow) Arrays.fill(matrix[0], 0);
    if (zeroFirstColumn)
        for (int row = 0; row < rows; row++) matrix[row][0] = 0;
}
```

`O(rows * columns)` time, `O(1)` auxiliary space.

## 23. Search In Rotated Sorted Array

At least one half around `middle` is sorted. Determine which half is sorted, then
test whether the target lies inside its value range.

```java
static int searchRotated(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left <= right) {
        int middle = left + (right - left) / 2;
        if (nums[middle] == target) return middle;

        if (nums[left] <= nums[middle]) {
            if (nums[left] <= target && target < nums[middle]) right = middle - 1;
            else left = middle + 1;
        } else {
            if (nums[middle] < target && target <= nums[right]) left = middle + 1;
            else right = middle - 1;
        }
    }
    return -1;
}
```

`O(log n)` time for distinct values. Duplicates can make the sorted half ambiguous
and degrade the duplicate-aware variant to `O(n)`.

## 24. Find Peak Element

Compare `middle` with its right neighbor. An upward slope guarantees a peak to the
right; otherwise a peak exists at or left of `middle`.

```java
static int findPeak(int[] nums) {
    int left = 0, right = nums.length - 1;
    while (left < right) {
        int middle = left + (right - left) / 2;
        if (nums[middle] < nums[middle + 1]) left = middle + 1;
        else right = middle;
    }
    return left;
}
```

`O(log n)` time, `O(1)` space. This returns one peak, not necessarily the global maximum.

## 25. Subarray Sum Equals K

If the current prefix is `p`, each earlier prefix `p - k` defines a subarray ending
now with sum `k`. Seed prefix zero once to count subarrays starting at index zero.

```java
static long countSubarraysWithSum(int[] nums, long k) {
    Map<Long, Integer> prefixFrequency = new HashMap<>();
    prefixFrequency.put(0L, 1);
    long prefix = 0;
    long count = 0;

    for (int value : nums) {
        prefix += value;
        count += prefixFrequency.getOrDefault(prefix - k, 0);
        prefixFrequency.merge(prefix, 1, Integer::sum);
    }
    return count;
}
```

Expected `O(n)` time, `O(n)` space. A normal sliding window is incorrect when
negative values are allowed because growing the window is not monotonic.

## 26. Maximum Sum Circular Subarray

The best circular subarray is either the ordinary maximum or total sum minus the
minimum non-circular subarray. If every value is negative, the latter would select
an empty subarray and must not be used.

```java
static long maximumCircularSubarray(int[] nums) {
    long total = nums[0];
    long maxEnding = nums[0], maxSum = nums[0];
    long minEnding = nums[0], minSum = nums[0];

    for (int i = 1; i < nums.length; i++) {
        long value = nums[i];
        maxEnding = Math.max(value, maxEnding + value);
        maxSum = Math.max(maxSum, maxEnding);
        minEnding = Math.min(value, minEnding + value);
        minSum = Math.min(minSum, minEnding);
        total += value;
    }
    return maxSum < 0 ? maxSum : Math.max(maxSum, total - minSum);
}
```

`O(n)` time, `O(1)` space.

## 27. Trapping Rain Water

Whichever side has the smaller maximum is currently bounded by the other side.
Advance it and accumulate the difference from its running maximum.

```java
static long trappedWater(int[] height) {
    int left = 0, right = height.length - 1;
    int leftMaximum = 0, rightMaximum = 0;
    long water = 0;

    while (left < right) {
        if (height[left] <= height[right]) {
            leftMaximum = Math.max(leftMaximum, height[left]);
            water += leftMaximum - height[left];
            left++;
        } else {
            rightMaximum = Math.max(rightMaximum, height[right]);
            water += rightMaximum - height[right];
            right--;
        }
    }
    return water;
}
```

`O(n)` time, `O(1)` space. Be able to contrast this with prefix maxima and a
monotonic stack.

## 28. Next Greater Element I

Process the reference array once. The decreasing stack holds values whose next
greater value is unresolved.

```java
static int[] nextGreater(int[] query, int[] reference) {
    Map<Integer, Integer> nextByValue = new HashMap<>();
    Deque<Integer> decreasing = new ArrayDeque<>();

    for (int value : reference) {
        while (!decreasing.isEmpty() && decreasing.peek() < value)
            nextByValue.put(decreasing.pop(), value);
        decreasing.push(value);
    }

    int[] result = new int[query.length];
    for (int i = 0; i < query.length; i++)
        result[i] = nextByValue.getOrDefault(query[i], -1);
    return result;
}
```

`O(m + n)` time and `O(n)` space. This value-map formulation assumes distinct
values in the reference input; index-based variants support duplicates.

## 29. Merge Intervals

Sort by start, then merge into the last emitted interval whenever boundaries
overlap. Define whether touching intervals count as overlapping.

```java
static int[][] mergeIntervals(int[][] intervals) {
    if (intervals.length == 0) return new int[0][];
    Arrays.sort(intervals, Comparator.comparingInt(interval -> interval[0]));
    List<int[]> merged = new ArrayList<>();
    merged.add(Arrays.copyOf(intervals[0], 2));

    for (int i = 1; i < intervals.length; i++) {
        int[] last = merged.get(merged.size() - 1);
        if (intervals[i][0] <= last[1]) {
            last[1] = Math.max(last[1], intervals[i][1]);
        } else {
            merged.add(Arrays.copyOf(intervals[i], 2));
        }
    }
    return merged.toArray(int[][]::new);
}
```

`O(n log n)` time, `O(n)` output space. Sorting mutates outer-array order.

## 30. Insert Interval

Because existing intervals are sorted and non-overlapping, copy intervals before
the new range, merge overlaps, then copy intervals after it.

```java
static int[][] insertInterval(int[][] intervals, int[] incoming) {
    List<int[]> result = new ArrayList<>();
    int index = 0;

    while (index < intervals.length && intervals[index][1] < incoming[0])
        result.add(Arrays.copyOf(intervals[index++], 2));

    int start = incoming[0], end = incoming[1];
    while (index < intervals.length && intervals[index][0] <= end) {
        start = Math.min(start, intervals[index][0]);
        end = Math.max(end, intervals[index][1]);
        index++;
    }
    result.add(new int[]{start, end});

    while (index < intervals.length)
        result.add(Arrays.copyOf(intervals[index++], 2));

    return result.toArray(int[][]::new);
}
```

`O(n)` time and `O(n)` output space.

## Review Questions

- Why do rotated-search duplicates weaken the logarithmic guarantee?
- Why is prefix zero seeded with frequency one?
- Why does circular Kadane need the all-negative guard?
- State the monotonic-stack invariant for Next Greater Element.
- Do touching intervals overlap in your contract?
- Which matrix and interval methods mutate caller-owned arrays?
