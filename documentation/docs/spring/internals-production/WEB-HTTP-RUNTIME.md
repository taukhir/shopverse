---
title: Spring Web Execution And HTTP Runtime
description: Compatibility route to the canonical Spring web execution-model and capacity guide.
difficulty: Advanced
page_type: Reference
status: Compatibility route
learning_objectives:
  - Locate the canonical web execution and HTTP capacity guidance
  - Preserve existing links to the former combined runtime page
technologies: [Spring MVC, Spring WebFlux, Tomcat, Netty]
last_reviewed: "2026-07-13"
---

# Spring Web Execution And HTTP Runtime

<DocLabels items={[
  {label: 'Compatibility route', tone: 'intermediate'},
  {label: 'Production runtime', tone: 'production'},
]} />

The execution-model, queueing, timeout, streaming, and capacity material now has
one canonical page.

<TopicCards items={[
  {title: 'Web execution models and capacity', href: '/spring/web/WEB-EXECUTION-MODELS-CAPACITY', description: 'Locate queues and thread transitions, compare MVC and WebFlux, and design deadlines and overload behavior.', icon: 'gauge', tags: ['Capacity', 'SLOs']},
  {title: 'Servlet and MVC lifecycle', href: '/spring/web/SERVLET-MVC-REQUEST-LIFECYCLE', description: 'Trace the request mechanics underneath traditional and async MVC.', icon: 'route', tags: ['Servlet', 'Dispatch']},
]} />

<DocCallout type="production" title="Start with wait-location evidence">
Compare edge latency, connector saturation, application spans, executor queues,
database-pool wait, and downstream-pool acquisition before changing thread counts.
</DocCallout>

## Route By Production Symptom

Use the capacity page when latency rises with worker, executor, connection-pool,
or downstream saturation; it owns admission, queueing, deadlines, retries,
cancellation, async MVC, virtual-thread rollout, WebFlux, streaming, and graceful
shutdown. Use the servlet lifecycle when the uncertainty is which dispatch or
extension point ran. Use security runtime for authentication/context transitions,
and message conversion for representation failures after controller return. For
database-pool or transaction evidence, continue from the capacity map into the
Hibernate/JDBC internals page rather than increasing HTTP concurrency in isolation.

## Recommended Next Page

Continue with [Web Execution Models And Capacity](../web/WEB-EXECUTION-MODELS-CAPACITY.md).

## Official References

- [Spring MVC asynchronous requests](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-async.html)
- [Spring WebFlux](https://docs.spring.io/spring-framework/reference/web/webflux.html)
- [Spring Boot metrics](https://docs.spring.io/spring-boot/reference/actuator/metrics.html)
