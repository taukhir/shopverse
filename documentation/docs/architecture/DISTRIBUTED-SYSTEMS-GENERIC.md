---
title: Distributed Systems Fundamentals
sidebar_position: 1
status: "maintained"
last_reviewed: "2026-07-13"
---

# Distributed Systems Fundamentals

A distributed system contains independent processes running on multiple
machines that cooperate through a network to provide one broader capability.
Each process has its own memory, execution lifecycle, clock, and failure modes.

Examples include:

- microservices;
- distributed databases;
- Kafka clusters;
- Redis clusters;
- cloud storage;
- container orchestration platforms;
- content-delivery networks.

## Why Build A Distributed System?

| Goal | Example |
|---|---|
| Horizontal scale | add service or database nodes |
| Availability | continue after one instance or zone fails |
| Independent ownership | teams deploy separate capabilities |
| Geographic proximity | serve users from nearby regions |
| Fault isolation | payment failure need not stop catalog reads |
| Specialized workloads | separate transactional, search, and analytics systems |

Distribution adds network latency, partial failure, data consistency,
coordination, deployment, security, and observability costs. A modular monolith
is usually preferable when one process and database meet the requirements.

## Fundamental Characteristics

### No Shared Memory

Processes communicate through messages:

```text
Service A -> HTTP/Kafka -> Service B
```

An in-process method call either returns or throws. A network call can:

- succeed;
- fail before reaching the server;
- succeed but lose the response;
- time out while still processing;
- be delivered more than once through retry.

### Partial Failure

One component can fail while others remain healthy:

```text
Gateway: healthy
Order: healthy
Inventory: slow
Payment: unavailable
Kafka: healthy
```

The system needs explicit intermediate states, deadlines, recovery, and
operator visibility.

### Independent Clocks

Machine clocks drift and messages experience variable delay. Timestamps are
useful for observation but cannot generally prove global event order.

Use:

- database sequence/version for aggregate order;
- Kafka offset for order within a partition;
- logical clocks where the algorithm requires causality;
- NTP for operational clock accuracy.

### Concurrency

Several nodes can process related work simultaneously. Correctness requires
idempotency, database constraints, versions, locks, consensus, or ownership
rules according to the invariant.

## Fallacies Of Distributed Computing

Dangerous assumptions include:

1. the network is reliable;
2. latency is zero;
3. bandwidth is infinite;
4. the network is secure;
5. topology does not change;
6. there is one administrator;
7. transport cost is zero;
8. the network is homogeneous.

Design reviews should identify where code implicitly relies on these
assumptions.

## Communication Models

### Synchronous

```text
caller -> request -> dependency
caller <- response <- dependency
```

Useful when the caller requires an immediate answer. It creates temporal
coupling: both parties must be available within the same deadline.

### Asynchronous

```text
producer -> broker/log -> consumer
```

Useful for durable facts, buffering, fan-out, and workflows that can complete
later. It introduces eventual consistency, duplicate delivery, ordering, and
recovery requirements.

## Delivery Semantics

| Semantic | Trade-off |
|---|---|
| At most once | no duplicates, but work may be lost |
| At least once | work is retried, so duplicates are possible |
| Exactly once | narrowly scoped guarantee requiring coordinated protocol/state |

End-to-end business exactly-once behavior normally comes from durable
idempotency and uniqueness, not a transport claim alone.

## Idempotency

An idempotent operation has the same intended effect when repeated:

```http
POST /orders/checkout
Idempotency-Key: customer-42-cart-1001
```

Persist the key and result atomically. Use database uniqueness to handle
concurrent duplicates.

For events, use an immutable event ID and transactional inbox:

```text
insert event ID uniquely
apply business change
write outgoing outbox event
commit
```

## Data Ownership

One service should be the authoritative writer for one domain aggregate:

```text
Order Service     -> Order DB
Inventory Service -> Inventory DB
Payment Service   -> Payment DB
```

Other services use APIs, events, or replicated read models. Shared writes make
invariants and migrations difficult to own.

## Scalability

### Vertical Scaling

Increase CPU, memory, storage, or network capacity of one node. It is simple
but has hardware and failure-domain limits.

### Horizontal Scaling

Add nodes and distribute work. It requires:

- stateless or partition-aware application design;
- load balancing;
- shared or partitioned state;
- concurrency safety;
- coordinated deployment and observability.

### Partitioning

Split data or work by a key:

```text
customer A-M -> partition 1
customer N-Z -> partition 2
```

Poor keys cause hot partitions and uneven load.

## Availability And Reliability

Availability asks whether the service can respond correctly now. Reliability
asks whether it continues behaving correctly over time.

Controls include:

- redundancy and replication;
- health checks and failover;
- timeouts and bounded retry;
- circuit breakers and bulkheads;
- backpressure and load shedding;
- durable queues and recovery records;
- backup and disaster recovery;
- graceful degradation.

## Observability

Distributed systems require:

- structured correlated logs;
- request and dependency metrics;
- distributed traces;
- queue/consumer lag;
- business workflow state;
- alert ownership and runbooks.

A trace may explain one execution. A correlation ID or business ID can connect
several executions across a long-running workflow.

## Security

- authenticate service and user identities;
- authorize every resource owner and operation;
- encrypt traffic;
- use least-privilege credentials and topic/database permissions;
- rotate secrets and certificates;
- validate messages and propagated headers;
- segment networks;
- audit privileged and recovery actions.

Internal traffic is not automatically trusted.

## Design Checklist

1. What happens when the request or response is lost?
2. Can retry duplicate a write?
3. Which component owns the authoritative state?
4. What consistency does each operation require?
5. How are concurrent updates controlled?
6. How does work recover after a crash?
7. How is overload rejected or buffered?
8. Can one region, zone, broker, or database fail?
9. How is the complete business journey observed?
10. How are contracts and schemas evolved?

## Related Guides

- [Consistency And CAP](DISTRIBUTED-CONSISTENCY-CAP.md)
- [CQRS](CQRS.md)
- [Distributed Databases](../data/DISTRIBUTED-DATABASES.md)
- [Distributed Transactions And Locks](../reliability/DISTRIBUTED-TRANSACTIONS-LOCKS.md)
- [Failure And Consensus](../reliability/DISTRIBUTED-FAILURE-CONSENSUS.md)
- [Caching Principles](CACHING-GENERIC.md)
- [Apache Kafka](../integration/APACHE-KAFKA.md)
- [SAGA And Outbox](../reliability/SAGA-GENERIC.md)
- [Resilience4j](../reliability/RESILIENCE4J-GENERIC.md)
- [Distributed Rate Limiting](../reliability/DISTRIBUTED-RATE-LIMITING.md)
- [High Availability And SPOF Prevention](../reliability/HIGH-AVAILABILITY-SPOF.md)
- [Distributed Systems Interview Questions](../reference/DISTRIBUTED-SYSTEMS-INTERVIEW.md)
