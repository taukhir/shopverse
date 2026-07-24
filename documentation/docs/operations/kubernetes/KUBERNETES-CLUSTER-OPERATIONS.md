---
title: Kubernetes Cluster Operations, Capacity, Upgrades, HA, And Recovery
description: Operate control planes, nodes, add-ons, quotas, autoscaling, upgrades, certificates, etcd backup and restore, observability, disaster recovery, and cost.
difficulty: Advanced
page_type: Explanation
status: Generic
prerequisites: [Kubernetes security and internals]
learning_objectives: [Design cluster topology and capacity, Operate nodes and upgrades safely, Define observability and SLOs, Rehearse backup and disaster recovery]
technologies: [Kubernetes, etcd, kubeadm, Prometheus]
last_reviewed: "2026-07-24"
---

# Kubernetes Cluster Operations, Capacity, Upgrades, HA, And Recovery

## Managed Versus Self-Managed

Managed control planes reduce—but do not remove—responsibility. The application/platform team
still owns workload configuration, node groups in many offerings, networking, storage, identity,
policy, add-ons, observability, upgrades, quotas, recovery and cost. Self-managed clusters also
own control-plane hosts, etcd, certificates and component lifecycle.

Choose topology from failure domains and recovery objectives: control-plane endpoint redundancy,
odd etcd quorum across low-latency zones, multiple worker zones, critical add-on spread and enough
spare capacity to lose a node/zone while rolling or scaling.

## Capacity Model

Plan separately:

- allocatable CPU/memory/ephemeral storage versus requested and actual workload;
- Pod/IP limits, route and Service/Endpoint scale;
- API request rate, object count, watch fan-out and admission latency;
- etcd database, write rate, fsync latency and compaction/defragmentation needs;
- CNI, CSI, DNS, gateway and observability capacity;
- zone-loss, upgrade surge and autoscaler provisioning headroom;
- provider quotas and cost.

Requests too low create overcommit and noisy-neighbor risk; too high wastes nodes and blocks
scheduling. Compare requested, working-set and throttling/OOM evidence by workload and namespace.

## Node Lifecycle

Before maintenance, verify PDBs, capacity, local storage, singleton work and failure-domain impact.

```bash
kubectl cordon <node>
kubectl drain <node> --ignore-daemonsets --delete-emptydir-data=false
kubectl get pods -A -o wide --field-selector spec.nodeName=<node>
kubectl uncordon <node>
```

Drain uses eviction where possible and can block on PDBs or unmanaged Pods. Do not bypass protection
without understanding data and availability. Replace immutable nodes through a tested node-group
rollout rather than accumulating snowflake host changes.

## Upgrades

Read release notes and version-skew policy; inventory deprecated APIs, CRDs/webhooks, CNI, CSI,
ingress/gateway, metrics, service mesh, operators and clients. Test backup/restore and upgrade in a
representative environment. Upgrade control plane using the provider/tool sequence, then node pools
with surge/canary capacity. Validate SLOs, scheduling, DNS, storage, policy and reconciliation before
continuing.

API conversion/storage versions matter: a served version can be removed while objects remain stored
in another version. Migrate manifests and stored objects according to supported procedures. Rollback
may be constrained; define recovery rather than assuming arbitrary downgrade.

## Certificates And Credentials

Inventory API serving, etcd peer/client, kubelet, front-proxy, webhook and add-on certificates and
their rotation owner. Alert well before expiry. Rotate one trust path at a time with overlap where
supported and validate clients. Managed offerings may rotate control-plane certificates while users
still own webhook, ingress and workload certificates.

## etcd Backup And Restore

An etcd snapshot protects Kubernetes API state, not external volumes, registries, cloud resources or
application databases. Encrypt snapshots, copy them off-cluster and capture encryption-provider keys,
PKI, configuration and exact restore procedure. Restore to a controlled environment regularly and
verify API objects plus controller convergence. Coordinate application data recovery separately.

## Observability

Monitor user impact and platform internals:

| Layer | Signals |
|---|---|
| API | availability, latency by verb/resource, 429/5xx, inflight and audit |
| etcd | leader, quorum, fsync/WAL/backend latency, size, alarms |
| scheduler/controllers | queue depth, reconciliation errors and latency |
| nodes | Ready/pressure, kubelet/runtime, allocatable, filesystem/inodes, network |
| workloads | availability, restarts, OOM, throttling, pending, probe and rollout |
| network/storage | DNS, dropped packets, endpoints, CSI operations and volume capacity |

Events are diagnostic breadcrumbs with limited retention, not a durable audit system. Centralize
logs, metrics, traces and audit records with tenant/cardinality controls. Define SLOs and alerts that
lead to owned actions rather than alerting on every transient state.

## Add-On Governance

Track owner, version compatibility, privileges, CRDs/webhooks, capacity, HA, backup and rollback for
CNI, CSI, CoreDNS, gateway, metrics, autoscaling, policy, secret and observability add-ons. An add-on
upgrade can be a cluster-wide change even when installed as ordinary Pods.

## Disaster Recovery

Document scenarios separately: single Pod/node/zone, control-plane loss, etcd corruption, cluster
loss, identity compromise and regional/provider outage. Define RPO/RTO, authoritative source,
restore order, DNS/traffic failover, data reconciliation and failback. GitOps recreates declared
objects but not all state; combine it with secrets, volume/database backups and cloud infrastructure.

## Cost And Efficiency

Measure idle requests, bin packing, overprovisioning, node family, storage class, load balancers,
cross-zone traffic, logs/metrics and control-plane/add-on cost. Optimize after preserving failure
headroom and SLO. Spot/preemptible capacity needs disruption-tolerant workloads and diversified pools.

## Production Runbook Questions

- Who can declare an incident and freeze reconciliation/deployments?
- How do we preserve events, audit and node evidence before replacement?
- What is the safe cordon/drain and rollback path?
- Can we restore cluster state and application data in dependency order?
- What evidence proves recovery met RPO/RTO and correctness invariants?

## Official References

- [Kubernetes cluster administration](https://kubernetes.io/docs/concepts/cluster-administration/)
- [Operating etcd clusters](https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/)
- [Version skew policy](https://kubernetes.io/releases/version-skew-policy/)
- [Safely drain a node](https://kubernetes.io/docs/tasks/administer-cluster/safely-drain-node/)

## Recommended Next

Finish with [Troubleshooting, Incident Labs, Interviews, And Revision](./KUBERNETES-TROUBLESHOOTING-INTERVIEW-REVISION.md).

