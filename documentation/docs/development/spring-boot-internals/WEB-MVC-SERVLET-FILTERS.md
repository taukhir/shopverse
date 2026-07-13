---
title: Spring Web MVC Servlet And Filter Internals
description: Compatibility route to focused servlet lifecycle, security runtime, and HTTP message-conversion guides.
difficulty: Advanced
page_type: Reference
status: Compatibility route
learning_objectives:
  - Select the canonical guide for servlet filters, security filters, or message conversion
  - Preserve existing Spring Boot internals links without duplicating runtime prose
technologies: [Spring MVC, Spring Security, Jackson, Spring Boot]
last_reviewed: "2026-07-13"
---

# Spring Web MVC Servlet And Filter Internals

<DocLabels items={[
  {label: 'Compatibility route', tone: 'intermediate'},
  {label: 'Advanced internals', tone: 'advanced'},
]} />

This former umbrella page has been separated by runtime ownership.

<TopicCards items={[
  {title: 'Servlet and MVC lifecycle', href: '/spring/web/SERVLET-MVC-REQUEST-LIFECYCLE', description: 'Embedded container, filters, DispatcherServlet, argument resolution, exceptions, and concurrency.', icon: 'route', tags: ['Servlet', 'MVC']},
  {title: 'Security request runtime', href: '/spring/web/SECURITY-REQUEST-RUNTIME', description: 'DelegatingFilterProxy, FilterChainProxy, ordered chains, JWT, and method security.', icon: 'security', tags: ['Security', 'Filters']},
  {title: 'HTTP message conversion', href: '/spring/web/HTTP-MESSAGE-CONVERSION-JACKSON', description: 'HttpMessageConverter selection, content negotiation, Jackson 3, and Jackson 2 migration.', icon: 'code', tags: ['JSON', 'Jackson']},
]} />

<DocCallout type="shopverse" title="Shopverse examples moved with their owning boundary">
The current request-logging filter is documented with the servlet lifecycle,
User Service's ordered security chains with security runtime, and the Jackson 2
compatibility inventory with message conversion.
</DocCallout>

## Route By Extension Point

Choose the servlet lifecycle guide for container filters, dispatch types,
`OncePerRequestFilter`, MDC cleanup, MVC mappings, adapters, argument resolvers,
and exception-resolver ownership. Choose security runtime for
`DelegatingFilterProxy`, ordered `SecurityFilterChain` matching, JWT/Basic
authentication, `SecurityContext`, `401`/`403`, and method-security transitions.
Choose message conversion when the relevant extension point is a converter,
mapper, media type, DTO, or serializer. These pages deliberately share the full
request boundary through links and diagrams while keeping implementation rules in
only one canonical location.

## Back To Spring Boot Internals

Return to [Spring Boot Internals](../SPRING-BOOT-INTERNALS.md).

## Official References

- [Spring MVC](https://docs.spring.io/spring-framework/reference/web/webmvc.html)
- [Spring Security servlet architecture](https://docs.spring.io/spring-security/reference/servlet/architecture.html)
- [Spring Boot JSON](https://docs.spring.io/spring-boot/4.0/reference/features/json.html)
