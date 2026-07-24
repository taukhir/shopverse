---
title: "LinkedHashSet Internals and Usage"
description: "LinkedHashSet insertion-order links, hash-table defaults, complexity, methods, memory cost, and selection guidance."
sidebar_label: "LinkedHashSet"
tags: [java, collections, set, linkedhashset, internals]
page_type: "Deep Dive"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-24"
---

# LinkedHashSet Internals and Usage

`LinkedHashSet<E>` combines hash membership with a doubly linked encounter-order
chain inherited from `LinkedHashMap` storage.

```text
buckets -> entry lookup by hash
order   -> A <-> B <-> C
```

## Defaults And Storage

The ordinary constructor uses default capacity 16 and load factor 0.75, with
lazy table allocation. Every entry also carries before/after links. It permits
one null and preserves insertion order.

Re-adding an existing element does not move it. Java 21 sequenced-set methods
such as `addFirst`, `addLast`, `getFirst`, `getLast`, and `reversed` make order
operations explicit.

## Complexity

Average `add`, `remove`, and `contains` are O(1). Iteration is O(size), independent
of unused hash-table capacity, because it follows the order chain. The cost over
`HashSet` is additional links and link maintenance.

## Important Methods

`add`, `addFirst`, `addLast`, `getFirst`, `getLast`, `removeFirst`, `removeLast`,
`contains`, `reversed`, and `LinkedHashSet.newLinkedHashSet(expectedSize)`.

## When To Use

Use for deduplication that must preserve first-seen order, deterministic API
results, or stable iteration without sorting. Use `HashSet` if order is irrelevant,
and `TreeSet` if the order must come from values rather than insertion history.

Do not confuse deterministic encounter order with thread safety. External
coordination is still required for shared mutation.

## Official References

- [Java 25 `LinkedHashSet` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/LinkedHashSet.html)
- [OpenJDK source](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/LinkedHashSet.java)
