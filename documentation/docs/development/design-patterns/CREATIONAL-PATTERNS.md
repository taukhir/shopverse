---
title: Creational Patterns
description: "Choose among all five GoF creational patterns and follow dedicated Java and Spring implementation guides."
sidebar_label: "Creational Patterns"
tags: ["spring", "design-patterns", "creational"]
page_type: "Category Overview"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-24"
---

# Creational Patterns

Creational design patterns solve object-creation problems. They are useful when
object construction has rules, dependencies, variants, validation, lifecycle
constraints, or environment-specific choices.

Do not use a creational pattern just because `new` appears in code. Use one
when construction decisions are leaking into places that should only express
business intent.

## Dedicated Pattern Guides

<TopicCards items={[
  {title: 'Factory Method', href: '/development/design-patterns/factory', description: 'Move product selection and construction behind a stable product contract.', icon: 'boxes', tags: ['Runtime selection', 'Spring registry']},
  {title: 'Abstract Factory', href: '/development/design-patterns/abstract-factory', description: 'Create compatible families of related products without leaking vendor types.', icon: 'layers', tags: ['Product families', 'Environment variants']},
  {title: 'Builder', href: '/development/design-patterns/builder', description: 'Construct readable immutable objects while protecting required fields and cross-field invariants.', icon: 'code', tags: ['Stepwise construction', 'Domain design']},
  {title: 'Prototype', href: '/development/design-patterns/prototype', description: 'Derive independent objects from a configured template without unsafe shallow copies.', icon: 'experiment', tags: ['Copy semantics', 'Templates']},
  {title: 'Singleton', href: '/development/design-patterns/singleton', description: 'Understand Java and Spring singleton implementations, lifecycle, testability, and thread-safety.', icon: 'layers', tags: ['Bean scope', 'Concurrency']},
]} />

<DocCallout type="tip" title="Use this page for comparison">

This page compares the patterns. Each card opens a dedicated guide containing
the problem, a naive implementation, multiple Java or Spring solutions, their
drawbacks, mitigations, tests, and an interview-ready summary.

</DocCallout>

## Pattern Map

| Design pressure | Pattern | Core question | Prefer something simpler when |
|---|---|---|---|
| the concrete product varies | Factory Method | which implementation should the caller receive? | one constructor call is stable and obvious |
| several related products vary together | Abstract Factory | which compatible product family should be used? | only one product varies |
| construction has many named steps or optional values | Builder | how can callers assemble one valid product readably? | a record or named constructor is clear |
| a configured template must be copied | Prototype | how can a variation start from existing state safely? | construction is cheap and has little shared state |
| exactly one process-local instance is required | Singleton | who owns instance cardinality and lifecycle? | normal dependency injection already manages scope |

<DocCallout type="mistake" title="These patterns solve different problems">

Factory chooses a product, Builder assembles a product, Prototype copies a
product, Abstract Factory chooses a compatible family, and Singleton controls
instance cardinality. Similar-looking code does not make their intent
interchangeable.

</DocCallout>

## The Problem Creational Patterns Solve

Without creational patterns, application code often becomes full of conditionals
and construction details:

```java
PaymentGateway gateway;

if (method == PaymentMethod.CARD) {
    gateway = new StripeGateway(apiKey, timeout, mapper);
} else if (method == PaymentMethod.UPI) {
    gateway = new RazorpayGateway(merchantId, secret, httpClient);
} else if (method == PaymentMethod.PAYPAL) {
    gateway = new PaypalGateway(clientId, clientSecret);
} else {
    throw new UnsupportedOperationException("Unsupported payment method");
}
```

This makes the caller responsible for provider selection, dependency wiring,
configuration, and object lifecycle. Creational patterns move that responsibility
to a dedicated place.

## Factory Method

Factory Method centralizes the decision of which concrete implementation should
be created.

### When To Use

Use Factory Method when:

