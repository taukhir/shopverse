---
title: Linear Data Structures
sidebar_position: 2
---

# Linear Data Structures

Linear data structures arrange elements sequentially.

## Array

An array stores elements in contiguous memory.

Strengths:

- O(1) indexed access;
- simple structure;
- good memory locality.

Weaknesses:

- fixed size in many languages;
- insertion/removal in the middle shifts elements.

## Dynamic Array

Java `ArrayList` is a dynamic array. It grows by allocating a larger array and
copying elements.

Use it for most ordered list use cases.

## Linked List

A linked list stores nodes connected by references.

Strengths:

- no large contiguous allocation;
- cheap insert/remove when node is known.

Weaknesses:

- O(n) search;
- extra memory per node;
- poor cache locality.

## Stack

Stack follows LIFO: last in, first out.

Use cases:

- undo operation;
- expression evaluation;
- DFS traversal;
- call stack model.

In Java, prefer `ArrayDeque` over legacy `Stack`.

## Queue

Queue follows FIFO: first in, first out.

Use cases:

- request processing;
- BFS traversal;
- producer-consumer flow.

## Deque

Deque supports insertion/removal from both ends.

```java
Deque<String> deque = new ArrayDeque<>();
deque.addLast("A");
deque.addFirst("B");
```

`ArrayDeque` is usually the best general-purpose stack/deque implementation.

