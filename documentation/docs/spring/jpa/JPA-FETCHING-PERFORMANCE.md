---
title: JPA Fetching Performance And N Plus One
description: Spring Data fetch plans using entity graphs, projections, explicit queries, pagination, and production SQL evidence.
difficulty: Advanced
page_type: Tutorial
status: Generic
prerequisites: [Spring Data repositories, JPA associations, SQL execution plans]
learning_objectives: [Select a bounded fetch plan for each repository use case, Detect N plus one and row multiplication from evidence, Roll out query and index changes safely]
technologies: [Spring Data JPA, Hibernate ORM, JDBC, SQL]
last_reviewed: "2026-07-13"
---

# JPA Fetching Performance And N Plus One

<DocLabels items={[
  {label: 'Advanced', tone: 'advanced'},
  {label: 'Fetch plans', tone: 'foundation'},
  {label: 'Performance evidence', tone: 'production'},
  {label: 'Shopverse current state', tone: 'shopverse'},
]} />

Spring Data makes fetch-plan choices visible at the repository boundary through
entity graphs, projections, and explicit queries. The canonical provider-level
explanation of lazy proxies, batch fetching, and Hibernate internals remains in
[Hibernate Fetching And Performance](../../data/hibernate/HIBERNATE-FETCHING-PERFORMANCE.md).

```mermaid
flowchart TD
    UseCase["Read use case"] --> Shape{"Required result shape"}
    Shape -->|"entity + bounded to-one/to-many"| Graph["@EntityGraph"]
    Shape -->|"small read model"| DTO["DTO projection"]
    Shape -->|"complex cardinality"| Query["Explicit query / two-step IDs"]
    Graph --> Verify["Query count + rows + plan"]
    DTO --> Verify
    Query --> Verify
    Verify --> Bound["Page size, timeout, pool capacity"]
```

## Recognize N Plus One

One query loads parent rows, then association access produces one query per parent:

```text
select ... from orders where customer_username = ?
select ... from order_items where order_id = ?  -- repeated
```

The failure is a missing use-case fetch plan, not simply the presence of `LAZY`.
Making every association eager can still issue secondary selects and can make
unrelated reads load too much data.

## Spring Data Fetch Options

### Entity Graph

```java
@EntityGraph(attributePaths = "items")
Optional<OrderEntity> findWithItemsByOrderNumber(String orderNumber);
```

Use an entity graph when the service needs managed entities and the joined
cardinality is bounded. Graph names or dedicated method names make fetch intent
reviewable.

### DTO Projection

```java
@Query("""
       select new com.example.OrderSummary(
           o.orderNumber, o.status, o.totalAmount, o.createdAt)
         from OrderEntity o
        where o.customerUsername = :username
        order by o.createdAt desc, o.id desc
       """)
Page<OrderSummary> findSummaries(String username, Pageable pageable);
```

Use a projection when no entity mutation is required. It reduces selected columns
and prevents accidental traversal of a persistence graph.

### Two-Step Pagination

Collection fetch joins can multiply rows and conflict with entity-level pagination.
For a page with children, first select ordered parent IDs, then fetch details for
those IDs. Preserve the original order explicitly.

<DocCallout type="mistake" title="distinct does not remove the database cost">

JPQL `distinct` can deduplicate entity references after a join, but the database
still processes the multiplied rows. Measure rows returned and memory, not only the
number of Java objects.

</DocCallout>

## Shopverse Current Fetch Plans

<DocCallout type="shopverse" title="Current implementation and current gap">

Order repository methods use `@EntityGraph(attributePaths = "items")`, and User
repository methods fetch roles and permissions for authorization paths. This is
current code. Some Order history methods return unpaged lists with items; replacing
those with bounded pages or summaries is a proposed production hardening, not an
implemented claim.

</DocCallout>

## Batching And Write Throughput

Spring Data `saveAll` does not prove JDBC batching. Identifier generation,
statement ordering, SQL shape, flushes, and driver configuration determine the
actual round trips. For large bounded imports, flush and clear periodically so the
persistence context does not grow without limit.

<DocCallout type="production" title="Measure the wire behavior">

Enable bounded SQL/statistics diagnostics in a safe environment and compare
prepared-statement count, batch execution, rows written, transaction duration, and
connection occupancy. A configuration property alone is not evidence.

</DocCallout>

## Pagination, Timeouts, And Indexes

- cap page size at the API boundary;
- use a deterministic order with a unique tiebreaker;
- prefer a `Slice` when an exact total count is unnecessary;
- consider keyset pagination for very large append-oriented histories;
- set query timeouts below the request deadline;
- align predicates and ordering with a measured index.

Introduce a new index before the query that depends on it. Keep the old index
during mixed-version deployment and rollback; remove it only after query traffic no
longer uses it.

## Executable Evidence Pattern

```java
@DataJpaTest
class OrderFetchPlanTest {
    @Test
    void customerPageUsesABoundedQueryPlan() {
        // Seed several orders and items in a production-engine container.
        // Reset Hibernate statistics, invoke the repository, and assert:
        // - bounded result size;
        // - expected query count;
        // - initialized fields required by the DTO mapping.
    }
}
```

Pair query-count assertions with a production-engine execution plan. A test with
ten uniform rows cannot prove behavior at production cardinality or skew.

## Incident Workflow

1. correlate endpoint latency with datasource pending/acquisition time;
2. capture the slow query and the request path that triggered it;
3. count statements and rows, including serialization-time queries;
4. inspect the database plan, estimates, locks, and buffer reads;
5. reproduce with realistic cardinality;
6. change one fetch/index decision and compare p95/p99 plus database load;
7. retain a rollback for both query code and schema objects.

## Interview Questions

<ExpandableAnswer title="Why is FetchType.EAGER not a reliable N plus one solution?">

It changes the default loading requirement, not the use-case query plan. Hibernate
may still issue secondary selects, while unrelated repository methods load more
data than required.

</ExpandableAnswer>

<ExpandableAnswer title="When should a repository use an entity graph instead of a DTO projection?">

Use an entity graph when the transaction needs managed entities and a bounded
association graph. Use a DTO when the path is read-only and should expose only a
small stable result shape.

</ExpandableAnswer>

<ExpandableAnswer title="Why can a collection fetch join break pagination?">

The database paginates joined rows while the application expects parent entities.
One parent can occupy several rows, causing missing parents, unstable pages, or
in-memory pagination.

</ExpandableAnswer>

<ExpandableAnswer title="How do you prove that saveAll is batching inserts?">

Observe prepared statements and batch executions with the deployed identifier
strategy and driver. Compare round trips and throughput; do not infer batching from
the repository method name.

</ExpandableAnswer>

## Official References

- [Spring Data JPA entity graphs](https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html)
- [Spring Data repository projections](https://docs.spring.io/spring-data/jpa/reference/repositories/projections.html)
- [Hibernate ORM fetching](https://docs.hibernate.org/orm/current/userguide/html_single/)

## Recommended Next

Continue with [Transactions, Locking And Concurrency](./JPA-TRANSACTIONS-LOCKING.md).
