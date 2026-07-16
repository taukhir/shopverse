---
title: "Singleton Pattern in Spring"
description: "Distinguish GoF and Spring singletons, design thread-safe stateless beans, and handle shorter-lived dependencies correctly."
sidebar_label: "Singleton"
tags: ["spring", "design-patterns", "interview", "concurrency"]
page_type: "Deep Dive"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Singleton Pattern in Spring

<DocLabels items={[{label: 'Core pattern', tone: 'advanced'}, {label: 'Creational', tone: 'foundation'}, {label: 'Concurrency', tone: 'production'}]} />

The GoF Singleton controls its own construction and exposes one globally
accessible instance. A Spring singleton bean delegates construction and access to
the container and means **one bean instance per bean definition per application
context**.

## The Important Distinction

| GoF singleton | Spring singleton scope |
|---|---|
| class usually owns a static instance | container owns the bean instance |
| often one per classloader | one per application context and bean definition |
| dependencies can be hidden | dependencies use constructor injection |
| difficult to replace in tests | bean can be replaced through configuration |

Two application contexts can each have their own instance. Two bean definitions
of the same class can also create two singleton-scoped objects.

```java
@Service
final class PricingService {
    Money price(Product product, PricingPolicy policy) {
        return policy.apply(product.basePrice());
    }
}
```

This bean is safe to share because request-specific data stays in method
arguments and local variables.

## Singleton Does Not Mean Thread-Safe

```java
@Service
class UnsafeCheckoutService {
    private String currentCustomer;

    void checkout(String customer) {
        currentCustomer = customer; // concurrent requests overwrite shared state
    }
}
```

Spring guarantees lifecycle scope, not synchronization. Avoid mutable
request-specific fields. For legitimate shared state such as a local cache, define
atomicity, memory bounds, eviction, and multi-instance consistency; usually use a
tested cache library or shared data store.

<DocCallout type="production" title="One bean is not one distributed instance">

Every application replica has its own application context and singleton beans.
An in-memory lock, counter, or cache is therefore local to one process and cannot
enforce a cluster-wide invariant.

</DocCallout>

## Shorter-Lived Beans Inside a Singleton

Constructor-injecting a prototype into a singleton resolves it once during
singleton creation. Ask the container when a fresh instance is genuinely needed:

```java
@Service
final class ExportService {
    private final ObjectProvider<ExportSession> sessions;

    ExportResult export(ExportCommand command) {
        return sessions.getObject().run(command);
    }
}
```

For web request or session scopes, scoped proxies can preserve injection into a
singleton while resolving the current scoped target. Keep scope transitions rare
and explicit.

## Lifecycle and Safe Publication

Prefer constructor injection and immutable fields. Do not publish `this` from a
constructor or start unmanaged background threads during construction. Use Spring
lifecycle hooks for resources, and make shutdown close executors, clients, or
connections that the bean owns.

## Testing

Use unit tests for service behavior and concurrency tests only when the bean owns
real shared state. A context test can verify scope identity by resolving the bean
twice, but proving identity alone says little about correctness.

## Interview-Ready Answer

> A Spring singleton is one bean instance per definition per application context,
> not necessarily one object per JVM and never one object across replicas. The
> container manages construction and injection, unlike a static GoF singleton.
> Singleton scope does not guarantee thread safety, so I keep services stateless,
> use immutable dependencies, and handle shorter-lived scopes explicitly.

## Related Patterns

- [Factory](./factory.md) controls product selection or creation; Singleton
  controls lifecycle cardinality.
- [Proxy](./proxy.md) means the injected singleton reference may be a proxy around
  a target bean.

## Official References

- [Spring bean scopes](https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html)
- [Spring dependency injection](https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html)
