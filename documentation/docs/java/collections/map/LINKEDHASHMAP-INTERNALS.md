---
title: "LinkedHashMap Internals and Usage"
description: "LinkedHashMap hash-table and order-chain storage, defaults, access order, eviction hooks, methods, complexity, and use cases."
sidebar_label: "LinkedHashMap"
tags: [java, collections, map, linkedhashmap, cache, internals]
page_type: "Deep Dive"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-24"
---

# LinkedHashMap Internals and Usage

`LinkedHashMap<K,V>` extends hash-table lookup with a doubly linked chain across
all entries.

```text
buckets -> hash lookup
head <-> entry A <-> entry B <-> entry C <-> tail
```

## Defaults And Modes

Default capacity is 16, default load factor is 0.75, and table allocation is
lazy as in `HashMap`. The default mode preserves insertion order. A constructor
with `accessOrder=true` moves accessed entries toward the newest end.

The extra before/after references increase memory and mutation work. Average
lookup and update remain O(1); iteration is O(size), not O(table capacity).

## Important Methods

All `Map` operations plus sequenced-map methods: `firstEntry`, `lastEntry`,
`pollFirstEntry`, `pollLastEntry`, `putFirst`, `putLast`, and `reversed`.
Override `removeEldestEntry` only for simple local eviction policies.

## Access-Order Example

```java
Map<String, Product> recent = new LinkedHashMap<>(16, 0.75f, true) {
    @Override
    protected boolean removeEldestEntry(Map.Entry<String, Product> eldest) {
        return size() > 100;
    }
};
```

This is useful for demonstrating LRU mechanics, but it is not thread-safe and
does not provide expiry, weight limits, metrics, loading, or distributed
coherence. Prefer a cache library for production caches.

## Structural Modification Surprise

In access-order mode, `get` changes encounter order. Iteration concurrent with
access can therefore interact with fail-fast behavior even though no mapping is
added or removed.

## When To Use

Use for deterministic insertion-order maps, first-seen merge indexes, sequenced
map operations, or small local access-order structures. Use `HashMap` if order is
irrelevant and `TreeMap` when sorted-key navigation defines the contract.

## Official References

- [Java 25 `LinkedHashMap` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/LinkedHashMap.html)
- [OpenJDK source](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/LinkedHashMap.java)
