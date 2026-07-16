---
title: "Factory Pattern in Spring"
description: "Choose Factory Method, Spring-managed registries, FactoryBean, and ObjectProvider without hiding dependencies."
sidebar_label: "Factory"
tags: ["spring", "design-patterns", "interview"]
page_type: "Deep Dive"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Factory Pattern in Spring

<DocLabels items={[{label: 'Interview priority', tone: 'advanced'}, {label: 'Creational', tone: 'foundation'}, {label: 'Spring', tone: 'production'}]} />

Factory centralizes a construction decision so callers depend on a product
contract rather than concrete classes or wiring details.

## Choose the Right Factory

| Need | Prefer |
|---|---|
| choose among existing singleton beans | injected registry |
| create a short-lived object from runtime data | application factory |
| customize how Spring creates a complex bean | `@Bean` method or `FactoryBean` |
| request scoped/prototype bean from a singleton | `ObjectProvider<T>` |
| only wire a fixed dependency graph | constructor injection, no custom factory |

## Spring-Managed Registry

For managed payment gateways, the factory should return existing beans rather
than call `new` and bypass Spring lifecycle behavior:

```java
public interface PaymentGateway {
    PaymentProvider provider();
    PaymentResult charge(PaymentCommand command);
}

@Component
final class PaymentGatewayFactory {
    private final Map<PaymentProvider, PaymentGateway> gateways;

    PaymentGatewayFactory(List<PaymentGateway> candidates) {
        this.gateways = candidates.stream().collect(Collectors.toUnmodifiableMap(
                PaymentGateway::provider,
                Function.identity()
        ));
    }

    PaymentGateway forProvider(PaymentProvider provider) {
        return Optional.ofNullable(gateways.get(provider))
                .orElseThrow(() -> new UnsupportedProvider(provider));
    }
}
```

This is often called a factory in application code, although it combines lookup
with Spring-managed registration.

## FactoryBean and BeanFactory

`BeanFactory` is Spring's foundational container contract. `ApplicationContext`
extends it with events, resource loading, and other application services.

A `FactoryBean<T>` is itself a bean that produces another object:

```java
final class ReportingClientFactoryBean implements FactoryBean<ReportingClient> {
    private final ReportingProperties properties;

    public ReportingClient getObject() {
        return ReportingClient.builder()
                .endpoint(properties.endpoint())
                .connectTimeout(properties.connectTimeout())
                .build();
    }

    public Class<?> getObjectType() { return ReportingClient.class; }
    public boolean isSingleton() { return true; }
}
```

Injecting `ReportingClient` gets the product. Looking up `&beanName` gets the
factory itself. For ordinary application configuration, a clear `@Bean` method is
usually easier to understand.

## Runtime-Created Products

Use a real factory when runtime data is part of construction:

```java
@Component
final class ShipmentFactory {
    Shipment create(CreateShipment command, Clock clock) {
        return Shipment.pending(
                ShipmentId.newId(), command.orderId(), clock.instant());
    }
}
```

The factory is injected; the created domain object need not be a Spring bean.

<DocCallout type="mistake" title="Do not turn a factory into a service locator">

Passing `ApplicationContext` around and calling `getBean()` hides dependencies,
weakens compile-time guidance, and complicates tests. Inject the candidates or an
`ObjectProvider` into one explicit factory boundary.

</DocCallout>

## Testing and Trade-offs

Test selection, unsupported keys, duplicate registrations, and construction
invariants. Factories isolate creation and improve substitution, but generic
factories with unrelated products become dumping grounds. If construction is a
single obvious constructor call, keep it direct.

## Interview-Ready Answer

> Factory moves construction or selection away from the client. In Spring,
> dependency injection already creates fixed object graphs, so I add a custom
> factory only for runtime selection, runtime construction, or specialized bean
> creation. I prefer an injected, immutable registry over `ApplicationContext`
> lookups and use `FactoryBean` only when its container integration adds value.

## Related Patterns

- [Strategy](./strategy.md) is frequently returned by a factory.
- [Builder](./builder.md) assembles one complex product step by step.
- [Singleton](./singleton.md) describes product scope, not creation selection.

## Official References

- [Spring container overview](https://docs.spring.io/spring-framework/reference/core/beans/basics.html)
- [Spring `FactoryBean` extension point](https://docs.spring.io/spring-framework/reference/core/beans/factory-extension.html)
