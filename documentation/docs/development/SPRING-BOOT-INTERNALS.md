---
title: Spring Boot Internals
---

# Spring Boot Internals

Spring Boot internals are split by startup, dependency injection, configuration binding, web stack, infrastructure, and operations.

## Focused Pages

| Page | Covers |
|---|---|
| [Spring Boot Startup And Auto Configuration](spring-boot-internals/STARTUP-AUTOCONFIGURATION.md) | Application entry point, startup lifecycle, environment, property sources, auto-configuration, conditions, and dependency-driven setup. |
| [Spring Dependency Injection Bean Lifecycle And AOP](spring-boot-internals/DI-BEAN-LIFECYCLE-AOP.md) | Bean definitions, bean instances, dependency injection, lifecycle callbacks, and AOP proxy behavior. |
| [Spring Configuration Properties Internals](spring-boot-internals/CONFIGURATION-PROPERTIES.md) | Type-safe configuration binding, validation, metadata, nested properties, and when to prefer ConfigurationProperties over Value. |
| [Spring Web MVC Servlet And Filter Internals](spring-boot-internals/WEB-MVC-SERVLET-FILTERS.md) | Embedded servlet container, request lifecycle, filters, DispatcherServlet, argument resolution, Jackson, exception handling, and security integration. |
| [Spring Infrastructure Internals](spring-boot-internals/INFRASTRUCTURE-INTERNALS.md) | Transactions, repository proxies, Liquibase, JPA auditing, caching, scheduling, Feign, Kafka, Actuator, tracing, Config Client, Eureka, and Gateway differences. |
| [Spring Boot Operations Internals](spring-boot-internals/OPERATIONS-INTERNALS.md) | Startup diagnostics, graceful shutdown, production practices, and official references. |
| [Spring Boot Production Tuning](spring-boot-internals/PRODUCTION-TUNING.md) | Startup measurement, JVM/container memory, GC, concurrency, Hikari and HTTP pools, graceful shutdown, sizing formulas, and metrics. |

## Compatibility Anchors

The original long page was split into focused pages. These headings are kept so older links have a stable landing point.

## Shopverse Entry Point

Moved to [Spring Boot Startup And Auto Configuration](spring-boot-internals/STARTUP-AUTOCONFIGURATION.md).

## `@SpringBootApplication`

Moved to [Spring Boot Startup And Auto Configuration](spring-boot-internals/STARTUP-AUTOCONFIGURATION.md).

## Startup Lifecycle

Moved to [Spring Boot Startup And Auto Configuration](spring-boot-internals/STARTUP-AUTOCONFIGURATION.md).

## Environment And Property Sources

Moved to [Spring Boot Startup And Auto Configuration](spring-boot-internals/STARTUP-AUTOCONFIGURATION.md).

## Auto-Configuration

Moved to [Spring Boot Startup And Auto Configuration](spring-boot-internals/STARTUP-AUTOCONFIGURATION.md).

## Common Conditional Annotations

Moved to [Spring Boot Startup And Auto Configuration](spring-boot-internals/STARTUP-AUTOCONFIGURATION.md).

## Dependency-Driven Configuration

Moved to [Spring Boot Startup And Auto Configuration](spring-boot-internals/STARTUP-AUTOCONFIGURATION.md).

## Bean Definitions Versus Bean Instances

Moved to [Spring Dependency Injection Bean Lifecycle And AOP](spring-boot-internals/DI-BEAN-LIFECYCLE-AOP.md).

## Dependency Injection

Moved to [Spring Dependency Injection Bean Lifecycle And AOP](spring-boot-internals/DI-BEAN-LIFECYCLE-AOP.md).

## Bean Lifecycle

Moved to [Spring Dependency Injection Bean Lifecycle And AOP](spring-boot-internals/DI-BEAN-LIFECYCLE-AOP.md).

## AOP Proxies

Moved to [Spring Dependency Injection Bean Lifecycle And AOP](spring-boot-internals/DI-BEAN-LIFECYCLE-AOP.md).

## Configuration Properties Example

Moved to [Spring Configuration Properties Internals](spring-boot-internals/CONFIGURATION-PROPERTIES.md).

## How Spring Creates `InventoryProperties`

Moved to [Spring Configuration Properties Internals](spring-boot-internals/CONFIGURATION-PROPERTIES.md).

## Using The Bound Bean

Moved to [Spring Configuration Properties Internals](spring-boot-internals/CONFIGURATION-PROPERTIES.md).

## Nested Configuration

