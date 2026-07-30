# Optimize Performance With Evidence

Use this workflow for API, database, Kafka, frontend, build, or documentation-site
performance. Optimization is not authorized until a bottleneck is measured.

## Inputs

```text
User/system journey: [operation]
Environment and revision: [values]
Representative workload: [data volume, concurrency, duration]
Baseline: [p50, p95, p99, throughput, errors, resources]
Target: [measurable objective]
Correctness guardrails: [behavior that must not change]
Scope: [allowed systems/files]
```

## Workflow Prompt

```text
Investigate read-only first. Confirm that the baseline and target are comparable.
Inspect the most relevant available evidence:
- distributed traces and request phase timing;
- SQL count/duration, query plans, indexes, locks, and pool saturation;
- Kafka lag, batch size, serialization, retry, and downstream backpressure;
- CPU profiles, allocation, GC, threads, memory, and I/O;
- frontend network waterfall, bundle size, rendering, layout stability, and Core
  Web Vitals;
- error rate, timeouts, rate limits, and dependent-service load.

Rank bottlenecks by measured contribution. For each candidate fix include the
causal mechanism, expected effect, correctness risk, operational trade-off, and
smallest experiment. Do not recommend caches, indexes, concurrency, batching, or
larger pools without explaining invalidation, cardinality, ordering, load, and
failure consequences where applicable.

Request approval before implementation. Then make one controlled change at a
time and rerun the same representative workload. Preserve raw results or a
reproducible summary.

Return a completed performance scorecard with before/after p50, p95, p99,
throughput, errors, CPU, memory, database/downstream load, and test conditions.
Reject the optimization if correctness regresses or the measured gain is not
repeatable.
```

## Evidence Gate

An appealing code diff, fewer source lines, or one faster local request is not a
performance result. Report variance, warm-up, sample size, and environmental
limitations.
