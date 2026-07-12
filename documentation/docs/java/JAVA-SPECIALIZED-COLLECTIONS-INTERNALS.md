---
title: Specialized And Concurrent Java Collections Internals
description: EnumMap, IdentityHashMap, WeakHashMap, sequenced collections, skip lists, copy-on-write, queues, and lifecycle trade-offs.
---

# Specialized And Concurrent Java Collections Internals

## Identity, Enum And Weak-Key Maps

`IdentityHashMap` compares keys with `==` and uses identity hashes. It is useful
for topology-preserving graph algorithms, cycle detection and proxy tables where
object identity is explicitly the key. It violates the normal `Map` expectation
of logical equality and must not back ordinary domain lookup.

`EnumMap` stores keys from one enum universe in a compact ordinal-indexed form.
Iteration follows declaration order, null keys are rejected, and operations avoid
general hashing. Renaming/reordering enum constants can still affect external
contracts even when the map itself remains valid.

`WeakHashMap` holds keys through weak references. An entry can disappear after a
key loses other strong reachability and GC processes its reference. Collection is
nondeterministic; values can accidentally retain keys directly or indirectly.
It is not a bounded cache. For metadata associated with classes, `ClassValue`
often provides a lifecycle-aware alternative without manually pinning class loaders.

## Sequenced Collections

Java 21 introduced common encounter-order operations through `SequencedCollection`,
`SequencedSet` and `SequencedMap`: first, last and reversed views. A reversed view
is generally backed by the original collection; mutation and concurrency semantics
remain those of the implementation. API reviewers must distinguish snapshot,
unmodifiable view and live reversed view.

## Copy-On-Write And Skip Lists

`CopyOnWriteArrayList` publishes a new array for each mutation. Readers traverse
stable snapshots without locking; iterators never reflect later writes. It fits
small listener/configuration lists with extremely rare writes. Large or frequent
writes amplify copying, allocation and stale-snapshot duration.

`ConcurrentSkipListMap` maintains probabilistic multi-level links for expected
O(log n) sorted access and range views. It trades greater pointer/allocation cost
for concurrent navigation. Its iterators are weakly consistent, and comparator
consistency remains essential.

## Queue Choice

| Need | Candidate | Critical constraint |
|---|---|---|
| bounded producer-consumer | `ArrayBlockingQueue` | fixed capacity, explicit fairness option |
| linked bounded handoff | `LinkedBlockingQueue` | set capacity; nodes allocate |
| direct rendezvous | `SynchronousQueue` | no storage; producer meets consumer |
| nonblocking FIFO | `ConcurrentLinkedQueue` | unbounded; `size()` traverses |
| delayed availability | `DelayQueue` | unbounded and non-durable |
| priority handoff | `PriorityBlockingQueue` | unbounded; iteration is not priority order |

Thread-safe does not mean overload-safe. A queue must have capacity, rejection,
durability, retry and shutdown policies. `size()` on concurrent structures is
often observational and must not authorize business actions.

## Tricky Interview Questions

1. Why can `WeakHashMap` retain an entry? Its value or another graph may strongly retain the key.
2. Is a reversed sequenced view a copy? Usually no; it is a backed view.
3. Why is `IdentityHashMap` dangerous for value objects? Equal objects remain different keys.
4. Is `CopyOnWriteArrayList` always lock-free? Reads are snapshot-based; writes coordinate and copy.
5. Can an unbounded blocking queue provide backpressure? No; it converts overload into latency and memory growth.

## Official References

- [`IdentityHashMap`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/IdentityHashMap.html)
- [`WeakHashMap`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/WeakHashMap.html)
- [`SequencedCollection`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/SequencedCollection.html)
- [`ClassValue`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/ClassValue.html)

## Recommended Next

Continue with [ConcurrentHashMap OpenJDK Internals](./JAVA-CONCURRENT-HASHMAP-OPENJDK.md).
