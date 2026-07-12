---
title: Java Object Layout, Allocation And Garbage Collectors
description: Object headers, compressed references, TLABs, barriers, collector algorithms, failures, selection, logs, and measurement.
---

# Java Object Layout, Allocation And Garbage Collectors

## Layout And Allocation

HotSpot objects commonly contain a mark word, class metadata pointer, fields and
alignment padding. Exact layout depends on JVM, flags and class shape. Compressed
ordinary/class pointers reduce reference/header width within supported heap ranges.
Field packing and alignment create non-obvious shallow sizes; arrays add length
and element storage. Verify with JOL rather than mental arithmetic.

Most small objects allocate through a thread-local allocation buffer using a
pointer bump. TLAB refill or large allocation takes a slower shared path. Escape
analysis may enable scalar replacement and lock elimination after JIT compilation,
but source allocation is not proof of runtime allocation—or elimination.

## Reachability And Barriers

Collectors trace from GC roots including live stacks, JNI handles and statics of
loaded classes. Cycles without a root are collectible. Generational/concurrent
collectors use write/load barriers, card tables or remembered sets to track cross-
region/generation references and maintain marking invariants.

## Collector Matrix

| Collector | Primary target | Architectural trade-off |
|---|---|---|
| Serial | small/simple heaps | single GC worker and longer pauses |
| Parallel | throughput | stop-the-world parallel work |
| G1 | balanced regional collector | young/mixed cycles, pause target is a goal |
| ZGC | very low pauses, large heaps | concurrent work and CPU/headroom requirements |
| Shenandoah | low pauses | concurrent evacuation/marking trade-offs and distribution support |

Young collections reclaim recent regions. G1 mixed collections add selected old
regions after marking. “Full GC” is a high-cost fallback/whole-heap condition whose
exact behavior is collector-specific. Promotion/evacuation failure means the
collector could not move objects as planned, often due to fragmentation/headroom
or allocation/live-set pressure. Humongous objects can receive special regional
handling and should be diagnosed from logs, not guessed.

## Selection And Log Analysis

Choose from SLO, live set, allocation rate, heap/container size, CPU headroom and
operational support. Enable unified logging, correlate timestamps with application
latency, and examine pause percentiles, causes, before/after occupancy, concurrent
cycle time, allocation/promotion and safepoint time. Average pause alone hides tails.

```text
-Xlog:gc*,safepoint:file=gc.log:time,uptime,level,tags
```

## Lab

Run the same allocation/live-set workload with G1 and a low-pause collector.
Hold request rate constant. Capture JFR, GC logs, RSS and CPU. Report application
throughput and p99, not just GC pause. Use JOL for layout and a heap dump for
retained size; shallow size does not include reachable graphs.

## Tricky Interview Questions

1. Does shallow size include reachable objects? No.
2. Can a collector repair a reachable-object leak? No.
3. Why can object pooling hurt? Coordination and stale mutable state can exceed allocation cost.

## Official References

- [HotSpot GC tuning guide](https://docs.oracle.com/en/java/javase/25/gctuning/)
- [Java Object Layout](https://openjdk.org/projects/code-tools/jol/)
- [Unified logging](https://docs.oracle.com/en/java/javase/25/docs/specs/man/java.html)

## Recommended Next

Continue with [JVM Profiling, GC And Native Memory](./JVM-PROFILING-GC-NATIVE.md).
