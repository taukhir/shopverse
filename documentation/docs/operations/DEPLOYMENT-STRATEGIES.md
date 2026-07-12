---
title: Deployment Strategies
sidebar_position: 2
difficulty: Advanced
page_type: Concept
status: Generic
prerequisites: [Containers and CI CD fundamentals]
learning_objectives: [Compare rolling blue-green and canary deployments, Design safe release verification and rollback]
technologies: [Docker, Kubernetes, CI/CD]
last_reviewed: "2026-07-11"
---

# Deployment Strategies

Deployment is the act of placing a built artifact into an environment where it
can run. Release is the act of exposing functionality to users.

```text
build artifact -> deploy to environment -> verify -> release traffic/feature
```

Deployment and release should be separated when possible. This allows code to
be deployed safely while behavior is enabled later through routing, traffic
weight, or feature flags.

![Visual overview of recreate, rolling, blue-green, canary, and feature-flag releases](/img/diagrams/deployment-strategies-overview.png)

## Learning Route

Use this page in three passes:

1. Learn the vocabulary and compare strategies.
2. Follow one strategy from preparation through promotion or rollback.
3. Apply the database, event-contract, observability, and failure checklists.

## The Deployment Control Loop

Every safe deployment is a feedback loop rather than a file-copy operation.

```mermaid
flowchart LR
    Build["Build immutable artifact"] --> Verify["Verify in pre-production"]
    Verify --> Deploy["Deploy candidate"]
    Deploy --> Expose["Expose controlled traffic"]
    Expose --> Observe["Observe technical and business signals"]
    Observe --> Gate{"Release gate passes?"}
    Gate -->|"yes"| Promote["Increase exposure"]
    Promote --> Observe
    Gate -->|"no"| Recover["Stop, rollback, or roll forward"]
    Recover --> Learn["Preserve evidence and improve controls"]
```

The loop needs five independent controls:

| Control | Responsibility |
|---|---|
| Artifact control | Identify exactly what code, dependencies, and configuration are running |
| Instance control | Decide how candidate instances start, become ready, drain, and stop |
| Traffic control | Decide which requests or users reach stable and candidate versions |
| State control | Keep databases, messages, caches, and external side effects compatible |
| Evidence control | Decide whether metrics, logs, traces, and business outcomes permit promotion |

## Artifact, Environment, And Promotion

| Term | Meaning |
|---|---|
| Build artifact | compiled application, JAR, image, chart, or package |
| Deployment artifact | exact deployable unit, usually an immutable image tag |
| Environment | dev, test, staging, production, or local Docker environment |
| Promotion | moving the same verified artifact to the next environment |
| Rollback | returning traffic/runtime to a known-good version |
| Roll-forward | deploying a new fix instead of returning to the old version |

Prefer promoting the same immutable artifact instead of rebuilding different
artifacts per environment.

```text
commit SHA
  -> CI tests
  -> image: shopverse/order-service:2026.06.19-abc123
  -> staging
  -> production
```

## Deployment Prerequisites

Before a deployment:

- tests pass;
- image or package is built from a known commit;
- database migration is reviewed for compatibility;
- configuration and secrets are available;
- health endpoints exist;
- rollback path is known;
- dashboards and logs are available;
- downstream contracts are compatible;
- traffic and error-rate baselines are understood.

## Strategy Comparison

| Strategy | Downtime | Risk | Cost | Rollback speed | Best fit |
|---|---|---|---|---|---|
| Recreate | yes | high | low | medium | local POC, simple internal tools |
| Rolling | low/no | medium | low | medium | most stateless services |
| Blue-green | low/no | low | high | fast | critical services with traffic switch |
| Canary | low/no | low | medium | controlled | gradual production exposure |
| Shadow | no user impact | low for users | high | not direct | compatibility/performance testing |
| Feature flags | no redeploy required | low | medium | very fast | separating deployment from release |

### Choose By Constraint

| Dominant constraint | Usually start with | Why |
|---|---|---|
| Simplest non-production operation | Recreate | Few moving parts; downtime is accepted |
| Stateless service with compatible versions | Rolling | Efficient use of capacity and broad platform support |
| Very fast traffic rollback is essential | Blue-green | Old environment remains available during validation |
| Production behavior must be measured gradually | Canary | Limits exposure while collecting real signals |
| Validate a replacement without affecting responses | Shadow | Candidate receives production-shaped input but does not serve users |
| Release behavior to users/cohorts independently | Feature flags | Activation is separated from deployment |

Strategies can be combined: a rolling deployment can install dormant code,
then a feature flag can release it to a cohort. Blue-green environments can
also receive canary traffic before the final switch.

