---
title: Array Interview Revision And Production Questions
description: Compact Java array revision sheet with pattern triggers, invariants, common bugs, senior follow-ups, and model interview answers.
sidebar_label: Revision And Interview Questions
sidebar_position: 7
difficulty: Intermediate to Advanced
page_type: Revision Sheet
status: maintained
last_reviewed: "2026-07-24"
---

# Array Interview Revision And Production Questions

## Sixty-Second Pattern Recall

```text
Unsorted complement       -> Map/Set
Sorted pair               -> Opposite pointers
Stable in-place removal   -> Read/write pointers
Contiguous range count    -> Prefix frequency
Best contiguous value     -> Kadane-style DP
Values in 1..n            -> Index marking/cyclic mapping
Rotated monotonic data    -> Modified binary search
Next greater/smaller      -> Monotonic stack
Overlapping intervals     -> Sort and sweep
Matrix layers             -> Explicit boundaries
```

## Invariants Worth Memorizing

Memorize the idea, not the code:

- **Two Sum map:** only earlier indices are stored.
- **Compaction:** `[0, write)` is already final.
- **Sorted pair:** pointer movement discards a region that cannot contain a solution.
- **Kadane:** state is the best non-empty subarray ending here.
- **Prefix frequency:** the map counts prefixes seen before the current position.
- **Dutch flag:** low, middle, unknown, and high regions are explicitly classified.
- **Binary search:** the answer remains inside the candidate interval.
- **Monotonic stack:** stack entries are unresolved and ordered monotonically.
- **Interval merge:** output before the last interval is final and non-overlapping.

## Common Java Bugs

| Bug | Correction |
|---|---|
| `int sum = a + b` | cast before addition: `(long) a + b` |
| `Math.abs(sum - target)` in `int` | compute both operands as `long` |
| returning `{0, 0}` when no pair exists | define a clear failure contract |
| sorting caller input silently | copy or document mutation |
| `List<int[]>` used for value equality | use a record or custom comparator |
| zero initialization for all-negative maximum | initialize from the first element |
| map stores one index when all pairs are required | store index lists or frequencies |
| ordinary window used with negative numbers | use prefix frequencies when monotonicity is absent |
| incrementing scan after high-side Dutch-flag swap | inspect the incoming unknown value |
| claiming `HashMap` is guaranteed `O(1)` | say expected/amortized `O(1)` |

## Top Interview Questions And Model Answers

### Why Start With Brute Force?

It establishes correctness and exposes repeated work. Optimization then has a
reason: a map removes repeated prefix search, prefix state removes repeated range
aggregation, and monotonic structure removes candidates that can never win.

### How Do You Prove A Two-Pointer Movement?

Use ordering. For an ascending pair sum that is too small, the current left value
paired with any remaining smaller right candidate is also too small. Discarding
that left value cannot remove a valid pair.

### Hashing Versus Sorting?

Hashing normally gives expected linear time and preserves original indices at
linear memory cost. Sorting gives deterministic ordered traversal and easy
duplicate handling, but costs `O(n log n)` and mutates input unless copied.

### Why Is Subarray Sum Equals K Not Two Sum?

It asks about a contiguous range. The values looked up are prefix sums, not array
elements. An earlier prefix of `currentPrefix - k` defines a valid range.

### Why Does A Standard Sliding Window Fail With Negative Values?

Adding a value may decrease the sum and removing one may increase it, so the
direction needed to restore the target is not monotonic. The pointer movement is
therefore not safe.

### How Do You Handle Multiple Correct Answers?

Clarify whether any answer, earliest indices, lexicographic order, unique values,
or all index combinations are required. Deterministic tie-breaking belongs in the
contract, especially for closest-sum problems.

### Why Use Long?

Two valid `int` values can overflow during addition, subtraction, multiplication,
absolute difference, prefix accumulation, or pair counting. Cast before the
operation; casting the already-overflowed result is too late.

### What If The Input Is Immutable?

Avoid in-place marking, compaction, and sorting, or operate on a copy and include
its `O(n)` time/space cost. Do not hide this trade-off.

### What Changes For Streaming Input?

Only prefix-compatible algorithms work directly. Two Sum can maintain seen values;
running minimum and Kadane maintain bounded state. Sorting, reverse traversal, and
future suffix products require buffering or a different external algorithm.

### What If The Data Is Larger Than Memory?

Consider external sorting, chunking with boundary reconciliation, hash partitioning,
or a distributed batch engine. State whether the result must be exact, whether one
or many queries are expected, and the cost of moving data.

### Can Parallel Streams Make It Faster?

Not automatically. Many algorithms have sequential dependencies: two pointers,
Kadane state, in-place compaction, and interval merging. Parallelization adds split,
coordination, allocation, and merge costs. First identify an associative reduction
or independent chunks with a correct boundary-combination rule, then benchmark.

## Production-Oriented Follow-Ups

### API Design

- Prefer `Optional<IntPair>` or a documented result type over ambiguous sentinels.
- Make mutation explicit in method name or contract.
- Define null, empty, integer range, duplicate, and tie behavior.
- Reject invalid shape for matrix methods rather than failing deep in a loop.

### Memory And Performance

- Boxed `HashMap<Integer, Integer>` has substantial per-entry overhead.
- A bounded integer domain may permit primitive arrays or bit sets.
- Sorting can be cache-friendly despite worse asymptotic time.
- Returning every combination may dominate runtime and memory through output size.
- Benchmark realistic distributions: sorted, skewed, duplicate-heavy, and random.

### Concurrency

Most interview array methods should be pure or own their input. Concurrent mutation
of a shared array makes results undefined without synchronization. Thread-safe
collections do not automatically make multi-step algorithm invariants atomic.

## Rapid Edge-Case Checklist

```text
null policy
empty input
one element
minimum valid length
all same values
duplicates forming a result
zeroes
all negative values
already sorted / reverse sorted
multiple valid answers
no valid answer
Integer.MIN_VALUE / MAX_VALUE
mutation visible to caller
output too large for int count
```

## Five-Minute Mock Rubric

Score each dimension from zero to two:

| Dimension | 0 | 1 | 2 |
|---|---|---|---|
| contract | assumes silently | asks some constraints | resolves output, mutation, duplicates, overflow |
| approach | guesses pattern | correct approach | derives from repeated work |
| correctness | no proof | example only | invariant and elimination proof |
| Java | unsafe/incomplete | mostly correct | overflow-safe, clear, contract-aware |
| complexity | wrong/missing | time only | time, auxiliary, output, mutation |
| communication | code-first | understandable | structured with trade-off and follow-up |

A score of ten or more, repeated across random problems, is a strong signal that
the pattern is interview-ready.

Return to the [30-Problem Roadmap](./ARRAY-30-PROBLEM-ROADMAP.md) or expand practice
through the [full DSA question bank](../../DSA-INTERVIEW-QUESTION-BANK.mdx).
