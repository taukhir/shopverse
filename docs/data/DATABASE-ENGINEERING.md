---
title: Database Engineering
sidebar_position: 1
---

# Database Engineering

## Relational Modeling

Start from business invariants, ownership, cardinality, and access patterns.
Tables should represent stable concepts and enforce critical rules with keys,
constraints, and indexes.

## Normalization

| Form | Main rule |
|---|---|
| 1NF | atomic values and no repeating groups |
| 2NF | 1NF plus no partial dependency on part of a composite key |
| 3NF | 2NF plus no transitive dependency on non-key columns |
| BCNF | every determinant is a candidate key |
| 4NF | no independent multivalued dependencies in one table |

Normalization reduces update anomalies. Denormalization can improve specific
read paths but creates synchronization responsibility. Use it deliberately and
measure the benefit.

### Unnormalized Example

```text
ORDER(
  order_id,
  customer_name,
  customer_email,
  product_ids = "101,102",
  product_names = "Keyboard,Mouse",
  quantities = "1,2"
)
```

Problems:

- values are not atomic;
- products cannot be indexed or joined correctly;
- changing a product name requires updating many orders;
- deleting the final order may accidentally remove the only customer data;
- concurrent updates can produce inconsistent lists.

### First Normal Form

Move repeating products to rows:

```text
ORDER_LINE(order_id, product_id, product_name, quantity)
```

Every column value is atomic and every row can be identified.

### Second Normal Form

If the key is `(order_id, product_id)`, `product_name` depends only on
`product_id`, not the full key:

```text
ORDER_LINE(order_id, product_id, quantity)
PRODUCT(product_id, product_name)
```

This removes partial dependency.

### Third Normal Form

If Order stores `customer_id`, `customer_name`, and `customer_email`, customer
details depend on `customer_id`, not directly on `order_id`:

```text
ORDERS(order_id, customer_id, created_at)
CUSTOMER(customer_id, name, email)
```

This removes transitive dependency.

### Advantages And Disadvantages

| Advantages | Costs |
|---|---|
| fewer update/insert/delete anomalies | more joins |
| one authoritative location per fact | more tables and foreign keys |
| stronger consistency | read queries can be more complex |
| smaller repeated data footprint | reporting may need projections |
| clearer ownership and constraints | distributed joins remain inappropriate |

### When To Denormalize

Consider denormalization only when measurements show a read-path need:

- precomputed order totals;
- product-name snapshot on an historical order line;
- CQRS read model;
- materialized reporting view;
- analytics warehouse;
- search index;
- cached aggregate.

Define the authoritative source, refresh mechanism, acceptable staleness,
rebuild procedure, and monitoring. Do not denormalize merely to avoid learning
joins.

## Joins

| Join | Meaning |
|---|---|
| `INNER JOIN` | rows matching both sides |
| `LEFT JOIN` | every left row plus matching right rows |
| `RIGHT JOIN` | every right row plus matching left rows |
| `FULL OUTER JOIN` | rows from either side; not directly supported by MySQL |
| `CROSS JOIN` | Cartesian product |

Join columns normally need compatible types and useful indexes. A join across
tables in one service database is normal; a join across microservice-owned
databases violates service ownership.

Example data:

```text
customer: (1, Ahmed), (2, Sara), (3, Nina)
orders:   (100, customer 1), (101, customer 1), (102, customer 2)
```

```sql
-- Only customers having orders.
SELECT c.id, c.name, o.id AS order_id
FROM customer c
INNER JOIN orders o ON o.customer_id = c.id;

-- Every customer, including Nina with a NULL order.
SELECT c.id, c.name, o.id AS order_id
FROM customer c
LEFT JOIN orders o ON o.customer_id = c.id;

-- Customers without an order.
SELECT c.id, c.name
FROM customer c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;

-- All product/category combinations.
SELECT p.name, c.name
FROM product p
CROSS JOIN category c;
```

Avoid accidental Cartesian products caused by a missing join predicate.

## Indexes

An index improves selected reads at the cost of storage and write overhead.

Good candidates:

- primary and unique keys;
- foreign keys;
- frequent equality and range filters;
- join columns;
- columns supporting common `ORDER BY` patterns.

Composite index order matters:

```sql
CREATE INDEX idx_outbox_status_created
    ON outbox_events(status, created_at);
```

This supports scans such as:

```sql
SELECT *
FROM outbox_events
WHERE status = 'PENDING'
ORDER BY created_at
LIMIT 50;
```

