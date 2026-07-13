---
title: "Debugging Data, SAGA, And Kafka"
description: "Debugging Data, SAGA, And Kafka with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "Debugging Data, SAGA, And Kafka"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Debugging Data, SAGA, And Kafka

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

## Database And Liquibase

Check service logs for:

```text
connection refused
access denied
unknown database
pool timeout
checksum validation
DATABASECHANGELOGLOCK
schema validation
deadlock
optimistic locking
unique constraint
```

For a stuck Liquibase lock, first prove no migration process is active. Preserve
startup logs and inspect `DATABASECHANGELOGLOCK`. Clearing a live lock can allow
concurrent schema changes.

For query/load issues, inspect:

- Hikari active, idle, and pending connections;
- slow queries and indexes;
- transaction duration;
- lock waits and deadlocks;
- unbounded list endpoints;
- N+1 query patterns.

## Checkout And SAGA

Inspect in this order:

1. `orders`
2. `order_items`
3. `order_timeline_events`
4. Order `outbox_events`
5. Inventory `inventory_reservations`
6. Inventory `outbox_events`
7. `payments`
8. Payment `outbox_events`
9. each service's `failed_kafka_events`

Interpretation:

| Last evidence | Likely area |
|---|---|
| Order exists, no outbox | local transaction/code defect |
| Order outbox pending | publisher or Kafka |
| Order outbox published, no reservation | Inventory consumer/group/schema |
| reservation exists, no Inventory outbox | Inventory transaction defect |
| inventory event published, no payment | Payment consumer |
| payment captured, Order not confirmed | Payment outbox or Order consumer |
| payment failed, stock still reserved | compensation consumer |

Never create a second checkout to “unstick” the first with a new idempotency
key until its state is understood.

## Outbox Failure

PromQL:

```promql
sum by (outcome) (increase(shopverse_outbox_publish_total[15m]))
```

Check:

- scheduler is running;
- outbox status and attempts;
- Kafka DNS/network/topic;
- broker acknowledgement timeout;
- row-lock errors;
- serialization;
- repeated unbounded retries.

The current implementation lacks a complete terminal/backoff policy. During a
long Kafka outage, monitor resource use and log volume.

## Kafka

List and describe topics:

```powershell
docker compose exec kafka kafka-topics.sh `
  --bootstrap-server localhost:9092 `
  --list

docker compose exec kafka kafka-topics.sh `
  --bootstrap-server localhost:9092 `
  --describe `
  --topic shopverse.order.created
```

Inspect groups and lag:

```powershell
docker compose exec kafka kafka-consumer-groups.sh `
  --bootstrap-server localhost:9092 `
  --describe --all-groups
```

Growing lag can mean slow handlers, failures, too few active consumers, hot
partitions, database contention, or rebalance loops.

Check retry and DLT topics before declaring a message lost.

## DLT And Replay

1. Confirm attempts were exhausted.
2. Inspect the DLT handler log.
3. Inspect `failed_kafka_events`.
4. Identify whether the cause is malformed data, incompatible schema, missing
   state, or unavailable dependency.
5. Fix the cause.
6. Replay through the admin API.
7. Confirm replay audit and downstream idempotency.

Do not repeatedly replay unchanged poison data.

## Duplicate Requests

For duplicate checkout:

- verify the same idempotency key was reused;
- inspect the unique constraint failure;
- confirm the key is associated with the same logical request;
- inspect one order/reservation/payment result;
- distinguish HTTP retry from duplicate Kafka delivery.

Different keys intentionally represent different commands.

## Inventory Conflicts

An optimistic-lock exception means concurrent updates used the same entity
version. Confirm:

- available and reserved quantities;
- reservation uniqueness/order association;
- retry count and idempotency;
- transaction boundaries;
- whether a stale entity was retained outside a transaction.

Retry with fresh state only when the complete business operation is idempotent.

## Payment Problems

Check:

- current simulation mode;
- payment status;
- failure reason;
- order owner;
- outgoing outbox row;
- completion/failure event;
- reconciliation/refund audit.

`TIMED_OUT` is an uncertain outcome, not automatically a decline. Use the
reconciliation API rather than creating a second charge.

## Recommended Next

Return to [Shopverse Debugging](./DEBUGGING.md) to select the next focused guide.


## Official References

- [Spring Framework reference](https://docs.spring.io/spring-framework/reference/)
- [Spring Boot reference](https://docs.spring.io/spring-boot/reference/)
