---
title: Java Senior And Architect Interview Bank
description: Evidence-based foundational, senior, debugging, output, and architecture questions with evaluation guidance.
---

# Java Senior And Architect Interview Bank

## Evaluation Rubric

| Score | Expected answer |
|---:|---|
| 1 | definition or API name only |
| 2 | correct language/runtime mechanism |
| 3 | correctness boundary, trade-off and failure mode |
| 4 | production evidence, overload/lifecycle/security and alternatives |
| 5 | system boundary, migration, compatibility and rollback judgment |

## Language And OOP

**Why can adding an overload break a client only after recompilation?** Existing
bytecode names a selected descriptor; recompilation reruns most-specific selection
and may bind another overload. Follow-up: classify source, binary and behavioral
compatibility.

**Predict construction-time output when a base constructor calls an overridden
method reading a child field.** The child override runs before child field
initialization and observes the default value. Reject “parent implementation runs”
and discuss constructor escape.

## Generics And Strings

**Why does a bridge method exist?** Erasure changes descriptors; the compiler
emits a synthetic delegating method to preserve overriding. Verify with `javap`.

**Why can `String.length()` differ from user-visible character count?** It counts
UTF-16 code units; supplementary code points and grapheme clusters require
different iteration/boundary models.

## Collections

**A `ConcurrentHashMap` is thread-safe, so why is an inventory check/decrement
unsafe?** The business invariant spans read plus update and possibly replicas.
Use a one-key atomic computation only if the complete invariant and authority fit;
otherwise use transactional/distributed coordination.

**Why can `LinkedList` lose to `ArrayList` for removals?** Big-O ignores traversal,
node allocation, cache locality and optimized array copies. Require representative
measurement.

## Concurrency

**A 500-thread pool on 64 cores slows CPU work. Why?** Runnable competition adds
context switches and locality loss; parallelism remains core-bound. Inspect CPU
profiles and runnable counts rather than increasing the pool.

**Compile-or-fail:** calling `wait()` outside synchronized compiles but throws
`IllegalMonitorStateException` at runtime because monitor ownership is dynamic.

**Why does timeout of a `CompletableFuture` not prove remote work stopped?** Stage
completion/cancellation and underlying I/O cancellation are separate contracts.
Discuss deadlines, interruption and idempotency.

## Virtual Threads

**Why can virtual threads exhaust a database faster?** Cheap blocked tasks remove
the platform-thread throttle; connections remain scarce. Bound admission at the
database pool/semaphore and measure connection wait.

**What is pinning?** A blocked virtual thread cannot unmount from its carrier in
certain operations. Rules evolve by JDK; diagnose with the exact release and JFR.

## JVM And GC

**Heap is 50% but the container is OOM-killed. What next?** Account for stacks,
direct buffers, metaspace, code cache, GC/native structures and RSS using NMT,
thread counts and cgroup evidence.

**ZGC reduces pauses but p99 worsens. Why?** Concurrent collector CPU/headroom,
allocation, queues or dependencies may dominate. Correlate JFR, GC CPU and spans.

## NIO, Modules And Security

**Why must a channel write loop?** Non-blocking and some channel operations can
make partial progress. The buffer's remaining bytes define completion.

**`exports` versus `opens`?** Export exposes public API access; opens permits deep
reflection. Prefer qualified openings and explain framework implications.

**Why are heap dumps security artifacts?** They contain live application values,
tokens and PII. Require encryption, access control, audit and retention limits.

## Architecture Scenario

Design a high-throughput Java order aggregator. A level-5 answer defines request
deadlines, virtual/platform execution choice, downstream bulkheads, data authority,
idempotency, serialization compatibility, memory bounds, shutdown, JFR/metrics,
security classification, rollout and rollback. It explicitly rejects unbounded
queues, common-pool blocking and process-local maps as distributed authorities.

## Extended Tricky Question Bank

### Predict Or Explain

1. **`short s=1; s+=1` compiles, but `s=s+1` does not. Why?** Compound assignment includes an implicit narrowing conversion; binary promotion makes the expanded expression `int`.
2. **A base constructor calls an override and prints null. Why?** Virtual dispatch is active before child field initialization.
3. **Two equal keys occupy a map after mutation. Why?** Mutation changed equality/hash after original bucket placement.
4. **`orElse(remoteCall())` invokes the call for a present Optional. Why?** Java evaluates method arguments eagerly; use `orElseGet`.
5. **A stream reduction works sequentially but fails in parallel. Why?** The operator/identity is not associative or combiner-compatible.

### Compile Or Fail

6. **Can an override declare `Exception` when the parent declares `IOException`?** No; it broadens the checked contract.
7. **Can `List<Integer>` be assigned to `List<? extends Number>`?** Yes for producer-style reads, but arbitrary additions are prohibited.
8. **Can `new T()` compile in an ordinary generic class?** No; erasure provides no constructible reified `T`.
9. **Can `wait()` outside synchronized compile?** Yes, but runtime monitor ownership validation throws `IllegalMonitorStateException`.
10. **Can a record extend a domain base class?** No; it already extends `java.lang.Record`.

### Senior Diagnosis

11. **Why can `computeIfAbsent` stall unrelated keys?** Colliding keys share bin coordination; the mapping function may be slow or recursively unsafe.
12. **Why can `CompletableFuture` recovery hide an outage?** Early `exceptionally` converts failure to success; later metrics/stages see a normal value unless recovery is explicitly observed.
13. **Why can a thread-safe cache corrupt business state?** Thread safety protects container mechanics, not mutable values, multi-key invariants or cross-replica authority.
14. **Why does a larger thread pool increase database latency?** More workers queue on the same connection/lock/storage bounds and add scheduling overhead.
15. **Why does a heap dump show no leak after OOM kill?** The exhaustion may be direct memory, stacks, metaspace, code cache or another native region.

### Architect Follow-Ups

16. **How do you choose G1 versus ZGC?** Compare SLO, live set, allocation, CPU/headroom and supported JDK using the same representative load and rollback plan.
17. **When prefer structured concurrency to CompletableFuture?** Request-scoped child tasks with lexical lifetime, coordinated join/failure/cancellation; use futures for externally composable stage graphs.
18. **When prefer selectors to virtual threads?** When explicit event-loop control, streaming state or extremely tight per-connection representation outweighs simpler blocking code.
19. **How do you evolve a sealed API?** Treat a new permitted subtype as source/behavioral compatibility change; update exhaustive consumers and version contracts.
20. **How do you prove a concurrency fix?** State the invariant/happens-before edge, add stress tests, reproduce prior failure and validate saturation/cancellation—not only throughput.

### Common Incorrect Answers

- “Java passes objects by reference.” Correct: it copies reference values.
- “`volatile` makes code thread-safe.” Correct: it supplies visibility/order for accesses, not compound atomicity.
- “Virtual threads are faster threads.” Correct: they make blocking concurrency cheaper; CPU work is not accelerated.
- “Parallel stream uses all cores efficiently.” Correct: splitting, granularity, ordering, blocking and common-pool contention decide.
- “GC collects cycles only with special handling.” Correct: tracing collectors naturally reclaim unreachable cycles.

## Official References

- [Java Language Specification](https://docs.oracle.com/javase/specs/jls/se25/html/index.html)
- [Java Virtual Machine Specification](https://docs.oracle.com/javase/specs/jvms/se25/html/index.html)
- [JDK troubleshooting](https://docs.oracle.com/en/java/javase/25/troubleshoot/)

## Recommended Next

Answer each question using an artifact from [Executable Labs](./JAVA-EXECUTABLE-LABS.md).
