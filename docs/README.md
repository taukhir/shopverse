---
slug: /
title: Backend Engineering Knowledge Base
sidebar_position: 1
---

# Backend Engineering Knowledge Base

This is a reusable study and reference library for backend engineering,
Spring, databases, microservices, distributed systems, security,
observability, testing, and delivery.

Shopverse is included as a detailed case study showing how these concepts work
together in a real microservices proof of concept. It is not the scope or title
of the complete knowledge base.

## Choose A Track

| Track | Purpose |
|---|---|
| [Structured learning path](reference/LEARNING-PATH.md) | Learn topics in dependency order from foundations through distributed systems |
| [Topic-based reference](#knowledge-domains) | Jump directly to a backend engineering subject |
| [Shopverse case study](case-study/SHOPVERSE.md) | Study one complete implementation, its architecture, APIs, failures, and fixes |
| [Operations cheat sheet](operations/OPERATIONS-CHEATSHEET.md) | Quickly find Docker, Git, LogQL, PromQL, Zipkin, and verification commands |
| [CI/CD automation](operations/CI-CD-AUTOMATION.md) | Compare Jenkins, GitHub Actions, GitOps, cloud pipelines, and delivery controls |

## Knowledge Domains

1. **Engineering foundations:** SOLID, DRY, API design, testing, and Git.
2. **Spring and Java backend:** Framework, Boot, Web, Data JPA, Security, and
   caching.
3. **Databases and transactions:** normalization through 4NF, joins, indexes,
   query optimization, ACID, locking, Liquibase, partitioning, and sharding.
4. **Microservices and integration:** service boundaries, API Gateway,
   discovery, load balancing, Feign, and Kafka.
5. **Distributed systems:** CAP, consistency, distributed databases,
   transactions, locks, SAGA, consensus, resilience, and failure recovery.
6. **Logging and observability:** MDC, structured logs, metrics, Prometheus,
   Loki, Grafana, tracing, and alerts.
7. **Delivery and operations:** Docker, Jenkins, GitHub Actions, CI/CD
   automation, deployment strategies, debugging, and operational tooling.

## Theory And Case Studies

Generic guides explain the reusable concept:

```text
SAGA-GENERIC.md
SPRING-TRANSACTIONS.md
SPRING-CACHE.md
SPRING-AOP.md
SPRING-SECURITY-GENERIC.md
REST-API-GENERIC.md
```

Shopverse guides then demonstrate concrete application:

```text
SAGA-OUTBOX.md
TRANSACTIONS.md
JWT-OAUTH2-SPRING-SECURITY.md
API-GUIDE.md
```

## Documentation Rules

1. Explain a reusable concept independently before using Shopverse as an
   example.
2. Put project-specific behavior in the Shopverse case-study track.
3. Mark implementation status as **Implemented**, **Partial**, or **Planned**.
4. Keep commands in operational guides and conceptual explanations in study
   guides.
5. Keep secrets and real credentials out of examples.
6. Prefer one canonical explanation and link to it instead of duplicating
   content.

The Markdown is rendered by the Docusaurus application under
`documentation/`. GitHub Actions validates changes and deploys the site to
GitHub Pages.
