---
title: Spring Boot Startup, Environment And Auto-Configuration
description: Spring Boot entry point, startup phases, property sources, condition evaluation, back-off, and dependency-driven infrastructure.
difficulty: Intermediate
page_type: Guide
status: Shopverse
learning_objectives:
  - Trace Spring Boot startup from main through readiness
  - Explain property-source precedence and auto-configuration back-off
  - Diagnose missing or unexpected infrastructure from condition evidence
technologies: [Spring Boot, Spring Framework]
last_reviewed: "2026-07-13"
---


import {DocFigure} from '@site/src/components/DocumentationLanding';

# Spring Boot Startup, Environment And Auto-Configuration

<DocLabels items={[
  {label: 'Intermediate', tone: 'intermediate'},
  {label: 'Spring Boot startup', tone: 'foundation'},
  {label: 'Shopverse context', tone: 'shopverse'},
]} />

Application entry point, startup lifecycle, environment, property sources, auto-configuration, conditions, and dependency-driven setup.

<DocCallout type="tip" title="Implementation guide versus architect runtime">
This page explains Boot startup configuration and Shopverse-oriented examples.
For processor ordering, premature bean creation, early references, AOT, startup
evidence, and executable container diagnostics, use
[Spring Container Runtime For Architects](../../spring/SPRING-CONTAINER-ARCHITECT.md).
</DocCallout>

Back to [Spring Boot Internals](../SPRING-BOOT-INTERNALS.md).

## Shopverse Entry Point

```java
@SpringBootApplication
@ConfigurationPropertiesScan
@EnableJpaAuditing
@EnableCaching
@EnableScheduling
public class InventoryServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(InventoryServiceApplication.class, args);
    }
}
```

`main(...)` is the Java process entry point. `SpringApplication.run(...)`
bootstraps Spring, returns the application context, and keeps the process alive
through the embedded web server and non-daemon framework threads.


## `@SpringBootApplication`

`@SpringBootApplication` combines three concerns:

```text
@SpringBootConfiguration
@EnableAutoConfiguration
@ComponentScan
```

### `@SpringBootConfiguration`

Marks the class as the primary Boot configuration source. It is a specialized
`@Configuration`, so it can contribute `@Bean` definitions.

### `@EnableAutoConfiguration`

Imports candidate auto-configuration classes. Conditions decide which
configurations actually apply.

### `@ComponentScan`

Scans the application's package and subpackages for stereotypes such as:

```text
@Component
@Service
@Repository
@Controller
@RestController
@Configuration
```

Inventory's entry point is in `io.shopverse.inventory_service`, so that
package is the natural component-scan root. Placing the entry point too deep
can leave required components undiscovered; placing it too high can scan
unrelated code.


## Startup Lifecycle

<DocFigure
  src="/img/diagrams/spring-boot-startup-lifecycle.svg"
  alt="Spring Boot startup lifecycle from main method through environment, application context refresh, bean creation, infrastructure startup, and readiness"
  caption="Spring Boot startup lifecycle. The diagram is layered to separate bootstrap, environment preparation, context refresh, and runtime readiness."
/>

Simplified startup steps:

1. Java invokes `main`.
2. `SpringApplication` infers the application type from the classpath.
3. Boot creates an `Environment`.
4. Property sources and profiles are resolved.
5. Spring creates the appropriate application context.
6. Configuration classes are parsed.
7. Component scanning registers bean definitions.
8. Boot evaluates auto-configuration conditions.
9. The context refresh creates singleton beans.
10. The embedded server and listener containers start.
11. runners execute.
12. readiness is published when startup completes.

An exception in configuration binding, validation, Liquibase, bean creation,
or server startup prevents the application from becoming ready.


## Environment And Property Sources

Spring's `Environment` provides:

- active and default profiles;
- property lookup;
- ordered property sources;
- type conversion support used by binding.

Shopverse properties can come from:

