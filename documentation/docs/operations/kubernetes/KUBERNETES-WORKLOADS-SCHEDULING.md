---
title: Kubernetes Pods, Workloads, Lifecycle, And Scheduling
description: Design Pods, Deployments, StatefulSets, DaemonSets, Jobs, lifecycle hooks, probes, resources, placement, disruption, autoscaling, and graceful rollout behavior.
difficulty: Advanced
page_type: Tutorial
status: Generic
prerequisites: [Kubernetes control-plane internals]
learning_objectives: [Select workload controllers, Engineer safe Pod lifecycle, Control placement and disruption, Scale from meaningful signals]
technologies: [Kubernetes, HPA, VPA, Cluster Autoscaler]
last_reviewed: "2026-07-24"
---

# Kubernetes Pods, Workloads, Lifecycle, And Scheduling

## Pod Model

A Pod is one scheduling and lifecycle unit containing containers that share network and selected
Linux namespaces and volumes. Put containers together only when they require the same placement,
lifecycle and scaling—for example an application plus a tightly coupled sidecar. Init containers
run sequentially before application containers; sidecar-style lifecycle requires deliberate
startup and termination behavior.

## Workload Selection

| Need | Controller | Important semantics |
|---|---|---|
| replicated stateless service | Deployment | ReplicaSet rollout and rollback |
| stable identity/ordered lifecycle | StatefulSet | ordinal identity and per-Pod PVC association |
| one Pod per eligible node | DaemonSet | node-local agents and infrastructure |
| finite completion | Job | retry/completion policy and idempotency |
| scheduled finite work | CronJob | schedule, concurrency and missed-start behavior |

Controllers do not protect business correctness. Job retries can duplicate external side effects;
StatefulSets do not supply database quorum, backup or failover.

## Production Pod Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orders
spec:
  replicas: 3
  strategy:
    rollingUpdate: {maxSurge: 1, maxUnavailable: 0}
  selector:
    matchLabels: {app: orders}
  template:
    metadata:
      labels: {app: orders}
    spec:
      serviceAccountName: orders
      terminationGracePeriodSeconds: 45
      securityContext:
        runAsNonRoot: true
        seccompProfile: {type: RuntimeDefault}
      containers:
        - name: app
          image: registry.example/orders@sha256:REPLACE
          ports: [{name: http, containerPort: 8080}]
          resources:
            requests: {cpu: 500m, memory: 768Mi}
            limits: {memory: 1Gi}
          startupProbe:
            httpGet: {path: /actuator/health/readiness, port: http}
            failureThreshold: 30
            periodSeconds: 5
          readinessProbe:
            httpGet: {path: /actuator/health/readiness, port: http}
            periodSeconds: 5
          livenessProbe:
            httpGet: {path: /actuator/health/liveness, port: http}
            periodSeconds: 10
          lifecycle:
            preStop:
              exec: {command: ["sh", "-c", "sleep 10"]}
```

This is illustrative. Validate image contents, probe semantics, shutdown time and resources by
measurement. A shell-based hook requires a shell in the image; distroless images need another
approach. Readiness should remove unsafe traffic; liveness should detect local irrecoverable
wedge, not restart because a shared database is briefly unavailable.

## Lifecycle And Termination

On deletion Kubernetes sets a deadline, runs `preStop` if configured, sends the stop signal to
PID 1 and eventually force-kills remaining processes. Endpoint removal, load-balancer propagation,
connection draining and application shutdown are concurrent, not instant. Handle SIGTERM, stop
accepting new work, finish bounded in-flight work, commit/return owned work safely and exit within
the grace period.

## Resources, QoS And Eviction

Requests drive scheduling and reserved share; limits constrain usage. CPU is compressible and
usually throttled; memory exhaustion can trigger OOM kills. Pod QoS derives from requests/limits
and influences eviction order, but does not replace application admission control.

Size from measured peak CPU, memory working set, heap plus native/off-heap, startup and tail
latency. Namespace `ResourceQuota` controls aggregate consumption; `LimitRange` supplies or
constrains per-object defaults.

## Placement

- node selectors/affinity express eligible or preferred nodes;
- Pod affinity/anti-affinity relates placement to other Pods;
- topology spread controls distribution across zone/node or custom topology;
- taints repel Pods and tolerations permit, but do not attract, them;
- priority and preemption favor important Pods but can disrupt lower-priority work;
- PDB limits voluntary concurrent disruption, not node crashes or all upgrade failure modes.

Hard constraints can make Pods unschedulable. Prefer the minimum constraints needed for
correctness and failure-domain resilience.

## Autoscaling

HPA adjusts replicas from resource, custom or external metrics. Use a signal proportional to
load before saturation, such as queue age or concurrency, and configure stabilization. CPU-based
scaling fails when CPU is not the bottleneck. VPA recommends or changes Pod resources depending
on mode and may require restarts. Cluster autoscaling adds/removes nodes for unschedulable demand;
it cannot fix an invalid constraint or unavailable node group.

Model the complete chain:

```text
metric delay + HPA decision + pending scheduling + node provisioning
+ image pull + startup + readiness = usable capacity delay
```

Keep warm capacity for bursts and ensure databases, brokers and connection pools can absorb the
new replicas.

## Safe Rollouts

Check capacity for old plus surge replicas, schema/event compatibility, probe truth, graceful
shutdown and downstream headroom. `progressDeadlineSeconds` detects stalled progress; rollout
success should also require application SLO/correctness evidence. Kubernetes rollback restores a
workload revision, not irreversible data or external side effects.

## Failure Diagnosis

| Status | Investigate |
|---|---|
| Pending | scheduling events, resources, taints, affinity, quota, PVC/topology |
| ContainerCreating | image, CNI, CSI, secret/config and sandbox events |
| CrashLoopBackOff | previous logs, exit code, command, config, dependency and backoff |
| OOMKilled | cgroup limit, working set, heap/native memory and node pressure |
| Ready false | exact probe output, timeout, dependency policy and endpoint membership |
| rollout stalled | unavailable replicas, probes, quota, PDB and capacity |

## Official References

- [Kubernetes workloads](https://kubernetes.io/docs/concepts/workloads/)
- [Pod lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
- [Scheduling and eviction](https://kubernetes.io/docs/concepts/scheduling-eviction/)
- [Horizontal Pod Autoscaling](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)

## Recommended Next

Continue with [Networking, Services, DNS, Ingress, And Gateway API](./KUBERNETES-NETWORKING-SERVICES.md).

