---
title: "Debugging Observability And Recovery"
description: "Debugging Observability And Recovery with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "Debugging Observability And Recovery"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Debugging Observability And Recovery

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

## Prometheus

Target health:

```promql
up{job="shopverse-services"}
```

Errors:

```promql
sum by (application) (
  rate(http_server_requests_seconds_count{status=~"5.."}[5m])
)
```

Latency:

```promql
histogram_quantile(
  0.95,
  sum by (le, application) (
    rate(http_server_requests_seconds_bucket[5m])
  )
)
```

If a metric is missing:

1. open the service `/actuator/prometheus`;
2. search the normalized metric name;
3. check Prometheus target state and scrape error;
4. check the query's labels and time range;
5. trigger the code path that creates lazy custom meters.

## Promtail And Loki

Pipeline:

```text
source file/stdout -> Promtail discovery -> JSON parsing -> labels
-> positions file -> Loki push -> Grafana query
```

If logs are missing:

1. confirm the line exists in the source file or `docker compose logs`;
2. check Promtail container logs;
3. check mounted path and `__path__`;
4. check the positions file behavior;
5. verify valid JSON and timestamp parsing;
6. query by broad `job` before narrowing labels;
7. check Loki readiness and retention window.

Because the POC collects stdout and files, duplicate records can appear.
Choose one job when counting.

## Grafana

Grafana queries other systems. An empty panel can mean:

- wrong datasource;
- invalid PromQL/LogQL;
- wrong dashboard variable;
- time range excludes data;
- no traffic created the metric;
- datasource or backend unavailable.

Run the raw query in Explore or the Prometheus/Loki UI before changing the
dashboard.

## Zipkin

If no trace appears:

- verify tracing is enabled and sampling probability;
- confirm Zipkin endpoint from inside the service network;
- inspect exporter errors;
- trigger an instrumented HTTP/Feign/Kafka path;
- search the exact trace ID and correct time window.

Correlation ID is not the Zipkin trace identifier.

## Testcontainers And CI

For hanging or slow tests:

- confirm Docker is available;
- check image pull and container startup;
- use reusable shared containers per test suite;
- bound Awaitility and process timeouts;
- stop leaked executors/listeners;
- avoid full application context for simple unit tests;
- inspect Gradle test reports rather than rerunning blindly.

CI config validation failures often come from exact filename/application-name
mismatches in `cloud-configs`.

## Safe Recovery Principles

1. Preserve logs, correlation ID, trace, offsets, and database state.
2. Fix the cause before replay.
3. Prefer normal APIs and outbox replay over direct database mutation.
4. Never delete a pending outbox row to hide an error.
5. Never reset a consumer group without estimating duplicate business effects.
6. Back up before destructive database repair.
7. Record who performed recovery and why.
8. Verify business state, not only HTTP success.

## Related Guides

- [System design](../architecture/SYSTEM-DESIGN.md)
- [Distributed systems](../architecture/DISTRIBUTED-SYSTEMS.md)
- [Spring Kafka](../spring/SPRING-KAFKA.md)
- [Observability](../observability/OBSERVABILITY.md)
- [Features and demos](../reference/FEATURES-AND-DEMOS.md)

## Recommended Next

Return to [Shopverse Debugging](./DEBUGGING.md) to select the next focused guide.


## Official References

- [Spring Framework reference](https://docs.spring.io/spring-framework/reference/)
- [Spring Boot reference](https://docs.spring.io/spring-boot/reference/)