## Recreate

Stop the old version, then start the new version.

```text
v1 stopped -> downtime -> v2 started
```

Simple and suitable for local POCs, but it causes downtime.

### Recreate Sequence And Risks

1. Stop traffic or announce a maintenance window.
2. Stop the old process.
3. Apply backward-compatible migrations and configuration.
4. Start the candidate and wait for readiness.
5. Run smoke tests and reopen traffic.

The failure window begins when the old version stops. Recovery time includes
starting either version and restoring compatible state. Recreate is dangerous
for systems with a strict availability objective, long startup, irreversible
migrations, or asynchronous work that cannot be drained safely.

## Rolling Deployment

Replace instances gradually:

```text
v1 v1 v1
v2 v1 v1
v2 v2 v1
v2 v2 v2
```

```mermaid
flowchart LR
    A["v1 v1 v1"] --> B["v2 v1 v1"]
    B --> C["v2 v2 v1"]
    C --> D["v2 v2 v2"]
```

Requirements:

- backward-compatible APIs and events;
- readiness probes;
- graceful shutdown;
- database migrations compatible with both versions.

### Rolling Parameters

Platforms expose these ideas with different names:

| Parameter | Meaning | Safety effect |
|---|---|---|
| Maximum unavailable | How much stable capacity may be absent | Lower values protect availability but slow rollout |
| Maximum surge | Extra candidate capacity allowed | More surge speeds rollout but costs capacity |
| Readiness gate | Evidence required before receiving traffic | Prevents traffic reaching an unready instance |
| Progress deadline | Maximum time without rollout progress | Detects a stuck deployment |
| Drain/termination grace | Time to finish in-flight work | Reduces interrupted requests and duplicate work |

Example with four replicas and one-at-a-time replacement:

```text
Step 0: v1 v1 v1 v1
Step 1: v2 v1 v1 v1  -> verify v2 readiness
Step 2: v2 v2 v1 v1  -> compare signals
Step 3: v2 v2 v2 v1
Step 4: v2 v2 v2 v2  -> close rollback window later
```

Stopping a rollout prevents more replacement; it does not automatically undo
already replaced instances or reverse database and external effects.

Rolling deployment is the common default for Kubernetes-style workloads. The
main risk is version overlap: v1 and v2 run at the same time, so APIs, events,
database schema, and configuration must tolerate both versions.

## Blue-Green

Maintain two complete environments:

```text
Blue: current production
Green: candidate version
```

```mermaid
flowchart LR
    Users["Users"] --> Router["Router / Load Balancer"]
    Router --> Blue["Blue environment v1"]
    Green["Green environment v2"] --> Checks["Smoke tests and validation"]
    Checks --> Switch["Switch traffic to Green"]
    Switch --> Router
```

Traffic switches after validation. Rollback is fast but infrastructure cost is
higher. Database compatibility still matters because both environments often
share or migrate the same data.

Rollback is usually a traffic switch back to blue, provided the database and
external side effects remain compatible.

### Blue-Green Runbook

1. Deploy green with production-equivalent configuration but no user traffic.
2. Verify startup, smoke paths, telemetry, security policy, and dependency access.
3. Warm caches or connections without creating duplicate business effects.
4. Shift internal/test traffic, then production traffic at the router.
5. Observe through a defined bake period.
6. Keep blue deployable and data-compatible until the rollback window closes.
7. Retire blue only after state and signals prove rollback is no longer needed.

Do not duplicate schedulers, message consumers, emails, or payment execution in
both environments unless ownership is explicitly partitioned. Traffic switching
controls HTTP requests; it does not automatically control background work.

## Canary

Send a small percentage of production traffic to the new version:

```text
95% -> v1
 5% -> v2
```

```mermaid
flowchart LR
    Traffic["Production traffic"] --> Split["Traffic split"]
    Split -->|"95%"| Stable["v1 stable"]
    Split -->|"5%"| Canary["v2 canary"]
    Canary --> Metrics["Metrics, logs, traces, business KPIs"]
    Metrics --> Decision{"Healthy?"}
    Decision -->|"yes"| Increase["increase traffic"]
    Decision -->|"no"| Rollback["route back to v1"]
```

Increase exposure only when error rate, latency, and business metrics remain
healthy. Canary needs traffic control and automated analysis.

![Animated canary deployment progressing through traffic stages and rollback](/img/diagrams/canary-deployment-flow.gif)

### Example Promotion Plan

