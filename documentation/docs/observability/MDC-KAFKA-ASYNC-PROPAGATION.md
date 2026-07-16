---
title: "MDC, Kafka, And Async Propagation"
description: "MDC, Kafka, And Async Propagation with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "MDC, Kafka, And Async Propagation"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

import {DocFigure} from '@site/src/components/DocumentationLanding';

# MDC, Kafka, And Async Propagation

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

## MDC Internals

SLF4J MDC is a thread-associated key/value context. Logback's structured encoder reads MDC values when it creates a log event.

```java
try (MDC.MDCCloseable ignored = MDC.putCloseable("correlationId", correlationId)) {
    action.run();
}
```

`putCloseable` guarantees cleanup when the scope exits. Cleanup is essential because servlet, scheduler, and Kafka threads are reused. A leaked MDC value can attach one customer's identifier to another request.

## Feign Propagation

Feign creates a new outgoing HTTP request. The incoming request header is not
automatically copied as an application-specific business header. Shopverse
uses a `RequestInterceptor`:

```java
@Bean
RequestInterceptor correlationIdRequestInterceptor() {
    return template -> {
        String correlationId = MDC.get(CorrelationConstants.MDC_KEY);
        if (correlationId != null && !correlationId.isBlank()) {
            template.header(CorrelationConstants.HEADER_NAME, correlationId);
        }
    };
}
```

Line-by-line behavior:

1. OpenFeign invokes the interceptor while constructing an outgoing request.
2. `MDC.get(...)` reads the identifier established by the service filter.
3. The blank check prevents an empty header.
4. `template.header(...)` adds `X-Correlation-Id` to the downstream request.
5. The downstream service filter reads the header and creates its own local MDC
   scope with the same value.

For example:

```text
Gateway -> Auth Service -> Feign interceptor -> User Service
Gateway -> Order Service -> Feign interceptor -> Inventory Service
```

The Feign interceptor propagates the business correlation ID. Micrometer
instrumentation independently propagates W3C tracing headers such as
`traceparent`; the two mechanisms serve different purposes.

## Kafka Flow

Kafka processing does not inherit the HTTP worker thread or its MDC. Shopverse
stores the correlation ID in the SAGA event and durable outbox record:

```java
outboxService.enqueue(
        "ORDER",
        order.getOrderNumber(),
        "OrderCreatedEvent",
        topic,
        order.getOrderNumber(),
        event,
        correlationId
);
```

Each listener deserializes the event and restores MDC through
`CorrelationContext.run(...)` before business logic logs anything:

```java
OrderCreatedEvent event = objectMapper.readValue(payload, OrderCreatedEvent.class);
CorrelationContext.run(event.correlationId(), () -> sagaService.handle(event));
```

