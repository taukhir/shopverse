---
title: Kubernetes Troubleshooting, Incident Labs, Interviews, And Revision
description: Evidence-led Kubernetes diagnosis, failure matrices, practical labs, architect interview scenarios, revision questions, and completion checklist.
difficulty: Advanced
page_type: Practice
status: Generic
prerequisites: [Kubernetes cluster operations]
learning_objectives: [Diagnose incidents systematically, Complete destructive-safe labs, Answer architect scenarios, Revise the complete platform]
technologies: [Kubernetes, kubectl, Linux, Prometheus]
last_reviewed: "2026-07-24"
---

# Kubernetes Troubleshooting, Incident Labs, Interviews, And Revision

## Diagnostic Method

Use `user symptom -> scope -> recent change -> object status/conditions -> events -> logs/metrics
-> control-plane/node/data-plane evidence -> containment -> root cause -> prevention`. Start with the
least invasive read. Restarting or deleting first destroys evidence and can multiply failures.

```bash
kubectl get pod -A -o wide
kubectl describe pod <pod> -n <ns>
kubectl logs <pod> -n <ns> --all-containers --previous
kubectl get events -A --sort-by=.metadata.creationTimestamp
kubectl get deploy,rs,pod,svc,endpointslice -n <ns>
kubectl top pod,node
kubectl rollout status deployment/<name> -n <ns>
kubectl diff -f manifests/
```

Use `kubectl debug`/ephemeral containers and node debugging only under governed access. Capture
timestamps, namespace, Pod UID, node, image digest, resourceVersion and rollout revision.

## Failure Matrix

| Symptom | Trace |
|---|---|
| API timeout | client DNS/TLS/LB -> API saturation -> admission -> etcd |
| Forbidden | authenticated identity -> RBAC verb/resource/subresource/scope -> admission |
| Pending Pod | scheduler condition -> requests -> taints/affinity/topology -> quota/PVC |
| ImagePullBackOff | image reference/digest -> registry DNS/TLS/auth/rate -> node disk/runtime |
| CrashLoopBackOff | previous log/exit -> command/config -> dependency -> probe -> OOM |
| Running but unavailable | readiness -> EndpointSlice -> Service targetPort -> policy/gateway |
| Terminating forever | finalizer -> preStop/grace -> volume detach -> unavailable controller |
| Node NotReady | Lease/status -> kubelet -> runtime -> network -> disk/memory/PID pressure |
| DNS failure | resolver/search -> CoreDNS -> Service/endpoints -> upstream/policy |
| PVC/mount failure | PVC/PV/class -> topology -> CSI controller -> attach -> CSI node/mount |

## Production Scenarios

### New rollout causes intermittent 503

Segment errors by Pod/node/revision, inspect readiness transition and EndpointSlices, compare
gateway upstream errors, check termination/draining and application startup. Contain by pausing or
rolling back traffic/workload revision; prove recovery with error rate and invariant checks.

### Cluster has spare CPU but Pods remain Pending

Aggregate CPU is irrelevant if no eligible node satisfies each Pod's request plus taints, affinity,
topology, ports and volumes. Read scheduler events and per-node allocatable/requested resources.

### Node drain blocks

Identify PDB, unmanaged Pod, local storage, finalizer or unhealthy eviction target. Decide whether
availability or maintenance is the priority; add capacity or repair readiness before overriding.

### Control plane slow after policy rollout

Check API request/admission timing, webhook endpoints/certificates/timeouts and etcd latency. Narrow
or disable only through the governed emergency path. A fail-closed webhook can preserve policy while
blocking all matching writes.

## Required Labs

