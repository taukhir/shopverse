---
title: Comparable, Comparator And Sorted Collections Deep Dive
description: Ordering contracts, composition, overflow, equality consistency, TreeMap uniqueness, PriorityQueue and sorting scenarios.
---

# Comparable, Comparator And Sorted Collections Deep Dive

`Comparable<T>` defines one natural ordering owned by the type. `Comparator<T>`
defines external, composable orderings. Both must provide a stable sign contract:
antisymmetry, transitivity and consistent zero relationships.

## Natural Ordering

```java
record Version(int major, int minor) implements Comparable<Version> {
    @Override public int compareTo(Version other) {
        int byMajor = Integer.compare(major, other.major);
        return byMajor != 0 ? byMajor : Integer.compare(minor, other.minor);
    }
}
```

Never subtract to compare:

```java
// return this.id - other.id; // overflow can invert ordering
return Integer.compare(this.id, other.id);
```

## Comparator Composition

```java
Comparator<Order> byCustomerThenTime =
        Comparator.comparing(Order::customerId,
                Comparator.nullsLast(String::compareTo))
            .thenComparing(Order::createdAt)
            .thenComparingLong(Order::id);
```

The final stable tie-breaker matters when a deterministic total order is required
for pagination or reproducible output. A comparator reading mutable fields can
make an existing tree/heap structurally inconsistent after mutation.

## Equality Consistency

Sorted maps/sets treat `compare(a,b)==0` as key equality. If `equals` disagrees,
logically unequal objects can replace each other or be rejected.

```java
record Product(String sku, String displayName) {}
var set = new TreeSet<Product>(Comparator.comparing(Product::sku));
set.add(new Product("A", "old"));
set.add(new Product("A", "new")); // second element is comparator-duplicate
```

This can be intentional for an index, but must be documented. `BigDecimal` is a
classic case: `1.0` and `1.00` compare numerically equal while `equals` differs.

## TreeMap, TreeSet And Range Views

Red-black trees provide logarithmic lookup/update and ordered traversal. Range
views (`subMap`, `headMap`, `tailMap`) are backed views with enforced key bounds.
Mutation through either view/original is visible. Null behavior depends on the
comparator; natural-order trees reject null.

## PriorityQueue

A binary heap guarantees only that the head is least according to the comparator.
Iteration is not sorted. Removing an arbitrary element is linear. Changing a
priority field in place does not reheapify; remove/reinsert or use immutable jobs.

## Sorting Stability And Performance

Object sorting is stable in the specified library contracts where documented;
primitive algorithms differ. Comparator cost is multiplied O(n log n), so avoid
remote calls, parsing and allocation inside comparisons. Precompute sort keys
when profiling justifies it.

## Scenario Failures

1. Subtraction comparator overflows.
2. Comparator returns only `1` or `0`, violating antisymmetry.
3. Random comparator violates transitivity and sorting may throw.
4. Mutable tree key becomes unreachable by its new order.
5. Case-insensitive set collapses strings that `equals` considers different.
6. Priority mutation leaves the heap head incorrect.

## Tricky Interview Questions

1. Must natural ordering be consistent with equals? Strongly recommended; document exceptions.
2. Does `TreeMap` call `hashCode`? No.
3. Is `PriorityQueue` iteration ordered? No.
4. Why add an ID tie-breaker? To create deterministic total ordering.
5. Can a comparator safely perform database calls? It is semantically possible but operationally disastrous and can be inconsistent.

## Official References

- [`Comparable`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Comparable.html)
- [`Comparator`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Comparator.html)
- [`TreeMap`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/TreeMap.html)

## Recommended Next

Continue through the [Collections Learning Guide](./JAVA-COLLECTIONS-UMBRELLA.md).
