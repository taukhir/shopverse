---
title: Service Mesh Traffic, Identity, Security, And Observability
description: Design workload identity, certificate lifecycle, mTLS, authorization, ingress/egress, routing, retries, outlier detection, flow control, and telemetry.
difficulty: Advanced
page_type: Deep Dive
status: Generic
prerequisites: [Service Mesh Architecture And Selection]
learning_objectives: [Design mesh identity and policy, Compose traffic controls safely, Build useful low-cardinality observability]
technologies: [mTLS, SPIFFE, Istio, Linkerd, Envoy]
last_reviewed: "2026-07-24"
---

# Service Mesh Traffic, Identity, Security, And Observability

## Workload Identity

Mesh identity should bind a running workload to a verifiable name derived from platform service
account/trust domain, not merely source IP. SPIFFE-style identities use URIs and workload-issued
short-lived credentials. Define trust-domain ownership, CA/root/intermediate protection, federation,
issuance attestation, rotation, revocation/expiry, clock and disaster recovery.

A compromised control-plane CA or Kubernetes identity path can issue powerful credentials; secure
it similarly to a cluster control plane.

## mTLS Modes And Migration

During migration, permissive mode may accept plaintext and mTLS, reducing outage risk but weakening
enforcement. Move with traffic inventory, workload enrollment, policy dry run/telemetry, strict mode by
namespace/service and rollback. Prove no unintended plaintext, including probes, jobs, gateways, VMs and
excluded ports.

Certificate rotation must handle long-lived HTTP/2/gRPC/TCP connections. Observe issued/expiring certs,
handshake failures and reconnect adoption.

## Authorization

Default-deny then explicitly allow caller identity, destination, method/path/port and namespace/tenant
where the protocol and data plane can enforce them. L4 policy sees connection attributes; L7 policy
requires protocol parsing. Encrypted application traffic not terminated by the mesh may be opaque.

Mesh policy is service-to-service admission. Application enforces user/resource/tenant/business rules.
Avoid trusting spoofable headers; gateways/proxies must sanitize and bind identity metadata.

Test allow, deny, unknown identity, wrong namespace, direct pod IP, egress and control-plane failure.

## Ingress And Egress

Ingress gateway terminates/originates connections and applies edge routing/security. Egress gateways or
ServiceEntry-style declarations can inventory/control external destinations but are not automatically a
data-loss prevention system. Prevent bypass through network policy/routing, authenticate external TLS,
apply DNS/IP changes safely and protect gateway capacity.

## Routing And Load Balancing

Routing can use host, path, header, weight, subset/version and locality. Endpoint discovery, readiness,
outlier ejection and locality/failover determine eligible backends. Header-based routing must not allow
untrusted clients to select privileged/debug versions.

Canary traffic splitting proves only network exposure; pair with compatible state/schema/event and SLO/
business analysis. Session/sticky routing reduces balancing and can hide version-state coupling.

## Timeout, Retry, Circuit, And Outlier Controls

Assign one owner per call path. Gateway, mesh, client library and SDK retries can multiply. Propagate the
remaining deadline, retry only safe/idempotent operations with jitter and a budget, and include attempts in
capacity. A proxy cannot infer whether a timed-out payment committed.

Outlier ejection protects from anomalous endpoints but can eject too many during systemic overload and
shift traffic to fewer instances. Configure minimum volume, ejection limits, panic/fail-open behavior and
readiness root cause from measured failure patterns.

Connection and pending-request limits act as bulkheads. Queueing in proxy hides overload; reject early and
align with application/downstream capacity.

## Observability

Mesh metrics provide request/connection rate, latency, response codes, bytes, TLS identity and destination
views. They may count retries/attempts differently from logical application operations. Application metrics
own business result, queue/pool wait and domain correctness.

Control cardinality for route, source/destination, response flags and identity. Sampling and trace context
must work across sidecar/waypoint/gateway modes. Access logs can expose headers/tokens/PII and add significant
cost; use bounded fields/sampling/retention.

Useful diagnostic dimensions:

- desired versus proxy-accepted config version;
- endpoint set and locality;
- certificate identity/expiry and TLS mode;
- response flags/reset reason and upstream connect time;
- pending requests, connection pools and circuit/ejection state;
- source/destination/waypoint proxy resource pressure;
- application and downstream trace spans.

## Failure Scenarios

**Policy deploy blocks all traffic:** stop rollout/apply scoped rollback, inspect exact target selectors/
identity and proxy config, restore safe known policy, test deny/allow in staging/canary, add dry-run evidence.

**Retries triple database load:** identify retry layers/attempt metrics, disable highest amplifier, shed traffic,
restore DB, centralize retry ownership and prove idempotency/deadline.

**mTLS intermittently fails:** inspect identity issuance/expiry/clock/trust bundle, connection age, mixed modes,
control-plane reachability and proxy logs; restore overlapping trust and rotate safely.

## Official References

- [Istio security](https://istio.io/latest/docs/concepts/security/)
- [Istio traffic management](https://istio.io/latest/docs/concepts/traffic-management/)
- [SPIFFE concepts](https://spiffe.io/docs/latest/spiffe-about/overview/)
- [Linkerd authorization policy](https://linkerd.io/2/features/server-policy/)

## Recommended Next

Continue with [Installation, Capacity, Multicluster, Upgrades, And Incident Operations](./SERVICE-MESH-PRODUCTION-OPERATIONS.md).

