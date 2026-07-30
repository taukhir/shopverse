---
title: Microservices Observability SLOs And Incident Evidence
description: Logs, metrics, traces, RED and USE signals, SLOs, cardinality, sampling, business evidence, and incident timelines.
difficulty: Advanced
page_type: Guide
status: maintained
prerequisites: [Microservices, OpenTelemetry fundamentals]
learning_objectives: [Define actionable service evidence, Design SLO alerts, Reconstruct distributed failures]
technologies: [OpenTelemetry, Prometheus, Grafana]
last_reviewed: "2026-07-28"
scope: generic
owner: docs-architecture
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Microservices Observability SLOs And Incident Evidence

Observability must answer whether customers are succeeding, which dependency or
resource limits them, and what changed. Logging “request received” is not a health
signal.

## Signal Model

- **RED:** request rate, errors and duration for services;
- **USE:** utilization, saturation and errors for resources;
- **business:** accepted, completed, rejected, compensated and stuck workflows;
- **async:** arrival/completion rate, lag, oldest age, retry, DLT and replay;
- **dependency:** pool wait, connect/request latency, timeout and breaker state.

## Correlation

Carry trace/span context plus a stable business correlation ID. Events also need
event ID, causation ID, aggregate ID/version and Saga ID. Do not use user secrets
or payloads as identifiers.

Structured logs should include service/version, environment, operation, outcome,
duration, error category and relevant safe identifiers. Logs complement metrics
and traces; they do not replace them.

## SLI And SLO Design

Define the measurement population and success criteria precisely:

```text
availability SLI = valid successful outcomes / eligible requests
latency SLI = eligible successful requests within threshold / eligible successes
workflow SLI = workflows reaching a valid terminal state before deadline / started workflows
```

An error budget controls release and reliability decisions. Prefer multi-window
burn-rate alerts over a single noisy threshold.

## Cardinality And Sampling

Never put user, order, trace or raw URL IDs into metric labels. Keep those in
logs/traces. Tail or rule-based sampling can retain errors and slow traces, but
sampling policy must not hide rare critical outcomes. Record head/tail sampling
and dropped telemetry rates.

## Incident Timeline

Reconstruct deployment/config changes, traffic, SLO burn, dependency saturation,
retries, queue/lag growth, breaker/load-shed actions, recovery and reconciliation.
Use synchronized timestamps and preserve audit events for operator actions.

## Alert Quality

Every page needs a user impact, owner, urgency, first diagnostic links and safe
containment. Alert on sustained symptoms and SLO burn, not every individual error.
Review false positives, missed incidents and unactionable pages.

## Completion Evidence

- one request can be traced through sync calls and async events;
- dashboards show customer outcome and limiting resource;
- high-cardinality identifiers do not destabilize metrics;
- a missing Saga/outbox event creates a business-age alert;
- a deployment regression is attributable by version;
- incident exercises produce a complete timeline.

## Recommended Next

Continue with [Multi-Region Microservices Recovery](./MICROSERVICES-MULTI-REGION-RECOVERY.md).

## Official References

- [OpenTelemetry concepts](https://opentelemetry.io/docs/concepts/)
- [OpenTelemetry signals](https://opentelemetry.io/docs/concepts/signals/)
- [OpenTelemetry metrics and cardinality](https://opentelemetry.io/docs/concepts/signals/metrics/)
