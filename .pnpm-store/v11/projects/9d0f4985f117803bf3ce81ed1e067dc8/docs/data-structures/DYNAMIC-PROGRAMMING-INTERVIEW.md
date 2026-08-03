---
title: Dynamic Programming Interview Guide
description: Derive memoized and tabulated solutions through state, recurrence, base cases, evaluation order, reconstruction, and memory optimization.
difficulty: Advanced
page_type: Guide
status: maintained
prerequisites: [Recursion, complexity analysis]
learning_objectives: [Recognize overlapping subproblems, Derive recurrences, Choose memoization or tabulation, Prove state and transition complexity]
technologies: [Java, Dynamic Programming]
last_reviewed: "2026-07-31"
scope: generic
owner: docs-data-structures
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Dynamic Programming Interview Guide

Write one sentence defining state before code: “`dp[i]` is the best/number/feasibility
for prefix or position `i` under these constraints.” Then define choices, recurrence,
base cases, evaluation order, and answer location.

## Pattern Families

| Family | Typical state | Key decision |
|---|---|---|
| take/skip | index and previous constraint | include current or exclude it |
| grid | row and column | predecessor cells |
| knapsack | item index and capacity/sum | zero-one versus reusable choice |
| two sequence | two prefix indexes | match, insert, delete, replace |
| interval | left and right boundary | first/last split inside interval |
| tree DP | node plus limited state | combine independent child results |

Memoization follows the recurrence naturally but retains recursion frames. Tabulation
makes order and memory explicit. Optimize to rolling state only after proving future
transitions do not need overwritten values.

## Ten Interview Checks

1. **When is DP applicable?** Overlapping subproblems plus a composable optimal/count/feasibility structure.
2. **State definition?** It must contain exactly the history required for future choices.
3. **Memoization versus tabulation?** Top-down explores reachable states; bottom-up avoids recursion and controls order.
4. **How calculate complexity?** Number of distinct states multiplied by transitions evaluated per state.
5. **Zero-one versus unbounded knapsack?** Capacity loop direction controls whether the current item can be reused.
6. **Combination versus permutation counts?** Loop ordering determines whether different selection orders are distinct.
7. **Impossible state?** Use a sentinel that cannot overflow when extended; do not confuse it with a valid zero.
8. **Space optimization?** Preserve every dependency and update in an order that does not consume current-row values accidentally.
9. **DP versus greedy?** Greedy needs a proof of safe local choice; DP retains alternatives when that proof fails.
10. **Reconstruct solution?** Store parent/choice information or walk the completed table; value-only rolling DP may be insufficient.

## Official References

- [MIT OpenCourseWare: Introduction to Algorithms](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/)
- [Java arrays API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Arrays.html)

## Recommended Next

Practice the Dynamic Programming table in the [DSA Interview Question Bank](./DSA-INTERVIEW-QUESTION-BANK.mdx).
