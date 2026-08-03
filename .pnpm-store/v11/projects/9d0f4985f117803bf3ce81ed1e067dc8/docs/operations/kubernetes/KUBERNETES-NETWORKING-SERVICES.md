---
title: Kubernetes Networking, Services, DNS, Ingress, And Gateway API
description: Trace Pod networking, CNI, IPAM, Services, EndpointSlices, kube-proxy or eBPF data planes, CoreDNS, NetworkPolicy, ingress, Gateway API, and packet-level failures.
difficulty: Advanced
page_type: Concept
status: maintained
prerequisites: [DNS TCP TLS fundamentals, Kubernetes workloads]
learning_objectives: [Trace a packet end to end, Explain Service and DNS behavior, Design network isolation and external routing, Diagnose network failures]
technologies: [Kubernetes, CNI, CoreDNS, Gateway API, NetworkPolicy]
last_reviewed: "2026-07-24"
scope: generic
owner: docs-operations
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Kubernetes Networking, Services, DNS, Ingress, And Gateway API

## Network Model

Kubernetes expects each Pod to have an address and Pod-to-Pod communication without application-
visible NAT in the basic model. Implementations differ: routes, overlays, cloud networking or eBPF
may carry traffic. Keep node, Pod and Service address ranges non-overlapping and plan IP capacity,
MTU, dual stack, routing and failure domains before cluster creation.

```text
client -> cloud LB/gateway -> node/data plane -> Service VIP
       -> EndpointSlice-selected Pod IP -> container port
```

The CNI plugin configures Pod interfaces, IPAM and routes when the runtime creates a sandbox.
Advanced CNI implementations may also enforce NetworkPolicy, provide encryption and replace
kube-proxy behavior. CNI failure commonly leaves Pods in sandbox or `ContainerCreating` errors.

## Services And EndpointSlices

A Service selects Pods and provides a stable virtual endpoint. Controllers build EndpointSlices
from eligible endpoints. The data plane translates or routes the Service address to an endpoint.
Readiness normally controls endpoint eligibility; selector mistakes can produce zero or unintended
endpoints.

| Type | Use | Main risk |
|---|---|---|
| ClusterIP | cluster-internal virtual address | empty endpoints or policy/routing failure |
| Headless | direct endpoint discovery | client must load-balance and refresh DNS |
| NodePort | port exposed on nodes | broad exposure and node/firewall complexity |
| LoadBalancer | external provider integration | quota, health checks, cost and source-IP semantics |
| ExternalName | DNS alias | DNS/TLS name and port mismatch |

Service implementations may use nftables/iptables/IPVS or another data plane. Do not memorize one
packet path as universal; identify the cluster's actual implementation. Long-lived connections may
remain on one endpoint even when many Pods exist.

## DNS

CoreDNS watches Services/EndpointSlices and serves cluster zones. A normal lookup traverses the
Pod resolver configuration, optional node-local cache, CoreDNS and upstream resolvers. Search
domains plus `ndots` can create several queries for an unqualified name.

```bash
kubectl exec <pod> -- cat /etc/resolv.conf
kubectl exec <pod> -- getent hosts orders.default.svc.cluster.local
kubectl get service,endpointslice -n default
kubectl -n kube-system get deploy,pod,svc -l k8s-app=kube-dns
```

Separate NXDOMAIN, timeout, SERVFAIL and correct resolution to stale/wrong endpoints. Check CoreDNS
capacity, upstream latency, cache behavior, packet loss, policy and query amplification.

## Ingress And Gateway API

An Ingress or Gateway implementation programs a data plane; the API object alone does not route
traffic. Gateway API separates infrastructure ownership (`GatewayClass`, `Gateway`) from application
routes and supports explicit attachment/reference policy. Confirm listener, hostname, path, TLS,
backend reference, allowed route and status conditions.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata: {name: orders}
spec:
  parentRefs: [{name: public-gateway}]
  hostnames: ["api.example.com"]
  rules:
    - matches:
        - path: {type: PathPrefix, value: /orders}
      backendRefs:
        - {name: orders, port: 8080}
