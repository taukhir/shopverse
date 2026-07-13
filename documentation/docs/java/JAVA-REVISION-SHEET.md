---
title: Java Lead Interview Revision Sheet
description: Compact senior Java revision checklist covering language, collections, concurrency, JVM, diagnostics and architecture.
---

# Java Lead Interview Revision Sheet

## Language

- Overloading is compile-time; overriding is runtime; static methods and fields hide.
- Widening is considered before boxing; varargs is a later applicability phase.
- Java copies values, including reference values.
- Constructor-time virtual dispatch can observe uninitialized child state.
- Generics erase; bridge methods preserve overriding.
- Equal objects require equal hashes; mutable hash keys are invalid designs.

## Collections

- Array locality often beats linked-node theoretical advantages.
- `HashMap`: spread, bucket, equality, resize, tree bins, load factor.
- `ConcurrentHashMap`: lock-free-style reads, empty-bin CAS, bin coordination,
  cooperative resize and one-key atomicity.
- Tree uniqueness uses comparison zero, not necessarily `equals`.
- Unmodifiable view is not immutable snapshot.
- Thread-safe unbounded queues are still overload hazards.

## Concurrency

- State the invariant and happens-before edge.
- `volatile` is visibility/order, not compound atomicity.
- `wait` releases one monitor; `sleep` releases none.
- Pool capacity = workers + queue + rejection behavior + downstream bound.
- ForkJoin: local LIFO, opposite-end stealing, fork-one/compute-one.
- Virtual threads reduce blocking-thread cost, not DB/CPU limits.
- Cancellation is cooperative; timeouts do not automatically undo work.

## Streams

- Terminal operation drives lazy fused stages.
- Stateful operations buffer/coordinate.
- Spliterator quality determines parallel decomposition.
- Reduction must be associative and identity-compatible.
- Parallel streams commonly share the common pool; avoid blocking I/O.

## JVM

- Class identity includes defining loader.
- Source allocation may be scalar-replaced; measure allocation.
- `-Xmx` excludes stacks, metaspace, code cache and direct/native memory.
- Collector choice depends on SLO, live set, allocation and CPU/headroom.
- Correlate JFR, GC/safepoint logs, thread/heap evidence and dependency spans.

## Answer Formula

For every senior answer give: rule, runtime mechanism, failing scenario,
production trade-off, diagnostic evidence and safer alternative.

## Official References

- [JLS](https://docs.oracle.com/javase/specs/jls/se25/html/index.html)
- [JVMS](https://docs.oracle.com/javase/specs/jvms/se25/html/index.html)

## Recommended Next

Attempt [Java Timed Mock Interviews](./JAVA-TIMED-MOCK-INTERVIEWS.md).
