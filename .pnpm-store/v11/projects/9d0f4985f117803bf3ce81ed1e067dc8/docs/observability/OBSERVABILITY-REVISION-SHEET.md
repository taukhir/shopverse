---
title: Observability Engineering Revision Sheet
description: Rapid revision of metrics, logs, traces, SLOs, cardinality, correlation, alerting, and incident investigation.
difficulty: Advanced
page_type: Interview
status: maintained
prerequisites: [Observability Engineering Overview]
learning_objectives: [Recall telemetry selection quickly, Diagnose incidents systematically, Defend observability cost and security decisions]
technologies: [Micrometer, Prometheus, Grafana, Loki, OpenTelemetry]
last_reviewed: "2026-07-30"
scope: generic
owner: docs-observability
reviewer: documentation-maintainers
review_evidence: repository-content-audit
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

## Production Interview Questions

### Monitoring versus observability?

Monitoring checks known conditions through predefined signals. Observability is the ability to investigate
both known and novel questions from telemetry and authoritative state. More dashboards do not automatically
create observability; signals must preserve useful dimensions, correlation and ownership.

### SLI, SLO, SLA, and error budget?

An SLI measures service behavior, an SLO sets an internal target over a window, and an SLA is an external
commitment with stated consequences. The error budget is the unreliability allowed by the SLO. Define eligible
events, exclusions and window explicitly before calculating compliance or burn.

### RED, USE, and the golden signals?

RED examines request rate, errors and duration. USE examines resource utilization, saturation and errors.
The SRE golden signals add traffic, latency, errors and saturation. Begin with user impact, then use service
and resource views to find the limiting boundary.

### Why are averages dangerous for latency?

An average can hide a slow tail and a bimodal distribution. Use histograms with buckets aligned to SLOs and
inspect p50, p95 and p99 with traffic and error counts. A percentile is an aggregate distribution statistic,
not proof that one particular request had that duration.

### Counter, gauge, timer, or histogram?

Use a counter for cumulative events, a gauge for sampled current state, and a timer/histogram for duration or
size distributions. Derive rates from counters. Do not model queue depth as a counter or request latency as an
average-only gauge.

### Why does metric cardinality become an outage?

Every unique label combination creates a time series and consumes ingestion, memory, storage and query work.
Keep labels bounded; put request, user, order, trace and exception detail in logs or traces. Enforce limits and
observe series growth before an unbounded value overloads the telemetry system.

### Trace ID, span ID, baggage, and correlation ID?

A trace ID groups one distributed trace, while each operation has its own span ID. Baggage propagates small
allowlisted context and must never authorize a request. A business correlation ID may outlive one trace across
retries or asynchronous stages; it complements rather than replaces trace context.

### Head sampling versus tail sampling?

Head sampling decides near trace creation and is cheap but cannot know the final outcome. Tail sampling buffers
enough trace data to retain errors, slow paths or selected flows, requiring collector capacity and policy.
Metrics remain the source for complete rates, percentiles and SLO calculations.

### Why is a distributed trace broken at one service?

Check propagation format, instrumented client construction, async/context handoff, message headers, sampling,
exporter queues, collector health and backend query window. A service can accidentally create a new root trace
when it fails to extract the incoming context.

### What belongs in a structured log?

Record a stable event name, timestamp, severity, service/build identity, safe outcome/reason, trace/correlation
fields and bounded diagnostic context. Never log credentials or raw sensitive payloads. Redact at the source,
control access and retention, and test forbidden-field leakage.

### What makes an alert actionable?

Page on user impact, fast error-budget burn or an imminent safety-boundary breach. Include owner, severity,
evidence, runbook, silence policy and recovery condition. Infrastructure symptoms without a required human
action normally belong in dashboards or tickets.

### What happens when the telemetry pipeline is overloaded or unavailable?

Bound application-side queues, batching, memory and retry behavior so telemetry failure cannot exhaust the
business service. Monitor dropped data and exporter/collector health, degrade deliberately, preserve critical
audit evidence, and test recovery. Sampling and retention are capacity, cost and compliance decisions.

## Final Checklist

- SLIs represent user outcomes;
- dashboards answer explicit questions;
- alerts are actionable and owned;
- cardinality, sampling, retention, and cost are controlled;
- sensitive telemetry is protected;
- deploy/config/business events are correlated;
- incident recovery is measurable and documented.

## Official References

- [OpenTelemetry documentation](https://opentelemetry.io/docs/)
- [Prometheus documentation](https://prometheus.io/docs/)
- [Grafana documentation](https://grafana.com/docs/)
