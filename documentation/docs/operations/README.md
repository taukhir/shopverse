---
title: Operations
status: "maintained"
last_reviewed: "2026-07-13"
---

# Operations

For a deep explanation of container isolation, virtual machines, image layers,
copy-on-write storage, BuildKit cache, and multi-image disk management, see
[Docker Internals, Layers, And Storage](./DOCKER-INTERNALS-LAYERS-STORAGE.md).

This section contains local development, Docker, CI/CD, deployment, and
documentation-portal operations.

For Java build engineering from lifecycle fundamentals through dependency mediation,
multi-module reactors, reproducibility, supply-chain controls, CI, troubleshooting,
interviews, and labs, use the [Maven Engineering Learning Path](./MAVEN-ENGINEERING-PATH.md).

## Read In This Order

| Goal | Page |
|---|---|
| Master Maven builds and dependency governance | [Maven Engineering Path](./MAVEN-ENGINEERING-PATH.md) |
| Package Kubernetes applications and operate declarative delivery | [Helm, GitOps, And Argo CD](./HELM-GITOPS-ARGOCD-PATH.md) |
| Diagnose Linux CPU, memory, storage, service, network, and container incidents | [Linux Production Troubleshooting](./LINUX-PRODUCTION-TROUBLESHOOTING-PATH.md) |
| Master Kubernetes from API internals through recovery and interviews | [Kubernetes Beginner-To-Architect Path](./KUBERNETES-ARCHITECT-PATH.md) |
| Use kubectl and author/query YAML or JSON manifests | [kubectl Commands And Configuration](./kubernetes/KUBERNETES-KUBECTL-MANIFESTS-COMMANDS.md) |
| Manage kubeconfig, contexts, authentication and multi-cluster access safely | [Kubeconfig And Cluster Access](./kubernetes/KUBERNETES-KUBECONFIG-ACCESS.md) |
| Understand VMs, Pods, containers, BOSH, and TKGI cluster lifecycle | [TKGI Beginner-To-Architect Overview](./kubernetes/TKGI-OVERVIEW-PATH.md) |
| Master Docker runtime, builds, storage, networking, security, and incidents | [Docker Beginner-To-Architect Path](./DOCKER-ARCHITECT-PATH.md) |
| Provision infrastructure safely with state, modules, tests, and recovery | [Terraform And OpenTofu IaC](./INFRASTRUCTURE-AS-CODE-ARCHITECT-PATH.md) |
| Prove capacity and resilience with load and controlled failure | [Performance And Chaos Engineering](./PERFORMANCE-CHAOS-ENGINEERING-PATH.md) |
| Build developer golden paths and governed self-service | [Platform Engineering And Golden Paths](./PLATFORM-ENGINEERING-GOLDEN-PATH.md) |
| Automate operational runbooks safely | [Shell Automation Engineering](./SHELL-AUTOMATION-ENGINEERING-PATH.md) |
| Run Shopverse locally | [Local Docker Implementation Guide](./LOCAL-DOCKER-IMPLEMENTATION-GUIDE.md) |
| Understand Shopverse Docker setup | [Shopverse Docker](./SHOPVERSE-DOCKER.md) |
| Learn Docker concepts | [Docker](./DOCKER.md) |
| Compare rolling, blue-green, canary, shadow, and feature-flag releases | [Deployment Strategies](./DEPLOYMENT-STRATEGIES.md) |
| Work with MinIO assets | [MinIO](./MINIO.md) |
| Use Jenkins for this project | [Shopverse Jenkins](./SHOPVERSE-JENKINS.md) |
| Learn Jenkins concepts | [Jenkins](./JENKINS.md) |
| Maintain this documentation site | [Docusaurus](./DOCUSAURUS.md) |
| Understand health, metrics, probes, and management endpoints | [Spring Boot Actuator](./SPRING-BOOT-ACTUATOR.md) |
| Find common commands | [Operations Cheat Sheet](./OPERATIONS-CHEATSHEET.md) |
| Review measured optimization work | [Optimization Solutions](../reliability/problems/OPTIMIZATION-SOLUTIONS.md) |

## Recommended Next

For cloud-native production preparation, start with [Linux Production Troubleshooting](./LINUX-PRODUCTION-TROUBLESHOOTING-PATH.md), then complete [Helm, GitOps, And Argo CD](./HELM-GITOPS-ARGOCD-PATH.md).

## Related Problem Pages

- [Docker Build Context For Platform Modules](../reliability/problems/optimization/DOCKER-BUILD-CONTEXT-PLATFORM.md)
- [Docker Image Size Optimization](../reliability/problems/optimization/DOCKER-IMAGE-SIZE-OPTIMIZATION.md)
- [Docker Compose Profiles](../reliability/problems/optimization/DOCKER-COMPOSE-PROFILES.md)
- [Runtime Optimization](../reliability/problems/optimization/RUNTIME-OPTIMIZATION.md)
- [Gradle Build Performance](../reliability/problems/optimization/GRADLE-BUILD-PERFORMANCE.md)
- [Verification And Documentation](../reliability/problems/optimization/VERIFICATION-AND-DOCUMENTATION.md)
