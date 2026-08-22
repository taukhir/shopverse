---
title: List, Set, And Map Choices
description: Practical Java List, Set, and Map implementation choices with Shopverse examples.
status: maintained
last_reviewed: "2026-07-13"
page_type: Guide
difficulty: Intermediate
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: repository-content-audit
prerequisites: [Collection contracts, equality and hashing, ordering, and generics]
learning_objectives: [Select List Set Map or Deque from domain language, Choose the narrowest implementation guarantee, Defend production choices with workload evidence]
---

# List, Set, And Map Choices

**Collection selection** is the process of translating a domain's required
cardinality, lookup, ordering, mutation, and concurrency behavior into the
narrowest Java collection contract. First select `List`, `Set`, `Map`, or
`Deque`; then choose the implementation whose extra guarantee the use case
actually needs. This practical worksheet complements the mechanics-focused
selection guide with Shopverse examples and review-ready decisions.

## Page Overview

This page compares List, Set, and Map choices, demonstrates representative
Shopverse uses, applies a repeatable decision matrix, exposes common failures,
and points to each implementation's dedicated internals page.

## Core Terminology And Mental Model

- **Cardinality** states whether duplicates are meaningful.
- **Encounter order** is iteration order, which may be insertion, access, or sorted order.
- **Lookup shape** asks whether access is by index, membership, key, range, or queue end.
- **Ownership** identifies who may mutate and who observes changes.
- An **implementation guarantee** is useful only when the domain contract needs it.

## List Choices

| Need | Start with | Watch for |
|---|---|---|
| append, traverse, or index | `ArrayList` | middle changes shift later elements |
| immutable value/boundary snapshot | `List.of` / `List.copyOf` | nulls are rejected; elements are not deep-copied |
| tiny read-mostly listener/config list shared across threads | `CopyOnWriteArrayList` | every write copies the array |

`ArrayList` is the application default. `LinkedList` is rarely a win: locating
a position is still linear, each element needs a node, and traversal has poor
locality. If the requirement is operations at the ends rather than indexed
access, choose `ArrayDeque`, which is a deque rather than a list.

Shopverse order entities keep their items in an `ArrayList` because checkout
builds a sequence and response mapping traverses it:

```java
private final List<OrderItemEntity> items = new ArrayList<>();
```

## Set Choices

| Need | Start with | Watch for |
|---|---|---|
| uniqueness/membership only | `HashSet` | no encounter-order promise; stable equality is required |
| uniqueness in encounter order | `LinkedHashSet` | additional links use memory |
| sorted uniqueness and range navigation | `TreeSet` | comparator equality defines duplicates |
| subset of one enum type | `EnumSet` | only enum values from one type are permitted |
| fixed immutable allowlist | `Set.of` | rejects null and duplicate arguments |

Shopverse uses an immutable set for supported inventory image content types:

```java
private static final Set<String> ALLOWED_TYPES =
        Set.of("image/jpeg", "image/png", "image/webp", "image/gif");
```

Order cancellation uses `EnumSet<OrderStatus>` because the domain is explicitly
a subset of all order states. That communicates more than a general-purpose
`HashSet`.

## Map Choices

| Need | Start with | Watch for |
|---|---|---|
| key-value lookup | `HashMap` | no encounter-order promise; keys must remain stable |
| lookup plus encounter/access order | `LinkedHashMap` | ordering links add overhead |
| sorted keys and range queries | `TreeMap` | operations are typically O(log n); comparator defines key identity |
| enum keys | `EnumMap` | keys must belong to one enum type |
| shared concurrent updates by key | `ConcurrentHashMap` | nulls are rejected; multi-key invariants are not made atomic |

Shopverse cart merge builds a temporary ordered index so an existing line item
can be found by product ID without repeatedly scanning the list:

```java
Map<Long, CartItem> existing = new LinkedHashMap<>();
cart.getItems().forEach(item -> existing.put(item.getProductId(), item));

for (CartItemRequest requested : request.items()) {
    CartItem current = existing.get(requested.productId());
    // add a new item or update current quantity
}
```

