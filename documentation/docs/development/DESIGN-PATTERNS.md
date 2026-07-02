---
title: Design Patterns
sidebar_position: 3
---

# Design Patterns

Design patterns are reusable solution shapes, not mandatory class structures.
Use them when they clarify change, ownership, or collaboration. Do not force a
pattern onto simple code.

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

## Chain Of Responsibility

Use a chain when several independent handlers inspect or process a request:

```java
public interface FraudRule {
    Optional<String> rejectionReason(PaymentCommand command);
}
```

```java
@Component
@Order(1)
class BlockedAccountRule implements FraudRule {
    public Optional<String> rejectionReason(PaymentCommand command) {
        return command.blockedAccount()
                ? Optional.of("BLOCKED_ACCOUNT")
                : Optional.empty();
    }
}
```

```java
@Service
class FraudRuleChain {

    private final List<FraudRule> rules;

    FraudRuleChain(List<FraudRule> rules) {
        this.rules = List.copyOf(rules);
    }

    void validate(PaymentCommand command) {
        rules.stream()
                .map(rule -> rule.rejectionReason(command))
                .flatMap(Optional::stream)
                .findFirst()
                .ifPresent(reason -> {
                    throw new PaymentRejectedException(reason);
                });
    }
}
```

Servlet filters and Spring Security filters are real chain examples.

## State

State moves behavior that depends on lifecycle state into explicit state
objects or transition rules.

```java
enum OrderStatus {
    CREATED {
        OrderStatus onInventoryReserved() {
            return INVENTORY_RESERVED;
        }
    },
    INVENTORY_RESERVED {
        OrderStatus onPaymentCompleted() {
            return CONFIRMED;
        }
    },
    CONFIRMED;

    OrderStatus onInventoryReserved() {
        throw new InvalidOrderTransition(this);
    }

    OrderStatus onPaymentCompleted() {
        throw new InvalidOrderTransition(this);
    }
}
```

```java
order.changeStatus(order.status().onPaymentCompleted());
```

This prevents invalid transitions from being spread across controllers and
listeners.

## Observer

Observer notifies subscribers when something happens:

```java
public record OrderCreated(Long orderId) {
}

@Transactional
public void createOrder(...) {
    OrderEntity order = repository.save(...);
    events.publishEvent(new OrderCreated(order.getId()));
}

@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void notifyCustomer(OrderCreated event) {
    notificationService.send(event.orderId());
}
```

Spring application events are in-process and not durable. Use Kafka plus an
outbox for cross-service or crash-resistant delivery.

## Template Method

Template Method defines a fixed algorithm skeleton with overridable steps:

```java
abstract class FileImporter {

    final ImportResult importFile(Path path) {
        validate(path);
        List<Row> rows = parse(path);
        return persist(rows);
    }

    protected abstract List<Row> parse(Path path);
    protected abstract ImportResult persist(List<Row> rows);
}
```

Prefer composition when subclasses vary substantially or inheritance creates
tight coupling.

## Command

Command represents an action as data:

```java
public record RefundPaymentCommand(
        String orderNumber,
        BigDecimal amount,
        String requestedBy
) {
}
```

Commands work well for queues, audit, retries, and explicit application use
cases. Do not confuse a command request with an immutable fact/event.

## Repository

Repository provides a collection-like persistence boundary:

```java
interface OrderRepository {
    Optional<Order> findByOrderNumber(String orderNumber);
    Order save(Order order);
}
```

Spring Data generates implementations, but the pattern is about hiding
persistence mechanics from domain/application logic.

## Specification

Specification represents composable business predicates:

```java
Specification<OrderEntity> confirmed =
        (root, query, cb) ->
                cb.equal(root.get("status"), OrderStatus.CONFIRMED);
```

It is useful for dynamic querying and domain rules, but large specification
trees can become harder to understand than explicit queries.

## Circuit Breaker

Circuit Breaker stops repeated calls to an unhealthy dependency:

```text
CLOSED -> failures cross threshold -> OPEN
OPEN -> wait duration -> HALF_OPEN
HALF_OPEN -> successful probes -> CLOSED
```

Use Resilience4j rather than implementing concurrency and timing logic
manually.

## Saga

Saga coordinates a distributed business transaction as local transactions and
compensations:

```text
create order
  -> reserve inventory
  -> charge payment
  -> confirm order

payment fails
  -> release inventory
  -> cancel order
```

Saga is a distributed-systems pattern, not a replacement for local database
transactions.

## Pattern Selection Questions

1. What changes independently?
2. Is the problem construction, composition, or behavior?
3. Does the pattern make ownership clearer?
4. Can a simple method or record solve it?
5. Does the team understand the added abstraction?
6. Can failures and runtime behavior still be observed?

## Anti-Patterns

- pattern-first design without a real variation point;
- an interface for every class;
- singleton mutable global state;
- service locator instead of dependency injection;
- one generic factory or handler for unrelated domains;
- inheritance hierarchies that violate substitutability;
- observers used for durable distributed messaging;
- strategies whose implementations require incompatible contracts.

## Related Guides

- [Engineering Principles](ENGINEERING-PRINCIPLES.md)
- [Spring AOP](../spring/SPRING-AOP.md)
- [Microservice Architecture](../architecture/MICROSERVICES-GENERIC.md)
- [SAGA](../reliability/SAGA-GENERIC.md)
