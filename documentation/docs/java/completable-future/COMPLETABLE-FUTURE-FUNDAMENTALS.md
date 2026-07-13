---
title: CompletableFuture Fundamentals And Execution
description: Creation, manual completion, Future comparison, blocking boundaries, executor selection, and stage execution semantics.
difficulty: Intermediate
page_type: Guide
status: Generic
technologies: [Java 24, CompletableFuture, Executor]
last_reviewed: "2026-07-13"
---

# CompletableFuture Fundamentals And Execution

## Future Versus CompletableFuture

`Future<T>` primarily exposes waiting and cancellation. `CompletableFuture<T>` also
implements `CompletionStage<T>`, enabling transformations and combinations without
forcing the caller to wait between operations.

| Capability | `Future` | `CompletableFuture` |
|---|---:|---:|
| wait for a result | yes | yes |
| manual completion | no | yes |
| transformation pipeline | no | yes |
| combine independent results | manual | yes |
| stage-local recovery | manual | yes |

## Creation Forms

```java
CompletableFuture<Order> ready = CompletableFuture.completedFuture(order);

CompletableFuture<Order> loaded = CompletableFuture.supplyAsync(
        () -> orderRepository.findRequired(orderId), ioExecutor);

CompletableFuture<Void> audited = CompletableFuture.runAsync(
        () -> audit.record(orderId), ioExecutor);
```

Use manual completion only when adapting a callback API or deliberately exposing a
completion handle. Every manually created future needs a path for success, failure,
timeout, and owner shutdown.

## Execution Semantics

The `Async` suffix means schedule the stage; it does not mean the supplier itself is
non-blocking.

| Form | Normal execution location |
|---|---|
| `thenApply(fn)` | thread completing the upstream stage, or caller if already complete |
| `thenApplyAsync(fn)` | common `ForkJoinPool` |
| `thenApplyAsync(fn, executor)` | supplied executor |
| `supplyAsync(task)` | common pool |
| `supplyAsync(task, executor)` | supplied executor |

For backend blocking I/O, pass an owned executor or use a virtual-thread-per-task
executor. Do not place JDBC or blocking HTTP calls in the common pool, where unrelated
pipelines can starve each other.

## `get` Versus `join`

```java
try {
    return future.get(500, TimeUnit.MILLISECONDS);
} catch (InterruptedException interrupted) {
    Thread.currentThread().interrupt();
    throw new RequestCancelledException(interrupted);
} catch (ExecutionException failed) {
    throw mapFailure(failed.getCause());
}
```

`get` exposes checked interruption and execution failures. `join` wraps failure in
`CompletionException` and has no timed overload. `join` is convenient after a composed
barrier; it is not permission to wait without a deadline.

## Thread And Resource Ownership

- Name and meter owned platform-thread pools.
- Bound platform-thread count and queue length.
- Bound scarce downstream resources even when using virtual threads.
- Close executors during application shutdown.
- Never assume the request thread executes a non-async continuation.

## Shopverse Experiment

Record the current thread in a supplier and in `thenApply`, then repeat with an already
completed upstream stage. The observed thread may change; the semantic contract is the
result dependency, not thread affinity.

## Official References

- [`CompletableFuture` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/CompletableFuture.html)
- [`Executor` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/Executor.html)

## Recommended Next

Continue with [Composition And Fan-Out](./COMPLETABLE-FUTURE-COMPOSITION.md).
