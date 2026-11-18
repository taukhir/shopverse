---
title: "ADR 004: Structured Logging, Metrics, And Tracing Stack"
status: maintained
last_reviewed: "2026-11-17"
page_type: Guide
difficulty: Intermediate
scope: shopverse
owner: docs-architecture
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# ADR 004: Structured Logging, Metrics, And Tracing Stack

## Context

Checkout is a choreographed SAGA across three services (ADR 002) connected
only by Kafka events — there is no single request stack trace that shows
"this checkout's whole journey." Debugging a stuck or failed checkout
needs a way to find every log line, metric, and span belonging to one
business operation across services that don't call each other directly.

## Decision

Micrometer for metrics and tracing instrumentation, Zipkin for trace
storage/search, Prometheus for metrics scraping, Grafana for dashboards,
and Loki (via Promtail) for structured-log aggregation — plus a
business-level correlation ID that is deliberately separate from the
technical trace ID, because the SAGA's async hops don't share one trace.

**Correlation ID**, not trace ID, is the business-journey key
(`shopverse-common/shopverse-observability-starter`,
`CorrelationConstants`):

```java
public static final String HEADER_NAME = "X-Correlation-Id";
public static final String MDC_KEY = "correlationId";
```

A client supplies (or the platform generates) one `X-Correlation-Id` per
checkout; it's threaded through MDC, into every structured log line, and
carried on the Kafka event payloads consumed across the saga — so one
LogQL query finds Order, Inventory, and Payment's logs for the same
checkout, even though the asynchronous legs of that checkout do **not**
share one Zipkin trace ID (each Kafka-triggered hop starts its own
technical trace; only the correlation ID is stable end to end).

**Tracing and metrics** are centrally configured
(`infra/cloud-configs/application.yml`), not per-service:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus
  metrics:
    distribution:
      percentiles-histogram:
        http.server.requests: true
  tracing:
    enabled: ${TRACING_ENABLED:true}
    sampling:
      probability: ${TRACING_SAMPLING_PROBABILITY:1.0}
    export:
      zipkin:
        endpoint: ${ZIPKIN_ENDPOINT:http://localhost:9411/api/v2/spans}

logging:
  pattern:
    correlation: "[${spring.application.name:},%X{traceId:-},%X{spanId:-}] "
  structured:
    format:
      console: ${STRUCTURED_LOG_FORMAT:logstash}
```

`percentiles-histogram: true` on `http.server.requests` means Prometheus
gets real histogram buckets for latency percentile queries (p95/p99), not
just averages — the difference between being able to answer "what's our
p99" and only "what's our mean," which hides tail latency entirely.

## Options Considered

**Trace ID as the only cross-service correlation key.** Rejected as
insufficient on its own: Zipkin's trace propagation works within one
synchronous call chain, but each Kafka-consumer invocation in this SAGA
starts a fresh trace. A pure trace-ID approach would silently stop working
the moment checkout crosses its first asynchronous hop — exactly the part
of the architecture (ADR 002) that most needs end-to-end visibility. The
business correlation ID exists specifically to survive that gap.

**100% trace sampling kept as a permanent default, not just a current
one.** `sampling.probability: 1.0` is deliberately a POC-scale choice —
every request is traced, which is affordable at current traffic and
valuable while actively debugging SAGA defects (this is exactly how
`BUG-013`'s evidence, order `ORD-389E84BE` staying at `ORDER_CREATED`
after 90 seconds, was confirmed). This is **not** a decision meant to
survive to production scale as-is: 100% sampling becomes a real tracing-
backend cost and overhead problem under real load, and the config is
intentionally left overridable (`${TRACING_SAMPLING_PROBABILITY:1.0}`)
for exactly that reason.

**Centralized error tracking/APM (e.g. Sentry-style exception
aggregation) instead of relying on structured logs.** Not adopted — Loki/
Grafana cover infrastructure-level observability, but nothing currently
deduplicates or aggregates application exceptions with occurrence trends
across services. Tracked as a real, not-yet-built gap (`FEAT-O`,
`dev-tools/teams/BACKLOG.md`), not a decision that this is unnecessary.

## Consequences

- Any investigation into a checkout defect starts from the correlation ID,
  not the trace ID — the correlation ID is what a support ticket or a
  customer-facing order number should map to; the trace ID is only useful
  once you're already inside one specific technical hop.
- The admin audit trail (user/account/role/permission changes) is
  currently User Service only — extending the same audit surface to
  Order/Inventory/Payment/DLT recovery workflows is explicit, tracked
  hardening work, not something this observability stack already covers
  end to end.
- Prometheus alerting rules exist and are evaluated in this POC, but there
  is no production notification route wired to them yet (no PagerDuty/
  Slack/email integration) — an alert firing is currently something you'd
  have to be looking at Prometheus/Grafana to notice.
- Because tracing is enabled by default at 100% sampling, any production
  rollout of this stack as-is needs that probability revisited first —
  shipping the POC default unchanged into a higher-traffic environment is
  a cost decision that hasn't actually been made yet, only deferred by the
  override being available.

## Related Documentation

- [ADR 002: Kafka Choreography SAGA For Checkout](002-kafka-choreography-saga.md)
- [Observability](../../observability/OBSERVABILITY.md)
- [Shopverse Saga Code Flow](../../reliability/SHOPVERSE-SAGA-CODE-FLOW.md)
