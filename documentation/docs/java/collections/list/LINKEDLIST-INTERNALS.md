---
title: "LinkedList Internals and Usage"
description: "LinkedList node storage, traversal, deque operations, complexity, methods, memory cost, and practical selection guidance."
sidebar_label: "LinkedList"
tags: [java, collections, list, linkedlist, deque, internals]
page_type: "Deep Dive"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-24"
---

# LinkedList Internals and Usage

`LinkedList<E>` is both a `List` and `Deque`. It stores each element in a
separate doubly linked node.

```text
first -> [prev|null, A, next] <-> [prev, B, next] <-> [prev, C, next|null] <- last
```

## Storage And Defaults

There is no capacity, growth factor, or load factor. An empty list stores only
its object fields; every added element allocates a node containing the item and
two links. It permits nulls and duplicates.

## How Operations Work

- `addFirst`, `addLast`, `removeFirst`, `removeLast`: relink end nodes, O(1).
- `get(i)`: walk from `first` or `last`, whichever is closer, O(n).
- `add(i,e)` / `remove(i)`: O(n) to find the node, then O(1) to relink.
- iterator removal: O(1) after the iterator already has the node.
- traversal: O(n), but pointer chasing and node allocation reduce cache locality.

## Important Methods

As a list: `get`, `set`, `add`, `remove`, `listIterator`.
As a deque: `offerFirst`, `offerLast`, `peekFirst`, `peekLast`, `pollFirst`,
`pollLast`, `push`, and `pop`.

## Why O(1) Insertion Is Often Misleading

The insertion itself is constant-time only when the node position is already
known. `list.add(index, value)` must first traverse to the index. In ordinary
workloads, `ArrayList` often wins even for some middle edits because array copies
are compact and optimized.

## When To Use

Use it when one object genuinely needs both list and deque contracts, or an
algorithm performs many mutations through an existing `ListIterator`. Prefer
`ArrayList` for lists and `ArrayDeque` for queues/stacks. Avoid it for random
access, memory-sensitive large collections, and parallel processing sources.

## Thread Safety

It is not thread-safe. Iterators are best-effort fail-fast. External locking
must cover compound operations, not only individual method calls.

## Official References

- [Java 25 `LinkedList` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/LinkedList.html)
- [OpenJDK `LinkedList` source](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/LinkedList.java)
