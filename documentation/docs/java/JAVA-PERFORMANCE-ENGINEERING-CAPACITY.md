---
title: Java Performance Engineering Capacity And Evidence
description: Production Java performance method covering workload models, queues, CPU, allocation, GC, locks, I/O, JFR, JMH, capacity calculations, load tests, and incident proof.
difficulty: Advanced
page_type: Deep Dive
status: Generic
prerequisites: [JVM architecture, Concurrency, GC fundamentals]
learning_objectives: [Build a performance model, Distinguish bottleneck classes, Use JFR and JMH correctly, Size bounded resources, Prove improvements experimentally]
technologies: [Java 21+, JFR, JMC, jcmd, JMH, JVM]
last_reviewed: "2026-07-28"
---

# Java Performance Engineering Capacity And Evidence

Performance engineering starts with a workload and an objective—not a JVM flag. State the
arrival rate, concurrency, payload distribution, read/write mix, dependency latency,
warm-up behavior and SLO before changing code or runtime configuration.

## Latency Decomposition

```text
end-to-end latency = queueing + CPU execution + allocation/GC + locks
                   + file/network I/O + downstream queueing + retries
```

An application can have low CPU because threads are waiting on sockets, locks, pool
admission or rate limits. High CPU may be useful work, compilation, allocation/GC,
serialization, crypto, logging or a spin loop. Measure before classifying.

## Capacity Relationships

Little's Law provides a useful steady-state relationship:

```text
concurrency ~= throughput * average response time
```

At 800 requests/s and 250 ms average latency, roughly 200 requests are in flight. If a
downstream pool has 40 permits, excess work queues elsewhere. Raising the web-thread count
cannot create downstream capacity.

For a bounded executor:

```text
admission = active workers + bounded queue
```

Define rejection, timeout and caller behavior when both are full. An unbounded queue turns
overload into latency and memory growth.

## Evidence Ladder

1. service-level rate, errors and latency percentiles;
2. queue depth, pool utilization and dependency latency;
3. process/container CPU, memory, throttling and network;
4. JVM heap, allocation, GC, threads, locks and compilation;
5. JFR/profile stacks and object-allocation sites;
6. controlled load or benchmark reproducing the hypothesis.

Compare good and bad intervals using the same traffic class.

## JFR And `jcmd`

JFR records timestamped JVM/application events suitable for production diagnosis. Useful
signals include CPU load, method samples, allocation, GC pauses, monitor enter/wait,
thread park/sleep, file/socket I/O, exceptions and class loading.

```bash
jcmd PID JFR.start name=incident settings=profile duration=120s filename=incident.jfr
jcmd PID Thread.print -l
jcmd PID GC.heap_info
jcmd PID VM.native_memory summary
jcmd PID VM.classloader_stats
```

Use commands supported by the deployed JDK and assess collection impact. Native Memory
Tracking must be enabled appropriately before it can provide the requested detail.

## Bottleneck Decision Table

| Observation | Test next |
|---|---|
| CPU saturated, runnable threads | hot stacks, algorithm, serialization, crypto, logging |
| low CPU, many parked threads | pool/queue, downstream wait, virtual-thread pinning |
| rising allocation and frequent GC | allocation sites, object lifetime, batching |
| long old-generation pauses | live-set size, collector goals, heap headroom |
| monitor contention | lock owner, critical-section duration and scope |
| connection pool saturated | query/API latency, transaction scope, leak and admission |
| container throttling | CPU limits versus requested throughput |
| p99 only degrades | coordinated omission, retries, pauses, skew or rare dependency tail |

## JMH Correctness

Microbenchmarks must account for warm-up, dead-code elimination, constant folding, state
scope and forks. Use JMH rather than wall-clock loops, consume results, and benchmark the
realistic operation. A microbenchmark does not predict queueing, network or database
behavior of the complete service.

## Virtual Threads

Virtual threads reduce the cost of representing blocking concurrent tasks; they do not
increase CPU, connection, database or remote-service capacity. Keep downstream admission
bounded with semaphores/rate limits. Diagnose carrier pinning and excessive `ThreadLocal`
state from JFR and runtime evidence.

## Load-Test Design

- define closed versus open workload and arrival distribution;
- include realistic payload/key skew and dependency behavior;
- warm the JVM and caches separately from steady-state measurement;
- measure client-side latency without coordinated omission;
- test saturation, recovery, dependency slowdown and cancellation;
- preserve configuration, commit, environment and JFR for comparison;
- change one primary variable per experiment.

## Interview Questions

**Why can increasing a thread pool reduce throughput?** More runnable work can increase
context switching, contention and downstream queueing while exceeding the actual resource
capacity.

**How do you distinguish a leak from insufficient heap?** Observe retained/live-set growth
across full collections and use allocation/old-object/heap-dominator evidence; one OOM or
high used-heap sample alone is insufficient.

**What proves an optimization worked?** Repeated comparable tests show the target SLO or
resource improvement without correctness regression or displaced bottlenecks.

## Official References

- [JDK 25 troubleshooting guide](https://docs.oracle.com/en/java/javase/25/troubleshoot/)
- [JDK diagnostic tools](https://docs.oracle.com/en/java/javase/25/troubleshoot/diagnostic-tools.html)
- [Troubleshoot performance with JFR](https://docs.oracle.com/en/java/javase/25/troubleshoot/troubleshoot-performance-issues-using-jfr.html)

