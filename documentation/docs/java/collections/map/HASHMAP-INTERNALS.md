---
title: "HashMap Internals and Usage"
description: "HashMap buckets, defaults, load factor, resize, collisions, treeification, methods, key safety, complexity, and selection."
sidebar_label: "HashMap"
tags: [java, collections, map, hashmap, internals]
page_type: "Deep Dive"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-24"
---

# HashMap Internals and Usage

`HashMap<K,V>` stores nodes in a power-of-two bucket array. A node contains the
spread hash, key, value, and collision-chain link; dense bins may use tree nodes.

```text
table[0] -> null
table[1] -> Node(A,1) -> Node(B,2)
table[2] -> TreeNode(...)
```

## Defaults And Thresholds

| Setting | OpenJDK value |
|---|---|
| default initial capacity | 16, allocated on first insertion |
| default load factor | 0.75 |
| resize threshold | capacity × load factor |
| treeify threshold | 8 nodes in a bin |
| untreeify threshold | 6 |
| minimum table capacity for treeification | 64 |
| maximum capacity | 2³⁰ buckets |

The load factor balances memory against collisions. When size exceeds the
threshold, capacity doubles and entries split between old and new bucket
positions. That resize is O(n), making normal insertion amortized O(1).

## `put` And `get` Flow

1. treat null as hash zero or spread `key.hashCode()`;
2. select bucket with `(capacity - 1) & hash`;
3. compare hash and then `equals` within the bin;
4. replace the value for an equal key or append a new node;
5. treeify a dense bin when capacity is already large enough;
6. resize after crossing the threshold.

Average `get`, `put`, and `remove` are O(1). Good immutable keys and good hash
distribution matter more than memorizing that average.

## Important Methods

`getOrDefault`, `putIfAbsent`, `computeIfAbsent`, `computeIfPresent`, `compute`,
`merge`, `replaceAll`, `keySet`, `values`, `entrySet`, and
`HashMap.newHashMap(expectedMappings)`. Collection views are backed by the map.

## Key And Null Rules

One null key and multiple null values are allowed. Because `get` returning null
can mean absent or mapped-to-null, use `containsKey` when the distinction matters.
Never mutate key fields used by equality or hashing while stored.

## Capacity Planning

`new HashMap<>(expectedSize)` names bucket capacity, not mapping capacity, and
may still resize. Prefer `HashMap.newHashMap(expectedMappings)` on modern Java
when expected mappings are known.

## When To Use

Use for ordinary single-threaded or externally confined lookup with no order
requirement. Use `LinkedHashMap` for encounter/access order, `TreeMap` for sorted
ranges, `EnumMap` for enum keys, and `ConcurrentHashMap` for shared per-key updates.

## Official References

- [Java 25 `HashMap` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/HashMap.html)
- [OpenJDK `HashMap` source](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/HashMap.java)
