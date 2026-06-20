---
title: Spring Boot Operations Internals
---

# Spring Boot Operations Internals

Startup diagnostics, graceful shutdown, production practices, and official references.

Back to [Spring Boot Internals](../SPRING-BOOT-INTERNALS.md).

## Startup Diagnostics

Useful diagnostics include:

- condition evaluation report;
- startup failure analysis;
- bean-definition conflicts;
- configuration binding error details;
- Liquibase and datasource logs;
- embedded-server bind failures.

With appropriate exposure and security, Actuator can provide:

```text
/actuator/health
/actuator/beans
/actuator/configprops
/actuator/conditions
/actuator/env
/actuator/mappings
/actuator/prometheus
```

Do not expose sensitive diagnostic endpoints publicly. `env` and
`configprops` can reveal configuration structure or values and require careful
sanitization and access control.

Run with debug condition reporting when diagnosing auto-configuration:

```powershell
./gradlew bootRun --args='--debug'
```

The condition report explains which auto-configurations matched or did not
match and why.


## Graceful Shutdown

During context close:

1. readiness should stop advertising new work;
2. web requests receive a bounded drain period;
3. listener containers and schedulers stop;
4. lifecycle beans stop;
5. `@PreDestroy` and destroy callbacks run;
6. pools and the embedded server close.

Applications must bound shutdown time and avoid accepting Kafka/HTTP work that
cannot finish or be safely redelivered.

Forced process termination can skip application cleanup. Durable correctness
must not depend only on `@PreDestroy`.


## Production Practices

1. Keep the application class at a deliberate package root.
2. Prefer constructor injection.
3. Use immutable validated configuration records.
4. Keep configuration prefixes cohesive.
5. Let auto-configuration provide defaults, overriding only intentionally.
6. Avoid replacing core beans without preserving required modules/settings.
7. Keep startup initialization bounded.
8. Keep transactions and locks out of remote waits.
9. Understand proxy boundaries and self-invocation.
10. Disable public access to sensitive actuator endpoints.
11. Use graceful shutdown and readiness.
12. Test invalid configuration and missing dependency failures.
13. Inspect the condition report before adding unnecessary manual beans.
14. Treat servlet and reactive context propagation differently.


## Related Guides

- [Spring Boot production tuning](PRODUCTION-TUNING.md)
- [Spring Security](../../security/SPRING-SECURITY-GENERIC.md)
- [API Gateway](../API-GATEWAY-GENERIC.md)
- [Spring Transactions](../../spring/SPRING-TRANSACTIONS.md)
- [Liquibase](../../data/LIQUIBASE-GENERIC.md)
- [Spring Cloud OpenFeign](../../spring/SPRING-OPENFEIGN.md)
- [Spring Kafka](../../spring/SPRING-KAFKA.md)
- [MDC and tracing](../../observability/MDC-CORRELATION-TRACING.md)
- [Micrometer metrics](../../observability/MICROMETER-METRICS.md)


## Official References

- [Spring Boot auto-configuration](https://docs.spring.io/spring-boot/reference/using/auto-configuration.html)
- [Spring Boot external configuration](https://docs.spring.io/spring-boot/reference/features/external-config.html)
- [Spring Boot JSON support](https://docs.spring.io/spring-boot/reference/features/json.html)
- [Spring Framework bean lifecycle](https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html)
- [Spring MVC DispatcherServlet](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet.html)









