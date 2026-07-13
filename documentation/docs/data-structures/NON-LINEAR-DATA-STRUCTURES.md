---
title: Non-Linear Data Structures
sidebar_position: 3
status: "maintained"
last_reviewed: "2026-07-13"
---

# Non-Linear Data Structures

Non-linear structures represent hierarchy, priority, or relationships.

## Tree

A tree contains nodes connected parent-to-child.

Common types:

- binary tree;
- binary search tree;
- balanced tree;
- heap;
- trie.

## Binary Search Tree

BST rule:

```text
left values < node value < right values
```

Balanced trees keep operations close to O(log n). Unbalanced trees can degrade
to O(n).

Java `TreeMap` and `TreeSet` use red-black trees.

## Heap

A heap is a priority structure.

Java example:

```java
PriorityQueue<Order> queue = new PriorityQueue<>(
        Comparator.comparing(Order::createdAt)
);
```

Use for:

- priority scheduling;
- top-k problems;
- shortest path algorithms.

## Graph

A graph models relationships between nodes.

Use cases:

- social networks;
- routing;
- dependency graphs;
- service topology;
- recommendation systems.

Representations:

- adjacency list;
- adjacency matrix.

## Trie

A trie stores strings by prefix.

Use cases:

- autocomplete;
- dictionary lookup;
- prefix search.

## Interview Questions

<ExpandableAnswer title="Tree vs graph?">

A tree is a connected acyclic graph with hierarchy. A graph can have cycles and
arbitrary relationships.

</ExpandableAnswer>
<ExpandableAnswer title="Heap vs binary search tree?">

Heap gives fast min/max access. BST gives sorted search and range traversal.

</ExpandableAnswer>
<ExpandableAnswer title="Adjacency list vs matrix?">

Adjacency list is memory efficient for sparse graphs. Matrix gives O(1) edge
lookup but uses O(V^2) space.

</ExpandableAnswer>