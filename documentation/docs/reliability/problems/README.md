---
title: Problems And Solutions Index
---

# Problems And Solutions Index

This section contains Shopverse-specific problems, fixes, measurements, and
follow-up decisions.

Use these pages when you want to understand why code or configuration changed,
not just what the final implementation looks like.

## Problem Groups

| Group | Start Here | Covers |
|---|---|---|
| Current implementation status | [Current Problems And Solutions](./CURRENT-PROBLEMS-AND-SOLUTIONS.md) | Current solved, partial, and remaining hardening items across runtime, API, frontend, Docker, and verification. |
| Runtime reliability | [Runtime Reliability Problems](./RUNTIME-RELIABILITY-PROBLEMS.md) | Checkout consistency, dependency lookup scope, idempotency, Kafka behavior, reservation expiry, cancellation release, ownership checks, payment uncertainty, cart persistence, and fulfillment state. |
| Outbox runtime | [Outbox Runtime Problems](./OUTBOX-RUNTIME-PROBLEMS.md) | Outbox lock scope, claim release, stuck events. |
| Docker/runtime images | [Docker And Runtime Image Problems](./DOCKER-RUNTIME-IMAGE-PROBLEMS.md) | Runtime image composition, non-root containers, Gradle cache behavior in Docker builds. |
| Dependency and verification | [Dependency And Verification Problems](./DEPENDENCY-VERIFICATION-PROBLEMS.md) | Health probes, bounded checks, service dependency semantics. |
| Optimization | [Build, JAR, Docker, And Compose Optimization Solutions](./OPTIMIZATION-SOLUTIONS.md) | Baseline measurements and step-by-step build/runtime optimization work. |

## Page Template

Every new problem page should include:

- problem
- impact
- how we identified it
- solution
- files changed
- verification command
- before/after result when measurable
- residual risk

## Related Implementation Areas

- [Platform Infrastructure](../../platform/README.md)
- [Shopverse SAGA And Outbox](../SAGA-OUTBOX.md)
- [Docker Operations](../../operations/SHOPVERSE-DOCKER.md)
- [Debugging Runbook](../../development/DEBUGGING.md)
