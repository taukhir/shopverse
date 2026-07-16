---
title: "Decorator Pattern in Spring"
description: "Compose explicit logging, metrics, validation, and resilience around Spring services while avoiding proxy confusion."
sidebar_label: "Decorator"
tags: ["spring", "design-patterns", "interview"]
page_type: "Deep Dive"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Decorator Pattern in Spring

<DocLabels items={[{label: 'Core pattern', tone: 'advanced'}, {label: 'Structural', tone: 'foundation'}, {label: 'Composition', tone: 'production'}]} />

Decorator wraps an object with the same contract to add responsibility. Multiple
decorators can be composed without creating subclasses for every combination.

## Explicit Composition

```java
public interface PaymentGateway {
    Authorization authorize(PaymentRequest request);
}

final class MeteredPaymentGateway implements PaymentGateway {
    private final PaymentGateway delegate;
    private final MeterRegistry meters;

    public Authorization authorize(PaymentRequest request) {
        Timer.Sample sample = Timer.start(meters);
        try {
            Authorization result = delegate.authorize(request);
            meters.counter("payment.authorization",
                    "outcome", result.outcome().name()).increment();
            return result;
        } finally {
            sample.stop(meters.timer("payment.authorization.duration"));
        }
    }
}
```

Wire the chain deliberately and expose only the outer bean as the default:

```java
@Configuration
class PaymentGatewayConfiguration {
    @Bean("providerGateway")
    PaymentGateway providerGateway(AcmePayClient client) {
        return new AcmePayAdapter(client);
    }

    @Bean
    @Primary
    PaymentGateway paymentGateway(
            @Qualifier("providerGateway") PaymentGateway core,
            MeterRegistry meters) {
        return new MeteredPaymentGateway(
                new ValidatingPaymentGateway(core), meters);
    }
}
```

```mermaid
flowchart LR
    C["Payment service"] --> M["Metrics decorator"]
    M --> V["Validation decorator"]
    V --> A["Provider adapter"]
```

Order changes semantics. Metrics outside retry measures the whole logical call;
metrics inside retry records each attempt. Caching outside authorization can be a
security bug. Treat composition order as architecture, not incidental wiring.

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

If Spring injects `PaymentGateway` into a decorator while multiple beans implement
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
