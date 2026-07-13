---
title: Java Collection Internals
sidebar_position: 4
---

# Java Collection Internals

:::info Canonical learning route
This overview preserves the established URL. Use
[Collection Implementations For Architects](./JAVA-COLLECTION-IMPLEMENTATIONS-ARCHITECT.md)
for focused implementation selection and the dedicated hash-map chapters for
OpenJDK-level mechanics.
:::

Collections are API abstractions, but performance depends on their internal
data structures.

## ArrayList

`ArrayList` stores elements in a resizable array.

```text
ArrayList
  -> Object[] elementData
  -> size
```

Important behavior:

- indexed read is O(1);
- append is amortized O(1);
- inserting/removing in the middle shifts elements and is O(n);
- default constructor starts with an empty internal array and grows on first add;
- growth usually increases capacity by about 50 percent.

Use `new ArrayList<>(expectedSize)` when you know the approximate size.

## LinkedList

`LinkedList` is a doubly linked list.

```text
node <-> node <-> node
```

Each node stores:

- previous reference;
- item;
- next reference.

It is rarely faster than `ArrayList` in application code because traversal has
poor memory locality and extra object allocation.

## HashMap

`HashMap` stores entries in a bucket array.

```text
HashMap table
  [0] -> null
  [1] -> Node(k,v) -> Node(k,v)
  [2] -> TreeNode(k,v)
```

Lookup flow:

1. compute key hash;
2. spread bits to reduce poor hash distribution;
3. calculate bucket index;
4. compare hash;
5. compare keys with `equals`;
6. return value if key matches.

## HashMap Defaults

| Setting | Default |
|---|---|
| initial capacity | 16 |
| load factor | 0.75 |
| resize threshold | capacity * load factor |
| treeification threshold | 8 nodes in one bucket |
| untreeify threshold | 6 nodes |

When size crosses threshold, `HashMap` resizes and redistributes entries.

## Hash Collision

A collision happens when different keys map to the same bucket.

Before Java 8, collisions used linked lists. Since Java 8, heavily collided
buckets can become red-black trees, reducing worst-case lookup from O(n) to
O(log n) for that bucket.

## Why Immutable Keys Matter

If a key field used by `hashCode` changes after insertion, the map may search
the wrong bucket.

```java
Map<UserKey, String> cache = new HashMap<>();
cache.put(key, "value");
key.setUsername("changed"); // dangerous if username participates in hashCode
```

Use immutable keys such as records:

```java
public record UserKey(String tenantId, String username) {
}
```

## HashSet

`HashSet` internally uses a `HashMap`.

Conceptually:

```java
private transient HashMap<E, Object> map;
private static final Object PRESENT = new Object();
```

Adding a value to `HashSet` means adding it as a key in the backing map.

## LinkedHashMap And LinkedHashSet

`LinkedHashMap` keeps hash table lookup plus a doubly linked list for order.

It can preserve:

- insertion order;
- access order, useful for LRU-like caches.

## TreeMap And TreeSet

`TreeMap` uses a red-black tree and keeps keys sorted.

Use it when you need:

- sorted keys;
- range queries;
- first/last key operations.

Cost is O(log n) for get/put/remove.

`TreeSet` is backed by `TreeMap`.

## ConcurrentHashMap

`ConcurrentHashMap` supports concurrent reads and updates without locking the
whole map for every operation.

Use atomic methods:

```java
map.computeIfAbsent(key, ignored -> new LongAdder()).increment();
map.merge(route, 1L, Long::sum);
```

It does not allow null keys or values, because null would make concurrent
lookup semantics ambiguous.

## Interview Questions

<ExpandableAnswer title="Why is HashMap average O(1)?">

Because hash distribution maps keys across buckets, so only a small number of
entries need comparison on average.

</ExpandableAnswer>

<ExpandableAnswer title="When does HashMap become slow?">

Poor hash functions, many collisions, constant resizing, mutable keys, and
very large maps with poor memory locality can hurt performance.

</ExpandableAnswer>

<ExpandableAnswer title="HashMap vs Hashtable?">

`Hashtable` is legacy and synchronized. Prefer `HashMap` for single-threaded
use and `ConcurrentHashMap` for concurrent use.

</ExpandableAnswer>

<ExpandableAnswer title="Why does HashSet not allow duplicates?">

Because it stores values as keys in a backing `HashMap`; keys are unique based
on `hashCode` and `equals`.

</ExpandableAnswer>

## Official References

- [Collections Framework](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/doc-files/coll-overview.html)
- [`HashMap`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/HashMap.html)
