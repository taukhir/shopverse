---
title: "TreeMap Internals and Usage"
description: "TreeMap red-black tree storage, comparator identity, navigation, methods, complexity, backed range views, and selection guidance."
sidebar_label: "TreeMap"
tags: [java, collections, map, treemap, red-black-tree, internals]
page_type: Deep Dive
difficulty: Advanced
status: maintained
last_reviewed: "2026-07-24"
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: repository-content-audit
prerequisites: [Map contract, Comparable and Comparator, binary search trees, and range notation]
learning_objectives: [Trace balanced-tree operations, Protect comparator identity, Use backed navigable views safely]
---

# TreeMap Internals and Usage

`TreeMap<K,V>` is a mutable `NavigableMap` stored as a red-black tree ordered by
natural key order or a supplied comparator. It exists for sorted traversal,
nearest-key lookup, and bounded range views—not merely as a slower `HashMap`.
Its central correctness rule is that comparator equality defines key identity.

```text
              20=B
             /    \
          10=R   30=R
```

There is no initial capacity, growth factor, or load factor. Each entry is a
node with key, value, parent, left/right children, and color.

## Page Overview

This page explains tree balancing, comparator-defined identity, navigation and
range views, null handling, operational failures, and the evidence needed to
choose a tree index in production.

## Core Terminology And Mental Model

- A **red-black tree** bounds height through color and path invariants.
- **Natural order** comes from `Comparable`; custom order comes from `Comparator`.
- A **navigation query** finds a lower, floor, ceiling, or higher key.
- A **backed range view** is a live window over the map, not a copy.

## How It Works: Search, Rotation, And Range Views

Comparator results guide search left or right. Insertions and removals may
recolor nodes and perform rotations to keep tree height logarithmic. `get`,
`put`, `remove`, and navigation are O(log n); ordered traversal is O(n).

## Comparator Defines Key Identity

If `compare(a,b) == 0`, the map treats the keys as the same mapping even when
`a.equals(b)` is false. Ordering should normally be consistent with equality.
Never mutate key fields used by the comparator while stored.

## Important Methods

`firstEntry`, `lastEntry`, `lowerEntry`, `floorEntry`, `ceilingEntry`,
`higherEntry`, `pollFirstEntry`, `pollLastEntry`, `subMap`, `headMap`, `tailMap`,
`descendingMap`, and `reversed`.

Range maps are backed views. Changes flow both directions, and an insertion
outside the view's bounds throws `IllegalArgumentException`.

## Null Handling

Null values are allowed. Natural-order keys must be non-null. A custom
comparator could accept null keys, but explicit non-null domain keys are usually
safer and easier to reason about.

```java
NavigableMap<Instant, String> deployments = new TreeMap<>();
deployments.put(Instant.parse("2026-08-04T09:00:00Z"), "v41");
deployments.put(Instant.parse("2026-08-04T11:00:00Z"), "v42");
Map.Entry<Instant, String> active = deployments.floorEntry(Instant.now());
```

## Failure Modes, Edge Cases, And Production Diagnostics

- A comparator returning zero for distinct business keys silently replaces a
  value. Test antisymmetry, transitivity, and equality consistency with boundary data.
- Mutating a compared key breaks search placement. Use immutable keys or remove,
  mutate, and reinsert them.
- Incorrect inclusive/exclusive range bounds omit data; inserting outside a
  backed view throws `IllegalArgumentException`.
- Hot ordered writes allocate and rebalance nodes. Profile CPU and allocation,
  then compare with a sorted immutable array when writes are rare.

## When To Use

Use for sorted keys, time/range indexes, nearest-key queries, and continuous
ordered mutation. Use `HashMap` for plain lookup. If data is built once and read
mostly by traversal or binary search, a sorted array/list may be more compact.

## Tricky Interview Questions

1. **Can unequal objects occupy separate entries when comparison returns zero?**
   No; the later `put` replaces the mapping because comparison defines identity.
2. **Is `subMap` a snapshot?** No, it is backed and enforces its key bounds.
3. **Why is height O(log n)?** Red-black invariants bound the longest path in
   relation to the tree's black height.

## Recommended Next

- [Ordering contracts](../../JAVA-COMPARABLE-COMPARATOR-DEEP-DIVE.md)
- [PriorityQueue internals](../queue/PRIORITYQUEUE-INTERNALS.md)
- [Map overview](./MAP-OVERVIEW.md)

## Official References

- [Java 25 `TreeMap` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/TreeMap.html)
- [OpenJDK `TreeMap` source](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/TreeMap.java)
