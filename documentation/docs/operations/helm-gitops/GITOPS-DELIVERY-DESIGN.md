---
title: GitOps Repository, Promotion, And Drift Design
description: Apply declarative desired state, pull reconciliation, immutable promotion, repository patterns, secrets, policy, drift, and safe change workflows.
difficulty: Advanced
page_type: Decision Guide
status: Generic
prerequisites: [Helm Chart Engineering]
learning_objectives: [Design GitOps repositories and promotion, Define reconciliation and drift policy, Keep secrets and migrations outside unsafe Git workflows]
technologies: [GitOps, Git, Kubernetes, Helm]
last_reviewed: "2026-07-24"
---

# GitOps Repository, Promotion, And Drift Design

## Core Principles

A GitOps system is declarative, versioned and immutable, pulled automatically, and
continuously reconciled. Git is the source for **desired state**, not necessarily every secret,
runtime observation, or generated artifact.

```text
Build repository -> immutable image + provenance
Environment repository -> desired version/config/policy
Reconciler -> compare desired with live -> apply/correct -> report status
```

CI validates and publishes artifacts, then proposes a desired-state change. The in-cluster
controller pulls changes, so CI need not hold broad cluster credentials.

## Repository Patterns

| Pattern | Benefit | Cost |
|---|---|---|
| app and environment together | local ownership/simplicity | app writers can change deployment; promotion history mixed |
| separate environment repo | strong promotion/audit boundary | cross-repo coordination and automation |
| monorepo for fleet | global visibility and atomic platform changes | access, scale, blast radius, noisy reviews |
| repo per team/environment | ownership/isolation | discoverability and fleet-wide governance |

Structure around ownership and promotion, not arbitrary folder fashion. Avoid copy-pasted
environment manifests; use a bounded Helm/Kustomize layering model with rendered-diff tests.

## Promotion

Build once, identify by digest, and promote the same artifact. A typical flow:

1. CI creates/tests/signs image and SBOM.
2. Automation opens a pull request changing the development digest.
3. Reconciler deploys; automated and human evidence verifies it.
4. Promotion copies the verified digest/config delta to the next environment via reviewed PR.
5. Production sync follows policy/approval/window and produces rollout evidence.

Do not rebuild an image per environment. Separate deploy (artifact available in runtime) from
release (user exposure through traffic/feature control).

## Drift And Reconciliation

Drift can come from emergency `kubectl`, controllers/defaulting, mutable webhooks, generated
fields, or another deployment tool. Classify resources/fields as managed, ignored for a known
reason, or externally owned. Unbounded ignore rules hide real drift.

Self-heal improves consistency but can fight emergency remediation or another controller.
Define break-glass procedure: identity, approval, time limit, audit, whether reconciliation is
paused, Git back-port, verification, and closure.

## Secrets

Never store plaintext credentials in Git. Common designs include encrypted declarative secret
objects, external-secret references, or a secret-store CSI/provider. Define who can decrypt,
key rotation/recovery, controller compromise impact, repository history, audit, and behavior
when the secret backend is unavailable.

Encrypted values can still leak metadata and remain recoverable only while keys exist. Secret
rotation must update live clients/pools and support overlap/revocation.

## Policy And Supply Chain

- signed commits/tags where required and protected review paths;
- CODEOWNERS and environment-specific approval;
- schema, rendering, policy, security and compatibility checks on PR;
- immutable registries, signature/provenance verification and admission policy;
- least-privilege controller service accounts and repository credentials;
- no unrestricted template execution from untrusted sources;
- audit from source commit to desired-state commit, sync, image digest, and running pod.

## Stateful Changes

Git revert cannot reverse a destructive migration or external side effect. Use expand-contract,
separately observable migration jobs, backups, idempotency, forward-fix/rollback rules, and
reconciliation. Ensure old and new versions can overlap during rolling/progressive delivery.

## Multi-Cluster And Environment Design

Decide central versus per-cluster controllers, tenant boundaries, cluster registration trust,
network access, repository scalability, failure isolation, and disaster recovery. A central
controller compromise can become fleet-wide; per-cluster controllers increase operations.

## Metrics And Evidence

Track reconciliation/sync latency, out-of-sync duration, failed syncs, drift frequency, desired
versus live revision, deployment lead time, rollback/forward-fix time, controller API rate/
resource use, repo/webhook errors, policy denials, and business/SLO verification after sync.

## Interview Questions

**Is GitOps just deployment from Git?** No. The defining behavior is declarative, versioned
desired state pulled and continuously reconciled with observed state.

**How do you handle an emergency live fix?** Controlled break-glass, bounded reconciliation
pause if necessary, audit, immediate Git back-port or revert, verification, and close the exception.

**Does Git revert equal rollback?** Only for reversible desired-state resources. Data and external
effects need compatibility, restore, forward-fix, or reconciliation.

## Official References

- [OpenGitOps principles](https://opengitops.dev/)
- [CNCF GitOps Working Group](https://github.com/cncf/tag-app-delivery/tree/main/gitops-wg)
- [Kubernetes declarative management](https://kubernetes.io/docs/tasks/manage-kubernetes-objects/declarative-config/)

## Recommended Next

Continue with [Argo CD Architecture, Security, Operations, And Progressive Delivery](./ARGOCD-PRODUCTION-OPERATIONS.md).