- callers depend on an interface, but the concrete implementation varies;
- object creation depends on input such as type, region, tenant, or feature flag;
- construction code is repeated in multiple places;
- you want to hide third-party implementation classes from domain code.

### Example: Payment Gateway Selection

```java
public interface PaymentGateway {
    PaymentResult pay(PaymentCommand command);
}

public enum PaymentType {
    CARD,
    UPI,
    PAYPAL
}

public final class PaymentGatewayFactory {

    private final CardGateway cardGateway;
    private final UpiGateway upiGateway;
    private final PaypalGateway paypalGateway;

    public PaymentGatewayFactory(
            CardGateway cardGateway,
            UpiGateway upiGateway,
            PaypalGateway paypalGateway
    ) {
        this.cardGateway = cardGateway;
        this.upiGateway = upiGateway;
        this.paypalGateway = paypalGateway;
    }

    public PaymentGateway gatewayFor(PaymentType type) {
        return switch (type) {
            case CARD -> cardGateway;
            case UPI -> upiGateway;
            case PAYPAL -> paypalGateway;
        };
    }
}
```

The checkout service now depends on the factory, not on every payment-provider
constructor:

```java
public PaymentResult pay(PaymentType type, PaymentCommand command) {
    PaymentGateway gateway = factory.gatewayFor(type);
    return gateway.pay(command);
}
```

### Spring Version

In Spring, you often do not manually create implementations. Spring creates
beans and injects a `Map<String, PaymentGateway>`:

```java
@Component("card")
class CardGateway implements PaymentGateway {
}

@Component("upi")
class UpiGateway implements PaymentGateway {
}

@Service
class PaymentGatewayRegistry {

    private final Map<String, PaymentGateway> gateways;

    PaymentGatewayRegistry(Map<String, PaymentGateway> gateways) {
        this.gateways = Map.copyOf(gateways);
    }

    PaymentGateway gatewayFor(String type) {
        PaymentGateway gateway = gateways.get(type);
        if (gateway == null) {
            throw new IllegalArgumentException("Unsupported payment type: " + type);
        }
        return gateway;
    }
}
```

This is Factory/Registry style using Spring's dependency injection container.

### Tradeoffs

| Benefit | Cost |
|---|---|
| callers stay clean | one more class to maintain |
| construction logic is centralized | factory can become a large switch if abused |
| easy to test selection rules | wrong abstraction if there is only one implementation |

## Abstract Factory

Abstract Factory creates a family of related objects.

### When To Use

Use Abstract Factory when multiple objects must change together.

Examples:

- AWS implementation: S3 client, SQS client, CloudWatch client;
- Azure implementation: Blob client, Queue client, Monitor client;
- test implementation: fake object store, fake queue, fake metrics;
- payment provider suite: authorize client, capture client, refund client.

### Example: Cloud Provider Family

```java
public interface CloudProviderFactory {
    ObjectStorageClient objectStorage();
    MessageQueueClient messageQueue();
    MetricsClient metrics();
}

public final class AwsCloudProviderFactory implements CloudProviderFactory {
    public ObjectStorageClient objectStorage() {
        return new S3ObjectStorageClient();
    }

    public MessageQueueClient messageQueue() {
        return new SqsMessageQueueClient();
    }

    public MetricsClient metrics() {
        return new CloudWatchMetricsClient();
    }
}
```

This prevents accidentally mixing incompatible families, such as using S3 for
objects but Azure Queue for messages in a deployment that should be fully AWS.

## Builder

Builder makes complex object creation readable and safe.

### When To Use

Use Builder when:

- an object has many optional fields;
- constructor argument order is easy to confuse;
- you want readable test fixtures;
- object construction needs validation before creation.

### Example

```java
Order order = Order.builder()
        .orderNumber("ORD-1001")
        .customerUsername("ana")
        .status(OrderStatus.CREATED)
        .totalAmount(new BigDecimal("2499.00"))
        .build();
```

