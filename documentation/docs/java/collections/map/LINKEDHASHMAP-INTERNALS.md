---
title: "LinkedHashMap Internals and Usage"
description: "LinkedHashMap hash-table and order-chain storage, defaults, access order, eviction hooks, methods, complexity, and use cases."
sidebar_label: "LinkedHashMap"
tags: [java, collections, map, linkedhashmap, cache, internals]
page_type: Deep Dive
difficulty: Advanced
status: maintained
last_reviewed: "2026-07-24"
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: repository-content-audit
prerequisites: [HashMap internals, encounter order, iterators, and basic cache concepts]
learning_objectives: [Trace the bucket and order structures together, Distinguish insertion from access order, Evaluate local LRU limits]
---

# LinkedHashMap Internals and Usage

`LinkedHashMap<K,V>` is a mutable hash map with a doubly linked encounter-order
chain across all entries. It provides predictable iteration while retaining
average constant-time lookup. This page moves from that two-structure mental
model to access ordering, eviction hooks, failure modes, and production choices.

```text
buckets -> hash lookup
head <-> entry A <-> entry B <-> entry C <-> tail
```

## Page Overview

You will learn the storage and ordering contracts, see an access-order LRU
example, understand structural modification during reads, and decide when a
real cache or another map is the safer choice.

## Core Terminology And Mental Model

- The **bucket table** locates a key; the **order chain** drives iteration.
- **Insertion order** records first insertion, not the latest value update.
- **Access order** moves successfully accessed entries toward the newest end.
- The **eldest entry** is first in the configured encounter order.

## How It Works: Storage, Order, And Access

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

## Failure Modes, Edge Cases, And Production Diagnostics

- Access-order reads mutate the chain, so an unsynchronized "read-only" caller
  can race with iteration. Protect the entire access pattern.
- `removeEldestEntry` runs after insertion and offers count-based eviction only;
  it provides no expiry, weight, refresh, or eviction observability.
- Measure entry count, allocation rate, hit ratio, and eviction rate before
  choosing capacity. Backed views remain live and iterators are only fail-fast.

## When To Use

Use for deterministic insertion-order maps, first-seen merge indexes, sequenced
map operations, or small local access-order structures. Use `HashMap` if order is
irrelevant and `TreeMap` when sorted-key navigation defines the contract.

## Tricky Interview Questions

1. **Does replacing a value change insertion order?** Normally no; access-order
   mode may move it when the operation counts as an access.
2. **Why can `get` invalidate an iterator?** In access-order mode it changes the
   encounter-order chain and is a structural modification.
3. **Is this a production LRU cache?** Only a local building block; it lacks
   concurrency, expiry, weight limits, loading, and useful telemetry.

## Architecture Decisions And Production Evidence

Before approving an access-order map as a cache, document ownership, maximum
cardinality, synchronization, eviction semantics, metrics, and restart behavior.
If any requirement spans replicas or must survive failure, this local structure
cannot be the system of record.

## Recommended Next

- [HashMap internals](./HASHMAP-INTERNALS.md)
- [TreeMap internals](./TREEMAP-INTERNALS.md)
- [Safe collection mutation](../SAFE-COLLECTION-MUTATION.md)

## Official References

- [Java 25 `LinkedHashMap` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/LinkedHashMap.html)
- [OpenJDK source](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/LinkedHashMap.java)
