---
title: Java Collection Implementations For Architects
description: Internal layout, concurrency, ordering, memory, and selection trade-offs across Java collection implementations.
---

# Java Collection Implementations For Architects

## Sequential Collections

`ArrayList` stores references contiguously. Indexed access is constant-time and
iteration benefits from locality. Growth allocates a larger array and copies
references; pre-size stable large workloads. Middle insertion is O(n), but is
often still faster than `LinkedList` because array copies are optimized and
nodes suffer allocation, pointer chasing, and cache misses.

`ArrayDeque` is a resizable circular array and is the default stack/queue choice.
It rejects null, avoids node allocation, and offers amortized constant-time end
operations. `PriorityQueue` is a binary heap: only the head is ordered; iteration
is not sorted. Mutation of a priority field after insertion breaks heap meaning.

## Ordered Maps And Sets

`LinkedHashMap` adds a doubly-linked encounter-order chain. Access-order mode can
support a single-JVM LRU building block, but eviction callbacks, concurrency,
weight, expiry and stampede control usually justify a cache library.

`TreeMap`/`TreeSet` use a red-black tree for O(log n) navigation and ranges.
Comparator equality defines key uniqueness; a comparator inconsistent with
`equals` can make a set appear to lose distinct domain objects. `EnumSet` uses
bit-vector techniques and is superior to a general hash set for enum universes.

## Concurrent Implementations

`CopyOnWriteArrayList` publishes a new backing array per write. Iterators are
immutable snapshots and require no traversal coordination. It fits small,
read-mostly listener/configuration sets; frequent writes or large arrays create
copy and GC pressure.

`ConcurrentLinkedQueue` uses non-blocking linked-node algorithms for unbounded
multi-producer/multi-consumer access. Its `size()` is traversal-based and should
not drive admission. `ConcurrentSkipListMap` provides sorted concurrent ranges
with expected logarithmic operations, trading memory and pointer traversal for
ordered concurrency.

## Blocking Queues And Backpressure

| Queue | Internal model | Architectural use |
|---|---|---|
| `ArrayBlockingQueue` | bounded array, one capacity | predictable bounded handoff |
| `LinkedBlockingQueue` | linked nodes, optional bound | potentially high allocation; always set a deliberate bound |
| `SynchronousQueue` | zero-capacity rendezvous | direct producer/consumer handoff |
| `PriorityBlockingQueue` | unbounded priority heap | ordering without admission protection |
| `DelayQueue` | unbounded delayed elements | expiry/scheduled availability, not durable scheduling |
| `LinkedTransferQueue` | transfer or enqueue | flexible high-throughput handoff |

An unbounded concurrent collection can be thread-safe and still be operationally
unsafe. Capacity, rejection, durability and shutdown are part of the type choice.

## Immutable, Unmodifiable And Sequenced

`Collections.unmodifiableList` is a read-only view: mutations through another
alias remain visible. `List.copyOf` creates/reuses an unmodifiable snapshot and
rejects null. Neither deep-copies mutable elements. Sequenced collection APIs
standardize first/last/reversed access; reversed views can remain backed views,
so document mutation and lifecycle semantics.

## Sorting

Object-array/list sorting uses stable adaptive algorithms in standard JDK
implementations; primitive arrays use different algorithms. Treat algorithm
choice as implementation detail. Comparator must be antisymmetric, transitive,
and consistent enough for the target structure. Stateful or overflow-prone
comparators can violate sorting contracts:

```java
Comparator<Order> safe = Comparator.comparingLong(Order::totalCents);
// Avoid: (a, b) -> (int) (a.totalCents() - b.totalCents())
```

## Architect Review

- Determine cardinality, locality, mutation ratio, ordering and range needs.
- Distinguish thread safety from bounded memory and distributed authority.
- Reject O(1) claims that ignore allocation, locality, contention or resizing.
- Verify comparator/equality and mutable-element contracts.
- Measure representative data with JMH and allocation profiling.

## Tricky Interview Questions

1. Why is `PriorityQueue` iteration unsorted? Only the head is ordered.
2. Is an unmodifiable view immutable? No; backing aliases can mutate it.
3. Why can `TreeSet` drop unequal objects? Comparator equality controls uniqueness.

## Official References

- [Collections Framework overview](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/doc-files/coll-overview.html)
- [Concurrent collections](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/package-summary.html)

## Recommended Next

Continue with [ConcurrentHashMap Internals](./JAVA-CONCURRENT-HASHMAP-OPENJDK.md).
