---
title: Java Exception Handling Across Streams And Async Workflows
description: Custom exceptions, suppressed failures, stream exception patterns, executor failures, and CompletableFuture recovery semantics.
---

# Java Exception Handling Across Streams And Async Workflows

## Custom Exception Rules

Create a domain exception when callers can make a meaningful decision from its type or stable error code. Extend `RuntimeException` for programming/domain failures that callers cannot reasonably recover from at every boundary; reserve checked exceptions for explicitly recoverable contracts. Preserve causes and never place secrets or PII in messages.

```java
public final class InsufficientInventoryException extends RuntimeException {
    private final String code = "INVENTORY_INSUFFICIENT";
    public InsufficientInventoryException(String sku, Throwable cause) {
        super("Insufficient inventory for sku=" + sku, cause);
    }
    public String code() { return code; }
}
```

Do not swallow failures, catch `Throwable`, use exceptions for normal flow, or return from `finally`. Try-with-resources closes in reverse order; if the body and close both fail, the body failure is primary and close failures are available through `getSuppressed()`.

## Exceptions In Streams

Standard functional interfaces do not declare checked exceptions. Choose deliberately among extracting an ordinary loop, wrapping with the cause, returning a result type, or handling each element. Do not silently convert a failed element into an empty stream unless loss is an explicit business rule.

```java
record Attempt<T>(T value, Exception error) {
    static <T> Attempt<T> success(T value) { return new Attempt<>(value, null); }
    static <T> Attempt<T> failure(Exception e) { return new Attempt<>(null, e); }
    boolean succeeded() { return error == null; }
}

List<Attempt<Order>> attempts = ids.stream()
    .map(id -> {
        try { return Attempt.success(repository.load(id)); }
        catch (Exception e) { return Attempt.<Order>failure(e); }
    })
    .toList();
```

Parallel streams can wrap failures and other tasks may already be running when one fails. Side effects make partial completion difficult to reason about; prefer explicit executors when concurrency, retry, timeout, and observability matter.

## Executor Failure Semantics

An exception escaping `execute(Runnable)` reaches the worker's uncaught-exception handling. An exception from `submit` is captured by the `Future` and appears as the cause of `ExecutionException` on `get`; ignoring the returned future can hide it.

## CompletableFuture Failures

Failures propagate down dependent stages until a recovery/inspection stage handles them.

| Method | Sees success? | Sees failure? | Can transform result? |
|---|---:|---:|---:|
| `exceptionally` | no | yes | recovers to `T` |
| `handle` | yes | yes | transforms to `R` |
| `whenComplete` | yes | yes | observes, preserves outcome unless callback fails |

```java
CompletableFuture<Order> result = loadOrder(id)
    .orTimeout(500, TimeUnit.MILLISECONDS)
    .exceptionallyCompose(error ->
        isTransient(unwrap(error)) ? loadFromReplica(id) : CompletableFuture.failedFuture(unwrap(error))
    );
```

`join()` throws unchecked `CompletionException`; `get()` throws checked `ExecutionException` and `InterruptedException`. Inspect their cause without discarding context. Recovery placement matters: an early `exceptionally` converts failure into success, so later stages run normally.

`allOf` fails if a component fails but does not automatically cancel siblings. `cancel(true)` on a `CompletableFuture` is not a universal guarantee that underlying work or remote I/O stops. Design explicit deadlines and cancellation propagation.

Avoid blocking the common `ForkJoinPool` with slow I/O. Supply a bounded, observable executor, or use virtual threads for straightforward blocking workflows. Propagate logging/security context explicitly and never log sensitive payloads during failure handling.

## Tricky Interview Questions

<ExpandableAnswer title="Can whenComplete recover a value?">

No; use `handle` or `exceptionally`.

</ExpandableAnswer>

<ExpandableAnswer title="Why can submit appear to lose an exception?">

It is stored in an ignored `Future`.

</ExpandableAnswer>

<ExpandableAnswer title="Does allOf return all results?">

No; it returns `CompletableFuture<Void>`.

</ExpandableAnswer>

<ExpandableAnswer title="Does cancelling a future guarantee its HTTP call stops?">

No.

</ExpandableAnswer>

<ExpandableAnswer title="Should a stream catch every per-element exception and continue?">

Only when partial success is an explicit, observable contract.

</ExpandableAnswer>


## Official References

- [Throwable and suppressed exceptions](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Throwable.html)
- [CompletableFuture API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/CompletableFuture.html)
- [Stream package](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/stream/package-summary.html)

## Recommended Next

Continue with [Virtual Threads](./features-8-to-26/JAVA-VIRTUAL-THREADS.md), then run [Java Internals Labs](./JAVA-INTERNALS-LABS.md).
