---
title: JVM Memory Model — Complete Runtime Overview
status: maintained
last_reviewed: "2026-08-04"
page_type: Guide
difficulty: Intermediate
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: repository-content-audit
visual_required: true
keywords: [JVM memory, heap, stack, metaspace, ThreadLocal, TLAB, CPU cache, native memory]
learning_objectives: [Locate Java data in logical runtime areas, Separate JVM storage from JMM concurrency rules, Explain ThreadLocal and TLAB ownership, Diagnose heap and native-memory pressure]
technologies: [Java, JVM]
---

# JVM Memory Model — Complete Runtime Overview

**JVM memory** is the collection of logical runtime areas and physical process
memory used while a Java program executes. Start by learning which areas are
shared, which belong to one thread, and which resources live outside the Java
heap; only then connect storage to garbage collection and cross-thread visibility.

## Page Overview

This guide separates JVM storage from JMM visibility, maps object placement, and
ends with process budgets, failures, diagnostics, and deeper links.

## What Does "JVM Memory" Mean?

**JVM memory** is all memory used by a running Java Virtual Machine to execute
Java bytecode. The JVM specification defines logical **runtime data areas** for
objects, method calls, class information, and per-thread execution state. A JVM
implementation such as HotSpot maps those logical areas onto heap memory,
native memory, operating-system threads, registers, and other process resources.

This page uses two related definitions:

- **JVM runtime memory** answers *where data is logically stored while Java runs*.
- **Java Memory Model (JMM)** answers *when writes by one thread must be visible
  to another thread and which instruction orderings are legal*.

:::tip Short mental model
The **heap and method area are shared**. Each platform thread has its own
**Java stack, program counter, and native-call state**. The whole JVM process
also consumes native memory for metaspace, code cache, direct buffers, thread
stacks, GC structures, JIT structures, agents, and libraries.
:::

## Prerequisites

You need only basic Java classes, objects, methods, references, and threads. If
static fields, object references, or method calls are unfamiliar, read
[Java Fundamentals](./JAVA-FUNDAMENTALS.md) first. Garbage collectors, JIT
internals, CPU caches, and concurrency primitives are introduced only after the
runtime areas have been defined.

## JVM Runtime Data Areas At A Glance

These are the areas named by the JVM specification, followed by important
HotSpot/process areas that engineers must monitor in production.

| Memory area | Ownership | What it stores | Typical failure or pressure |
|---|---|---|---|
| **Heap** | shared by all threads | objects, arrays, collection objects and their backing storage, enum instances, interned `String` objects | `OutOfMemoryError: Java heap space`, long GC pauses |
| **Method area** | shared by all threads | logical class-level data: runtime constant pools, field and method information, method code and other loaded-type metadata | implementation-specific metadata exhaustion |
| **Runtime constant pool** | one per loaded class or interface; logically part of method area | symbolic references and constants created from the class file plus runtime additions | class-loading or metadata pressure |
| **Java stack** | one per JVM thread | one stack frame per active Java method call | `StackOverflowError`; native-memory pressure from many platform threads |
| **Stack frame** | one active method invocation | local-variable array, operand stack, dynamic-linking information, and normal/exceptional return state | deep recursion or oversized call depth |
| **Program counter (PC)** | one per JVM thread | current JVM instruction for a non-native method | not independently tunable; part of thread execution state |
| **Native method stack** | normally per platform thread; implementation-specific | JNI/native calls and native execution frames | native stack exhaustion or process-memory pressure |
| **HotSpot metaspace** | shared native memory, organized by class loader | HotSpot's Java 8+ storage for most class metadata; implements the method-area requirement | `OutOfMemoryError: Metaspace` |
| **Code cache** | shared native memory | JIT-compiled machine code and related metadata | code-cache-full warnings, reduced compilation/optimization |
| **Direct/native buffers** | native memory; may be shared | NIO direct buffers, memory mappings, FFM/JNI-managed regions | `OutOfMemoryError: Direct buffer memory` or container/process OOM |
| **TLAB** | allocation reservation for one thread inside the shared heap | space from which that thread can allocate objects quickly | allocation/GC pressure; it is not a separate memory region |

