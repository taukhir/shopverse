---
title: Performance And Chaos Engineering Architect Path
description: Workload modelling, k6 and JVM testing, smoke/load/stress/spike/soak/breakpoint tests, coordinated omission, thresholds, distributed generation, profiling, fault injection, chaos safety, CI, labs, and interviews.
difficulty: Advanced
page_type: Learning Path
status: Generic
prerequisites: [Observability, SLOs, Distributed systems]
learning_objectives: [Design valid performance experiments, Correlate bottlenecks across layers, Run safe chaos experiments, Produce defensible capacity evidence]
technologies: [k6, Gatling, JFR, Prometheus, Toxiproxy, Chaos Mesh]
last_reviewed: "2026-07-24"
---

# Performance And Chaos Engineering Architect Path

Performance testing asks how the system behaves under a defined workload; chaos engineering tests
whether it preserves an explicit steady state under controlled failure. Neither is “send traffic and
look at CPU.” Define user journey, arrival model, data, dependency behavior, SLO, correctness invariant,
environment, abort threshold and recovery evidence first.

## Workload Models

- smoke proves script/environment correctness;
- average-load validates expected sustained operation;
- stress crosses planned capacity;
- spike tests abrupt arrival and recovery;
- soak finds leaks, compaction, rotation and slow degradation;
- breakpoint locates saturation/failure shape;
- failover/chaos combines traffic with one bounded fault.

Open models control arrival rate; closed models control concurrent virtual users and can hide overload when
response time rises. Track achieved rate, queueing, retries and dropped iterations. Avoid coordinated omission
by using tools/models that continue representing expected arrivals during stalls.

## k6 Example

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    checkout: { executor: 'constant-arrival-rate', rate: 100, timeUnit: '1s', duration: '10m', preAllocatedVUs: 100 }
  },
  thresholds: {
    http_req_failed: ['rate<0.005'],
    http_req_duration: ['p(95)<500', 'p(99)<1000']
  }
};

export default function () {
  const response = http.post(`${__ENV.BASE_URL}/orders`, JSON.stringify({customerId: `c-${__VU}`}),
    {headers: {'Content-Type': 'application/json', 'Idempotency-Key': `${__VU}-${__ITER}`}});
  check(response, {'accepted': r => r.status === 202});
}
```

Generate representative unique/correlated data, validate business outcomes and clean up safely. Client
generator CPU/network and shared test accounts can become the bottleneck.

## Measurement And Diagnosis

Measure end-to-end percentiles and throughput alongside saturation: CPU throttling, heap/native/GC,
threads, pools, queues, database plans/locks, Kafka lag, network retransmission and downstream latency.
Use JFR/profilers during controlled tests. Change one variable at a time and retain raw results, versions,
configuration and uncertainty.

## Chaos Safety

State hypothesis, blast radius, target selectors, duration, abort condition, owner and rollback. Start in a
disposable environment, then progressively increase realism. Useful faults include latency/loss, dependency
unavailability, Pod/node termination, CPU/memory/disk pressure, DNS failure, credential expiry and zone loss.
Never inject into production merely for theatre; the expected learning must justify risk.

## Required Evidence

Capacity curve, saturation point, p95/p99, correctness/reconciliation, resource profile, failure response,
recovery time and concrete decision. Use the companion workbook for labs and interview scenarios.

## Official References

- [Grafana k6 documentation](https://grafana.com/docs/k6/latest/)
- [Java Flight Recorder](https://docs.oracle.com/en/java/javase/21/jfapi/)
- [Principles of chaos engineering](https://principlesofchaos.org/)

## Recommended Next

Continue with [Performance And Chaos Labs, CI, Incidents, And Interviews](./performance-chaos/PERFORMANCE-CHAOS-LABS-INTERVIEW.md).

