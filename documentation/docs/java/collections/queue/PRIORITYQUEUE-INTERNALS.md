---
title: "PriorityQueue Internals and Usage"
description: "PriorityQueue binary-heap storage, default capacity, growth, sift operations, methods, complexity, ordering traps, and use cases."
sidebar_label: "PriorityQueue"
tags: [java, collections, queue, priorityqueue, heap, internals]
page_type: "Deep Dive"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-24"
---

# PriorityQueue Internals and Usage

`PriorityQueue<E>` stores elements in an array-backed binary min-heap. The head
is the least element according to natural ordering or the configured comparator.

```text
array indices:       0   1   2   3   4
heap values:        [2] [5] [3] [9] [8]
children of i: 2*i+1 and 2*i+2
```

## Defaults And Storage

| Property | Value |
|---|---|
| default initial capacity | 11 |
| load factor | none |
| growth | automatic; exact policy is an implementation detail |
| nulls | rejected |
| duplicates | allowed |

## How Operations Work

- `offer(e)` appends then sifts upward until the heap invariant holds: O(log n).
- `peek()` reads index zero: O(1).
- `poll()` removes the root, moves the last value to the root, then sifts down:
  O(log n).
- removing or finding an arbitrary value scans first: O(n).
- construction from a collection can heapify bottom-up in O(n).

The heap guarantees only that the head is least. Iteration and `toString()` are
**not sorted**. Repeated `poll` produces priority order destructively.

## Important Methods

`offer`, `peek`, `poll`, `remove`, `comparator`, `iterator`, and `clear`.
For top-k processing, maintain a bounded heap and compare against its head.

## Mutable Priority Trap

Changing a field used by the comparator while an element is stored does not
reheapify it. Remove and reinsert the element, or store immutable priority
records.

## Example

```java
record RetryTask(Instant readyAt, Runnable action) {}

Queue<RetryTask> retries = new PriorityQueue<>(
        Comparator.comparing(RetryTask::readyAt));
```

This orders in-memory tasks but supplies no waiting, thread safety, persistence,
or durability. `DelayQueue` or a durable scheduler may better match production
requirements.

## When To Use

Use for in-memory scheduling, top-k algorithms, shortest-path frontiers, and
repeated min/max extraction. Use a sorted collection for full ordered traversal,
and `PriorityBlockingQueue` for concurrent access while still addressing its
unbounded-capacity risk.

## Official References

- [Java 25 `PriorityQueue` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/PriorityQueue.html)
- [OpenJDK `PriorityQueue` source](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/PriorityQueue.java)