1. Build a local multi-node cluster; label/taint nodes and explain component placement.
2. Deploy a three-replica service with resources, probes, PDB and topology spread.
3. Break a selector and `targetPort`; diagnose from Service through endpoint to socket.
4. Apply default-deny networking, then allow DNS and one precise service flow.
5. Force Pending with requests/affinity/taints and resolve from scheduler evidence.
6. Trigger CrashLoop, probe failure and OOM; collect previous logs and cgroup/resource evidence.
7. Provision, expand, snapshot/backup and restore a PVC; verify checksums.
8. Cordon/drain a node during load; measure errors and disruption behavior.
9. Install an admission policy and prove both allow and deny tests.
10. Simulate DNS or CoreDNS degradation and trace resolver-to-upstream latency.
11. Perform a supported minor-version test upgrade with API-deprecation scan and rollback/recovery plan.
12. Restore an etcd snapshot in an isolated lab and reconcile application data separately.

Use disposable environments for destructive exercises and preserve raw commands, events, metrics
and results as portfolio evidence.

## Top Interview Questions

**Deployment versus StatefulSet?** Deployment manages interchangeable replicas; StatefulSet adds
stable identity and volume association. Neither supplies application replication correctness.

**Requests versus limits?** Requests drive placement/share; limits constrain usage. CPU throttles,
memory can OOM. Size from measurement and include native/off-heap and startup.

**Readiness versus liveness?** Readiness controls traffic; liveness restarts a locally wedged process.
Shared dependency outage normally should not trigger a restart storm.

**Why can more replicas reduce reliability?** They multiply connections, retries, cache cold starts,
downstream load and rollout demand when the real bottleneck is fixed.

**How does a Service reach a Pod?** Selection creates EndpointSlices; the cluster's Service data
plane routes/translates the virtual endpoint to an eligible Pod IP. Exact implementation varies.

**What happens when a node dies?** Heartbeats stop, node status becomes unhealthy/unknown, taints and
controller behavior eventually replace eligible controller-owned Pods elsewhere; local data and
in-flight work need application-level recovery.

**Does a PDB guarantee availability?** No. It limits voluntary simultaneous disruption; crashes,
resource pressure, bad readiness and insufficient capacity can still violate availability.

**How do you secure a tenant?** Identity/RBAC, quotas, Pod/admission policy, network isolation,
secret scope, supply-chain/runtime controls, observability and possibly separate nodes/clusters.

**How do you upgrade safely?** Inventory compatibility/deprecations, back up and restore-test,
canary control plane/node/add-ons in supported order, preserve surge capacity, validate SLOs and
have recovery boundaries.

**When should you avoid Kubernetes?** When workload/team scale does not justify its platform cost,
or simpler managed/serverless/container hosting meets the constraints with lower operational risk.

## One-Page Revision

```text
API: authenticate -> authorize -> mutate -> validate -> persist -> watch
Control: API server + etcd + scheduler + controllers
Node: kubelet + CRI runtime + CNI + CSI (+ Service data plane)
Placement: requests + selectors/affinity + taints + topology + volumes
Traffic: DNS -> Service -> EndpointSlice -> Pod; Gateway for external routing
State: PVC -> PV -> StorageClass -> CSI; backup/restore remains application-aware
Security: identity + RBAC + admission + Pod policy + network + secrets + supply chain
Operations: SLO + capacity + node lifecycle + upgrades + etcd/app recovery
Diagnosis: conditions/events first, then logs/metrics and node/data-plane evidence
```

## Completion Checklist

- Draw and explain the full API-to-container path without notes.
- Write and defend a secure production Deployment.
- Diagnose every row in the failure matrix in a disposable cluster.
- Restore cluster state and application data, measuring RPO/RTO.
- Present one capacity model, threat model, upgrade plan and incident review.
- Score at least three out of four in three consecutive Kubernetes mocks.

## Official References

- [Debug applications](https://kubernetes.io/docs/tasks/debug/debug-application/)
- [Troubleshoot clusters](https://kubernetes.io/docs/tasks/debug/debug-cluster/)
- [Kubernetes documentation](https://kubernetes.io/docs/home/)

## Recommended Next

Return to the [Kubernetes Beginner-To-Architect Path](../KUBERNETES-ARCHITECT-PATH.md), complete all labs, then apply Helm and Argo CD to the same workloads.

