---
title: Order Status Dead-Transition Problem
status: maintained
last_reviewed: "2026-11-17"
page_type: Guide
difficulty: Advanced
scope: shopverse
owner: docs-reliability
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---


# Order Status Dead-Transition Problem

A guarded state-machine transition whose guard precondition is never produced
by any code path — found in Shopverse's order-service SAGA state machine,
tracked as `BUG-013` in
[`dev-tools/teams/BACKLOG.md`](https://github.com/taukhir/shopverse/blob/main/dev-tools/teams/BACKLOG.md).

Back to [Shopverse Problems And Solutions](../PROBLEMS-AND-SOLUTIONS.md).

## Checkout Never Reaches `CONFIRMED`

### Problem

`OrderStatus` declares 14 values for the order lifecycle, including
`PENDING_INVENTORY` as the state a freshly created order should sit in while
inventory reservation is in flight:

```java
public enum OrderStatus {
    ORDER_CREATED, PENDING_INVENTORY, INVENTORY_RESERVED, INVENTORY_REJECTED,
    PAYMENT_PROCESSING, PAYMENT_FAILED, CONFIRMED, CANCELLED,
    PACKING, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, RETURN_REQUESTED, RETURNED
}
```

The saga's inventory-event handlers guard on exactly that state before they
will advance an order:

```java
public void markInventoryRejected(String orderNumber) {
    OrderEntity order = findOrder(orderNumber);
    if (order.getStatus() != OrderStatus.PENDING_INVENTORY) {
        return; // stale or out-of-order event — ignore
    }
    order.markInventoryRejected();
}

public void markInventoryReservedAndPaymentProcessing(String orderNumber) {
    OrderEntity order = findOrder(orderNumber);
    if (order.getStatus() != OrderStatus.PENDING_INVENTORY) {
        return;
    }
    order.markInventoryReserved();
    order.markPaymentProcessing();
}
```

This guard looks like ordinary defensive SAGA coding: reject the event if the
order isn't in the state the handler expects, so a stale or duplicate
delivery can't double-apply a transition. That's the right instinct — but it
assumes something put the order into `PENDING_INVENTORY` first. Nothing does.
`OrderEntity`'s constructor only ever sets `ORDER_CREATED`:

```java
public OrderEntity(...) {
    this.status = OrderStatus.ORDER_CREATED;
    // ...
}
```

No other code path assigns `PENDING_INVENTORY`. `checkout()` commits the
order and enqueues the outbox event while the order is still
`ORDER_CREATED`. When `InventoryReservedEvent` or `InventoryRejectedEvent`
arrives, the guard compares `ORDER_CREATED != PENDING_INVENTORY`, finds it
true, and the handler **silently returns** — not an exception, not a log
line, just a no-op. The event is consumed, acknowledged, and discarded as if
it were a stale duplicate, which is exactly the case the guard was written to
protect against.

This is not a type-safety gap. Enum exhaustiveness checking (a `switch` that
must cover every declared value) verifies every value is *handled*; it says
nothing about whether a value is ever *produced*. `PENDING_INVENTORY` compiles
cleanly, appears in every switch that matters, and is read by two separate
guards — it is simply never written.

**The blast radius is larger than one missed state.** The same pattern
repeats down the chain: `PAYMENT_FAILED` and `CONFIRMED` are gated on
`PAYMENT_PROCESSING`, which only gets set inside the handler above — so those
are unreachable too. `PACKING`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`,
and `RETURN_REQUESTED` are each gated on the previous state in that same
chain. One missing assignment at the start of the lifecycle makes **9 of
`OrderStatus`'s 14 values dead code** — effectively the entire post-checkout
order lifecycle, confirmed by tracing every guard forward from
`ORDER_CREATED`.

Runtime evidence matches the trace: a real checkout (`ORD-389E84BE`) stayed
at `ORDER_CREATED` for 90 seconds after both `InventoryReservedEvent` and
`PaymentCompletedEvent` had been published and consumed — the events
happened; the order's state simply never moved.

A parallel sweep of `ReservationStatus` (inventory-service) and
`PaymentStatus` (payment-service) found every value in both reachable with a
satisfiable guard — this specific bug class is isolated to order-service's
status machine, not a property of the guarded-transition pattern itself.

### Fix: Assign The State At The Point Of Intent, Not In The Constructor

The fix is not to change the constructor's default or to relax the guard.
Collapsing `ORDER_CREATED` and `PENDING_INVENTORY` into one state would
remove the information the guard needs: `CUSTOMER_CANCELLABLE_STATUSES`
already treats them as distinct (an order is cancellable while
`ORDER_CREATED`/`PENDING_INVENTORY`, differently from later states), so a
constructor default would quietly change cancellation behavior too.

Instead, add an explicit transition method and call it where the order
actually starts waiting on inventory — inside `checkout()`, in the same
transaction as the outbox enqueue, immediately after the `ORDER_CREATED`
timeline entry is appended:

```java
@Transactional
public OrderResponse checkout(CheckoutRequest request) {
    OrderEntity order = repository.save(newOrderFrom(request));
    order.appendTimeline(OrderStatus.ORDER_CREATED, "Order created");
    order.markPendingInventory();          // new — the missing assignment
    order.appendTimeline(OrderStatus.PENDING_INVENTORY, "Awaiting inventory");
    outboxService.enqueue(orderCreatedEvent(order));
    return map(order);
}
```

```java
// OrderEntity
public void markPendingInventory() {
    this.status = OrderStatus.PENDING_INVENTORY;
}
```

Keeping the same transaction that enqueues the outbox event matters: the
state that unlocks the saga guards and the event that drives the saga
forward must become durable together, for the same reason the outbox pattern
itself exists (see [Outbox Pattern](../OUTBOX-PATTERN.md)) — a crash between
the two would either strand the order in `ORDER_CREATED` again, or publish an
event the guard can't yet accept.

**Proving the fix.** The regression test that would have caught this asserts
the state the bug actually breaks, not just the end-to-end happy path:

1. Immediately after `checkout()`, assert `status == PENDING_INVENTORY`
   (fails today — this is the exact assertion the bug violates).
2. Deliver `InventoryReservedEvent` and assert the guard now fires and the
   order reaches `PAYMENT_PROCESSING`.
3. Deliver the same event a second time and assert the now-reachable guard
   still only applies it once (the guard was never exercised at all before,
   so its idempotency was never actually tested).

**Separately needed, not part of this fix:** a one-off data remediation for
any real orders already stuck at `ORDER_CREATED` in an environment past this
point — an operational cleanup, not a Liquibase migration, and not something
to run without ops sign-off.

**Found alongside this bug, same root cause, worth removing in the same
change:** `OrderEntity.markReturned()` has no caller anywhere in the
codebase — a standalone instance of the same "declared but never reached"
pattern, unrelated to the `PENDING_INVENTORY` chain. The standalone service
methods `markInventoryReserved(String)` and `markPaymentProcessing(String)`
are likewise never called — the saga only ever calls the combined
`markInventoryReservedAndPaymentProcessing(String)` — so they are dead API
surface rather than a correctness bug, but they should go when this fix
lands.

### The General Lesson

A guard that checks "is the order in the state I expect" is only as sound as
the code that puts the order into that state in the first place. Reading a
state machine from its transition methods alone makes every guard look
correct, because each one *is* internally consistent — the defect is in what
never calls `markPendingInventory()`, which has no method to read and no
compiler warning to trip. The reliable way to find this bug class is to walk
the state machine the other direction: for every guarded value, confirm at
least one reachable code path assigns it before the guard that reads it can
ever run. Doing that walk once here is what turned "checkout never reaches
`CONFIRMED`" into "9 of 14 states are dead code," not the other way around.

**Status:** fixed 2026-11-17. `OrderEntity.markPendingInventory()` is
called in `checkout()` right after the `ORDER_CREATED` timeline append,
same transaction as the outbox enqueue — all 9 previously-dead
`OrderStatus` values are reachable again. Verified via new proving tests
in `OrderServiceImplTest` (unit-level; Docker was unavailable locally to
run the Testcontainers integration suite, so confirm against a real
running stack before treating this as closed in every environment).
Tracked as `BUG-013` in
[`dev-tools/teams/BACKLOG.md`](https://github.com/taukhir/shopverse/blob/main/dev-tools/teams/BACKLOG.md).

## Official References

- [Saga pattern — microservices.io](https://microservices.io/patterns/data/saga.html)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)

## Related Documentation

- [Outbox Pattern](../OUTBOX-PATTERN.md)
- [Saga Consistency And Compensation](../SAGA-CONSISTENCY-COMPENSATION.md)
- [Shopverse Saga Code Flow](../SHOPVERSE-SAGA-CODE-FLOW.md)
- [ADR 002: Kafka Choreography SAGA For Checkout](/architecture/adr/kafka-choreography-saga)
