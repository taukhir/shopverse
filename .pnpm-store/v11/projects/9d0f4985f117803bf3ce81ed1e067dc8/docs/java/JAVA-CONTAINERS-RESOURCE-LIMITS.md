---
title: Java Containers Resource Limits And Production Diagnostics
description: JVM container awareness, heap and native budgets, CPU quota, GC, threads, direct memory, OOMKilled, signals, JFR, dumps, filesystems, and Kubernetes limits.
difficulty: Advanced
page_type: Guide
status: maintained
prerequisites: [JVM memory, Docker, Kubernetes]
learning_objectives: [Budget JVM memory inside cgroups, Diagnose throttling and OOMKilled, Operate graceful Java containers]
technologies: [Java, Docker, Kubernetes, cgroups]
last_reviewed: "2026-07-28"
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Java Containers Resource Limits And Production Diagnostics

The container memory limit covers the whole process, not only Java heap:

```text
container memory
 = heap + metaspace + code cache + thread stacks + direct buffers
 + GC/JVM native structures + agents/JNI + mapped files + safety margin
```

Setting maximum heap equal to the container limit invites `OOMKilled` even when
the Java heap itself is healthy.

## Memory Budget

Use container-aware JVM ergonomics and explicit percentage/limits only after
measuring non-heap demand. Review `MaxRAMPercentage`, initial heap behavior,
direct-memory users, thread count/stack size, metaspace, agents and collector
overhead. Preserve margin for bursts and diagnostics.

Differentiate:

- Java `OutOfMemoryError`: JVM reports a specific exhausted area;
- Kubernetes `OOMKilled`: cgroup/kernel kills the process for total memory;
- node eviction: kubelet responds to node pressure;
- application termination: probe, signal or supervisor behavior.

## CPU Quota And Throttling

CPU limits can throttle runnable threads even when node CPU is available. This
increases latency, GC wall time and timeout/rebalance risk. Compare CPU usage,
quota, throttled periods/time, runnable threads and node saturation. More Java
threads cannot overcome a CPU quota.

GC and common pool sizing can depend on visible processors; verify the effective
processor count and workload behavior under the actual cgroup limits.

## Signals And Shutdown

The Java process should receive termination signals, remove readiness, stop new
work, drain within a measured bound, commit/close messaging clients and exit before
the grace period. Shell-form entrypoints or wrappers can swallow/delay signals;
use correct exec behavior or an init where needed.

Forced termination should produce safe replay, not lost effects. Ensure the pod
termination grace period covers measured drain plus margin.

## Diagnostics In Minimal Images

Distroless/minimal production images reduce attack surface but may omit shells and
JDK tools. Plan approved diagnostics through JFR on startup/on demand, actuator
and metrics, ephemeral debug containers, a controlled diagnostic image, writable
dump/recording volumes and secure artifact extraction.

Do not discover during an incident that the filesystem is read-only, ephemeral
storage is full, or the tool/JDK build is incompatible.

## Filesystems And Logs

Use read-only root filesystems where possible, explicit writable temporary paths,
bounded ephemeral storage and external log collection. Heap dumps and JFR files
can fill ephemeral storage. Never rely on the container writable layer for durable
business data.

## Container Incident Matrix

| Symptom | Evidence | Response |
|---|---|---|
| `OOMKilled`, no heap OOM | pod status, cgroup events, RSS vs heap/NMT | reduce total memory or raise justified limit |
| high latency, CPU below limit average | throttled time/periods, per-thread CPU | adjust request/limit or workload; avoid burst throttling |
| graceful shutdown fails | signal path, PID 1, lifecycle timestamps | fix entrypoint/lifecycle and grace period |
| dump cannot be written | mount, permissions, free ephemeral bytes | preconfigure secure diagnostic volume |
| DNS/TLS pauses | JFR sockets, traces, DNS/cache and truststore | correct network/deadline/trust configuration |
| too many threads | thread count and native stack budget | bound concurrency/use appropriate model |
| direct memory growth | NMT/RSS/direct-buffer metrics | find buffer ownership and bound pools |

## Production Checklist

- tested heap plus native memory budget below cgroup limit;
- CPU throttling dashboard and alert;
- non-root user, read-only filesystem and writable paths documented;
- exec-form signal delivery and bounded shutdown tested;
- JFR/dump procedure tested with disk and security controls;
- readiness represents ability to serve, not process existence;
- startup, liveness and readiness probes have distinct purposes;
- resource requests reflect steady need and limits reflect tested burst policy.

## Recommended Next

Use the [Docker Production Mastery](../operations/docker/DOCKER-PRODUCTION-MASTERY.md).

## Official References

- [Docker resource constraints](https://docs.docker.com/engine/containers/resource_constraints/)
- [Kubernetes resource management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
- [Kubernetes container lifecycle hooks](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/)
