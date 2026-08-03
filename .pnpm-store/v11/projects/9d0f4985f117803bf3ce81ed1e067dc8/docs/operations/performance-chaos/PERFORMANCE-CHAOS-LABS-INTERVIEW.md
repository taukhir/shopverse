---
title: Performance And Chaos Labs, CI, Incidents, And Interviews
description: Build a test strategy, automate k6 thresholds, profile bottlenecks, inject safe faults with proxies or Kubernetes tools, run experiments, analyse results, and practise architect interviews.
difficulty: Advanced
page_type: Practice
status: maintained
prerequisites: [Performance And Chaos Engineering Path]
learning_objectives: [Implement repeatable tests, Find bottlenecks, Run guarded faults, Defend results in interviews]
technologies: [k6, JFR, Prometheus, Toxiproxy, Chaos Mesh]
last_reviewed: "2026-07-30"
scope: generic
owner: docs-operations
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Performance And Chaos Labs, CI, Incidents, And Interviews

## Test Plan Template

Record objective, topology, versions, dataset, warm-up, arrival mix, duration, SLO/invariants, metrics,
abort conditions and comparison baseline. Run smoke tests per change, bounded load gates for release
candidates, and scheduled longer stress/soak/failure tests in representative isolated capacity.

## Fault Experiment Template

```text
steady state: successful checkout >= 99.5%, no duplicate charge
hypothesis: one payment instance loss is absorbed within 30 seconds
fault: terminate one selected Pod during 200 requests/s for 5 minutes
abort: error rate > 2% for 60 seconds or reconciliation divergence
observe: client, gateway, app, Kafka, DB, Kubernetes and business ledger
recover: stop fault, restore capacity, reconcile, verify no duplicate/missing state
```

## Required Labs

1. Compare closed VUs with constant arrival rate and explain the different overload picture.
2. Find the first saturated pool/queue using k6, Prometheus and JFR.
3. Run spike and soak tests; detect autoscaling delay and memory/log/disk growth.
4. Introduce network latency/loss with Toxiproxy and verify timeout/retry budgets.
5. Kill a Kubernetes Pod and node during load; measure error and recovery.
6. Break DNS, expire a certificate and exhaust a connection pool independently.
7. Slow Cassandra/Oracle/Kafka and prove backpressure rather than retry amplification.
8. Run a storage or zone-loss recovery exercise with correctness reconciliation.
9. Add CI smoke thresholds and a scheduled performance baseline with regression comparison.
10. Produce an executive result: supported rate, headroom, limiting resource and next investment.

## Common Invalid Results

- generator saturated or colocated with target;
- cache/database already warm when real traffic is cold, or vice versa;
- test data avoids contention/hot keys;
- average hides tail and error retries;
- achieved arrival rate falls below target;
- dependency stub removes the actual bottleneck;
- no correctness assertion, so fast errors look successful;
- environment has different resources/network/storage from production;
- one run is treated as certainty.

## Interview Questions

**Latency rose and throughput flattened—what next?** Find the saturated queue/resource and its upstream
arrival versus service rate; inspect pools, throttling, GC, database/network and retries before scaling.

**How much headroom?** Derive from peak uncertainty, autoscaling/recovery time, zone/node loss, rollout surge
and SLO—not a universal percentage.

**Chaos versus ordinary fault testing?** Chaos engineering starts from a measurable steady-state hypothesis
and controlled experiment; both require safety, but chaos emphasizes systemic learning under uncertainty.

**How do you prove recovery?** User SLO returns, queues/lag drain within budget, resources stabilize and
business reconciliation shows no missing/duplicate/corrupt state.

## Additional Production Interview Questions

### Latency, throughput, concurrency, utilization, and saturation?

Latency is time per operation, throughput is completed work per time, and concurrency is in-flight work.
Utilization is how busy a resource is; saturation is queued or rejected demand beyond immediate capacity.
Throughput can flatten while latency and queues rise once the bottleneck saturates.

### How does Little's Law help capacity analysis?

For a stable system, average concurrency is arrival rate multiplied by average time in system. Use consistent
units and include queueing time. It is a diagnostic relationship, not permission to assume stationarity during
overload, retries or rapidly changing traffic.

### Why are percentiles and coordinated omission important?

Tail percentiles expose slow user experiences hidden by averages. A closed-loop generator can stop sending
while responses are slow and omit the waits real arrivals would experience. Use an arrival-rate model where
appropriate and report achieved rate, errors and the complete latency distribution.

### Load, stress, spike, and soak tests?

Load verifies expected demand and SLOs; stress discovers the limit and degradation behavior; spike tests sudden
change and recovery; soak finds leaks, growth and cumulative failure over time. Each needs representative data,
topology, warm state and correctness assertions.

### How do you find the first bottleneck?

Reproduce a controlled workload, confirm the generator and achieved arrival rate, locate the first growing
queue or saturated resource, correlate upstream/downstream signals and profile that boundary. Change one factor
and rerun the same baseline instead of scaling every component simultaneously.

### CPU profile versus wall-clock profile?

A CPU profile finds code consuming processor time; a wall-clock profile also exposes blocking, sleeps, locks,
I/O and queue waits. A low-CPU slow service often needs wall-clock, thread, pool and dependency evidence rather
than micro-optimizing methods absent from the critical path.

### How do GC and native memory affect latency?

Heap allocation and GC can cause CPU pressure or pauses, but process memory also includes metaspace, code cache,
thread stacks, direct buffers and mapped pages. Correlate GC/JFR, RSS, cgroup events and allocation evidence;
do not infer a heap leak from container memory alone.

### Why can a larger connection pool reduce throughput?

More connections can increase database contention, lock waits, context switching and memory while moving the
queue downstream. Bound concurrency from database capacity and latency targets, measure checkout wait and query
time separately, and use backpressure instead of unlimited waiting.

### How should capacity headroom be chosen?

Model peak and growth uncertainty, autoscaling/provisioning delay, failover loss, rollout surge, retry traffic,
dependency quotas and SLO. Validate the resulting margin with load and failure tests; a universal percentage is
not defensible.

### When is a performance result trustworthy?

Versions, topology, dataset, generator capacity, workload mix, warm-up and environment must be recorded.
Report achieved traffic, errors, percentiles, resource limits, correctness, variance and confidence across
repeat runs. A faster response made of errors or missing work is not an improvement.

## Official References

- [k6 testing guides](https://grafana.com/docs/k6/latest/testing-guides/)
- [Toxiproxy](https://github.com/Shopify/toxiproxy)
- [Chaos Mesh documentation](https://chaos-mesh.org/docs/)

## Recommended Next

Return to the [Performance And Chaos Engineering Path](../PERFORMANCE-CHAOS-ENGINEERING-PATH.md) and apply all ten labs to the integrated capstone.
