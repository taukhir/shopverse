---
title: "SOLID With Java And Shopverse"
description: "SOLID With Java And Shopverse with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "SOLID With Java And Shopverse"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# SOLID With Java And Shopverse

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

## SOLID

| Principle | Meaning | Shopverse-oriented example |
|---|---|---|
| Single Responsibility | A class should have one reason to change | Controller handles HTTP; service handles business rules; repository handles persistence |
| Open/Closed | Extend behavior without repeatedly editing stable core logic | Payment outcome strategies can implement a common provider contract |
| Liskov Substitution | Implementations must honor the contract of their abstraction | A stub payment provider must return the same outcome model as a real provider |
| Interface Segregation | Prefer focused interfaces over broad dependency surfaces | Separate catalog lookup from inventory administration |
| Dependency Inversion | Business logic depends on contracts rather than concrete infrastructure | Order logic depends on `InventoryClient`, repositories, and publisher abstractions |

SOLID does not require an interface for every class. Add an abstraction when
there are multiple implementations, an architectural boundary, or a meaningful
testing benefit.

## SOLID With Java Examples

### Single Responsibility Principle

A class should have one cohesive reason to change.

Avoid:

```java
class UserService {
    void createUser(...) { }
    void sendWelcomeEmail(...) { }
    void generateMonthlyReport(...) { }
    void exportUsersToCsv(...) { }
}
```

This class changes for identity rules, email templates, reports, and file
formats.

Prefer:

```java
class UserRegistrationService {
    private final UserRepository users;
    private final WelcomeNotification notifications;
}

class UserReportService {
}

class UserExportService {
}
```

SRP is about reasons to change, not making every method its own class.

### Open/Closed Principle

Stable orchestration should be open to new behavior through extension:

```java
interface DiscountPolicy {
    Money discountFor(Order order);
}

class SeasonalDiscount implements DiscountPolicy {
    public Money discountFor(Order order) {
        return order.total().multiply(new BigDecimal("0.10"));
    }
}

class LoyaltyDiscount implements DiscountPolicy {
    public Money discountFor(Order order) {
        return order.customer().isLoyal()
                ? Money.of("10.00")
                : Money.zero();
    }
}
```

New policies can be introduced without repeatedly editing a central conditional
containing every discount type.

### Liskov Substitution Principle

If `S` is a subtype of `T`, callers using `T` must work correctly when given
`S`. A subtype must preserve the parent's promises:

- do not strengthen preconditions;
- do not weaken postconditions;
- preserve invariants;
- preserve expected exception and side-effect behavior.

#### Bird And Ostrich Violation

Bad abstraction:

```java
class Bird {
    void fly() {
        System.out.println("Flying");
    }
}

class Sparrow extends Bird {
}

class Ostrich extends Bird {
    @Override
    void fly() {
        throw new UnsupportedOperationException("Ostriches cannot fly");
    }
}
```

Caller:

```java
void moveBirdToAnotherTree(Bird bird) {
    bird.fly();
}
```

This works for `Sparrow` but fails for `Ostrich`. The base type promised that
every `Bird` can fly, so `Ostrich` cannot be substituted safely. Throwing
`UnsupportedOperationException` exposes the broken hierarchy.

Better model:

```java
interface Bird {
    void eat();
}

interface FlyingBird extends Bird {
    void fly();
}

class Sparrow implements FlyingBird {
    public void eat() { }
    public void fly() { }
}

class Ostrich implements Bird {
    public void eat() { }
    public void run() { }
}
```

Now only a `FlyingBird` is accepted where flight is required:

```java
void moveToAnotherTree(FlyingBird bird) {
    bird.fly();
}
```

The deeper lesson is not about birds. It is about avoiding base classes that
promise behavior some subtypes cannot support.

#### Rectangle And Square Violation

```java
class Rectangle {
    void setWidth(int width) { }
    void setHeight(int height) { }
    int area() { return 0; }
}

class Square extends Rectangle {
    @Override
    void setWidth(int width) {
        super.setWidth(width);
        super.setHeight(width);
    }
}
```

