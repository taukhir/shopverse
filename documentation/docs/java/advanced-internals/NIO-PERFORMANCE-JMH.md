---
title: NIO, Zero-Copy, And JMH Benchmarking
difficulty: Advanced
page_type: Tutorial
status: Generic
keywords: [Java NIO, ByteBuffer, channel, selector, zero-copy, JMH, dead-code elimination]
learning_objectives: [Choose blocking asynchronous or selector I/O, Manage buffers and partial operations correctly, Build trustworthy JVM microbenchmarks]
technologies: [Java, JMH]
last_reviewed: "2026-07-12"
---

# NIO, Zero-Copy, And JMH Benchmarking

Channels move bytes; buffers hold state through capacity, position, limit, and
mark. After writing to a buffer, `flip()` prepares it for reading; `compact()`
preserves unread bytes for another fill. Reads/writes can be partial—loop according
to protocol and readiness without busy-spinning.

Heap buffers are GC-managed arrays. Direct buffers can reduce copies in native I/O
but cost more to allocate, consume native memory, and have cleaner lifecycle
implications. Pool only with strict ownership, limits, leak detection, and wiping
where sensitive data is involved.

Selectors multiplex many nonblocking channels on fewer threads but require state
machines, interest-operation management, fair work limits, and careful cancellation.
Blocking I/O with virtual threads is often simpler when connection count and
downstream capacity are bounded. Asynchronous channels use platform-specific
facilities/executors and do not eliminate backpressure.

File-channel transfer operations may enable kernel-assisted zero-copy, reducing
user-space copies and CPU. TLS, transformation, platform/filesystem behavior, and
small transfers can prevent or negate the benefit. Measure the actual path.

## JMH Correctness

JMH manages warmup, measurement, forks, generated harnesses, and result collection.
It cannot choose a representative workload for you.

- use multiple forks to isolate JVM state;
- warm until compilation/profile behavior is representative;
- consume results or return them to prevent dead-code elimination;
- use `@State` scope matching sharing semantics;
- separate setup from measured work;
- use parameters for realistic sizes/distributions;
- inspect allocation and generated code when conclusions depend on them;
- never infer production latency from a nanosecond microbenchmark alone.

Constant folding, loop optimization, branch predictability, cache warmth, turbo/
power management, GC, OS noise, and accidental contention distort results. Report
JDK, flags, hardware, OS, forks, warmup, measurement, distribution, and uncertainty.

## Labs

1. Implement framed channel reads that handle partial headers and payloads.
2. Compare heap/direct buffers for production-shaped transfer sizes.
3. Compare file copy versus `transferTo` while recording CPU and throughput.
4. Write a deliberately broken JMH benchmark, identify elimination/folding, fix it,
   and compare with an application-level load test.

## Official References

- [Java Language Specification](https://docs.oracle.com/javase/specs/jls/se25/html/)
- [Java Virtual Machine Specification](https://docs.oracle.com/javase/specs/jvms/se25/html/)
- [Java SE 25 API](https://docs.oracle.com/en/java/javase/25/docs/api/)

## Tricky Interview Questions

1. Why can a benchmark report impossible speed? Dead-code elimination or constant folding.
2. Does direct memory count against heap? No, but it counts against process limits.
3. Why must non-blocking writes loop? Partial or zero progress is legal.

## Recommended Next Page

Continue with [JVM Profiling, Garbage Collection, And Native Images](../JVM-PROFILING-GC-NATIVE.md).
