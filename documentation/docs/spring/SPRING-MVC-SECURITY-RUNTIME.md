---
title: Spring MVC And Security Request Runtime
description: Compatibility route to the canonical servlet lifecycle, Spring Security runtime, HTTP message conversion, and web capacity guides.
difficulty: Advanced
page_type: Reference
status: Compatibility route
learning_objectives:
  - Select the focused runtime guide for a Spring web question
  - Preserve existing links to the former combined MVC and security page
technologies: [Spring MVC, Spring Security, Spring Boot]
last_reviewed: "2026-07-13"
---

# Spring MVC And Security Request Runtime

<DocLabels items={[
  {label: 'Compatibility route', tone: 'intermediate'},
  {label: 'Advanced runtime', tone: 'advanced'},
]} />

This former combined guide has been separated so each runtime boundary has one
canonical owner.

<DocCallout type="tip" title="Follow the boundary you are debugging">
Use the lifecycle guide for servlet and MVC dispatch, the security guide for
chain selection and authentication, the conversion guide for JSON contracts,
and the capacity guide for queues, threads, timeouts, and saturation.
</DocCallout>

<TopicCards items={[
  {title: 'Servlet and MVC lifecycle', href: '/spring/web/SERVLET-MVC-REQUEST-LIFECYCLE', description: 'Trace connector admission, filters, DispatcherServlet, controller invocation, exceptions, and response completion.', icon: 'route', tags: ['Servlet', 'MVC']},
  {title: 'Security request runtime', href: '/spring/web/SECURITY-REQUEST-RUNTIME', description: 'Trace SecurityFilterChain selection, authentication, authorization, and failure translation.', icon: 'security', tags: ['JWT', 'Filters']},
  {title: 'HTTP message conversion', href: '/spring/web/HTTP-MESSAGE-CONVERSION-JACKSON', description: 'Understand content negotiation, Jackson generations, DTO contracts, and serialization failures.', icon: 'code', tags: ['Jackson', 'JSON']},
  {title: 'Execution models and capacity', href: '/spring/web/WEB-EXECUTION-MODELS-CAPACITY', description: 'Compare MVC, async MVC, virtual threads, and WebFlux with production evidence.', icon: 'gauge', tags: ['Queues', 'SLOs']},
]} />

## Interview Questions

The former static answers now appear as `ExpandableAnswer` checks in the
relevant lifecycle, security, and message-conversion guides.

## Official References

Official references are maintained on each focused page next to the claims they
support.
