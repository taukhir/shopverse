---
title: Concurrent Java Coding Exercises
description: Implement and review bounded queues, caches, rate limiters, task coordination, cancellation, and shutdown with explicit concurrency proofs.
difficulty: Advanced
page_type: Workbook
status: maintained
prerequisites: [Java memory model, concurrency utilities]
learning_objectives: [State concurrency invariants, Choose synchronization primitives, Prove lifecycle safety, Test interleavings and overload]
technologies: [Java, java.util.concurrent, Virtual Threads]
last_reviewed: "2026-07-31"
scope: generic
owner: docs-data-structures
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Concurrent Java Coding Exercises

Before coding, state shared state, invariant, ownership, linearization point,
happens-before edge, blocking policy, interruption behavior, capacity, and shutdown.
“Thread-safe” without those boundaries is not a proof.

## Ten Exercises

1. **Bounded blocking queue:** implement `put`/`take` with one lock and separate not-full/not-empty conditions; use `while`, preserve interruption, and define close behavior.
2. **Thread-safe LRU cache:** combine a map and doubly linked list under one atomic ownership boundary; do not compose individually thread-safe structures without locking the invariant.
3. **Token-bucket rate limiter:** define monotonic time, refill arithmetic, burst capacity, contention, and overflow; test clock jumps only if wall time is used.
4. **Single-flight loader:** ensure one computation per key, propagate success/failure, remove completed entries safely, and prevent unbounded key retention.
5. **Ordered three-stage printer:** coordinate stage transitions without busy waiting and define termination when one worker fails.
6. **Parallel fan-out with deadline:** cancel unfinished tasks, preserve interrupt status, bound downstream concurrency, and collect partial outcomes according to contract.
7. **Read-mostly snapshot registry:** publish immutable snapshots through a volatile/atomic reference and explain why contained objects must also be immutable.
8. **Idempotent task executor:** atomically claim task identity, record durable outcome, and handle crash-after-effect ambiguity rather than deduplicating only in memory.
9. **Deadlock-free account transfer:** establish deterministic lock order, validate identity/amount, and avoid callbacks while locks are held.
10. **Graceful worker-pool shutdown:** stop admission, drain or cancel by deadline, interrupt cooperatively, close resources, and expose unfinished work.

## Testing And Review

Use deterministic barriers/latches for known interleavings, repeated stress tests for
probability, invariants checked after every run, time-bounded tests, and production-like
executors. Avoid correctness assertions based only on `sleep`. Consider JCStress for
Java Memory Model litmus tests and JFR/thread dumps for runtime evidence.

## Interview Rubric

A strong solution explains why the primitive supplies visibility and atomicity,
handles interruption and failure, bounds queues/resources, avoids executing unknown
callbacks under locks, and supplies a shutdown protocol. Virtual threads change task
cost, not shared-state correctness or downstream capacity.

## Official References

- [Java concurrency API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/package-summary.html)
- [OpenJDK JCStress](https://openjdk.org/projects/code-tools/jcstress/)
- [JEP 444: Virtual Threads](https://openjdk.org/jeps/444)

## Recommended Next

Continue with [Java Concurrency Design Review](../java/JAVA-CONCURRENCY-DESIGN-REVIEW.md)
and [Machine-Coding And OOD Rounds](./MACHINE-CODING-OOD-INTERVIEW.md).
