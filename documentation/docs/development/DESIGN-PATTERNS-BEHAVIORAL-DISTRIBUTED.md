---
title: "Behavioral And Distributed Patterns"
description: "Behavioral And Distributed Patterns with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "Behavioral And Distributed Patterns"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Behavioral And Distributed Patterns

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

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

## Recommended Next

Return to [Design Patterns](./DESIGN-PATTERNS.md) to select the next focused guide.


## Official References

- [Spring Framework reference](https://docs.spring.io/spring-framework/reference/)
- [Spring Boot reference](https://docs.spring.io/spring-boot/reference/)
