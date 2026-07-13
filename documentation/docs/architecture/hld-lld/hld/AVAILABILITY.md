---
title: Availability
status: "maintained"
last_reviewed: "2026-07-13"
---

# Availability In System Design

Availability measures whether the system can serve correct eligible requests
when users need it. It is not just whether one process is running.

```text
availability = successful eligible requests / total eligible requests
```

## Availability Targets

| Target | Approximate monthly downtime |
|---:|---:|
| 99% | 7 hours 12 minutes |
| 99.9% | 43 minutes |
| 99.95% | 21 minutes |
| 99.99% | 4 minutes |

Higher availability requires more redundancy, automation, testing, and cost.

## Availability Versus Reliability

| Concept | Meaning |
|---|---|
| Availability | system is usable now |
| Reliability | system works correctly over time |
| Durability | committed data is not lost |
| Resilience | system recovers or degrades during failure |

A system can be available but unreliable if it returns incorrect data.

## Sequential Dependency Availability

If a request path requires multiple mandatory components, availability roughly
multiplies:

```text
Gateway 99.9%
Order   99.9%
Payment 99.9%

combined = 0.999 x 0.999 x 0.999 = 99.7002%
```

This is why system design tries to:

- reduce mandatory synchronous dependencies;
- make non-critical work asynchronous;
- use fallback for optional features;
- isolate failures with bulkheads and circuit breakers.

## Techniques To Improve Availability

| Technique | What it solves |
|---|---|
| multiple instances | one instance can fail without full outage |
| load balancer health checks | stop sending traffic to bad instances |
| database replication | survive primary/replica failures |
| failover | promote or route to healthy nodes |
| retries with timeout/jitter | handle transient failures |
| circuit breaker | avoid repeatedly calling a failing dependency |
| bulkhead | prevent one dependency from consuming all resources |
| queue-based async processing | buffer work during temporary dependency failure |
| graceful degradation | keep core features available while optional features fail |
| backup and restore | recover from data loss/corruption |

## Active-Active Versus Active-Passive

| Mode | Meaning | Tradeoff |
|---|---|---|
| Active-active | multiple nodes/regions serve traffic simultaneously | higher complexity, better capacity/failover |
| Active-passive | standby takes over after failure | simpler, failover delay |

For most POCs, active-passive concepts are enough. For global products,
active-active raises hard questions around data consistency, routing, and
conflict resolution.

## Graceful Degradation

Graceful degradation means core behavior continues when optional behavior fails.

Example:

```text
Product recommendation service is down.
Checkout, catalog, and payment still work.
UI hides recommendations or shows cached fallback.
```

Shopverse example:

```text
Observability stack failure should not block checkout.
Failed Kafka event should be persisted for replay instead of losing the order.
```

## Availability In Shopverse

Shopverse improves availability through:

- Docker health checks;
- Eureka discovery;
- API Gateway routing;
- Resilience4j circuit breaker/retry/rate limiter/bulkhead;
- Kafka asynchronous processing;
- transactional outbox;
- failed-event persistence and replay;
- idempotent checkout;
- Prometheus/Grafana visibility.

## Interview Questions

<ExpandableAnswer title="How Do You Design For 99.9% Availability?">

Use multiple instances, health checks, timeouts, retries, circuit breakers,
database backup/replication, monitoring, and tested recovery. Also define what
"available" means for the business flow.

</ExpandableAnswer>
<ExpandableAnswer title="Why Can Adding More Services Reduce Availability?">

If every service is mandatory and called synchronously, the combined request
path availability is lower than each individual service's availability.

</ExpandableAnswer>
<ExpandableAnswer title="How Do Queues Help Availability?">

Queues let a service accept work even when a downstream consumer is temporarily
slow or unavailable. They improve decoupling but introduce eventual consistency
and replay/idempotency requirements.

</ExpandableAnswer>
## References

- [Availability in System Design - GeeksforGeeks](https://www.geeksforgeeks.org/system-design/availability-in-system-design/)
