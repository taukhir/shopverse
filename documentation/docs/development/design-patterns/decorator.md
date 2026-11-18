---
title: "Decorator Pattern in Spring"
description: "Compose explicit logging, metrics, validation, and resilience around Spring services while avoiding proxy confusion."
sidebar_label: "Decorator"
tags: ["spring", "design-patterns", "interview"]
page_type: Deep Dive
difficulty: Advanced
status: maintained
last_reviewed: "2026-07-13"
scope: generic
owner: docs-development
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Decorator Pattern in Spring

<DocLabels items={[{label: 'Core pattern', tone: 'advanced'}, {label: 'Structural', tone: 'foundation'}, {label: 'Composition', tone: 'production'}]} />

Decorator wraps an object with the same contract to add responsibility. Multiple
decorators can be composed without creating subclasses for every combination.

## Explicit Composition

```java
public interface InventoryLookup {
    StockLevel stockLevelOf(Sku sku);
}

final class CachingInventoryLookup implements InventoryLookup {
    private final InventoryLookup delegate;
    private final Cache<Sku, StockLevel> cache;

    public StockLevel stockLevelOf(Sku sku) {
        StockLevel cached = cache.getIfPresent(sku);
        if (cached != null) {
            return cached;
        }
        StockLevel fresh = delegate.stockLevelOf(sku);
        cache.put(sku, fresh);
        return fresh;
    }
}

final class CircuitBreakingInventoryLookup implements InventoryLookup {
    private final InventoryLookup delegate;
    private final CircuitBreaker circuitBreaker;

    public StockLevel stockLevelOf(Sku sku) {
        return circuitBreaker.executeSupplier(() -> delegate.stockLevelOf(sku));
    }
}
```

Wire the chain deliberately and expose only the outer bean as the default:

```java
@Configuration
class InventoryLookupConfiguration {
    @Bean("inventoryServiceLookup")
    InventoryLookup inventoryServiceLookup(InventoryServiceClient client) {
        return new InventoryServiceLookup(client);
    }

    @Bean
    @Primary
    InventoryLookup inventoryLookup(
            @Qualifier("inventoryServiceLookup") InventoryLookup core,
            CircuitBreaker circuitBreaker) {
        return new CircuitBreakingInventoryLookup(
                new CachingInventoryLookup(core), circuitBreaker);
    }
}
```

```mermaid
flowchart LR
    C["Checkout service"] --> B["Circuit-breaker decorator"]
    B --> Ca["Caching decorator"]
    Ca --> A["Inventory service lookup"]
```

Order changes semantics. A circuit breaker outside the cache still serves cached
stock levels when the inventory service is down (stale-but-available); a circuit
breaker placed *inside* the cache (wrapping only the live call, with the cache
checked first either way) behaves the same for cache hits but still protects the
inventory service from being hammered on a cache miss during an outage. Caching
outside a security check can be a security bug. Treat composition order as
architecture, not incidental wiring.

## The Failure Without An Ordering Discipline

Circular decoration is not a hypothetical. Suppose two decorators are each
constructed with a reference to "the other one" because a developer wired the
circuit-breaker decorator to call back into the caching decorator for a
"refresh" path, and the caching decorator was separately wired to call the
circuit-breaker decorator for its own fallback:

```java
CircuitBreakingInventoryLookup breaker = new CircuitBreakingInventoryLookup(caching, cb);
CachingInventoryLookup caching = new CachingInventoryLookup(breaker); // breaker not yet assignable
```

This specific shape fails to compile in Java (you cannot reference `breaker`
before it is assigned), which is the compiler catching the simplest case. The
runtime version of the same mistake slips through when the cycle is indirect —
decorator A delegates to a Spring-injected `InventoryLookup` interface, decorator
B implements the same interface and is also injected as "the" `InventoryLookup`
into A's dependency, and Spring's proxy/factory resolution ends up wiring A back
into itself through a shared bean name. The observable symptom is not a compile
error but a `StackOverflowError` thrown from `stockLevelOf`, with a stack trace
that is hundreds of frames of alternating `CachingInventoryLookup.stockLevelOf`
and `CircuitBreakingInventoryLookup.stockLevelOf` calls — the two decorators
calling each other forever instead of eventually reaching the real inventory
service. The fix is the same discipline named in the callout below: name and
qualify the core bean explicitly, and never let two decorators resolve "the"
interface bean for each other.

## Decorator or Spring AOP?

Use a decorator when the concern is interface-specific, needs explicit ordering,
or should be visible in ordinary unit tests. Use Spring AOP when one stable policy
applies across many beans and join points. Use a library integration for complex
retry, circuit-breaker, or cache semantics instead of writing concurrency logic
by hand.

## Decorator Versus Proxy

Both wrap a compatible target. Decorator's primary intent is adding responsibility
through composition. [Proxy](./proxy.md) controls access, lifecycle, location, or
method interception and is often created transparently by Spring.

<DocCallout type="mistake" title="Avoid accidental circular decoration">

If Spring injects `InventoryLookup` into a decorator while multiple beans implement
that interface, resolution may be ambiguous or self-referential. Name the core
bean, qualify the delegate, and make only the complete outer composition primary.

</DocCallout>

## Failure and Observability

Decorators must preserve the interface's semantic contract. Do not swallow
exceptions merely to record metrics. Avoid logging tokens or personal data. If a
decorator retries, define idempotency and which failures are retryable. Ensure
correlation context survives any async boundary.

## Testing

Inject a fake delegate and assert delegation count, argument preservation, return
value, failure propagation, and added side effects. Add one configuration test to
confirm bean selection and nesting order.

## Interview-Ready Answer

> Decorator adds behavior around the same interface through composition. In
> Spring I qualify the core bean, construct decorators in an intentional order,
> and expose the outer bean as primary. It is clearer than AOP for
> interface-specific policies, while AOP is useful for broad cross-cutting rules.
> The main risks are ambiguous wiring, incorrect order, and altered failure
> semantics.

## Related Patterns

- [Adapter](./adapter.md) changes an incompatible interface; Decorator preserves
  the interface.
- [Chain of Responsibility](./chain-of-responsibility.md) offers a flatter ordered
  handler model when each stage may stop processing.

## Official References

- [Spring AOP concepts](https://docs.spring.io/spring-framework/reference/core/aop/introduction-defn.html)
- [Spring bean annotation configuration](https://docs.spring.io/spring-framework/reference/core/beans/java/basic-concepts.html)