Avoid indexing every column. Low-selectivity indexes and overlapping indexes
can slow writes without improving real plans.

### Index Types

| Index | Use | Trade-off |
|---|---|---|
| primary/clustered organization | row identity and storage order depending on DB | only one clustered organization |
| unique | enforce business uniqueness | adds write validation |
| B-tree | equality, range, prefix ordering | common default, write/storage cost |
| hash | equality lookup in supported engines | no range/order support |
| composite | multi-column filters/order | leftmost-prefix and column order matter |
| covering | contains all columns needed by query | larger index and more write cost |
| partial/filtered | index only matching rows where supported | DB-specific |
| functional/expression | query on computed expression | expression must match and DB support varies |
| full-text | tokenized text search | not a replacement for transactional index |
| bitmap | low-cardinality analytics in supporting systems | poor fit for frequent OLTP writes |

### Composite Index Order

For:

```sql
SELECT id, order_number
FROM orders
WHERE customer_id = ?
  AND status = ?
ORDER BY created_at DESC
LIMIT 20;
```

A candidate is:

```sql
CREATE INDEX idx_orders_customer_status_created
    ON orders(customer_id, status, created_at DESC);
```

Put equality filters before range/sort columns as a starting heuristic, then
confirm with the actual execution plan and data distribution.

### Index Disadvantages

- every insert/update/delete may maintain additional trees;
- indexes consume memory and disk;
- extra indexes slow migrations and replication;
- overlapping indexes complicate optimizer choices;
- low-selectivity indexes may not reduce scanned rows;
- random keys can create page fragmentation or poor locality.

## Query Optimization

1. Capture the exact slow query and parameters.
2. Use `EXPLAIN` or `EXPLAIN ANALYZE`.
3. Check rows examined, access type, chosen indexes, sorting, and temporary
   tables.
4. Select only required columns.
5. Add or reorder indexes based on the access pattern.
6. Remove N+1 application behavior.
7. Retest with realistic data volume.

### Practical Techniques

1. Avoid `SELECT *`; return required columns or projections.
2. Paginate bounded result sets.
3. Prefer keyset pagination for deep ordered traversal.
4. Index filters, join keys, and common ordering together.
5. Avoid functions on indexed columns unless using a matching functional index.
6. Replace N+1 ORM access with fetch plans or projections.
7. Batch inserts/updates and flush/clear in controlled chunks.
8. Use `EXISTS` when only existence matters.
9. Avoid leading-wildcard searches on ordinary B-tree indexes.
10. Use query timeouts and cancellation.
11. Keep statistics current.
12. archive or partition very large time-based data.
13. use materialized views for expensive stable aggregates.
14. cache only after measuring and defining invalidation.
15. shard only after simpler database and partitioning options are exhausted.

```sql
-- Avoid transferring unused large columns.
SELECT id, order_number, status
FROM orders
WHERE customer_id = ?
ORDER BY created_at DESC
LIMIT 20;
```

### Materialized Views

A materialized view stores a query result physically:

```sql
CREATE MATERIALIZED VIEW daily_payment_summary AS
SELECT payment_date, status, COUNT(*) AS payment_count, SUM(amount) AS total
FROM payment
GROUP BY payment_date, status;
```

Advantages:

- fast reporting reads;
- avoids repeatedly executing expensive joins/aggregations;
- isolates operational queries from some reporting cost.

Disadvantages:

- data can be stale;
- refresh consumes resources and needs scheduling;
- not supported identically by every database;
- concurrent refresh and indexing are database-specific.

MySQL does not provide native materialized views; use a summary table maintained
by scheduled jobs/events or a dedicated read model.

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

### Why Can An Index Make Writes Slower?

The database must maintain every affected index, potentially split pages,
generate more WAL/redo, and replicate more data.

### When Does A Composite Index Work?

It commonly supports predicates beginning with its leftmost columns. Exact
behavior depends on the optimizer, ranges, skip-scan support, and query shape.

### Partitioning Versus Sharding?

Partitioning divides data inside a database system. Sharding divides ownership
across database nodes and requires routing and distributed-operation design.

### Why Avoid `SELECT *`?

It transfers unnecessary data, prevents some covering-index plans, couples code
to schema additions, and increases serialization/network/memory work.

### Normalization Versus Denormalization?

Normalize authoritative transactional data to reduce anomalies. Denormalize
measured read models with explicit synchronization and staleness rules.

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
