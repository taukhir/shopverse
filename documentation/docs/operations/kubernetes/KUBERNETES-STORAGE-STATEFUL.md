---
title: Kubernetes Persistent Storage, Stateful Workloads, And CSI
description: Design ephemeral and persistent storage with PVs, PVCs, StorageClasses, CSI, topology, snapshots, expansion, StatefulSets, backups, and failure diagnosis.
difficulty: Advanced
page_type: Tutorial
status: maintained
prerequisites: [Kubernetes workloads and scheduling]
learning_objectives: [Select storage correctly, Trace provisioning attach and mount, Operate stateful workloads safely, Recover storage failures]
technologies: [Kubernetes, CSI, StatefulSet, VolumeSnapshot]
last_reviewed: "2026-07-24"
scope: generic
owner: docs-operations
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Kubernetes Persistent Storage, Stateful Workloads, And CSI

## Storage Layers

```text
Pod volume reference -> PVC claim -> PV capacity/access/topology
                    -> StorageClass/provisioner -> CSI controller
                    -> provider volume -> CSI node stage/publish -> container mount
```

An `emptyDir` follows the Pod and is erased when the Pod leaves the node; memory-backed emptyDir
consumes memory. ConfigMap, Secret and projected volumes deliver configuration/identity, not general
durable storage. Persistent volumes have a lifecycle independent of one container and often one Pod.

## PV, PVC And StorageClass

A PVC requests capacity, access modes and optionally a class. A StorageClass defines a provisioner,
parameters, reclaim behavior and binding mode. Dynamic provisioning creates a PV. `WaitForFirstConsumer`
can delay binding until scheduling reveals the required topology, avoiding an unusable zone placement.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata: {name: orders-data}
spec:
  accessModes: [ReadWriteOnce]
  storageClassName: fast-encrypted
  resources:
    requests: {storage: 100Gi}
```

Access modes describe supported attachment/mount semantics, not database concurrency correctness.
Check the actual CSI/provider behavior for multi-attach, filesystem and topology.

## CSI Internals

CSI separates storage-provider logic from Kubernetes. Controller-side components provision,
delete, attach, detach, snapshot and expand as supported. Node-side plugins stage/publish volumes
and perform node-local mount operations. Sidecars watch Kubernetes objects and call CSI endpoints.

A PVC can be bound while a Pod still fails to mount. Follow events across Pod, PVC, PV,
VolumeAttachment, CSI controller/node logs and provider state. Distinguish provisioning, attach,
device discovery, filesystem, mount, permission and application errors.

## StatefulSets

StatefulSets provide stable Pod names, ordered behavior and per-replica volume templates. They do
not understand quorum, replication, fencing or backup. For databases, prefer a supported managed
service or mature operator when that reduces operational risk; validate restore and exit strategy.

```yaml
volumeClaimTemplates:
  - metadata: {name: data}
    spec:
      accessModes: [ReadWriteOnce]
      storageClassName: fast-encrypted
      resources: {requests: {storage: 100Gi}}
```

Deleting or scaling a StatefulSet does not necessarily delete claims. This protects data but creates
capacity and lifecycle responsibilities.

## Expansion, Snapshots And Backup

Expansion requires class/driver/filesystem support and may complete in controller and node phases.
A volume snapshot is a storage-level point-in-time artifact, not automatically an application-
consistent backup. Coordinate database flush/checkpoint or native backup, capture external metadata,
copy to a separate failure domain, encrypt it and regularly restore into an isolated environment.

Define RPO/RTO, retention, immutability, ownership and evidence. A successful backup job is weaker
than a timed restore plus application reconciliation.

## Reclaim And Deletion

`Delete` may remove provider storage after claim/PV lifecycle; `Retain` leaves manual recovery and
cleanup. Finalizers protect in-use resources. Before forced finalizer removal, prove attachment and
data consequences. Accidental namespace deletion can cascade through claims depending on ownership
and policy.

## Capacity And Performance

Plan capacity, IOPS, throughput, latency, burst credits, queue depth and zone placement. Filesystem
free space and inodes can fail independently. Application fsync semantics, page cache and database
write amplification matter. Storage limits are not visible from CPU alone.

Monitor PVC usage, provider capacity/latency/error, CSI operations, mount failures and application
durability metrics. Alert before expansion or migration becomes an emergency.

## Failure Matrix

| Symptom | Possible causes | Evidence |
|---|---|---|
| PVC Pending | no class/provisioner, quota, topology or capacity | PVC events, class and CSI controller |
| multi-attach error | prior node attachment or unsupported mode | VolumeAttachment, node/provider state |
| mount timeout | CSI node, device, filesystem, permission or node pressure | Pod event, kubelet and CSI node logs |
| wrong-zone scheduling | immediate binding or affinity conflict | PV node affinity and scheduler event |
| application corruption | crash consistency, concurrent writer or filesystem issue | app/database recovery logs and storage health |
| disk full despite PVC size | filesystem/inodes, snapshots or app retention | `df`, `df -i`, app/storage metrics |

## Hands-On Lab

Provision a claim, write checksum data, delete/recreate the Pod, expand the claim, take a consistent
backup/snapshot, restore to another namespace and reconcile checksums. Then simulate a zone/attach
constraint and document the exact controller and node events.

## Interview Questions

<ExpandableAnswer title="What are PV, PVC and StorageClass?">

A PersistentVolume represents storage available to the cluster. A PersistentVolumeClaim is a
workload's request for capacity, access mode and class. A StorageClass describes a provisioning
and policy profile that can dynamically create a matching PV through a CSI driver.

</ExpandableAnswer>

<ExpandableAnswer title="How does dynamic volume provisioning work?">

The PVC selects a StorageClass. Its CSI provisioner creates provider storage and a PV, Kubernetes
binds the claim, scheduling respects topology, and CSI node components stage and mount the volume
on the chosen node. Events at each layer show where the flow stopped.

</ExpandableAnswer>

<ExpandableAnswer title="What do ReadWriteOnce and ReadWriteMany guarantee?">

They describe supported attachment and mount access, not application-level concurrency safety.
ReadWriteOnce normally allows read-write use from one node; ReadWriteMany supports multiple nodes
when the driver and backend implement it. Check the precise access-mode and driver semantics.

</ExpandableAnswer>

<ExpandableAnswer title="What does a StatefulSet guarantee, and what does it not guarantee?">

It provides stable ordinal identity, ordered lifecycle options and stable claim templates. It does
not provide database replication, leader election, consistency, backup, restore validation or safe
schema evolution; the application or an operator must implement those concerns.

</ExpandableAnswer>

<ExpandableAnswer title="How do you investigate a Pending PVC?">

Inspect PVC events, its requested class and access modes, the StorageClass and CSI provisioner,
quota and provider capacity. With delayed binding, also inspect the consuming Pod's scheduler and
topology events because volume selection waits for a suitable node.

</ExpandableAnswer>

<ExpandableAnswer title="Why is a storage snapshot not automatically a complete backup?">

A snapshot may be crash-consistent rather than application-consistent, may share the same failure
domain and credentials, and may omit external state. A backup design needs RPO/RTO, retention,
immutability, dependency ordering and regularly tested restoration with correctness checks.

</ExpandableAnswer>

## Official References

- [Kubernetes storage](https://kubernetes.io/docs/concepts/storage/)
- [Persistent volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
- [CSI volume snapshots](https://kubernetes.io/docs/concepts/storage/volume-snapshots/)
- [StatefulSets](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)

## Recommended Next

Continue with [Security, Admission, Policy, And Multi-Tenancy](./KUBERNETES-SECURITY-MULTITENANCY.md).