### Heap Versus Stack In One Example

```java
User createUser(long id) {
    String label = "Ahmed";
    User user = new User(id, label);
    return user;
}
```

- the invocation of `createUser` has a **stack frame**;
- the primitive `id` and references `label` and `user` occupy logical local
  slots in that frame, although the JIT may keep or eliminate them differently;
- the `User` and `String` objects are on the **heap**;
- returning `user` removes the frame, but the `User` remains alive while it is
  reachable from another GC root or live object.

## Java 7 Versus Java 8 Memory Changes

The JVM specification's logical runtime areas did not suddenly become a new
model in Java 8. The major change developers usually mean is the **HotSpot
implementation's replacement of PermGen with metaspace**.

| Topic | Java 7 HotSpot | Java 8 HotSpot |
|---|---|---|
| Class-metadata storage | **Permanent Generation (PermGen)**, a managed JVM memory region | **Metaspace**, allocated from native memory and managed in arenas associated with class loaders |
| Main limit | `-XX:PermSize`, `-XX:MaxPermSize` | `-XX:MetaspaceSize`, optional `-XX:MaxMetaspaceSize`; compressed class space has separate controls when enabled |
| Default growth behavior | bounded by the configured/default maximum PermGen size | can grow with native memory unless capped, so the process/container limit becomes important |
| Common exhaustion message | `OutOfMemoryError: PermGen space` | `OutOfMemoryError: Metaspace` or a process/container OOM when native memory is exhausted |
| Class unloading | reclaims metadata only when the defining class loader and its classes can be unloaded | same reachability principle; loader-scoped metaspace chunks make reclamation align with class-loader unloading |
| Interned strings | stored on the ordinary Java heap in HotSpot Java 7; this move occurred before Java 8 | remain on the ordinary Java heap |
| Heap generations | young and old generations; collector/layout details depend on selected GC | young and old generations remain; PermGen removal does **not** remove generational heap organization |

```text
Java 7 HotSpot process                 Java 8 HotSpot process
├─ Java heap                           ├─ Java heap
│  ├─ young generation                 │  ├─ young generation
│  ├─ old generation                   │  └─ old generation
│  └─ interned strings                 ├─ native metaspace (class metadata)
├─ PermGen (class metadata)            ├─ code cache / thread stacks / direct memory
└─ other native memory                 └─ other native memory
```

Metaspace is **not part of `-Xmx`**. Removing PermGen therefore removed
`MaxPermSize`, but it did not remove class-metadata leaks: retaining application
class loaders can still retain their classes, static state, and metadata.

![Conceptual overview of the JVM heap, metaspace, per-thread areas, synchronization, CPU cache levels, and RAM](/img/diagrams/jvm-memory-concurrency-overview.png)

*Use this illustration as an orientation map. The exact diagrams below are the
source of truth: the JVM specification defines logical runtime areas, while the
Java Memory Model defines legal observations between threads.*

## Complete JVM + JMM Poster

![Complete twelve-panel JVM memory and Java Memory Model reference covering runtime areas, stack frames, ThreadLocal, TLAB, CPU caches, volatile, happens-before, locks, atomics, collections, safe publication, leaks, and OOM sources](/img/diagrams/jvm-memory-complete-reference-poster.svg)

*This repository-owned poster is the authoritative visual: its labels are
deterministic, searchable, and aligned with the explanations on this page.*

![Illustrated complete-view JVM memory and Java Memory Model poster with twelve numbered learning panels](/img/diagrams/jvm-memory-complete-poster.png)

*The illustrated version follows the same learning sequence and is useful for
quick revision. Use the SVG above and the page text when exact wording matters.*

## First: Two Different “Memory Models”

Java developers often mix two related but different maps:

