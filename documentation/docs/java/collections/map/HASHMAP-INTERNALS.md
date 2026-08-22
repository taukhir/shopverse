---
title: "HashMap Internals and Usage"
description: "HashMap buckets, defaults, load factor, resize, collisions, treeification, methods, key safety, complexity, and selection."
sidebar_label: "HashMap"
tags: [java, collections, map, hashmap, internals]
page_type: Deep Dive
difficulty: Advanced
status: maintained
last_reviewed: "2026-08-02"
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: repository-content-audit
prerequisites: [Map contract, Java equality and hashing, arrays, and generics]
learning_objectives: [Trace lookup insertion collision and resize paths, Design stable keys, Size and diagnose hash maps from workload evidence]
---

# HashMap Internals and Usage

`HashMap<K,V>` is a mutable, non-thread-safe key-to-value index implemented with
a power-of-two bucket array. A node contains the spread hash, key, value, and
collision-chain link; dense bins may use tree nodes. Start here to understand
ordinary lookup, then follow the collision, resizing, key-safety, and diagnostic
paths that determine real latency and correctness.

```text
table[0] -> null
table[1] -> Node(A,1) -> Node(B,2)
table[2] -> TreeNode(...)
```

## Page Overview

This page defines the storage model, traces `put` and `get`, explains collision
treeification and capacity planning, demonstrates stable keys, and closes with
failure diagnosis, selection guidance, and interview checks.

## Core Terminology And Mental Model

- A **bucket** is an array slot selected from a spread hash.
- A **bin** is the linked list or red-black tree stored in one bucket.
- The **load factor** determines the resize threshold, not a per-bin limit.
- A **stable key** does not change equality or hash fields while stored.

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

## How It Works: `put`, `get`, And Resize

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

`HashMap` does not sort entries, so a null key has no "first" or "last"
position. If sorted keys are required, use `TreeMap`; its natural ordering
normally rejects null keys because they cannot be compared. A comparator that
explicitly handles null can define an order, for example null-first:

```java
Map<String, Integer> sorted = new TreeMap<>(Comparator.nullsFirst(naturalOrder()));
sorted.put(null, 0);
sorted.put("A", 1);
```

Sorting entries from a `HashMap` is a separate operation: copy its entries to a
list and sort with a comparator that defines how null keys or values compare.

## Capacity Planning

`new HashMap<>(expectedSize)` names bucket capacity, not mapping capacity, and
may still resize. Prefer `HashMap.newHashMap(expectedMappings)` on modern Java
when expected mappings are known.

```java
record ProductKey(String tenantId, String sku) {}
Map<ProductKey, Integer> stock = HashMap.newHashMap(10_000);
stock.merge(new ProductKey("north", "SKU-42"), 3, Integer::sum);
```

## Failure Modes, Edge Cases, And Production Diagnostics

- Mutable keys become logically unreachable: iteration can show an entry whose
  mutated key no longer finds its original bucket. Prefer immutable key state.
- Poor hash distribution creates hot bins. Profile CPU, inspect key types and
  `hashCode`, and benchmark representative rather than synthetic integer keys.
- Resize bursts allocate and copy. Pre-size known bulk loads and compare
  allocation rate and tail latency before and after the change.
- Mapping callbacks should be short and side-effect-free; recursive structural
  mutation can fail and `computeIfAbsent` is not a cache-wide single-flight guarantee.
- Unsynchronized concurrent access is a data race. Use confinement, locking, or
  `ConcurrentHashMap` according to the compound operation required.

## When To Use

Use for ordinary single-threaded or externally confined lookup with no order
requirement. Use `LinkedHashMap` for encounter/access order, `TreeMap` for sorted
ranges, `EnumMap` for enum keys, and `ConcurrentHashMap` for shared per-key updates.

## Tricky Interview Questions

1. **Why is lookup not guaranteed O(1)?** Collisions require bin traversal;
   tree bins improve dense-bin bounds, but comparison quality and resize matter.
2. **Why can `get(k)` return null for two states?** The key may be absent or map
   to null; use `containsKey` when that distinction is part of the contract.
3. **Does treeification happen at eight entries every time?** No. A small table
   resizes first; treeification also requires the minimum table capacity.

## Recommended Next

- [Map overview](./MAP-OVERVIEW.md)
- [LinkedHashMap internals](./LINKEDHASHMAP-INTERNALS.md)
- [ConcurrentHashMap internals](../../JAVA-CONCURRENT-HASHMAP-OPENJDK.md)

## Official References

- [Java 25 `HashMap` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/HashMap.html)
- [OpenJDK `HashMap` source](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/HashMap.java)
