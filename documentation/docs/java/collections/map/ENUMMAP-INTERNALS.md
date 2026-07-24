---
title: "EnumMap Internals and Usage"
description: "EnumMap ordinal-indexed array storage, methods, complexity, null rules, declaration-order iteration, and enum-key use cases."
sidebar_label: "EnumMap"
tags: [java, collections, map, enummap, internals]
page_type: "Deep Dive"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-24"
---

# EnumMap Internals and Usage

`EnumMap<K extends Enum<K>,V>` stores values in an array indexed by each enum
constant's ordinal.

```text
OrderStatus: CREATED  PAID  SHIPPED
values:      [policyA][null][policyB]
```

## Storage And Defaults

Construction requires the enum key type or another compatible `EnumMap`/map.
The internal value array is sized for the enum universe; there is no hash table,
load factor, collision chain, or resize as entries are added. Keys iterate in
enum declaration order.

Null keys are rejected. Null values are allowed and represented internally so
they can be distinguished from an unused slot.

## How Operations Work

`get`, `put`, `containsKey`, and `remove` validate the enum type and address one
ordinal-indexed array slot, giving constant-time behavior with small constants.
Iteration scans the enum universe, so cost relates to the number of constants as
well as mappings.

## Important Methods

Normal map methods apply: `getOrDefault`, `put`, `putAll`, `computeIfAbsent`,
`merge`, `keySet`, `values`, and `entrySet`. `clone` creates a shallow map copy;
stored values themselves are not deep-copied.

## Example

```java
EnumMap<OrderStatus, Set<OrderStatus>> transitions =
        new EnumMap<>(OrderStatus.class);
transitions.put(OrderStatus.CREATED,
        EnumSet.of(OrderStatus.PAID, OrderStatus.CANCELLED));
```

This combines compact enum-key and enum-value-set storage for a process-local
transition policy.

## When To Use

Use when every key comes from one enum type: policy tables, state handlers,
configuration by mode, or counters by status. Prefer it over `HashMap<Enum,...>`
for clearer intent and compact storage. Do not persist ordinal-indexed internals;
reordering enum declarations changes ordinal positions. It is not thread-safe.

## Official References

- [Java 25 `EnumMap` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/EnumMap.html)
- [OpenJDK `EnumMap` source](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/EnumMap.java)
