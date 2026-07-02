---
title: Functional And Non-Functional Requirements
---

# Functional And Non-Functional Requirements

Back to [HLD And LLD](../HLD-LLD.md).

Requirements define what the system must deliver. In system design, separate
them into functional and non-functional requirements before discussing services,
databases, queues, or cloud components.

## Functional Versus Non-Functional

| Requirement type | Meaning | Example in Shopverse |
|---|---|---|
| Functional requirement | what the system must do | customer can place an order |
| Non-functional requirement | how well or under what constraint the system must do it | checkout p95 latency under 500 ms |

Functional requirements describe visible behavior and business capabilities.
Non-functional requirements describe quality attributes such as performance,
availability, reliability, scalability, security, maintainability, and
operability.

## Functional Requirements

Functional requirements should be written as clear system behaviors.

Examples for an e-commerce system:

| Area | Functional requirement |
|---|---|
| Identity | user can register, login, and receive a JWT |
| Catalog | customer can view available products |
| Checkout | customer can place an order with an idempotency key |
| Inventory | system reserves stock during checkout |
| Payment | system authorizes, captures, declines, or refunds payment |
| Timeline | customer can view their own order timeline |
| Admin | administrator can inspect failed events and replay them |

Good functional requirement:

```text
The system must allow an authenticated customer to submit checkout for one or
more inventory items and receive an order number.
```

Weak requirement:

```text
The system should support orders.
```

The weak version is too broad. It does not state actor, action, input,
expected output, or boundary.

## Non-Functional Requirements

NFRs drive architecture more strongly than service count.

| NFR | Example target | Design impact |
|---|---|---|
| Availability | 99.9% monthly checkout acceptance | redundancy, health checks, failover |
| Latency | p95 checkout acceptance under 500 ms | caching, async processing, indexes |
| Throughput | 500 peak checkout requests/second | horizontal scaling, Kafka capacity |
| Durability | confirmed orders survive instance loss | database persistence, backups |
| Consistency | no overselling for one inventory item | locks, versioning, unique constraints |
| Security | owner-only order access; admin override | JWT, method security, resource ownership checks |
| Recovery | RPO 5 minutes, RTO 30 minutes | backup, replay, restore runbooks |
| Observability | trace checkout by correlation ID | logs, metrics, traces, dashboards |
| Maintainability | new payment method without changing checkout core | Strategy pattern, interfaces |
| Compliance | sensitive values not committed to Git | `.env`, secrets manager, audit |

## Making NFRs Measurable

Avoid vague requirements such as:

```text
The system must be fast.
The system must be scalable.
The system must be secure.
```

Prefer measurable statements:

```text
Checkout acceptance API must return p95 under 500 ms and p99 under 1.5 s
for 500 requests/second with one service instance unavailable.
```

```text
Inventory reservation must prevent overselling for the same product under
100 concurrent checkout attempts.
```

```text
Every externally visible request must include or generate X-Correlation-Id,
and logs across Gateway, Order, Inventory, and Payment must be searchable by
that ID.
```

## Requirement Quality Checklist

| Check | Question |
|---|---|
| Actor | who uses or triggers it? |
| Action | what must happen? |
| Input | what data enters the system? |
| Output | what response/event/state is expected? |
| Constraint | what latency, security, consistency, or capacity target applies? |
| Failure behavior | what happens when a dependency fails? |
| Testability | how will we prove it works? |

## Example: Checkout Requirements

Functional:

```text
FR-1: Authenticated customers can submit checkout.
FR-2: Checkout creates an order and publishes an order-created event.
FR-3: Inventory reserves stock or emits an inventory-failed event.
FR-4: Payment processes reserved orders and emits completed or failed events.
FR-5: Customers can query their own order timeline.
```

Non-functional:

```text
NFR-1: Checkout acceptance p95 latency must be below 500 ms at 500 RPS.
NFR-2: Repeated checkout requests with the same Idempotency-Key must not
       create duplicate orders.
NFR-3: Inventory must not oversell the same product under concurrent requests.
NFR-4: Kafka consumers must tolerate duplicate delivery.
NFR-5: Failed Kafka records must be persisted and replayable by administrators.
```

## Functional Requirements In Interviews

In a system-design interview, start by confirming the core features. Example
for "design an e-commerce checkout":

1. Can users browse products?
2. Can users add items to cart?
3. Is checkout synchronous or async?
4. Do we need payment authorization and capture?
5. Do we need order history?
6. Do administrators need dashboards or replay tools?

Do not jump into Kafka, Redis, or Kubernetes before clarifying the behavior.

## Non-Functional Requirements In Interviews

After functional scope is clear, ask measurable NFR questions:

1. How many daily and peak users?
2. What read/write ratio?
3. What latency target?
4. What availability target?
5. What consistency must be strict?
6. How long should data be retained?
7. What failure modes must be handled?
8. What security/compliance constraints exist?

These answers determine whether the design needs caching, sharding, queues,
replication, rate limits, SAGA, or stronger consistency.

## References

- [Functional and Non Functional Requirements - GeeksforGeeks](https://www.geeksforgeeks.org/software-engineering/functional-vs-non-functional-requirements/)
