---
title: List, Set, And Map Choices
description: Practical Java List, Set, and Map implementation choices with Shopverse examples.
---

# List, Set, And Map Choices

First select `List`, `Set`, or `Map` from the domain contract. Then choose the
implementation whose extra guarantee the use case actually needs.

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

## Decision Matrix

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

Implementation mechanics and memory trade-offs live in
[Collection Internals](../JAVA-COLLECTION-INTERNALS.md),
[Collection Implementations For Architects](../JAVA-COLLECTION-IMPLEMENTATIONS-ARCHITECT.md),
and [Specialized Collection Internals](../JAVA-SPECIALIZED-COLLECTIONS-INTERNALS.md).

Continue with [Safe Collection Mutation](./SAFE-COLLECTION-MUTATION.md), or
return to the [Collections umbrella](../JAVA-COLLECTIONS.md).