| Map | Question it answers | Defined by |
|---|---|---|
| JVM runtime data areas | Where do frames, objects, class metadata, and native structures live? | JVM specification plus JVM implementation |
| Java Memory Model (JMM) | When may one thread observe another thread's write? | Java Language Specification |

The JMM does **not** say that every Java variable has a permanent copy in an L1,
L2, or L3 cache. It permits implementations to use registers, caches, RAM, and
compiler optimizations as long as observable behavior obeys JMM rules. Continue
to [Java Memory Model And Safe Publication](./advanced-internals/JAVA-MEMORY-MODEL.md)
for volatile, atomics, locks, and happens-before.

## Runtime Area Mechanics: Complete Storage Map

![Complete JVM storage map separating shared heap and metadata, per-thread stacks and program counters, and native process memory](/img/diagrams/jvm-memory-complete-map.svg)

*Solid borders are logical ownership boundaries. References can cross those
boundaries: a stack slot can point to an object in the shared heap, and a
`ThreadLocalMap` owned by a heap-resident `Thread` can retain another heap object.*

## What Is Stored Where?

| Java concept | Logical location | Shared? | Important nuance |
|---|---|---:|---|
| object instance | heap | yes | Escape analysis may eliminate or scalar-replace an allocation; do not depend on a physical address |
| array or collection | heap | yes | A collection object and its backing array/nodes are separate heap objects |
| instance field | inside its heap object | yes if object is shared | Primitive bits or a reference; referenced object lives separately |
| local primitive | current stack frame's local-variable array | no | JIT may keep it in a register or eliminate it |
| local object variable | reference in a frame; object on heap | reference is per-thread | Sharing the reference target requires synchronization when it is mutable |
| parameters and return bookkeeping | stack frame | no | A frame also has an operand stack and constant-pool/frame metadata |
| static field | associated with a loaded class | yes | Language-level global state; exact physical representation is implementation-specific; referenced objects are ordinarily on heap |
| enum constant | singleton object referenced by static fields of enum class | yes | Enum metadata belongs to the loaded class; each constant is an object |
| string literal / interned string | intern-pool reference to a `String` object | yes | In HotSpot, interned strings are heap objects; the class-file constant pool is different |
| class metadata | method area; HotSpot uses native metaspace | yes | Includes runtime constant pool, field/method metadata, bytecode-related structures |
| JIT-compiled machine code | code cache | yes | Native process memory, not Java heap |
| stack frame | Java stack of one platform thread | no | One frame per active method invocation |
| program counter | per JVM thread | no | Identifies the current JVM instruction; undefined by the JVMS while executing native code |
| native call state | native method stack / OS stack | no | Exact organization is JVM and OS specific |
| `ThreadLocal` value | heap, reachable from the current `Thread`'s `ThreadLocalMap` | logically thread-confined | It is not stored “on the stack”; pooled threads can retain it indefinitely |
| lock monitor | associated with an object plus JVM/OS lock structures | shared | `synchronized` locks an object or the `Class` object for a static synchronized method |
| `AtomicInteger` value | field inside an atomic heap object | yes | Operations have specified atomicity and memory effects; it is not a special memory area |
| TLAB | reserved slice of the shared heap for one allocating thread | exclusive allocation ownership | TLAB means thread-local **allocation buffer**, not ThreadLocal and not CPU cache |
| direct buffer / memory-mapped region | native memory, referenced by a heap object | potentially shared | Counts toward process/container memory, not `-Xmx` |

“Global” in Java normally means reachable shared state—static fields, singletons,
shared objects, or class metadata—not a separate global-memory region.

## Per-Thread Stack And Stack Frame

Each JVM thread has a private Java stack. A method call pushes a frame; return or
abrupt completion pops it.

```text
top of one thread's stack
┌────────────────────────────────────┐
│ process(Order order)               │
│ locals: [this ref, order ref, i]   │
│ operand stack: [... intermediate]  │
│ frame data: return/constant-pool   │
├────────────────────────────────────┤
│ controller(...)                    │
├────────────────────────────────────┤
│ run()                              │
└────────────────────────────────────┘
bottom
```

