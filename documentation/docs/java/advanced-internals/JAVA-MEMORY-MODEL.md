---
title: Java Memory Model, Visibility, And Safe Publication
difficulty: Advanced
page_type: Concept
status: maintained
keywords: [Java Memory Model, happens-before, volatile, atomic, locks, final field, safe publication, data race, CPU cache]
learning_objectives: [Reason with happens-before instead of timing, Distinguish visibility ordering and atomicity, Select volatile atomics or locks, Publish objects safely]
technologies: [Java]
last_reviewed: "2026-08-03"
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: repository-content-audit
visual_required: true
---

# Java Memory Model, Visibility, And Safe Publication

![Safe publication from one thread to another using a release and acquire happens-before edge](/img/diagrams/jmm-happens-before.svg)

*Program order plus a matching synchronization edge makes prior writes visible
to the observing thread. Elapsed time, a context switch, logging, or “the caches
probably synchronized” is never the proof.*

For physical storage—heap, stacks, frames, PC registers, native memory,
`ThreadLocal`, TLABs, statics, enums, objects, and collections—start with the
[complete JVM memory overview](../JAVA-JVM-MEMORY.md). This page answers the
different question: **which write is a read allowed to see?**

## Page Overview

This page defines visibility, ordering, atomicity, data races, and happens-before
before applying them to `volatile`, locks, atomics, final fields, safe publication,
collections, and `ThreadLocal`. It then tests the model against compound actions,
CPU-cache explanations, false sharing, lifecycle failures, and a proof procedure
for concurrent designs.

## Prerequisites

Read [JVM Memory Areas](../JAVA-JVM-MEMORY.md) first so physical storage is not
confused with visibility guarantees. You should understand objects, fields,
threads, locks, and basic collections; this page defines `volatile`, atomics,
happens-before, and safe publication from first principles.

## How It Works: The JMM Contract

Source code is transformed by the compiler, JIT, CPU, and cache hierarchy. The
JMM permits optimizations as long as each execution obeys its rules. It defines:

- **visibility**: whether a read is guaranteed to observe a write;
- **ordering**: which actions must appear before other actions;
- **atomicity**: whether an operation can be observed part-completed;
- **initialization safety**: guarantees for correctly constructed final fields;
- **legal outcomes** for correctly synchronized and racy programs.

Sequential consistency is the simple mental model in which all actions appear
in one global order consistent with every thread's program order. Correctly
synchronized programs receive this useful guarantee; racy programs do not.

## Shared Memory And Working Memory

The JLS uses an abstract model in which threads act on variables through local
execution state and shared memory. “Working memory” is **not** a concrete Java
memory region or a synonym for L1 cache. A value may be in a register, cache
line, RAM, optimized away, or reconstructed. Hardware cache coherence alone is
not a Java happens-before edge.

![Animation of ordinary access lacking a happens-before edge followed by volatile publication and observation](/img/diagrams/jmm-volatile-visibility.gif)

*The animation shows logical states, not literal cache flush instructions: first
there is no ordering edge; then a volatile write and later read establish
happens-before; finally the consumer may rely on writes that preceded publication.*

## Data Race, Race Condition, And Atomicity

A **data race** exists when two threads perform conflicting accesses to the same
variable, at least one is a write, and the accesses are not ordered by happens-
before. A **race condition** is broader: correctness depends on an unfortunate
interleaving, even if individual operations are thread-safe.

```java
volatile int count;
count++; // read, add, write: three logical actions, not one atomic update
```

`volatile` fixes visibility of `count`; it does not make the compound update
atomic. Use `AtomicInteger.incrementAndGet()`, `LongAdder` for suitable metrics,
or a lock protecting the full invariant.

## Happens-Before Rules

If action A happens-before action B, the effects of A are visible to B and A is
ordered before B. The essential edges are:

1. **Program order:** each action in a thread happens-before later actions in
   that thread according to intra-thread semantics.
2. **Monitor:** unlock of monitor `m` happens-before every subsequent lock of
   `m`.
3. **Volatile:** write to volatile `v` happens-before every subsequent read of
   `v` that follows it in the synchronization order.
4. **Thread start:** actions before `Thread.start()` happen-before actions in the
   started thread.
5. **Thread termination/join:** all actions in a thread happen-before another
   thread detects its termination, including successful return from `join()`.
6. **Default initialization:** zero/default initialization happens-before other
   actions on the object.
7. **Finalizer:** constructor completion happens-before the start of that
   object's finalizer (finalization is deprecated and should not be designed in).
8. **Transitivity:** if A happens-before B and B happens-before C, A happens-
   before C.

Concurrency APIs add documented edges. For example, actions before submitting a
task to an `Executor` happen-before its execution begins; actions in an async
computation happen-before retrieval through the corresponding `Future.get()`.
Read the API contract rather than inferring guarantees from implementation.

## Volatile: Exact Guarantee

