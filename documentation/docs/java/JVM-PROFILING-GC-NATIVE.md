---
title: JVM Profiling, Garbage Collection, And Native Images
description: Beginner-to-advanced guide to JVM profiling evidence for CPU allocation locks garbage collection retention and native-memory questions, plus native-image evaluation boundaries.
difficulty: Advanced
page_type: Tutorial
status: maintained
prerequisites: [JVM Performance Diagnostics, JVM Memory Areas, Garbage Collectors]
keywords: [Java Flight Recorder, JFR, async-profiler, heap dump, garbage collector, G1, ZGC, GraalVM native image]
learning_objectives: [Diagnose JVM CPU memory lock and allocation problems, Choose and tune garbage collection from evidence, Evaluate native-image trade-offs]
technologies: [Java, JFR, JDK Mission Control, GraalVM]
last_reviewed: "2026-08-04"
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# JVM Profiling, Garbage Collection, And Native Images

**JVM profiling** is the collection and analysis of sampled or recorded runtime
events to explain where an application spends CPU time, allocates memory, waits,
contends, or retains objects. A profile is evidence for a named question; it is
not a generic health score and does not replace metrics, traces, logs, or load
reproduction.

## Page Overview

This tutorial selects CPU, wall-clock, allocation, lock, retention, or native
evidence from a named symptom. It explains how sampling and event recording work,
provides a safe first capture, connects profiles to GC evidence, and closes with
the compatibility and operational trade-offs of native images.

## What Should Be Profiled?

Choose the profile from the symptom:

| Question | Useful evidence |
|---|---|
| Which code consumes CPU? | CPU samples and flame graph |
| Where are objects allocated? | allocation samples or events |
| Where do threads wait or contend? | wall-clock, lock, thread-dump, and JFR evidence |
| Why does live heap grow? | class histogram and heap-dump retained paths |
| Why does RSS exceed the heap? | Native Memory Tracking, mappings, direct-buffer and thread evidence |

## Prerequisites

First learn [JVM Performance Diagnostics](./JAVA-PERFORMANCE-DIAGNOSTICS-TOOLING.md),
[JVM Memory Areas](./JAVA-JVM-MEMORY.md), and
[Garbage Collectors](./JAVA-GC-COLLECTORS-ARCHITECT.md). This page assumes you can
name a symptom and select a safe evidence window before attaching a profiler.

![Java internals atlas showing allocation, JIT, GC, virtual threads, collection layout, and JMH phases](/img/diagrams/java-internals-atlas.svg)

*Profile the relationship between these subsystems; do not tune GC, JIT, threads,
or allocation as independent knobs.*

## First Profiling Example

If request latency rises with high process CPU, capture a bounded JFR or CPU
profile during the affected interval. A wide flame-graph frame means many samples
share that stack; it does not automatically prove defective code. Correlate the
profile with throughput and traces, then repeat the same load after one focused
change.

```bash
jcmd <pid> JFR.start name=latency settings=profile duration=60s filename=latency.jfr
```

Confirm output location, disk headroom, permissions, recording policy, and
sensitive-data handling before using the command in production.

## Profiling Internals: How Sampling And Events Work

Sampling profilers periodically collect stack traces; event recorders capture
selected runtime events with timestamps and attributes. Sampling limits overhead
but can miss rare work. Richer events provide detail at additional cost. Every
profile describes one workload and interval, so warm-up, traffic mix, CPU quota,
and external waits belong in the interpretation.

## Production And Diagnostic Guidance

Define the symptom, affected interval, workload, process identity, safety budget,
and output location before capture. Prefer bounded recordings, verify tool and
JDK compatibility, protect recordings as potentially sensitive artifacts, and
compare the result with metrics and traces from the same timestamps.

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

## Failure Modes And Trade-Offs

- choosing CPU sampling for a waiting or blocked latency problem;
- interpreting sample count as exact elapsed time without considering profiler
  mode and capture interval;
- profiling an unrepresentative cold or low-traffic workload and generalizing it
  to steady-state production;
- attaching intrusive tools or generating dumps without a safety budget;
- tuning GC from pause averages while ignoring allocation, live set, concurrent
  CPU, RSS, and tail latency;
- treating native image as a universally faster JVM replacement without
  compatibility, diagnostics, build, and throughput evidence.

## Recommended Next Page

Continue with [NIO, Zero-Copy And JMH](./advanced-internals/NIO-PERFORMANCE-JMH.md).

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
