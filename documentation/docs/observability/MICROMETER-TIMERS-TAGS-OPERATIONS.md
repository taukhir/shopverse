---
title: "Micrometer Timers, Tags, And Operations"
description: "Micrometer Timers, Tags, And Operations with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "Micrometer Timers, Tags, And Operations"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Micrometer Timers, Tags, And Operations

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

## Timer Example

```java
Timer.Sample sample = Timer.start(meterRegistry);

try {
    paymentProvider.charge(request);
} finally {
    sample.stop(meterRegistry.timer(
            "shopverse.payment.provider.duration",
            "provider", "stub"
    ));
}
```

A timer records both invocation count and total duration. When histogram configuration is enabled, Prometheus can calculate percentiles such as p95.

Prefer framework-provided HTTP, Kafka, datasource, and JVM metrics before creating duplicate custom timers.

## Gateway Duration Timer

A counter answers **how many requests occurred**. A Timer additionally records:

- how many operations completed;
- total elapsed time;
- maximum observed time for the current publishing interval;
- histogram buckets when enabled.

A custom gateway Timer could be recorded as:

```java
Timer.builder("shopverse.gateway.request.duration")
        .tags(
                "method", method,
                "status", String.valueOf(status),
                "outcome", outcome(status)
        )
        .publishPercentileHistogram()
        .register(meterRegistry)
        .record(durationNanos, TimeUnit.NANOSECONDS);
```

`Timer.builder(...)` defines a Timer meter.

`tags(...)` adds bounded dimensions. Do not use the raw request path because
IDs embedded in paths can create an unbounded number of time series.

`publishPercentileHistogram()` publishes histogram buckets. Prometheus uses
those buckets to calculate aggregatable percentiles across application
instances.

`register(meterRegistry)` returns the existing Timer for the same name and tags
or registers it when first encountered.

`record(...)` adds one duration sample. Recording the original nanosecond
duration avoids converting to milliseconds and then losing precision.

The Prometheus output includes series similar to:

```text
shopverse_gateway_request_duration_seconds_count
shopverse_gateway_request_duration_seconds_sum
shopverse_gateway_request_duration_seconds_max
shopverse_gateway_request_duration_seconds_bucket
```

Average latency:

```promql
sum(rate(shopverse_gateway_request_duration_seconds_sum[5m]))
/
clamp_min(
  sum(rate(shopverse_gateway_request_duration_seconds_count[5m])),
  0.001
)
```

p95 latency:

```promql
histogram_quantile(
  0.95,
  sum by (le) (
    rate(shopverse_gateway_request_duration_seconds_bucket[5m])
  )
)
```

p99 latency:

```promql
histogram_quantile(
  0.99,
  sum by (le) (
    rate(shopverse_gateway_request_duration_seconds_bucket[5m])
  )
)
```

To compare API groups, use a bounded route identifier such as
`routeId=order-service`, not `/api/v1/orders/123`. "Slowest APIs" is only
reliable when the grouping label has controlled values and histogram buckets
are enabled.

### Do We Need This Custom Timer?

Not always. Spring Boot and Spring Cloud Gateway already publish HTTP request
duration metrics through Micrometer. Shopverse also enables percentile
histograms for `http.server.requests`:

```yaml
management:
  metrics:
    distribution:
      percentiles-histogram:
        http.server.requests: true
```

Use the built-in metric when it already provides the required method, status,
route, and duration dimensions. Add a custom Timer only when it represents a
different boundary or business meaning, such as duration after excluding
Actuator traffic or timing a specific gateway policy.

Creating both without a clear distinction duplicates storage and can produce
conflicting dashboard definitions.

## Tag Cardinality

Every unique tag combination creates another time series. Use bounded values:

```text
outcome=success|failed
stage=ORDER_CREATED|PAYMENT_COMPLETED
service=order|inventory|payment
```

Do not use unbounded identifiers as metric tags:

```text
correlationId
traceId
orderNumber
username
email
raw exception message
full URL containing IDs
```

Those fields belong in logs or traces. High-cardinality metrics consume memory in the application and substantially increase Prometheus storage and query cost.

## Spring Boot Dependencies

Actuator supplies the metric infrastructure:

```gradle
implementation 'org.springframework.boot:spring-boot-starter-actuator'
```

The Prometheus registry adapts Micrometer meters to Prometheus:

```gradle
runtimeOnly 'io.micrometer:micrometer-registry-prometheus'
```

The endpoint must be exposed:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus
  metrics:
    tags:
      application: ${spring.application.name}
```

## Production Practices

1. Use a stable namespace such as `shopverse.<domain>.<measurement>`.
2. Record business outcomes at the point where the outcome is known.
3. Keep tag names and possible values bounded.
4. Use a consistent tag set for every occurrence of one metric name.
5. Prefer counters for events and timers for durations.
6. Avoid recording secrets or personal data.
7. Add alerts only for actionable conditions.
8. Query rates over time instead of relying on raw cumulative counters.
9. Document each custom metric and its labels.
10. Test that critical metrics appear on `/actuator/prometheus`.

Micrometer meter names may be normalized differently by each monitoring backend. Use the Micrometer name in Java and the exported Prometheus name in PromQL.

## Shopverse Metrics

Examples currently recorded by Shopverse include:

- `shopverse.saga.transitions`;
- `shopverse.payment.outcomes`;
- `shopverse.inventory.reservation.conflicts`;
- `shopverse.inventory.reservations.expired`;
- `shopverse.outbox.publish`;
- `shopverse.kafka.dlt.events`;
- `shopverse.kafka.dlt.replays`.

See [Prometheus](PROMETHEUS.md) for queries and [Observability architecture](OBSERVABILITY.md) for the complete telemetry stack.

## Recommended Next Page

Continue with [Prometheus](./PROMETHEUS.md).

## Recommended Next

Return to [Micrometer Metrics](./MICROMETER-METRICS.md) to select the next focused guide.


## Official References

- [Micrometer documentation](https://docs.micrometer.io/micrometer/reference/)
- [OpenTelemetry documentation](https://opentelemetry.io/docs/)
