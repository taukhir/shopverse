---
title: Java Thread Coordination, Monitors And Lazy Initialization
description: synchronized forms, object and class locks, wait-notify, monitor failures, producer-consumer, join, sleep, and safe lazy initialization.
---

# Java Thread Coordination, Monitors And Lazy Initialization

## Intrinsic Monitors And `synchronized`

Every Java object can act as an intrinsic monitor. Entering a synchronized region provides mutual exclusion; unlock followed by a later lock on the same monitor establishes happens-before visibility.

```java
synchronized void instanceMethod() { }             // locks this
static synchronized void classMethod() { }         // locks Example.class
void block() { synchronized (privateLock) { } }     // locks privateLock
```

Two instance methods on different objects do not block each other. A static synchronized method and an instance synchronized method use different monitors. Prefer a private, final lock object when callers must not participate; never lock on pooled strings, boxed values, or publicly reachable objects.

## `wait`, `notify`, And `notifyAll`

These methods operate on an object's monitor wait set and must be called while owning that same monitor. `wait` atomically releases that monitor and suspends; after notification, the thread must reacquire it before returning. Always test the condition in a `while` loop because wakeups can be spurious or another thread can consume the condition first.

```java
synchronized (queue) {
    while (queue.isEmpty()) {
        queue.wait();
    }
    Job job = queue.removeFirst();
}

synchronized (queue) {
    queue.addLast(job);
    queue.notifyAll();
}
```

Calling `wait`, `notify`, or `notifyAll` without owning the target monitor throws `IllegalMonitorStateException`—the commonly intended term behind “monitor exception.” The same exception occurs when unlocking a `Lock` not held by the current thread.

`notify` selects one arbitrary waiter; it can awaken a thread whose condition is still false. `notifyAll` is generally safer when multiple logical conditions share a wait set, though explicit `Condition` objects can signal more precisely.

## Sleep, Wait, Join, Park And Yield

| Operation | Releases intrinsic monitor? | Meaning |
|---|---:|---|
| `Thread.sleep` | no | pause current thread for at least a duration |
| `Object.wait` | yes, the target monitor only | await a guarded condition |
| `Thread.join` | does not release unrelated locks | await another thread's termination |
| `LockSupport.park` | not monitor-based | block using a one-bit permit |
| `Thread.yield` | no | non-binding scheduler hint |

All blocking code needs an interruption policy: restore the interrupt (`Thread.currentThread().interrupt()`) when the layer cannot handle cancellation itself.

## Producer-Consumer: Prefer A Bounded Queue

Manual monitor code teaches coordination, but production code usually benefits from `BlockingQueue`: it handles waiting correctly and a bounded capacity provides backpressure.

```java
BlockingQueue<Job> queue = new ArrayBlockingQueue<>(1_000);

void produce(Job job) throws InterruptedException { queue.put(job); }
Job consume() throws InterruptedException { return queue.take(); }
```

For shutdown, coordinate cancellation or use a poison pill only when every consumer is guaranteed to receive one. Account for producer failure, consumer failure, and interruption; an unbounded queue merely converts overload into memory pressure.

## Safe Lazy Initialization

Unsafe lazy initialization has a data race. Correct choices include eager initialization, class initialization-on-demand holder, enum singleton, synchronization, or double-checked locking with a `volatile` field.

```java
final class CatalogClientHolder {
    private CatalogClientHolder() {}
    private static class Lazy { static final CatalogClient INSTANCE = new CatalogClient(); }
    static CatalogClient instance() { return Lazy.INSTANCE; }
}
```

```java
private volatile Client client;
Client client() {
    Client result = client;
    if (result == null) {
        synchronized (this) {
            result = client;
            if (result == null) client = result = new Client();
        }
    }
    return result;
}
```

Without `volatile`, construction can be observed without the required publication guarantee. Lazy initialization also needs a failure policy: retry, cache failure, or fail startup explicitly.

## Interview Traps

<ExpandableAnswer title="Does sleep release a synchronized lock?">

No.

</ExpandableAnswer>

<ExpandableAnswer title="Does wait release every lock a thread owns?">

No, only the monitor on which it waits.

</ExpandableAnswer>

<ExpandableAnswer title="Why use while, not if, around wait?">

Conditions must be rechecked after every wakeup.

</ExpandableAnswer>

<ExpandableAnswer title="Can instance and static synchronized methods execute together?">

Yes, because they lock different objects.

</ExpandableAnswer>

<ExpandableAnswer title="Does join stop the joined thread?">

No; it blocks the caller until termination.

</ExpandableAnswer>


## Official References

- [Object monitor methods](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Object.html#wait())
- [Java concurrency tutorial](https://docs.oracle.com/javase/tutorial/essential/concurrency/)
- [BlockingQueue API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/BlockingQueue.html)

## Recommended Next

Continue with [Exception And Async Failure Handling](./JAVA-EXCEPTION-ASYNC-DEEP-DIVE.md).
