---
title: Microservices Production Mastery
description: Complete lead and architect coverage map for boundaries, communication, consistency, resilience, APIs, security, observability, deployment, and production incidents.
difficulty: Architect
page_type: Learning Path
status: maintained
prerequisites: [Distributed systems, REST, Messaging, Kubernetes]
learning_objectives: [Cover every production microservices competency, Select canonical deep dives, Defend failure and recovery decisions]
technologies: [Spring Boot, HTTP, gRPC, Kafka, Kubernetes, OpenTelemetry]
last_reviewed: "2026-07-28"
scope: generic
owner: docs-architecture
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Microservices Production Mastery

This is the completeness index for Lead/Architect preparation. The
[Microservices Architect Path](./MICROSERVICES-ARCHITECT-PATH.md) supplies the
study order; this page ensures every production topic has an explicit home.

## Architecture Fundamentals

| Required coverage | Canonical material |
|---|---|
| monolith, modular monolith, microservices, and when not to use microservices | [Monolith-To-Microservices Strategy](../../leadership/MONOLITH-TO-MICROSERVICES-STRATEGY.md) |
| bounded contexts, DDD, service boundaries, autonomy and ownership | [Microservices Internals](../MICROSERVICES-INTERNALS-DEEP-DIVE.md) |
| database per service, shared-database coupling, stateful/stateless services | [Microservices Patterns](../MICROSERVICES-PATTERNS.md) |
| synchronous/asynchronous communication, commands/events | [Distributed Systems](../DISTRIBUTED-SYSTEMS.md) |
| strangler migration, rollback and team boundaries | [Monolith-To-Microservices Strategy](../../leadership/MONOLITH-TO-MICROSERVICES-STRATEGY.md) |

## Communication

- REST, HTTP contracts, pagination, long-running operations and webhooks:
  [REST API Production Design](../../development/REST-API-PRODUCTION-DESIGN.md).
- gRPC, Protocol Buffers, deadlines, streaming and reliability:
  [gRPC And Protobuf Architect Path](../GRPC-PROTOBUF-ARCHITECT-PATH.md).
- Kafka, commands, events and asynchronous workflows:
  [Kafka Production Mastery](../../integration/kafka/KAFKA-PRODUCTION-MASTERY.md).
- API Gateway, BFF, routing, filters and gateway incidents:
  [API Gateway Architecture](../../development/API-GATEWAY-ARCHITECTURE.md).
- discovery, client/server load balancing, connection pools and stale endpoints:
  [Microservices Distributed Systems](../MICROSERVICES-DISTRIBUTED-SYSTEMS.md).

Every remote call needs an owner, connect/request deadline, cancellation path,
bounded connection pool, retry classification, idempotency rule, and observable
outcome.

## Distributed Consistency

Coverage includes local transactions, 2PC limitations, eventual consistency,
read-your-writes, Saga orchestration/choreography, compensation, outbox, inbox,
CDC, reconciliation, missing outcomes, and late/out-of-order events:

- [Distributed Consistency And CAP](../DISTRIBUTED-CONSISTENCY-CAP.md)
- [Distributed Transactions And Locks](../../reliability/DISTRIBUTED-TRANSACTIONS-LOCKS.md)
- [Saga Consistency And Compensation](../../reliability/SAGA-CONSISTENCY-COMPENSATION.md)
- [Saga Liveness And Recovery](../../reliability/SAGA-LIVENESS-TIMEOUT-RECOVERY.md)
- [Outbox Production Failure Modes](../../reliability/OUTBOX-PRODUCTION-FAILURE-MODES.md)
- [Inbox Pattern](../../reliability/INBOX-PATTERN.md)

## Resilience And Cascading-Failure Prevention

Timeouts, retry budgets, exponential backoff, jitter, circuit breakers, bulkheads,
rate limits, load shedding, backpressure, fallbacks, dependency/pool isolation,
graceful degradation, hedging, retry amplification, thundering herds, cache
stampedes and brownouts are consolidated in
[Cascading-Failure Prevention](./MICROSERVICES-CASCADING-FAILURE-PREVENTION.md).

