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

## Read In This Order

| Goal | Page |
|---|---|
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

## Related Problem Pages

- [Docker Build Context For Platform Modules](../reliability/problems/optimization/DOCKER-BUILD-CONTEXT-PLATFORM.md)
- [Docker Image Size Optimization](../reliability/problems/optimization/DOCKER-IMAGE-SIZE-OPTIMIZATION.md)
- [Docker Compose Profiles](../reliability/problems/optimization/DOCKER-COMPOSE-PROFILES.md)
- [Runtime Optimization](../reliability/problems/optimization/RUNTIME-OPTIMIZATION.md)
- [Gradle Build Performance](../reliability/problems/optimization/GRADLE-BUILD-PERFORMANCE.md)
- [Verification And Documentation](../reliability/problems/optimization/VERIFICATION-AND-DOCUMENTATION.md)