| Stage | Candidate exposure | Minimum evidence | Action on failure |
|---|---:|---|---|
| Baseline | 0% | Stable-version baseline and healthy platform | Do not start |
| Internal | selected staff/test traffic | Functional smoke tests and clean logs | Remove candidate traffic |
| Initial canary | 1–5% | Sufficient requests; no severe correctness/security issue | Route to stable |
| Expansion | 10–25% | Candidate comparable to stable for errors and latency | Freeze or rollback |
| Majority | 50% | Healthy capacity and business KPI | Rollback if compatible |
| Complete | 100% | Bake period passes | Retain rollback option temporarily |

Percentage alone can mislead: five percent of low traffic may provide no useful
sample, while five percent of payment traffic may carry unacceptable business
risk. Use minimum event counts, duration, and cohort diversity together.

### Canary Versus A/B Testing

Canary deployment asks whether a new version is safe and healthy. A/B testing
asks which product experience performs better. Canary routing should minimize
risk and support rollback; A/B assignment should remain stable per user and
support statistically valid product analysis. Do not use conversion uplift to
hide a reliability regression.

Canary decisions should consider:

- HTTP 5xx rate;
- p95/p99 latency;
- JVM/resource usage;
- Kafka lag and DLT activity;
- outbox failures;
- checkout success rate;
- payment failure rate;
- error logs and traces.

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

## Database Deployment

Use expand-and-contract:

1. add compatible schema;
2. deploy code that supports old and new representations;
3. backfill data;
4. move reads and writes;
5. remove old schema in a later release.

```mermaid
flowchart LR
    A["1. Expand schema"] --> B["2. Deploy compatible code"]
    B --> C["3. Backfill data"]
    C --> D["4. Move reads/writes"]
    D --> E["5. Contract old schema later"]
```

Never combine a destructive schema change with code that assumes the change
has already completed across every instance.

| Unsafe | Safer |
|---|---|
| rename column and deploy code at the same time | add new column, write both, migrate reads, remove old later |
| drop column used by old pods | keep column until all old pods are gone |
| make nullable column required immediately | backfill first, then add constraint |
| change enum values without compatibility | add new value and keep consumers tolerant |

Database rollback is difficult because data has moved forward. Prefer
backward-compatible migrations and compensating migrations.

## Kafka Contract Deployment

- add optional fields;
- tolerate unknown fields;
- deploy consumers before producers when a new event is required;
- avoid changing existing field meaning;
- retain replay compatibility for stored events.

Kafka adds a deployment concern that HTTP-only systems may not have: old events
can be replayed after new code is deployed.

Rules:

- consumers should ignore unknown fields;
- producers should avoid removing fields until consumers no longer require
  them;
- add schema versioning for meaningful changes;
- deploy tolerant consumers before stricter producers;
- keep old event meanings stable;
- replay DLT/outbox records against compatible code.

## Health Checks And Readiness Gates

Deployment automation should wait for readiness before sending traffic.

| Probe | Meaning |
|---|---|
| Liveness | process is alive and should not be restarted |
| Readiness | instance can receive traffic |
| Startup | slow-starting app is still booting |

Readiness should fail when the service cannot handle requests safely. Examples:

- database unavailable;
- required migration failed;
- Config Server dependency missing during bootstrap;
- Kafka listener required for the service is not ready, if traffic depends on
  it.

Do not make liveness too strict. If liveness fails for a temporary database
issue, the orchestrator may restart every instance and worsen the outage.

## Smoke Tests

After deployment, run a small set of high-value tests:

- health endpoint;
- login or token validation;
- one read API;
- one write API in a safe test scope;
- checkout/SAGA smoke path in non-production or controlled data;
- metrics endpoint;
- logs and traces visible.

Smoke tests should be fast and deterministic. They are not a replacement for
full integration tests.

## Automated Rollback Signals

Use multiple signals, not one noisy metric:

- deployment health;
- readiness failures;
- HTTP 5xx rate;
- p95/p99 latency;
- business conversion/success rate;
- Kafka lag and DLT events;
- outbox failure count;
- error log rate;
- database connection pool exhaustion.

Example rule:

```text
if canary 5xx rate > stable 5xx rate by threshold
and request volume is sufficient
and condition lasts for N minutes
then stop rollout or route traffic back
```

### Release Gate Design

A useful gate compares candidate with stable and checks absolute safety limits:

```text
promote only if
  candidate request count >= minimum sample
  AND candidate 5xx rate <= absolute limit
  AND candidate 5xx rate - stable 5xx rate <= allowed regression
  AND candidate p95 latency <= allowed regression
  AND saturation remains below safety limit
  AND checkout/payment success remains healthy
```

