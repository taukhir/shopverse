---
title: Deployment Strategies
sidebar_position: 2
---

# Deployment Strategies

## Recreate

Stop the old version, then start the new version.

```text
v1 stopped -> downtime -> v2 started
```

Simple and suitable for local POCs, but it causes downtime.

## Rolling Deployment

Replace instances gradually:

```text
v1 v1 v1
v2 v1 v1
v2 v2 v1
v2 v2 v2
```

Requirements:

- backward-compatible APIs and events;
- readiness probes;
- graceful shutdown;
- database migrations compatible with both versions.

## Blue-Green

Maintain two complete environments:

```text
Blue: current production
Green: candidate version
```

Traffic switches after validation. Rollback is fast but infrastructure cost is
higher. Database compatibility still matters because both environments often
share or migrate the same data.

## Canary

Send a small percentage of production traffic to the new version:

```text
95% -> v1
 5% -> v2
```

Increase exposure only when error rate, latency, and business metrics remain
healthy. Canary needs traffic control and automated analysis.

## Feature Flags

Deploy code disabled, then enable behavior independently:

```text
deployment != feature release
```

Flags reduce deployment risk but require ownership, expiry, testing of both
paths, and protection against stale flag accumulation.

## Shadow Traffic

Copy production requests to a new version without using its responses. This is
useful for compatibility and performance evaluation, but write operations must
be suppressed or isolated.

## Database Deployment

Use expand-and-contract:

1. add compatible schema;
2. deploy code that supports old and new representations;
3. backfill data;
4. move reads and writes;
5. remove old schema in a later release.

Never combine a destructive schema change with code that assumes the change
has already completed across every instance.

## Kafka Contract Deployment

- add optional fields;
- tolerate unknown fields;
- deploy consumers before producers when a new event is required;
- avoid changing existing field meaning;
- retain replay compatibility for stored events.

## Shopverse Current State

| Capability | Status |
|---|---|
| Docker Compose local deployment | Implemented |
| GitHub Actions image build and GHCR push | Implemented |
| Optional SSH Docker-host deployment | Implemented baseline |
| Jenkins local image build/deploy demonstration | Implemented baseline |
| Kubernetes rolling deployment | Planned |
| Canary or blue-green automation | Planned |

## Release Gate

- unit and integration tests pass;
- image build succeeds;
- schema migration is compatible;
- vulnerability and secret scans pass;
- SAGA smoke test passes;
- dashboards and alerts exist for changed behavior;
- rollback procedure is known;
- release uses immutable image tags rather than only `latest`.

## Related Guides

- [Docker](DOCKER.md)
- [CI/CD Automation](CI-CD-AUTOMATION.md)
- [Jenkins](JENKINS.md)
- [GitHub Actions](GITHUB-ACTIONS.md)