```

Use cert-manager or another governed certificate process where appropriate. Establish ownership for
TLS termination, redirect, headers, client identity, rate limits and source IP propagation.

## NetworkPolicy

NetworkPolicy is additive: selected Pods allow the union of matching ingress/egress rules, assuming
the CNI enforces the API. Start from tested default-deny policies, then allow DNS and precise business
flows. Policy controls network reachability, not application authorization or payload identity.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: {name: orders-ingress, namespace: shopverse}
spec:
  podSelector: {matchLabels: {app: orders}}
  policyTypes: [Ingress]
  ingress:
    - from:
        - namespaceSelector: {matchLabels: {kubernetes.io/metadata.name: edge}}
          podSelector: {matchLabels: {app: gateway}}
      ports: [{protocol: TCP, port: 8080}]
```

## Packet Diagnosis

Work from both ends and one hop at a time:

1. resolve the name and record addresses/TTL;
2. inspect Service, EndpointSlices, route status and Pod readiness;
3. connect directly to Pod IP, then Service VIP, then gateway where safe;
4. inspect routes, interfaces, sockets, conntrack/firewall/eBPF state using supported tools;
5. capture packets at source Pod/node, destination node/Pod and gateway when necessary;
6. verify MTU, return path, NAT and TLS SNI/identity;
7. correlate data-plane evidence with controller status and recent changes.

Ephemeral debug containers help when application images omit tools. Do not modify production images
or disable policy as the first diagnostic step.

## Common Incidents

| Symptom | High-value checks |
|---|---|
| Service resolves but refuses | endpoint port, listener, readiness and targetPort |
| intermittent timeouts | failing endpoint/node, conntrack, packet loss, MTU, overload |
| only cross-node traffic fails | CNI routes/tunnel/firewall/MTU |
| external 502/503 | gateway route/status, endpoints, health and upstream timeout |
| DNS latency spike | query rate, search expansion, CoreDNS CPU/queue/upstream |
| policy works in one cluster only | CNI enforcement and version/policy capability |

## Interview Questions

<ExpandableAnswer title="Why does Kubernetes need Services if Pods are directly reachable?">

Pods are replaceable and their IP addresses change. A Service provides stable discovery and a
virtual address while EndpointSlices track the current ready backends. The Service does not keep
Pods alive; a workload controller does that.

</ExpandableAnswer>

<ExpandableAnswer title="How do ClusterIP, NodePort and LoadBalancer Services differ?">

ClusterIP exposes a Service inside the cluster. NodePort also opens a port on nodes. LoadBalancer
asks an integrated provider or implementation for an external load balancer, usually building on
the other Service mechanisms. Availability and source-IP behavior depend on the implementation.

</ExpandableAnswer>

<ExpandableAnswer title="A Service has no endpoints. What do you check?">

Compare its selector with Pod labels, confirm the Pods exist in the same namespace, inspect
readiness, and verify `targetPort` against the container listener. Then inspect EndpointSlices and
controller events rather than changing DNS or the CNI first.

</ExpandableAnswer>

<ExpandableAnswer title="How do Ingress and Gateway API differ?">

Ingress is a mature, relatively compact HTTP(S) routing API implemented by an ingress controller.
Gateway API has explicit infrastructure, routing and application roles and supports richer route
types and attachment policy. Both require a compatible controller; creating an object alone does
not create a data plane.

</ExpandableAnswer>

<ExpandableAnswer title="Why might a NetworkPolicy object have no effect?">

NetworkPolicy needs a network plugin that enforces the policy API. Also verify selectors,
namespaces, ingress versus egress direction, ports and DNS allowances. Policy behavior should be
tested from representative source and destination Pods.

</ExpandableAnswer>

<ExpandableAnswer title="What is a useful DNS troubleshooting sequence?">

Check the name and namespace search rules, query from the affected Pod, inspect Service and
EndpointSlices, test the full and short names, then inspect CoreDNS health, configuration, logs and
upstream resolution. Separate name-resolution failure from a successful lookup followed by a
connection failure.

</ExpandableAnswer>

## Official References

- [Kubernetes cluster networking](https://kubernetes.io/docs/concepts/cluster-administration/networking/)
- [Services and networking](https://kubernetes.io/docs/concepts/services-networking/)
- [DNS for Services and Pods](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/)
- [Gateway API](https://gateway-api.sigs.k8s.io/)

## Recommended Next

Continue with [Persistent Storage, Stateful Workloads, And CSI](./KUBERNETES-STORAGE-STATEFUL.md).
