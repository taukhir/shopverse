---
title: "EnumMap Internals and Usage"
description: "EnumMap ordinal-indexed array storage, methods, complexity, null rules, declaration-order iteration, and enum-key use cases."
sidebar_label: "EnumMap"
tags: [java, collections, map, enummap, internals]
page_type: Deep Dive
difficulty: Advanced
status: maintained
last_reviewed: "2026-07-24"
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: repository-content-audit
prerequisites: [Map contract, Java enums, arrays, and ordinal semantics]
learning_objectives: [Explain ordinal-indexed lookup, Distinguish absent from null-valued slots, Model bounded enum policies safely]
---

# EnumMap Internals and Usage

`EnumMap<K extends Enum<K>,V>` is a specialized map whose keys belong to one enum
type and whose values occupy an array indexed by enum ordinal. It replaces
general hashing with a finite key universe, giving compact storage, declaration-
order iteration, and explicit domain intent. This page also covers the enum-
evolution boundaries that matter in durable systems.

```text
OrderStatus: CREATED  PAID  SHIPPED
values:      [policyA][null][policyB]
```

## Page Overview

You will trace storage and lookup, distinguish missing and null-valued mappings,
build a transition-policy example, and evaluate type safety, concurrency, and
persistence edge cases.

## Core Terminology And Mental Model

- The **key universe** is the declaring enum's constants in declaration order.
- An **ordinal** is a process-level array index, not a stable persisted identifier.
- A **null sentinel** distinguishes mapped-to-null from absent internally.
- Iteration follows declaration order regardless of insertion order.

## Storage And Defaults

Construction requires the enum key type or another compatible `EnumMap`/map.
The internal value array is sized for the enum universe; there is no hash table,
load factor, collision chain, or resize as entries are added. Keys iterate in
enum declaration order.

Null keys are rejected. Null values are allowed and represented internally so
they can be distinguished from an unused slot.

## How It Works: Ordinal Addressing

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

## Failure Modes, Edge Cases, And Production Diagnostics

- Null keys fail immediately; validate external input before `Enum.valueOf`,
  which also rejects unknown names.
- Raw types can bypass key-family safety and fail at runtime. Do not expose raw
  maps across API boundaries.
- Null values make `get` ambiguous; use `containsKey` when absence matters.
- It is not thread-safe. Publish an immutable copy for read-only policy data or
  synchronize compound mutation.
- Persist enum names or explicit codes, never ordinals; declaration reordering
  must not reinterpret durable business data.

## When To Use

Use when every key comes from one enum type: policy tables, state handlers,
configuration by mode, or counters by status. Prefer it over `HashMap<Enum,...>`
for clearer intent and compact storage. Do not persist ordinal-indexed internals;
reordering enum declarations changes ordinal positions. It is not thread-safe.

## Tricky Interview Questions

1. **Is lookup implemented with hashing?** No, it validates the enum family and
   indexes storage by ordinal.
2. **Why can a sparse map scan many slots?** Iteration relates to the enum
   universe size, not only the number of mappings.
3. **Does cloning deep-copy values?** No; the structure is copied but referenced
   values remain shared.

## Architecture Decisions And Production Evidence

Treat the enum family as a versioned domain contract. Review serialization and
database compatibility when constants are renamed or removed, publish read-only
policy maps safely, and test unknown external values during rolling upgrades.

## Recommended Next

- [EnumSet internals](../set/ENUMSET-INTERNALS.md)
- [Map overview](./MAP-OVERVIEW.md)
- [Safe collection mutation](../SAFE-COLLECTION-MUTATION.md)

## Official References

- [Java 25 `EnumMap` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/EnumMap.html)
- [OpenJDK `EnumMap` source](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/EnumMap.java)