Use a longer window for low-volume business outcomes and a shorter emergency
stop for severe security, corruption, or correctness signals. Treat missing
telemetry as a failed gate, not success.

## Failure Scenarios To Rehearse

| Failure | Expected control |
|---|---|
| Candidate never becomes ready | Progress deadline stops rollout; logs and events explain why |
| Old instance receives traffic while draining | Readiness removal precedes shutdown; graceful termination completes requests |
| Candidate overloads the database | Canary/concurrency limit contains load; pool and database alarms stop promotion |
| New producer breaks old consumer | Consumer-first compatible contract deployment and schema checks |
| Rollback cannot read migrated data | Expand-and-contract or roll-forward plan |
| Queue workers run in both blue and green | Explicit consumer ownership, partitioning, or paused candidate consumers |
| Metrics look healthy but checkout fails | Business KPI and synthetic transaction gate |
| Flag service is unavailable | Defined cached/default behavior and operational alarm |
| Retry storm begins during rollout | Bounded retry budgets, jitter, circuit breaker, and load shedding |

Run these as game-day exercises. A rollback document that has never been
executed is an assumption, not a recovery capability.

## Microservices Deployment Rules

For microservices:

1. Keep APIs backward compatible during rolling overlap.
2. Use idempotency for retryable commands.
3. Keep consumers tolerant of old and new event shapes.
4. Use expand-and-contract for database changes.
5. Avoid cross-service release locks where possible.
6. Deploy consumers before producers for new required event fields.
7. Keep SAGA compensation compatible with both versions.
8. Use immutable image tags.
9. Keep readiness accurate.
10. Preserve observability before increasing traffic.

## Shopverse Current State

| Capability | Status |
|---|---|
| Docker Compose local deployment | Implemented |
| GitHub Actions image build and GHCR push | Implemented |
| Optional SSH Docker-host deployment | Implemented baseline |
| Jenkins local image build/deploy demonstration | Implemented baseline |
| Kubernetes rolling deployment | Planned |
| Canary or blue-green automation | Planned |

Shopverse currently demonstrates local and CI/CD deployment fundamentals:

```text
source code
  -> CI test/build
  -> Docker image
  -> Docker Compose or Jenkins local deploy
  -> observability checks
```

Planned production-style improvements:

- Kubernetes manifests or Helm chart;
- rolling deployment with readiness/liveness probes;
- immutable versioned image tags;
- blue-green or canary route control;
- Alertmanager-driven release gates;
- environment-specific secret management;
- migration preflight checks;
- rollback runbook per service.

## Release Gate

- unit and integration tests pass;
- image build succeeds;
- schema migration is compatible;
- vulnerability and secret scans pass;
- SAGA smoke test passes;
- dashboards and alerts exist for changed behavior;
- rollback procedure is known;
- release uses immutable image tags rather than only `latest`.

## Deployment Checklist

Before deployment:

- confirm target environment;
- confirm artifact tag and commit SHA;
- review config differences;
- review database migrations;
- verify event/API compatibility;
- check dependency availability;
- confirm rollback or roll-forward plan.

During deployment:

- watch readiness;
- watch logs;
- watch p95/p99 latency;
- watch error rate;
- watch Kafka lag, outbox failures, and DLT events;
- verify expected number of instances.

After deployment:

- run smoke tests;
- verify dashboards;
- verify no unexpected alerts;
- verify business metrics;
- record deployed version and timestamp.

## Interview Questions

### Deployment vs release?

Deployment puts code into an environment. Release exposes behavior to users.
Feature flags and traffic routing can separate the two.

### Why is rolling deployment risky with databases?

Old and new versions may run simultaneously. The schema must support both
versions until the rollout and rollback window are closed.

### Why use blue-green?

It allows full validation of the new environment and fast traffic switching.
The tradeoff is higher infrastructure cost and database compatibility
complexity.

### What is a canary deployment?

A canary gradually exposes a new version to a small percentage of traffic and
increases exposure only if metrics remain healthy.

### Why are feature flags useful?

They allow behavior rollback without redeploying. They also separate code
deployment from feature release.

### Why is rollback sometimes unsafe?

Data migrations, emitted events, external side effects, and changed contracts
may make the old version incompatible with current state.

## Related Guides

- [Docker](DOCKER.md)
- [CI/CD Automation](CI-CD-AUTOMATION.md)
- [Jenkins](JENKINS.md)
- [GitHub Actions](GITHUB-ACTIONS.md)

## Official References

- [Kubernetes documentation](https://kubernetes.io/docs/)
- [Docker documentation](https://docs.docker.com/)
- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
