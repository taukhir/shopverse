---
title: Kubernetes Persistent Storage, Stateful Workloads, And CSI
description: Design ephemeral and persistent storage with PVs, PVCs, StorageClasses, CSI, topology, snapshots, expansion, StatefulSets, backups, and failure diagnosis.
difficulty: Advanced
page_type: Tutorial
status: Generic
prerequisites: [Kubernetes workloads and scheduling]
learning_objectives: [Select storage correctly, Trace provisioning attach and mount, Operate stateful workloads safely, Recover storage failures]
technologies: [Kubernetes, CSI, StatefulSet, VolumeSnapshot]
last_reviewed: "2026-07-24"
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

## Official References

- [Kubernetes storage](https://kubernetes.io/docs/concepts/storage/)
- [Persistent volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
- [CSI volume snapshots](https://kubernetes.io/docs/concepts/storage/volume-snapshots/)
- [StatefulSets](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)

## Recommended Next

Continue with [Security, Admission, Policy, And Multi-Tenancy](./KUBERNETES-SECURITY-MULTITENANCY.md).

