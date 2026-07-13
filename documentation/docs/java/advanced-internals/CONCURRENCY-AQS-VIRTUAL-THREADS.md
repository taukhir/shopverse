---
title: Concurrency Primitives, AQS, And Virtual Threads
difficulty: Advanced
page_type: Tutorial
status: Generic
keywords: [AQS, ReentrantLock, semaphore, CountDownLatch, ForkJoinPool, work stealing, virtual thread pinning, structured concurrency]
learning_objectives: [Choose synchronization primitives by invariant, Explain AQS and work stealing, Operate virtual threads without multiplying downstream load]
technologies: [Java]
last_reviewed: "2026-07-12"
---

# Concurrency Primitives, AQS, And Virtual Threads

![AQS synchronizer state with an owner and queued parked contenders](/img/diagrams/aqs-wait-queue.svg)

*AQS supplies atomic state and queue mechanics. Each synchronizer defines what
acquisition and release mean.*

## Monitors And AQS

`synchronized` combines mutual exclusion with happens-before and JVM-managed
monitor wait sets. Keep critical sections small and never rely on a monitor across
processes. `wait` must be used in a condition loop because wakeups do not prove
the predicate.

AbstractQueuedSynchronizer represents exclusive/shared state with an atomic
integer and a FIFO-like wait queue. `ReentrantLock`, `Semaphore`, `CountDownLatch`
and other synchronizers build policies on it. AQS handles enqueue/parking/wakeup;
the subclass defines acquire/release semantics.

| Primitive | Use |
|---|---|
| `ReentrantLock` | interruptible/timed acquisition or multiple conditions |
| read/write lock | read dominance with sufficiently long critical work |
| semaphore | bound concurrent access to scarce capacity |
| latch | one-shot wait for N completions |
| barrier/phaser | repeated phase coordination |

Fair locks reduce barging but often reduce throughput. Never unlock from a thread
that did not acquire ownership; release in `finally`.

## ConcurrentHashMap And Compound Actions

Modern `ConcurrentHashMap` coordinates bins and supports mostly nonblocking reads;
resizing and contended updates still coordinate. Use `compute`, `merge`, or atomic
map operations for per-key changes. Mapping functions must be short and must not
recursively mutate conflicting keys. Multiple keys require a higher-level model.

## ForkJoinPool And CompletableFuture

Fork/join workers use local deques and steal tasks to balance recursive CPU work.
Blocking the common pool can starve unrelated work. `CompletableFuture` stages
without `Async` may execute on the completing thread; async variants use the
provided executor or common pool. Always define executor ownership, timeout,
cancellation, exception composition, and shutdown.

## Virtual Threads

![Animated virtual-thread mounting, unmounting, and monitor pinning](/img/diagrams/animated-virtual-thread-pinning.svg)

*Supported blocking can unmount a virtual thread. Blocking while pinned retains
the carrier; confirm actual pinning with JFR rather than the animation alone.*

Virtual threads make blocking-style code scalable by unmounting from carrier
threads during supported blocking. They do not make CPU, database connections,
remote quotas, memory, or locks unlimited. Use semaphores/admission control around
scarce dependencies rather than pooling virtual threads as the primary limit.

Pinning can occur when blocking while holding a monitor or entering unsupported
native/foreign code. Observe JFR pinning events and long carrier occupancy; do not
mechanically replace every monitor without evidence.

Structured concurrency treats related tasks as one lifetime: fork, join, cancel
siblings on policy, and propagate failure. Scoped values provide bounded immutable
context without inheritable thread-local leakage. Verify feature status in the
JDK version used by the project.

## Failure Lab

Create bounded examples of race, deadlock, livelock, starvation, common-pool
blocking, and virtual-thread pinning. Capture thread dumps/JFR and repair each by
changing ownership or bounds—not by adding arbitrary sleep.

## Recommended Next Page

[Reflection, Proxies, Generics, And Serialization](./DYNAMIC-JAVA-INTERNALS.md)

## Tricky Interview Questions

<ExpandableAnswer title="Does AQS guarantee fairness?">

No; synchronizer policy and scheduling determine it.

</ExpandableAnswer>

<ExpandableAnswer title="Why can common-pool blocking starve unrelated work?">

Shared workers are occupied.

</ExpandableAnswer>

<ExpandableAnswer title="Do virtual threads remove semaphore limits?">

No; semaphores protect scarce resources.

</ExpandableAnswer>


## Official References

- [`AbstractQueuedSynchronizer` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/locks/AbstractQueuedSynchronizer.html)
- [`ForkJoinPool` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/ForkJoinPool.html)
- [JEP 444 — Virtual Threads](https://openjdk.org/jeps/444)
- [JEP 505 — Structured Concurrency](https://openjdk.org/jeps/505)
