---
title: Kubernetes API Machinery, Control Plane, Nodes, And Reconciliation
description: Trace Kubernetes objects through authentication, authorization, admission, etcd, watches, controllers, scheduling, kubelet, CRI, garbage collection, and node health.
difficulty: Advanced
page_type: Explanation
status: Generic
prerequisites: [Kubernetes workload fundamentals]
learning_objectives: [Trace an API request, Explain reconciliation and optimistic concurrency, Diagnose control-plane and node lifecycle failures]
technologies: [Kubernetes API, etcd, kube-scheduler, kubelet, CRI]
last_reviewed: "2026-07-24"
---

# Kubernetes API Machinery, Control Plane, Nodes, And Reconciliation

## API Request Path

```text
client -> TLS/API endpoint -> authentication -> authorization
       -> mutating admission -> schema/defaulting/validation
       -> validating admission -> etcd commit -> response
       -> watch events -> controllers/scheduler/kubelets
```

Authentication establishes identity; authorization decides whether that identity can perform
the verb on the resource; admission can mutate or reject the object. A successful create means
the desired object was persisted, not that a Pod is running or an application is ready.

Objects carry `metadata.uid`, `generation`, `resourceVersion`, labels, annotations, owner
references and optional finalizers. `resourceVersion` supports watches and optimistic
concurrency; clients should retry conflicts by reading current state and reapplying intent,
not overwriting blindly. `generation` changes for desired-spec updates while status writers
report `observedGeneration` to show which desired generation they processed.

## Control-Plane Components

| Component | Responsibility | Important failure evidence |
|---|---|---|
| API server | API, authn/authz, admission, validation, storage frontend | latency, inflight requests, 429/5xx, audit, webhook latency |
| etcd | consistent durable cluster state | leader changes, fsync/WAL latency, database size, quorum, alarms |
| scheduler | filter/score unscheduled Pods and create bindings | pending queue, scheduling latency, unschedulable reasons |
| controller manager | runs deployment, node, endpoint, namespace and other controllers | work-queue depth, retries, reconciliation errors |
| cloud controller | cloud nodes, routes, load balancers and volumes where applicable | provider API errors, quota, credential and reconciliation delay |

Production control planes normally span failure domains and require a majority etcd quorum.
Adding members increases failure tolerance only at appropriate odd quorum sizes and also adds
replication cost. Slow disks or network partitions can damage availability without high CPU.

## Reconciliation

A controller usually follows this idempotent shape:

```text
watch/enqueue key -> read current object -> calculate desired action
                  -> create/update/delete dependent object
                  -> update status -> requeue on change/error/time
```

Watches can close, compact or deliver duplicate-looking changes. Controllers list again and
resume from a supported point. They must tolerate retries and concurrent writers. Level-based
desired state is safer than relying solely on receiving every edge-triggered event.

### Ownership And Deletion

Owner references allow garbage collection of dependants. A finalizer prevents deletion from
finishing until a controller performs cleanup and removes its key. A stuck finalizer leaves an
object in `Terminating`; identify its owning controller and cleanup obligation before removing
it manually.

## Scheduler Internals

The scheduler observes Pods without `spec.nodeName`, filters infeasible nodes, scores feasible
ones, reserves/permits when plugins require it and binds the Pod. It considers resources,
selectors, affinity, taints, topology, ports and volumes; it cannot see application-level
capacity unless represented through resources, topology or extensions.

`Pending` is a symptom. Read Pod conditions and scheduler events. Common causes include
insufficient requested CPU/memory, unmatched affinity, untolerated taint, unbound PVC,
topology conflict, host-port collision or namespace quota.

## Node And Pod Runtime Path

The kubelet registers the Node, renews its Lease, watches assigned PodSpecs and asks the CRI
runtime to create sandboxes and containers. Runtime networking invokes CNI; volumes involve
kubelet/CSI node components. The kubelet runs probes, reports Pod/Node status and enforces
resource configuration through the host runtime and cgroups.

```text
Pod bound -> kubelet syncPod -> pull image -> create sandbox/network
          -> mount volumes -> create/start containers -> probes/status
```

The API server does not normally start containers directly. If the API server is temporarily
unavailable, existing containers may continue, but scheduling, controller action, status and
operator changes degrade.

## Node Health And Eviction

Node status and Lease heartbeats let the node controller assess availability. Distinguish
`Ready=False`, `Ready=Unknown`, pressure conditions, kubelet failure, runtime failure and
network partition. Taints can drive eviction after toleration periods. Local kubelet eviction
also reacts to memory, disk, inode and PID pressure.

## Extensibility

CRDs extend the API schema; controllers/operators supply behavior. Admission webhooks affect
API availability and latency. Aggregated APIs add API servers. Device plugins expose special
hardware. Scheduler plugins and runtime classes customize placement/runtime. Every extension
adds an upgrade, security, availability and observability responsibility.

## Diagnostic Commands

```bash
kubectl get --raw='/readyz?verbose'
kubectl get events -A --sort-by=.metadata.creationTimestamp
kubectl describe pod <pod> -n <namespace>
kubectl get pod <pod> -o yaml
kubectl auth can-i create deployments -n <namespace> --as <identity>
kubectl get --raw /metrics
```

On self-managed nodes also inspect systemd, kubelet/container-runtime logs, certificates,
static Pod manifests and etcd health using supported administrative procedures. Never edit
etcd data files directly.

## Failure Scenarios

| Symptom | Likely layer | First discriminating evidence |
|---|---|---|
| API writes hang | load balancer, API server, admission or etcd | request/audit timing and webhook/etcd latency |
| objects persist but controllers stop acting | controller process, leader election, watch or credentials | controller logs, work queues, Lease and status generation |
| new Pods never bind | scheduler or constraints | scheduler events and Pod scheduling condition |
| bound Pod never starts | kubelet, CRI, CNI, CSI or image | node condition, events, runtime/kubelet logs |
| namespace never deletes | finalizer or unavailable API extension | object finalizers and discovery/APIService health |

## Interview Questions

**Does `kubectl apply` synchronously deploy the application?** No. It submits desired state;
controllers, scheduler and kubelet converge asynchronously. Wait on explicit status/conditions.

**Why is etcd disk latency critical?** Consensus commits require durable WAL/fsync progress;
slow storage increases API write latency and can destabilize members even with idle CPU.

**What makes a controller safe?** Idempotent level-based reconciliation, optimistic concurrency,
bounded retries, clear ownership/finalizers, status conditions and observable work queues.

## Official References

- [Kubernetes components](https://kubernetes.io/docs/concepts/overview/components/)
- [Kubernetes API concepts](https://kubernetes.io/docs/reference/using-api/api-concepts/)
- [Kubernetes controllers](https://kubernetes.io/docs/concepts/architecture/controller/)
- [Nodes](https://kubernetes.io/docs/concepts/architecture/nodes/)

## Recommended Next

Continue with [Pods, Workloads, Lifecycle, And Scheduling](./KUBERNETES-WORKLOADS-SCHEDULING.md).

