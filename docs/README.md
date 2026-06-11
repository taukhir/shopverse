# Shopverse Documentation

This directory is the canonical documentation set for Shopverse. Service READMEs describe only service-specific runtime behavior. Cross-cutting concepts live here so they are documented once.

## Start Here

| Guide | Purpose |
|---|---|
| [System design](architecture/SYSTEM-DESIGN.md) | Services, databases, events, architecture, data model, and end-to-end flows |
| [Features and demos](reference/FEATURES-AND-DEMOS.md) | Implemented features, current limitations, and demonstration steps |
| [API guide](development/API-GUIDE.md) | REST conventions, authentication, important endpoints, and sample requests |
| [Debugging guide](development/DEBUGGING.md) | Symptom-based investigation using Docker, logs, metrics, Kafka, and databases |
| [Testing strategy](development/TESTING.md) | Unit, integration, Testcontainers, E2E, and bounded verification modes |
| [Code cross-check](reference/CODE-CROSS-CHECK.md) | Confirmed behavior, documentation decisions, and remaining gaps |

## Integration And Messaging

- [Feign clients](integration/FEIGN-CLIENTS.md)
- [Kafka](integration/KAFKA.md)
- [SAGA and transactional outbox](reliability/SAGA-OUTBOX.md)
- [Transactions](reliability/TRANSACTIONS.md)

## Security

- [JWT, OAuth2, and Spring Security](security/JWT-OAUTH2-SPRING-SECURITY.md)

## Observability

- [MDC, correlation IDs, and distributed tracing](observability/MDC-CORRELATION-TRACING.md)
- [Structured logging](observability/STRUCTURED-LOGGING.md)
- [Observability architecture](observability/OBSERVABILITY.md)
- [Prometheus](observability/PROMETHEUS.md)
- [Loki and Promtail](observability/LOKI-PROMTAIL.md)
- [Grafana](observability/GRAFANA.md)

## Spring And Data

- [Spring Boot request internals](development/SPRING-BOOT-INTERNALS.md)
- [Liquibase](data/LIQUIBASE.md)
- [Resilience4j](reliability/RESILIENCE4J.md)
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
