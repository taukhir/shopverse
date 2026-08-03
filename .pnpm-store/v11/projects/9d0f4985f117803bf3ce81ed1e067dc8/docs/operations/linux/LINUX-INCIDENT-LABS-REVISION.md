---
title: Linux Production Incident Labs, Interview Questions, And Revision
description: Use safe diagnostic workflows, incident scenarios, hands-on labs, interview questions, and a revision sheet for Linux production engineering.
difficulty: Advanced
page_type: Interview
status: maintained
prerequisites: [Linux Services Network And Containers]
learning_objectives: [Run Linux incident triage, Complete diagnostic labs, Answer production troubleshooting interviews]
technologies: [Linux, systemd, procfs, cgroups]
last_reviewed: "2026-07-30"
scope: generic
owner: docs-operations
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Linux Production Incident Labs, Interview Questions, And Revision

## Five-Minute Triage

1. Identify impact, start time, affected host/container/service and correctness risk.
2. Record recent deploy/config/kernel/node/storage/security changes.
3. Check uptime/load, CPU states, memory/pressure, disk/inodes, I/O, sockets and kernel/service logs.
4. Compare with a healthy host/instance and inspect the top owning process/thread/cgroup.
5. Contain amplification or fail over before invasive diagnosis.

```bash
date -Is
uptime
vmstat 1 5
free -h
df -hT
df -i
ss -s
systemctl --failed
journalctl -k --since "-15 min" --no-pager
```

This is a starting sample, not a script to run blindly on every environment.

## Scenario Questions

**CPU 100% after deployment.** Compare version/traffic, user/system/steal/throttle, per-process and
thread CPU, queues and profile. Roll back/shed load if impact is severe, then fix the hot path,
lock, loop or configuration and validate under load.

**Load 50, CPU 20%.** Inspect uninterruptible tasks, I/O PSI/device latency, network storage,
kernel logs and blocked process stacks. Load includes more than CPU demand.

**Memory steadily rises.** Determine host versus cgroup, RSS/PSS/anonymous/file/tmpfs, workload
correlation, reclaim/swap/PSI and application allocation/heap/native evidence. Contain before OOM;
fix retained owner or limit/cache policy.

**Disk full after log deletion.** Compare `df`/`du`, find deleted-open files, verify rotation/reopen,
then release through owning process safely and repair logging retention.

**Intermittent connection refused.** Refusal means reachable endpoint rejected/no listener. Check
listener lifecycle/readiness, selected IP/port, backlog, restarts, load balancer/endpoints and namespace.

**Process ignores SIGTERM.** Inspect handler/thread state, uninterruptible I/O, child process,
systemd stop mode and deadline. Preserve evidence; SIGKILL skips cleanup and can corrupt/invalidate work.

## Hands-On Labs

Use an isolated VM/container lab with explicit cleanup and resource limits:

1. Create CPU-bound and lock/contention workloads; distinguish process/thread CPU and throttling.
2. Allocate memory inside a limited cgroup; observe `memory.events`, PSI and OOM selection.
3. Exhaust file descriptors and PIDs; diagnose exact limit and leak behavior.
4. Fill a disposable filesystem by bytes and by inodes; create a deleted-open file.
5. Generate sequential/random I/O and observe queue, latency and process ownership.
6. Build a failing systemd unit with wrong user/environment/working directory and repair it.
7. Run a service in a network namespace; diagnose listen address, route and firewall.
8. Diagnose a container OOM/throttle/disk/DNS problem from both container and host views.

## Command Interpretation Questions

- `top`: which time window, thread/process, cgroup and CPU normalization?
- `free`: available versus cache, host versus container view?
- `vmstat`: runnable, blocked, swap, I/O, interrupts and context switches?
- `iostat`: which device layer, queue and latency metric under which workload?
- `ss`: listener/connection state, local/remote endpoint and owning process?
- `journalctl`: correct boot/unit/time and persistent/rotated logs?
- `/proc`: snapshot race, permissions, namespace and kernel-version meaning?

## Production Interview Questions

### Load average versus CPU utilization?

Linux load includes runnable tasks and tasks in uninterruptible wait, commonly storage I/O. High load with low
CPU can therefore indicate blocked work. Compare run queue, blocked tasks, PSI, device latency and per-thread
state before adding CPU.

