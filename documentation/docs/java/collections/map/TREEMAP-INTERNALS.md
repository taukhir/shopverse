---
title: "TreeMap Internals and Usage"
description: "TreeMap red-black tree storage, comparator identity, navigation, methods, complexity, backed range views, and selection guidance."
sidebar_label: "TreeMap"
tags: [java, collections, map, treemap, red-black-tree, internals]
page_type: "Deep Dive"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-24"
---

# TreeMap Internals and Usage

`TreeMap<K,V>` is a `NavigableMap` stored as a red-black tree ordered by natural
key order or a supplied comparator.

```text
              20=B
             /    \
          10=R   30=R
```

There is no initial capacity, growth factor, or load factor. Each entry is a
node with key, value, parent, left/right children, and color.

## How Operations Work

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

## When To Use

Use for sorted keys, time/range indexes, nearest-key queries, and continuous
ordered mutation. Use `HashMap` for plain lookup. If data is built once and read
mostly by traversal or binary search, a sorted array/list may be more compact.

## Official References

- [Java 25 `TreeMap` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/TreeMap.html)
- [OpenJDK `TreeMap` source](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/TreeMap.java)
