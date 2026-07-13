---
title: "Creational And Structural Patterns"
description: "Creational And Structural Patterns with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "Creational And Structural Patterns"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Creational And Structural Patterns

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

## Pattern Categories

| Category | Purpose |
|---|---|
| Creational | control object construction |
| Structural | compose objects and interfaces |
| Behavioral | coordinate responsibilities and communication |

Detailed pages:

| Page | Focus |
|---|---|
| [Creational Patterns](design-patterns/CREATIONAL-PATTERNS.md) | object creation, factories, builders, singleton |
| [Structural Patterns](design-patterns/STRUCTURAL-PATTERNS.md) | adapters, decorators, facades, proxies |
| [Behavioral Patterns](design-patterns/BEHAVIORAL-PATTERNS.md) | strategy, observer, chain of responsibility, state |

## Pattern Selection Cheat Sheet

Use this table to choose a pattern from the problem, not from the pattern name.

| Problem you see | Pattern to consider | Example |
|---|---|---|
| object creation has runtime choices | Factory Method | create payment gateway by type |
| related object families must change together | Abstract Factory | AWS clients versus Azure clients |
| object has many optional fields | Builder | order/test fixture creation |
| one managed instance per app context | Singleton/Spring singleton bean | pricing service, meter registry |
| external API does not match domain API | Adapter | wrap legacy bank SDK |
| add behavior around same interface | Decorator | metrics/logging/retry wrapper |
| simplify a complex subsystem | Facade | checkout facade over order/inventory/payment |
| control access/lifecycle | Proxy | Spring `@Transactional`, Feign client, Hibernate lazy proxy |
| tree of individual and grouped objects | Composite | product bundle, menu tree |
| many interchangeable algorithms | Strategy | card/UPI/PayPal payment |
| publish changes to subscribers | Observer | domain events, Kafka consumers |
| ordered handlers process a request | Chain of Responsibility | ATM dispenser, servlet filters, security filters |
| behavior depends on lifecycle state | State | payment status transitions |
| fixed workflow with variable steps | Template Method | import job |
| action should be represented as data | Command | refund command, queue message |

## How To Use Patterns Correctly

Good pattern use:

- removes duplicated decisions;
- makes new variants easier;
- isolates external dependencies;
- expresses domain intent;
- improves testability.

Bad pattern use:

- adds abstraction for one implementation;
- hides simple logic behind many classes;
- makes debugging harder;
- uses pattern names instead of domain names.

## Strategy

Use Strategy when one operation has interchangeable algorithms.

```java
public interface PaymentMethod {
    PaymentResult pay(PaymentCommand command);
}

@Component("card")
class CardPaymentMethod implements PaymentMethod {
    public PaymentResult pay(PaymentCommand command) {
        return PaymentResult.authorized();
    }
}

@Component("wallet")
class WalletPaymentMethod implements PaymentMethod {
    public PaymentResult pay(PaymentCommand command) {
        return PaymentResult.authorized();
    }
}
```

```java
@Service
class PaymentRouter {

    private final Map<String, PaymentMethod> methods;

    PaymentRouter(Map<String, PaymentMethod> methods) {
        this.methods = Map.copyOf(methods);
    }

    PaymentResult pay(String type, PaymentCommand command) {
        PaymentMethod method = Optional.ofNullable(methods.get(type))
                .orElseThrow(() -> new UnsupportedPaymentMethod(type));
        return method.pay(command);
    }
}
```

Prefer Strategy over a growing `switch` when algorithms vary independently.

## Factory

Factory centralizes construction decisions:

```java
class NotificationFactory {

    Notification create(Channel channel) {
        return switch (channel) {
            case EMAIL -> new EmailNotification();
            case SMS -> new SmsNotification();
            case PUSH -> new PushNotification();
        };
    }
}
```

In Spring, dependency injection often replaces a factory for managed
components. Use a factory when construction itself has runtime logic.

## Builder

Builder makes a complex immutable object readable:

```java
Order order = Order.builder()
        .customer("alice")
        .item(productId, 2)
        .shippingAddress(address)
        .build();
```

Use records or constructors for small objects. A builder is useful when many
optional fields or construction invariants exist.

## Singleton

Singleton means one accessible instance. Spring beans are singleton-scoped by
default within one application context:

```java
@Service
class PricingService {
}
```

This does not make the bean thread-safe. Keep singleton services stateless or
protect mutable state.

## References

- [Design Patterns Cheat Sheet - GeeksforGeeks](https://www.geeksforgeeks.org/system-design/design-patterns-cheat-sheet-when-to-use-which-design-pattern/)

Avoid hand-written global singletons:

```java
public static PricingService getInstance() { ... }
```

They hide dependencies and complicate testing. Prefer container-managed
lifecycle and constructor injection.

## Adapter

Adapter converts one interface into the application's expected contract:

```java
interface PaymentGateway {
    PaymentResult charge(PaymentCommand command);
}

class StripePaymentAdapter implements PaymentGateway {

    private final StripeClient stripeClient;

    public PaymentResult charge(PaymentCommand command) {
        StripeCharge response = stripeClient.createCharge(
                command.amount(),
                command.currency()
        );
        return map(response);
    }
}
```

The domain does not depend on the third-party SDK.

## Facade

Facade provides a simpler entry point over several collaborators:

```java
@Service
class CheckoutFacade {

    OrderResponse checkout(CheckoutCommand command) {
        validate(command);
        reserveInventory(command);
        createOrder(command);
        publishCheckoutStarted(command);
        return response();
    }
}
```

Do not let a facade become a giant service containing every business rule.

## Decorator

Decorator adds behavior while preserving an interface:

```java
class MeteredPaymentGateway implements PaymentGateway {

    private final PaymentGateway delegate;
    private final MeterRegistry registry;

    public PaymentResult charge(PaymentCommand command) {
        return registry.timer("payment.gateway")
                .record(() -> delegate.charge(command));
    }
}
```

Spring AOP is often suitable for broad cross-cutting behavior; Decorator keeps
the composition explicit.

## Proxy

Proxy controls access to another object:

```text
caller -> Spring proxy -> transaction/security/cache advice -> target
```

Spring uses proxies for `@Transactional`, `@Cacheable`, method security, and
other features. Proxy boundaries explain why self-invocation can bypass advice.

## Recommended Next

Return to [Design Patterns](./DESIGN-PATTERNS.md) to select the next focused guide.


## Official References

- [Spring Framework reference](https://docs.spring.io/spring-framework/reference/)
- [Spring Boot reference](https://docs.spring.io/spring-boot/reference/)
