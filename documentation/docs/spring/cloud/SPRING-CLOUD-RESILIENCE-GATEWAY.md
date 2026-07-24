---
title: Spring Cloud Circuit Breaker, Gateway, And Resilience Composition
description: Compose timeouts, retries, circuit breakers, bulkheads, rate limits, fallbacks, gateway filters, and capacity controls without causing retry storms.
difficulty: Advanced
page_type: Production Guide
status: Generic
prerequisites: [Spring Cloud Discovery And Clients]
learning_objectives: [Compose resilience controls, Protect gateway trust boundaries, Size concurrency from capacity]
technologies: [Spring Cloud CircuitBreaker, Spring Cloud Gateway, Resilience4j]
last_reviewed: "2026-07-23"
---

# Spring Cloud Circuit Breaker, Gateway, And Resilience Composition

## Control Responsibilities

| Control | Primary purpose |
|---|---|
| deadline/timeout | bound how long ownership waits |
| retry | repeat a safe transient failure within budget |
| circuit breaker | stop calls when recent outcomes indicate likely failure |
| bulkhead | limit concurrent resource consumption/blast radius |
| rate limiter | enforce admission over time/identity |
| load shedding | reject early when capacity is exhausted |
| fallback | return a semantically valid degraded outcome |

Order matters. A retry inside a circuit breaker produces different metrics/load from a
breaker inside retry. Time limiting blocking code needs cancellation semantics; interrupting
a thread does not guarantee JDBC/remote work stopped.

## Circuit Breaker States

Closed measures calls, open rejects, half-open allows probes. Configure minimum calls,
failure/slow thresholds, sliding window, open duration, half-open permits, and recorded/
ignored exceptions from traffic/SLO evidence. Do not count validation rejection as dependency
failure or ignore timeouts that represent real degradation.

## Bulkhead And Capacity

Concurrency should follow service time and safe downstream capacity:

```text
required concurrency approximately = throughput x average service time
safe configured concurrency < downstream/pool/thread capacity with failure headroom
```

Queueing hides overload and increases latency. Reject with a stable error/Retry-After policy
before consuming every worker or database connection.

## Gateway Runtime

Spring Cloud Gateway matches routes, executes ordered pre/post filters, forwards through a
reactive HTTP client, and writes the response. Blocking work on event-loop threads can stall
many requests. Filters must preserve request bodies carefully, bound memory, sanitize headers,
and handle cancellation.

The gateway is a trust boundary for TLS, authentication validation, authorization at the
appropriate granularity, header normalization, rate limiting, request-size limits, CORS,
observability, and routing. Downstream services still enforce domain authorization.

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: order-api
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
          filters:
            - StripPrefix=1
```

This is illustrative; route ownership, auth, timeout, retry, and header policies must be
explicit. Dynamic route refresh requires validation and rollback.

## Fallback Rules

A fallback must preserve semantics. Cached catalog data may be acceptable with staleness
metadata; “payment succeeded” without authoritative evidence is not. Prefer explicit
`PENDING`/`UNAVAILABLE` outcomes and reconciliation over false success.

## Failure Amplification

Suppose gateway retries twice, service client retries twice, and SDK retries twice: one
request can create up to 27 attempts depending on interpretation. Centralize retry ownership,
pass deadlines, use idempotency, add jitter, and budget retries as load.

## Production Scenarios

**Breaker opens during a downstream deploy.** Confirm error type and denominator, check
readiness/drain and latency, protect half-open probes, roll back or restore dependency, then
validate breaker recovery and idempotent retry impact.

**Gateway latency rises but services look healthy.** Inspect event-loop blocking, route/filter
latency, connection-pool acquisition, DNS/TLS, response sizes, rate-limit backend, retries,
and client disconnect cancellation.

**Rate limiter backend fails.** Decide fail-open versus fail-closed per route/threat. Authentication
and high-cost mutation endpoints may need fail-closed; public low-risk reads may use bounded
local degradation. Test this policy.

## Official References

- [Spring Cloud Circuit Breaker reference](https://docs.spring.io/spring-cloud-circuitbreaker/reference/)
- [Spring Cloud Gateway reference](https://docs.spring.io/spring-cloud-gateway/reference/)
- [Resilience4j documentation](https://resilience4j.readme.io/)

## Recommended Next

Continue with [Bus, Security, Observability, Kubernetes, Upgrades, And Operations](./SPRING-CLOUD-OPERATIONS.md).

