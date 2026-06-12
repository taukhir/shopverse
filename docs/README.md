# Shopverse Documentation

This directory is the canonical documentation set for Shopverse. Service READMEs describe only service-specific runtime behavior. Cross-cutting concepts live here so they are documented once.

## Start Here

| Guide | Purpose |
|---|---|
| [System design](architecture/SYSTEM-DESIGN.md) | Context, runtime, authentication, SAGA, outbox, events, states, ERDs, deployment, and observability diagrams |
| [Features and demos](reference/FEATURES-AND-DEMOS.md) | Implementation evidence, code examples, limitations, and complete demonstration steps |
| [API guide](development/API-GUIDE.md) | Shopverse authentication, important endpoints, and POC demo |
| [Generic REST API design](development/REST-API-GENERIC.md) | HTTP semantics, contracts, security, idempotency, and production practices |
| [Debugging guide](development/DEBUGGING.md) | Evidence-first runbooks for security, routing, databases, Kafka, SAGA, and observability |
| [Testing strategy](development/TESTING.md) | Shopverse coverage, scripts, CI gates, resource controls, and bounded verification modes |
| [Generic Java/Spring testing](development/TESTING-GENERIC.md) | JUnit, Mockito, test slices, repositories, controllers, services, Testcontainers, and E2E practices |
| [Code cross-check](reference/CODE-CROSS-CHECK.md) | Confirmed behavior, documentation decisions, and remaining gaps |
| [API Gateway](development/API-GATEWAY-GENERIC.md) | Generic gateway architecture and the reactive Shopverse filter chain |
| [Load balancing](architecture/LOAD-BALANCING-GENERIC.md) | Algorithms, discovery models, Spring Cloud LoadBalancer, and Shopverse flow |

## Integration And Messaging

- [Feign clients](integration/FEIGN-CLIENTS.md)
- [Kafka](integration/KAFKA.md) - brokers, publishing, pull-based consumers, threads, retry/DLT, idempotency, lag, and debugging
- [SAGA and transactional outbox](reliability/SAGA-OUTBOX.md)
- [Shopverse problems and solutions](reliability/PROBLEMS-AND-SOLUTIONS.md) - verified build, runtime, Docker, Outbox, and dependency-handling improvements
- [Outbox database lock and Kafka solution (Word)](reliability/Outbox-Database-Lock-and-Kafka-Solution.docx)
- [Generic SAGA and outbox patterns](reliability/SAGA-GENERIC.md)
- [Transactions](reliability/TRANSACTIONS.md)
- [Generic Spring and Kafka transactions](reliability/TRANSACTIONS-GENERIC.md)

## Security

- [Generic Spring Security](security/SPRING-SECURITY-GENERIC.md)
- [JWT, OAuth2, and Spring Security](security/JWT-OAUTH2-SPRING-SECURITY.md)

## Observability

- [Shopverse centralized logging and observability (Word)](Shopverse_Centralized_Logging_And_Observability.docx)
- [MDC, correlation IDs, and distributed tracing](observability/MDC-CORRELATION-TRACING.md)
- [Generic application logging](observability/LOGGING-GENERIC.md)
- [Structured logging](observability/STRUCTURED-LOGGING.md)
- [Observability architecture](observability/OBSERVABILITY.md)
- [Micrometer metrics](observability/MICROMETER-METRICS.md)
- [Prometheus](observability/PROMETHEUS.md)
- [Loki](observability/LOKI.md)
- [Promtail](observability/PROMTAIL.md)
- [Grafana](observability/GRAFANA.md)

## Spring And Data

- [Spring Boot internals](development/SPRING-BOOT-INTERNALS.md) - startup, auto-configuration, beans, property binding, MVC, Jackson, data, Kafka, and observability
- [Liquibase](data/LIQUIBASE-GENERIC.md)
- [Resilience4j](reliability/RESILIENCE4J.md)
- [Generic Resilience4j patterns](reliability/RESILIENCE4J-GENERIC.md)
- [Distributed systems](architecture/DISTRIBUTED-SYSTEMS.md)

## Operational Documentation

- [Docker](../docker/README.md)
- [Centralized configuration](../config-server/README.md)
- [Jenkins](../jenkins/README.md)
- [GitHub Actions](../.github/workflows/README.md)
- [Observability deployment files](../observability/README.md)

## Documentation Rules

1. Put service ports, endpoints, environment variables, and local build commands in the service README.
2. Put reusable technical explanations in this directory.
3. Mark features as **Implemented**, **Partial**, or **Planned**. Do not document roadmap work as current behavior.
4. Keep secrets and real credentials out of examples.
5. Update diagrams and API examples when event contracts or routes change.
