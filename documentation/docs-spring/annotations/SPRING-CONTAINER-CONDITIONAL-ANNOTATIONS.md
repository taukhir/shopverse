---
title: Spring Container Dependency Injection And Conditional Annotations
description: In-depth guide to Spring stereotypes, configuration, bean registration, injection, scopes, lifecycle, events, ordering, Boot application annotations, configuration properties, and conditions.
difficulty: Intermediate
page_type: Deep Dive
status: maintained
prerequisites: [Spring container fundamentals]
learning_objectives: [Explain bean registration annotations, Trace dependency selection, Use lifecycle annotations safely, Diagnose conditions, Build explicit Boot configuration]
technologies: [Spring Boot 4, Spring Framework 7]
last_reviewed: "2026-07-29"
scope: generic
owner: docs-spring
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Spring Container Dependency Injection And Conditional Annotations

## Stereotypes And Registration

| Annotation | Meaning and important boundary |
|---|---|
| `@Component` | generic component-scan candidate |
| `@Service` | service-layer semantic stereotype; still a component |
| `@Repository` | persistence stereotype and exception-translation participation where configured |
| `@Controller` | MVC controller stereotype, normally returning views unless response handling says otherwise |
| `@RestController` | composed `@Controller` plus type-level `@ResponseBody` |
| `@Configuration` | configuration class whose `@Bean` methods contribute definitions |
| `@Bean` | method return value becomes a bean definition; method name is the default bean name |
| `@Import` | imports configuration, selectors or registrars explicitly |
| `@ComponentScan` | discovers candidates under configured packages; broad scans increase ambiguity/startup work |

Prefer explicit package boundaries. The main application class should normally sit above
the intended application packages, not in a generic root that scans third-party classes.

## Boot Composition

`@SpringBootApplication` composes:

```text
@SpringBootConfiguration
+ @EnableAutoConfiguration
+ @ComponentScan
```

Use it once on the primary application configuration. `@EnableAutoConfiguration` imports
conditional defaults; it does not scan arbitrary application components by itself.

## Injection And Candidate Selection

| Annotation | Role |
|---|---|
| `@Autowired` | resolves constructor/method/field dependency primarily by type |
| `@Qualifier` | narrows the type-matched candidate set using qualifier metadata |
| `@Primary` | preferred candidate for a single-valued injection when several remain |
| `@Fallback` | marks a candidate considered when regular candidates are absent |
| `@Value` | resolves a property/expression into an injection point; not an aggregate configuration model |
| `@Lazy` | delays creation or injects a lazy-resolution proxy depending on placement |
| `@DependsOn` | declares initialization/destruction dependency, not business call order |
| `@Order` | orders supported collections/chains; it does not universally control bean startup |

For one constructor, `@Autowired` is unnecessary. Constructor injection makes required
dependencies explicit and supports immutable fields.

```java
@Service
public final class CheckoutService {
    private final PaymentGateway gateway;

    public CheckoutService(@Qualifier("resilientPayment") PaymentGateway gateway) {
        this.gateway = gateway;
    }
}
```

## Scope And Lifecycle

| Annotation | Effect |
|---|---|
| `@Scope` | singleton, prototype or registered web/custom scope |
| `@PostConstruct` | lifecycle callback after dependency population, before normal use |
| `@PreDestroy` | destruction callback for managed lifecycle where the scope supports it |
| `@EventListener` | application-event listener method; default execution is publisher-thread synchronous |
| `@TransactionalEventListener` | listener associated with a transaction phase; no transaction means behavior depends on fallback setting |

Prototype destruction is not automatically managed like singleton destruction. Avoid slow
network calls in `@PostConstruct`; they delay startup and complicate readiness.

## Configuration Properties

`@ConfigurationProperties` binds a typed aggregate. `@EnableConfigurationProperties`
registers listed property types; configuration-properties scanning is another option.
Combine with `@Validated` and Jakarta constraints for startup failure on unsafe values.

```java
@ConfigurationProperties("inventory.client")
@Validated
public record InventoryClientProperties(
        @NotNull URI baseUrl,
        @NotNull Duration timeout,
        @Min(1) int maxConcurrency) {}
```

## Conditional Auto-Configuration

Important Boot conditions include:

- `@ConditionalOnClass` / `@ConditionalOnMissingClass`;
- `@ConditionalOnBean` / `@ConditionalOnMissingBean` / `@ConditionalOnSingleCandidate`;
- `@ConditionalOnProperty`;
- `@ConditionalOnResource`;
- `@ConditionalOnWebApplication` / `@ConditionalOnNotWebApplication`;
- `@ConditionalOnExpression`—powerful but harder to validate/refactor than typed properties.

Conditions are primarily for auto-configuration. Application business choices are usually
clearer with explicit configuration and strategy beans.

## Common Failures

| Symptom | Evidence |
|---|---|
| no qualifying bean | scan/import boundary, definition and condition report |
| multiple candidates | type, qualifiers, primary/fallback and generic metadata |
| property stays `null`/default | property origin, prefix/name, registration, converter and validation |
| lifecycle method never runs | object created outside Spring or unsupported scope/destruction |
| `@Order` did not start bean first | ordering contract versus actual dependency/lifecycle phase |

## Interview Questions

**`@Bean` versus `@Component`?** `@Bean` registers a factory-method result, ideal for
third-party or explicit construction. `@Component` registers a scanned application type.

**`@Primary` versus `@Qualifier`?** Primary gives a default preference; qualifier expresses
which semantic subset/candidate an injection point requires.

**Why is `@Value` not ideal for 30 related properties?** It scatters conversion, validation
and ownership; typed configuration properties provide one coherent contract.

## Official References

- [Using `@Autowired`](https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/autowired.html)
- [Qualifiers and candidate selection](https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/autowired-qualifiers.html)
- [Using `@Bean`](https://docs.spring.io/spring-framework/reference/core/beans/java/bean-annotation.html)