Primitive local values can be held directly in local slots; a local reference
points to an object that ordinarily lives on the heap. Stack confinement is a
reason locals are naturally thread-specific, but any heap object they reference
can still be shared or escape.

Unbounded recursion, cyclic `toString()`/serialization, or unexpectedly deep
input can exhaust a stack and cause `StackOverflowError`. Increasing `-Xss` is
not the first fix because it also increases per-platform-thread memory demand.

## Heap: Objects, Arrays, Collections, Statics, And Enums

The heap is shared and garbage collected. Reachability, not age or business
usefulness, determines whether an object can be reclaimed.

```java
static final List<Order> ORDERS = new ArrayList<>();

void handle(Order order) {
    int attempt = 1;
    ORDERS.add(order);
}
```

- `attempt` is a primitive local in the current frame (subject to JIT optimization).
- the local `order` slot contains a reference;
- the `Order`, `ArrayList`, backing array, and elements are heap objects;
- `ORDERS` is a static field and therefore a long-lived GC-root path while its
  class loader remains reachable.

Collections do not create a new memory area. `ArrayList` uses an object plus a
backing object array; `HashMap` uses a map, table array, and node/tree objects;
`ConcurrentHashMap` adds concurrency control but still holds ordinary heap
objects. Thread safety does not imply bounded memory.

## `ThreadLocal`: Where It Is Really Stored

![ThreadLocal values stored in a ThreadLocalMap reachable from a heap-resident Thread object, including the weak-key strong-value retention hazard](/img/diagrams/jvm-threadlocal-storage.svg)

*The owning thread supplies isolation, not a special memory segment. A map entry
uses a weak reference to the `ThreadLocal` key but a strong reference to its
value, so a live pooled thread can retain a stale value.*

```java
private static final ThreadLocal<RequestContext> CONTEXT = new ThreadLocal<>();

void process(RequestContext context) {
    CONTEXT.set(context);
    try {
        // business work
    } finally {
        CONTEXT.remove();
    }
}
```

Each platform `Thread` object has internal fields that can reference its
`ThreadLocalMap`. Entries are keyed by `ThreadLocal` identity. Because executor
workers are reused, request data must be removed in `finally`; otherwise the
worker's lifetime becomes the value's lifetime. Do not put secrets in thread
locals or propagate them blindly to asynchronous work.

## TLAB Versus ThreadLocal Versus CPU Cache

| Term | What it is | Where it belongs | Purpose |
|---|---|---|---|
| `ThreadLocal<T>` | Java API plus per-thread map entries | objects on heap | logical per-thread context |
| TLAB | per-thread allocation reservation | part of Java heap | fast allocation with less contention |
| CPU L1/L2/L3 cache | hardware cache lines | processor memory hierarchy | reduce RAM latency |

These three are unrelated mechanisms. An object allocated through a TLAB is not
therefore thread-confined; publishing its reference can make it shared.

## CPU Registers, L1/L2/L3, RAM, And the JMM

Typical hardware moves cache lines between registers/caches and main memory:

```text
registers → L1 (usually per core) → L2 (often per core) → L3 (often shared) → RAM
 fastest                                                               slowest
```

Actual topology varies by CPU. Cache coherence helps cores converge on values,
but it is not the Java synchronization contract. Compilers and CPUs may reorder,
combine, eliminate, or delay operations. Use `volatile`, locks, atomics, thread
lifecycle edges, or concurrency APIs to establish the required Java-level
happens-before relationship.

`volatile` is not “always read from RAM” and a volatile write need not literally
flush every cache. It guarantees that a write to a volatile variable happens-
before a subsequent read of that same variable, with the specified visibility
and ordering effects. It does not make `count++` atomic.

## Locks, Atomics, And Shared Variables

