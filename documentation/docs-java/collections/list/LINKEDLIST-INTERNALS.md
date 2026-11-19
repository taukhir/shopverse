---
title: "LinkedList Internals and Usage"
description: "LinkedList node storage, traversal, deque operations, complexity, methods, memory cost, and practical selection guidance."
sidebar_label: "LinkedList"
tags: [java, collections, list, linkedlist, deque, internals]
page_type: Deep Dive
difficulty: Advanced
prerequisites: [List and Deque contracts, Java references, generics, and iteration]
learning_objectives: [Trace doubly linked traversal, Explain insertion locality and allocation cost, Select LinkedList only for matching workloads]
status: maintained
last_reviewed: "2026-07-24"
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# LinkedList Internals and Usage

`LinkedList<E>` is both a `List` and `Deque`. It stores each element in a
separate doubly linked node, so positional access requires traversal even though
mutation beside an already located node changes only nearby links.

## Page Overview

This page covers node layout, directional traversal, deque operations,
allocation/locality costs, iterator mutation, and the limits of the familiar
“O(1) insertion” claim.

## Core Terminology And Mental Model

A **node** stores an element and previous/next links. The **head** and **tail**
are the ends; cheap insertion assumes the mutation position is already known.

```text
first -> [prev|null, A, next] <-> [prev, B, next] <-> [prev, C, next|null] <- last
```

## Storage And Defaults

There is no capacity, growth factor, or load factor. An empty list stores only
its object fields; every added element allocates a node containing the item and
two links. It permits nulls and duplicates.

## How It Works: Traversal And Mutation

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

## Failure Modes, Edge Cases, And Production Decisions

- index-based loops repeatedly traverse and can become quadratic;
- node-per-element allocation increases footprint and GC pressure;
- pointer chasing has weaker locality than an array;
- shared mutation still requires coordination;
- `ArrayDeque` is normally better for stack/queue work.

## Production Evidence And Selection

Compare allocation, retained size, traversal latency, and mutation position
against `ArrayList` at representative cardinality before accepting node overhead.

## Tricky Interview Questions

<ExpandableAnswer title="Why is indexed insertion not automatically O(1)?">
Relinking is O(1), but locating the indexed node is O(n).
</ExpandableAnswer>

<ExpandableAnswer title="Why can ArrayList traversal be faster?">
Contiguous references reduce allocation overhead and improve cache locality.
</ExpandableAnswer>

## Recommended Next

Return to the [List Overview](./LIST-OVERVIEW.md) and compare
[ArrayList](./ARRAYLIST-INTERNALS.md) or [ArrayDeque](../queue/ARRAYDEQUE-INTERNALS.md).

## Official References

- [Java 25 `LinkedList` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/LinkedList.html)
- [OpenJDK `LinkedList` source](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/LinkedList.java)
