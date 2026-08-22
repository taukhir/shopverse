---
title: "HashSet Internals and Usage"
description: "HashSet HashMap backing, defaults, load factor, collisions, equality, methods, complexity, sizing, and selection guidance."
sidebar_label: "HashSet"
tags: [java, collections, set, hashset, internals]
page_type: Deep Dive
difficulty: Advanced
prerequisites: [Set contract, HashMap basics, equals and hashCode]
learning_objectives: [Trace HashSet membership through HashMap, Protect equality invariants, Evaluate collisions sizing and iteration behavior]
status: maintained
last_reviewed: "2026-07-24"
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# HashSet Internals and Usage

`HashSet<E>` stores each element as a key in a backing `HashMap<E,Object>` with
one shared placeholder value.
Uniqueness therefore inherits hash distribution, bucket selection, and key
equality from `HashMap`; iteration order remains unspecified.

## Page Overview

This page covers backing-map storage, defaults, membership flow, collision and
resize behavior, equality safety, sizing, and production selection.

## Core Terminology And Mental Model

An element is a map **key**; `PRESENT` is a shared dummy value. Hashing selects a
bucket and `equals` confirms identity among candidates.

```text
HashSet.add(element) -> backingMap.put(element, PRESENT)
```

## Defaults

| Property | Value |
|---|---|
| default initial capacity | 16, allocated lazily by the backing map |
| default load factor | 0.75 |
| resize threshold | capacity × load factor |
| order | unspecified |
| nulls | one null element allowed |

Capacity is bucket count, not the number of elements the set can accept before
resizing. For an expected element count, use `HashSet.newHashSet(expected)` in
modern Java or size the constructor with load factor in mind.

## How It Works: Membership

1. spread the element's `hashCode`;
2. select a power-of-two bucket;
3. compare stored hash values;
4. use `equals` to find the same logical element;
5. reject insertion if an equal key already exists.

Collision chains can become red-black tree bins under the same thresholds as
`HashMap`. Average `add`, `remove`, and `contains` are O(1); pathological hash
distribution can cost more.

## Important Methods

`add`, `remove`, `contains`, `addAll`, `retainAll`, `removeAll`, `removeIf`,
`iterator`, and `HashSet.newHashSet(expectedSize)`.

## Equality Safety

Fields used by `equals` and `hashCode` must not change while an element is in
the set. Prefer immutable records for set values. A changed hash can make an
element appear absent even though iteration still finds it.

## When To Use

Use for general uniqueness, deduplication, and fast membership when encounter
order does not matter. Use `LinkedHashSet` for insertion order, `TreeSet` for
sorted ranges, `EnumSet` for enums, and a concurrent key set for shared writes.

## Failure Modes, Edge Cases, And Production Evidence

- mutating equality fields after insertion can make an element unreachable;
- poor hash distribution increases collision and comparison cost;
- order observed in one run is not an API promise;
- pre-sizing trades unused memory for fewer resize operations;
- `HashSet` is not safe for concurrent mutation.

## Tricky Interview Questions

<ExpandableAnswer title="Why does HashSet need both hashCode and equals?">
Hashing narrows the bucket; equality distinguishes candidates within it.
</ExpandableAnswer>

<ExpandableAnswer title="Can HashSet contain null?">
Yes, one null element, because the backing HashMap supports one null key.
</ExpandableAnswer>

## Recommended Next

Compare [LinkedHashSet](./LINKEDHASHSET-INTERNALS.md),
[TreeSet](./TREESET-INTERNALS.md), and [HashMap](../map/HASHMAP-INTERNALS.md).

## Official References

- [Java 25 `HashSet` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/HashSet.html)
- [OpenJDK `HashSet` source](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/HashSet.java)
