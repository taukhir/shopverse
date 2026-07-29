---
title: Documentation Overview Coverage Audit
description: Maintained audit of foundational overview pages and sidebar entry points across the Shopverse documentation portal.
sidebar_label: Overview Coverage Audit
difficulty: Beginner
page_type: Reference
status: maintained
last_reviewed: "2026-07-24"
---

# Documentation Overview Coverage Audit

This audit prevents a topic from beginning with an advanced implementation page when a reader
still needs its basic vocabulary and mental model.

## Coverage Standard

A major domain or named technology track must provide:

1. a canonical entry page reachable from the sidebar category label;
2. a plain-language definition and the problem the topic solves;
3. a component or concept map;
4. basic request, build, or runtime flow where applicable;
5. core terminology and selection boundaries;
6. common mistakes or explicit non-goals;
7. links into deeper learning or architect paths.

A curriculum grouping such as “Advanced And Modern Concurrency” does not require another overview
when its parent track already supplies the mental model and the group merely organizes sequenced
pages.

## Major Domain Coverage

| Domain | Canonical entry page |
|---|---|
| Engineering foundations | [Engineering Foundations Overview](../development/ENGINEERING-FOUNDATIONS-OVERVIEW.md) |
| Design patterns | [Design Patterns](../development/DESIGN-PATTERNS.md) |
| Arrays and programming problems | [Arrays Overview](../data-structures/programming/arrays/ARRAYS-OVERVIEW.md) |
| Java | [Core Java Deep Dive](../java/CORE-JAVA-DEEP-DIVE.md) |
| Java collections | [Java Collections](../java/JAVA-COLLECTIONS.md) |
| Spring and Spring Boot | [Spring Learning Guide](../spring/README.md) |
| Data and persistence | [Data And Persistence Overview](../data/DATA-PERSISTENCE-OVERVIEW.md) |
| Microservices and distributed systems | [Microservices And Distributed Systems](../architecture/MICROSERVICES-DISTRIBUTED-SYSTEMS.md) |
| Security | [Application And Platform Security](../security/README.md) |
| Logging and observability | [Observability Engineering Overview](../observability/OBSERVABILITY-OVERVIEW.md) |
| Delivery, containers, and CI/CD | [Delivery And Operations Overview](../operations/README.md) |
| Cloud and AWS | [Cloud And AWS Overview](../cloud/README.md) |
| Production platform engineering | [Production Platform Engineering](../architecture/PRODUCTION-PLATFORM-ENGINEERING.md) |
| AI, RAG, and Java AI | [AI And RAG Overview](../ai/README.md) |
| Shopverse implementation | [Shopverse Overview And Demo](../case-study/SHOPVERSE.mdx) |

## Delivery And Platform Technology Coverage

| Technology | Beginner overview | Deep route |
|---|---|---|
| Maven | [Maven Overview](../operations/MAVEN-OVERVIEW.md) | [Maven Engineering Path](../operations/MAVEN-ENGINEERING-PATH.md) |
| Infrastructure as Code | [Infrastructure As Code Overview](../operations/INFRASTRUCTURE-AS-CODE-OVERVIEW.md) | [Terraform And OpenTofu Architect Path](../operations/INFRASTRUCTURE-AS-CODE-ARCHITECT-PATH.md) |
| Linux | [Linux Overview](../operations/LINUX-OVERVIEW.md) | [Linux Production Troubleshooting](../operations/LINUX-PRODUCTION-TROUBLESHOOTING-PATH.md) |
| Docker | [Docker Overview](../operations/DOCKER.md) | [Docker Beginner-To-Architect](../operations/DOCKER-ARCHITECT-PATH.md) |
| Kubernetes | [Kubernetes Overview](../operations/kubernetes/KUBERNETES-OVERVIEW.md) | [Kubernetes Beginner-To-Architect](../operations/KUBERNETES-ARCHITECT-PATH.md) |
| Helm, GitOps, and Argo CD | [Helm, GitOps, And Argo CD Overview](../operations/HELM-GITOPS-ARGOCD-OVERVIEW.md) | [Architect Path](../operations/HELM-GITOPS-ARGOCD-PATH.md) |
| deployment strategies | [Deployment Strategies](../operations/DEPLOYMENT-STRATEGIES.md) | [Strategy Selection](../operations/DEPLOYMENT-STRATEGY-SELECTION.md) |
| AWS | [AWS Umbrella](../cloud/aws/AWS-UMBRELLA.md) | [EKS Production Architect Path](../cloud/aws/EKS-PRODUCTION-ARCHITECT-PATH.md) |

## Automated Guard

`scripts/audit-overview-coverage.mjs` verifies that every audited sidebar category links to its
canonical entry document and that the target document exists with frontmatter. The check runs as
part of `check:content-quality` through `check:docs:overviews`.

When adding a major domain or named technology track:

1. create or select its canonical overview;
2. link the sidebar category to it;
3. add the pair to the coverage audit script;
4. connect the overview to deeper pages without copying their detailed content.

## Recommended Next

Use the [Documentation Structure](./DOCUMENTATION-STRUCTURE.md) for placement rules and the
[Documentation Quality Audit](./DOCUMENTATION-QUALITY-AUDIT.md) for broader content checks.

