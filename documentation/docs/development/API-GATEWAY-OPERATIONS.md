---
title: "API Gateway Operations"
description: "API Gateway Operations with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "API Gateway Operations"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# API Gateway Operations

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

## Gateway Metrics

Shopverse records:

```java
meterRegistry.counter(
        "shopverse.gateway.requests.logged",
        "method", method,
        "status", String.valueOf(status),
        "outcome", outcome(status)
).increment();
```

Prometheus exposes the counter approximately as:

```text
shopverse_gateway_requests_logged_total{
  method="GET",
  status="200",
  outcome="SUCCESS"
}
```

Example queries:

```promql
sum(rate(shopverse_gateway_requests_logged_total[5m]))
```

```promql
sum by (outcome) (
  rate(shopverse_gateway_requests_logged_total[5m])
)
```

```promql
sum(
  rate(shopverse_gateway_requests_logged_total{status=~"5.."}[5m])
)
```

Method, status, and outcome are bounded tags. Path, correlation ID, trace ID,
username, and order number must not be metric tags because they create
high-cardinality time series.

See [Micrometer counters](../observability/MICROMETER-COUNTERS.md#what-is-a-counter-metric)
for the detailed counter lifecycle, `MeterRegistry` lookup behavior, exported
Prometheus format, queries, dependencies, and tag guidance.

Request counts do not describe latency. See
[Gateway duration Timer](../observability/MICROMETER-TIMERS-TAGS-OPERATIONS.md#gateway-duration-timer)
for when to use a custom Timer, how histogram buckets enable p95/p99 queries,
and why built-in HTTP timing should be preferred when it already provides the
required signal.

## Actuator Exclusion

Health probes and Prometheus scrapes occur frequently. Shopverse bypasses
custom gateway logging and counting for `/actuator/**`:

```java
if (path.startsWith("/actuator/")) {
    return chain.filter(correlatedExchange);
}
```

The correlation header is still established before this condition. Only the
custom start/completion logs and counter are skipped.

This avoids allowing probe traffic to hide application requests or distort the
custom business-facing gateway metric.

## Shopverse Readiness

API Gateway exposes a production readiness endpoint:

```text
GET /actuator/shopverse-readiness
```

It is intentionally stricter than `/actuator/health`. The response returns
HTTP `200` only when Shopverse can route customer traffic through the gateway.
It checks:

- required service registrations in Eureka;
- required gateway route IDs;
- downstream service actuator health;
- seeded inventory catalog availability;
- product image metadata;
- configured MiniIO seeded product image object reachability.

If any required check fails, the endpoint returns HTTP `503` with a bounded
component summary. The endpoint does not expose credentials or stack traces.

Docker sets `SHOPVERSE_READINESS_MINIO_OBJECT_BASE_URL` for API Gateway so the
MiniIO object check uses the internal container URL instead of the browser-facing
`localhost` image URLs.

The full-stack verification script waits for this endpoint before running the
checkout smoke:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Test-ShopverseFullStack.ps1 `
  -Mode Smoke -TimeoutMinutes 35
```

## Filter Ordering

The filter implements `Ordered`:

```java
@Override
public int getOrder() {
    return Ordered.HIGHEST_PRECEDENCE;
}
```

Running early makes the correlation ID available to later gateway filters and
the routed request. Filter order should be intentional because pre-filter code
runs in ascending order while completion callbacks effectively unwind around
the downstream chain.

## Error And Cancellation Details

`doFinally` receives a `SignalType`, such as completion, error, or cancellation:

```java
.doFinally(signalType -> {
    log.debug("Gateway sequence terminated signal={}", signalType);
});
```

Important production considerations:

- a cancelled request may not have a meaningful HTTP status;
- an exception can terminate before a response status is committed;
- assuming status `200` when the status is absent can misclassify errors or
  cancellations;
- `doOnError` can record exception-specific information;
- `doOnSuccess` can handle only successful completion;
- `doFinally` should remain lightweight because it runs for every termination.

The current Shopverse filter defaults a missing status to `200`. This keeps
the POC simple, but a production implementation should classify missing
statuses using the termination signal rather than reporting every missing
status as success.

## Reactive Context And MDC

Traditional MDC is thread-associated. A reactive request may execute on more
than one thread, so placing a value in MDC once and assuming it remains
available throughout a WebFlux pipeline is unsafe.

At the gateway:

- keep correlation data in the immutable exchange and headers;
- use Reactor Context or Micrometer Context Propagation when logging requires
  context across reactive operators;
- let Micrometer tracing manage trace propagation;
- do not call blocking database, network, or filesystem APIs inside a gateway
  filter.

Downstream servlet services can establish a scoped MDC value in their request
filters.

## Production Value

### Request Tracing

The client, gateway, and downstream services share:

```text
X-Correlation-Id: abc-123
```

Operators can use the value to find one business journey across centralized
logs.

### Performance Monitoring

Completion logs contain:

```text
durationMs=2500
```

This identifies slow requests and provides a starting point for checking
downstream Zipkin spans.

### Metrics

Prometheus can calculate request rate, client errors, server errors, and
outcome trends from the gateway counter.

### Client-Assisted Debugging

The gateway returns the correlation ID in the response. A frontend or caller
can provide that value in a support report without receiving internal stack
traces or implementation details.

## Production Practices

1. Keep global filters non-blocking and inexpensive.
2. establish correlation before routing.
3. validate externally supplied correlation IDs.
4. return the correlation ID in the response.
5. use `System.nanoTime()` for elapsed duration.
6. classify completion, error, and cancellation accurately.
7. keep metric labels bounded.
8. never log authorization headers, cookies, tokens, or request bodies by
   default.
9. avoid duplicating Spring's built-in HTTP metrics without a clear business
   reason.
10. exclude or separately classify probes and scrape traffic.
11. use structured logs for request identifiers.
12. use traces for latency relationships and logs for business detail.

## Related Guides

- [Spring Boot internals](SPRING-BOOT-INTERNALS.md)
- [MDC generic guide](../observability/MDC-GENERIC.md)
- [Shopverse correlation and tracing](../observability/MDC-CORRELATION-TRACING.md)
- [Micrometer metrics](../observability/MICROMETER-METRICS.md)

## Recommended Next

Return to [API Gateway Engineering](./API-GATEWAY-GENERIC.md) to select the next focused guide.


## Official References

- [Spring Framework reference](https://docs.spring.io/spring-framework/reference/)
- [Spring Boot reference](https://docs.spring.io/spring-boot/reference/)
