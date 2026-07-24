---
title: Docker Troubleshooting, Incident Labs, Interviews, And Revision
description: Evidence-led Docker diagnosis, runtime build storage network and security incidents, practical labs, architect interviews, and complete revision checklist.
difficulty: Advanced
page_type: Practice
status: Generic
prerequisites: [Docker production operations]
learning_objectives: [Diagnose Docker incidents, Complete internals and recovery labs, Answer Lead and Architect questions, Revise the complete container path]
technologies: [Docker Engine, BuildKit, Compose, Linux]
last_reviewed: "2026-07-24"
---

# Docker Troubleshooting, Incident Labs, Interviews, And Revision

## Evidence-Led Workflow

```text
symptom -> daemon/context scope -> container/image/network/volume identity
        -> state/exit/events -> logs/stats -> host kernel/runtime/storage/network
        -> containment -> root cause -> recovery -> prevention
```

```bash
docker context show
docker version
docker info
docker ps -a --no-trunc
docker inspect <container>
docker logs --since 30m --timestamps <container>
docker events --since 30m
docker stats --no-stream
journalctl -u docker --since '30 minutes ago'
```

Confirm whether Docker Desktop, a remote context or rootless daemon owns the resources. Preserve
container ID, image digest, mounts, networks, exit/OOM state and timestamps before recreation.

## Failure Matrix

| Symptom | Diagnose |
|---|---|
| daemon unreachable | context/socket/TCP, service, permission, TLS and disk |
| container exits immediately | command/entrypoint, PID 1, config, architecture, exit and logs |
| OOM/137 | cgroup memory events, host OOM, heap/native, stop/kill source |
| high CPU but low throughput | throttling, locks, I/O, retries, downstream and host steal |
| build suddenly slow | invalidated inputs, context, cache source, network, disk and emulation |
| image huge | base, build artifacts, duplicated ownership, earlier-layer deletion |
| permission denied on mount | UID/GID, mode, read-only, SELinux/AppArmor and host path |
| disk remains full | logs, writable layers, volumes, images, build cache, shared blobs, inodes |
| service name fails | network attachment, alias, embedded DNS and resolver/upstream |
| published port unreachable | listener, mapping/bind IP, bridge/NAT/firewall and cloud policy |

## Scenario Walkthroughs

### Container repeatedly exits 137

Do not conclude memory immediately. Inspect `OOMKilled`, cgroup `memory.events`, kernel log, daemon
events and stop actors. If OOM, split heap/native/page-cache use, check leak versus load, size limit
and apply admission/backpressure. If SIGKILL came from an operator/timeout, fix lifecycle instead.

### Image was deleted but disk did not recover

Check shared layer references, stopped containers, build cache, volumes, container logs and filesystem
inodes. Registry tags/blobs are separate. Choose scoped cleanup only after mapping ownership; never
use broad prune with volumes on a stateful host without validated recovery.

### Works with `curl localhost` inside but not externally

Check application bind (`127.0.0.1` versus `0.0.0.0`), container port, published host address/port,
network mode, host packet filtering and upstream security rules. `EXPOSE` alone publishes nothing.

### Graceful shutdown loses work

Verify exec-form PID 1, signal handler, stop signal/timeout, proxy traffic drain and work ownership.
Reproduce under load and measure accepted requests/jobs after termination begins.

## Required Labs

1. Trace `docker run` to host PID, namespaces, cgroup and mounts using inspect/nsenter safely.
2. Compare CPU throttle and memory OOM; record cgroup events and application latency.
3. Build a multi-stage Java image; measure cold/warm/registry-cache builds and final layers.
4. Build amd64/arm64 images and run target-architecture tests.
5. Prove a deleted-later-layer file still contributes bytes, then fix with multi-stage/same-layer cleanup.
6. Compare writable layer, volume, bind and tmpfs behavior; document ownership and persistence.
7. Back up and restore a database volume with application consistency and checksum verification.
8. Trace bridge traffic, embedded DNS, outbound NAT and a published port with packet evidence.
9. Break DNS, firewall and MTU separately; distinguish their symptoms.
10. Harden a Compose service: non-root, read-only, drop capabilities, seccomp, resource/PID limits.
11. Generate SBOM/provenance, scan and verify a signed digest in a disposable pipeline.
12. Simulate daemon restart, log saturation and crash loop; preserve evidence and recover safely.

## Top Interview Questions

**Image versus container?** An image is immutable content/config referenced by digest; a container is
a runtime instance with process, namespaces/cgroup, writable snapshot and lifecycle metadata.

**COPY versus bind mount?** COPY places data in an image layer at build time; a bind mount exposes a
daemon-host path at runtime and can obscure image content and modify the host.

**ENTRYPOINT versus CMD?** ENTRYPOINT defines executable; CMD supplies defaults/arguments and is more
readily replaced. Exec form preserves direct signal delivery.

**Why are containers lighter than VMs?** They share a host kernel and content layers instead of one
guest kernel/OS per workload, but actual memory/disk/startup differences must be measured.

**How does port publishing work?** Docker configures host binding and packet-filter/NAT/routing rules
to reach the container network endpoint; exact backend depends on configuration.

**Does non-root make a container secure?** It reduces risk but host mounts, capabilities, syscalls,
kernel vulnerabilities, socket access, secrets and application flaws remain.

**Rootless versus userns-remap?** Rootless runs daemon and containers without host root inside user
namespaces; userns-remap maps container IDs while the daemon itself remains privileged.

**Why did cache miss?** Operation or one of its inputs/platform/build args/context changed, cache was
unavailable/untrusted, or an earlier dependency vertex invalidated downstream work.

**Docker Compose versus Kubernetes?** Compose is a strong bounded/single-host declarative tool;
Kubernetes adds multi-node scheduling and reconciliation at substantial platform complexity.

**What proves production readiness?** Reproducible signed image, least privilege, bounded resources,
graceful shutdown, recoverable data, controlled logs, monitored daemon/runtime and tested incidents.

## One-Page Revision

```text
Run: CLI -> Engine API -> dockerd -> containerd -> shim -> OCI runtime -> kernel process
Isolation: namespaces + cgroups + mounts + capabilities + seccomp + LSM
Image: index/manifest -> config + content-addressed layers; tag mutable, digest immutable
Build: BuildKit dependency graph + context + cache + secret mounts + provenance
Storage: snapshot/writable CoW versus volume/bind/tmpfs persistence
Network: namespace/veth -> bridge -> route/firewall/NAT; embedded DNS on custom networks
Lifecycle: PID 1 + signals + grace + exit/OOM evidence + restart policy
Security: daemon socket + non-root/rootless + least privilege + supply chain + secrets
Operations: resources + logs + disk/inodes + backup/restore + upgrade + scoped cleanup
```

## Completion Checklist

- Draw the runtime, image, filesystem and packet paths without notes.
- Complete all twelve labs and retain raw evidence.
- Restore a stateful volume and prove correctness.
- Diagnose OOM, DNS, NAT, permissions, disk and build-cache failures under time pressure.
- Defend Docker/Compose versus Kubernetes for a workload.
- Score at least three out of four in three consecutive Docker mocks.

## Official References

- [Docker troubleshooting](https://docs.docker.com/engine/daemon/troubleshoot/)
- [Docker command-line reference](https://docs.docker.com/reference/cli/docker/)
- [Docker documentation](https://docs.docker.com/)

## Recommended Next

Return to the [Docker Beginner-To-Architect Path](../DOCKER-ARCHITECT-PATH.md), complete the labs, then compare the runtime model with Kubernetes CRI workloads.

