---
title: Spring Web Execution And HTTP Runtime
difficulty: Advanced
page_type: Concept
status: Generic
keywords: [Tomcat connector, DispatcherServlet, HandlerMethodArgumentResolver, HttpMessageConverter, async MVC, WebFlux, multipart streaming]
learning_objectives: [Trace a request from socket to response, Locate queues and thread transitions, Choose MVC async WebFlux SSE or WebSocket correctly]
technologies: [Spring MVC, WebFlux, Tomcat, Netty]
last_reviewed: "2026-07-12"
---

# Spring Web Execution And HTTP Runtime

A request may queue at load balancer, accept backlog, connector, application
executor, connection pool, database, and downstream client. “Controller latency”
can exclude earlier waits unless instrumentation spans the full path.

Servlet containers accept connections, parse HTTP, assign request work, manage
timeouts/keepalive, and write responses. Tomcat is the common Boot servlet default;
Jetty and Undertow offer different internals/configuration. Netty is event-loop
based and commonly underpins WebFlux. Compare supported versions and workload
measurements rather than generic speed claims.

## DispatcherServlet

Filters wrap servlet dispatch and are suitable for edge concerns. DispatcherServlet
uses handler mappings to select a handler, handler adapters to invoke it, argument
resolvers to construct parameters, validation/binding, return-value handlers and
message converters to produce output. Interceptors wrap mapped handler execution;
controller advice centralizes MVC exceptions/binding.

Jackson visibility, constructors/creators, naming, modules, polymorphism, unknown
fields, dates, precision, recursion, and lazy ORM proxies affect JSON contracts.
Use explicit DTOs, size/depth limits, and compatibility tests.

## Execution Models

MVC normally blocks a request thread. Async MVC releases it while work continues
and redispatches for completion; executor bounds/context propagation still matter.
WebFlux uses nonblocking streams and event loops, but blocking JDBC or remote calls
must be isolated and bounded. Virtual threads can simplify blocking MVC without
making dependencies unlimited.

SSE is server-to-client HTTP streaming; WebSocket is bidirectional. Both require
authentication renewal, heartbeat, buffer/backpressure, slow-client policy,
reconnection/resume, and durable message ownership.

HTTP clients need separate connect, acquisition, request/response, idle and total
deadlines; bounded pools; DNS/TLS observability; cancellation; and idempotent retry.

Multipart uploads should stream to bounded temporary/object storage, enforce size/
part limits, verify checksum/type, scan asynchronously, and clean abandoned data.

## Recommended Next Page

[Hibernate, JDBC, And Connection Internals](./HIBERNATE-JDBC-INTERNALS.md)
