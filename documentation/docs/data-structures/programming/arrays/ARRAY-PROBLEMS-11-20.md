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

<ExpandableAnswer title="How Missing Number works">

- Start with `nums.length`, the one domain value that is not also an array index.
- For each position, XOR both its index and stored value into `missing`.
- Every present value in `0..n` cancels with its equal index because `x ^ x = 0`;
  order does not matter because XOR is associative and commutative.
- Only the value without a matching occurrence remains. The scan is `O(n)` time
  and `O(1)` space with no sum overflow.

</ExpandableAnswer>

**Complexity:** `O(n)` time and `O(1)` space. Values must be distinct and in `0..n`.

<ExpandableAnswer title="Dry run: [3, 0, 1]">

- Start with `missing = 3` and XOR the index/value pairs `(0,3)`, `(1,0)`, and `(2,1)`.
- Present values cancel equal domain indices because `x ^ x = 0`.
- The accumulator finishes as `2`, the only uncancelled number.

</ExpandableAnswer>

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

<ExpandableAnswer title="How index marking finds all missing values">

- Every legal value `v` maps to zero-based index `abs(v)-1`.
- Negating that position records that `v` appeared; `abs` is necessary because
  an earlier value may already have marked the current slot.
- The second pass finds positive positions—those indices were never marked—so
  `i+1` is missing.
- The array supplies the marker storage, giving `O(1)` auxiliary space at the
  cost of mutation. Both passes together are `O(n)`.

</ExpandableAnswer>

**Complexity:** `O(n)` time and `O(1)` auxiliary space; input is mutated.

<ExpandableAnswer title="Dry run: [4, 3, 2, 7, 8, 2, 3, 1]">

- Mark the positions represented by values `4, 3, 2, 7, 8, 2, 3, 1`.
- Repeated `2` and `3` find their positions already negative.
- Only zero-based indices `4` and `5` remain positive, so return `[5, 6]`.

</ExpandableAnswer>

## 13. Find The Duplicate Number

### Contract And Sample

The standard contract is:

- array length is `n + 1`;
- every value is in `1..n`;
- one value is duplicated;
- the input should not be modified unless the chosen method explicitly allows it.

```text
Input:  [1, 2, 3, 2]
Output: 2
Reason: 2 is the only value that appears twice
```

### Correct Classification

| Method | `O(1)` space | Does not modify input | General for the standard contract | Time |
|---|:---:|:---:|:---:|---:|
| Floyd's cycle algorithm | ✅ | ✅ | ✅ | `O(n)` |
| sum formula | ✅ | ✅ | ❌ only when the duplicate appears exactly twice and every other value once | `O(n)` |
| negative marking | ✅ | ❌ | ✅ for a suitable `1..n` value range | `O(n)` |
| value-range binary search | ✅ | ✅ | ✅ | `O(n log n)` |
| brute force | ✅ | ✅ | ✅ | `O(n²)` |

<DocCallout type="tip" title="The contract selects the algorithm">

For `[1,2,3,2]`, all five methods return `2`. They are not interchangeable for
broader inputs. The sum formula depends on exactly one extra occurrence, while
Floyd and value-range binary search depend on the standard `n+1` values in
`1..n` contract.

</DocCallout>

### Method 1: Floyd's Cycle Algorithm

Treat each value as the next index: `next(i) = nums[i]`. Because `n+1` positions
point into only `n` value-indices, the functional graph contains a cycle. The
cycle entry is the duplicated value.