If order were irrelevant, `HashMap` would be the simpler contract. If the map
were shared by threads, the full update would need a concurrency design rather
than a blind replacement with `ConcurrentHashMap`.

## How It Works: Decision Matrix

| Domain phrase | Structure | Likely implementation |
|---|---|---|
| "line items in this sequence" | `List` | `ArrayList` |
| "supported MIME types" | `Set` | `Set.of` |
| "allowed order states" | `Set` | `EnumSet` |
| "item by product ID, keep first-seen order" | `Map` | `LinkedHashMap` |
| "keys between two timestamps" | `NavigableMap` | `TreeMap` |
| "work from both ends" | `Deque` | `ArrayDeque` |

## Common Wrong Turns

- Do not use a `List` as a repeated membership index; use a `Set` or `Map` when
  that is the real operation.
- Do not use `TreeMap` only to obtain deterministic output; insertion-order or
  explicit output sorting may better express the contract.
- Do not use `LinkedList` as a stack or queue; start with `ArrayDeque`.
- Do not expose a mutable internal collection merely because its declared type
  is an interface.
- Do not treat in-memory maps as distributed inventory, idempotency, or locking
  authorities in a multi-replica service.

## Failure Modes, Edge Cases, And Production Diagnostics

- Unstable equality breaks hash membership; comparator equality can collapse
  distinct sorted keys. Test representative domain objects before load testing.
- Relying on unspecified iteration order produces flaky serialization and tests.
  Either choose an ordered contract or sort explicitly at the boundary.
- An immutable container does not deep-freeze mutable elements. Prefer immutable
  element types for safely published snapshots.
- Replacing a local map with a concurrent map does not protect multi-key or
  cross-service invariants. Trace the complete atomicity boundary.
- Diagnose collection choices with cardinality, access mix, mutation rate,
  allocation, contention, and tail latency—not a microbenchmark alone.

## Tradeoffs And Architecture Decisions

At design review, state the domain phrase that justifies the interface and every
additional implementation guarantee. Estimate peak entries and memory, specify
null/duplicate/order behavior, document thread ownership, and identify the
authoritative durable store. Prefer a simpler structure until measured evidence
requires sorted navigation, copy-on-write snapshots, or concurrent coordination.

## Tricky Interview Questions

1. **Why not always choose `LinkedHashMap` for deterministic output?** Its order
   and memory cost become an implicit contract; explicit boundary sorting may be clearer.
2. **When is a `Set` insufficient for uniqueness?** When a duplicate must retain
   associated state or merge behavior, a `Map<Key,Value>` expresses the operation.
3. **Does declaring `List` make returned state safe?** No; interface type says
   nothing about aliasing, immutability, thread safety, or element mutability.
4. **When can `TreeMap` replace a database index?** Only for process-local,
   bounded, rebuildable state; it supplies no durability or replica consistency.

Implementation mechanics and memory trade-offs live in
[Collection Internals](../JAVA-COLLECTION-INTERNALS.md),
[Collection Implementations For Architects](../JAVA-COLLECTION-IMPLEMENTATIONS-ARCHITECT.md),
and [Specialized Collection Internals](../JAVA-SPECIALIZED-COLLECTIONS-INTERNALS.md).

Continue with [Safe Collection Mutation](./SAFE-COLLECTION-MUTATION.md), or
return to the [Collections umbrella](../JAVA-COLLECTIONS.md).

## Official References

- [Java Collections Framework](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/doc-files/coll-overview.html)
- [Java `Collection` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Collection.html)
- [Java `Map` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Map.html)

## Recommended Next

- [Collection contracts and selection](./COLLECTION-CONTRACTS-AND-SELECTION.md)
- [Safe collection mutation](./SAFE-COLLECTION-MUTATION.md)
- [List overview](./list/LIST-OVERVIEW.md), [Set overview](./set/SET-OVERVIEW.md), and [Map overview](./map/MAP-OVERVIEW.md)
