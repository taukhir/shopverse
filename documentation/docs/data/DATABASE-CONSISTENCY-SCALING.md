---
title: "Database Consistency And Scaling"
description: "Database Consistency And Scaling with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "Database Consistency And Scaling"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Database Consistency And Scaling

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

## ACID

| Property | Meaning |
|---|---|
| Atomicity | all transaction changes commit or none do |
| Consistency | constraints and invariants remain valid |
| Isolation | concurrent transactions have controlled visibility |
| Durability | committed changes survive failures according to storage guarantees |

ACID applies within one transaction manager. It does not make a MySQL update
and a Kafka send one atomic operation. Shopverse uses the transactional Outbox
to close that dual-write gap.

## CAP

During a network partition, a distributed system cannot simultaneously
guarantee both:

- strong consistency for every operation;
- availability for every request.

CAP is about behavior during partitions, not a permanent choice of only two
letters. Shopverse favors local database consistency and eventual cross-service
consistency through durable events.

## Partitioning

Partitioning divides one logical table within a database, often by date or
range:

```text
outbox_2026_01
outbox_2026_02
outbox_2026_03
```

Benefits include retention management and partition pruning. Poor partition
keys can create hotspots or fail to improve queries.

Partitioning keeps one logical database/table and is transparent to many
queries. It is most useful when predicates include the partition key and
operations align with partitions, such as dropping old monthly data.

## Sharding

Sharding distributes data across database servers:

```text
customer hash 0..3 -> shard A
customer hash 4..7 -> shard B
```

It adds routing, rebalancing, cross-shard query, transaction, backup, and
operational complexity. Shopverse does not currently implement sharding; it is
study material for future scale.

| Partitioning | Sharding |
|---|---|
| normally inside one database system | distributes across database nodes |
| database can route/prune | application/router needs shard awareness |
| simpler transactions and joins | cross-shard operations are difficult |
| limited by one system's overall scale | scales storage/write ownership horizontally |

## Functions, Procedures, And Triggers

| Construct | Purpose | Typical behavior |
|---|---|---|
| Function | calculate and return a value | often usable inside SQL expressions |
| Stored procedure | execute a multi-statement operation | invoked explicitly and may return result sets/out parameters |
| Trigger | react automatically to insert/update/delete | runs implicitly inside the modifying transaction |

Function example:

```sql
CREATE FUNCTION order_tax(amount DECIMAL(12,2))
RETURNS DECIMAL(12,2)
DETERMINISTIC
RETURN amount * 0.18;
```

Procedure example:

```sql
CREATE PROCEDURE expire_reservations(IN cutoff TIMESTAMP)
BEGIN
    UPDATE inventory_reservation
    SET status = 'EXPIRED'
    WHERE status = 'ACTIVE' AND expires_at < cutoff;
END;
```

Trigger example:

```sql
CREATE TRIGGER inventory_audit_after_update
AFTER UPDATE ON inventory
FOR EACH ROW
INSERT INTO inventory_audit(product_id, old_quantity, new_quantity)
VALUES (OLD.product_id, OLD.available, NEW.available);
```

Triggers can enforce cross-writer auditing but hide behavior from application
code, complicate testing, and add implicit transaction work. Prefer explicit
application/service logic for domain workflows; use database constructs when
central enforcement across all writers justifies them.

## Database Interview Questions

<ExpandableAnswer title="Why Can An Index Make Writes Slower?">

The database must maintain every affected index, potentially split pages,
generate more WAL/redo, and replicate more data.

</ExpandableAnswer>
<ExpandableAnswer title="When Does A Composite Index Work?">

It commonly supports predicates beginning with its leftmost columns. Exact
behavior depends on the optimizer, ranges, skip-scan support, and query shape.

</ExpandableAnswer>
<ExpandableAnswer title="Partitioning Versus Sharding?">

Partitioning divides data inside a database system. Sharding divides ownership
across database nodes and requires routing and distributed-operation design.

</ExpandableAnswer>
<ExpandableAnswer title="Why Avoid SELECT ?">

It transfers unnecessary data, prevents some covering-index plans, couples code
to schema additions, and increases serialization/network/memory work.

</ExpandableAnswer>
<ExpandableAnswer title="Normalization Versus Denormalization?">

Normalize authoritative transactional data to reduce anomalies. Denormalize
measured read models with explicit synchronization and staleness rules.

</ExpandableAnswer>

## Replication

Replication provides copies for availability and read scaling. Applications
must account for replication lag when reading immediately after a write.

## Deadlocks

Deadlocks occur when transactions acquire resources in incompatible order.

Mitigations:

- update rows in a consistent order;
- keep transactions short;
- index lock predicates;
- avoid remote calls inside transactions;
- retry deadlock victims with bounded backoff;
- monitor database deadlock reports.

## Microservice Database Rules

- database per service or strictly isolated schema ownership;
- no direct cross-service table access;
- Liquibase owns schema evolution;
- backups and restore tests are service-specific;
- use Outbox/events for cross-service change propagation;
- expose reporting through APIs, events, or purpose-built read models.

## Recommended Next

Return to [Database Engineering](./DATABASE-ENGINEERING.md) to select the next focused guide.


## Official References

- [MySQL reference manual](https://dev.mysql.com/doc/refman/8.4/en/)
- [Jakarta Persistence specification](https://jakarta.ee/specifications/persistence/)
