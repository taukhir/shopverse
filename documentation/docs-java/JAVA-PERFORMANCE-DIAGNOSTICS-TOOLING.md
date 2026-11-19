---
title: Java Performance Diagnostics And Tooling
description: Evidence-first runbook for CPU, latency, heap, native memory, GC, allocation, contention, pools, I/O, file descriptors, containers, JFR, JMC, and async-profiler.
difficulty: Advanced
page_type: Guide
status: maintained
prerequisites: [JVM memory, Java concurrency, Linux fundamentals]
learning_objectives: [Collect safe production evidence, Select the correct JVM and OS tool, Diagnose and verify common Java performance failures]
technologies: [Java, JFR, JMC, jcmd, async-profiler, Linux, Kubernetes]
last_reviewed: "2026-07-28"
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Java Performance Diagnostics And Tooling

**Performance diagnosis** is the evidence-driven process of locating the
resource, queue, dependency, or runtime mechanism responsible for a measurable
symptom. It begins with user impact and a time window, not with a preferred JVM
flag or profiler.

## Page Overview

The workflow moves from customer impact and incident preservation to OS/cgroup
triage, JVM snapshots, thread states, GC/allocation, JFR, async-profiler, heap and
native memory, pools, and dependencies. A symptom matrix selects the next safe
piece of evidence; verification closes the loop against the original workload.

## What Is A Performance Symptom?

A symptom is an observed deviation such as increased p99 latency, reduced
throughput, errors, high CPU, memory growth, long pauses, or queue saturation.
The same symptom can have different causes: high latency may come from CPU,
locks, garbage collection, database waits, network waits, throttling, or an
overloaded executor.

## Diagnostic Mental Model

Use this sequence instead of changing heap, thread or pool sizes from intuition:

```text
symptom -> customer/time scope -> OS and cgroup -> JVM overview
        -> threads/allocations/GC -> dependencies -> code profile
        -> containment -> controlled correction -> load verification
```

## Prerequisites

Read [JVM Architecture](./JAVA-JVM-ARCHITECTURE-OPERATIONS.md),
[JVM Memory Areas](./JAVA-JVM-MEMORY.md), and
[Java Containers Resource Limits](./JAVA-CONTAINERS-RESOURCE-LIMITS.md). This page
teaches tool selection; it does not repeat the implementation of every JVM
subsystem those tools observe.

## Preserve The Incident

Record service/version, pod/node/PID, start time, traffic, SLO impact, recent
deploy/config change and wall-clock interval. Prefer JFR, metrics and short
profiles before disruptive heap dumps. Check available disk before writing a
recording or dump; dumps can pause and contain sensitive data.

## OS And Container Triage

| Question | Tools/evidence |
|---|---|
| CPU saturation or one hot thread? | `top`, `top -H -p PID`, `pidstat -p PID -t 1` |
| memory, reclaim or swap? | `free`, `vmstat 1`, cgroup memory events |
| disk wait? | `iostat -xz 1`, `pidstat -d` |
| socket/listener pressure? | `ss -s`, `ss -tanp`, application pool metrics |
| file descriptors? | `lsof -p PID`, `/proc/PID/limits`, FD count |
| kernel/OOM kill? | `dmesg`, Kubernetes events and pod termination reason |
| container limits/throttling? | `docker stats`, `kubectl top`, pod spec, cgroup CPU throttling |
| syscall/native wait? | bounded `strace` or `perf` with production approval |

Do not assume high load average means Java CPU. It can reflect runnable or
uninterruptible I/O work. Do not assume Kubernetes `OOMKilled` means Java heap
exhaustion; the cgroup kills on total process/container memory.

## JVM Snapshot With `jcmd`

```bash
jcmd <pid> VM.version
jcmd <pid> VM.flags
jcmd <pid> VM.command_line
jcmd <pid> VM.system_properties
jcmd <pid> GC.heap_info
jcmd <pid> GC.class_histogram
jcmd <pid> Thread.print -l
jcmd <pid> VM.native_memory summary
```

Availability depends on JVM and launch configuration. Native Memory Tracking must
be enabled before the incident to provide its detailed accounting.

## Thread Diagnosis

Capture at least three thread dumps separated by a short interval:

```bash
jcmd <pid> Thread.print -l
jstack -l <pid>
```

