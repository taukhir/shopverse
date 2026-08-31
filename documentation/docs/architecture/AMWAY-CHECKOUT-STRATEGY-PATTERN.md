---
title: "Amway Checkout Strategy Pattern"
description: "How checkout selects a market-specific workflow strategy that converts CREATE_CHECKOUT and request context into an ordered handler pipeline."
sidebar_label: "Strategy Pattern"
tags: ["amway", "checkout", "strategy-pattern", "multi-tenant", "workflow"]
page_type: Deep Dive
difficulty: Advanced
status: maintained
learning_objectives: [Explain the checkout strategy boundary, Trace country strategy selection, Reconstruct handler selection code, Separate flow variation from execution, Test safe defaults and market registration]
technologies: [Spring, Strategy Pattern, Multi-Tenant Checkout, Handler Pipeline]
last_reviewed: "2026-08-24"
scope: generic
owner: docs-architecture
reviewer: documentation-maintainers
review_evidence: user-provided-screenshot-conversation-reconstruction
---

# Amway Checkout Strategy Pattern

<DocLabels items={[
  {label: 'Screenshot-derived', tone: 'shopverse'},
  {label: 'Behavioral pattern', tone: 'advanced'},
  {label: 'Market variation', tone: 'production'},
]} />

The Strategy pattern answers: **which checkout workflow definition applies to
this flow, request, and country/tenant?** The selected strategy does not execute
the business steps itself. It returns the handler plan consumed by the generic
executor.

## Position In The Runtime

```text
CheckoutServiceImpl
    ↓ provider.forCheckout()
CheckoutStepHandlerTenantStrategyFactory
    ↓ getStrategy(country)
CheckoutStepHandlerStrategy
    ↓ getHandlers(CREATE_CHECKOUT, request)
List<String> handler keys
    ↓
HandlerExecutor
```

The visible service code is reconstructed as:

```java
CheckoutStepHandlerStrategy strategy =
        stepHandlerStrategyFactoryProvider
                .forCheckout()
                .getStrategy(
                        TupleService.getTuples().getAmwayCountry()
                );

Mono<CheckoutCommonResponse> response =
        executor.buildAndExecute(
                strategy.getHandlers(
                        CheckoutFlow.CREATE_CHECKOUT,
                        request
                ),
                request
        );
```

This contains three decisions:

1. `forCheckout()` selects the workflow-family factory;
2. `getStrategy(country)` selects the market/tenant implementation;
3. `getHandlers(flow, request)` selects the handler plan for the operation.

## Reconstructed Strategy Contract

The exact interface was not visible. Its effective responsibility is
approximately:

```java
public interface CheckoutStepHandlerStrategy {

    List<String> getHandlers(
            CheckoutFlow flow,
            CheckoutCommonRequest request
    );
}
```

A base implementation might dispatch by flow:

```java
public abstract class AbstractCheckoutStepHandlerStrategy
        implements CheckoutStepHandlerStrategy {

    @Override
    public List<String> getHandlers(
            CheckoutFlow flow,
            CheckoutCommonRequest request) {

        return switch (flow) {
            case CREATE_CHECKOUT -> getHandlersForCreateCheckout(request);
            case UPDATE_CHECKOUT -> getHandlersForUpdateCheckout(request);
            default -> throw new UnsupportedCheckoutFlowException(flow);
        };
    }

    protected abstract List<String> getHandlersForCreateCheckout(
            CheckoutCommonRequest request
    );

    protected List<String> getHandlersForUpdateCheckout(
            CheckoutCommonRequest request) {
        throw new UnsupportedCheckoutFlowException(UPDATE_CHECKOUT);
    }
}
```

That is an explanatory design. Confirm whether the real project uses inheritance,
an interface default, or direct implementations.

## Default Create-Checkout Strategy

The screenshots show `DefaultCheckoutStepHandlerStrategy` and a method resembling
`getHandlersForCreateCheckout()`. Reconstructed with a placeholder separator:

```java
@Component
public final class DefaultCheckoutStepHandlerStrategy
        implements CheckoutStepHandlerStrategy {

    @Override
    public List<String> getHandlers(
            CheckoutFlow flow,
            CheckoutCommonRequest request) {

        if (flow != CheckoutFlow.CREATE_CHECKOUT) {
            throw new UnsupportedCheckoutFlowException(flow);
        }

        return getHandlersForCreateCheckout();
    }

    protected List<String> getHandlersForCreateCheckout() {
        return List.of(
                CHECKOUT_ENRICH_USERS_HANDLER_KEY.key(),
                CHECKOUT_ENRICH_PRODUCT_HANDLER_KEY.key()
                        + PARALLEL_HANDLER_SEPARATOR
                        + CHECKOUT_POPULATE_SEGMENT_STEP_HANDLER_KEY.key(),
                CHECKOUT_ACCOUNT_SEARCH_HANDLER_KEY.key(),
                CHECKOUT_PREPARE_STEP_HANDLER_KEY.key()
                        + PARALLEL_HANDLER_SEPARATOR
                        + CHECKOUT_RATIONING_STEP_HANDLER_KEY.key(),
                CHECKOUT_ENRICH_FULFILLMENT_HANDLER_KEY.key()
                        + PARALLEL_HANDLER_SEPARATOR
                        + CHECKOUT_ACCOUNT_BALANCE_CALCULATION_STEP_HANDLER_KEY.key()
                        + PARALLEL_HANDLER_SEPARATOR
                        + CHECKOUT_CALCULATE_DELIVERY_FEE_HANDLER_KEY.key()
                        + PARALLEL_HANDLER_SEPARATOR
                        + CHECKOUT_SOP_STEP_HANDLER_KEY.key(),
                CHECKOUT_PREPARE_MODIFICATION_HANDLER_KEY.key(),
                CHECKOUT_TAX_CALCULATION_STEP_HANDLER_KEY.key(),
                CHECKOUT_PREPARE_ADJUSTMENT_STEP_HANDLER_KEY.key(),
                CHECKOUT_CREATE_DB_HANDLER_KEY.key()
        );
    }
}
```

