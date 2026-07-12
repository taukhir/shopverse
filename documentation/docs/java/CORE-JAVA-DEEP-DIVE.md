---
title: Core Java Deep Dive
description: Ordered learning path for Java language semantics, objects, collections, concurrency, exceptions, and interview preparation.
sidebar_position: 1
---

# Core Java Deep Dive

Senior engineers and architects should follow the
[Java Lead And Architect Learning Path](./JAVA-LEAD-ARCHITECT-PATH.md), which
adds design-review evidence, compatibility analysis, runtime diagnostics, and
production architecture expectations to this concept sequence.

This umbrella closes the gap between syntax tutorials and JVM internals. Follow it in order: later concurrency and collection rules depend on equality, type conversion, and object-model fundamentals.

| Step | Chapter | Main questions answered |
|---:|---|---|
| 1 | [Language Semantics](./JAVA-LANGUAGE-SEMANTICS.md) | casting, promotion, overloading, overriding, pass-by-value, variance |
| 2 | [Abstraction And Interfaces](./JAVA-ABSTRACTION-INTERFACES.md) | abstract classes, modern interfaces, marker and functional interfaces |
| 3 | [Objects, Strings And GC](./JAVA-OBJECTS-STRINGS-GC.md) | immutability, equality, string pool, reachability, static references |
| 3a | [Serialization And Deserialization](./JAVA-SERIALIZATION-UMBRELLA.md) | formats, object graphs, versioning, compatibility, filtering, and safe evolution |
| 4 | [Collections Learning Guide](./JAVA-COLLECTIONS-UMBRELLA.md) | selection, hashing, collision, duplicate handling, resizing, and concurrent collections |
| 5 | [Threads And JVM Thread Model](./JAVA-THREADING-UMBRELLA.md) | main, scheduler, GC/JIT, monitors, coordination, virtual threads, and memory visibility |
| 6 | [Exception And Async Failure](./JAVA-EXCEPTION-ASYNC-DEEP-DIVE.md) | custom exceptions, streams, executors and `CompletableFuture` failures |
| 7 | [Virtual Threads](./features-8-to-26/JAVA-VIRTUAL-THREADS.md) | carriers, pinning, cancellation and production guidance |
| 8 | [Internals Labs](./JAVA-INTERNALS-LABS.md) | executable experiments and measurements |

## How To Study Each Chapter

1. Predict each snippet before running it.
2. Explain whether the rule is compile-time, runtime, or Java Memory Model behavior.
3. Change one type, modifier, or operation and predict the new result.
4. Connect the rule to a production bug, not merely an interview answer.

## Official References

- [Java Language Specification](https://docs.oracle.com/javase/specs/jls/se25/html/index.html)
- [Java API documentation](https://docs.oracle.com/en/java/javase/25/docs/api/index.html)

## Recommended Next

Start with [Java Language Semantics](./JAVA-LANGUAGE-SEMANTICS.md).
