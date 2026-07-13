---
title: Spring Bean Scopes And Lifecycle
description: Singleton, prototype and web scopes, lifecycle callbacks, resource ownership, graceful shutdown, and lifecycle diagnostics.
difficulty: Intermediate
page_type: Tutorial
status: Generic
prerequisites: [Spring dependency injection, ApplicationContext basics]
learning_objectives: [Choose bean scope from state ownership, Trace initialization through published identity, Prove resource cleanup during graceful shutdown]
technologies: [Spring Framework 7, Spring Boot 4]
last_reviewed: "2026-07-13"
---

# Spring Bean Scopes And Lifecycle

<DocLabels items={[
  {label: 'Intermediate', tone: 'intermediate'},
  {label: 'Scopes and ownership', tone: 'foundation'},
  {label: 'Graceful lifecycle', tone: 'production'},
  {label: 'Shopverse evidence', tone: 'shopverse'},
]} />

Scope defines which container lookup shares an instance. Lifecycle defines who
initializes it, when it becomes usable, and who releases its resources.

```mermaid
flowchart TD
    Definition["Bean definition"] --> Construct["Constructor / factory method"]
    Construct --> Populate["Resolve and inject dependencies"]
    Populate --> Before["Before-initialization processors"]
    Before --> Init["@PostConstruct / init callback"]
    Init --> After["After-initialization processors"]
    After --> Published["Published bean or proxy"]
    Published --> Use["Application use"]
    Use --> Stop["Context shutdown"]
    Stop --> Destroy["@PreDestroy / destroy callback"]
```

This is the application-facing sequence. Processor registration and refresh-phase
internals remain in the
[Container And BeanFactory Internals](../../spring/internals-production/CONTAINER-BEANFACTORY-AUTOCONFIG.md)
guide.

## Choose Scope From Ownership

| Scope | Shared by | Main caution |
|---|---|---|
| singleton | one bean instance per application context | mutable state is shared across threads |
| prototype | each container request for the bean | container does not own full destruction |
| request | one HTTP request | requires active web request or scoped proxy/provider |
| session | one HTTP session | memory, serialization, expiry, and clustered session behavior |
| application | servlet application context | web-container ownership differs from plain singleton intent |

Most services, repositories, clients, configuration properties, and controllers are
singleton beans. Singleton means one container instance, not thread-safe. Keep
request/customer state in method arguments or durable stores.

<DocCallout type="shopverse" title="Current Shopverse ownership">

Shopverse services are stateless singleton components whose mutable business state
lives in databases, caches, or request-local objects. Repository/client/publisher
resources are container-managed. No production custom prototype/request-scoped bean
or explicit `@PreDestroy` callback was found in the current services.

</DocCallout>

## Prototype Inside Singleton

A prototype injected directly into a singleton is resolved once while the singleton
is created. Use a provider when every operation genuinely needs a fresh object:

```java
ReportService(ObjectProvider<ReportWorkspace> workspaces) {
    this.workspaces = workspaces;
}

Report create() {
    return workspaces.getObject().render();
}
```

The consumer that obtains a prototype owns cleanup of resources it opens. Do not
use prototype scope as a substitute for a normal local variable or factory.

## Web Scopes And Proxies

A singleton cannot hold one concrete request-scoped instance. Inject a scoped proxy
or provider that resolves the current request instance at invocation time. Access
from schedulers, async threads, or startup code fails when no request scope is active.

<DocCallout type="mistake" title="ThreadLocal is not a bean scope">

Thread pools reuse threads, async work crosses threads, and reactive pipelines do
not preserve arbitrary thread-local state. Use supported request/security/context
propagation and clear owned context after every operation.

</DocCallout>

## Initialization Callbacks

Use constructors for cheap invariant establishment and injected values. Use
`@PostConstruct` for local validation/initialization that depends on injection.
Avoid migrations, unbounded scans, and remote calls in either; they delay startup
and couple availability to transient dependencies.

```java
@PostConstruct
void validateRoutes() {
    if (routes.isEmpty()) {
        throw new IllegalStateException("At least one route is required");
    }
}
```

For work that must occur after the application has started or become ready, use the
appropriate Boot lifecycle/event/runner abstraction and define failure plus
readiness behavior explicitly.

## Destruction And Graceful Shutdown

```java
@PreDestroy
void stop() {
    intake.close();
    executor.shutdown();
}
```

Destruction callbacks run on orderly context close, not on process kill or host
failure. Cleanup must be bounded and idempotent. Stop admission before closing
resources, drain or relinquish work, flush telemetry, then exit within the platform
grace period.

<DocCallout type="code" title="Illustrative lifecycle callback">

Shopverse currently relies on Spring-managed datasource, Kafka, HTTP, and scheduler
lifecycle rather than custom `@PreDestroy` methods. Add a custom callback only for a
resource the bean itself creates and owns.

</DocCallout>

## Published Identity And Proxies

After initialization, a post-processor can publish a proxy instead of the raw target.
The injected identity must be the container-published bean for transactions, cache,
security, async, or resilience advice to apply. Do not retain `this` in static state
or leak the instance from its constructor.

## Failure And Diagnostic Evidence

| Symptom | Evidence to inspect |
|---|---|
| startup hangs | startup steps, thread dump, constructor/init logs, dependency timeout |
| callback did not run | bean is container-managed, callback signature, context actually closed |
| request scope unavailable | thread/request boundary and scoped proxy/provider |
| prototype reused | injection location and provider lookup count |
| advice missing | injected runtime class/proxy and external versus self invocation |
| shutdown exceeds grace | in-flight work, executor/container stop time, blocked resource |

Tests should close the context and assert cleanup, not call `@PreDestroy` directly.
Use concurrent tests for singleton state, a request-aware test for web scopes, and a
provider-count assertion for prototypes.

## Interview Questions

<ExpandableAnswer title="Does singleton scope make a bean thread-safe?">

No. It means one instance per application context. Concurrent callers share any
mutable fields, so state must be immutable, synchronized, confined, or externalized.

</ExpandableAnswer>

<ExpandableAnswer title="Why is a prototype injected into a singleton often created only once?">

The dependency is resolved when the singleton is constructed. Use a provider or
scoped proxy for a fresh lookup at each operation.

</ExpandableAnswer>

<ExpandableAnswer title="Who destroys a prototype-scoped bean?">

Spring creates and initializes it but does not manage its complete destruction.
The consumer that obtains it owns resource cleanup.

</ExpandableAnswer>

<ExpandableAnswer title="Why should remote work not run in @PostConstruct?">

It blocks context startup, has unclear retry/readiness behavior, and couples local
bean creation to a transient remote dependency.

</ExpandableAnswer>

<ExpandableAnswer title="Why can @PreDestroy be skipped in production?">

It requires orderly context shutdown. A forced kill, crash, or host loss can bypass
it, so correctness cannot depend on the callback always executing.

</ExpandableAnswer>

## Official References

- [Spring bean scopes](https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html)
- [Spring lifecycle callbacks](https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html)
- [Using lazy-initialized beans](https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-lazy-init.html)
- [Spring Boot graceful shutdown](https://docs.spring.io/spring-boot/4.0/reference/web/graceful-shutdown.html)

## Recommended Next

Continue with [Configuration Properties](./CONFIGURATION-PROPERTIES.md), then use
[Spring AOP](../../spring/SPRING-AOP.md) for proxy advice behavior.
