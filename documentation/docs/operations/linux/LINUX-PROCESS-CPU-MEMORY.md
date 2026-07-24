---
title: Linux Processes, CPU, Scheduler, Memory, And OOM
description: Diagnose process lifecycle, threads, load, CPU states, scheduling, virtual memory, page cache, pressure, swapping, leaks, and OOM kills.
difficulty: Advanced
page_type: Deep Dive
status: Generic
prerequisites: [Linux Production Troubleshooting Path]
learning_objectives: [Interpret CPU and load evidence, Trace process and thread state, Diagnose host and cgroup memory pressure]
technologies: [Linux, procfs, PSI, cgroups]
last_reviewed: "2026-07-24"
---

# Linux Processes, CPU, Scheduler, Memory, And OOM

## Process And Thread Model

A process has virtual address space, file descriptors, credentials, namespaces and resource
limits. Threads share much process state but have independent scheduling context and stacks.
`fork` creates a copy-on-write process view; `exec` replaces the program image. A zombie has
exited but awaits parent reaping; an orphan is reparented.

Useful evidence:

```bash
ps -eo pid,ppid,tid,stat,ni,psr,pcpu,pmem,rss,vsz,etime,cmd --sort=-pcpu
top -H -p <pid>
cat /proc/<pid>/status
cat /proc/<pid>/limits
ls -l /proc/<pid>/fd
```

Process states include running/runnable, interruptible sleep, uninterruptible sleep (`D`, often
I/O/kernel wait), stopped/traced, and zombie. A process in `D` cannot be fixed merely by signals;
find the blocked kernel/I/O path.

## CPU And Scheduler

CPU utilization categories commonly include user, system, idle, I/O wait, steal, IRQ and
softirq. High user time suggests application computation; high system may indicate syscall,
network or kernel work; steal indicates hypervisor contention; throttling may limit a container
despite idle host CPUs.

Load average counts runnable tasks plus some uninterruptible tasks. Load 20 is not universally
bad: compare with CPU count, queue length, task state and latency.

```bash
uptime
mpstat -P ALL 1
pidstat -u -t 1
vmstat 1
cat /proc/pressure/cpu
```

Context switches can reflect legitimate concurrency or lock/oversubscription. Inspect per-thread
CPU and application profiles. Linux nice values influence fair scheduling, while real-time
policies can starve normal work if misused. CPU affinity and NUMA placement matter only after
measurement.

## CPU Diagnosis Sequence

1. Confirm user-facing latency/error and host/container scope.
2. Compare utilization, run queue, throttling, steal, interrupts and load.
3. Identify process and thread consumers; correlate with deployment/traffic.
4. Profile or capture stack evidence using a safe duration.
5. Check downstream waits: low CPU can accompany a slow blocked service.
6. Contain via traffic/admission/rollback or bounded scale; fix algorithm/lock/config/capacity.

## Virtual Memory

Virtual memory maps process addresses to anonymous pages, file-backed pages, shared libraries,
memory maps and kernel-managed structures. RSS is resident process memory; VSZ is address-space
size and is not physical consumption. Shared-page accounting complicates summing RSS; PSS divides
shared pages proportionally.

```bash
free -h
cat /proc/meminfo
cat /proc/<pid>/smaps_rollup
pmap -x <pid>
vmstat 1
cat /proc/pressure/memory
```

“Used memory” includes useful page cache that can often be reclaimed. Focus on `MemAvailable`,
reclaim/scan, swap activity, major faults, pressure stall information (PSI), latency and OOM events.

## Page Cache, Swap, And Pressure

File reads/writes use page cache; dirty pages are flushed later. High cache is normal. Sustained
reclaim, major faults or swap-in during latency-sensitive work can indicate pressure. Swap can
provide survival headroom but severe thrashing collapses performance. Do not drop caches as a
routine fix—it destroys useful cache and hides the cause.

## OOM

The kernel or cgroup OOM mechanism kills a selected task when allocation cannot proceed within
the applicable memory domain. A container can be OOM-killed while the host has free memory.

```bash
journalctl -k --since "-30 min" | grep -i -E "oom|killed process|memory cgroup"
cat /sys/fs/cgroup/memory.current
cat /sys/fs/cgroup/memory.max
cat /sys/fs/cgroup/memory.events
```

Check process heap/native memory, page cache charged to cgroup, thread stacks, direct buffers,
tmpfs, child processes and memory limits. For JVMs, reconcile heap, metaspace, code cache,
threads, direct/native memory and container headroom.

## Leak Versus Load

Take time-series evidence. A leak tends to grow after workload normalizes and fails to return;
legitimate cache/load growth may plateau and respond to eviction/traffic. Identify allocation
owner with application tooling; OS RSS alone does not explain retained objects.

## Fork, PID, And File-Descriptor Limits

Thread/process creation can fail from PID cgroup limits, user process limits or memory. File-
descriptor exhaustion breaks accepts/files/pipes. Inspect limits and actual ownership; raising a
limit without fixing leaks merely delays failure.

```bash
cat /proc/<pid>/limits
ls /proc/<pid>/fd | wc -l
cat /sys/fs/cgroup/pids.current
cat /sys/fs/cgroup/pids.max
```

## Interview Questions

**Load is high but CPU is idle—why?** Many tasks may be in uninterruptible I/O wait, or the view
may differ across host/cgroup. Inspect task state, I/O and PSI.

**Why is `free` memory low on a healthy system?** Linux uses unused memory for page cache. Use
available/reclaim/pressure evidence rather than treating cache as a leak.

**Host has free memory but pod was OOMKilled?** The pod/container cgroup limit was exceeded or
local constraints applied. Inspect cgroup events and process/container memory composition.

## Official References

- [Linux scheduler documentation](https://docs.kernel.org/scheduler/)
- [Linux memory management](https://docs.kernel.org/mm/)
- [Control group v2](https://docs.kernel.org/admin-guide/cgroup-v2.html)
- [Pressure Stall Information](https://docs.kernel.org/accounting/psi.html)

## Recommended Next

Continue with [Filesystems, Disk, Block I/O, And Storage Incidents](./LINUX-FILESYSTEM-STORAGE.md).

