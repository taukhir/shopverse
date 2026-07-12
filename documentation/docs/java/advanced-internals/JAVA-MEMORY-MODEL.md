---
title: Java Memory Model And Safe Publication
difficulty: Advanced
page_type: Concept
status: Generic
keywords: [Java Memory Model, happens-before, volatile, final field, safe publication, data race, false sharing]
learning_objectives: [Reason with happens-before instead of timing, Publish objects safely, Identify visibility ordering and atomicity failures]
technologies: [Java]
last_reviewed: "2026-07-12"
---

# Java Memory Model And Safe Publication

![Safe publication from one thread to another using a release and acquire happens-before edge](/img/diagrams/jmm-happens-before.svg)

*Program order plus a matching synchronization edge lets the second thread
observe initialized state. Elapsed time alone does not establish visibility.*

The Java Memory Model defines which writes a read may observe under concurrency.
Sequential reasoning is valid only when synchronization establishes the required
ordering. A data race exists when conflicting accesses occur without a happens-
before relationship and at least one is a write.

## Happens-Before Edges

- program order within one thread;
- monitor unlock before a later lock of the same monitor;
- volatile write before a later read of that variable;
- actions before `Thread.start()` before the started actions;
- thread actions before another thread successfully returns from `join()`;
- executor/collection/future guarantees documented by their APIs;
- transitivity across edges.

Happens-before provides visibility and ordering; it does not make a compound
read-modify-write atomic. `volatile count++` still races.

## Safe Publication

Publish fully constructed immutable state through a static initializer, volatile
reference, lock-protected field, thread-safe collection, or framework guarantee.
Final fields receive special initialization safety when `this` does not escape
during construction. Final does not make referenced mutable objects immutable.

```java
final class Snapshot {
    private final Map<String, Long> totals;
    Snapshot(Map<String, Long> input) { totals = Map.copyOf(input); }
    Map<String, Long> totals() { return totals; }
}
```

Double-checked locking requires a volatile instance reference. Prefer initialization-
on-demand holder or dependency-injection lifecycle where possible.

## Atomics And Ordering

Atomic classes use compare-and-set and defined memory effects. CAS loops must
recompute from the observed state and may starve under contention. ABA means a
value changes A→B→A while a CAS observes only A; attach a version/stamp when the
intermediate history matters. `LongAdder` scales counters but `sum()` is not an
atomic transactional snapshot.

False sharing occurs when independent hot fields share cache lines and cores
invalidate each other's caches. Diagnose with evidence; padding increases memory
and relies on layout/runtime details.

## Failure Patterns

- check-then-act without one atomic boundary;
- mutable object published before construction completes;
- assuming sleep, logging, or a concurrent container protects external state;
- using thread-safe collections for multi-step invariants without coordination;
- believing x86 observations define portable Java semantics.

## Lab

Implement an unsafe lazy singleton, a volatile-correct version, and a holder-based
version. Use a stress harness—not an ordinary deterministic unit test—to search
for illegal outcomes. Document the happens-before proof for the correct designs.

## Recommended Next Page

[Concurrency Primitives And AQS](./CONCURRENCY-AQS-VIRTUAL-THREADS.md)

## Tricky Interview Questions

1. Does `volatile` make `count++` atomic? No.
2. Is safe publication equivalent to immutability? No.
3. Are racy programs sequentially consistent? Not necessarily.

## Official References

- [JLS §17.4 — Memory Model](https://docs.oracle.com/javase/specs/jls/se25/html/jls-17.html#jls-17.4)
- [JLS §17.4.5 — Happens-before Order](https://docs.oracle.com/javase/specs/jls/se25/html/jls-17.html#jls-17.4.5)
- [JLS §17.5 — `final` Field Semantics](https://docs.oracle.com/javase/specs/jls/se25/html/jls-17.html#jls-17.5)
- [`VarHandle` memory-ordering API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/invoke/VarHandle.html)
