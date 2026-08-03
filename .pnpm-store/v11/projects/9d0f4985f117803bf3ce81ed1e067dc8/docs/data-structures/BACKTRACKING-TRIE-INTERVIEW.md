---
title: Backtracking, Recursion, And Trie Interview Guide
description: Design choice-tree searches, safe state restoration, pruning, duplicate handling, and prefix-tree solutions.
difficulty: Advanced
page_type: Guide
status: maintained
prerequisites: [Complexity analysis, trees]
learning_objectives: [Model choice trees, Restore mutable search state, Prove pruning, Select trie or sorted alternatives]
technologies: [Java, Backtracking, Trie]
last_reviewed: "2026-07-31"
scope: generic
owner: docs-data-structures
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Backtracking, Recursion, And Trie Interview Guide

Backtracking uses **choose → recurse → unchoose**. Define completion, candidates,
validity, and pruning separately. Copy a completed path; otherwise every result can
refer to the same later-mutated list.

Use a start index for combinations, a `used[]`/swap position for permutations, and
sorted sibling skipping for duplicate inputs. Grid search must restore a visited cell
even when a deeper branch fails. Complexity is usually exponential: state branching
and maximum depth are more honest than writing O(n).

A trie stores a path per prefix. Node children can be an array for small fixed alphabets
or a map for sparse/unbounded symbols. A terminal marker distinguishes a word from its
prefix. Tries improve prefix and multi-pattern traversal but may consume far more memory
than sorted strings plus binary search.

## Ten Interview Checks

1. **Combination versus permutation?** Combinations ignore selection order; permutations distinguish it.
2. **Why restore state?** Sibling branches must see the state that existed before the current choice.
3. **Duplicate suppression?** Sort and skip equal values at the same recursion depth while allowing them at later depths when valid.
4. **Safe pruning?** Prune only from a monotonic bound or violated invariant; intuition can remove valid answers.
5. **Recursion depth?** Bound it explicitly; production inputs may require an iterative stack or rejection policy.
6. **Backtracking complexity?** Express branching factor, depth, validation cost, and output size.
7. **Trie lookup complexity?** O(L) character transitions, subject to child-representation and alphabet costs.
8. **Word versus prefix?** A terminal marker proves a complete inserted word; path existence proves only a prefix.
9. **Wildcard search?** Branch DFS across children only at wildcard positions and bound worst-case expansion.
10. **When avoid a trie?** Static data, memory constraints, locale-heavy text, or when sorting/range search is simpler.

## Official References

- [Java Map API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Map.html)
- [Princeton Algorithms: tries](https://algs4.cs.princeton.edu/52trie/)

## Recommended Next

Practice the Backtracking and Trie tables in the [DSA Interview Question Bank](./DSA-INTERVIEW-QUESTION-BANK.mdx).