```java
final class Mailbox {
    private int payload;
    private volatile boolean ready;

    void publish(int value) {
        payload = value; // ordinary write
        ready = true;    // volatile write (release)
    }

    int consume() {
        if (!ready) {    // volatile read (acquire)
            throw new IllegalStateException("not ready");
        }
        return payload;  // sees the write before publication
    }
}
```

The proof is:

```text
payload write
  → program order
volatile ready write
  → synchronizes-with / happens-before
volatile ready read
  → program order
payload read
```

Transitivity makes the payload visible. Volatile does not promise fairness,
mutual exclusion, transaction boundaries, immediate scheduling, or a physical
write-through to RAM. A polling loop can also waste CPU; use blocking
coordination when waiting is expected.

## Locks And Monitors

```java
synchronized (lock) {
    balance -= amount;
    audit.add(entry);
}
```

Mutual exclusion protects the compound invariant, and monitor unlock/lock
creates visibility and ordering. Every access participating in the invariant
must follow the same locking protocol. Locking one object while reading under a
different lock provides no shared proof.

`ReentrantLock` has equivalent lock/unlock memory effects and adds timed,
interruptible, and condition-based coordination. Always release it in `finally`.
Read/write locks help only when measured contention and workload shape justify
their complexity.

## Atomics And Memory Effects

Atomic classes provide indivisible operations on one logical variable, normally
using compare-and-set (CAS).

```java
AtomicReference<State> state = new AtomicReference<>(State.NEW);
boolean started = state.compareAndSet(State.NEW, State.STARTED);
```

CAS atomically checks the observed value and installs an update. A CAS loop must
recompute from the newly observed state and can starve under contention. ABA
means a value changes A→B→A while CAS sees A at both ends; use a version/stamp
when the intermediate history matters.

`LongAdder` spreads updates to reduce contention but `sum()` is not an atomic
transactional snapshot. Atomic fields also do not automatically protect
invariants spanning several fields or objects.

`VarHandle` exposes modes such as plain, opaque, acquire, release, and volatile.
Use the weakest mode only with a documented proof and stress validation; plain
access is not a substitute for safe publication.

## Safe Publication

Publishing means making a reference available to another thread. Safe choices
include:

- class initialization and static initializers;
- a volatile reference;
- a reference written and read under the same lock;
- thread-safe collections and queues according to their documented contracts;
- thread start, executor submission, futures, and other specified lifecycle edges;
- immutable data whose construction is correctly completed and published.

```java
final class Snapshot {
    private final Map<String, Long> totals;

    Snapshot(Map<String, Long> input) {
        this.totals = Map.copyOf(input);
    }

    Map<String, Long> totals() {
        return totals;
    }
}
```

Final fields receive special initialization safety when `this` does not escape
during construction. Final makes the reference stable; it does not make a
mutable referenced object immutable. Copy mutable input or expose a controlled
view.

### Static Variables And Class Initialization

JVM class initialization is synchronized. Completion of a class or interface
initializer happens-before the first active use that triggers or follows that
initialization. This makes the initialization-on-demand holder idiom safe:

```java
final class Registry {
    private Registry() {}

    private static final class Holder {
        static final Registry INSTANCE = new Registry();
    }

    static Registry instance() {
        return Holder.INSTANCE;
    }
}
```

Static does not make later mutation thread-safe. A mutable static collection
still needs a concurrency policy and a memory/lifecycle bound.

### Double-Checked Locking

```java
private static volatile Service instance;

static Service instance() {
    Service local = instance;
    if (local == null) {
        synchronized (Service.class) {
            local = instance;
            if (local == null) {
                local = new Service();
                instance = local;
            }
        }
    }
    return local;
}
```

The reference must be volatile; otherwise another thread may observe publication
without the required initialization ordering. Prefer class initialization or a
dependency-injection lifecycle when possible.

## Collections And Compound Actions

Thread-safe collection methods protect their specified operations, not arbitrary
sequences around them.

```java
// Racy check-then-act even with a synchronized map wrapper
if (!map.containsKey(key)) {
    map.put(key, load(key));
}

// One atomic map operation under ConcurrentHashMap's contract
map.computeIfAbsent(key, this::load);
```

Even `computeIfAbsent` requires a side-effect-safe mapping function and does not
create a transaction with external systems. Copy-on-write collections favor
reads and penalize writes; concurrent queues and maps have operation-specific
visibility guarantees. Select from semantics and workload evidence.

## ThreadLocal And Context Propagation

