---
title: 30 Essential Array Problems - Roadmap
description: Prioritized seven-day Java array preparation plan with pattern mapping, mastery levels, repetition schedule, and senior interview evidence.
sidebar_label: 30-Problem Roadmap
sidebar_position: 6
difficulty: Easy to Medium
page_type: Learning Plan
status: maintained
last_reviewed: "2026-07-24"
---

# 30 Essential Array Problems: Roadmap

The purpose of this list is not to memorize 30 isolated answers. It covers a small
set of transferable patterns repeatedly enough that you can derive a solution
under interview pressure.

## The Complete List

| # | Problem | Pattern | Key Learning |
|---:|---|---|---|
| 1 | Two Sum | hash map | prefix complement lookup |
| 2 | Best Time To Buy And Sell Stock | running minimum | legal buy-before-sell state |
| 3 | Remove Duplicates From Sorted Array | slow/fast pointers | in-place logical length |
| 4 | Move Zeroes | stable compaction | write boundary invariant |
| 5 | Maximum Subarray | Kadane DP | best result ending here |
| 6 | Contains Duplicate | hash set | membership versus frequency |
| 7 | Rotate Array | reversal | in-place transformation proof |
| 8 | Merge Sorted Arrays | backward pointers | prevent overwriting unread data |
| 9 | Product Except Self | prefix/suffix | reuse directional aggregate state |
| 10 | Majority Element | Boyer-Moore | cancellation plus optional verification |
| 11 | Missing Number | XOR | cancellation without sum overflow |
| 12 | Find All Missing Numbers | index marking | constrained values as addresses |
| 13 | Find Duplicate Number | Floyd cycle | value-to-index graph mapping |
| 14 | Intersection Of Arrays | sets/frequencies | set versus multiset contract |
| 15 | Sort Colors | three-way partition | classified and unknown regions |
| 16 | Longest Consecutive Sequence | hash set | expand only sequence starts |
| 17 | Maximum Product Subarray | max/min DP | negative sign flips extremes |
| 18 | Container With Most Water | opposite pointers | eliminate shorter boundary |
| 19 | 3Sum | sort plus two pointers | dimensional reduction and duplicates |
| 20 | Spiral Matrix | boundary simulation | single-row/column guards |
| 21 | Rotate Image | transpose/reverse | coordinate transformation |
| 22 | Set Matrix Zeroes | marker reuse | encode state in first row/column |
| 23 | Search Rotated Array | binary search | identify sorted half |
| 24 | Find Peak Element | binary search | follow slope toward a peak |
| 25 | Subarray Sum Equals K | prefix frequency | count earlier matching prefix states |
| 26 | Maximum Circular Subarray | max/min Kadane | complement of minimum subarray |
| 27 | Trapping Rain Water | two pointers | resolve side with known bound |
| 28 | Next Greater Element | monotonic stack | resolve pending candidates once |
| 29 | Merge Intervals | sort and sweep | merge into current frontier |
| 30 | Insert Interval | three phases | before, overlap, after |

Worked solutions are split into [1-10](./ARRAY-PROBLEMS-01-10.md),
[11-20](./ARRAY-PROBLEMS-11-20.md), and [21-30](./ARRAY-PROBLEMS-21-30.md).

## Priority Tiers

### Tier A: Must Explain Fluently

Two Sum, Maximum Subarray, Stock Profit, Product Except Self, Move Zeroes, Rotate
Array, Sort Colors, Container With Most Water, Subarray Sum Equals K, 3Sum, Merge
Intervals, and Trapping Rain Water.

### Tier B: Must Derive With Minor Prompting

Remove Duplicates, Majority Element, Missing Number, Find Duplicate, Longest
Consecutive, Maximum Product, Search Rotated Array, Set Matrix Zeroes, Next Greater,
and Maximum Circular Subarray.

### Tier C: Pattern Reinforcement

Contains Duplicate, Merge Sorted Arrays, Find Missing Values, Intersection, Spiral
Matrix, Rotate Image, Find Peak, and Insert Interval.

## Seven-Day Plan

| Day | Problems | Review Goal |
|---:|---|---|
| 1 | 1, 2, 3, 4, 6 | hashing and same-direction pointers |
| 2 | 5, 8, 10, 11 | running state, Kadane, cancellation |
| 3 | 7, 9, 12, 15 | reversal, prefix/suffix, index marking, partitioning |
| 4 | 13, 14, 16, 17 | cycle mapping, set contracts, max/min DP |
| 5 | 18, 19, 20, 21, 22 | two pointers, duplicates, matrix boundaries |
| 6 | 23, 24, 25, 26 | binary search and prefix-frequency reasoning |
| 7 | 27, 28, 29, 30 | water, monotonic stack, interval sweep; then mock round |

Do not solve each problem only once. On the following day, reproduce the previous
day's invariant and complexity from memory before starting new work.

## Four-Pass Practice Method

### Pass 1: Understand

Read the contract, work a small example by hand, and identify ambiguity. Do not
look at optimized code until you can describe brute force.

### Pass 2: Derive

Write the repeated work and choose state that removes it. State the invariant in
one sentence before coding.

### Pass 3: Implement

Code without notes. Compile mentally against empty, one-element, duplicate, all
negative, and extreme-integer cases. State whether input is mutated.

### Pass 4: Defend

Explain correctness, complexity, alternative approach, rejected trade-off, and a
follow-up variant in under five minutes.

## Spaced Revision Schedule

Revisit a solved problem after:

- one day: reproduce the invariant and core loop;
- three days: solve from a blank editor;
- seven days: solve under a timer and answer follow-ups;
- fourteen days: mix it with a visually similar but different pattern;
- thirty days: include it in a mock interview.

## Senior/Lead Evidence Card

For every problem, record:

```text
Contract:
Brute-force cost:
Optimization observation:
Invariant:
Correctness argument:
Time / auxiliary space / output space:
Mutation:
Overflow risk:
Duplicate policy:
Alternative rejected and why:
Follow-up variant:
```

## Readiness Test

Select five random problems. You are ready to move to the next topic when you can:

- clarify each contract in one minute;
- derive rather than recall the main pattern;
- implement four of five correctly without notes;
- give a convincing invariant for every pointer movement;
- identify mutation and overflow risks;
- complete the set within a 60-minute mock session.

Use [Array Revision And Interview Questions](./ARRAY-INTERVIEW-REVISION.md) before
each mock round.
