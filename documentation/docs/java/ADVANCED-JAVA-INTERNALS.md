---
title: Advanced Java Internals
difficulty: Advanced
page_type: Learning Path
status: Generic
keywords: [JVM internals, Java Memory Model, AQS, virtual threads, bytecode, JIT, NIO, JMH]
learning_objectives: [Understand Java execution beneath language syntax, Diagnose concurrency and memory failures, Measure performance without misleading benchmarks]
technologies: [Java, JVM, JFR, JMH]
last_reviewed: "2026-07-12"
---

# Advanced Java Internals

This track explains why Java code behaves as it does at runtime. Read the existing
language and collection guides first; then follow execution, memory, concurrency,
dynamic behavior, I/O, and measurement.

## Learning Sequence

1. [JVM Execution Internals](./advanced-internals/JVM-EXECUTION-INTERNALS.md)
2. [Java Memory Model And Safe Publication](./advanced-internals/JAVA-MEMORY-MODEL.md)
3. [Concurrency Primitives And AQS](./advanced-internals/CONCURRENCY-AQS-VIRTUAL-THREADS.md)
4. [Reflection, Proxies, Generics, And Serialization](./advanced-internals/DYNAMIC-JAVA-INTERNALS.md)
5. [NIO, Zero-Copy, And Benchmarking](./advanced-internals/NIO-PERFORMANCE-JMH.md)
6. [JVM Profiling, GC, And Native Images](./JVM-PROFILING-GC-NATIVE.md)

Supporting foundations:

- [JVM Memory](./JAVA-JVM-MEMORY.md)
- [Collection Internals](./JAVA-COLLECTION-INTERNALS.md)
- [Multithreading](./JAVA-MULTITHREADING.md)
- [CompletableFuture](./JAVA-COMPLETABLE-FUTURE.md)
- [Virtual Threads](./features-8-to-26/JAVA-VIRTUAL-THREADS.md)

## Completion Standard

You should be able to read bytecode and thread dumps, explain happens-before,
choose concurrency primitives, detect virtual-thread pinning, profile CPU/allocation/
locks, and design a JMH benchmark that resists dead-code elimination and warmup bias.
