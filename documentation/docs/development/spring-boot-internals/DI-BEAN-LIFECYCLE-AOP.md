---
title: Spring Dependency Injection And Bean Lifecycle
description: Learning route for dependency resolution, bean scopes, lifecycle callbacks, diagnostics, and proxy publication boundaries.
difficulty: Intermediate
page_type: Learning Path
status: Generic
prerequisites: [Spring container fundamentals]
learning_objectives: [Choose the focused dependency-resolution or bean-lifecycle guide, Keep AOP and container internals in their canonical guides]
technologies: [Spring Framework 7, Spring Boot 4]
last_reviewed: "2026-07-13"
---

# Spring Dependency Injection And Bean Lifecycle

<DocLabels items={[
  {label: 'Intermediate', tone: 'intermediate'},
  {label: 'Learning route', tone: 'foundation'},
  {label: 'Container foundations', tone: 'production'},
]} />

This URL remains the entry point for object wiring and lifetime. The former long
chapter is now split so dependency selection and bean ownership can be learned and
diagnosed independently.

<TopicCards items={[
  {title: 'Dependency injection and bean resolution', href: '/development/spring-boot-internals/DEPENDENCY-INJECTION-BEAN-RESOLUTION', description: 'Trace candidate selection, constructors, qualifiers, collections, providers, and circular failures.', icon: 'network', tags: ['Resolution', 'Diagnostics']},
  {title: 'Bean scopes and lifecycle', href: '/development/spring-boot-internals/BEAN-SCOPES-LIFECYCLE', description: 'Choose scope and ownership, trace initialization, and verify graceful resource cleanup.', icon: 'route', tags: ['Scopes', 'Lifecycle']},
]} />

<DocCallout type="tip" title="Container internals and AOP stay canonical elsewhere">

Use [Container And BeanFactory Internals](../../spring/internals-production/CONTAINER-BEANFACTORY-AUTOCONFIG.md)
for post-processor and refresh internals. Use [Spring AOP](../../spring/SPRING-AOP.md)
for pointcuts, advisor order, and self-invocation. These foundation pages stop at
the published container identity.

</DocCallout>

## Dependency Injection

Continue with
[Dependency Injection And Bean Resolution](./DEPENDENCY-INJECTION-BEAN-RESOLUTION.md)
for constructor injection, ambiguity, semantic qualifiers, optional dependencies,
and wiring evidence.

## Bean Lifecycle

Continue with [Bean Scopes And Lifecycle](./BEAN-SCOPES-LIFECYCLE.md) for singleton,
prototype, request/session scope, initialization, destruction, and shutdown.

## AOP Integration Boundary

The object published by the container may be a proxy. Callers must use that
published identity for transactions, caching, security, async, and resilience
advice to apply. Detailed proxy behavior belongs in the linked AOP guide.

## Recommended Next

Start with [Dependency Injection And Bean Resolution](./DEPENDENCY-INJECTION-BEAN-RESOLUTION.md),
then continue to [Bean Scopes And Lifecycle](./BEAN-SCOPES-LIFECYCLE.md).