This consolidates the code described in the referenced conversation. The real
class may inherit the public `getHandlers` implementation and may not take
`request` for the default list.

## Why A Strategy Per Market

Checkout rules vary by market: taxation, fulfillment, warehouse selection,
rationing, payment, account treatment, promotions, and legal constraints can
change independently. Without Strategy, branching spreads through handlers:

```java
if (country == COUNTRY_A) {
    // one flow
} else if (country == COUNTRY_B) {
    // another flow
}
```

With Strategy:

```text
Country A → CountryACheckoutStepHandlerStrategy
Country B → CountryBCheckoutStepHandlerStrategy
fallback  → DefaultCheckoutStepHandlerStrategy
```

Every implementation must honor the same semantic contract: it returns a valid,
complete plan for the requested checkout flow.

## Extend Without Copying The Entire Pipeline

A market strategy can start from the default and insert a local step:

```java
@Component
public final class MarketCheckoutStepHandlerStrategy
        extends DefaultCheckoutStepHandlerStrategy {

    @Override
    protected List<String> getHandlersForCreateCheckout() {
        List<String> handlers = new ArrayList<>(
                super.getHandlersForCreateCheckout()
        );

        int taxIndex = handlers.indexOf(
                CHECKOUT_TAX_CALCULATION_STEP_HANDLER_KEY.key()
        );

        handlers.add(
                taxIndex,
                MARKET_COMPLIANCE_STEP_HANDLER_KEY.key()
        );

        return List.copyOf(handlers);
    }
}
```

This reduces duplication but makes index/order coupling important. A typed stage
model is safer than string surgery for large variations:

```java
public record CheckoutStage(
        String name,
        List<String> parallelHandlerKeys
) {
}
```

## Strategy Versus Handler

| Strategy owns | Handler owns |
|---|---|
| selection and order of steps | one step's business/integration behavior |
| market/flow variation | focused input/output contract |
| sequential/parallel grouping | error and retry semantics for its operation |
| complete pipeline invariant | execution, not global orchestration |

The strategy should not calculate tax or call a database. A tax handler should
not decide the entire market pipeline.

## Request-Dependent Handler Selection

The presence of `request` in `getHandlers(flow, request)` may allow conditional
plans, for example selected warehouse or loyalty application. If used, constrain
it carefully:

```java
if (request.getLoyaltyPointsApplicationRequestBizDto() != null) {
    handlers.add(LOYALTY_APPLICATION_HANDLER_KEY.key());
}
```

Dynamic plans complicate observability and testing. Record a bounded plan/version
identifier and prove every supported branch. Do not let untrusted request text
directly become a Spring bean or handler key.

## Default Strategy Safety

A default is convenient but risky. Decide whether an unknown country should:

- fail closed as unsupported;
- use a legally approved default;
- use a tenant configuration explicitly mapped to default.

Never silently apply another market's financial or compliance rules. Validate
the country/strategy registry at startup and alert on resolution failures.

## Tests

Use contract tests for every strategy:

```java
abstract class CheckoutStrategyContract {

    protected abstract CheckoutStepHandlerStrategy strategy();

    @Test
    void createPlanEndsWithPersistence() {
        List<String> handlers = strategy().getHandlers(
                CREATE_CHECKOUT,
                request()
        );

        assertThat(handlers.getLast())
                .isEqualTo(CHECKOUT_CREATE_DB_HANDLER_KEY.key());
    }
}
```

Also test exact order, group boundaries, duplicate keys, every supported flow,
unknown flow, market-specific insertions/removals, request-dependent branches,
and compatibility with the pipeline registry.

## Trade-Offs

### Benefits

- isolates market differences;
- removes widespread country switches;
- makes workflow plans independently testable;
- leaves the executor unchanged when a plan changes;
- supports Open/Closed Principle for many extensions.

### Costs

- handler order becomes indirect;
- copied market lists can drift;
- a default can hide missing registration;
- string keys defer mistakes to runtime;
- conditional plans multiply test cases.

## Official References

- [Strategy Pattern](https://refactoring.guru/design-patterns/strategy)
- [Spring Bean Scopes](https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html)
- [Project Reactor Reference Guide](https://projectreactor.io/docs/core/release/reference/)
- [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/)

## Related Learning

- [Complete Create Checkout Flow](./AMWAY-CREATE-CHECKOUT-FLOW.md)
- [Checkout Chain Of Responsibility](./AMWAY-CHECKOUT-CHAIN-OF-RESPONSIBILITY.md)
- [Checkout Factory And Provider](./AMWAY-CHECKOUT-FACTORY-PROVIDER.md)
- [Generic Strategy Pattern](../development/design-patterns/strategy.md)