### When Not To Use

Do not use Builder for small immutable DTOs where a Java record is clearer:

```java
public record Money(BigDecimal amount, Currency currency) {
    public Money {
        Objects.requireNonNull(amount, "amount is required");
        Objects.requireNonNull(currency, "currency is required");
    }
}
```

The compact constructor validates the record without repeating constructor
parameters.

## Singleton

Singleton guarantees one instance in a JVM.

### Common Real Uses

- application configuration manager;
- centralized logger facade;
- database connection pool object;
- metrics registry;
- cache manager.

### Java Singleton

```java
public enum ApplicationClock {
    INSTANCE;

    public Instant now() {
        return Instant.now();
    }
}
```

Enum singleton is serialization-safe and reflection-resistant compared with
many hand-written singleton implementations.

### Spring Singleton

In Spring, beans are singleton-scoped by default:

```java
@Service
class PricingService {
}
```

This is usually better than a static singleton because Spring controls:

- dependency injection;
- lifecycle callbacks;
- proxying for transactions/security;
- testing replacement with mocks;
- configuration.

### Important Clarification

Spring singleton means one bean instance per Spring application context. It does
not mean one instance across multiple JVMs, containers, Kubernetes pods, or
microservice replicas.

## Prototype

Prototype creates a new object by copying an existing template.

```java
public record NotificationTemplate(
        String subject,
        String body,
        Locale locale
) {
    public NotificationTemplate withLocale(Locale newLocale) {
        return new NotificationTemplate(subject, body, newLocale);
    }
}
```

Use Prototype when a mostly preconfigured object needs small variations.

## Object Pool

Object Pool reuses expensive objects instead of creating them repeatedly.

Common examples:

- database connection pools;
- HTTP connection pools;
- thread pools;
- ByteBuffer pools in high-performance systems.

In modern Java application code, you usually use existing pool implementations
instead of writing your own.

```java
spring.datasource.hikari.maximum-pool-size=20
```

Connection pools must be bounded. An unbounded pool hides backpressure and can
crash the database.

<DocCallout type="tip" title="Object Pool is related, but not one of the five GoF creational patterns">

Pooling is a lifecycle and resource-capacity technique. Prefer mature pools such
as HikariCP or an HTTP client's connection manager. Pool correctness also
requires bounded capacity, acquisition timeouts, validation, leak detection,
and guaranteed release—concerns that are intentionally outside the five
dedicated GoF guides.

</DocCallout>

## Choosing The Right Creational Pattern

| Problem | Good choice |
|---|---|
| choose one implementation based on type | Factory Method |
| create related objects from one provider family | Abstract Factory |
| create readable complex immutable object | Builder |
| one managed instance per app context | Spring singleton bean |
| copy a template object | Prototype |
| reuse expensive external resources | Object Pool |

## Interview Questions

<ExpandableAnswer title="Factory Versus Strategy?">

Factory decides which object to create or return. Strategy decides which
behavior to execute. They often work together: a factory can return a strategy.

</ExpandableAnswer>
<ExpandableAnswer title="Singleton In Microservices?">

A singleton is only local to one JVM. In a microservice deployed with three
replicas, each replica has its own singleton. For cross-replica coordination,
use a database, distributed lock, queue, or leader-election mechanism.

</ExpandableAnswer>
<ExpandableAnswer title="Builder Versus Constructor?">

Use constructors or records for small required objects. Use Builder when many
optional fields or readability problems exist.

</ExpandableAnswer>
<ExpandableAnswer title="Is Spring Bean Creation A Factory Pattern?">

Spring's `BeanFactory` and `ApplicationContext` are factory/container
implementations. They create, configure, wire, proxy, and manage bean lifecycle.

</ExpandableAnswer>

## Official References

- [Spring container overview](https://docs.spring.io/spring-framework/reference/core/beans/basics.html)
- [Spring bean scopes](https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html)