```java
static int findDuplicateFloyd(int[] nums) {
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

<ExpandableAnswer title="How the Floyd code works">

1. `slow` and `fast` start at the first reachable value, `nums[0]`.
2. In phase one, `slow = nums[slow]` follows one edge while
   `fast = nums[nums[fast]]` follows two. A finite graph with a cycle guarantees
   they eventually meet inside the cycle.
3. Reset only `slow` to the path's start. Keep `fast` at the meeting point.
4. Move both one edge per iteration. Floyd's distance relationship guarantees
   their next meeting is the cycle entry.
5. Return that entry value. Two different positions point into this entry, which
   is exactly why the value is duplicated.

The array is acting as read-only next-pointer storage; the method never changes
an element.

</ExpandableAnswer>

**Complexity:** `O(n)` time and `O(1)` space; no mutation. It supports more than two occurrences.

<ExpandableAnswer title="Floyd dry run: [1, 2, 3, 2]">

The index path is `0 → 1 → 2 → 3 → 2 → 3...`; indices `2` and `3` form the
cycle. The first phase makes slow and fast meet inside that cycle. Resetting one
pointer to `nums[0]` and moving both one step at a time makes them meet at value
`2`, the cycle entry and duplicate.

</ExpandableAnswer>

### Method 2: Sum Formula

If the array is exactly the numbers `1..n` plus one additional copy of the
duplicate, subtract the expected sum from the actual sum.

```java
static int findDuplicateBySum(int[] nums) {
    int n = nums.length - 1;
    long expected = (long) n * (n + 1) / 2;
    long actual = 0;
    for (int value : nums) {
        actual += value;
    }
    return Math.toIntExact(actual - expected);
}
```

<ExpandableAnswer title="How the sum-formula code works">

1. `n = nums.length - 1` because the valid domain contains the `n` values
   `1..n`, while the array contains one extra position.
2. `n * (n + 1) / 2` calculates the sum that one copy of every legal value would
   produce.
3. The loop calculates the actual array sum, including the extra occurrence.
4. `actual - expected` removes one copy of every expected value, leaving only
   the additional duplicate value.
5. All arithmetic uses `long`; `Math.toIntExact` makes an unexpected out-of-range
   result fail explicitly instead of silently narrowing.

The proof breaks if a required value is missing or the duplicate contributes
more than one extra occurrence.

</ExpandableAnswer>

<DocCallout type="mistake" title="Why the sum formula is not general">

For `[1,2,2,2]`, `actual - expected = 7 - 6 = 1`, not `2`. The method measures
the sum of all extra occurrences; it identifies the duplicate only when there
is exactly one extra copy and every required value appears once.

</DocCallout>

<ExpandableAnswer title="Sum-formula dry run: [1, 2, 3, 2]">

- `n = 3`, so the expected sum is `3 * 4 / 2 = 6`.
- The actual sum is `1 + 2 + 3 + 2 = 8`.
- Return `8 - 6 = 2`.

</ExpandableAnswer>

### Method 3: Negative Marking

Use value `v` as index `v-1`. A negative value at that index means the value was
seen earlier.

```java
static int findDuplicateByMarking(int[] nums) {
    for (int value : nums) {
        int normalized = Math.abs(value);
        int index = normalized - 1;
        if (nums[index] < 0) {
            return normalized;
        }
        nums[index] = -nums[index];
    }
    return -1;
}
```

<ExpandableAnswer title="How the negative-marking code works">

1. Read each current value and call `Math.abs` because an earlier iteration may
   already have negated this array position.
2. Convert legal value `v` into zero-based index `v - 1`.
3. A positive value at that index means `v` has not been seen, so negate it as a
   presence marker.
4. A negative value means another occurrence already marked that index; return
   the normalized value as the duplicate.
5. Returning `-1` means the supplied data violated the promised duplicate
   contract.

The array itself replaces a separate `boolean[]`. That is why space is `O(1)`
and also why input mutation is unavoidable for this version.

</ExpandableAnswer>

**Complexity:** `O(n)` time and `O(1)` space. It mutates input and requires values in `1..n`.

<ExpandableAnswer title="Negative-marking dry run: [1, 2, 3, 2]">

- Value `1` marks index `0`: `[-1,2,3,2]`.
- Value `2` marks index `1`: `[-1,-2,3,2]`.
- Value `3` marks index `2`: `[-1,-2,-3,2]`.
- The final value `2` points to index `1`, which is already negative; return `2`.

</ExpandableAnswer>

### Method 4: Value-Range Binary Search

Binary-search the **value range**, not array indices. For midpoint `m`, count
values `<= m`. If that count is greater than `m`, the pigeonhole principle
places the duplicate in `1..m`; otherwise it lies in `m+1..n`.

```java
static int findDuplicateByValueRange(int[] nums) {
    int low = 1;
    int high = nums.length - 1;

    while (low < high) {
        int middle = low + (high - low) / 2;
        int count = 0;
        for (int value : nums) {
            if (value <= middle) count++;
        }

        if (count > middle) {
            high = middle;
        } else {
            low = middle + 1;
        }
    }
    return low;
}
```

<ExpandableAnswer title="How the value-range binary-search code works">

1. `low` and `high` describe possible duplicate **values**, not array positions.
2. Choose the midpoint without overflow using
   `low + (high - low) / 2`.
3. Scan the entire array and count values in the lower value range `1..middle`.
4. That range contains only `middle` distinct legal values. If the count is
   greater than `middle`, pigeonhole pressure proves the duplicate is in the
   lower half, so set `high = middle`.
5. Otherwise the duplicate must be above the midpoint, so set
   `low = middle + 1`.
6. When `low == high`, only one candidate value remains; return it.

The outer range halves `O(log n)` times, but each decision rescans `n` elements,
giving `O(n log n)` time.

</ExpandableAnswer>

**Complexity:** `O(n log n)` time and `O(1)` space; no mutation.

<ExpandableAnswer title="Value-range dry run: [1, 2, 3, 2]">

- Search values `1..3`; midpoint is `2`.
- Three values are `<=2` (`1,2,2`), which is greater than two available values,
  so search `1..2`.
- Midpoint is `1`; one value is `<=1`, so search `2..2`.
- Return `2`.

</ExpandableAnswer>

### Method 5: Brute Force

Compare every pair of positions. This needs no value-range assumption, extra
storage, or input modification.

```java
static int findDuplicateBruteForce(int[] nums) {
    for (int left = 0; left < nums.length - 1; left++) {
        for (int right = left + 1; right < nums.length; right++) {
            if (nums[left] == nums[right]) {
                return nums[left];
            }
        }
    }
    return -1;
}
```

<ExpandableAnswer title="How the brute-force code works">

1. `left` selects every position except the last, which has no later partner.
2. `right` starts at `left + 1`, ensuring two distinct indices and preventing
   the same unordered pair from being checked twice.
3. Compare the two values directly. Equality proves a duplicate and returns it
   immediately.
4. If every pair has been checked without equality, return `-1`.

For `n` elements, the loops inspect at most
`(n - 1) + (n - 2) + ... + 1 = n(n - 1)/2` pairs, which is `O(n²)`.

</ExpandableAnswer>

`O(n²)` time and `O(1)` space. It is a valid baseline and works beyond the
`1..n` domain, but it is not the preferred scalable solution.

<ExpandableAnswer title="Brute-force dry run: [1, 2, 3, 2]">

- Compare index `0` with every later index; no value equals `1`.
- Compare indices `1` and `2`: `2 != 3`.
- Compare indices `1` and `3`: `2 == 2`, so return `2`.

</ExpandableAnswer>

### Which Method Should You Choose?

| Requirement | Choose |
|---|---|
| standard interview contract, best overall | Floyd |
| duplicate appears exactly twice, all `1..n` values otherwise present | sum formula |
| mutation allowed and values safely map to indices | negative marking |
| no mutation and counting/pigeonhole explanation preferred | value-range binary search |
| tiny input or unrestricted values with strict `O(1)` space | brute force |

Test `[1,2,3,2]`, duplicate at the beginning/end, the smallest/largest duplicate,
a duplicate occurring more than twice, and malformed values outside `1..n`.

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

<ExpandableAnswer title="How array intersection works">

- Insert every value from `first` into `values` to create an expected-constant
  time membership index.
- Scan `second`; values found in the index belong to the intersection.
- Add matches to a second set so each result appears once even when either input
  contains duplicates.
- Expected time is `O(m+n)` and space is `O(m + result)`.

</ExpandableAnswer>

For multiset intersection, store and decrement frequencies instead.

<ExpandableAnswer title="Dry run: [1, 2, 2, 1] and [2, 2]">

- Build `{1, 2}` from the first array.
- Both `2`s in the second array match, but the result set stores `2` once.
- Return the unique intersection `{2}`.

</ExpandableAnswer>

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

<ExpandableAnswer title="How Dutch National Flag partitioning works">

- `low` ends the zero region, `scan` begins the unknown region, and `high` begins
  the two region.
- A zero swaps into the low region; both `low` and `scan` advance because the
  incoming value came from the already-classified one region.
- A one is already in the middle region, so only `scan` advances.
- A two swaps with `high`; only `high` moves because the incoming right-side
  value is still unknown and must be inspected. Each value is classified once.

</ExpandableAnswer>

Do not advance `scan` after a high-side swap; the incoming value is unclassified.

<ExpandableAnswer title="Dry run: [2, 0, 2, 1, 1, 0]">

- Move the leading `2` to the high side and inspect the incoming `0` again.
- Move zeroes into the low region; ones advance `scan`; twos accumulate beyond `high`.
- The regions meet with `[0, 0, 1, 1, 2, 2]`.

</ExpandableAnswer>

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

<ExpandableAnswer title="How Longest Consecutive Sequence works">

- Put values in a set to remove duplicates and support expected-constant
  membership checks.
- Start expansion only when `value - 1` is absent; this proves `value` is the
  first number of its sequence.
- Walk upward while consecutive successors exist and update the longest length.
- No sequence is rescanned from its middle, so each unique value participates in
  at most one expansion: expected `O(n)` time and `O(n)` space.

</ExpandableAnswer>

The integer-boundary guards prevent wraparound.

<ExpandableAnswer title="Dry run: [100, 4, 200, 1, 3, 2]">

- `100` and `200` each start sequences of length `1`.
- Skip `4`, `3`, and `2` as starts because each has a predecessor.
- `1` expands through `2`, `3`, and `4`, so return the best length `4`.

</ExpandableAnswer>

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

<ExpandableAnswer title="How Maximum Product Subarray works">

- Track both maximum and minimum products ending at the previous index.
- Multiplying by a negative value can turn the smallest negative product into
  the new largest positive product, so evaluate `value`, `max*value`, and
  `min*value` together.
- Store the largest as `maximumEnding`, the smallest as `minimumEnding`, and
  update the global best.
- Zero naturally starts a new candidate. One pass gives `O(n)` time and
  `O(1)` space.

</ExpandableAnswer>

Products may overflow even `long` under unbounded input.

<ExpandableAnswer title="Dry run: [2, 3, -2, 4]">

- Start with maximum/minimum ending products `2`; after `3`, the maximum is `6`.
- At `-2`, the maximum ending product becomes `-2` and the minimum becomes `-12`.
- At `4`, the maximum ending product is `4`; global `best` remains `6` from `[2, 3]`.

</ExpandableAnswer>

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

<ExpandableAnswer title="How Container With Most Water works">

- The current area is width times the shorter boundary; the shorter wall is the
  height bottleneck.
- Moving the taller wall inward reduces width without removing that bottleneck,
  so it cannot create a better area with the unchanged shorter wall.
- Move the shorter side, which is the only move that can expose a taller limiting
  wall, and record the best area.
- Each pointer moves inward at most `n` times: `O(n)` time and `O(1)` space.

</ExpandableAnswer>

<ExpandableAnswer title="Dry run: [1, 8, 6, 2, 5, 4, 8, 3, 7]">

- The outer walls produce area `8`; move the shorter left wall.
- Indices `1` and `8` produce width `7` times height `7`, so `best = 49`.
- Later narrower containers never exceed `49`; return `49`.

</ExpandableAnswer>

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

<ExpandableAnswer title="How 3Sum works">

- Sorting makes pointer movement monotonic and places duplicates together.
- Fix `nums[i]`, then search its suffix with left/right pointers for the
  complementary pair that makes zero.
- A small sum advances `left`; a large sum retreats `right`.
- After emitting a triple, skip equal pointer values, and skip equal fixed values
  in the outer loop, so results are unique. The nested scan is `O(n²)`.

</ExpandableAnswer>

This version mutates input by sorting it.

<ExpandableAnswer title="Dry run: [-1, 0, 1, 2, -1, -4]">

- Sort to `[-4, -1, -1, 0, 1, 2]`.
- With fixed value `-1`, find `[-1, -1, 2]` and `[-1, 0, 1]`.
- Skip repeated fixed and pointer values, so no triple is emitted twice.

</ExpandableAnswer>

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

<ExpandableAnswer title="How Spiral Matrix traversal works">

- `top`, `bottom`, `left`, and `right` bound the unvisited rectangle.
- Traverse its top edge and right edge, then shrink those boundaries.
- If rows remain, traverse the bottom edge backward; if columns remain, traverse
  the left edge upward. The guards prevent duplicating a lone row or column.
- Every matrix cell is appended once: `O(rows × columns)` time and `O(1)`
  auxiliary state excluding output.

</ExpandableAnswer>

```java
static void swap(int[] nums, int first, int second) {
    int temporary = nums[first];
    nums[first] = nums[second];
    nums[second] = temporary;
}
```

<ExpandableAnswer title="Dry run: [[1,2,3],[4,5,6],[7,8,9]]">

1. Read the top `1, 2, 3`, then the right side `6, 9`.
2. Read the bottom backward `8, 7`, then the left side upward `4`.
3. Read the remaining center cell `5`.

Result: `[1, 2, 3, 6, 9, 8, 7, 4, 5]`.

</ExpandableAnswer>

## Review Questions

- Which value-domain assumptions make index marking and Floyd possible?
- Why is Maximum Product not ordinary Kadane?
- Prove the shorter-wall movement in Container With Most Water.
- Why must the high-side swap in Sort Colors be inspected again?
- Which methods mutate their inputs?