`ThreadLocal` prevents accidental sharing of a value between threads; it does
not publish data to another thread and creates no cross-thread happens-before
edge. Executor tasks may run on different reused workers, so context must be
captured and restored explicitly, with cleanup. For storage and leak mechanics,
see [the ThreadLocal storage diagram](../JAVA-JVM-MEMORY.md#threadlocal-where-it-is-really-stored).

## CPU Caches, Barriers, And False Sharing

JITs map JMM guarantees onto platform instructions and compiler barriers. The
mapping differs across x86, ARM, and other architectures. Application code should
reason from Java semantics, not assume a particular fence or cache flush.

False sharing occurs when independent frequently written fields occupy the same
hardware cache line, forcing coherence traffic between cores. It is a performance
problem, not a data-race definition. Confirm it with profiling and benchmarks;
padding increases footprint and relies on layout/runtime details.

## Choosing The Primitive

| Need | Prefer | Why |
|---|---|---|
| immutable snapshot publication | final fields plus safe publication | simple proof and read path |
| one independent state flag | `volatile` | visibility/order without mutual exclusion |
| one counter/state transition | atomic class | indivisible supported operations |
| invariant across fields/collections | one lock or single-thread ownership | protects the whole transition |
| producer/consumer handoff | blocking/concurrent queue | state plus waiting policy in one abstraction |
| completion/result transfer | `Future`, `CompletableFuture`, structured task scope | documented lifecycle edge |
| high-contention telemetry counter | `LongAdder` | scalable updates when snapshot semantics allow |

## Boundaries And Trade-Offs

`volatile` is efficient for publication and independent state but cannot make a
multi-variable invariant atomic. Atomics support single-variable transitions,
yet retry loops can waste CPU under contention. Locks express compound invariants
and conditions but introduce blocking, ordering, and deadlock concerns. Concurrent
collections protect documented operations, not arbitrary business sequences.
Choose the smallest primitive whose contract proves the complete invariant.

## Common Failure Patterns

- using `sleep()`, logging, or debugger pauses as visibility mechanisms;
- declaring a reference volatile while mutating its object graph without a policy;
- believing `volatile count++` is atomic;
- locking different monitors for the same invariant;
- publishing `this` from a constructor;
- assuming a concurrent collection makes multi-call business logic atomic;
- forgetting that a pooled worker retains `ThreadLocal` values;
- treating observations on one CPU architecture as portable Java guarantees.

## How To Prove A Design

1. Name the shared variables and their invariants.
2. Identify every reader and writer.
3. Draw program-order edges inside each thread.
4. Name the exact synchronizes-with edge between threads.
5. Apply transitivity from producer writes to consumer reads.
6. Check compound atomicity separately from visibility.
7. Verify lifecycle, interruption, failure, and cleanup paths.
8. Use jcstress or another stress harness for allowed outcomes; ordinary unit
   tests cannot prove a racy outcome impossible.

## Lead-Engineer Concurrency Decision

Require the design to name state ownership, invariants, every reader and writer,
the exact happens-before edges, lifecycle cleanup, cancellation, overload, and
failure recovery. Review contention and fairness under representative concurrency,
not only correctness in a unit test. Record why ownership transfer, immutability,
queues, database constraints, or a simpler lock was rejected and which evidence
would trigger redesign.

## Tricky Interview Questions

<ExpandableAnswer title="Does volatile make count++ atomic?">

No. It provides visibility and ordering for volatile accesses, but `count++` is
a read-modify-write sequence.

</ExpandableAnswer>

<ExpandableAnswer title="Does volatile always read from RAM?">

No. That is a misleading hardware story. The contract is the volatile
happens-before rule and its visibility/ordering effects.

</ExpandableAnswer>

<ExpandableAnswer title="Where is a ThreadLocal value stored?">

Ordinarily on the heap, reachable through a map associated with the owning
`Thread`. Its isolation is logical, and a pooled thread can retain it.

</ExpandableAnswer>

<ExpandableAnswer title="Are local variables automatically safe?">

The frame slots are thread-private, but an object reached through a local
reference may be shared and mutable.

</ExpandableAnswer>

<ExpandableAnswer title="Is safe publication equivalent to immutability?">

No. Publication establishes visibility; immutability constrains later mutation.
Strong designs often use both.

</ExpandableAnswer>

## Recommended Next Page

[Concurrency Primitives And AQS](./CONCURRENCY-AQS-VIRTUAL-THREADS.md)

## Official References

- [JLS §17.4 — Memory Model](https://docs.oracle.com/javase/specs/jls/se25/html/jls-17.html#jls-17.4)
- [JLS §17.4.5 — Happens-before Order](https://docs.oracle.com/javase/specs/jls/se25/html/jls-17.html#jls-17.4.5)
- [JLS §17.5 — `final` Field Semantics](https://docs.oracle.com/javase/specs/jls/se25/html/jls-17.html#jls-17.5)
- [JLS §12.4.2 — Detailed Initialization Procedure](https://docs.oracle.com/javase/specs/jls/se25/html/jls-12.html#jls-12.4.2)
- [`java.util.concurrent` package memory-consistency properties](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/package-summary.html#MemoryVisibility)
- [`VarHandle` memory-ordering API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/invoke/VarHandle.html)
