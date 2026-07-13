---
title: JVM Profiling, Garbage Collection, And Native Images
difficulty: Advanced
page_type: Tutorial
status: Generic
keywords: [Java Flight Recorder, JFR, async-profiler, heap dump, garbage collector, G1, ZGC, GraalVM native image]
learning_objectives: [Diagnose JVM CPU memory lock and allocation problems, Choose and tune garbage collection from evidence, Evaluate native-image trade-offs]
technologies: [Java, JFR, JDK Mission Control, GraalVM]
last_reviewed: "2026-07-12"
---

# JVM Profiling, Garbage Collection, And Native Images

![Java internals atlas showing allocation, JIT, GC, virtual threads, collection layout, and JMH phases](/img/diagrams/java-internals-atlas.svg)

*Profile the relationship between these subsystems; do not tune GC, JIT, threads,
or allocation as independent knobs.*

## Evidence Before Tuning

Correlate user latency/errors with process CPU, throttling, run queue, heap,
non-heap/native memory, allocation, GC pauses/concurrent work, threads, locks,
virtual-thread pinning, files/sockets, and dependency/database waits.

Use Java Flight Recorder for low-overhead production recordings and JDK Mission
Control for analysis. Async-profiler can produce CPU, allocation, lock, and wall-
clock flame graphs. Thread dumps show runnable/blocked/waiting stacks; heap dumps
and histograms help retention/leak analysis but are large, sensitive, and can
pause/pressure a process. Capture safely and restrict access.

Avoid interpreting CPU samples as elapsed latency when the application mostly
waits. Wall-clock profiles and traces expose I/O and queue waits. Reproduce with
representative load and compare before/after using the same methodology.

## Garbage Collection

Collector choice depends on heap, allocation, pause SLO, throughput, CPU and
memory headroom, object lifetime, container limits, and JDK version. G1 is a
balanced general-purpose collector; ZGC targets very low pauses with concurrent
work. Other collectors have specialized trade-offs. Verify current JDK support.

Tune only after fixing excess allocation, retention, unbounded caches/queues,
oversized batches, leaks, and wrong container sizing. Monitor allocation rate,
live set after collection, promotion, pause distribution, concurrent-cycle time,
humongous objects, GC CPU, and OOM cause. Leave headroom for native memory,
threads, code cache, direct buffers, and sidecars—not only heap.

## Native Images

GraalVM native images use ahead-of-time closed-world analysis for fast startup
and lower steady footprint in suitable workloads. Trade-offs include longer/more
complex builds, reflection/resource/proxy metadata, dynamic-feature constraints,
different diagnostics and peak performance, library compatibility, and platform-
specific artifacts.

Measure startup, memory, throughput, p95/p99, build time, image size, diagnostics,
and developer/CI cost against a tuned JVM. Native images are valuable for short-
lived/serverless and dense workloads when compatibility is proven; they are not
an automatic performance upgrade.

## Recommended Next Page

Continue with [Advanced Spring Platform Patterns](../spring/SPRING-PLATFORM-ADVANCED.md).

## Tricky Interview Questions

<ExpandableAnswer title="Why can a heap dump worsen an incident?">

Pause, disk pressure and sensitive-data exposure.

</ExpandableAnswer>

<ExpandableAnswer title="Does frequent GC prove insufficient heap?">

No; inspect allocation and live set.

</ExpandableAnswer>

<ExpandableAnswer title="Why can RSS exceed -Xmx?">

Native regions are outside heap.

</ExpandableAnswer>


## Official References

- [Java Flight Recorder](https://docs.oracle.com/en/java/javase/25/jfapi/)
- [Java GC Tuning Guide](https://docs.oracle.com/en/java/javase/25/gctuning/)
- [GraalVM Native Image](https://www.graalvm.org/latest/reference-manual/native-image/)
