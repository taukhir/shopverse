---
title: Algorithm Complexity And Interview Problem Solving
description: Derive correct algorithms from constraints, invariants, complexity bounds, edge cases, and test evidence instead of memorized solutions.
difficulty: Advanced
page_type: Guide
status: maintained
prerequisites: [Data Structures Fundamentals]
learning_objectives: [Translate constraints into design choices, Prove loop and data-structure invariants, Analyze time and space accurately, Communicate a timed solution]
technologies: [Java, Big-O, Amortized Analysis]
last_reviewed: "2026-07-31"
scope: generic
owner: docs-data-structures
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Algorithm Complexity And Interview Problem Solving

Use one repeatable sequence: clarify the contract, derive a simple correct baseline,
identify the dominant repeated work, choose a structure or invariant that removes it,
prove correctness, calculate cost, implement, and test.

## Complexity Model

State the input dimensions: `n` elements, `v` vertices, `e` edges, alphabet size,
answer-space range, or output size. Count worst-case operations unless another bound
is requested. Separate auxiliary space from output space and recursion stack.

- `ArrayList.add` is amortized O(1), not worst-case O(1), because occasional resizing is O(n).
- Hash-table access is expected O(1) under assumptions; collision/pathological behavior matters.
- Sorting is O(n log n), but can simplify a later linear scan and reduce memory.
- Nested loops are not automatically O(n²): two monotonically moving pointers can total O(n).
- Backtracking cost follows branching factor and depth; DP cost is states × transitions.

## Correctness Proof

A loop invariant states what is true before and after each iteration. A greedy proof
needs an exchange or dominance argument. Binary search needs a monotonic predicate and
a maintained candidate interval. DP needs a state definition and recurrence that covers
every valid final choice exactly as intended.

## Ten Interview Checks

1. **What do you clarify first?** Input size, mutability, ordering, duplicates, null policy, overflow, latency, and required output.
2. **Why start with brute force?** It fixes the contract, supplies a correctness oracle, and exposes repeated work.
3. **Worst case versus amortized?** Worst case bounds one operation; amortized distributes occasional expensive operations across a sequence.
4. **Expected O(1) hashing?** It assumes a suitable hash distribution, resizing policy, and bounded adversarial behavior.
5. **Auxiliary versus output space?** Auxiliary space excludes the required returned result; state both when output can dominate.
6. **How do you prove two pointers?** Show each movement preserves feasibility and every index advances only a bounded number of times.
7. **How do you prove binary search?** Define the monotonic predicate, candidate interval, boundary update, termination, and postcondition.
8. **When is recursion unsafe?** When depth can exceed the stack or retained state is too large; use an explicit stack or iterative order.
9. **How do you test?** Empty/minimal, duplicates, extremes, overflow, degenerate shape, adversarial order, and randomized comparison with the baseline.
10. **What if optimization is incomplete?** Deliver correct code, name the bottleneck, and explain the next invariant rather than bluffing.

## Official References

- [Java Collections Framework](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/package-summary.html)
- [Princeton Algorithms: analysis of algorithms](https://algs4.cs.princeton.edu/14analysis/)

## Recommended Next

Continue with [Graph Algorithms](./GRAPH-ALGORITHMS-INTERVIEW.md) and the
[295-Question DSA Bank](./DSA-INTERVIEW-QUESTION-BANK.mdx).
