---
title: "ArrayDeque Internals and Usage"
description: "ArrayDeque circular-array storage, default size, growth, head and tail operations, methods, complexity, and stack/queue guidance."
sidebar_label: "ArrayDeque"
tags: [java, collections, queue, deque, arraydeque, internals]
page_type: Deep Dive
difficulty: Advanced
status: maintained
last_reviewed: "2026-07-24"
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: repository-content-audit
prerequisites: [Queue and Deque contracts, arrays, modular indexing, and amortized complexity]
learning_objectives: [Trace circular-array end operations, Choose exception or sentinel APIs deliberately, Recognize concurrency and backpressure limits]
---

# ArrayDeque Internals and Usage

`ArrayDeque<E>` is a mutable double-ended queue backed by a resizable circular
array. `head` points to the first element and `tail` to the next insertion slot;
indices wrap at the array boundary. It is the normal local choice for FIFO,
LIFO, and both-end workflows, provided neither concurrency nor capacity-based
backpressure is part of the contract.

```text
array: [C][D][ ][ ][A][B]
              tail ^ head
logical order: A, B, C, D
```

## Page Overview

This page defines circular indexing, growth, queue and stack APIs, null and empty
behavior, failure modes, and production selection against linked, blocking, and
concurrent alternatives.

## Core Terminology And Mental Model

- A **deque** permits insertion and removal at both ends.
- The **head** identifies the logical first element; **tail** is the next rear slot.
- A **circular array** wraps physical indices while preserving logical order.
- Operations come in exception (`remove`) and sentinel (`poll`) forms.

## Defaults And Growth

The default constructor is sized for roughly 16 elements in current OpenJDK;
its internal array includes an empty sentinel slot. There is no load factor.
It grows automatically when head and tail would collide. Exact backing-array
length and growth rules are implementation details, not API guarantees.

Null elements are rejected so `poll` and `peek` can use null to mean empty.
Duplicates are allowed.

## How It Works: Circular Indexing And Growth

End operations write, clear, and advance one circular index. `offerFirst`,
`offerLast`, `pollFirst`, `pollLast`, `peekFirst`, and `peekLast` are amortized
O(1). Growth copies elements into logical order in a larger array. Searching or
removing by value is O(n).

## Queue And Stack Forms

```java
Deque<Job> queue = new ArrayDeque<>();
queue.offerLast(job);
Job next = queue.pollFirst();       // FIFO

Deque<Frame> stack = new ArrayDeque<>();
stack.push(frame);
Frame current = stack.pop();        // LIFO
```

Prefer it over legacy `Stack` and usually over `LinkedList` for queue/deque work.

## Important Methods

`offerFirst`, `offerLast`, `pollFirst`, `pollLast`, `peekFirst`, `peekLast`,
`addFirst`, `addLast`, `removeFirst`, `removeLast`, `push`, `pop`, `getFirst`,
`getLast`, and `reversed`.

## Failure Modes, Edge Cases, And Production Diagnostics

- `addFirst(null)` fails because null is reserved as the empty sentinel. Model
  missing work outside the deque rather than storing null.
- `removeFirst` and `getFirst` throw on empty; `pollFirst` and `peekFirst` return
  null. Pick one error contract and test it at the boundary.
- Growth produces an allocation and copy burst. Pre-size predictable workloads
  and observe peak depth, allocation rate, and latency rather than average size.
- Iterators are fail-fast best effort, and the deque is not thread-safe. External
  locking must cover compound operations, not individual calls only.
- It cannot bound producers. For service pipelines, use a bounded queue and
  define timeout, rejection, shutdown, and overload behavior.

## When To Use

Use for local FIFO queues, stacks, sliding windows, breadth/depth-first search,
and both-end work. It is not thread-safe and has no bounded-capacity
backpressure. Use a bounded `BlockingQueue` for producer-consumer coordination.

## Tricky Interview Questions

1. **Why is null forbidden?** Sentinel-returning methods use null to report empty.
2. **Is every insertion O(1)?** It is amortized O(1); growth occasionally copies
   the live elements.
3. **Why prefer it to `LinkedList` for a stack?** It avoids one node allocation
   and multiple references per element and usually has better locality.

## Architecture Decisions And Production Evidence

For a request-processing queue, specify producer admission, maximum depth,
consumer ownership, shutdown drain, timeout, rejection, retry, and observability.
`ArrayDeque` implements none of those policies; it is only the local container.

## Recommended Next

- [Queue and Deque overview](./QUEUE-DEQUE-OVERVIEW.md)
- [PriorityQueue internals](./PRIORITYQUEUE-INTERNALS.md)
- [Safe collection mutation](../SAFE-COLLECTION-MUTATION.md)

## Official References

- [Java 25 `ArrayDeque` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/ArrayDeque.html)
- [OpenJDK `ArrayDeque` source](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/ArrayDeque.java)
