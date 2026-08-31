---
title: "Amway Checkout Chain Of Responsibility"
description: "A checkout-specific deep dive into handler keys, pipeline construction, sequential stages, intended parallel groups, Reactor execution, short-circuiting, shared context, and tests."
sidebar_label: "Chain Of Responsibility"
tags: ["amway", "checkout", "chain-of-responsibility", "reactor", "pipeline"]
page_type: Deep Dive
difficulty: Advanced
status: maintained
learning_objectives: [Explain the checkout handler chain, Reconstruct staged handler execution, Verify sequential and parallel Reactor semantics, Design safe failure and mutation policies, Test the assembled pipeline]
technologies: [Spring, Project Reactor, Chain of Responsibility, Handler Pipeline]
last_reviewed: "2026-08-24"
scope: generic
owner: docs-architecture
reviewer: documentation-maintainers
review_evidence: user-provided-screenshot-conversation-reconstruction
---

# Amway Checkout Chain Of Responsibility

<DocLabels items={[
  {label: 'Screenshot-derived', tone: 'shopverse'},
  {label: 'Behavioral pattern', tone: 'advanced'},
  {label: 'Reactive pipeline', tone: 'production'},
]} />

The checkout implementation uses a list/key-based form of Chain of
Responsibility. A strategy produces handler keys; a pipeline builder resolves and
groups them; an executor runs each stage; a handler performs one focused part of
checkout processing.

<DocCallout type="mistake" title="Reconstructed API shapes">

Only names and fragments visible in the supplied screenshots are treated as
observed. Generic interfaces and method bodies below are explanatory
reconstructions. Confirm package names, generic signatures, separator constants,
publisher cardinality, and mutation behavior in the current source.

</DocCallout>

## Why This Is Chain Of Responsibility

The service does not directly call every checkout operation:

```java
// Avoid one hard-coded orchestration method like this:
enrichUsers();
enrichProducts();
searchAccount();
prepareCheckout();
calculateTax();
saveCheckout();
```

Instead, the selected strategy returns a description of the chain:

```java
List<String> handlerKeys = strategy.getHandlers(
        CheckoutFlow.CREATE_CHECKOUT,
        request
);

Mono<CheckoutCommonResponse> result =
        handlerExecutor.buildAndExecute(handlerKeys, request);
```

Unlike the classic linked implementation, individual handlers do not appear to
hold a `next` reference. The central executor owns continuation and ordering.

```text
classic chain: handlerA → handlerB → handlerC

checkout chain:
strategy → handler keys → pipeline builder → staged handlers → executor
```

## Reconstructed Handler Contract

The exact generic declaration was not visible. Conceptually, a step needs a
common request and returns an asynchronous common response:

```java
public interface CheckoutStepHandler {

    String key();

    Mono<CheckoutCommonResponse> handle(
            CheckoutCommonRequest request
    );
}
```

A focused handler might look like:

```java
@Component
public final class TaxCalculationStepHandler
        implements CheckoutStepHandler {

    @Override
    public String key() {
        return CheckoutHandlerEnum
                .CHECKOUT_TAX_CALCULATION_STEP_HANDLER_KEY
                .key();
    }

    @Override
    public Mono<CheckoutCommonResponse> handle(
            CheckoutCommonRequest request) {
        // Delegate to the real tax boundary and return normalized workflow data.
        return taxService.calculate(request);
    }
}
```

This example explains the shape; it is not a verbatim screenshot transcription.

## Complete Create-Checkout Chain

The reconstructed chain is:

```text
Enrich Users
  → [Enrich Product || Populate Segment]
  → Account Search
  → [Prepare Checkout || Rationing]
  → [Fulfillment || Account Balance || Delivery Fee || SOP]
  → Prepare Modification
  → Tax Calculation
  → Prepare Adjustment
  → Create/Save Checkout
```

`||` is the intended parallel separator. The sequential stages form dependency
barriers: a later stage can rely on completed outputs from the previous group.

## Strategy Code That Describes The Chain

The exact separator constant was not readable, so
`PARALLEL_HANDLER_SEPARATOR` below is an explicit placeholder:

```java
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
```

In the real code, each constant may be statically imported or qualified through
`CheckoutHandlerEnum`. Preserve the actual syntax when copying from source.

## Key-Based Pipeline Builder

The visible executor calls:

```java
List<List<Handler>> handlersList =
        keyBasedHandlerPipeline.buildList(keys);
```

Conceptually, the builder transforms:

```text
A
B || C
D
E || F || G
H
```

into:

```java
List.of(
        List.of(A),
        List.of(B, C),
        List.of(D),
        List.of(E, F, G),
        List.of(H)
);
```

A representative registry/builder shape is:

```java
@Component
public final class KeyBasedHandlerPipeline {

    private final Map<String, CheckoutStepHandler> handlersByKey;

    public KeyBasedHandlerPipeline(List<CheckoutStepHandler> handlers) {
        this.handlersByKey = handlers.stream()
                .collect(Collectors.toUnmodifiableMap(
                        CheckoutStepHandler::key,
                        Function.identity()
                ));
    }

    public List<List<CheckoutStepHandler>> buildList(List<String> stages) {
        return stages.stream()
                .map(this::resolveStage)
                .toList();
    }

    private List<CheckoutStepHandler> resolveStage(String stage) {
        return Arrays.stream(stage.split(PARALLEL_HANDLER_SEPARATOR))
                .map(String::trim)
                .map(this::requiredHandler)
                .toList();
    }

    private CheckoutStepHandler requiredHandler(String key) {
        CheckoutStepHandler handler = handlersByKey.get(key);
        if (handler == null) {
            throw new UnknownCheckoutHandlerException(key);
        }
        return handler;
    }
}
```

