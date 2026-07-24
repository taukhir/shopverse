---
title: Service Mesh Architecture And Selection
description: Compare library, gateway, sidecar, ambient and Linkerd-style meshes; trace control/data planes, traffic capture, xDS, discovery, and decision criteria.
difficulty: Advanced
page_type: Decision Guide
status: Generic
prerequisites: [Service Mesh Architect Path]
learning_objectives: [Explain mesh internals, Compare data-plane models, Make an evidence-based mesh decision]
technologies: [Istio, Envoy, Linkerd]
last_reviewed: "2026-07-24"
---

# Service Mesh Architecture And Selection

## What A Mesh Owns

Typical mesh responsibilities include service endpoint discovery, workload identity/mTLS,
traffic interception and forwarding, load balancing, routing, retries/timeouts, authorization
policy and network telemetry. The application still owns business authorization, idempotency,
data consistency, domain retries, payload semantics and recovery.

## Control And Data Plane

The control plane watches platform/service/policy state and distributes proxy configuration,
often through xDS-style APIs. The data plane handles actual connections/requests. Existing
proxies may continue with last accepted config during a control-plane outage, but new endpoints,
certificates or policy may become stale.

```text
Kubernetes APIs + mesh resources + CA/identity
 -> control plane computes endpoint/routes/listeners/clusters/secrets
 -> proxies/tunnels receive versioned configuration
 -> data plane intercepts and forwards service traffic
```

Inspect config accepted by the exact proxy, not only the declarative source.

## Sidecar Model

A proxy runs alongside each workload pod. Traffic capture commonly uses CNI/iptables or platform
redirection. Benefits include per-workload L7 processing and isolation. Costs include per-pod CPU/
memory, injection/lifecycle/startup ordering, connection duplication and broad upgrade surface.

Native sidecar container support can improve lifecycle ordering where product/platform supports it,
but verify jobs, init traffic, probes, termination and excluded ports.

## Istio Ambient Model

Ambient mode separates a per-node L4 secure overlay (`ztunnel`) from optional L7 waypoint proxies.
The base layer provides encrypted authenticated transport, L4 authorization and telemetry; workloads
that need L7 routing/policy use waypoint proxies. Sidecar and ambient workloads can coexist, but
feature, policy and telemetry semantics must be validated during migration.

This reduces per-pod proxies but increases node/waypoint shared failure and capacity considerations.
Do not call it “no proxy”; the proxies move to shared infrastructure.

## Linkerd Model

Linkerd emphasizes a purpose-built lightweight per-pod proxy, control-plane components for identity/
destination/policy, automatic mTLS, telemetry, load balancing and selected reliability/routing. Its
feature surface and operational model differ from Istio. Compare required L7 policy, Gateway API,
multicluster, ecosystem, performance, commercial support and team skill using current official docs.

## Alternatives

| Option | Strength | Limitation |
|---|---|---|
| application libraries | code-level semantics and debugging | language/version inconsistency and repeated integration |
| gateway only | centralized north-south edge policy | does not cover east-west service calls |
| NetworkPolicy + direct TLS | smaller platform, L3/L4 isolation | less uniform L7 identity/routing/telemetry |
| sidecar mesh | rich per-workload L7 control | resource/lifecycle/upgrade overhead |
| ambient/shared mesh | incremental L4 and shared L7 | shared capacity, feature/migration differences |

## Decision Criteria

- number of services, languages, clusters and teams;
- threat model, workload identity, mTLS and authorization granularity;
- L4 versus L7 policy/routing needs;
- retry/timeout ownership and protocol mix (HTTP, gRPC, TCP, Kafka/database);
- latency, CPU/memory and connection overhead budget;
- control/data-plane availability and blast radius;
- Kubernetes/CNI/kernel/cloud compatibility;
- multicluster topology and trust federation;
- platform staffing, on-call, upgrade cadence, support and exit strategy.

## Proof Of Value

Run a bounded pilot on representative services. Measure p50/p99 latency, CPU/memory, connection
count, throughput, certificate/config propagation, deployment/startup/drain, failure behavior,
telemetry cardinality, operator diagnosis time and policy correctness. Compare against the non-mesh
baseline and include node/control-plane failure.

## Common Misconceptions

- mTLS does not authorize a business action;
- retries in a proxy are not automatically safe;
- mesh telemetry does not replace application/domain metrics;
- traffic splitting does not make database/event contracts compatible;
- a mesh does not solve service ownership or a saturated datastore;
- encryption inside mesh does not remove ingress/egress/data-at-rest requirements.

## Interview Questions

**Why use a mesh instead of a library?** Uniform cross-language transport identity/policy/telemetry
with centralized operations, when the organization can afford the platform complexity and needs it.

**Sidecar versus ambient?** Sidecar puts L7 proxy per workload; ambient supplies shared per-node L4
and optional waypoint L7. Compare feature, isolation, cost, lifecycle and blast radius.

## Official References

- [Istio architecture](https://istio.io/latest/docs/ops/deployment/architecture/)
- [Istio ambient overview](https://istio.io/latest/docs/ambient/overview/)
- [Linkerd architecture](https://linkerd.io/2/reference/architecture/)
- [Envoy xDS protocol](https://www.envoyproxy.io/docs/envoy/latest/api-docs/xds_protocol)

## Recommended Next

Continue with [Identity, mTLS, Authorization, Routing, Resilience, And Observability](./SERVICE-MESH-TRAFFIC-SECURITY.md).