Moved to [Spring Configuration Properties Internals](spring-boot-internals/CONFIGURATION-PROPERTIES.md).

## `@ConfigurationProperties` Versus `@Value`

Moved to [Spring Configuration Properties Internals](spring-boot-internals/CONFIGURATION-PROPERTIES.md).

## Configuration Metadata

Moved to [Spring Configuration Properties Internals](spring-boot-internals/CONFIGURATION-PROPERTIES.md).

## Configuration Binding Practices

Moved to [Spring Configuration Properties Internals](spring-boot-internals/CONFIGURATION-PROPERTIES.md).

## Embedded Servlet Container

Moved to [Spring Web MVC Servlet And Filter Internals](spring-boot-internals/WEB-MVC-SERVLET-FILTERS.md).

## Servlet Request Lifecycle

Moved to [Spring Web MVC Servlet And Filter Internals](spring-boot-internals/WEB-MVC-SERVLET-FILTERS.md).

## `OncePerRequestFilter`

Moved to [Spring Web MVC Servlet And Filter Internals](spring-boot-internals/WEB-MVC-SERVLET-FILTERS.md).

## `DispatcherServlet`

Moved to [Spring Web MVC Servlet And Filter Internals](spring-boot-internals/WEB-MVC-SERVLET-FILTERS.md).

## Controller Argument Resolution

Moved to [Spring Web MVC Servlet And Filter Internals](spring-boot-internals/WEB-MVC-SERVLET-FILTERS.md).

## Jackson Auto-Configuration

Moved to [Spring Web MVC Servlet And Filter Internals](spring-boot-internals/WEB-MVC-SERVLET-FILTERS.md).

## Customizing Jackson

Moved to [Spring Web MVC Servlet And Filter Internals](spring-boot-internals/WEB-MVC-SERVLET-FILTERS.md).

## Exception Handling

Moved to [Spring Web MVC Servlet And Filter Internals](spring-boot-internals/WEB-MVC-SERVLET-FILTERS.md).

## Spring Security Integration

Moved to [Spring Web MVC Servlet And Filter Internals](spring-boot-internals/WEB-MVC-SERVLET-FILTERS.md).

## Transaction Auto-Configuration

Moved to [Spring Infrastructure Internals](spring-boot-internals/INFRASTRUCTURE-INTERNALS.md).

## Spring Data Repository Proxies

Moved to [Spring Infrastructure Internals](spring-boot-internals/INFRASTRUCTURE-INTERNALS.md).

## Liquibase And JPA Startup

Moved to [Spring Infrastructure Internals](spring-boot-internals/INFRASTRUCTURE-INTERNALS.md).

## JPA Auditing

Moved to [Spring Infrastructure Internals](spring-boot-internals/INFRASTRUCTURE-INTERNALS.md).

## Caching

Moved to [Spring Infrastructure Internals](spring-boot-internals/INFRASTRUCTURE-INTERNALS.md).

## Scheduling

Moved to [Spring Infrastructure Internals](spring-boot-internals/INFRASTRUCTURE-INTERNALS.md).

## OpenFeign

Moved to [Spring Infrastructure Internals](spring-boot-internals/INFRASTRUCTURE-INTERNALS.md).

## Kafka Infrastructure

Moved to [Spring Infrastructure Internals](spring-boot-internals/INFRASTRUCTURE-INTERNALS.md).

## Actuator, Micrometer, And Tracing

Moved to [Spring Infrastructure Internals](spring-boot-internals/INFRASTRUCTURE-INTERNALS.md).

## Config Client And Eureka

Moved to [Spring Infrastructure Internals](spring-boot-internals/INFRASTRUCTURE-INTERNALS.md).

## Reactive Gateway Difference

Moved to [Spring Infrastructure Internals](spring-boot-internals/INFRASTRUCTURE-INTERNALS.md).

## Startup Diagnostics

Moved to [Spring Boot Operations Internals](spring-boot-internals/OPERATIONS-INTERNALS.md).

## Graceful Shutdown

Moved to [Spring Boot Operations Internals](spring-boot-internals/OPERATIONS-INTERNALS.md).

## Production Practices

Moved to [Spring Boot Operations Internals](spring-boot-internals/OPERATIONS-INTERNALS.md).

## Related Guides

Moved to [Spring Boot Operations Internals](spring-boot-internals/OPERATIONS-INTERNALS.md).

## Official References

Moved to [Spring Boot Operations Internals](spring-boot-internals/OPERATIONS-INTERNALS.md).
