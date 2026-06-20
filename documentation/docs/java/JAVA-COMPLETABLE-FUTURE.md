---
title: Java CompletableFuture
sidebar_position: 8
---

# Java CompletableFuture

`CompletableFuture<T>` represents a result that may become available later. It
can be completed by asynchronous work, manually completed by code, transformed,
combined with other futures, timed out, or recovered from failure.

It is useful when work can overlap:

```text
load user
load orders
load payments
  -> combine results
  -> return dashboard response
```

## Why We Need CompletableFuture

Plain synchronous code waits step by step:

```java
User user = userClient.getUser(userId);
List<Order> orders = orderClient.getOrders(userId);
List<Payment> payments = paymentClient.getPayments(userId);

return new Dashboard(user, orders, payments);
```

If these calls are independent, total latency becomes roughly:

```text
user call + order call + payment call
```

With `CompletableFuture`, independent calls can run at the same time:

```java
CompletableFuture<User> userFuture =
        CompletableFuture.supplyAsync(() -> userClient.getUser(userId), executor);

CompletableFuture<List<Order>> ordersFuture =
        CompletableFuture.supplyAsync(() -> orderClient.getOrders(userId), executor);

CompletableFuture<List<Payment>> paymentsFuture =
        CompletableFuture.supplyAsync(() -> paymentClient.getPayments(userId), executor);

CompletableFuture.allOf(userFuture, ordersFuture, paymentsFuture)
        .orTimeout(2, TimeUnit.SECONDS)
        .join();

return new Dashboard(
        userFuture.join(),
        ordersFuture.join(),
        paymentsFuture.join()
);
```

Now total latency is closer to the slowest call, not the sum of all calls.

## Future vs CompletableFuture

`Future<T>` is older and limited.

```java
Future<User> future = executor.submit(() -> userClient.getUser(userId));
User user = future.get();
```

Problems:

- `get()` blocks the caller;
- no fluent chaining;
- no easy combine operation;
- no built-in recovery pipeline;
- no clear timeout composition;
- exception handling becomes manual around `get()`.

`CompletableFuture<T>` supports composition:

```java
CompletableFuture<UserResponse> response =
        CompletableFuture.supplyAsync(() -> userClient.getUser(userId), executor)
                .thenApply(userMapper::toResponse)
                .exceptionally(this::fallbackUser);
```

| Feature | `Future` | `CompletableFuture` |
|---|---|---|
| Get result later | yes | yes |
| Manual completion | no | yes |
| Fluent transformations | no | yes |
| Combine multiple tasks | manual | built in |
| Recovery pipeline | manual | built in |
| Timeout stage | manual | `orTimeout`, `completeOnTimeout` |
| Callback-style composition | no | yes |

## `Future.get()` vs CompletableFuture

`Future.get()` blocks until the result is available:

```java
User user = future.get();
```

`CompletableFuture` lets you attach stages without blocking immediately:

```java
CompletableFuture<UserResponse> responseFuture =
        CompletableFuture.supplyAsync(() -> userClient.getUser(userId), executor)
                .thenApply(userMapper::toResponse);
```

Blocking still happens if you call:

```java
responseFuture.get();
responseFuture.join();
```

The advantage is that blocking can be delayed until the boundary where the
result is actually required.

## `get()` vs `join()`

| Method | Exceptions | Typical use |
|---|---|---|
| `get()` | checked `InterruptedException`, `ExecutionException`, `TimeoutException` | when caller must handle checked exceptions |
| `join()` | unchecked `CompletionException` | inside composed async pipelines or after `allOf` |

Example:

```java
try {
    User user = future.get(2, TimeUnit.SECONDS);
} catch (InterruptedException exception) {
    Thread.currentThread().interrupt();
    throw new RequestCancelledException(exception);
} catch (ExecutionException exception) {
    throw new UserLookupException(exception.getCause());
}
```

With `join()`:

```java
try {
    User user = future.join();
} catch (CompletionException exception) {
    throw new UserLookupException(exception.getCause());
}
```

Do not ignore interruption when using `get()`.

## Execution Model

There are two important forms:

```java
thenApply(...)
thenApplyAsync(...)
```

Non-async stages often run on the thread that completed the previous stage.

Async stages run on:

- the provided executor, if supplied;
- otherwise the common `ForkJoinPool`.

For server-side backend code, prefer an owned executor:

```java
ExecutorService ioExecutor = Executors.newFixedThreadPool(20);

CompletableFuture<User> userFuture =
        CompletableFuture.supplyAsync(() -> userClient.getUser(userId), ioExecutor);
```

Avoid putting blocking database or HTTP calls into the common pool.

## `supplyAsync`

Use `supplyAsync` when the task returns a value.

```java
CompletableFuture<Order> orderFuture =
        CompletableFuture.supplyAsync(() -> orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id)), executor);
```

## `runAsync`

Use `runAsync` when the task does not return a value.

```java
CompletableFuture<Void> auditFuture =
        CompletableFuture.runAsync(() -> auditService.recordLogin(username), executor);
```

If the result matters to the current request, do not fire and forget without
error handling.

## `thenApply`

Transforms a result.

```java
CompletableFuture<OrderResponse> responseFuture =
        orderFuture.thenApply(orderMapper::toResponse);
```

Use it for synchronous mapping.

## `thenAccept`

Consumes the result and returns `CompletableFuture<Void>`.

```java
CompletableFuture<Void> logFuture =
        orderFuture.thenAccept(order ->
                log.info("Order loaded orderNumber={}", order.orderNumber()));
```

Use it for side effects.

## `thenRun`

Runs the next stage without receiving the previous result.

```java
CompletableFuture<Void> cleanupFuture =
        uploadFuture.thenRun(tempFileService::cleanup);
```

## `thenCompose`

Use `thenCompose` when the next operation depends on the previous result and
also returns a future.

Bad nested future:

```java
CompletableFuture<CompletableFuture<Order>> nested =
        loadUser(username)
                .thenApply(user -> loadLatestOrder(user.id()));
```

Correct:

```java
CompletableFuture<Order> orderFuture =
        loadUser(username)
                .thenCompose(user -> loadLatestOrder(user.id()));
```

Rule:

```text
thenApply: T -> R
thenCompose: T -> CompletableFuture<R>
```

## `thenCombine`

Use `thenCombine` for two independent futures.

```java
CompletableFuture<User> userFuture = loadUser(username);
CompletableFuture<List<Order>> ordersFuture = loadOrders(username);

CompletableFuture<UserDashboard> dashboardFuture =
        userFuture.thenCombine(ordersFuture, UserDashboard::new);
```

This is useful when both tasks can run independently but their results are
needed together.

## `allOf`

`allOf` waits for all futures to complete.

```java
CompletableFuture<User> userFuture = loadUser(username);
CompletableFuture<List<Order>> ordersFuture = loadOrders(username);
CompletableFuture<List<Payment>> paymentsFuture = loadPayments(username);

CompletableFuture<Dashboard> dashboardFuture =
        CompletableFuture.allOf(userFuture, ordersFuture, paymentsFuture)
                .thenApply(ignored -> new Dashboard(
                        userFuture.join(),
                        ordersFuture.join(),
                        paymentsFuture.join()
                ));
```

`allOf` returns `CompletableFuture<Void>`, so you read individual results after
it completes.

## `anyOf`

`anyOf` completes when the first future completes.

```java
CompletableFuture<Object> fastest =
        CompletableFuture.anyOf(primaryProviderFuture, backupProviderFuture);
```

Use it carefully. The slower tasks are not automatically cancelled.

## Exception Handling

### `exceptionally`

Recover from failure:

```java
CompletableFuture<UserResponse> responseFuture =
        loadUser(username)
                .thenApply(userMapper::toResponse)
                .exceptionally(exception -> UserResponse.anonymous());
```

### `handle`

Handle success and failure and return a value:

```java
CompletableFuture<UserResponse> responseFuture =
        loadUser(username)
                .handle((user, exception) -> {
                    if (exception != null) {
                        return UserResponse.anonymous();
                    }
                    return userMapper.toResponse(user);
                });
```

### `whenComplete`

Observe the result without changing it:

```java
CompletableFuture<Order> future =
        loadOrder(orderNumber)
                .whenComplete((order, exception) -> {
                    if (exception != null) {
                        log.error("Order load failed orderNumber={}", orderNumber, exception);
                    } else {
                        log.info("Order loaded orderNumber={}", order.orderNumber());
                    }
                });
```

Use `whenComplete` for logging, metrics, cleanup, or tracing side effects.

## Timeouts

### `orTimeout`

Fails the future if it does not complete in time.

```java
CompletableFuture<User> userFuture =
        loadUser(username)
                .orTimeout(2, TimeUnit.SECONDS);
```

### `completeOnTimeout`

