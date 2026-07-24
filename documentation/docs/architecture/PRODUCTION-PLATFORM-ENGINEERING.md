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
2. [API And Event Schema Governance](./API-EVENT-SCHEMA-GOVERNANCE-PATH.md)
3. [Linux Production Troubleshooting](../operations/LINUX-PRODUCTION-TROUBLESHOOTING-PATH.md)
4. [Kubernetes Beginner-To-Architect Path](../operations/KUBERNETES-ARCHITECT-PATH.md)
5. [Helm, GitOps, And Argo CD](../operations/HELM-GITOPS-ARGOCD-PATH.md)
6. [Terraform And OpenTofu Infrastructure As Code](../operations/INFRASTRUCTURE-AS-CODE-ARCHITECT-PATH.md)
7. [DNS, TCP, TLS, And HTTP/2 Diagnosis](./NETWORK-PROTOCOL-DIAGNOSIS-PATH.md)
8. [gRPC And Protocol Buffers](./GRPC-PROTOBUF-ARCHITECT-PATH.md)
9. [Service Mesh](./SERVICE-MESH-ARCHITECT-PATH.md)
10. [Vault And Kubernetes Secrets](../security/VAULT-KUBERNETES-SECRETS-PATH.md)
11. [Performance And Chaos Engineering](../operations/PERFORMANCE-CHAOS-ENGINEERING-PATH.md)
12. [Platform Engineering And Golden Paths](../operations/PLATFORM-ENGINEERING-GOLDEN-PATH.md)
13. [Integrated Production Capstone](../case-study/PRODUCTION-CAPSTONE-PATH.md)
14. [Asynchronous And Real-Time Systems](./ASYNC-REALTIME-DISTRIBUTED-TIME.md)
15. [Multi-Tenancy, Object Storage, And Feature Flags](./MULTITENANCY-STORAGE-FEATURE-FLAGS.md)
16. [Data Pipelines And Search Operations](../data/DATA-PIPELINES-SEARCH-OPERATIONS.md)
17. [SRE, Disaster Recovery, And Chaos Engineering](../operations/SRE-DR-CHAOS.md)
18. [Performance, Capacity, And FinOps](../operations/PERFORMANCE-CAPACITY-FINOPS.md)
19. [Supply-Chain Security And Privacy Engineering](../security/SUPPLY-CHAIN-PRIVACY.md)
20. [JVM Profiling, Garbage Collection, And Native Images](../java/JVM-PROFILING-GC-NATIVE.md)
21. [Advanced Spring Platform Patterns](../spring/SPRING-PLATFORM-ADVANCED.md)

## Production Readiness Questions

- Can old and new clients, events, schemas, and deployments coexist?
- Are resources, concurrency, retries, queues, and failure domains bounded?
- Can operators observe user impact, recover data, and reverse a rollout?
- Are tenant, identity, secret, PII, and artifact boundaries enforced?
- Have peak load, partial failure, regional loss, restore, and cost been tested?
- Are owners, SLOs, runbooks, escalation, and reassessment triggers explicit?

## Recommended Next

Start with [API And Event Compatibility](./API-EVENT-COMPATIBILITY.md); compatibility
is the prerequisite for rolling deployments, event evolution, and safe migrations.
