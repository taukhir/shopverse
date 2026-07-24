---
title: "ArrayDeque Internals and Usage"
description: "ArrayDeque circular-array storage, default size, growth, head and tail operations, methods, complexity, and stack/queue guidance."
sidebar_label: "ArrayDeque"
tags: [java, collections, queue, deque, arraydeque, internals]
page_type: "Deep Dive"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-24"
---

# ArrayDeque Internals and Usage

`ArrayDeque<E>` stores references in a resizable circular array. `head` points
to the first element and `tail` to the next insertion slot; indices wrap at the
array boundary.

```text
array: [C][D][ ][ ][A][B]
              tail ^ head
logical order: A, B, C, D
```

## Defaults And Growth

The default constructor is sized for roughly 16 elements in current OpenJDK;
its internal array includes an empty sentinel slot. There is no load factor.
It grows automatically when head and tail would collide. Exact backing-array
length and growth rules are implementation details, not API guarantees.

Null elements are rejected so `poll` and `peek` can use null to mean empty.
Duplicates are allowed.

## How Operations Work

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

## When To Use

Use for local FIFO queues, stacks, sliding windows, breadth/depth-first search,
and both-end work. It is not thread-safe and has no bounded-capacity
backpressure. Use a bounded `BlockingQueue` for producer-consumer coordination.

## Official References

- [Java 25 `ArrayDeque` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/ArrayDeque.html)
- [OpenJDK `ArrayDeque` source](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/ArrayDeque.java)
