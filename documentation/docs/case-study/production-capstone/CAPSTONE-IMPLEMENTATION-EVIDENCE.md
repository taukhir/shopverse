---
title: Capstone Implementation, Failure Programme, And Portfolio Defence
description: Concrete repository layout, delivery gates, failure programme, evidence matrix, architecture decisions, review rubric, and interview defence for the integrated capstone.
difficulty: Advanced
page_type: Practice
status: Shopverse-specific
prerequisites: [ShopVerse Integrated Production Architecture Capstone]
learning_objectives: [Structure implementation artifacts, Execute failure and recovery drills, Prove architecture claims, Defend decisions under interview questioning]
technologies: [ShopVerse, Kubernetes, Kafka, Terraform, Vault, k6]
last_reviewed: "2026-07-24"
---

# Capstone Implementation, Failure Programme, And Portfolio Defence

## Repository Evidence Layout

```text
capstone/
├── services/                 # application and contracts
├── infrastructure/modules/  # Terraform/OpenTofu
├── platform/charts/          # Helm
├── environments/            # GitOps desired state
├── policies/                 # admission/network/security tests
├── observability/            # dashboards, alerts, SLOs
├── tests/load/               # k6 workloads/results
├── tests/failure/            # experiments and abort rules
├── runbooks/                 # incident and recovery
├── decisions/                # ADRs
└── evidence/                 # timestamped summarized results
```

## Mandatory Gates

Source tests and static analysis; API/event compatibility; image SBOM/scan/signature; IaC format/validate/
security/test/plan; Helm render/schema/admission; policy tests; ephemeral integration; protected promotion;
post-deploy smoke/SLO; automated rollback or controlled halt based on evidence.

## Failure Programme

| Fault | Invariant and proof |
|---|---|
| payment response lost | at most one charge; idempotency and reconciliation |
| Kafka unavailable 30 minutes | bounded producer/backlog behavior and later recovery |
| hot tenant/partition | isolated quota/key strategy and lag recovery |
| database pool exhausted | admission/backpressure without thread collapse |
| Pod/node/zone loss | bounded errors and recovery time |
| DNS/TLS/secret rotation failure | exact diagnosis, overlap and recovery |
| schema incompatible deployment | CI gate blocks or tolerant rollout succeeds |
| Argo drift/emergency change | governed reconcile/freeze and audit |
| volume/database restore | measured RPO/RTO and checksum/business reconciliation |
| credential leak | revoke, rotate, scope and audit evidence |

## Portfolio Defence

Prepare five-minute overview, forty-five-minute deep dive and ninety-minute system-design variant. Explain
internals, selected design, rejected alternatives, failure modes, diagnosis, scale/security and production
evidence. Score requirements, correctness, consistency, operability, security, migration, cost and clarity.

The capstone is complete only when another engineer can reproduce its setup, one failure and one restore
from the documentation without undocumented assistance.

## Official References

- [C4 model](https://c4model.com/)
- [Architecture Decision Records](https://adr.github.io/)
- [Google SRE testing for reliability](https://sre.google/sre-book/testing-reliability/)

## Recommended Next

Return to the [ShopVerse Integrated Production Architecture Capstone](../PRODUCTION-CAPSTONE-PATH.md), select the first unproven acceptance claim, and produce its evidence.

