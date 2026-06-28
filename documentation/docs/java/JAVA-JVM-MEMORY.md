---
title: JVM Memory Model
---

# JVM Memory Model

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

| Question | Short answer |
|---|---|
| Where are objects stored? | Usually heap; JVM may optimize allocations internally. |
| Where are local variables stored? | Primitive locals and references are in stack frames; referenced objects live on heap. |
| What causes `OutOfMemoryError`? | Heap, metaspace, direct memory, thread/native memory, or GC overhead limit. |
| What causes `StackOverflowError`? | Deep recursion or excessive call depth on one thread. |
