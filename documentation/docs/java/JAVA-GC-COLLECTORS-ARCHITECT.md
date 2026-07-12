---
title: JVM Garbage Collectors For Architects
description: Serial, Parallel, G1, ZGC and Shenandoah algorithms, failure modes, selection, logs, and migration decisions.
---

# JVM Garbage Collectors For Architects

Collector selection is an SLO and capacity decision. Compare the same live set,
allocation rate, heap/container limit and request load; never compare marketing
pause claims from unrelated workloads.

## Shared Mechanics

Collectors find live objects from roots, maintain reachability while the
application mutates references, reclaim dead space, and sometimes relocate live
objects. Generational collectors exploit the weak generational hypothesis.
Write barriers/card tables/remembered sets avoid scanning all old objects for
young references. Concurrent collectors require barriers to preserve marking or
relocation invariants. Safepoints coordinate phases requiring a consistent VM view.

## Serial GC

Serial uses one GC worker and stop-the-world collection. Its low coordination
overhead fits small heaps, constrained CPUs and short-lived tools. It is unsuitable
for large latency-sensitive heaps because pause work cannot use multiple cores.
Select it deliberately for footprint/simplicity, not because “single threaded”
means universally slow.

## Parallel GC

Parallel uses multiple workers during stop-the-world young and old collections,
optimizing application throughput. It is appropriate for batch/compute workloads
with pause tolerance. More GC threads consume CPU and can interfere under container
quotas. Tune from throughput and pause evidence, with adequate old-generation
headroom to prevent expensive full collections.

## G1

G1 divides the heap into regions. Young evacuations copy survivors; concurrent
marking estimates old-region liveness; mixed collections combine young regions
with selected old regions. Remembered sets track cross-region references. The
pause target guides region selection—it is not a deadline.

Humongous objects occupy special region sequences and can increase fragmentation
or trigger earlier cycles. Evacuation failure indicates insufficient destination
space during copying; inspect live-set/headroom, region pressure and allocation,
not just increase pause targets blindly.

## ZGC

ZGC performs marking and relocation mostly concurrently, using colored/metadata
references and load barriers whose implementation evolves by JDK. Pauses remain
small across large heaps, while concurrent CPU and memory headroom are required.
Generational ZGC changes young/old behavior in current releases; document the exact
JDK. It is attractive for strict tail latency when sufficient CPU/headroom exists.

## Shenandoah

Shenandoah performs concurrent marking and evacuation using forwarding/barrier
techniques, aiming for pause times weakly related to heap size. Availability and
support depend on the JDK distribution. Degenerated/full fallback indicates the
concurrent collector could not keep up or obtain space; diagnose allocation,
live set and headroom.

## Selection Matrix

| Requirement | Starting candidate |
|---|---|
| tiny heap/tool/one CPU | Serial |
| maximum batch throughput, pauses tolerated | Parallel |
| balanced server default | G1 |
| very low pauses and large heap | ZGC |
| low pauses with supported distribution | Shenandoah |

## Migration And Logs

Enable `-Xlog:gc*,safepoint` and capture JFR. Compare allocation rate, live-set
after collection, application throughput, p95/p99, pause causes, concurrent GC
CPU, promotion/evacuation failures and RSS. Roll out under representative traffic
with rollback flags. A collector change cannot fix unbounded caches or retained
class loaders.

## Tricky Interview Questions

1. Is G1's pause target guaranteed? No.
2. Why might ZGC worsen throughput? Concurrent barriers/work consume CPU and headroom.
3. Does “full GC” mean identical work for every collector? No.
4. What causes evacuation failure? Insufficient suitable destination space while live objects must move.
5. Why can adding heap increase latency? More live data/longer cycles and less container headroom may result.

## Official References

- [HotSpot GC tuning guide](https://docs.oracle.com/en/java/javase/25/gctuning/)
- [JEP 439: Generational ZGC](https://openjdk.org/jeps/439)
- [Shenandoah project](https://openjdk.org/projects/shenandoah/)

## Recommended Next

Run the collector workload from [Executable Labs](./JAVA-EXECUTABLE-LABS.md).
