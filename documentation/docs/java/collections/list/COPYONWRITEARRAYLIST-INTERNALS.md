---
title: "CopyOnWriteArrayList Internals and Usage"
description: "CopyOnWriteArrayList snapshot storage, write locking, visibility, methods, complexity, and read-mostly use cases."
sidebar_label: "CopyOnWriteArrayList"
tags: [java, collections, list, concurrency, internals]
page_type: Deep Dive
difficulty: Advanced
prerequisites: [List contract, Java arrays, locks, volatile publication, and iteration]
learning_objectives: [Explain snapshot publication, Evaluate read-write workload fit, Predict iterator consistency and memory cost]
status: maintained
last_reviewed: "2026-07-24"
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# CopyOnWriteArrayList Internals and Usage

`CopyOnWriteArrayList<E>` publishes an array snapshot for readers. Every
structural write creates and publishes a replacement array, giving readers
lock-free stable membership while writes pay locking, allocation, and copy cost.
Its value is predictable iteration under rare writes, not general-purpose
concurrent mutation.

## Page Overview

This page traces snapshot publication, write coordination, iterator semantics,
memory amplification, and the narrow read-mostly workloads where copy-on-write
is safer than locking an ordinary list.

## Core Terminology And Mental Model

A **snapshot iterator** retains the array captured at creation. **Copy-on-write**
publishes a new immutable membership array; it does not clone mutable elements.

```text
readers -> snapshot v1 [A][B]
writer locks -> copies -> [A][B][C] -> publishes snapshot v2
old iterator continues reading v1
```

## Storage And Capacity

The current array length equals its current stored size after ordinary writes;
there is no spare-capacity growth policy or load factor. Construction from no
arguments uses an empty array. Nulls and duplicates are allowed.

## How It Works: Copy And Publication

- `get` and iteration read the published array without copying: O(1) / O(n).
- `add`, indexed `set`, and `remove` coordinate writers and copy an array: O(n).
- `addIfAbsent` scans, then copies only when absent: O(n).
- iterators retain the array that existed when they were created.

Snapshot iterators never throw `ConcurrentModificationException`, never see
later writes, and do not support iterator mutation.

## Important Methods

`addIfAbsent`, `addAllAbsent`, `get`, `add`, `set`, `remove`, `iterator`, and
`subList`. Compound operations should use the class's atomic methods rather than
separate contains/add calls.

## Example

```java
private final CopyOnWriteArrayList<OrderListener> listeners =
        new CopyOnWriteArrayList<>();

void publish(OrderEvent event) {
    listeners.forEach(listener -> listener.onOrder(event));
}
```

This fits a small listener registry with frequent iteration and rare
registration changes.

## When To Use

Use it for small, read-dominant collections where snapshot iteration is useful.
Avoid frequent writes, large lists, write bursts, or cases where readers must
immediately observe the newest state. Whole-array copies create allocation and
GC pressure.

## Failure Modes, Edge Cases, And Production Decisions

- each write copies the full reference array and amplifies allocation;
- iterators are consistent but may be stale and cannot mutate;
- mutable elements remain mutable through every snapshot;
- bursty writers serialize and readers can retain old arrays.

Use it for small, overwhelmingly read-mostly listener/configuration lists. Measure
size, write rate, allocation, and stale-read tolerance.

## Tricky Interview Questions

<ExpandableAnswer title="Are snapshot elements immutable?">
No. Only the membership array is stable; referenced objects may change.
</ExpandableAnswer>

<ExpandableAnswer title="Why can lock-free reads increase memory pressure?">
Writes allocate full replacements while readers may retain older arrays.
</ExpandableAnswer>

## Recommended Next

Return to the [List Overview](./LIST-OVERVIEW.md) and compare
[ConcurrentHashMap](../../JAVA-CONCURRENT-HASHMAP-OPENJDK.md) for keyed state.

## Official References

- [Java 25 `CopyOnWriteArrayList` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/CopyOnWriteArrayList.html)
- [OpenJDK source](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/concurrent/CopyOnWriteArrayList.java)
