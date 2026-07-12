---
title: Container, Bean Factory, And Auto-Configuration Internals
difficulty: Advanced
page_type: Concept
status: Generic
keywords: [ApplicationContext refresh, BeanDefinition, BeanFactoryPostProcessor, BeanPostProcessor, circular dependency, conditional auto-configuration]
learning_objectives: [Trace context refresh phases, Distinguish definition and instance post-processing, Diagnose dependency and auto-configuration selection]
technologies: [Spring Framework, Spring Boot]
last_reviewed: "2026-07-12"
---

# Container, Bean Factory, And Auto-Configuration Internals

![Spring context refresh phases from metadata loading through post-processors, singleton creation, proxies, and readiness](/img/diagrams/spring-context-refresh.svg)

*Factory post-processors operate on definitions before normal beans exist. Bean
post-processors operate on instances and may return a proxy.*

`ApplicationContext` refresh prepares the bean factory, loads/merges definitions,
invokes factory post-processors, registers bean post-processors, initializes event/
message infrastructure, creates remaining non-lazy singletons, and publishes
completion events. Exact extension ordering uses `PriorityOrdered`, `Ordered`, then
unordered registration and should not depend on incidental scanning order.

`BeanFactoryPostProcessor` changes bean definitions before ordinary instances.
`BeanDefinitionRegistryPostProcessor` can add definitions. `BeanPostProcessor`
wraps or changes instances around initialization and is the basis of many proxies.
Instantiating infrastructure too early can make beans ineligible for full processing.

## Dependency Resolution

Resolution considers type, generic qualifiers, `@Qualifier`, `@Primary`, priority,
name fallback, optional/provider semantics, and collection ordering. Constructor
injection exposes cycles and supports immutable required dependencies. Providers
or events can break legitimate lifecycle coupling; setter cycles usually signal
poor boundaries.

Spring's singleton creation uses caches for complete instances and early references.
Early proxy exposure can resolve some setter/field cycles, but constructor cycles
cannot be constructed and early exposure can produce subtle identity/lifecycle
behavior. Do not design around circular dependency support.

## Lifecycle

Order includes construction, dependency population, aware callbacks, before-
initialization processors, `@PostConstruct`, initializing callbacks/custom init,
after-initialization processors/proxying, use, then destruction callbacks. Prototype
destruction is not managed automatically after creation.

Events and runners occur at different readiness phases. Long remote work in bean
initialization delays startup and can create fragile dependency coupling.

## Boot Auto-Configuration

Boot discovers auto-configuration imports and evaluates conditions on classes,
beans, properties, resources, web application type, and other facts. Most auto-
configuration backs off when the application supplies its own bean. Conditions
are evaluated in phases and ordering is not normal bean startup ordering.

Use the condition evaluation report and configuration-properties binding errors
to diagnose why configuration matched. Environment/property sources have explicit
precedence; relaxed binding does not excuse ambiguous keys. Generate metadata and
validate typed configuration at startup.

## Lab

Create custom registry/factory/bean post-processors that log phases, one proxied
bean, conditional auto-configuration, and conflicting candidates. Predict then
verify ordering with the condition report and context startup logs.

## Recommended Next Page

[AOP Proxies And Transaction Internals](./AOP-TRANSACTION-INTERNALS.md)

## Official References

- [Spring Framework — Container Extension Points](https://docs.spring.io/spring-framework/reference/core/beans/factory-extension.html)
- [Spring Framework — Bean Lifecycle Callbacks](https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html)
- [Spring Boot — Creating Auto-Configuration](https://docs.spring.io/spring-boot/reference/features/developing-auto-configuration.html)
- [Spring Boot — Externalized Configuration](https://docs.spring.io/spring-boot/reference/features/external-config.html)