### Free memory, available memory, page cache, swap, and OOM?

Linux uses spare memory for reclaimable cache, so `free` alone is misleading; `MemAvailable`, reclaim pressure,
swap activity and PSI better show risk. A cgroup can OOM below host capacity. Identify the selected process and
heap/native/file/tmpfs consumers before changing limits.

### Process, thread, PID, and file-descriptor limits?

A process owns an address space and resources; threads share much of that state but have distinct scheduling
and stacks. PID/cgroup task limits and per-process/system file tables are finite. Inspect the exact limit and
owner rather than raising it over a leak.

### Disk bytes versus inode exhaustion?

`df -h` reports allocated blocks while `df -i` reports inodes; either can prevent writes. `du` sees reachable
paths and can disagree with `df` because of deleted-open files, mounts, snapshots or reserved blocks. Find the
owning process and filesystem before cleanup.

### What does high I/O wait mean?

It indicates CPU idle time while tasks await I/O, but it does not name the device or root cause. Correlate
process I/O, device queue/latency/utilization, filesystem, network storage and kernel errors. Cache misses,
writeback, throttling and storage contention have different remedies.

### SIGTERM versus SIGKILL?

SIGTERM is catchable and enables graceful drain/checkpoint/cleanup; SIGKILL cannot be handled and immediately
stops execution. PID 1 and supervisors affect signal forwarding and child reaping. Use KILL only as bounded
containment after considering data and evidence loss.

### Why does a systemd service work in a shell but fail as a unit?

The unit may have a different user, environment, working directory, PATH, limits, capabilities, namespace and
sandbox. Inspect the effective unit, journal, exit status and dependency ordering; do not copy an interactive
shell environment or run it as root as the default fix.

### Permission denied despite apparently correct mode bits?

Check every parent directory traversal bit, effective UID/GID and supplementary groups, ACLs, mount flags,
read-only state, capabilities and SELinux/AppArmor policy. Container user-namespace mappings and host volume
ownership can make numeric identities differ from expectations.

### LISTEN, ESTABLISHED, TIME_WAIT, and CLOSE_WAIT?

LISTEN accepts new connections; ESTABLISHED has an active connection; TIME_WAIT protects correctness after an
active close; CLOSE_WAIT means the peer closed but the local application has not. Persistent CLOSE_WAIT often
indicates a local close leak, while TIME_WAIT alone is not a leak.

### Host view versus container/cgroup view?

Namespaces alter visible processes, networks, mounts and hostnames; cgroups bound CPU, memory, PIDs and I/O.
Host tools may show spare capacity while the container throttles or OOMs. Correlate container metrics with the
owning host cgroup, kernel, storage and network namespace.

## One-Page Revision

- Scope host/process/container/cgroup and establish timeline before action.
- Load includes runnable and uninterruptible work; CPU percent alone is incomplete.
- RSS is resident, VSZ address space, PSS apportioned shared memory; page cache is useful.
- cgroup OOM/throttling can occur with idle/free host resources.
- `df` allocation and `du` reachable files diverge with deleted-open files/mounts/snapshots.
- Inode exhaustion prevents new files even with free bytes.
- I/O diagnosis needs process + device latency/queue + kernel/storage evidence.
- systemd changes user, environment, working directory, limits and sandboxing.
- Network namespaces/routes/firewalls mean “works on host” may not work in container.
- SIGKILL/restart/delete/cache-drop are containment at best and can destroy evidence/data.

## Evidence Checklist

- exact timestamps and affected scope;
- SLO/user impact and recent change;
- process/thread/cgroup ownership;
- CPU/memory/I/O/network/kernel evidence;
- containment and why it was safe;
- root mechanism and propagation;
- data integrity/reconciliation result;
- correction, regression test, alert/runbook and owner.

## Official References

- [Linux man-pages project](https://www.kernel.org/doc/man-pages/)
- [Linux kernel admin guide](https://docs.kernel.org/admin-guide/)
- [systemd troubleshooting](https://www.freedesktop.org/wiki/Software/systemd/Debugging/)

## Recommended Next

Return to the [Linux Production Troubleshooting Path](../LINUX-PRODUCTION-TROUBLESHOOTING-PATH.md) and complete the labs in an isolated environment.
