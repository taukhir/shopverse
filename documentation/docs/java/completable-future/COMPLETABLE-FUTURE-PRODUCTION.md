---
title: CompletableFuture Production Architecture
description: Capacity, context propagation, transactions, observability, virtual-thread trade-offs, and Shopverse aggregation design.
difficulty: Advanced
page_type: Architecture
status: Generic
technologies: [Java 24, CompletableFuture, Virtual Threads]
last_reviewed: "2026-07-13"
---

# CompletableFuture Production Architecture

## Shopverse Read Aggregation

```java
CompletableFuture<Order> order = async(() -> orderClient.load(orderId));
CompletableFuture<InventoryView> inventory =
        async(() -> inventoryClient.forOrder(orderId));
CompletableFuture<PaymentView> payment =
        async(() -> paymentClient.forOrder(orderId));

return CompletableFuture.allOf(order, inventory, payment)
        .orTimeout(800, MILLISECONDS)
        .thenApply(ignored -> new CheckoutView(
                order.join(), inventory.join(), payment.join()))
        .whenComplete(this::recordOutcome)
        .join();
```

This pattern fits independent, read-only calls. It is not a distributed transaction and
must not imply atomicity among order, inventory, and payment services.

## Capacity Model

For each executor record task type, thread count, queue policy, rejection behavior,
downstream concurrency limit, timeout, shutdown owner, and metrics. Async syntax does
not increase database connections or downstream quotas.

For virtual threads, replace thread-count sizing with explicit semaphores or client/pool
limits around scarce dependencies. For platform pools, bound both workers and queues.

## Context Propagation

MDC, security context, locale, transaction state and other `ThreadLocal` data do not
automatically become correct on another executor thread. Prefer explicit immutable
request context. If framework propagation is used, whitelist fields and clear them after
execution.

Never propagate an open persistence session or database transaction across unrelated
async stages. Define transactions inside the stage that owns the database work.

## Observability

Record:

- queue wait separately from execution time;
- executor active count, queue depth and rejection count;
- downstream latency and timeout reason;
- fan-out width and partial-result decisions;
- cancellation request and late completion;
- correlation identifiers without secrets or PII.

## CompletableFuture Versus Virtual Threads

| Workflow | Prefer |
|---|---|
| explicit fan-out/fan-in data flow | `CompletableFuture` |
| sequential blocking service orchestration | virtual threads |
| CPU-bound parallel computation | bounded CPU executor/ForkJoin design |
| structured child-task lifetime on a preview-enabled JDK | structured concurrency evaluation |

Virtual threads improve code shape for blocking I/O; they do not add capacity to a
database, payment provider, broker or remote service.

## Architecture Review Checklist

- One owned scheduling policy per workload class
- No blocking I/O in the common pool
- Bounded fan-out and resource acquisition
- Deadlines at every owner boundary
- Explicit partial-result and unknown-outcome semantics
- Idempotent/reconcilable side effects
- Context propagation and cleanup verified
- Shutdown and late-completion behavior tested

## Official References

- [`CompletableFuture` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/CompletableFuture.html)
- [Virtual Threads](https://openjdk.org/jeps/444)

## Recommended Next

Continue with [Concurrency Design Review](../JAVA-CONCURRENCY-DESIGN-REVIEW.md).
