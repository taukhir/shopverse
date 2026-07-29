---
title: Spring Annotation Internals Composition Proxies And Interview Traps
description: Architect-level explanation of annotation metadata, retention, targets, scanning, merged annotations, aliases, composed annotations, post-processors, proxies, ordering, inheritance, AOT, debugging, and interview traps.
difficulty: Advanced
page_type: Revision Guide
status: Generic
prerequisites: [Java reflection and annotations, Spring container, Spring AOP]
learning_objectives: [Explain how Spring discovers annotations, Build composed annotations safely, Predict proxy behavior, Diagnose missing effects, Answer annotation interview questions]
technologies: [Spring Framework 7, Spring Boot 4, Reflection, AOP, AOT]
last_reviewed: "2026-07-29"
---

# Spring Annotation Internals Composition Proxies And Interview Traps

## Java Metadata Foundation

An annotation definition uses:

- `@Target` to restrict declaration locations;
- `@Retention` to choose source, class-file or runtime availability;
- `@Documented` for generated API documentation;
- `@Inherited` for limited superclass inheritance of class annotations;
- `@Repeatable` for repeated usage through a container annotation.

Spring often applies merged/meta-annotation search rules beyond a direct Java
`getAnnotation` call. Interface, method, bridge, superclass and composed annotation behavior
depends on the specific Spring subsystem—do not assume all processors search identically.

## Annotation Processing Phases

| Phase | Example processors/results |
|---|---|
| configuration discovery | component scan, configuration parser, imports and registrars create definitions |
| definition modification | bean-factory post-processors alter definitions before ordinary creation |
| instance processing | bean post-processors inject fields/callbacks and may wrap proxies |
| endpoint registration | MVC/Kafka/scheduling processors register handler/listener/task metadata |
| invocation | transaction, async, cache and security interceptors read resolved attributes |
| test bootstrap | TestContext/Boot test annotations construct and cache a particular context |

## Composed Annotations

Spring stereotypes and mappings can be composed:

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
public @interface JsonPost {
    @AliasFor(annotation = PostMapping.class, attribute = "path")
    String[] path() default {};
}
```

Use composition to express a stable organization convention, not to hide ten unrelated
framework behaviors. Test alias/default behavior and avoid changing a published composed
annotation casually—it is an API.

## Proxy Boundary

Proxy-backed annotations commonly include transaction, async, cache, method security and
some retry/resilience integrations.

```text
external caller -> proxy -> interceptors/advisors -> target method
target this.otherMethod() -------------------------> target method (proxy bypass)
```

Important constraints:

- the object must be Spring-managed;
- the call must cross the proxy;
- final/private/non-overridable methods constrain subclass proxies;
- JDK proxies expose interfaces; class proxies expose an assignable subclass;
- interceptor ordering changes combined transaction/security/cache/retry behavior;
- thread-switching advice changes context and transaction ownership.

## Annotation Precedence

Method-level metadata often overrides class-level defaults, but exact merging is subsystem-
specific. For example, transaction attributes, request mappings and security annotations
have their own lookup rules. Require one clear source of truth and tests for overrides.

## Common Interview Traps

**Does annotation order in source control execution order?** Usually no. Advisors, filters,
handlers and processors use their own ordering contracts such as `Ordered`, `@Order`,
registration order or explicit dependencies.

**Does `@Service` contain special business logic?** It is principally a semantic stereotype
meta-annotated with `@Component`; specialized post-processors may use stereotypes, but the
annotation itself does not create a service layer.

**Does `@Transactional` start a transaction when the class is instantiated?** No. It is
transaction metadata applied when an eligible invocation crosses configured transaction
interception.

**Why is an annotation ignored on an object created with `new`?** The object bypasses the
container processors/proxy that interpret the metadata.

**Why can two annotations conflict?** They may register competing handlers/definitions,
apply multiple advisors with unsafe order, or express mutually inconsistent lifecycle
semantics.

## Debugging Checklist

1. Is the annotation retained at runtime and targeted correctly?
2. Is the annotated type an actual Spring-managed bean in this application context?
3. Which processor/advisor is supposed to consume it, and is that infrastructure enabled?
4. Did scanning/import/condition evaluation register the expected definition/endpoint?
5. Is the runtime object a proxy, and did the call cross it?
6. Are method visibility, finality, bridge/interface metadata or inheritance relevant?
7. Did another annotation/bean/order override the expected behavior?
8. Does AOT/native processing have the required reflection/proxy/resource metadata?
9. What focused test proves the effect rather than only checking annotation presence?

## Architect Scenario

`@Async`, `@Transactional` and `@CacheEvict` are placed on one method. Before approving,
define advisor order, executor, transaction location, cache invalidation timing, exception
visibility, context propagation, idempotency and retry behavior. Splitting responsibilities
into explicit collaborating beans is often safer than relying on a decorative annotation
stack whose runtime ordering is poorly understood.

## Official References

- [Spring core annotation model](https://docs.spring.io/spring-framework/reference/core/beans/classpath-scanning.html)
- [Spring AOP proxying](https://docs.spring.io/spring-framework/reference/core/aop/proxying.html)
- [Spring AOT processing](https://docs.spring.io/spring-framework/reference/core/aot.html)