| Tool | Visibility/order | Atomicity | Best fit |
|---|---|---|---|
| `volatile` | yes, for the volatile synchronization edge | single read/write only; not compound updates | state flag, safely published snapshot |
| `synchronized` | unlock happens-before a later lock of same monitor | protects the whole critical section | multi-field invariant, simple mutual exclusion |
| `ReentrantLock` | lock/unlock memory effects like monitor locking | protects the whole critical section | timed/interruptible acquisition, multiple conditions |
| `AtomicInteger` / `AtomicReference` | specified volatile-like and CAS effects | supported single-variable operations | lock-free counters/state transitions |
| `LongAdder` | supports high-contention accumulation | `sum()` is not one transactional snapshot | metrics where exact instantaneous total is unnecessary |
| concurrent collection | documented per-operation guarantees | not automatically atomic across multiple calls | shared container with carefully designed compound actions |

## Shared Versus Thread-Specific Data

| Thread-specific by construction | Shared or potentially shared |
|---|---|
| current frames and local slots | heap objects whose references escape |
| program counter | static fields and singleton state |
| native call stack | enum constants and interned strings |
| logically isolated `ThreadLocal` value | locks, atomics, concurrent collections |
| TLAB allocation reservation | class metadata and code cache |

A local reference does not make its target thread-safe. Conversely, immutable
objects can be safely shared after correct publication.

## Boundaries And Trade-Offs

The JVM specification leaves physical layout and garbage-collector policy to
implementations. HotSpot may keep locals in registers, eliminate allocations,
change object layouts with flags, and organize heap/native regions differently
across versions. Write correctness against Java and JVM guarantees; use
HotSpot-specific details for measurement and tuning with the exact JDK and flags
recorded.

Memory choices also trade one resource for another. Larger heaps can reduce GC
frequency but increase footprint and worst-case work. Larger stacks reduce
overflow risk but increase native demand per platform thread. Unbounded
metaspace avoids a small fixed cap but can consume the process/container limit.

## Process Memory And Container Budget

```text
container / process memory
  = Java heap (-Xmx)
  + metaspace and compressed class space
  + code cache
  + platform-thread stacks
  + direct buffers and memory maps
  + GC/JIT/JVM native structures
  + JNI libraries and agents
  + sidecars and other processes in the same limit
```

A container can be OOM-killed while heap has room. Keep native headroom; do not
set `-Xmx` to the full container limit. Virtual threads greatly reduce the cost
of blocking concurrency, but carrier threads, mounted continuations, native
memory, and downstream resource limits still matter.

## Garbage Collection And Memory Leaks

GC starts from roots such as active thread stacks, static fields, JNI handles,
and live class loaders. A Java leak is an unwanted reachable graph:

```text
GC root → static cache / worker Thread → collection or ThreadLocalMap → stale data
```

The strongest production signal is a live-set baseline that continues to rise
after comparable GC cycles. Confirm with allocation/GC telemetry and a protected
heap dump, then inspect retained size, dominators, and paths to GC roots.

| OOM detail / symptom | Suspect first |
|---|---|
| `Java heap space` | retention, legitimate peak, oversized allocation, undersized heap |
| `Metaspace` | class-loader retention or generated-class growth |
| unable to create native thread | thread count, stack reservation, OS/container limits |
| direct buffer memory / rising RSS | direct buffers, mmap, JNI, native leak |
| container OOM kill without Java OOM | total RSS/cgroup limit and native headroom |

## Failure Modes And Common Mistakes

- equating JVM memory with only the Java heap or `-Xmx`;
- saying a local object "lives on the stack" when a local slot normally holds a
  reference to a heap object;
- treating the method area, HotSpot metaspace, and Java heap as identical
  physical regions;
- confusing `ThreadLocal`, TLAB allocation ownership, and CPU caches;
- assuming `volatile` makes compound actions atomic or bypasses every hardware
  cache literally;
- diagnosing a leak from one rising heap sample instead of retained paths and
  post-GC live-set growth;
- forgetting that pools, statics, listeners, caches, and class loaders can keep
  large graphs reachable.

## Diagnostic Commands