The second argument is a `Runnable` lambda. `CorrelationContext` places the
event correlation ID into MDC, invokes the lambda, and removes the value even
if the handler throws. See the
[Kafka listener example](MDC-GENERIC.md#kafka-listener-example) for the
line-by-line flow.

This gives asynchronous logs the same business identifier even when the event
is processed seconds later, retried, handled by another replica, or replayed
from a DLT.

## Micrometer Trace Propagation

<DocFigure
  src="/img/diagrams/shopverse-zipkin-tracing-flow.svg"
  alt="Shopverse distributed tracing flow through gateway, services, Feign, Micrometer tracing, and Zipkin"
  caption="Trace and span propagation for synchronous calls, with correlation IDs retained across asynchronous business events."
/>

Spring Boot Actuator and Micrometer Observation auto-configure instrumentation for supported HTTP clients, servers, Kafka templates, and listeners. The active observation creates spans, injects tracing headers, and places `traceId` and `spanId` in the logging context. Zipkin export is configured through:

```yaml
management:
  tracing:
    sampling:
      probability: 1.0
    export:
      zipkin:
        endpoint: http://localhost:9411/api/v2/spans
```

Application code should not manually generate trace IDs. It does explicitly manage correlation IDs because those are business identifiers.

## Correlation ID Versus Trace ID

```text
Business checkout correlation ID: abc-123

HTTP trace:
  traceId=trace-http-1
  Gateway span -> Order HTTP span

Later Kafka trace:
  traceId=trace-kafka-2
  Producer span -> Inventory listener span

Later payment trace:
  traceId=trace-kafka-3
  Producer span -> Payment listener span
```

All three traces can retain `correlationId=abc-123`. Use:

- correlation ID to search the complete business journey;
- trace ID to inspect one technical span tree and latency path;
- span ID to isolate one operation inside that trace.

Do not use correlation IDs, trace IDs, or span IDs as credentials,
authorization evidence, or unguessable secrets.

## Async Boundaries

MDC is not automatically copied to arbitrary executor threads. Prefer:

- passing correlation data in Kafka events;
- restoring MDC at the listener or scheduled task boundary;
- using Micrometer context propagation for instrumented frameworks;
- avoiding unbounded custom executors.

`@Async`, `CompletableFuture`, parallel streams, and arbitrary executors do not
automatically inherit MDC. If an asynchronous task is necessary, explicitly
pass the identifier or use a controlled context-propagation mechanism and
restore/clear the scope in the worker.

### Controlled Spring Executor With TaskDecorator

A decorator captures context when the task is submitted and installs it only for
the task execution. It must restore the worker's previous state, not blindly
erase context owned by an outer scope:

```java
@Bean
TaskDecorator mdcTaskDecorator() {
    return task -> {
        Map<String, String> caller = MDC.getCopyOfContextMap();
        return () -> {
            Map<String, String> previous = MDC.getCopyOfContextMap();
            try {
                installMdc(caller);
                task.run();
            } finally {
                installMdc(previous);
            }
        };
    };
}

private static void installMdc(Map<String, String> context) {
    if (context == null || context.isEmpty()) {
        MDC.clear();
    } else {
        MDC.setContextMap(context);
    }
}
```

Attach it to the owned `ThreadPoolTaskExecutor`; defining a `TaskDecorator` bean
does not guarantee that every executor automatically uses it. A
`CompletableFuture` must use that controlled executor explicitly:

```java
CompletableFuture.runAsync(action, applicationExecutor);
```

Do not capture request payloads or mutable security state in the snapshot. Context
propagation supplies diagnostics, not authentication; the task must receive its
authorized business inputs explicitly.

### Why InheritableThreadLocal Is Not The Fix

Thread pools usually create workers before a request and reuse them, so inherited
values are stale or absent. Inheritance also makes cleanup and security ownership
unclear. Pass or propagate a bounded context at task submission instead.

### Virtual Threads

MDC is still associated with the current thread when code runs on a virtual
thread. A fresh virtual thread does not automatically receive arbitrary MDC from
its submitting thread. Thread-per-task execution reduces pooled-thread reuse but
does not remove the need for scoped cleanup, explicit propagation and safe field
selection. Do not assume context follows structured tasks unless the chosen
framework propagation mechanism explicitly provides that contract.

## Reactor And WebFlux

Reactive execution does not preserve a one-request/one-thread relationship.
Putting MDC in a WebFilter and leaving it set around `chain.filter(...)` is
incorrect because subscription signals can execute later on different threads.
Store application correlation data in Reactor Context:

```java
return chain.filter(exchange)
        .contextWrite(context -> context.put("correlationId", correlationId));
```

Reactor Context is subscriber-associated and flows upstream through the reactive
chain. It does not automatically populate SLF4J MDC. For a local log statement,
open the MDC scope only while the signal/callback executes:

```java
return Mono.deferContextual(contextView -> {
    String id = contextView.getOrDefault("correlationId", "-");
    try (var ignored = MDC.putCloseable("correlationId", id)) {
        log.info("Reactive operation subscribed");
    }
    return service.execute();
});
```

That scope covers the synchronous log statement, not every later signal. For
application-wide bridging, use framework-supported Micrometer Context Propagation
and tracing instrumentation with registered accessors/hooks rather than a custom
global Reactor hook copied from a blog post. Verify cancellation, error, scheduler
switch and parallel-rail cleanup; a bridge that sets MDC without restoring the
prior value can leak between subscribers sharing a worker.

Micrometer tracing normally owns `traceId` and `spanId` propagation. A separate
business correlation ID still needs an explicit Reactor/event contract when it
must survive across several traces.

## Propagation Test Matrix

Test more than “value appears once”:

| Boundary | Required assertion |
|---|---|
| servlet/filter success and exception | correct ID inside; absent/restored afterward |
| pooled executor with two consecutive tasks | task B never sees task A's ID |
| nested task/context | previous worker/outer context is restored |
| `CompletableFuture` with controlled versus common pool | configured executor propagates; unconfigured path is not assumed |
| Kafka success, retry and DLT/replay | durable correlation restored for every delivery and cleared afterward |
| WebFlux scheduler switch, error and cancellation | Reactor value survives; MDC bridge never leaks between subscribers |
| tracing enabled/disabled and sampling changes | application correlation remains correct; trace fields follow instrumentation policy |

## Production Practices

1. Accept or generate the ID at the first trusted boundary.
2. Reuse the same ID in downstream services.
3. Return it to the client for support and troubleshooting.
4. Use one header name and one structured log field across services.
5. Validate caller-provided values for length and allowed characters.
6. Reject control characters and avoid directly trusting arbitrary log input.
7. Do not put JWTs, passwords, cookies, payment details, or personal data in
   MDC.
8. Use try-with-resources or `finally` for cleanup.
9. Carry the ID explicitly in asynchronous event contracts or headers.
10. Let Micrometer own `traceId` and `spanId`.
11. Test missing headers, supplied headers, downstream propagation, exception
    cleanup, Kafka restoration, and asynchronous boundaries.
12. Keep high-cardinality correlation/trace identifiers as structured log fields,
    never Prometheus labels or Loki stream labels.

The current Shopverse filters accept any nonblank caller value. Adding a
length and allowed-character policy is a production hardening item.

## Queries

Loki JSON field query:

```logql
{job=~"shopverse-.*|docker-containers"} | json | correlationId="CORRELATION_ID"
```

Trace field:

```logql
{job=~"shopverse-.*|docker-containers"} | json | traceId="TRACE_ID"
```

Use Zipkin for the span tree and Loki for detailed application events.

## Related Guides

- [Generic MDC behavior](MDC-GENERIC.md)
- [Spring Cloud OpenFeign](../spring/SPRING-OPENFEIGN.md)
- [Spring Kafka](../spring/SPRING-KAFKA.md)
- [API Gateway](../development/API-GATEWAY-GENERIC.md)
- [Structured logging](STRUCTURED-LOGGING.md)
- [Loki](LOKI.md)
- [Promtail](PROMTAIL.md)

## Recommended Next

Return to [Correlation And Trace Propagation](./MDC-CORRELATION-TRACING.md) to select the next focused guide.


## Official References

- [Micrometer documentation](https://docs.micrometer.io/micrometer/reference/)
- [OpenTelemetry documentation](https://opentelemetry.io/docs/)
