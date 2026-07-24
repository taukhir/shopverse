---
title: Spring Cloud Discovery, LoadBalancer, And HTTP Clients
description: Trace registry membership, health, cache staleness, client-side instance selection, OpenFeign behavior, deadlines, retries, and Kubernetes alternatives.
difficulty: Advanced
page_type: Deep Dive
status: Generic
prerequisites: [Spring Cloud Config]
learning_objectives: [Operate service discovery, Design safe HTTP clients, Diagnose stale instances and retry failures]
technologies: [Spring Cloud Netflix Eureka, Spring Cloud LoadBalancer, OpenFeign]
last_reviewed: "2026-07-23"
---

# Spring Cloud Discovery, LoadBalancer, And HTTP Clients

## Discovery Model

A registry maps a logical service name to instances and metadata. Instances register and
renew leases; clients or servers query/watch the registry; health/expiry removes failed
members after detection delays. Discovery is eventually consistent.

```text
service instance -> register/heartbeat -> registry
caller -> cached instance list -> load-balancer -> chosen instance
```

Eureka self-preservation trades aggressive eviction for availability during widespread
network/heartbeat loss. Understand lease duration, renewal interval, registry replication,
client cache refresh, and zone metadata before tuning.

## Stale Instance Failure

An instance can be returned after it stopped serving due to lease expiry, cache delay, or
network partition. Readiness/draining, bounded connect timeout, retry to another instance
where safe, and graceful deregistration reduce impact. Retrying a non-idempotent request can
duplicate work after an ambiguous response.

## Spring Cloud LoadBalancer

It receives a logical service ID, obtains a `ServiceInstance` list, applies selection, and
rewrites/routs the request. Round-robin and random selection do not account automatically
for heterogeneous capacity, outstanding requests, zone cost, warm-up, or overload.

Load balancing occurs at multiple layers: DNS, cloud LB, gateway, client library, Kubernetes
Service, and service mesh. Avoid accidental stacks whose independent retries multiply load.

## OpenFeign Boundary

```java
@FeignClient(name = "inventory-service", path = "/internal/inventory")
interface InventoryClient {
    @PostMapping("/reservations")
    ReservationResponse reserve(@RequestBody ReservationRequest request,
                                @RequestHeader("Idempotency-Key") String key);
}
```

Treat it as a remote port, not a local method. Define connection/read deadlines, request and
error contracts, serialization, authentication, idempotency, retry policy, logging redaction,
metrics, and trace propagation. Map remote errors into domain/application categories without
discarding diagnostic context.

## Deadline And Retry Budget

```text
caller deadline
  > queue + connect + TLS + server queue + processing + response
  + at most bounded retry/backoff
```

Timeouts should be derived from the caller SLO and downstream tail latency. A circuit breaker
does not replace a timeout. Retrying at gateway, client, service mesh, and SDK can create an
exponential retry storm; assign retry ownership.

Safe retry candidates are idempotent reads or commands with a durable idempotency key and
known replay semantics. Retry only classified transient failures, use jitter, cap attempts,
and respect remaining deadline.

## Kubernetes Alternative

Kubernetes Services/DNS already provide discovery and virtual-IP/load-balancing behavior.
Running Eureka inside Kubernetes can be justified for hybrid/platform requirements, but it
adds a second source of truth. Compare health semantics, topology awareness, cross-cluster
needs, migration constraints, and operational ownership.

## Production Scenarios

**Registry unavailable.** Cached lists may let traffic continue temporarily. Prevent new
unsafe registration assumptions, restore quorum/service, monitor cache age, and avoid turning
every client into a tight registry-retry loop.

**One instance receives most traffic.** Check instance list, zone filters, load-balancer
strategy, connection reuse, gateway/proxy behavior, long-lived streams, capacity differences,
and request-key affinity.

**Feign calls hang.** Verify DNS/discovery selection, pool acquisition, connect/read timeout,
thread dumps, downstream latency, and whether a retry/circuit wrapper owns the call.

## Interview Questions

**Discovery versus load balancing?** Discovery finds candidate instances; load balancing
selects one. Platform implementations can combine them but the concerns differ.

**Why can a healthy registry return a dead instance?** Leases and client caches are eventually
consistent; graceful drain and bounded client failure handling remain necessary.

## Official References

- [Spring Cloud Netflix reference](https://docs.spring.io/spring-cloud-netflix/reference/)
- [Spring Cloud Commons and LoadBalancer](https://docs.spring.io/spring-cloud-commons/reference/)
- [Spring Cloud OpenFeign reference](https://docs.spring.io/spring-cloud-openfeign/reference/)

## Recommended Next

Continue with [Circuit Breaker, Gateway, Resilience Composition, And Capacity](./SPRING-CLOUD-RESILIENCE-GATEWAY.md).

