---
title: Java OOP
sidebar_position: 1
---

# Java Object-Oriented Programming

:::info Canonical learning route
Use this page for the OOP map. Specification-level dispatch, construction and
compatibility live in [Language And OOP Internals](./JAVA-LANGUAGE-OOP-INTERNALS.md),
with modern abstraction rules in [Abstract Classes And Interfaces](./JAVA-ABSTRACTION-INTERFACES.md).
:::

Object-oriented programming models behavior and state around collaborating
objects. Good OOP emphasizes cohesive responsibilities and explicit
relationships, not merely creating many classes.

## Four Main Principles

### Encapsulation

Keep state valid by controlling mutation:

```java
public final class BankAccount {
    private BigDecimal balance = BigDecimal.ZERO;

    public void deposit(BigDecimal amount) {
        if (amount.signum() <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        balance = balance.add(amount);
    }

    public BigDecimal balance() {
        return balance;
    }
}
```

Encapsulation is not just private fields plus getters/setters. `setBalance()`
would expose an invalid state transition.

### Abstraction

Expose what a collaborator needs without exposing implementation:

```java
public interface PaymentGateway {
    PaymentResult authorize(PaymentCommand command);
}
```

The caller depends on the capability, while Stripe, bank, and stub adapters can
implement it differently.

### Inheritance

Inheritance represents an **is-a** relationship:

```java
sealed interface PaymentResult
        permits Authorized, Declined {
}

record Authorized(String reference) implements PaymentResult {}
record Declined(String reason) implements PaymentResult {}
```

Prefer composition when subclasses would inherit behavior they cannot honor.

### Polymorphism

The same contract supports different runtime behavior:

```java
public final class PaymentService {
    private final PaymentGateway gateway;

    public PaymentService(PaymentGateway gateway) {
        this.gateway = gateway;
    }

    public PaymentResult pay(PaymentCommand command) {
        return gateway.authorize(command);
    }
}
```

## Association, Aggregation, And Composition

### Association

Objects know or use one another without lifecycle ownership:

```java
class Doctor {
    void consult(Patient patient) {
        // Doctor and patient exist independently.
    }
}
```

### Aggregation

A whole contains parts, but parts can exist independently:

```java
class Team {
    private final List<Player> players;

    Team(List<Player> players) {
        this.players = List.copyOf(players);
    }
}
```

Players can exist or move after the team is removed.

### Composition

The whole owns the lifecycle and invariant of its parts:

```java
class Order {
    private final List<OrderLine> lines = new ArrayList<>();

    void addItem(Product product, int quantity) {
        lines.add(new OrderLine(product.id(), quantity, product.price()));
    }

    private record OrderLine(long productId, int quantity, BigDecimal price) {}
}
```

`OrderLine` belongs to one Order and has no useful independent lifecycle.

## Is-A And Has-A

```text
AuthorizedPayment is-a PaymentResult
Order has-a collection of OrderLine
```

Use inheritance only for a truthful substitutable is-a relationship. Use
composition for configurable behavior and owned collaborators.

## Overloading And Overriding

### Overloading

Same method name, different parameter list; selected at compile time:

```java
void send(String message) {}
void send(String message, Duration timeout) {}
```

Return type alone cannot overload a method.

### Overriding

A subtype replaces inherited behavior; selected at runtime:

```java
interface Formatter {
    String format(Object value);
}

class JsonFormatter implements Formatter {
    @Override
    public String format(Object value) {
        return value.toString();
    }
}
```

An overriding method cannot reduce visibility and may use a covariant return
type. Static methods are hidden, not overridden.

## Abstract Class Versus Interface

| Interface | Abstract class |
|---|---|
| capability/contract | shared base state and behavior |
| multiple interfaces allowed | one class superclass |
| supports default/static/private methods | constructors and instance fields |
| ideal for ports and strategies | useful for strongly related implementations |

Do not add an abstract base class only to reuse a few utility methods.

## Equality

When overriding `equals`, also override `hashCode`:

```java
public record ProductId(long value) {}
```

Records provide value-based equality automatically. Mutable fields used in a
hash key can make an object unreachable inside `HashMap` or `HashSet`.

## SOLID Connection

- **SRP:** one reason to change.
- **OCP:** extend behavior through contracts rather than editing conditionals.
- **LSP:** every subtype must honor the base contract.
- **ISP:** prefer focused interfaces.
- **DIP:** depend on abstractions at architectural boundaries.

## Interview And Tricky Questions

### Can A Constructor Be Overridden?

No. Constructors are not inherited. They can be overloaded.

### Can A Private Method Be Overridden?

No. It is not visible to the subclass.

### Why Prefer Composition Over Inheritance?

Composition avoids rigid hierarchies, inherited unwanted behavior, and tight
coupling. Inheritance remains appropriate for a stable substitutable model.

### Overriding Versus Hiding?

Instance methods are overridden dynamically. Static methods and fields are
resolved from the declared type and are hidden.

### Can An Abstract Class Have A Constructor?

Yes. Subclass construction invokes it to initialize base state.

## Practices

| Do | Avoid |
|---|---|
| model business behavior, not data bags | public mutable fields |
| preserve invariants inside methods | setter for every field |
| favor immutable value objects | inheritance only for code reuse |
| program to focused contracts | deep class hierarchies |
| use records for immutable data carriers | records for mutable entities |

## Official References

- [JLS classes](https://docs.oracle.com/javase/specs/jls/se25/html/jls-8.html)
- [JLS interfaces](https://docs.oracle.com/javase/specs/jls/se25/html/jls-9.html)