## API Design And Governance

The API track covers resource modelling, HTTP methods/status, idempotency keys,
pagination/filtering/sorting, ETags, versioning, OpenAPI, consumer contracts,
compatibility, deprecation, standard errors, correlation IDs, API security and
tenant isolation:

- [REST API HTTP Contracts](../../development/REST-API-HTTP-CONTRACTS.md)
- [REST And OpenAPI Contract Governance](../../development/spring-rest/REST-OPENAPI-CONTRACT-GOVERNANCE.md)
- [API And Event Schema Governance](../API-EVENT-SCHEMA-GOVERNANCE-PATH.md)

## Service Security

Authentication/authorization, OAuth 2.0, OIDC, JWT validation/propagation, mTLS,
workload identity, secret rotation, least privilege, zero trust, gateway security,
replay prevention, audit and sensitive-data classification:

- [Microservices Security Principles](../../security/principles/MICROSERVICES-SECURITY-PRINCIPLES.md)
- [API Security Principles](../../security/principles/API-SECURITY-PRINCIPLES.md)
- [Distributed Authorization At Scale](../../security/spring-security/DISTRIBUTED-AUTHORIZATION-PERMISSION-SCALE.md)

## Observability

Structured logs, metrics, traces, correlation/causation, OpenTelemetry, RED/USE,
SLIs/SLOs/error budgets, dependency latency, sampling, cardinality, business
metrics, alerts and incident timelines:

- [Observability Overview](../../observability/OBSERVABILITY-OVERVIEW.md)
- [Distributed Tracing Internals](../../observability/DISTRIBUTED-TRACING-INTERNALS-PERFORMANCE.md)
- [Microservices Observability And SLOs](./MICROSERVICES-OBSERVABILITY-SLOS.md)

## Deployment And Operations

Kubernetes, rolling/blue-green/canary deployment, feature flags, shutdown,
readiness/liveness, configuration, Helm, GitOps/Argo CD, migrations, compatibility,
autoscaling, disruption budgets and rollback are covered by the Kubernetes and
delivery tracks. Regional placement, failover and disaster recovery continue in
[Multi-Region Microservices Recovery](./MICROSERVICES-MULTI-REGION-RECOVERY.md).

- [Kubernetes Architect Path](../../operations/KUBERNETES-ARCHITECT-PATH.md)
- [Kubernetes Workload Engineering](../../operations/KUBERNETES-WORKLOAD-ENGINEERING.md)
- [Deployment Strategies](../../operations/DEPLOYMENT-STRATEGIES.md)
- [Deployment Contracts And Release Gates](../../operations/DEPLOYMENT-CONTRACTS-RELEASE-GATES.md)
- [Helm, GitOps And Argo CD Path](../../operations/HELM-GITOPS-ARGOCD-PATH.md)
- [Spring Boot Configuration And Environments](../../spring/boot/SPRING-BOOT-CONFIGURATION-ENVIRONMENTS.md)
- [Database Migration Operations](../../data/database-selection/DATABASE-MIGRATIONS-OPERATIONS.md)
- [Multitenancy, Storage And Feature Flags](../MULTITENANCY-STORAGE-FEATURE-FLAGS.md)

## Required Production Scenarios

Practise diagnosing and defending:

1. slow and unavailable dependencies;
2. retry amplification during recovery;
3. database-pool exhaustion across workloads;
4. gateway saturation and stale discovery;
5. request completed but response lost;
6. stuck Saga and missing participant outcome;
7. old/new API and event versions running together;
8. one dominant tenant;
9. regional loss;
10. rollback after new events or schemas were published.

For each, state the invariant, evidence, containment, safe recovery,
reconciliation, prevention and rejected trade-offs.

## Recommended Next

Begin with [Cascading-Failure Prevention](./MICROSERVICES-CASCADING-FAILURE-PREVENTION.md).
