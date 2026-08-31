---
title: "Amway Checkout Factory And Strategy Provider"
description: "A code-level explanation of StepHandlerStrategyFactoryProvider, workflow-family factory selection, tenant/country strategy resolution, Spring wiring, tests, and trade-offs."
sidebar_label: "Factory And Provider"
tags: ["amway", "checkout", "factory-pattern", "provider", "strategy-pattern", "spring"]
page_type: Deep Dive
difficulty: Advanced
status: maintained
learning_objectives: [Read the provider code line by line, Distinguish provider factory and strategy responsibilities, Trace two-dimensional flow and tenant selection, Test Spring wiring and resolution failures, Evaluate provider indirection]
technologies: [Spring, Factory Pattern, Provider Pattern, Strategy Pattern, Constructor Injection]
last_reviewed: "2026-08-24"
scope: generic
owner: docs-architecture
reviewer: documentation-maintainers
review_evidence: user-provided-code-screenshot-reconstruction
---

# Amway Checkout Factory And Strategy Provider

<DocLabels items={[
  {label: 'Code reconstruction', tone: 'shopverse'},
  {label: 'Creational routing', tone: 'advanced'},
  {label: 'Spring wiring', tone: 'production'},
]} />

`StepHandlerStrategyFactoryProvider` is the top-level routing layer for strategy
factories. It first selects a workflow family—checkout, place order, logged-in
user, or anonymous user. The returned tenant factory then selects the
country/tenant strategy. That strategy defines the handler pipeline.

## Reconstructed Provider Code

The following class is reconstructed from the two supplied screenshots. The
`@Component` import is implied by the visible annotation; the package declaration
and imports were outside the captured area.

```java
@Component
public class StepHandlerStrategyFactoryProvider {

    private final CheckoutStepHandlerTenantStrategyFactory checkoutFactory;
    private final PlaceOrderStepHandlerTenantStrategyFactory placeOrderFactory;
    private final LoggedInUserStepHandlerTenantStrategyFactory loggedInUserFactory;
    private final AnonymousUserStepHandlerTenantStrategyFactory anonymousUserFactory;

    public StepHandlerStrategyFactoryProvider(
            CheckoutStepHandlerTenantStrategyFactory checkoutFactory,
            PlaceOrderStepHandlerTenantStrategyFactory placeOrderFactory,
            LoggedInUserStepHandlerTenantStrategyFactory loggedInUserFactory,
            AnonymousUserStepHandlerTenantStrategyFactory anonymousUserFactory) {

        this.checkoutFactory = checkoutFactory;
        this.placeOrderFactory = placeOrderFactory;
        this.loggedInUserFactory = loggedInUserFactory;
        this.anonymousUserFactory = anonymousUserFactory;
    }

    public CheckoutStepHandlerTenantStrategyFactory forCheckout() {
        return checkoutFactory;
    }

    public PlaceOrderStepHandlerTenantStrategyFactory forPlaceOrder() {
        return placeOrderFactory;
    }

    public LoggedInUserStepHandlerTenantStrategyFactory forLoggedInUser() {
        return loggedInUserFactory;
    }

    public AnonymousUserStepHandlerTenantStrategyFactory forAnonymousUser() {
        return anonymousUserFactory;
    }
}
```

The screenshot Javadoc describes it as an “abstract factory/provider that
exposes each factory,” although the class itself is a concrete Spring component,
not a Java `abstract` class.

## What Each Field Represents

```text
checkoutFactory
    → strategies for checkout workflows by tenant/country

placeOrderFactory
    → strategies for place-order workflows by tenant/country

loggedInUserFactory
    → strategies for logged-in-user workflows by tenant/country

anonymousUserFactory
    → strategies for anonymous-user workflows by tenant/country
```

All fields are `final`, so the provider's collaborators cannot be reassigned
after construction. Constructor injection makes dependencies mandatory and lets
plain unit tests create the class without starting Spring.

## Runtime Call From Checkout

The service uses the provider as follows:

```java
CheckoutStepHandlerStrategy strategy =
        stepHandlerStrategyFactoryProvider
                .forCheckout()
                .getStrategy(
                        TupleService.getTuples().getAmwayCountry()
                );

List<String> handlerKeys = strategy.getHandlers(
        CheckoutFlow.CREATE_CHECKOUT,
        request
);

Mono<CheckoutCommonResponse> response =
        executor.buildAndExecute(handlerKeys, request);
```