That code is a safe explanatory implementation, not extracted source. The actual
builder should reject duplicate registered keys, empty groups, malformed
separators, and missing mandatory terminal handlers.

## Reconstructed Executor

Visible fragments establish these calls:

```java
public Mono<CheckoutCommonResponse> buildAndExecute(
        List<String> keys,
        CheckoutCommonRequest request) {

    List<List<Handler>> handlersList =
            keyBasedHandlerPipeline.buildList(keys);

    List<Mono<CheckoutCommonResponse>> stepHandlersMono =
            new ArrayList<>();

    for (List<Handler> handlers : handlersList) {
        stepHandlersMono.add(
                Flux.concat(
                        prepareSteps(request, handlers)
                ).last()
        );
    }

    return Flux.concat(stepHandlersMono).last();
}
```

This preserves the code shown in the referenced extraction, with generic
`Handler` standing for the actual project type.

## Sequential Versus Parallel Semantics

The outer:

```java
Flux.concat(stepHandlersMono)
```

subscribes to stage publishers sequentially. The screenshots state that handlers
joined by the separator execute in parallel, but that behavior must live inside
`prepareSteps(...)` or inside an already combined publisher.

<DocCallout type="production" title="Concat is not parallel">

If `prepareSteps` merely returns one `Mono` per handler and passes them to
`Flux.concat`, the handlers are sequential. True concurrent subscription normally
uses `Mono.zip`, `Flux.merge`, or an equivalent operator. Verify this in source and
with a timing/concurrency test.

</DocCallout>

A clear staged executor could be modeled as:

```java
private Mono<CheckoutCommonResponse> executeStage(
        CheckoutCommonRequest request,
        List<CheckoutStepHandler> handlers) {

    List<Mono<CheckoutCommonResponse>> work = handlers.stream()
            .map(handler -> handler.handle(request))
            .toList();

    return Mono.zip(work, results -> mergeStageResults(results));
}

public Mono<CheckoutCommonResponse> execute(
        List<List<CheckoutStepHandler>> stages,
        CheckoutCommonRequest request) {

    return Flux.fromIterable(stages)
            .concatMap(stage -> executeStage(request, stage))
            .last();
}
```

This is a recommended model only. `concatMap` makes stage order explicit; `zip`
joins independent handlers inside one stage.

## Shared Context And Race Safety

`CheckoutCommonRequest` is shared workflow context. Sequential mutation is easy
to reason about, but parallel handlers can race if they update the same object:

```text
delivery-fee handler ─┐
                     ├─ both mutate checkout totals → lost/inconsistent update
account-balance ─────┘
```

Document read/write sets per handler. Prefer immutable partial results merged at
the stage barrier. Never assume that a Spring singleton handler can store
request-specific state in fields.

## Failure And Continuation

Expected reactive short-circuiting is:

```text
Mono.error from handler
    → current stage fails
    → later sequential stages are not subscribed
    → service error mapping receives the failure
```

Define what happens to sibling work in a parallel stage: cancel immediately,
wait and aggregate, or preserve a primary error. Normal business rejection,
timeout, technical failure, and cancellation should have distinct bounded codes.

The chain does not create a transaction across remote services. Any state-changing
handler needs idempotency, audit state, recovery, and business compensation when a
later stage fails.

## Tests That Matter

```java
@Test
void createCheckoutUsesApprovedStageOrder() {
    assertThat(strategy.getHandlers(CREATE_CHECKOUT, request))
            .containsExactly(
                    ENRICH_USERS,
                    ENRICH_PRODUCT + SEP + POPULATE_SEGMENT,
                    ACCOUNT_SEARCH,
                    PREPARE + SEP + RATIONING,
                    FULFILLMENT + SEP + BALANCE + SEP + DELIVERY_FEE + SEP + SOP,
                    PREPARE_MODIFICATION,
                    TAX,
                    PREPARE_ADJUSTMENT,
                    CREATE_DB
            );
}
```

Also prove:

- unknown and duplicate keys fail fast;
- sequential stages never overlap;
- intended parallel steps really overlap;
- one error prevents later stages;
- sibling cancellation follows policy;
- empty or multi-value publishers do not violate `.last()` assumptions;
- the database step is idempotent;
- a missing final handler cannot produce silent success.

## Official References

- [Chain Of Responsibility Pattern](https://refactoring.guru/design-patterns/chain-of-responsibility)
- [Project Reactor Reference Guide](https://projectreactor.io/docs/core/release/reference/)
- [Spring Framework Core Technologies](https://docs.spring.io/spring-framework/reference/core.html)
- [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/)

## Related Learning

- [Complete Create Checkout Flow](./AMWAY-CREATE-CHECKOUT-FLOW.md)
- [Checkout Strategy Pattern](./AMWAY-CHECKOUT-STRATEGY-PATTERN.md)
- [Checkout Factory And Provider](./AMWAY-CHECKOUT-FACTORY-PROVIDER.md)
- [Generic Chain of Responsibility](../development/design-patterns/chain-of-responsibility.md)