Look for the same RUNNABLE stack repeatedly, monitor ownership, deadlocks, many
threads waiting for one pool, long socket reads, queue consumers that are not
draining and thread-local retention. Map a hot native thread ID from OS output to
the hexadecimal `nid` in the dump.

Thread state alone is not a diagnosis: `RUNNABLE` may be executing Java, native
code or waiting in some I/O paths; `WAITING` may be healthy parking.

## GC And Allocation

Enable unified GC logging with an appropriate rotation policy. During an
incident, use JFR and, where available:

```bash
jstat -gcutil <pid> 1000
jstat -gc <pid> 1000
```

Correlate allocation rate, young/full collections, promotion, concurrent-cycle
progress, pause distribution, old occupancy after collection and humongous
allocations with request latency. Frequent GC may mean high allocation rather
than a leak; a leak means unwanted objects remain reachable.

## Java Flight Recorder

JFR is the preferred broad, low-overhead production evidence source:

```bash
jcmd <pid> JFR.start name=incident settings=profile duration=120s filename=/safe/path/incident.jfr
jcmd <pid> JFR.check
```

Analyze with Java Mission Control. Inspect CPU samples, allocation samples,
object statistics, monitor contention, thread parks, socket/file I/O, GC pauses,
safepoints, exceptions, class loading and compilation. Apply data-access controls
to recordings.

## async-profiler

Use a compatible, approved build and the syntax for that installed version.
Common investigations include:

```bash
asprof -e cpu -d 60 -f /safe/path/cpu.html <pid>
asprof -e alloc -d 60 -f /safe/path/alloc.html <pid>
asprof -e lock -d 60 -f /safe/path/lock.html <pid>
asprof -e wall -d 60 -f /safe/path/wall.html <pid>
```

CPU profiles locate on-CPU paths; wall profiles include waiting/blocking;
allocation profiles find allocation pressure; lock profiles reveal contention.
Compare profiles for the same workload before and after a change.

## Heap Investigation

Start with class histograms and allocation evidence. Take a heap dump only when
needed and after evaluating pause, disk and sensitive-data risk:

```bash
jcmd <pid> GC.class_histogram
jcmd <pid> GC.heap_dump /safe/path/application.hprof
```

Use Eclipse Memory Analyzer or equivalent to inspect dominator tree, retained
heap, paths to GC roots, duplicate objects, unbounded caches, thread locals,
class-loader retention and growing collections. Compare multiple points in time;
a single large collection may be valid workload state.

## Heap Versus Native Memory

Process RSS includes heap, metaspace, code cache, thread stacks, direct buffers,
GC structures, JNI libraries and mapped files. If RSS grows while heap stays
stable, inspect NMT, thread count/stack size, direct-buffer metrics, class loaders,
native libraries and mappings.

```bash
java -XX:NativeMemoryTracking=summary ...
jcmd <pid> VM.native_memory baseline
jcmd <pid> VM.native_memory summary.diff
```

NMT does not account for every possible native allocator, so reconcile it with OS
RSS/cgroup evidence.

## Symptom Matrix

| Symptom | First hypotheses | Strong evidence |
|---|---|---|
| CPU 100% | hot loop, serialization, GC, contention | per-thread CPU, JFR/CPU flame graph, GC time |
| latency high, CPU low | blocking I/O, pool wait, locks, DNS/TLS | wall profile, thread dumps, traces, pool wait |
| heap grows after full GC | retained leak or legitimate live set | post-GC trend, heap dump dominators/roots |
| frequent GC | allocation pressure or small young/heap sizing | allocation JFR, GC logs |
| long GC pauses | live-set/collector/heap pressure | pause phases, occupancy, safepoint evidence |
| many blocked threads | monitor or pool contention | repeated dumps, JFR locks, pool metrics |
| low throughput | saturated dependency/pool/CPU or serialization | queueing, profiles, dependency p99 |
| native memory grows | threads, direct buffers, metaspace/JNI | RSS, NMT diff, thread count, class loaders |
| metaspace exhaustion | class-loader leak or excessive generated classes | class loading JFR, NMT, heap paths to loaders |
| direct-buffer exhaustion | unbounded/off-heap buffer retention | NMT/RSS, direct-buffer metrics, ownership profile |
| file-descriptor exhaustion | socket/file leak | FD counts/types, connection lifecycle |
| pod `OOMKilled` | total cgroup memory exceeded | cgroup events, pod status, heap/NMT/RSS |
| intermittent freeze | GC/safepoint, DNS, I/O, host steal/throttle | JFR timeline, GC logs, OS/cgroup data |
| app healthy but slow | wrong health signal, queueing or throttling | business SLI, queue age, CPU throttle, traces |
| slow startup/class loading | classpath scan, verification, generated classes, I/O | JFR class loading, startup steps, filesystem/profile |
| warmed service regresses | deoptimization, code-cache pressure, changed profile | JFR compilation/deoptimization, code-cache metrics |

