---
title: Advanced Java Concurrency Utilities And Reactive Flow
description: StampedLock, Phaser, Flow, memory ordering, false sharing, coordinated omission, and selection rules.
status: "maintained"
last_reviewed: "2026-07-13"
---

# Advanced Java Concurrency Utilities And Reactive Flow

## StampedLock

`StampedLock` offers write locks, read locks and optimistic reads. It is not
reentrant and stamps must be validated/unlocked with the matching mode. An
optimistic read can observe fields while a writer runs, so copy fields to locals,
validate, and retry under a read lock.

```java
long stamp = lock.tryOptimisticRead();
double x = this.x, y = this.y;
if (!lock.validate(stamp)) {
    stamp = lock.readLock();
    try { x = this.x; y = this.y; } finally { lock.unlockRead(stamp); }
}
```

It is appropriate only after measurement shows read-lock contention and the
invariant can tolerate/retry speculative observation. Prefer simpler locks when
maintainability dominates.

## Phaser

`Phaser` coordinates reusable, dynamically registered parties across phases.
Registration, arrival, deregistration and waiting are separate actions. Incorrect
party accounting causes permanent waits. Override `onAdvance` for controlled
termination, not unrelated blocking work.

## Flow And Reactive Streams

`Flow.Publisher`, `Subscriber`, `Subscription` and `Processor` model asynchronous
streams with demand. A subscriber requests `n`; the publisher must not emit more
than requested and signals exactly one terminal event. Demand provides protocol
backpressure, not automatic bounding of every upstream buffer or database query.

```java
subscriber.onSubscribe(new Flow.Subscription() {
    public void request(long n) { /* validate n > 0 and emit at most n */ }
    public void cancel() { /* release resources idempotently */ }
});
```

## Memory Ordering And False Sharing

VarHandle modes range from plain through opaque, acquire/release and volatile-like
ordering. Choose the weakest correct mode only with a formal happens-before proof.
False sharing occurs when independent hot fields occupy the same cache line and
cores repeatedly invalidate it. Padding/striping can help measured contention but
layout is JVM/hardware-dependent; use JMH plus hardware/JFR profiling.

## Coordinated Omission

A load generator that waits for each response before scheduling the next request
under-reports latency during stalls because it stops creating samples exactly when
the system is slow. Use an arrival-rate model or coordinated-omission correction
and report queueing plus service time. This applies to executor, database and GC
performance experiments.

## Tricky Interview Questions

<ExpandableAnswer title="Can an optimistic read return inconsistent fields before validation?">

Yes; never act before successful validation.

</ExpandableAnswer>

<ExpandableAnswer title="Is StampedLock reentrant?">

No.

</ExpandableAnswer>

<ExpandableAnswer title="Does reactive demand bound all memory?">

No; each buffering boundary must honor a capacity.

</ExpandableAnswer>

<ExpandableAnswer title="Why can a closed-loop benchmark hide pauses?">

It omits arrivals during the pause.

</ExpandableAnswer>

<ExpandableAnswer title="Does padding always fix false sharing?">

No; confirm layout and contention experimentally.

</ExpandableAnswer>


## Official References

- [`StampedLock`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/locks/StampedLock.html)
- [`Phaser`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/Phaser.html)
- [`Flow`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/Flow.html)
- [`VarHandle`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/invoke/VarHandle.html)

## Recommended Next

Continue with [Java Memory Model](./advanced-internals/JAVA-MEMORY-MODEL.md).