Provides a fallback value when time expires.

```java
CompletableFuture<UserProfile> profileFuture =
        loadProfile(username)
                .completeOnTimeout(UserProfile.minimal(username), 1, TimeUnit.SECONDS);
```

Timeouts are required in production. Without them, a stuck dependency can keep
work waiting indefinitely.

## Cancellation

```java
future.cancel(true);
```

Cancellation attempts to complete the future as cancelled. It does not
guarantee that the underlying HTTP call, database call, or external operation
has actually stopped.

Design downstream calls with their own timeouts.

## Backend Example: Dashboard Aggregation

```java
public DashboardResponse dashboard(String username) {
    CompletableFuture<UserResponse> userFuture =
            CompletableFuture.supplyAsync(() -> userClient.getUser(username), ioExecutor);

    CompletableFuture<List<OrderResponse>> ordersFuture =
            CompletableFuture.supplyAsync(() -> orderClient.getOrders(username), ioExecutor);

    CompletableFuture<List<PaymentResponse>> paymentsFuture =
            CompletableFuture.supplyAsync(() -> paymentClient.getPayments(username), ioExecutor);

    return CompletableFuture.allOf(userFuture, ordersFuture, paymentsFuture)
            .orTimeout(2, TimeUnit.SECONDS)
            .thenApply(ignored -> new DashboardResponse(
                    userFuture.join(),
                    ordersFuture.join(),
                    paymentsFuture.join()
            ))
            .exceptionally(this::fallbackDashboard)
            .join();
}
```

This pattern is useful for read-only aggregation. It is not a replacement for
proper distributed transactions.

## MDC And Security Context

`CompletableFuture` does not automatically propagate MDC or Spring Security
context to another executor thread.

Pass required values explicitly:

```java
String correlationId = MDC.get("correlationId");

CompletableFuture<Order> future =
        CompletableFuture.supplyAsync(() -> {
            try (MDC.MDCCloseable ignored =
                         MDC.putCloseable("correlationId", correlationId)) {
                return orderClient.getOrder(orderNumber);
            }
        }, executor);
```

For production, prefer a controlled context propagation mechanism instead of
copying arbitrary thread-local state.

## CompletableFuture vs Virtual Threads

| Use case | Better fit |
|---|---|
| compose multiple async results | `CompletableFuture` |
| simple blocking I/O with many concurrent requests | virtual threads |
| callback-style pipeline | `CompletableFuture` |
| sequential request code with blocking clients | virtual threads |
| CPU-bound parallel work | bounded executor or parallel framework |

Virtual threads can make blocking code simpler. `CompletableFuture` is still
useful when you need explicit composition, combination, racing, or recovery
pipelines.

## Do And Do Not

Do:

- use a custom executor for server-side blocking work;
- add timeouts;
- combine independent work with `thenCombine` or `allOf`;
- use `thenCompose` to avoid nested futures;
- handle exceptions intentionally;
- propagate only required context;
- limit fan-out;
- measure executor queue size, active threads, and dependency latency.

Do not:

- block the common pool with JDBC or HTTP calls;
- call `join()` too early and accidentally make code sequential;
- fire and forget important work without error handling;
- create unbounded futures for every item in a large list;
- hide slow downstream dependencies behind async code;
- assume cancellation stops external side effects;
- keep database transactions open across async stages;
- mutate shared state from multiple stages without synchronization.

## Tricky Interview Questions

### Does CompletableFuture make code non-blocking?

Not automatically. If the supplier calls a blocking HTTP client or JDBC query,
that work is still blocking on the executor thread.

### What happens if no executor is passed?

Async methods usually use the common `ForkJoinPool`. That is risky for
server-side blocking I/O because unrelated tasks can starve each other.

### Difference between `thenApply` and `thenCompose`?

`thenApply` maps a value to another value. `thenCompose` maps a value to
another future and flattens it.

### Difference between `exceptionally`, `handle`, and `whenComplete`?

`exceptionally` recovers only from failure. `handle` handles success or
failure and returns a replacement value. `whenComplete` observes success or
failure but does not transform the result.

### Why can CompletableFuture code hang?

Missing timeouts, common-pool starvation, blocking stages, unresolved manually
completed futures, cyclic dependencies, or waiting on a future from a thread
needed to complete that same future.

### Is `CompletableFuture.allOf(...).join()` safe?

It is safe after adding timeouts and exception handling. Without those, it can
wait indefinitely or fail with a wrapped exception.

