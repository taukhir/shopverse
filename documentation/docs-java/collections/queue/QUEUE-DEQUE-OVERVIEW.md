---
title: "Java Queue and Deque Collections Overview"
description: "Choose FIFO, LIFO, priority, concurrent, and blocking queue implementations from their processing and capacity contracts."
sidebar_label: "Queue And Deque Overview"
tags: [java, collections, queue, deque]
page_type: Reference
difficulty: Intermediate
prerequisites: [Collection contracts, Java generics, iteration, and basic concurrency]
learning_objectives: [Define Queue and Deque processing contracts, Choose exception special-value and blocking methods, Select capacity priority and concurrency behavior]
status: maintained
last_reviewed: "2026-07-24"
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Java Queue and Deque Collections Overview

<DocLabels items={[{label: 'Collection family', tone: 'foundation'}, {label: 'Work processing', tone: 'production'}]} />

`Queue` exposes head-based processing. `Deque` extends it with operations at
both ends, supporting FIFO queues and LIFO stacks without `Stack`.
These abstractions define removal direction and failure behavior; implementations
add storage, capacity, ordering, blocking, and concurrency guarantees.

## Page Overview

Method pairs establish how full or empty queues report failure. The implementation
map compares local deques, priority heaps, bounded blocking queues, concurrent
queues, and direct handoff before linking to their mechanics.

```mermaid
flowchart LR
    queue["Queue"] --> deque["Deque"]
    deque --> array["ArrayDeque"]
    deque --> linked["LinkedList"]
    queue --> priority["PriorityQueue"]
    queue --> concurrent["Concurrent queues"]
    concurrent --> blocking["BlockingQueue"]
```

## Method Pairs

| Intent | Exception form | Special-value form |
|---|---|---|
| insert | `add` | `offer` |
| remove head | `remove` | `poll` |
| inspect head | `element` | `peek` |
| blocking insert | `put` | timed `offer` |
| blocking remove | `take` | timed `poll` |

Prefer `offer`/`poll` for capacity-aware processing. For a deque, use explicit
`addFirst`, `offerLast`, `pollFirst`, and `peekLast` names where direction matters.

## Implementation Map

| Need | Start with | Critical constraint |
|---|---|---|
| local FIFO/LIFO/deque | `ArrayDeque` | not thread-safe; rejects null |
| smallest element by priority | `PriorityQueue` | iteration is not priority order |
| bounded producer-consumer | `ArrayBlockingQueue` | fixed capacity; optional fairness |
| linked blocking queue | `LinkedBlockingQueue` | set a capacity or it is effectively unbounded |
| lock-free-style FIFO | `ConcurrentLinkedQueue` | unbounded; `size()` traverses |
| zero-capacity handoff | `SynchronousQueue` | producer and consumer must rendezvous |

Thread safety is not backpressure. Production queues need explicit capacity,
timeout, rejection, retry, shutdown, and—when required—durability policies.

## Dedicated Internals

<TopicCards items={[
  {title: 'ArrayDeque', href: '/java/collections/queue/ARRAYDEQUE-INTERNALS', description: 'Circular array, head/tail indices, growth, wrap-around, stack and queue methods.', icon: 'route', tags: ['Default deque']},
  {title: 'PriorityQueue', href: '/java/collections/queue/PRIORITYQUEUE-INTERNALS', description: 'Binary heap storage, sift-up/down, capacity growth, and comparator behavior.', icon: 'gauge', tags: ['Heap priority']},
  {title: 'Specialized and concurrent queues', href: '/java/JAVA-SPECIALIZED-COLLECTIONS-INTERNALS', description: 'Blocking, concurrent, delayed, handoff, and priority queue selection.', icon: 'network', tags: ['Concurrency', 'Backpressure']},
]} />

## Official References

- [`Queue`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Queue.html)
- [`Deque`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Deque.html)

## Recommended Next

Use [ArrayDeque Internals](./ARRAYDEQUE-INTERNALS.md) for local FIFO/LIFO work and
[PriorityQueue Internals](./PRIORITYQUEUE-INTERNALS.md) for heap-ordered heads;
continue to [Specialized Collections](../../JAVA-SPECIALIZED-COLLECTIONS-INTERNALS.md)
for blocking, concurrent, delayed, and handoff queues.