## Pools And Queueing

Measure active/idle/waiting connections, acquisition time, executor active/max,
queue depth/oldest age, rejection count and downstream saturation. Increasing a
pool can transfer overload to the database or API. Bound admission and size from
the actual bottleneck and latency objective.

## Tools And Their Roles

| Tool | Best use |
|---|---|
| JFR/JMC | correlated JVM timeline and general production profiling |
| `jcmd` | JVM commands, threads, heap, JFR and NMT |
| `jstack` | portable thread snapshots/deadlocks |
| `jstat` | lightweight GC trend sampling |
| `jmap` | compatibility/diagnostic heap and histogram operations; prefer `jcmd` where supported |
| heap dump + MAT | retained-object investigation |
| async-profiler | CPU, wall, allocation and lock flame graphs |
| VisualVM | interactive local/controlled JVM exploration |
| Arthas | approved live JVM inspection and method-level diagnosis |
| `perf` | kernel/native CPU evidence |
| Micrometer/Prometheus/Grafana | continuous metrics and trends |
| OpenTelemetry/APM | cross-service request and dependency evidence |

Commercial APM platforms such as Datadog, Dynatrace and New Relic can provide
continuous correlation, but validate their sampling, agent overhead, security and
cardinality behavior. They complement—not replace—JFR, OS and business evidence.

## Verification

Reproduce the same workload, compare throughput and p50/p95/p99, CPU, allocation,
GC, pool/queue saturation, errors and business SLI. Change one variable, retain
profiles, test failure behavior, define rollback and ensure the improvement is not
merely shifted to another resource.

## Failure Modes And Trade-Offs

- CPU samples explain on-CPU work, not time spent waiting; wall-clock evidence,
  traces, and thread states answer different questions.
- Heap dumps expose retention paths but can pause the process, consume large
  disk space, and contain customer-sensitive values.
- High-detail recording adds overhead and storage pressure; choose event settings
  and duration from the incident question.
- A faster isolated method may not improve request latency if the bottleneck is
  a queue, dependency, lock, database, network, or CPU quota.
- A change is verified only against the original workload, time window, SLO,
  resource measurements, and regression boundaries.

## Tricky Interview Questions

<ExpandableAnswer title="Why can low CPU coexist with severe request latency?">

Threads may be parked behind locks, queues, connection pools, throttling, I/O, or
downstream calls. Correlate wall-clock profiles, thread states, queue age, pool
wait time, and traces instead of treating low CPU as healthy execution.

</ExpandableAnswer>

<ExpandableAnswer title="When is a heap dump the wrong first diagnostic?">

When the symptom is CPU, waiting, native memory, or an unstable incident where a
large pause and disk write add risk. Begin with bounded metrics, JFR, histograms,
NMT, and OS evidence matched to the question.

</ExpandableAnswer>

<ExpandableAnswer title="What evidence is required before increasing a pool?">

Show pool wait and queue saturation, identify the downstream capacity boundary,
model the extra concurrency, and define rollback. A larger pool can amplify
database or dependency overload while making local queue metrics look better.

</ExpandableAnswer>

## Recommended Next

Continue with [JVM Profiling, GC And Native Memory](./JVM-PROFILING-GC-NATIVE.md).

## Official References

- [Oracle `jcmd` command](https://docs.oracle.com/en/java/javase/25/docs/specs/man/jcmd.html)
- [Oracle Native Memory Tracking](https://docs.oracle.com/en/java/javase/25/vm/native-memory-tracking.html)
- [JDK Flight Recorder runtime guide](https://docs.oracle.com/en/java/javase/25/jfapi/)