Read it as three questions:

```text
Provider: which workflow-family factory?
    forCheckout()

Tenant factory: which country/tenant strategy?
    getStrategy(country)

Strategy: which handler pipeline for this flow/request?
    getHandlers(CREATE_CHECKOUT, request)
```

## Two-Dimensional Routing Matrix

The provider splits a conceptual matrix by workflow row:

| Workflow family | Country A | Country B | Default |
|---|---|---|---|
| checkout | checkout strategy A | checkout strategy B | default checkout strategy |
| place order | place-order strategy A | place-order strategy B | default place-order strategy |
| logged-in user | logged-in strategy A | logged-in strategy B | default logged-in strategy |
| anonymous user | anonymous strategy A | anonymous strategy B | default anonymous strategy |

One giant resolver would need branching for every cell:

```java
getStrategy(flowType, country)
```

The layered design separates dimensions:

```text
StepHandlerStrategyFactoryProvider
    ├── forCheckout()
    ├── forPlaceOrder()
    ├── forLoggedInUser()
    └── forAnonymousUser()
            ↓
specific tenant strategy factory
            ↓ getStrategy(country)
concrete workflow strategy
```

## Spring Bean Creation

Because the provider is a `@Component`, Spring constructs it after resolving the
four factory beans:

```text
create tenant strategy factory beans
    ↓
resolve constructor by type
    ↓
create StepHandlerStrategyFactoryProvider
    ↓
inject provider into CheckoutServiceImpl
```

No business service needs to call `new CheckoutStepHandlerTenantStrategyFactory()`.
Spring owns bean lifecycle and dependency composition.

If multiple beans implement the same concrete factory type or interface, wiring
must use unambiguous types, `@Qualifier`, or a registry. The application should
fail at startup rather than choose unpredictably.

## Provider, Factory, And Strategy Are Different

| Component | Question answered | Typical output |
|---|---|---|
| `StepHandlerStrategyFactoryProvider` | Which workflow family? | a tenant strategy factory |
| `CheckoutStepHandlerTenantStrategyFactory` | Which tenant/country? | a checkout strategy |
| `CheckoutStepHandlerStrategy` | Which workflow plan? | ordered handler keys |
| `HandlerExecutor` | How is the plan executed? | `Mono<CheckoutCommonResponse>` |

The provider does not choose the country. The tenant factory does not execute
handlers. The strategy does not construct Spring beans. Each layer owns one
decision.

## Tenant Factory: Conceptual Registry

The actual `CheckoutStepHandlerTenantStrategyFactory` code was not included in
the screenshots. A safe implementation might look like this:

```java
public interface TenantCheckoutStrategy {
    AmwayCountry country();
    CheckoutStepHandlerStrategy strategy();
}
```

```java
@Component
public final class CheckoutStepHandlerTenantStrategyFactory {

    private final Map<AmwayCountry, CheckoutStepHandlerStrategy> strategies;
    private final CheckoutStepHandlerStrategy defaultStrategy;

    public CheckoutStepHandlerTenantStrategyFactory(
            List<TenantCheckoutStrategy> registrations,
            @Qualifier("defaultCheckoutStepHandlerStrategy")
            CheckoutStepHandlerStrategy defaultStrategy) {

        this.strategies = registrations.stream()
                .collect(Collectors.toUnmodifiableMap(
                        TenantCheckoutStrategy::country,
                        TenantCheckoutStrategy::strategy
                ));
        this.defaultStrategy = defaultStrategy;
    }

    public CheckoutStepHandlerStrategy getStrategy(AmwayCountry country) {
        return Optional.ofNullable(strategies.get(country))
                .orElse(defaultStrategy);
    }
}
```

This is explanatory, not extracted code. The real class might use a switch,
qualifiers, a map of beans, inheritance, or tenant configuration. Inspect it
before documenting default behavior as fact.

## Why Not Inject The Checkout Factory Directly?

A service concerned only with checkout could inject:

```java
private final CheckoutStepHandlerTenantStrategyFactory checkoutFactory;
```

and call:

```java
checkoutFactory.getStrategy(country);
```

The provider is valuable when many orchestrators need consistent access to
multiple workflow families or when discoverability of all families matters. Its
trade-off is one extra indirection and a growing constructor as new families are
added.