```bash
jcmd <pid> GC.heap_info
jcmd <pid> GC.class_histogram
jcmd <pid> Thread.print
jcmd <pid> VM.native_memory summary
jcmd <pid> GC.heap_dump /secure/path/app.hprof
```

Native Memory Tracking must be enabled before it can provide useful detail.
Heap dumps can pause the process, consume large disk space, and contain customer
data or secrets; plan access controls, storage, and deletion before capture.

## One-Minute Recall

- heap, metadata, and class/static state are shared;
- every JVM thread has its own PC and Java stack; native stack details vary;
- a stack reference can point to a shared heap object;
- `ThreadLocal` values are heap objects reached through the owning thread;
- TLAB is a heap-allocation optimization, not CPU cache;
- volatile gives visibility and ordering, not compound-operation atomicity;
- atomics and locks live in ordinary objects but impose defined memory effects;
- CPU caches explain the hardware cost, while happens-before is the Java proof;
- process memory is larger than the Java heap.

## Lead-Engineer Memory Budget

Budget heap, native regions, sidecars, and headroom together. Validate under load
and identify the constrained region before changing `-Xmx`.

## Tricky Interview Questions

<ExpandableAnswer title="Can a pod be OOM-killed while heap-after-GC is flat?">

Yes. Cgroups charge heap and native regions. Compare events, RSS, NMT, threads,
and direct buffers.

</ExpandableAnswer>

<ExpandableAnswer title="Does a local variable make the referenced object thread-safe?">

No. The slot is private, but the referenced object may be shared.

</ExpandableAnswer>

## Supplied Reference Posters

:::caution Read with the corrections on this page

Treat “working memory” as a JMM abstraction, not a literal per-thread CPU cache.
Do not interpret `volatile` as “always read from RAM” or as a mandatory physical
cache flush. Class metadata belongs to the logical method area—HotSpot normally
implements it with native metaspace—not to the Java heap.

:::

![User-supplied JVM runtime areas, JMM, volatile, cache hierarchy, heap versus stack, and concurrency tools reference poster](/img/diagrams/jvm-memory-reference-poster-runtime-jmm.png)

![User-supplied Java memory complete view showing shared heap, per-thread stacks, ThreadLocal maps, CPU caches, volatile, and happens-before](/img/diagrams/jvm-memory-reference-poster-thread-view.png)

*Reference poster: shared versus per-thread view. Use the exact ThreadLocal and
volatile sections above for storage and visibility semantics.*

## Recommended Next Pages

- [Java Memory Model And Safe Publication](./advanced-internals/JAVA-MEMORY-MODEL.md)
- [GC And Object Layout Deep Dive](./JAVA-GC-OBJECT-LAYOUT-DEEP-DIVE.md)
- [JVM Profiling, GC, And Native Memory](./JVM-PROFILING-GC-NATIVE.md)

## Official References

- [Java SE 8 JVMS §2.5 — Run-Time Data Areas](https://docs.oracle.com/javase/specs/jvms/se8/html/jvms-2.html#jvms-2.5)
- [OpenJDK JEP 122 — Remove the Permanent Generation](https://openjdk.org/jeps/122)
- [Java 8 troubleshooting — `OutOfMemoryError: Metaspace`](https://docs.oracle.com/javase/8/docs/technotes/guides/troubleshoot/memleaks002.html)
- [JVMS §2.5 — Run-Time Data Areas](https://docs.oracle.com/javase/specs/jvms/se25/html/jvms-2.html#jvms-2.5)
- [JLS §17.4 — Memory Model](https://docs.oracle.com/javase/specs/jls/se25/html/jls-17.html#jls-17.4)
- [`ThreadLocal` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/ThreadLocal.html)
- [Java troubleshooting — Native Memory Tracking](https://docs.oracle.com/en/java/javase/25/vm/native-memory-tracking.html)
- [Java troubleshooting — memory leaks](https://docs.oracle.com/en/java/javase/25/troubleshoot/troubleshooting-memory-leaks.html)
