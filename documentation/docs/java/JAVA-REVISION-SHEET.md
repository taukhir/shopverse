---
title: Java Lead Interview Revision Sheet
description: Compact senior Java revision checklist covering language, collections, concurrency, JVM, diagnostics and architecture.
status: maintained
last_reviewed: "2026-07-30"
page_type: Guide
difficulty: Intermediate
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: repository-content-audit
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

## Production Interview Questions

### Why must `equals` and `hashCode` agree?

Equal objects must produce equal hashes so hash collections can locate the same logical key. Mutating a field
used by either method after insertion can make an entry unreachable or permit logical duplicates. Prefer stable
identity/value keys and test equality properties.

### What does PECS mean, and what does type erasure remove?

Use `? extends T` when reading T values and `? super T` when supplying T values. Erasure removes most generic
type arguments at runtime, adds casts and may create bridge methods; it prevents `new T()`, generic arrays and
ordinary `instanceof List<String>` checks.

### ArrayList versus LinkedList?

ArrayList usually wins through locality, compact memory and O(1) indexed access. LinkedList offers constant-time
link changes only after a node is already located and pays allocation/cache costs. Select from measured access
patterns, not Big-O alone.

### Is one operation on ConcurrentHashMap a business transaction?

Individual map operations have thread-safety guarantees, but a read-then-decide-then-write sequence is not
atomic. Use `compute`, compare-and-set state, a lock around the invariant, or authoritative transactional
storage. The mapping function must remain bounded and side-effect aware.

### `volatile`, `synchronized`, lock, or atomic variable?

`volatile` provides visibility and ordering for one field, not compound atomicity. Atomics provide CAS-based
updates for suitable state. Monitors and locks protect multi-field invariants and may coordinate conditions.
Choose from the invariant, contention and cancellation requirements.

### What is a happens-before relationship?

It is the Java Memory Model ordering that makes earlier writes visible to a later action, created by mechanisms
such as monitor unlock/lock, volatile write/read, thread start/join and task handoff. Without it, a data race can
observe stale or inconsistent state even when a test usually passes.

### Deadlock, livelock, and starvation?

Deadlock waits in a cycle, livelock continually reacts without progress, and starvation denies one participant
adequate service. Capture thread/lock evidence, impose lock ordering and time bounds, minimize critical sections,
and avoid assuming fairness unless the primitive guarantees it.

### How do you size a thread pool?

CPU-bound work is constrained by available processors; blocking work also depends on wait/service ratio, memory,
queueing and downstream capacity. Define workers, bounded queue, rejection, deadlines and ownership together,
then validate latency and saturation under load.

### Why does a CompletableFuture timeout not stop the work?

Timeout may only complete the dependent stage exceptionally while the supplier or remote operation continues.
Propagate a real deadline/cancellation to the underlying client, make side effects idempotent, and reconcile an
ambiguous result rather than assuming rollback.

### When should virtual threads be used?

They simplify high-concurrency blocking code by reducing thread cost, but do not increase CPU, database
connections or downstream quotas. Bound scarce resources explicitly, inspect pinning/carrier starvation, and
prefer asynchronous APIs where their streaming/backpressure model is the actual requirement.

### Record, sealed class, or ordinary class?

Records model shallowly immutable data carriers with generated value semantics; sealed hierarchies bound known
subtypes; ordinary classes suit mutable identity, lifecycle and unrestricted extension. Evolution and framework
serialization compatibility still require explicit review.

### How does class loading affect type identity and leaks?

Runtime type identity is class name plus defining loader. Parent delegation protects core consistency, while
plugin/application loaders create isolation. Long-lived threads, ThreadLocals, drivers or caches retaining an
old loader can prevent unloading after redeploy.

### Why can a container be OOM-killed below `-Xmx`?

The process also consumes metaspace, code cache, thread stacks, direct buffers, native libraries, page cache and
sidecars within the cgroup. Correlate RSS, cgroup events, native-memory/JFR evidence and kernel logs; a heap dump
alone may show no heap leak.

### G1 versus ZGC?

Choose from pause SLO, live set, allocation rate, CPU and memory headroom, JDK/container constraints and
operational evidence. ZGC targets low pauses with concurrent work; G1 is a balanced general-purpose choice.
Measure complete throughput and p99 rather than selecting from collector reputation.

### How do you prove a Java performance or concurrency fix?

Reproduce the failure with a controlled workload, retain thread/JFR/GC/profile evidence, state the invariant,
add a deterministic stress or regression test where possible, and compare the same workload before and after.
One unrepeated benchmark or disappearance of the symptom is insufficient.

## Official References

- [JLS](https://docs.oracle.com/javase/specs/jls/se25/html/index.html)
- [JVMS](https://docs.oracle.com/javase/specs/jvms/se25/html/index.html)

## Recommended Next

Attempt [Java Timed Mock Interviews](./JAVA-TIMED-MOCK-INTERVIEWS.md).
