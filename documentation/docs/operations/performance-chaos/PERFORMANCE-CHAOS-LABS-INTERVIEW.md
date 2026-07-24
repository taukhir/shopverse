---
title: Performance And Chaos Labs, CI, Incidents, And Interviews
description: Build a test strategy, automate k6 thresholds, profile bottlenecks, inject safe faults with proxies or Kubernetes tools, run experiments, analyse results, and practise architect interviews.
difficulty: Advanced
page_type: Practice
status: Generic
prerequisites: [Performance And Chaos Engineering Path]
learning_objectives: [Implement repeatable tests, Find bottlenecks, Run guarded faults, Defend results in interviews]
technologies: [k6, JFR, Prometheus, Toxiproxy, Chaos Mesh]
last_reviewed: "2026-07-24"
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

## Official References

- [k6 testing guides](https://grafana.com/docs/k6/latest/testing-guides/)
- [Toxiproxy](https://github.com/Shopify/toxiproxy)
- [Chaos Mesh documentation](https://chaos-mesh.org/docs/)

## Recommended Next

Return to the [Performance And Chaos Engineering Path](../PERFORMANCE-CHAOS-ENGINEERING-PATH.md) and apply all ten labs to the integrated capstone.

