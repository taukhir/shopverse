---
title: "Relational Modeling And Query Performance"
description: "Relational Modeling And Query Performance with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "Relational Modeling And Query Performance"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Relational Modeling And Query Performance

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

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

## Recommended Next

Return to [Database Engineering](./DATABASE-ENGINEERING.md) to select the next focused guide.


## Official References

- [MySQL reference manual](https://dev.mysql.com/doc/refman/8.4/en/)
- [Jakarta Persistence specification](https://jakarta.ee/specifications/persistence/)
