---
title: Spring Cloud Production Scenarios And Architect Interview Bank
description: Lead-level scenarios for Config, discovery, LoadBalancer, HTTP clients, Gateway, resilience, Bus, Kubernetes, identity, observability, capacity, and regional failure.
difficulty: Advanced
page_type: Revision Guide
status: Generic
prerequisites: [Spring Cloud architect path]
learning_objectives: [Diagnose distributed failures, Structure architect answers, Explain trade-offs, Choose evidence, Design preventive controls]
technologies: [Spring Cloud, Config, Gateway, LoadBalancer, OpenFeign, Kubernetes]
last_reviewed: "2026-07-28"
---

# Spring Cloud Production Scenarios And Architect Interview Bank

## Scenario Answer Pattern

```text
impact/scope -> request path -> failure hypotheses -> discriminating evidence
-> safe mitigation -> root correction -> prevention and trade-off
```

## Configuration Scenarios

### Config Server is unavailable during startup

Decide from the configuration's criticality. Security endpoints, database credentials or
tenant policy may require fail-fast; optional presentation settings may use validated local
defaults. Inspect client import, DNS/TLS, backend health, timeouts and retry budget. Avoid an
infinite startup retry that keeps Pods neither ready nor decisively failed.

### A bad refresh breaks only some instances

Identify which instances received the event, property origin/version and which beans were
reconstructed. Stop propagation, roll back the versioned configuration and restart/roll out
immutably if live refresh cannot be proven atomic. Add validation and staged distribution.

## Discovery And Client Scenarios

### Discovery returns terminated instances

Measure registry TTL/heartbeat and client cache age. Confirm whether server-side DNS or
platform endpoints are more authoritative. Timeouts, connection eviction and health-aware
selection limit impact, but the root fix is registration/deregistration consistency.

### One instance receives most traffic

Inspect selection policy, cache, connection reuse, key/session affinity, weights and per-
instance latency. Request-count balance is not always expected when connections multiplex
or requests have unequal cost.

### Retries triple downstream load

Map retries at gateway, client, service mesh and SDK. Compute maximum attempts and deadline.
Assign one retry owner, restrict to transient/idempotent operations, add jitter/budget and
observe retry rate separately from initial traffic.

## Gateway Scenarios

### Gateway CPU is low but latency is high

Inspect event-loop blocking, downstream/socket waits, connection-pool acquisition, DNS/TLS,
rate-limit store and response backpressure. Low CPU often means waiting, not spare capacity.

### Gateway authenticates but downstream returns 401

Trace token relay/exchange, audience, issuer, expiry, clock and security filter configuration.
Do not solve by forwarding every inbound header or disabling downstream authentication.

### A route update sends traffic to the wrong service

Inspect route precedence, predicates, path rewrite and effective configuration version.
Restore the last immutable route set, add shadow/canary validation and test ambiguous route
overlap before promotion.

## Resilience Scenarios

### Circuit breaker remains open after recovery

Check sliding-window evidence, slow/failure thresholds, minimum calls, open duration,
half-open permits and health traffic. A fallback that never probes the real dependency can
delay recovery.

### Bulkhead protects downstream but callers time out

Rejection is working, but the caller contract is wrong. Prefer immediate bounded rejection
with a meaningful response or queue only within a deadline and memory bound. Scale after
confirming downstream capacity, not merely caller demand.

## Kubernetes And Regional Scenarios

### Eureka and Kubernetes DNS disagree

Choose one authoritative discovery model per call path. Dual registration can expose stale
or duplicate endpoints and complicate health semantics. Use Eureka only when its features
justify it over platform-native discovery.

### One region fails

Define DNS/global traffic failover, configuration and secret availability, state/data RPO,
session/token behavior, event replication, capacity headroom and failback. Spring Cloud
components do not by themselves solve cross-region data consistency.

## Observability Questions

For each hop record bounded-cardinality route/service/outcome metrics, trace propagation and
structured correlation. Distinguish:

- original requests versus retries;
- gateway time versus downstream time;
- connection acquisition versus remote response;
- circuit rejection versus remote failure;
- no discovered instance versus connection failure;
- configuration fetch/refresh version and result.

## Top Architect Questions

**When should Spring Cloud Config be avoided?** When platform-native immutable configuration
and rollout already satisfy requirements, or the extra highly available control plane and
refresh semantics are not justified.

**When should Eureka be avoided?** In Kubernetes/cloud environments where native discovery
provides the required model and adding a second registry creates duplicate failure modes.

**Gateway or service mesh?** Gateway focuses north-south API policy/routing; a mesh focuses
east-west workload communication. They may coexist, but duplicate retries, mTLS, telemetry
and routing ownership must be prevented.

**What makes a fallback unsafe?** It hides correctness failure, returns stale/unauthorized
data, triggers another overloaded dependency or makes callers believe a side effect
succeeded.

**How do you prove resilience?** Inject representative failures and show bounded latency,
load, memory and recovery while correctness and SLO remain within the declared contract.

## Revision Route

Return to [Spring Cloud Architect Learning Path](../SPRING-CLOUD-ARCHITECT-PATH.md), then
explain one request from gateway through discovery/load balancing, identity, resilience and
the downstream service with all timeout and evidence boundaries.

