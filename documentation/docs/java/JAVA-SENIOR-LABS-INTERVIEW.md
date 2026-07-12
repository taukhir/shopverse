---
title: Java Senior Labs And Architecture Interview Workbook
description: Evidence-based labs and interview scenarios for JVM, GC, virtual threads, NIO, reflection, modules, collections, and performance.
---

# Java Senior Labs And Architecture Interview Workbook

This workbook is the completion gate for the senior Java track. Each answer must
state the invariant, runtime mechanism, trade-off, evidence, failure behavior,
and rejected alternatives. API-name answers are incomplete.

## Executable Lab Matrix

| Domain | Experiment | Required evidence |
|---|---|---|
| overload/initialization | compile ambiguous overloads; fail class initialization | compiler diagnostics, `javap`, repeat-use exception chain |
| generics | trigger heap pollution and inspect bridges | `-Xlint`, class-file signature and bridge flags |
| strings | inspect concat bytecode and malformed UTF-8 | bytecode plus explicit decoder behavior |
| collections | collide keys, resize maps, mutate a key | JMH/JFR allocation and correctness assertions |
| concurrent map | independent keys versus hot bin during resize | throughput, blocked time, allocation and correctness |
| virtual threads | compare blocking I/O and pinned monitor case | JFR virtual-thread events, carrier CPU, downstream queueing |
| structured concurrency | fork two dependencies, fail one, enforce deadline | cancellation and exception aggregation tests |
| class loading | load one class through two loaders | class identity, cast failure and unloading evidence |
| bytecode/JIT | inspect invokes and force warm-up/deoptimization | `javap`, JFR compilation and code-cache evidence |
| GC | compare allocation/live-set behavior under two collectors | unified GC logs, pause percentiles and CPU |
| native memory | allocate direct buffers and platform threads | NMT categories and process RSS |
| NIO | partial reads/writes and selector lifecycle | correctness tests, buffer state and leak-free shutdown |
| reflection/modules | attempt deep reflective access across modules | module descriptor, failure and explicit `opens` decision |
| performance | benchmark a collection or serialization choice | valid JMH forks/warm-up, profiler and confidence intervals |

## Virtual Threads And Structured Concurrency Review

Virtual threads improve the scalability of blocking task representation. They
do not increase CPU parallelism or expand database/network capacity. Review
carrier pinning, thread-local volume, interruption, deadlines, observability,
and admission at scarce resources. Structured concurrency treats child tasks as
a lexical unit: completion, cancellation and failure remain bounded by the
owning scope. Because structured-concurrency APIs can be preview-dependent,
record the exact JDK and preview policy before adopting them in stable libraries.

Scenario: user and order calls run in parallel. The order call fails after the
user call mutates a cache. Explain why sibling cancellation does not undo that
side effect, then redesign around idempotent reads or an explicit commit point.

## Class Loading And Bytecode Review

Trace loading, verification, preparation, resolution and initialization. Use
`javap -c -v` to identify descriptors, constant-pool entries, exception tables,
stack-map frames, bridge methods, bootstrap methods and invocation instructions.
Explain why equal binary names loaded by different defining loaders are distinct
types and how thread locals/static registries prevent loader reclamation.

## Garbage Collector Review

Compare collectors using the same workload and live-set target. Record allocation
rate, promoted/live bytes, pause distribution, concurrent-cycle CPU, application
throughput and container headroom. Do not select G1, ZGC, Shenandoah or Parallel
GC from pause marketing alone. A large retained graph is an ownership problem;
a collector can reclaim unreachable objects only.

## NIO, Reflection And Module Review

NIO code must handle buffer position/limit/capacity, partial channel operations,
selector key lifecycle, cancellation and shutdown. Direct buffers move payload
outside the heap but remain process memory and require bounded ownership.

Reflection bypasses compile-time coupling but not module encapsulation or domain
invariants. Prefer method handles for repeated dynamic invocation where suitable,
cache metadata without pinning class loaders, and use narrow `opens` directives
rather than opening entire modules. Annotation processing is compile-time code
generation; dynamic proxies are runtime interface dispatch; bytecode agents have
different compatibility and operational risks.

## Architecture Interview Scenarios

1. A 64-core service becomes slower with a 500-thread CPU pool. Explain runnable contention, context switching, cache locality and downstream bounds.
2. A `ConcurrentHashMap` cache is correct in tests but stale across replicas. Separate thread safety from distributed coherence.
3. ZGC lowers pauses but total latency rises. Investigate CPU headroom, allocation, queues and dependency latency.
4. A plugin cannot unload after redeploy. Trace threads, context class loaders, statics, drivers, logging and reflection caches.
5. Parallel streams slow an endpoint. Examine split quality, work granularity, ordering, blocking and common-pool interference.
6. A virtual-thread service exhausts the database. Explain why cheap threads require connection/admission limits.
7. A module migration breaks reflection. Decide whether the dependency needs exported API, qualified opening, method handles or redesign.
8. A microbenchmark proves object pooling is faster. Challenge warm-up, escape analysis, dead-code elimination, contention and production allocation profiles.

## Completion Rubric

| Level | Evidence |
|---|---|
| insufficient | names an API or definition only |
| senior | explains correctness, runtime behavior and trade-off with a reproducible example |
| lead | connects the choice to lifecycle, overload, security, compatibility and observability |
| architect | defines system boundaries, rejected alternatives, migration/rollback and production evidence |

## Official References

- [JDK tools](https://docs.oracle.com/en/java/javase/25/docs/specs/man/)
- [JMH](https://openjdk.org/projects/code-tools/jmh/)
- [JDK Mission Control](https://docs.oracle.com/en/java/javase/25/jmc/)
- [Virtual Threads, JEP 444](https://openjdk.org/jeps/444)
- [Java Platform Module System](https://openjdk.org/projects/jigsaw/spec/)

## Recommended Next

Run one lab from every row and record the command, JDK, configuration, result,
interpretation and one rejected conclusion.
