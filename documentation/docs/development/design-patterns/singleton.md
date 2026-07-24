---
title: "Singleton Pattern in Java and Spring"
description: "Compare Java singleton implementations with Spring scope, then address concurrency, lifecycle, testability, and distributed-system drawbacks."
sidebar_label: "Singleton"
tags: ["java", "spring", "design-patterns", "creational", "interview", "concurrency"]
page_type: "Deep Dive"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-24"
---

# Singleton Pattern in Java and Spring

<DocLabels items={[{label: 'Core pattern', tone: 'advanced'}, {label: 'Creational', tone: 'foundation'}, {label: 'Concurrency', tone: 'production'}]} />

The GoF Singleton controls its own construction and exposes one globally
accessible instance. A Spring singleton bean delegates construction and access to
the container and means **one bean instance per bean definition per application
context**.

## The Problem

Some process-local resources should have one owner: a metrics registry, a
configuration snapshot, or a client that owns an expensive connection pool.
Creating them repeatedly wastes resources and can produce conflicting state.

A global singleton appears to solve that problem, but it also creates hidden
dependencies, shared mutable state, lifecycle ambiguity, test coupling, and a
false sense of cluster-wide uniqueness. The real design question is: **who owns
the instance and its lifecycle?**

## The Important Distinction

| GoF singleton | Spring singleton scope |
|---|---|
| class usually owns a static instance | container owns the bean instance |
| often one per classloader | one per application context and bean definition |
| dependencies can be hidden | dependencies use constructor injection |
| difficult to replace in tests | bean can be replaced through configuration |

Two application contexts can each have their own instance. Two bean definitions
of the same class can also create two singleton-scoped objects.

## Implementation 1: Enum Singleton

```java
public enum ProcessClock {
    INSTANCE;

    public Instant now() {
        return Instant.now();
    }
}
```

An enum gives safe JVM initialization and correct serialization identity. It is
appropriate only for a truly process-global, dependency-free service.

### Drawback And Solution

The static access is difficult to replace in tests and makes the dependency
invisible at call sites. Prefer injecting `Clock` or an interface when behavior
must vary.

## Implementation 2: Initialization-On-Demand Holder

```java
public final class IdGenerator {
    private IdGenerator() {}

    private static final class Holder {
        private static final IdGenerator INSTANCE = new IdGenerator();
    }

    public static IdGenerator instance() {
        return Holder.INSTANCE;
    }
}
```

Class initialization provides thread-safe lazy creation without explicit
synchronization.

### Drawback And Solution

It still has global-state and testability costs. Do not add laziness unless
construction is expensive and may never be needed. Avoid hand-written
double-checked locking; it is easy to implement incorrectly and usually solves
a problem the container already handles.

## Implementation 3: Spring Singleton Bean

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

Constructor injection makes the shared service explicit and replaceable:

```java
@Service
final class PricingService {
    private final ExchangeRates exchangeRates;
    private final Clock clock;

    PricingService(ExchangeRates exchangeRates, Clock clock) {
        this.exchangeRates = exchangeRates;
        this.clock = clock;
    }
}
```

This is the default implementation for application services because Spring owns
construction, dependency wiring, proxies, initialization, and shutdown.

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

## Drawbacks, Remedies, And Tests

| Risk | Remedy | Proving test |
|---|---|---|
| request data is stored in fields | keep services stateless and pass request data as arguments | concurrent calls cannot see each other's data |
| static access hides dependencies | use constructor injection | instantiate the subject in a plain unit test |
| one JVM instance is mistaken for one cluster instance | use a database, distributed lock, queue, or leader election | multi-instance integration test |
| resource has no clear shutdown | let the container own it and declare cleanup | context shutdown closes the resource |
| shorter-lived dependency is captured once | use `ObjectProvider`, method injection, or a scoped proxy | two requested instances have distinct identity |
| global state leaks between tests | avoid mutable globals; reset only as a last resort | tests pass in any order |

Use concurrency tests only when the bean owns legitimate shared state. A context
test can verify scope identity, but proving identity alone says little about
correctness.

## Interview-Ready Answer

> A Spring singleton is one bean instance per definition per application context,
> not necessarily one object per JVM and never one object across replicas. The
> container manages construction and injection, unlike a static GoF singleton.
> Singleton scope does not guarantee thread safety, so I keep services stateless,
> use immutable dependencies, and handle shorter-lived scopes explicitly.

## Related Patterns

- [Factory](./factory.md) controls product selection or creation; Singleton
  controls lifecycle cardinality.
- [Prototype](./prototype.md) creates independent copies and should not be
  confused with Spring prototype bean scope.
- [Proxy](./proxy.md) means the injected singleton reference may be a proxy around
  a target bean.

## Official References

- [Spring bean scopes](https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html)
- [Spring dependency injection](https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html)
