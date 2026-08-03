---
title: JVM Runtime Memory Areas
status: maintained
last_reviewed: "2026-08-02"
page_type: Guide
difficulty: Intermediate
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# JVM Runtime Memory Areas

![JVM process memory split across managed heap, per-thread areas, and native memory](/img/diagrams/jvm-memory-runtime-areas.svg)

*The Java heap is only part of process memory. Container limits must also cover
thread stacks, metaspace, compiled code, direct buffers, GC structures, agents,
JNI libraries, and sidecars.*

The JVM divides runtime memory into areas with different ownership and
lifetime. Understanding these areas helps with memory leaks, stack overflows,
GC tuning, and performance debugging.

```mermaid
flowchart TB
    JDK["JDK: compiler + tools + JRE"]
    JRE["JRE: JVM + runtime libraries"]
    JVM["JVM: classloader + execution engine + memory + GC"]
    JDK --> JRE --> JVM
```

## Runtime Areas

```mermaid
flowchart LR
    subgraph JVM["JVM Process"]
      Heap["Heap\nObjects and arrays\nShared across threads"]
      Meta["Metaspace\nClass metadata"]
      Code["Code Cache\nJIT compiled code"]
      subgraph T1["Thread 1"]
        Stack1["Java Stack\nframes + locals"]
        PC1["PC Register"]
      end
      subgraph T2["Thread 2"]
        Stack2["Java Stack\nframes + locals"]
        PC2["PC Register"]
      end
      Native["Native Method Stack"]
    end
```

| Area | Stores | Common issue |
|---|---|---|
| Heap | objects and arrays | memory leak, high GC |
| Stack | method frames and local variables | `StackOverflowError` |
| Metaspace | class metadata | classloader leak |
| Code cache | JIT-compiled native code | code cache full warnings |
| PC register | current instruction per thread | rarely tuned directly |
| Native stack | JNI/native calls | native memory pressure |

The specification defines logical runtime data areas; exact heap regions,
collectors, TLAB layout, code cache, and native-memory accounting are JVM
implementation details. Confirm them for the deployed JDK and collector.

## Heap And GC

Most Java objects live on the heap. Garbage collection frees objects that are
no longer reachable from GC roots such as thread stacks, static fields, JNI
references, and active classloaders.

```mermaid
flowchart TB
    Roots["GC Roots\nthread stacks, static fields,\nJNI refs, active classloaders"]
    A["OrderService singleton"]
    B["OrderRepository"]
    C["Cached Order list"]
    D["Detached old objects"]

    Roots --> A --> B --> C
    D -. "not reachable" .-> GC["eligible for GC"]
```

An object is not collected just because it is old. It is collected when it is
unreachable. Memory leaks in Java usually mean objects are still reachable from
some long-lived reference, such as a static map, cache, thread-local, listener
list, or unbounded collection.

Common production signals:

- growing heap after full GC means possible leak;
- frequent young GC means high allocation rate;
- long pause times can affect latency;
- too many threads increase stack/native memory.

### Memory Leak Is Retention, Not Just Heap Growth

A Java memory leak means memory remains reachable after the business lifetime
that should have owned it. It is not synonymous with `OutOfMemoryError`: an OOM
can instead be an undersized limit, a legitimate peak, direct/native exhaustion,
or an allocation bug. Conversely, a leak can grow slowly for days before an OOM.

Common retention paths and prevention:

| Retainer | Why it leaks | Prevention |
|---|---|---|
| unbounded cache/map | keys and values never expire or evict | maximum size, TTL where semantics permit, metrics and ownership |
| listener/observer registry | subscriber is never removed | explicit lifecycle close/unregister |
| executor `ThreadLocal` | reused worker outlives the request | lexical `try/finally` cleanup with `remove()` |
| static collection or singleton | process-long root retains request data | store bounded IDs/values only; define eviction/lifecycle |
| class loader/executor/driver | old deployment is reachable from a long-lived thread or static | close components and inspect retaining class-loader paths |

Diagnose from evidence rather than guessing: compare live-set size after GC over
time, inspect allocation rate and GC pauses, then use a protected heap dump to
find dominators and paths to GC roots. A growing object count alone is not proof;
the retaining path and the intended ownership lifetime establish the leak.

## Young And Old Generations

Most JVM collectors optimize for the fact that many objects die young.

Typical object lifecycle:

```text
new object -> young generation -> survives several GCs -> old generation
```

Short-lived request DTOs, stream objects, and temporary collections often die
in young generation. Long-lived caches, Spring singleton beans, and metadata
remain reachable longer.

You do not normally tune generations first. First check:

- allocation rate;
- heap usage after full GC;
- GC pause percentiles;
- object retention paths from a heap dump;
- unbounded caches/collections.

## Metaspace

