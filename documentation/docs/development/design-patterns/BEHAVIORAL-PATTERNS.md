---
title: Behavioral Patterns
description: "Choose and implement Strategy, Observer, Chain of Responsibility, Template Method, and related behavioral patterns in Spring."
sidebar_label: "Behavioral Patterns"
tags: ["spring", "design-patterns", "behavioral"]
page_type: "Category Overview"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Behavioral Patterns

Behavioral patterns describe how objects communicate and how responsibility is
distributed. They are most useful when business behavior has multiple variants,
state transitions, ordered processing, retries, or event-driven reactions.

## Dedicated Pattern Guides

<TopicCards items={[
  {title: 'Strategy', href: '/development/design-patterns/strategy', description: 'Select interchangeable behavior with injected Spring beans.', icon: 'route', tags: ['Interview priority', 'Algorithms']},
  {title: 'Observer', href: '/development/design-patterns/observer', description: 'Publish typed events with explicit transaction semantics.', icon: 'network', tags: ['Interview priority', 'Events']},
  {title: 'Chain of Responsibility', href: '/development/design-patterns/chain-of-responsibility', description: 'Run ordered handlers that may continue or stop processing.', icon: 'layers', tags: ['Interview priority', 'Filters']},
  {title: 'Template Method', href: '/development/design-patterns/template-method', description: 'Protect a workflow skeleton while selected steps vary.', icon: 'brain', tags: ['Interview priority', 'Workflow']},
]} />

<DocCallout type="tip" title="Use this page for comparison">

This category page compares behavioral intent. Follow the cards for each core
pattern's canonical Spring implementation and interview guidance.

</DocCallout>

## Strategy

Strategy encapsulates interchangeable algorithms behind one interface.

### Problem

Payment logic often starts like this:

```java
if (method == CARD) {
    payByCard(command);
} else if (method == UPI) {
    payByUpi(command);
} else if (method == PAYPAL) {
    payByPaypal(command);
}
```

As providers grow, this becomes difficult to test and modify. Strategy moves
each algorithm into its own class.

### Example: E-Commerce Payment Processing

```java
public interface PaymentStrategy {
    PaymentResult pay(PaymentCommand command);
}

@Component("card")
class CardPaymentStrategy implements PaymentStrategy {
    public PaymentResult pay(PaymentCommand command) {
        return PaymentResult.authorized("CARD-AUTH-123");
    }
}

@Component("upi")
class UpiPaymentStrategy implements PaymentStrategy {
    public PaymentResult pay(PaymentCommand command) {
        return PaymentResult.authorized("UPI-AUTH-456");
    }
}
```

```java
@Service
class PaymentService {
    private final Map<String, PaymentStrategy> strategies;

    PaymentService(Map<String, PaymentStrategy> strategies) {
        this.strategies = Map.copyOf(strategies);
    }

    PaymentResult pay(String method, PaymentCommand command) {
        PaymentStrategy strategy = strategies.get(method);
        if (strategy == null) {
            throw new UnsupportedPaymentMethodException(method);
        }
        return strategy.pay(command);
    }
}
```

### When To Use

- multiple algorithms implement the same business operation;
- new variants should not require editing core orchestration;
- each variant has independent tests and dependencies.

## Observer

Observer notifies interested components when something happens.

### Real Uses

- stock price updates;
- push notifications;
- Kafka consumers;
- domain events;
- UI event listeners;
- audit logging after business actions.

### Example

```java
public record OrderConfirmedEvent(String orderNumber, String customerUsername) {
}

public interface OrderEventListener {
    void onOrderConfirmed(OrderConfirmedEvent event);
}

@Component
class EmailNotificationListener implements OrderEventListener {
    public void onOrderConfirmed(OrderConfirmedEvent event) {
        // send email
    }
}

@Component
class AuditListener implements OrderEventListener {
    public void onOrderConfirmed(OrderConfirmedEvent event) {
        // write audit record
    }
}
```

```java
@Service
class OrderEventPublisher {
    private final List<OrderEventListener> listeners;

    void publish(OrderConfirmedEvent event) {
        listeners.forEach(listener -> listener.onOrderConfirmed(event));
    }
}
```

In distributed systems, Kafka is a durable, cross-service Observer-style
mechanism. The producer publishes an event, and multiple consumer groups react
independently.

