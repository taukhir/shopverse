---
title: "Traffic Control And Rollback"
description: "Traffic Control And Rollback with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "Traffic Control And Rollback"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Traffic Control And Rollback

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

## Feature Flags

Deploy code disabled, then enable behavior independently:

```text
deployment != feature release
```

Flags reduce deployment risk but require ownership, expiry, testing of both
paths, and protection against stale flag accumulation.

Feature flags are useful when rollback should be immediate:

```text
bad behavior detected -> disable flag -> users return to old path
```

They do not replace testing. Both enabled and disabled paths must be tested.
Every flag should have an owner and expiry plan.

Feature flags come in different types:

| Flag type | Purpose | Expected lifetime |
|---|---|---|
| Release | Gradually expose new behavior | Short |
| Experiment | Assign A/B cohorts | Until analysis completes |
| Operational | Disable expensive or risky behavior during incidents | Longer, regularly tested |
| Permission | Entitlement or plan access | Long-lived business rule |

Do not use flags to conceal incompatible database or event changes. Evaluate
flags server-side for sensitive authorization decisions, define behavior when
the flag service is unavailable, and remove stale branches after rollout.

## Shadow Traffic

Copy production requests to a new version without using its responses. This is
useful for compatibility and performance evaluation, but write operations must
be suppressed or isolated.

Use shadow traffic for:

- validating a new API implementation;
- comparing latency under real traffic shape;
- checking serialization/deserialization compatibility;
- testing read-only code paths.

Do not let shadow traffic create orders, payments, emails, inventory changes,
or external side effects.

Scrub sensitive data, cap shadow volume, label shadow telemetry, and prevent the
candidate from competing with production for scarce downstream capacity. Compare
semantic response differences as well as status code and latency.

## Platform Mechanisms

The strategy is a system design; a platform mechanism only implements part of it.

| Platform mechanism | What it controls |
|---|---|
| Kubernetes Deployment | Replica replacement, readiness, surge/unavailable capacity, rollout history |
| Kubernetes Service | Stable routing to ready pods matching labels |
| Ingress/service mesh | Weighted, header, cookie, or cohort traffic routing |
| Load balancer target groups | Blue-green target registration and traffic weights |
| CI/CD pipeline | Approval, promotion, pause, analysis, and recovery workflow |
| Feature-flag service | Runtime behavior activation and cohort assignment |
| Migration tool | Ordered, versioned schema changes; not application traffic |

### Illustrative Kubernetes Rolling Configuration

```yaml
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  template:
    spec:
      terminationGracePeriodSeconds: 30
      containers:
        - name: application
          image: registry.example/application:git-sha
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
```

This configuration protects serving capacity but does not create canary
analysis, guarantee application correctness, or make schema changes reversible.

## Rollback Strategies

Rollback means returning the system to a known-good runtime state. Rollback can
target different layers.

| Layer | Rollback action |
|---|---|
| Application | redeploy previous image tag |
| Traffic | route traffic back to old version |
| Feature | disable feature flag |
| Configuration | restore previous config version |
| Database | apply safe compensating migration, if possible |
| Kafka contract | restore compatible producer/consumer behavior |

Application rollback is easy only when state and contracts remain compatible.

## Rollback vs Roll-Forward

Rollback is better when:

- the previous version is compatible with current data;
- no irreversible migration was applied;
- the issue is broad and immediate;
- the old version is known healthy.

Roll-forward is better when:

- database state is no longer compatible with the old version;
- external side effects already occurred;
- the fix is small and safer than reverting;
- rollback would lose data or break consumers.

In distributed systems, roll-forward is often safer than pretending every
effect can be undone.

## Recommended Next

Return to [Deployment Strategies](./DEPLOYMENT-STRATEGIES.md) to select the next focused guide.


## Official References

- [Docusaurus documentation](https://docusaurus.io/docs)
- [Git documentation](https://git-scm.com/docs)
