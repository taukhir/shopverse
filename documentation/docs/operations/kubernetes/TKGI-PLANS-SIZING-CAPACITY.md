---
title: TKGI Plans, Profiles, VM Sizing And Capacity
description: TKGI 1.25 planning guide covering plans, compute/network/Kubernetes profiles, control-plane sizing, worker calculations, Pod density, upgrade and failure headroom, IP/storage/load-balancer capacity, skew, quotas, evidence, and interviews.
difficulty: Advanced
page_type: Decision Guide
status: maintained
prerequisites: [TKGI installation, Kubernetes resources, Capacity planning]
learning_objectives: [Design TKGI plans, Calculate worker and control-plane capacity, Preserve upgrade and failure headroom, Diagnose capacity failures]
technologies: [TKGI 1.25, BOSH, vSphere, Kubernetes]
last_reviewed: "2026-07-28"
scope: generic
owner: docs-operations
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# TKGI Plans, Profiles, VM Sizing And Capacity

A TKGI plan is a governed cluster offering. It combines topology, VM sizing, worker
limits, networking, storage and enabled capabilities. Treat a plan as a durable contract
referenced by clusters—not a temporary label.

## Configuration Layers

| Layer | Typical purpose |
|---|---|
| plan | default/maximum topology, control-plane/worker VM types and platform capabilities |
| compute profile | vSphere host-group and compute-placement customization where supported |
| network profile | NSX Pod/node/LB/router/DNS and related network customization |
| Kubernetes profile | supported cluster/API behavior customization |
| BOSH global/named config | maps logical plan requirements to actual infrastructure |

## TKGI 1.25 Control-Plane Sizing Reference

Broadcom links control-plane VM size to worker count. The following values are **per
control-plane node** and are a TKGI 1.25 starting point, not universal Kubernetes sizing:

| Workers | CPU | RAM (GB) |
|---:|---:|---:|
| 1–5 | 1 | 3.75 |
| 6–10 | 2 | 7.5 |
| 11–100 | 4 | 15 |
| 101–250 | 8 | 30 |
| 251–500 | 16 | 60 |
| 500+ | 32 | 120 |

All control-plane nodes in a multi-node cluster use the same size. Do not downsize below
the supported recommendation merely because average CPU appears low: upgrades and failure
recovery create higher temporary load, and an overloaded control plane can cause downtime.

## Worker Calculation

The TKGI 1.25 sizing page uses a planning maximum of 100 Pods per worker and defines:

```text
p = maximum workload Pods
m = memory requested per Pod
c = CPU requested per Pod

minimum workers           = ceil(p / 100)
minimum memory per worker = m × 100
minimum CPU per worker    = c × 100
```

This is a first constraint, not a complete bin-packing model. Real calculation must also
include system DaemonSets, per-node overhead, allocatable resources, topology constraints,
large Pods, ephemeral storage, PID/network limits and uneven placement.

### Official Example

For 1,000 Pods at 1 GB and 0.10 CPU each:

```text
base workers:          1000 / 100 = 10
memory per worker:     1 GB × 100 = 100 GB
CPU per worker:        0.10 × 100 = 10 CPUs
upgrade headroom:      +1 worker
failure tolerance:     +2 workers
total example:         13 workers, each 10 CPU / 100 GB
```

Validate whether this shape is efficient. Fewer very large nodes increase blast radius;
many small nodes increase system overhead and control-plane/watch load.

## Capacity Dimensions

### Compute

```text
required capacity = steady workload
                  + Kubernetes/system overhead
                  + rolling-upgrade surge
                  + failed-node replacement
                  + growth and traffic burst
```

Use measured requests, limits, actual utilization and scheduling failures. Average usage
alone hides p95/p99 peaks and resource fragmentation.

### IP Addresses

Calculate separately:

- management VM IPs;
- control-plane and worker node IPs;
- Pod IPs and allocation block waste;
- Service addresses;
- ingress and `LoadBalancer` virtual IPs;
- floating/NAT addresses;
- temporary addresses required during rolling replacement;
- reserved infrastructure ranges and growth.

### Storage

Include OS/ephemeral disks, persistent volumes, registry storage, BOSH blobstore/database,
snapshots/backups and temporary capacity during migration. Track latency and IOPS, not only
free bytes.

### Load Balancers

Plan virtual-server, pool/member, throughput, connection and address capacity. For NSX,
network profiles can select load-balancer sizing at cluster creation; default assumptions
may not support a high-ingress tenant.

## Plan Governance

- publish intended workload and availability class;
- set maximum worker count consistent with IaaS and control-plane sizing;
- version meaningful behavioral changes;
- inventory clusters referencing a plan before deactivation/removal;
- test updates on representative clusters;
- avoid changing placement/network assumptions without migration planning;
- map cost/chargeback and quota policy explicitly.

## Capacity Failure Diagnosis

| Symptom | Likely constraint |
|---|---|
| Pods Pending despite free aggregate CPU | fragmentation, affinity, taints, storage or zone constraint |
| cluster scale fails | plan maximum, quota, IP pool, vSphere capacity or BOSH placement |
| control plane slow during upgrade | undersizing, API/etcd load or insufficient headroom |
| new LB Service remains pending | NSX/LB capacity, IP pool or realization failure |
| datastore nearly full | VM disks, PVs, snapshots or orphaned resources |
| one tenant dominates | missing quotas, skewed plan or shared failure-domain contention |

## Production Evidence

Maintain dashboards for worker count versus plan maximum, allocatable/requested/actual
resources, pending scheduling reasons, IP-pool utilization, datastore capacity/latency,
load-balancer utilization and BOSH VM-creation duration/failure.

## Interview Questions

**Why is Pod count insufficient for sizing?** CPU, memory, ephemeral storage, topology,
DaemonSets, network and volume limits can become binding before Pod count.

**Why reserve at least one extra worker for upgrades?** A worker can be drained and
recreated only if remaining nodes can schedule disrupted Pods within availability rules.

## Recommended Next

Continue with [TKGI Upgrade Lifecycle](./TKGI-UPGRADE-LIFECYCLE.md) and validate
the proposed headroom against a drain, control-plane upgrade, and failed-node scenario.

## Official References

- [Broadcom TKGI 1.25 VM sizing](https://techdocs.broadcom.com/us/en/vmware-tanzu/standalone-components/tanzu-kubernetes-grid-integrated-edition/1-25/tkgi/vm-sizing.html)
