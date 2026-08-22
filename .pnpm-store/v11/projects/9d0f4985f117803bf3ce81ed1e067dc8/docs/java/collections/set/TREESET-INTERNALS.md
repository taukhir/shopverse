---
title: "TreeSet Internals and Usage"
description: "TreeSet red-black tree backing, comparator identity, navigation, methods, complexity, ranges, and selection guidance."
sidebar_label: "TreeSet"
tags: [java, collections, set, treeset, red-black-tree, internals]
page_type: Deep Dive
difficulty: Advanced
prerequisites: [Set contract, Comparable or Comparator, and binary search trees]
learning_objectives: [Trace red-black tree membership, Explain comparator-defined uniqueness, Use navigable ranges without corrupting ordering]
status: maintained
last_reviewed: "2026-07-24"
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# TreeSet Internals and Usage

`TreeSet<E>` is a `NavigableSet` backed by a `TreeMap<E,Object>`. Keys are kept
in a self-balancing red-black tree.

```text
          20(B)
         /     \
      10(R)   30(R)
```

There is no capacity, resize, or load factor. Each element occupies a tree node
with parent, left, right, and color metadata.

## Page Overview

This page covers red-black-tree operations, comparator identity, logarithmic
navigation, backed range views, null policy, mutable-key failures, and selection.

## Core Terminology And Mental Model

`compare(a,b)==0` defines duplicate identity for this set. Red-black balancing
keeps search height logarithmic; navigable operations locate neighboring keys.

## Ordering Defines Uniqueness

Two elements are duplicates when their comparator returns zero, even if
`equals` returns false. For predictable `Set` behavior, ordering should be
consistent with equality.

```java
NavigableSet<Order> byNumber = new TreeSet<>(
        Comparator.comparing(Order::orderNumber));
```

A second order with the same number is rejected by this set.

## How It Works: Tree Operations

Search follows comparator results left or right. Insertions and removals recolor
and rotate nodes to maintain red-black invariants. `add`, `remove`, and `contains`
are O(log n); sorted traversal is O(n).

## Important Methods

`first`, `last`, `lower`, `floor`, `ceiling`, `higher`, `pollFirst`, `pollLast`,
`subSet`, `headSet`, `tailSet`, `descendingSet`, and `reversed`. Range methods
return backed views; out-of-range insertion can fail.

## Null And Mutation Rules

Natural ordering rejects null. A custom comparator could define null ordering,
but null elements usually make domain ordering less clear. Never mutate fields
used by the comparator while stored; the node will remain in the wrong tree
position.

## When To Use

Use for unique sorted values, range queries, and nearest-value navigation. Use
`HashSet` for membership only, or sort an `ArrayList` once when updates are rare
and most work is sequential traversal.

## Failure Modes, Edge Cases, And Production Evidence

- comparator equality can collapse objects that are unequal by `equals`;
- mutating ordering fields corrupts search reachability;
- range views are backed and enforce their bounds;
- comparator inconsistency or non-transitivity breaks tree assumptions;
- tree nodes cost more memory than hash buckets for simple membership.

## Tricky Interview Questions

<ExpandableAnswer title="Can TreeSet drop an element that equals says is different?">
Yes. Comparator result zero defines set uniqueness for sorted sets.
</ExpandableAnswer>

## Recommended Next

Study [Comparable And Comparator](../../JAVA-COMPARABLE-COMPARATOR-DEEP-DIVE.md)
and compare [HashSet](./HASHSET-INTERNALS.md).

## Official References

- [Java 25 `TreeSet` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/TreeSet.html)
- [OpenJDK `TreeMap` source](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/TreeMap.java)
