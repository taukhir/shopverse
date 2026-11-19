---
title: "PriorityQueue Internals and Usage"
description: "PriorityQueue binary-heap storage, default capacity, growth, sift operations, methods, complexity, ordering traps, and use cases."
sidebar_label: "PriorityQueue"
tags: [java, collections, queue, priorityqueue, heap, internals]
page_type: Deep Dive
difficulty: Advanced
status: maintained
last_reviewed: "2026-07-24"
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: repository-content-audit
prerequisites: [Queue contract, arrays, binary trees, Comparable and Comparator]
learning_objectives: [Trace heap sift operations, Distinguish head guarantees from sorted iteration, Design stable bounded priority workloads]
---

# PriorityQueue Internals and Usage

`PriorityQueue<E>` is a mutable queue implemented as an array-backed binary
min-heap. Its head is the least element according to natural ordering or the
configured comparator. The contract optimizes repeated best-element extraction;
it does not promise sorted iteration, stable ties, waiting, or durability.

```text
array indices:       0   1   2   3   4
heap values:        [2] [5] [3] [9] [8]
children of i: 2*i+1 and 2*i+2
```

## Page Overview

This page develops the heap model, traces offer and poll, demonstrates scheduling
and top-k use, explains mutable-priority and tie failures, and compares local,
concurrent, and durable queue requirements.

## Core Terminology And Mental Model

- A **heap invariant** requires each parent to rank no later than its children.
- **Sift up** repairs after insertion; **sift down** repairs after root removal.
- **Heap order** guarantees the root only, not globally sorted array positions.
- Equal-priority elements have no stable FIFO ordering unless the comparator adds one.

## Defaults And Storage

| Property | Value |
|---|---|
| default initial capacity | 11 |
| load factor | none |
| growth | automatic; exact policy is an implementation detail |
| nulls | rejected |
| duplicates | allowed |

## How It Works: Heapify, Sift Up, And Sift Down

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

```java
record Candidate(long score, long sequence, String id) {}
Comparator<Candidate> stableOrder = Comparator
        .comparingLong(Candidate::score)
        .thenComparingLong(Candidate::sequence);
Queue<Candidate> candidates = new PriorityQueue<>(stableOrder);
```

## Failure Modes, Edge Cases, And Production Diagnostics

- Mutating comparator fields while queued corrupts logical priority. Remove and
  reinsert, or use immutable records.
- Equal comparator results do not preserve insertion order. Add a monotonic
  sequence only if deterministic tie-breaking is a domain requirement.
- Iteration is not sorted; copy and sort for presentation, or repeatedly poll a
  disposable copy.
- `PriorityBlockingQueue` is thread-safe but unbounded. Observe depth and oldest
  item age, and define overload controls outside it.
- An in-memory heap loses work on process failure. Use a durable scheduler when
  ownership, retry, recovery, or multi-instance coordination matters.

## When To Use

Use for in-memory scheduling, top-k algorithms, shortest-path frontiers, and
repeated min/max extraction. Use a sorted collection for full ordered traversal,
and `PriorityBlockingQueue` for concurrent access while still addressing its
unbounded-capacity risk.

## Tricky Interview Questions

1. **Why is iteration not sorted?** The array satisfies parent-child heap order,
   not the stronger total order required between siblings and subtrees.
2. **What is the complexity of removing an arbitrary object?** O(n) to find it,
   then O(log n) to repair the heap.
3. **How is building from n elements O(n)?** Bottom-up heapify sifts many nodes
   near the leaves only a short distance, producing a linear aggregate bound.

## Architecture Decisions And Production Evidence

Specify whether priority can starve low-ranked work, how ties resolve, who owns
queued work, and how tasks recover after restart. Monitor depth by priority and
oldest-item age; a heap's fast extraction does not supply service-level fairness.

## Recommended Next

- [Ordering contracts](../../JAVA-COMPARABLE-COMPARATOR-DEEP-DIVE.md)
- [ArrayDeque internals](./ARRAYDEQUE-INTERNALS.md)
- [Queue and Deque overview](./QUEUE-DEQUE-OVERVIEW.md)

## Official References

- [Java 25 `PriorityQueue` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/PriorityQueue.html)
- [OpenJDK `PriorityQueue` source](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/PriorityQueue.java)
