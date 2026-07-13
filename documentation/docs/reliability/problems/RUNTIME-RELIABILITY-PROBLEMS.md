---
title: Runtime Reliability Problems
status: "maintained"
last_reviewed: "2026-07-13"
---


# Runtime Reliability Problems

Runtime reliability problems are split by locking, distributed checkout,
timeline visibility, resource ownership, reservation expiry, idempotent
checkout, dependency lookup scope, Kafka idempotency, and payment uncertainty.

## Focused Pages

| Page | Covers |
|---|---|
| [Runtime Problem Index And Locking](runtime/INDEX-AND-LOCKING.md) | Runtime problem index and optimistic versus pessimistic locking. |
| [Reliable Distributed Checkout Problem](runtime/DISTRIBUTED-CHECKOUT.md) | Reliable checkout across Order, Inventory, Payment, Kafka, SAGA, and outbox. |
| [Queryable Order Timeline Problem](runtime/QUERYABLE-ORDER-TIMELINE.md) | Queryable owner-protected SAGA timeline for order support and debugging. |
| [Resource Ownership Authorization](runtime/RESOURCE-OWNERSHIP-AUTHORIZATION.md) | Preventing authenticated customers from reading another customer's Order timeline or Payment record. |
| [Multi-Replica Reservation Expiry](runtime/MULTI-REPLICA-RESERVATION-EXPIRY.md) | Atomic expiry ownership, paid-reservation state, transaction boundaries, crash behavior, and required tests. |
| [Idempotent Checkout Problem](runtime/IDEMPOTENT-CHECKOUT.md) | Mandatory Idempotency-Key and duplicate checkout prevention. |
| [Checkout Catalog Lookup Problem](runtime/CATALOG-LOOKUP-CHECKOUT.md) | Replacing checkout's full-catalog Inventory dependency with direct lookup now and bulk lookup before multi-item checkout. |
| [Kafka Idempotency Problem](runtime/KAFKA-IDEMPOTENCY.md) | Kafka producer idempotence, idempotent consumers, business keys, and duplicate event handling. |
| [Payment Timeout Reconciliation Problem](runtime/PAYMENT-TIMEOUT-RECONCILIATION.md) | Payment uncertainty, timeout reconciliation, and refunds. |

## Compatibility Anchors

The original long page was split into focused pages. These headings are kept so older links have a stable landing point.

## Problem Index

Moved to [Runtime Problem Index And Locking](runtime/INDEX-AND-LOCKING.md).

## Optimistic Versus Pessimistic Locking

Moved to [Runtime Problem Index And Locking](runtime/INDEX-AND-LOCKING.md).

## Reliable Distributed Checkout

Moved to [Reliable Distributed Checkout Problem](runtime/DISTRIBUTED-CHECKOUT.md).

## Queryable Order SAGA Timeline

Moved to [Queryable Order Timeline Problem](runtime/QUERYABLE-ORDER-TIMELINE.md).

## Resource Ownership Authorization

Moved to [Resource Ownership Authorization](runtime/RESOURCE-OWNERSHIP-AUTHORIZATION.md).

## Multi-Replica Reservation Expiry

Moved to [Multi-Replica Reservation Expiry](runtime/MULTI-REPLICA-RESERVATION-EXPIRY.md).

## Idempotent Checkout Using Mandatory Idempotency-Key

Moved to [Idempotent Checkout Problem](runtime/IDEMPOTENT-CHECKOUT.md).

## Checkout Catalog Lookup

Moved to [Checkout Catalog Lookup Problem](runtime/CATALOG-LOOKUP-CHECKOUT.md).

## Kafka Producer Idempotence And Idempotent Consumers

Moved to [Kafka Idempotency Problem](runtime/KAFKA-IDEMPOTENCY.md).

## Payment Timeout Reconciliation And Refunds

Moved to [Payment Timeout Reconciliation Problem](runtime/PAYMENT-TIMEOUT-RECONCILIATION.md).
