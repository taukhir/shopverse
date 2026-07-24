---
title: "ArrayList Internals and Usage"
description: "ArrayList storage, default capacity, growth, shifting, complexity, methods, iteration, memory, and selection guidance."
sidebar_label: "ArrayList"
tags: [java, collections, list, arraylist, internals]
page_type: "Deep Dive"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-24"
---

# ArrayList Internals and Usage

`ArrayList<E>` stores element references in a contiguous `Object[]`. `size` is
the number of logical elements; capacity is the backing-array length.

```text
elementData -> [A][B][C][null][null]   size = 3, capacity = 5
```

## Defaults And Growth

| Property | OpenJDK behavior |
|---|---|
| default logical capacity | 10 |
| allocation | lazy; default constructor starts with a shared empty array |
| normal growth | old capacity + roughly 50% |
| load factor | none; this is not a hash table |
| nulls / duplicates | allowed |

The Java API guarantees amortized constant-time append, not the exact growth
formula. Treat the 1.5x rule as current OpenJDK internals, not an API contract.

When append exceeds capacity, `ArrayList` allocates a larger array and copies
all existing references. `ensureCapacity(expected)` avoids repeated growth;
`trimToSize()` can release spare capacity but causes another copy.

## How Operations Work

- `get(i)` and `set(i,e)` calculate one array offset: O(1).
- `add(e)` writes at `elementData[size]`; occasional growth makes it amortized O(1).
- `add(i,e)` shifts the suffix right with an array copy: O(n).
- `remove(i)` shifts the suffix left and nulls the unused final slot: O(n).
- `contains` and `indexOf` scan with equality: O(n).
- iteration is O(n) with strong locality and few allocations.

## Important Methods

`ensureCapacity`, `trimToSize`, `get`, `set`, `add`, `remove`, `removeIf`,
`sort`, `replaceAll`, `subList`, `listIterator`, `getFirst`, and `getLast`.
`subList` is a backed view; structural changes to the parent outside that view
can invalidate its semantics.

## Example

```java
List<OrderLine> lines = new ArrayList<>(request.items().size());
for (ItemRequest item : request.items()) {
    lines.add(OrderLine.from(item));
}
return List.copyOf(lines);
```

The mutable local list builds efficiently; the returned immutable snapshot
prevents external structural mutation.

## Thread Safety And Iterators

`ArrayList` is not thread-safe. Its iterators are best-effort fail-fast through
a modification counter; `ConcurrentModificationException` detects bugs but is
not a synchronization mechanism.

## When To Use

Use it for general lists, append-heavy accumulation, indexed access, sorting,
and traversal. Avoid it for frequent front insertion/removal, concurrent
mutation, or FIFO/LIFO work—use `ArrayDeque` for the latter.

## Official References

- [Java 25 `ArrayList` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/ArrayList.html)
- [OpenJDK `ArrayList` source](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/ArrayList.java)
