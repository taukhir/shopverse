---
title: "Amway Next Gen Checkout Learning Path"
description: "The organized entry point for Amway checkout domain knowledge, create-checkout execution, design patterns, OpenAPI contracts, project technology, AWS delivery, and observability."
sidebar_label: "Amway Next Gen Checkout"
tags: ["amway", "checkout", "learning-path", "architecture"]
page_type: Learning Path
difficulty: Intermediate
status: maintained
learning_objectives: [Navigate the Amway checkout documentation, Follow the recommended onboarding sequence, Distinguish confirmed screenshot evidence from inferred guidance, Connect domain flow patterns contracts technology and operations]
technologies: [Checkout, Spring, Quarkus, OpenAPI, AWS, Dynatrace]
last_reviewed: "2026-08-24"
scope: generic
owner: docs-architecture
reviewer: documentation-maintainers
review_evidence: user-provided-project-context-and-documentation-review
---

# Amway Next Gen Checkout Learning Path

<DocLabels items={[
  {label: 'Umbrella guide', tone: 'shopverse'},
  {label: 'Checkout onboarding', tone: 'intermediate'},
  {label: 'Evidence-aware', tone: 'production'},
]} />

This is the single entry point for the Amway Next Gen checkout material. The
guides are grouped by the question they answer: what the checkout domain means,
how create checkout executes, which patterns organize the workflow, how API
contracts and technology fit together, and how the service is delivered and
observed.

<DocCallout type="mistake" title="Several evidence levels are intentionally kept separate">

The business primer uses public information and general commerce modeling. The
create-checkout and design-pattern pages reconstruct user-provided code
screenshots. The technology and delivery pages describe the stack reported by
the user. None of these replaces the current internal source, OpenAPI contract,
tests, runbooks, or decisions owned by the responsible team.

</DocCallout>

## Recommended Onboarding Order

```text
1. Domain primer
      ↓
2. Complete create-checkout flow
      ↓
3. Chain → Strategy → Factory/Provider
      ↓
4. Project technology stack
      ↓
5. OpenAPI contract artifacts
      ↓
6. AWS delivery, Argo CD, and Dynatrace
```

Follow this order during initial onboarding. Return directly to a focused group
when reviewing a defect or design change.

## Domain And Execution

<TopicCards items={[
  {title: 'Commerce and checkout domain primer', href: '/architecture/AMWAY-CHECKOUT-DOMAIN-PRIMER', description: 'Understand cart, account, profile, checkout, post-checkout, identity, money, and market-specific domain boundaries.', icon: 'book', tags: ['Domain', 'Business']},
  {title: 'Complete create-checkout execution flow', href: '/architecture/AMWAY-CREATE-CHECKOUT-FLOW', description: 'Trace controller validation, mapping, workflow context, strategy resolution, handler execution, persistence, and response preparation.', icon: 'route', tags: ['Execution', 'Reactor']},
]} />

Start here when you need to answer:

- What do account, profile, cart, checkout, and post-checkout mean?
- Where does request validation happen?
- How does `createCheckout` move from controller to database?
- Which parts of the flow were observed versus inferred?

## Checkout Design Patterns

<TopicCards items={[
  {title: 'Chain of Responsibility', href: '/architecture/AMWAY-CHECKOUT-CHAIN-OF-RESPONSIBILITY', description: 'Understand handler keys, pipeline construction, sequential stages, intended parallel groups, short-circuiting, and tests.', icon: 'layers', tags: ['Handlers', 'Pipeline']},
  {title: 'Strategy pattern', href: '/architecture/AMWAY-CHECKOUT-STRATEGY-PATTERN', description: 'See how flow, request, and country select a market-specific handler plan.', icon: 'route', tags: ['Market', 'Workflow']},
  {title: 'Factory and strategy provider', href: '/architecture/AMWAY-CHECKOUT-FACTORY-PROVIDER', description: 'Read the reconstructed provider code and follow workflow-family factory to tenant strategy resolution.', icon: 'boxes', tags: ['Factory', 'Provider']},
]} />

The three pattern pages describe different responsibilities:

```text
Provider  → which workflow-family factory?
Factory   → which tenant/country strategy?
Strategy  → which handler plan?
Chain     → execute that plan in defined stages
```

## Contracts And Technology

<TopicCards items={[
  {title: 'Project technology stack', href: '/architecture/AMWAY-PROJECT-TECH-STACK', description: 'Connect Java 21, Quarkus, Gradle, PostgreSQL, DynamoDB, MapStruct, feature flags, AWS CDK, Docker, delivery, and quality tooling.', icon: 'boxes', tags: ['Stack', 'Architecture']},
  {title: 'OpenAPI contracts and generated artifacts', href: '/architecture/AMWAY-OPENAPI-CONTRACT-ARTIFACTS', description: 'Define retail contracts, generate Java DTOs, publish immutable artifacts, consume them safely, and evolve compatibility.', icon: 'code', tags: ['OpenAPI', 'DTOs']},
]} />

Use these pages to understand the build and contract boundary. In particular,
keep generated API DTOs separate from internal workflow and persistence models.

## Delivery And Observability

<TopicCards items={[
  {title: 'AWS delivery, Argo CD, and Dynatrace', href: '/architecture/AMWAY-DELIVERY-OBSERVABILITY', description: 'Follow GitHub CI, CodePipeline and CodeBuild promotion, Argo CD workload reconciliation, and Dynatrace operational evidence.', icon: 'gauge', tags: ['Delivery', 'Observability']},
]} />

Use this guide when tracing the tested artifact into an environment, checking
deployed workload health, investigating a checkout regression, or identifying
the correct delivery and observability owner.

## Topic Ownership Map

| Question | Primary guide |
|---|---|
| What do checkout JSON concepts mean? | [Domain Primer](./AMWAY-CHECKOUT-DOMAIN-PRIMER.md) |
| What is the exact reconstructed create flow? | [Create Checkout Flow](./AMWAY-CREATE-CHECKOUT-FLOW.md) |
| How are handlers grouped and executed? | [Chain Of Responsibility](./AMWAY-CHECKOUT-CHAIN-OF-RESPONSIBILITY.md) |
| How is a market-specific pipeline chosen? | [Strategy Pattern](./AMWAY-CHECKOUT-STRATEGY-PATTERN.md) |
| Why are provider and tenant factory both present? | [Factory And Provider](./AMWAY-CHECKOUT-FACTORY-PROVIDER.md) |
| How do all project technologies fit together? | [Technology Stack](./AMWAY-PROJECT-TECH-STACK.md) |
| How are DTO artifacts generated and shared? | [OpenAPI Contract Artifacts](./AMWAY-OPENAPI-CONTRACT-ARTIFACTS.md) |
| How is code promoted and observed? | [Delivery And Observability](./AMWAY-DELIVERY-OBSERVABILITY.md) |

## Suggested First-Week Outcomes

By the end of the first week, a checkout engineer should be able to:

1. identify the authoritative OpenAPI contract and generated artifact version;
2. distinguish API DTOs, `CheckoutBizDto`, common workflow context, database
   records, and public response models;
3. draw the complete create-checkout handler sequence;
4. explain provider, factory, strategy, chain, and executor responsibilities;
5. prove whether handlers inside a configured parallel group actually subscribe
   concurrently;
6. identify handler read/write dependencies and shared-context race risks;
7. locate idempotency, transaction, retry, timeout, compensation, and error
   translation policies;
8. follow a deployed artifact through CI, CodePipeline/CodeBuild, Argo CD, and
   Dynatrace without exposing customer-sensitive data.

## Recommended Next

- [Spring DataBinder Validator And BindingResult](../spring/validation/SPRING-DATABINDER-VALIDATOR-BINDINGRESULT.md)
- [Generic Chain Of Responsibility](../development/design-patterns/chain-of-responsibility.md)
- [Generic Strategy Pattern](../development/design-patterns/strategy.md)
- [Generic Factory Pattern](../development/design-patterns/factory.md)
- [Reactive Programming](../spring/SPRING-REACTIVE.md)
- [Idempotent Commands](../development/spring-rest/REST-IDEMPOTENT-COMMANDS.md)
