---
title: Java Multithreading
sidebar_position: 5
---

# Java Multithreading And CompletableFuture

Concurrency allows tasks to overlap. Parallelism executes tasks at the same
time. Correct code must define ownership, visibility, atomicity, cancellation,
and resource bounds.

## Creating Work

### Thread

```java
Thread thread = Thread.ofPlatform()
        .name("report-worker")
        .start(this::generateReport);
thread.join();
```

### ExecutorService

```java
try (ExecutorService executor = Executors.newFixedThreadPool(8)) {
    Future<Report> future = executor.submit(this::generateReport);
    Report report = future.get(2, TimeUnit.SECONDS);
}
```

### Virtual Threads

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<Result>> futures = tasks.stream()
            .map(task -> executor.submit(() -> execute(task)))
            .toList();
}
```

### CompletableFuture

```java
CompletableFuture<User> userFuture =
        CompletableFuture.supplyAsync(() -> userClient.getUser(userId), executor);

CompletableFuture<List<Order>> orderFuture =
        CompletableFuture.supplyAsync(() -> orderClient.getOrders(userId), executor);

UserDashboard dashboard = userFuture
        .thenCombine(orderFuture, UserDashboard::new)
        .orTimeout(2, TimeUnit.SECONDS)
        .exceptionally(this::fallbackDashboard)
        .join();
```

Always pass an owned executor for server-side blocking work instead of silently
using the common pool.

## CompletableFuture Composition

| Method | Meaning |
|---|---|
| `thenApply` | synchronously transform a successful result |
| `thenApplyAsync` | transform on an executor |
| `thenCompose` | flatten dependent asynchronous operation |
| `thenCombine` | combine two independent results |
| `allOf` | wait for all stages |
| `anyOf` | complete when any stage completes |
| `exceptionally` | recover from failure |
| `handle` | observe success or failure and produce result |
| `whenComplete` | side-effect after completion |
| `orTimeout` | fail stage after timeout |
| `completeOnTimeout` | provide fallback value after timeout |

Use `thenCompose` instead of nested futures:

```java
CompletableFuture<Order> order = loadUser(userId)
        .thenCompose(user -> loadLatestOrder(user.username()));
```

## Java Memory Model

Threads may cache/reorder operations unless a happens-before relationship
provides visibility.

```java
private volatile boolean shutdown;
```

`volatile` gives visibility and ordering for that variable, not atomicity for
compound operations such as `count++`.

Use:

- `synchronized` or `Lock` for mutual exclusion;
- `AtomicInteger`, `AtomicReference`, `LongAdder` for atomic state;
- immutable objects and safe publication;
- concurrent collections for shared containers.

## Race Condition

```java
if (stock >= quantity) {
    stock -= quantity;
}
```

Two threads can both pass the check. In a database-backed service, enforce the
invariant atomically with optimistic locking, a conditional update, or a lock:

```sql
update inventory
set available = available - :quantity,
    version = version + 1
where product_id = :id
  and available >= :quantity
  and version = :version;
```

## Deadlock

```text
Thread A holds Order, waits for Inventory
Thread B holds Inventory, waits for Order
```

Prevent it by:

- acquiring locks in a consistent order;
- keeping lock scope short;
- avoiding remote calls while holding locks;
- using timed `tryLock`;
- reducing shared mutable state;
- detecting and retrying database deadlock victims safely.

## ThreadLocal And Context

`ThreadLocal` stores one value per carrier thread. Pools reuse threads, so
values must be cleared:

```java
try {
    context.set(correlationId);
    action.run();
} finally {
    context.remove();
}
```

MDC and security context do not automatically cross executors,
`CompletableFuture`, parallel streams, or arbitrary virtual-thread tasks.
Propagate only required context and clean it.

## Interruption And Cancellation

```java
try {
    queue.take();
} catch (InterruptedException exception) {
    Thread.currentThread().interrupt();
    return;
}
```

Interruption is a cooperative cancellation signal. Do not swallow it.
`Future.cancel(true)` requests interruption; it cannot guarantee external work
stopped.

## Platform Versus Virtual Threads

| Platform threads | Virtual threads |
|---|---|
| relatively expensive OS-backed threads | lightweight JVM-managed threads |
| pooled for bounded concurrency | thread-per-task is practical |
| blocking consumes scarce thread | blocking usually parks virtual thread |
| appropriate for CPU pools | strong fit for high-concurrency blocking I/O |

Virtual threads do not remove the need for rate limits, bulkheads, datasource
pools, deadlines, or backpressure.

## Interview And Tricky Questions

### `synchronized` Versus `volatile`

`volatile` provides visibility/order for one variable. `synchronized` also
provides mutual exclusion and supports compound invariants.

### `sleep` Versus `wait`

`sleep` pauses without releasing monitors. `wait` must be called while owning
the monitor and releases it until notification/reacquisition.

### `execute` Versus `submit`

`execute` accepts `Runnable` and reports uncaught failure through the thread's
handler. `submit` returns a `Future`; failure is observed from `get`.

### `join` Versus `get`

`CompletableFuture.join` throws unchecked `CompletionException`. `get` throws
checked `ExecutionException` and `InterruptedException`.

### Why Can CompletableFuture Hang?

Missing timeouts, common-pool starvation, blocking continuations, unresolved
manual futures, or cyclic dependencies can prevent completion.

### Is ConcurrentHashMap Enough For Every Compound Invariant?

No. Its atomic methods protect map operations, not multi-resource business
transactions.

## Production Practices

1. Prefer immutable state and task ownership.
2. Use bounded executors for platform threads.
3. Name threads and export pool metrics.
4. Add timeouts and cancellation.
5. Never block the reactive event loop.
6. Avoid common-pool blocking in server code.
7. Propagate MDC/security context deliberately.
8. Test races repeatedly and enforce invariants in durable storage.
9. Capture thread dumps for deadlock/starvation diagnosis.
10. Load-test virtual threads against real downstream limits.

