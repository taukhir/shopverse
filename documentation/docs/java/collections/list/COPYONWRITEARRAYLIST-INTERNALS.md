---
title: "CopyOnWriteArrayList Internals and Usage"
description: "CopyOnWriteArrayList snapshot storage, write locking, visibility, methods, complexity, and read-mostly use cases."
sidebar_label: "CopyOnWriteArrayList"
tags: [java, collections, list, concurrency, internals]
page_type: "Deep Dive"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-24"
---

# CopyOnWriteArrayList Internals and Usage

`CopyOnWriteArrayList<E>` publishes an array snapshot for readers. Every
structural write creates and publishes a new array.

```text
readers -> snapshot v1 [A][B]
writer locks -> copies -> [A][B][C] -> publishes snapshot v2
old iterator continues reading v1
```

## Storage And Capacity

The current array length equals its current stored size after ordinary writes;
there is no spare-capacity growth policy or load factor. Construction from no
arguments uses an empty array. Nulls and duplicates are allowed.

## How Operations Work

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

## Official References

- [Java 25 `CopyOnWriteArrayList` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/CopyOnWriteArrayList.html)
- [OpenJDK source](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/concurrent/CopyOnWriteArrayList.java)