A caller expecting independent width and height can be surprised:

```java
rectangle.setWidth(5);
rectangle.setHeight(4);
assert rectangle.area() == 20;
```

With `Square`, the invariant changes. Prefer immutable separate shapes sharing
a smaller abstraction such as `Shape.area()`.

#### Real Service Example

Bad:

```java
interface PaymentGateway {
    PaymentResult charge(PaymentCommand command);
}

class ReportOnlyGateway implements PaymentGateway {
    public PaymentResult charge(PaymentCommand command) {
        throw new UnsupportedOperationException();
    }
}
```

If an implementation cannot honor charge semantics, it is not a
`PaymentGateway`. Give it a different interface.

### Interface Segregation Principle

Avoid forcing clients to depend on unrelated operations:

```java
interface InventoryOperations {
    Product getProduct(Long id);
    void reserve(Long id, int quantity);
    void replaceEntireCatalog(List<Product> products);
    void deleteAllInventory();
}
```

Prefer:

```java
interface InventoryQuery {
    Product getProduct(Long id);
}

interface InventoryReservation {
    Reservation reserve(Long id, int quantity);
}

interface InventoryAdministration {
    void replaceCatalog(List<Product> products);
}
```

The Order service should not receive administration capabilities it never uses.

### Dependency Inversion Principle

High-level policy should depend on stable contracts:

```java
interface PaymentAuthorizer {
    Authorization authorize(PaymentCommand command);
}

class CheckoutService {
    private final PaymentAuthorizer authorizer;

    CheckoutService(PaymentAuthorizer authorizer) {
        this.authorizer = authorizer;
    }
}
```

Infrastructure adapters implement the contract:

```java
class StripePaymentAdapter implements PaymentAuthorizer {
}

class StubPaymentAdapter implements PaymentAuthorizer {
}
```

Dependency injection is a mechanism that helps implement dependency inversion;
adding Spring annotations alone does not guarantee a good dependency direction.

## Additional Java Engineering Examples

### Prefer Domain Types Over Primitive Obsession

Avoid:

```java
void charge(String orderNumber, BigDecimal amount, String currency) {
}
```

Prefer:

```java
record Money(BigDecimal amount, Currency currency) {
    Money {
        Objects.requireNonNull(amount, "Money amount cannot be null");
        Objects.requireNonNull(currency, "Money currency cannot be null");
        if (amount.signum() < 0) {
            throw new IllegalArgumentException("amount must be non-negative");
        }
    }
}
```

`Money { ... }` is a **compact constructor**. In a record, Java already knows
the constructor parameters from the record header, so you can write validation
without repeating `Money(BigDecimal amount, Currency currency)`. The compact
constructor runs before the record instance is created. Use it for null checks,
normalization, and invariant validation.

`Objects.requireNonNull(value, "message")` fails fast with a specific
`NullPointerException` message. The message matters in production because logs
and stack traces show which required value was missing.

### Program To Capabilities

Accept the narrowest useful type:

```java
Money total(List<OrderLine> lines) {
}
```

Do not require `ArrayList` when only ordered iteration is needed.

### Avoid Boolean Control Parameters

```java
createUser(request, true, false);
```

The call is unclear. Prefer an options record, enum, or separate use cases:

```java
createUser(request, NotificationMode.SEND_WELCOME_EMAIL);
```

### Make Invalid States Difficult To Represent

Avoid a payment with unrelated nullable fields:

```java
class Payment {
    PaymentStatus status;
    String authorizationCode;
    String declineReason;
}
```

Use state-specific results:

```java
sealed interface PaymentResult
        permits AuthorizedPayment, DeclinedPayment {
}

record AuthorizedPayment(String authorizationCode)
        implements PaymentResult {
}

record DeclinedPayment(String reason)
        implements PaymentResult {
}
```

## Recommended Next

Return to [Engineering Principles](./ENGINEERING-PRINCIPLES.md) to select the next focused guide.


## Official References

- [Spring Framework reference](https://docs.spring.io/spring-framework/reference/)
- [Spring Boot reference](https://docs.spring.io/spring-boot/reference/)
