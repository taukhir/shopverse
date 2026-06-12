---
title: Shopverse Case Study
sidebar_position: 1
---

# Shopverse Case Study

Shopverse is the practical case study inside this backend engineering knowledge
base. It demonstrates how Spring, databases, security, Kafka, distributed
consistency, observability, testing, and delivery interact in one system.

## What The Case Study Demonstrates

- independently owned microservice databases;
- centralized configuration and service discovery;
- API Gateway routing and edge security;
- RSA-signed JWT access tokens and JWKS;
- synchronous Feign communication;
- asynchronous Kafka choreography;
- SAGA compensation and transactional Outbox;
- idempotent checkout and concurrency control;
- JSON logging, correlation IDs, metrics, traces, dashboards, and alerts;
- Docker, GitHub Actions, Jenkins, Testcontainers, and bounded verification.

## Recommended Case-Study Order

| Step | Guide | Question answered |
|---:|---|---|
| 1 | [System design](../architecture/SYSTEM-DESIGN.md) | What components exist and how do they communicate? |
| 2 | [Service catalog](../services/SERVICE-CATALOG.md) | What does each service own? |
| 3 | [Features and demos](../reference/FEATURES-AND-DEMOS.md) | What is implemented and how can it be demonstrated? |
| 4 | [API guide](../development/API-GUIDE.md) | How do clients use the platform? |
| 5 | [SAGA and Outbox](../reliability/SAGA-OUTBOX.md) | How does checkout remain recoverable across services? |
| 6 | [Security implementation](../security/JWT-OAUTH2-SPRING-SECURITY.md) | How are authentication and authorization enforced? |
| 7 | [Observability](../observability/OBSERVABILITY.md) | How are logs, metrics, and traces connected? |
| 8 | [Testing strategy](../development/TESTING.md) | How is the ecosystem verified without unbounded resource use? |
| 9 | [Problems and solutions](../reliability/PROBLEMS-AND-SOLUTIONS.md) | Which production-relevant defects were found and fixed? |

## Theory Before Implementation

When a project guide introduces an unfamiliar concept, study its reusable
counterpart first:

| Shopverse implementation | Generic study guide |
|---|---|
| Checkout SAGA | [SAGA and Outbox patterns](../reliability/SAGA-GENERIC.md) |
| Transaction boundaries | [Spring transactions](../spring/SPRING-TRANSACTIONS.md) |
| JWT resource servers | [Spring Security](../security/SPRING-SECURITY-GENERIC.md) |
| API contracts | [REST API design](../development/REST-API-GENERIC.md) |
| Resilience annotations | [Resilience4j patterns](../reliability/RESILIENCE4J-GENERIC.md) |
| Service topology | [Microservice architecture](../architecture/MICROSERVICES-GENERIC.md) |

## Implementation Status

The case study distinguishes:

- **Implemented:** present in code and verified;
- **Partial:** baseline implementation with known hardening work;
- **Planned:** study or roadmap material, not current runtime behavior.

This prevents generic best practices from being confused with features already
implemented by Shopverse.