## Chain Of Responsibility

Chain of Responsibility passes a request through ordered handlers.

### Real Use: ATM Withdrawal

An ATM withdrawal can be modeled as a chain of denomination dispensers:

```java
public interface CashDispenser {
    void dispense(int amount);
}

public final class DenominationDispenser implements CashDispenser {
    private final int denomination;
    private final CashDispenser next;

    public DenominationDispenser(int denomination, CashDispenser next) {
        this.denomination = denomination;
        this.next = next;
    }

    public void dispense(int amount) {
        int notes = amount / denomination;
        int remaining = amount % denomination;

        if (notes > 0) {
            System.out.println("Dispense " + notes + " x " + denomination);
        }
        if (remaining > 0 && next != null) {
            next.dispense(remaining);
        }
    }
}
```

```java
CashDispenser chain =
        new DenominationDispenser(2000,
        new DenominationDispenser(500,
        new DenominationDispenser(100, null)));

chain.dispense(3700);
```

### Spring Examples

Spring uses this pattern heavily:

- Servlet filters;
- Spring Security filter chain;
- `HandlerInterceptor`;
- exception resolvers;
- validation pipelines.

Each filter can inspect, enrich, reject, or pass the request to the next filter.

## State

State moves behavior into lifecycle-state objects instead of large status
conditionals.

### Problem

Payment status is not only success/failure. Real systems have uncertain states:

- `PENDING`;
- `AUTHORIZED`;
- `CAPTURED`;
- `DECLINED`;
- `TIMED_OUT`;
- `REFUNDED`.

Allowed transitions matter. For example, you can refund a captured payment,
but you should not capture a declined payment.

### Example

```java
public sealed interface PaymentState
        permits PendingPayment, AuthorizedPayment, CapturedPayment, DeclinedPayment {

    PaymentState authorize();
    PaymentState capture();
    PaymentState refund();
}

public final class AuthorizedPayment implements PaymentState {
    public PaymentState authorize() {
        return this;
    }

    public PaymentState capture() {
        return new CapturedPayment();
    }

    public PaymentState refund() {
        throw new IllegalStateException("Cannot refund before capture");
    }
}
```

Use State when transition rules are important and status-based `if`/`switch`
logic is spreading across the service.

## Template Method

Template Method fixes the algorithm skeleton and lets subclasses provide
specific steps.

```java
abstract class CsvImportJob<T> {

    public final void run(Path file) {
        validateFile(file);
        List<T> rows = parse(file);
        validateRows(rows);
        persist(rows);
    }

    protected abstract List<T> parse(Path file);

    protected void validateFile(Path file) {
        Objects.requireNonNull(file, "file is required");
    }

    protected abstract void validateRows(List<T> rows);
    protected abstract void persist(List<T> rows);
}
```

Use it when the workflow is stable but individual steps differ.

## Command

Command turns an action into an object.

```java
public record RefundPaymentCommand(
        String paymentReference,
        BigDecimal amount,
        String reason
) {
}
```

Command objects are useful for:

- REST request DTOs;
- queue messages;
- audit logs;
- retries;
- undo workflows;
- validation.

## Behavioral Pattern Selection

| Problem | Pattern |
|---|---|
| choose payment algorithm | Strategy |
| notify multiple systems after an event | Observer |
| run ordered filters/validators | Chain of Responsibility |
| enforce lifecycle transitions | State |
| fixed workflow with variable steps | Template Method |
| represent an action as data | Command |

## Interview Questions

<ExpandableAnswer title="Strategy Versus State?">

Strategy selects an interchangeable algorithm from outside. State changes
behavior based on the object's internal lifecycle.

</ExpandableAnswer>
<ExpandableAnswer title="Observer Versus Pub/Sub?">

Observer is usually in-process. Pub/sub is distributed and durable when backed
by a broker such as Kafka. Kafka also adds offsets, replay, consumer groups,
and retention.

</ExpandableAnswer>
<ExpandableAnswer title="Chain Of Responsibility Versus Pipeline?">

They are similar. Chain of Responsibility often allows each handler to decide
whether to continue. A pipeline usually runs fixed stages in order.

</ExpandableAnswer>

## Official References

- [Spring application events](https://docs.spring.io/spring-framework/reference/core/beans/context-introduction.html#context-functionality-events)
- [Spring transaction-bound events](https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html)