- command-line arguments;
- Java system properties;
- operating-system environment variables;
- `.env` values passed into Docker Compose;
- Config Server property sources;
- local `application.yml` or profile files;
- defaults written in placeholders or code.

Higher-precedence sources override lower-precedence values. For example:

```yaml
shopverse:
  inventory:
    reservation-ttl: ${INVENTORY_RESERVATION_TTL:5m}
```

`INVENTORY_RESERVATION_TTL=10m` overrides the fallback `5m`.

Centralized configuration changes do not imply every bean updates
automatically. Infrastructure created during startup commonly requires a
restart unless its refresh behavior is explicitly supported and designed.


## Auto-Configuration

Auto-configuration is conditional configuration supplied by Spring Boot and
integrations.

<DocFigure
  src="/img/diagrams/spring-boot-autoconfig-decision-flow.svg"
  alt="Spring Boot auto-configuration decision flow showing classpath conditions, configuration properties, user bean backoff, and infrastructure bean creation"
  caption="Auto-configuration decision flow. Spring Boot creates infrastructure beans only when dependencies, properties, and missing-bean conditions match."
/>

Conceptually:

```java
@AutoConfiguration
@ConditionalOnClass(DataSource.class)
@ConditionalOnMissingBean(DataSource.class)
class DataSourceAutoConfiguration {
    // create a DataSource only when the required conditions match
}
```

Boot discovers modern auto-configuration candidates from metadata such as:

```text
META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
```

This file contains auto-configuration class names. Importing a candidate does
not guarantee that it creates beans; its conditions must match.


## Common Conditional Annotations

| Annotation | Condition |
|---|---|
| `@ConditionalOnClass` | required class exists on the classpath |
| `@ConditionalOnMissingClass` | class is absent |
| `@ConditionalOnBean` | another bean exists |
| `@ConditionalOnMissingBean` | application has not supplied a bean |
| `@ConditionalOnProperty` | property has the expected value |
| `@ConditionalOnWebApplication` | application has the expected web type |
| `@ConditionalOnResource` | required resource exists |
| `@ConditionalOnExpression` | expression evaluates to true |

`@ConditionalOnMissingBean` is how many Boot defaults back off:

```text
no application ObjectMapper bean -> Boot provides/configures one
application ObjectMapper bean    -> Boot default backs off
```

Providing a replacement bean transfers responsibility for its complete
configuration to the application.


## Dependency-Driven Configuration

Inventory Service dependencies activate different infrastructure:

| Dependency | Typical infrastructure |
|---|---|
| `spring-boot-starter-web` | Tomcat, Spring MVC, DispatcherServlet, Jackson |
| `spring-boot-starter-data-jpa` | EntityManagerFactory, transaction manager, repositories |
| `spring-boot-starter-liquibase` | Liquibase startup migration |
| `spring-boot-starter-security` | servlet security infrastructure |
| OAuth2 Resource Server | bearer-token and JWT support |
| `spring-boot-starter-kafka` | producer factory, KafkaTemplate, listener factory |
| `spring-boot-starter-cache` | cache abstraction |
| `spring-boot-starter-actuator` | health, metrics, management endpoints |
| Prometheus registry | Prometheus meter registry and exposition |
| Config Client | Config Server property-source loading |
| Eureka Client | registration and service discovery |
| Zipkin starter | tracing bridge/export integration |

Dependencies provide capabilities, but properties and conditions determine
whether individual beans are created.

## Official References

- [Spring Boot startup](https://docs.spring.io/spring-boot/reference/features/spring-application.html)
- [Spring Boot externalized configuration](https://docs.spring.io/spring-boot/reference/features/external-config.html)
- [Spring Boot auto-configuration](https://docs.spring.io/spring-boot/reference/using/auto-configuration.html)
- [Developing auto-configuration](https://docs.spring.io/spring-boot/reference/features/developing-auto-configuration.html)

## Recommended Next

Continue with [Spring Dependency Injection And Bean Lifecycle](./DI-BEAN-LIFECYCLE-AOP.md).