If most callers need only one family, direct injection reduces coupling. If the
provider grows to dozens of accessors, consider a typed registry keyed by a
workflow-family enum—but ensure callers do not pass untrusted strings as keys.

## Pattern Classification

This design combines:

- **Provider/facade-like access:** one dependency exposes several factories;
- **Factory/resolver:** tenant factory returns the appropriate strategy;
- **Strategy:** selected object defines the workflow plan;
- **Dependency injection:** Spring constructs and connects objects;
- **Chain/pipeline:** executor runs the plan.

It is not necessarily textbook Abstract Factory because the provider returns
factory beans rather than creating a compatible product family on each call. The
project Javadoc's “abstract factory/provider” phrase describes architectural
intent more than a strict GoF classification.

## Failure Policies

Define these explicitly:

- null or missing country;
- unsupported country;
- duplicate country registrations;
- missing default strategy;
- a strategy that does not support `CREATE_CHECKOUT`;
- factory bean ambiguity during Spring startup;
- tenant context changing during one checkout attempt.

Resolve country once near the workflow boundary and keep it stable throughout
the request. Do not re-read mutable thread-local tenant context in later handlers.

## Tests

Provider unit test:

```java
@Test
void exposesTheInjectedCheckoutFactory() {
    var provider = new StepHandlerStrategyFactoryProvider(
            checkoutFactory,
            placeOrderFactory,
            loggedInUserFactory,
            anonymousUserFactory
    );

    assertThat(provider.forCheckout()).isSameAs(checkoutFactory);
    assertThat(provider.forPlaceOrder()).isSameAs(placeOrderFactory);
    assertThat(provider.forLoggedInUser()).isSameAs(loggedInUserFactory);
    assertThat(provider.forAnonymousUser()).isSameAs(anonymousUserFactory);
}
```

Tenant factory tests should cover every supported country, unsupported/null
country, duplicate registration, explicit default policy, and the expected
strategy type. Add one focused Spring context test to prove the four factories
and provider are wired unambiguously.

Service collaboration test:

```java
@Test
void resolvesCheckoutCountryStrategyBeforeBuildingTheChain() {
    when(provider.forCheckout()).thenReturn(checkoutFactory);
    when(checkoutFactory.getStrategy(country)).thenReturn(strategy);
    when(strategy.getHandlers(CREATE_CHECKOUT, commonRequest))
            .thenReturn(handlerKeys);

    service.createCheckout(apiRequest);

    verify(checkoutFactory).getStrategy(country);
    verify(strategy).getHandlers(CREATE_CHECKOUT, commonRequest);
    verify(executor).buildAndExecute(handlerKeys, commonRequest);
}
```

## Extension Scenarios

Adding a country should normally affect only the relevant tenant factory
registration and new strategy. Adding a workflow family such as return or cancel
may add a new tenant factory and provider accessor:

```java
public ReturnOrderStepHandlerTenantStrategyFactory forReturnOrder() {
    return returnOrderFactory;
}
```

That demonstrates Open/Closed Principle for existing workflow families, though
the provider itself changes when a new family is added.

## Review Checklist

- [ ] Provider code matches the current source and has no field injection.
- [ ] Every workflow-family factory has one unambiguous Spring bean.
- [ ] Tenant lookup uses a typed, validated country key.
- [ ] Duplicate strategies fail at startup.
- [ ] Default/unsupported-country behavior is legally and operationally explicit.
- [ ] Country is resolved once per checkout and propagated safely.
- [ ] Strategy returns a complete, validated handler plan.
- [ ] Provider, factory, strategy, and executor tests cover their own boundaries.

## Official References

- [Factory Method Pattern](https://refactoring.guru/design-patterns/factory-method)
- [Abstract Factory Pattern](https://refactoring.guru/design-patterns/abstract-factory)
- [Spring Bean Overview](https://docs.spring.io/spring-framework/reference/core/beans/basics.html)
- [Spring Dependency Injection](https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html)

## Related Learning

- [Complete Create Checkout Flow](./AMWAY-CREATE-CHECKOUT-FLOW.md)
- [Checkout Strategy Pattern](./AMWAY-CHECKOUT-STRATEGY-PATTERN.md)
- [Checkout Chain Of Responsibility](./AMWAY-CHECKOUT-CHAIN-OF-RESPONSIBILITY.md)
- [Generic Factory Pattern](../development/design-patterns/factory.md)
- [Generic Abstract Factory](../development/design-patterns/abstract-factory.md)
