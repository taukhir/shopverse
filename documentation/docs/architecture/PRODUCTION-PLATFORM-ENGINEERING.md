---
title: Production Platform Engineering
difficulty: Intermediate
page_type: Learning Path
status: Generic
keywords: [platform engineering, Kubernetes, SRE, gRPC, schema evolution, multi-tenancy, data pipeline, chaos engineering]
learning_objectives: [Navigate production platform topics in dependency order, Connect application design to runtime operations, Identify operational evidence required before launch]
technologies: [Java, Spring Boot, Kubernetes, Kafka, PostgreSQL]
last_reviewed: "2026-07-12"
---

# Production Platform Engineering

Platform engineering connects application correctness to networking, deployment,
data movement, security, reliability, and cost. Use this track after the Java,
Spring, database, and distributed-systems foundations.

## Learn In This Order

1. [API And Event Compatibility](./API-EVENT-COMPATIBILITY.md)
2. [Kubernetes Workload Engineering](../operations/KUBERNETES-WORKLOAD-ENGINEERING.md)
3. [Networking, gRPC, And Service Mesh](./NETWORKING-GRPC-SERVICE-MESH.md)
4. [Asynchronous And Real-Time Systems](./ASYNC-REALTIME-DISTRIBUTED-TIME.md)
5. [Multi-Tenancy, Object Storage, And Feature Flags](./MULTITENANCY-STORAGE-FEATURE-FLAGS.md)
6. [Data Pipelines And Search Operations](../data/DATA-PIPELINES-SEARCH-OPERATIONS.md)
7. [SRE, Disaster Recovery, And Chaos Engineering](../operations/SRE-DR-CHAOS.md)
8. [Performance, Capacity, And FinOps](../operations/PERFORMANCE-CAPACITY-FINOPS.md)
9. [Supply-Chain Security And Privacy Engineering](../security/SUPPLY-CHAIN-PRIVACY.md)
10. [JVM Profiling, Garbage Collection, And Native Images](../java/JVM-PROFILING-GC-NATIVE.md)
11. [Advanced Spring Platform Patterns](../spring/SPRING-PLATFORM-ADVANCED.md)

## Production Readiness Questions

- Can old and new clients, events, schemas, and deployments coexist?
- Are resources, concurrency, retries, queues, and failure domains bounded?
- Can operators observe user impact, recover data, and reverse a rollout?
- Are tenant, identity, secret, PII, and artifact boundaries enforced?
- Have peak load, partial failure, regional loss, restore, and cost been tested?
- Are owners, SLOs, runbooks, escalation, and reassessment triggers explicit?

## Recommended Next Page

Start with [API And Event Compatibility](./API-EVENT-COMPATIBILITY.md); compatibility
is the prerequisite for rolling deployments, event evolution, and safe migrations.
