# MDC, Correlation IDs, And Tracing

For a framework-generic explanation of MDC, `ThreadLocal` behavior,
`MDC.putCloseable`, cleanup, asynchronous propagation, dependencies, and
production practices, see [Mapped Diagnostic Context (MDC)](MDC-GENERIC.md).

## Three Identifiers

| Identifier | Scope | Created by | Main use |
|---|---|---|---|
| Correlation ID | Business journey | Gateway/service or caller | Find all checkout logs and events |
| Trace ID | One distributed technical trace | Micrometer Tracing | Connect HTTP/Kafka spans in Zipkin |
| Span ID | One operation in a trace | Micrometer Tracing | Identify a specific server, client, or messaging operation |

A SAGA can outlive one HTTP trace. Its correlation ID remains stable while trace IDs may differ between delayed Kafka operations.

## MDC Internals

SLF4J MDC is a thread-associated key/value context. Logback's structured encoder reads MDC values when it creates a log event.

```java
try (MDC.MDCCloseable ignored = MDC.putCloseable("correlationId", correlationId)) {
    action.run();
}
```

`putCloseable` guarantees cleanup when the scope exits. Cleanup is essential because servlet, scheduler, and Kafka threads are reused. A leaked MDC value can attach one customer's identifier to another request.

## HTTP Flow

1. The gateway accepts `X-Correlation-Id` or creates one.
2. The service request filter places it in MDC and returns it in the response header.
3. Logs created in the scope contain `correlationId`.
4. Feign interceptors forward the header.
5. The filter closes the MDC scope after the request.

## Kafka Flow

The correlation ID is part of every SAGA event payload. Each listener deserializes the event and restores MDC through `CorrelationContext.run(...)` before business logic logs anything.

```java
OrderCreatedEvent event = objectMapper.readValue(payload, OrderCreatedEvent.class);
CorrelationContext.run(event.correlationId(), () -> sagaService.handle(event));
```

The second argument is a `Runnable` lambda. `CorrelationContext` places the
event correlation ID into MDC, invokes the lambda, and removes the value even
if the handler throws. See the
[Kafka listener example](MDC-GENERIC.md#kafka-listener-example) for the
line-by-line flow.

## Micrometer Trace Propagation

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

## Async Boundaries

MDC is not automatically copied to arbitrary executor threads. Prefer:

- passing correlation data in Kafka events;
- restoring MDC at the listener or scheduled task boundary;
- using Micrometer context propagation for instrumented frameworks;
- avoiding unbounded custom executors.

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