Metaspace stores class metadata. In Spring Boot applications, metaspace grows
with loaded classes, generated proxies, reflection metadata, and frameworks.

Metaspace leaks are usually classloader leaks. They are more common in
application servers, plugin systems, repeated hot reloads, or tools that
generate many classes dynamically.

## Direct And Native Memory

Not all JVM memory is heap.

Native memory can include:

- thread stacks;
- direct `ByteBuffer`;
- memory used by Netty;
- memory-mapped files;
- JVM internal structures;
- native libraries.

This matters in containers. A Java process can be killed by the container even
when heap looks fine because total process memory exceeds the container limit.

## Common Diagnostic Commands

```bash
jcmd <pid> VM.native_memory summary
jcmd <pid> GC.heap_info
jcmd <pid> Thread.print
jmap -dump:live,format=b,file=heap.hprof <pid>
```

Use heap dumps carefully in production because they can be large and may contain
sensitive data.

## Stack

Each platform thread owns a stack. Recursive calls or very deep call chains can
overflow it:

```java
void recurse() {
    recurse();
}
```

Virtual threads are lighter, but they still need safe blocking boundaries and
bounded downstream resources.

### `StackOverflowError`: Typical Causes And Safe Response

Unbounded recursion is the obvious cause, but production stack overflows are
often accidental cycles:

- an entity graph's generated `toString()`, `equals()`, or `hashCode()` walks a
  bidirectional relationship forever;
- JSON/XML serialization follows a cyclic object graph;
- proxy, interceptor, mapper, or error handler calls itself through the wrong
  delegation path;
- an algorithm processes an unexpectedly deep input recursively.

The repeated stack frames identify the cycle. Capture the stack trace, stop the
failing request or process according to the deployment's recovery policy, then
fix the recursion or model boundary. Do not make `-Xss` the first fix: a larger
stack can defer the failure while increasing memory reserved per platform thread.
Use an iterative algorithm, explicit depth limit, cycle-aware serialization or
DTO mapping, and tests with cyclic/deep input. A `StackOverflowError` is an
`Error`, so normal application recovery should not catch and continue from it.

### OOM Triage Starts With Its Detail Message

`OutOfMemoryError` names an exhausted resource in many common cases. Read its
detail message before changing limits:

| Signal | First evidence | Typical next action |
|---|---|---|
| `Java heap space` | heap dump, live-set, allocation and GC logs | distinguish retention from a legitimate or undersized heap |
| `Metaspace` | class count/loaders and retaining paths | fix class-loader or generated-class growth |
| direct/native/container OOM | RSS/cgroup limit, NMT, direct buffers, thread count | restore native headroom; do not only raise `-Xmx` |
| `Requested array size exceeds VM limit` | allocation site and input bounds | cap or redesign the requested allocation |

Enable `-XX:+HeapDumpOnOutOfMemoryError` only when the dump location, disk budget,
access controls, and sensitive-data handling are prepared. For a container OOM
kill there may be no Java heap error, so correlate cgroup events with RSS and
native-memory evidence.

## JVM Memory In Containers

For Docker/Kubernetes, memory planning must include more than heap:

```text
container memory
  = heap
  + metaspace
  + thread stacks
  + direct/native memory
  + code cache
  + JVM overhead
```

Example:

```bash
java -XX:MaxRAMPercentage=70 -jar app.jar
```

This lets the JVM size heap based on container memory. Do not set heap to 100%
of container memory because the JVM also needs non-heap memory.

## Interview Questions

<ExpandableAnswer title="Where are objects stored?">

Usually on the heap, although the JVM may optimize allocations internally.

</ExpandableAnswer>

<ExpandableAnswer title="Where are local variables stored?">

Primitive local values and object references are held in stack frames; the
objects referenced by those variables usually live on the heap.

</ExpandableAnswer>

<ExpandableAnswer title="What causes OutOfMemoryError?">

Exhaustion can occur in the heap, metaspace, direct memory, thread or native
memory, or because the garbage collector exceeds its overhead limit.

</ExpandableAnswer>

<ExpandableAnswer title="What causes StackOverflowError?">

Deep recursion or excessive call depth exhausts the stack allocated to one
thread.

</ExpandableAnswer>

## Official References

- [JVMS §2.5 — Run-Time Data Areas](https://docs.oracle.com/javase/specs/jvms/se25/html/jvms-2.html#jvms-2.5)
- [Java Troubleshooting Guide — Native Memory Tracking](https://docs.oracle.com/en/java/javase/25/vm/native-memory-tracking.html)
- [Java Flight Recorder Runtime Guide](https://docs.oracle.com/en/java/javase/25/jfapi/flight-recorder-runtime-guide.html)
- [JDK memory-leak troubleshooting](https://docs.oracle.com/en/java/javase/25/troubleshoot/troubleshooting-memory-leaks.html)
