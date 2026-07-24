---
title: Observability Engineering Revision Sheet
description: Rapid revision of metrics, logs, traces, SLOs, cardinality, correlation, alerting, and incident investigation.
difficulty: Advanced
page_type: Interview
status: Generic
prerequisites: [Observability Engineering Overview]
learning_objectives: [Recall telemetry selection quickly, Diagnose incidents systematically, Defend observability cost and security decisions]
technologies: [Micrometer, Prometheus, Grafana, Loki, OpenTelemetry]
last_reviewed: "2026-07-23"
---

# Observability Engineering Revision Sheet

## Signal Selection

| Question | Best starting signal |
|---|---|
| Is user-visible reliability degrading? | SLI/SLO metrics and burn rate |
| Which service or dependency adds latency? | distributed trace plus service latency metrics |
| What happened for one request/order? | correlated structured logs and business state |
| Which resource is saturated? | USE metrics and profiles |
| Did a deployment trigger the change? | deployment/config events correlated with signals |

## One-Line Recall

| Concept | Revision answer |
|---|---|
| SLI | measured service behavior |
| SLO | target for an SLI over a window |
| error budget | allowed unreliability implied by the SLO |
| RED | rate, errors, duration for request-driven services |
| USE | utilization, saturation, errors for resources |
| cardinality | count of distinct metric label combinations |
| histogram | distribution buckets used for latency/size quantiles and SLOs |
| trace | causally related spans across a distributed operation |
| sampling | retain only selected telemetry to control volume/cost |

## Metric Rules

- use counters for cumulative events and timers/histograms for latency;
- prefer p95/p99 and SLO buckets over averages;
- labels must be bounded and operationally useful;
- never label metrics with user, order, request, URL parameter, or stack trace;
- measure queue time separately from processing time;
- connect application rate to pool, database, broker, and dependency saturation.

## Correlation Rules

Propagate standard trace context and a bounded business correlation identity where
needed. Restore and clear MDC/thread context on every reused thread. Do not expose
tokens, secrets, payment data, or unnecessary personal information.

## Investigation Sequence

1. establish impact, scope, and time window;
2. inspect SLO, rate, errors, latency, saturation;
3. correlate deployments/configuration/traffic;
4. narrow by service, dependency, tenant, operation, or partition;
5. inspect representative traces and logs;
6. verify authoritative business state;
7. mitigate, observe recovery, and preserve evidence.

## Alert Review

An alert needs a symptom tied to user impact or safety margin, stable threshold or
burn-rate logic, owner, severity, evidence links, runbook, silence policy, and clear
recovery condition. Avoid alerting on every transient internal event.

## Final Checklist

- SLIs represent user outcomes;
- dashboards answer explicit questions;
- alerts are actionable and owned;
- cardinality, sampling, retention, and cost are controlled;
- sensitive telemetry is protected;
- deploy/config/business events are correlated;
- incident recovery is measurable and documented.
