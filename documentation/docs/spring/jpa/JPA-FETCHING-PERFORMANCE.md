---
title: JPA Fetching Performance And N Plus One
---

# JPA Fetching Performance And N Plus One

N+1 prevention, batching, pagination, query hints, optimization workflow, and production rules.

Back to [Spring Data JPA](../SPRING-DATA-JPA.md).

## The N+1 Query Problem

N+1 occurs when one query loads parent rows and another query runs for each
parent relationship:

```java
List<OrderEntity> orders = repository.findAll();

for (OrderEntity order : orders) {
    log.info("items={}", order.getItems().size());
}
```

Generated pattern:

```sql
select * from orders;                    -- 1 query
select * from order_items where order_id = 1;
select * from order_items where order_id = 2;
select * from order_items where order_id = 3;
-- one query for every order
```

For 100 orders this becomes 101 queries.

### Solution 1: Fetch Join

```java
@Query("""
        select distinct o
        from OrderEntity o
        left join fetch o.items
        where o.id = :id
        """)
Optional<OrderEntity> findWithItems(@Param("id") Long id);
```

Generated shape:

```sql
select o.*, i.*
from orders o
left join order_items i on i.order_id = o.id
where o.id = ?;
```

Use `distinct` at the JPQL entity level because one order appears once per
joined item in the SQL result.

Avoid paginating a collection fetch join. The SQL row count represents joined
rows rather than parent entities, and Hibernate may paginate in memory or
produce incorrect expectations.

### Solution 2: Entity Graph

```java
@EntityGraph(attributePaths = {"items"})
Optional<OrderEntity> findWithItemsById(Long id);
```

An entity graph describes the relationships required for this repository
method without embedding the fetch join in JPQL.

Named graph:

```java
@NamedEntityGraph(
        name = "Order.summary",
        attributeNodes = {
                @NamedAttributeNode("items")
        }
)
@Entity
class OrderEntity {
}
```

```java
@EntityGraph(value = "Order.summary")
Optional<OrderEntity> findDetailedById(Long id);
```

### Solution 3: DTO Projection

If the endpoint needs a report rather than mutable aggregates, query the exact
shape:

```java
@Query("""
        select new com.example.OrderLineView(
                o.orderNumber,
                i.productId,
                i.quantity
        )
        from OrderEntity o
        join o.items i
        where o.customerUsername = :username
        """)
List<OrderLineView> findOrderLines(String username);
```

This avoids entity graph hydration and lazy traversal.

### Solution 4: Batch Fetching

```yaml
spring:
  jpa:
    properties:
      hibernate:
        default_batch_fetch_size: 50
```

Or per relationship:

```java
@BatchSize(size = 50)
@OneToMany(mappedBy = "order")
private List<OrderItemEntity> items;
```

Hibernate groups lazy loads:

```sql
select *
from order_items
where order_id in (?, ?, ?, ..., ?);
```

Batch fetching reduces N+1 to roughly `1 + ceil(N / batchSize)`. It is a useful
safety net, not a substitute for intentional query design.

### Solution 5: Two-Step Pagination

For paginated parents with child collections:

1. page only parent IDs;
2. fetch parents and children using those IDs;
3. restore the requested order in application code.

```java
Page<Long> ids = repository.findPageIds(username, pageable);
List<OrderEntity> orders = repository.findAllWithItemsByIdIn(ids.getContent());
```

This preserves database pagination while avoiding one child query per parent.

### Detecting N+1

- enable SQL and bind-parameter logging only in controlled development;
- inspect Hibernate statistics;
- use datasource-proxy or P6Spy in tests;
- assert query counts for critical repository methods;
- inspect APM traces and database query-rate spikes;
- run integration tests with realistic parent and child counts.

Do not solve N+1 by enabling `EAGER` everywhere.

### Which N+1 Solution Should You Use?

Choose the fetch plan for one use case rather than changing the entity mapping
globally:

| Situation | Best approach | Reason |
|---|---|---|
| Login: one user with roles and permissions | `@EntityGraph` or `JOIN FETCH` | load the complete authentication graph in one bounded operation |
| Need exact join type or query predicate | JPQL `JOIN FETCH` | query controls inner/left join and filtering explicitly |
| Loading many users and later reading roles | batch fetching | groups lazy collection loads without creating one huge join |
| Large list or reporting API | DTO projection | selects only fields required by the response |
| Huge or multiple nested collections | separate bounded queries | avoids cartesian multiplication and excessive managed entities |
| Pagination with collections | page IDs plus DTO/batch fetch | collection fetch joins distort parent pagination |
| Simple CRUD that does not use associations | keep relationships lazy | avoids paying for data that the operation never reads |

Shopverse User Service demonstrates a bounded authentication fetch:

```java
@EntityGraph(attributePaths = {"roles", "roles.permissions"})
Optional<User> findByUsername(String username);
```

This is appropriate because login loads exactly one User and immediately needs
all authorities. Applying the same graph to a page containing thousands of
users would produce much more duplicated SQL data and memory pressure.

Use this decision sequence:

1. identify the exact response or business operation;
2. decide whether entities will be modified or only displayed;
3. count expected parents and children;
4. preserve database pagination;
5. select the smallest fetch plan that meets the requirement;
6. verify query count and result size with realistic data.


## JDBC Batching

Batching groups similar insert or update statements into fewer network
round-trips:

```yaml
spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 50
        order_inserts: true
        order_updates: true
        batch_versioned_data: true
```

MySQL JDBC commonly benefits from:

```text
jdbc:mysql://mysql:3306/orders?rewriteBatchedStatements=true
```

Exact driver behavior should be verified for the deployed connector version.

### Batched Inserts

```java
@Transactional
public void importProducts(List<CreateProductCommand> commands) {
    int batchSize = 50;

    for (int index = 0; index < commands.size(); index++) {
        entityManager.persist(toEntity(commands.get(index)));

        if ((index + 1) % batchSize == 0) {
            entityManager.flush();
            entityManager.clear();
        }
    }
}
```

`flush` sends the current batch. `clear` detaches managed entities so a large
import does not retain every object in the first-level cache.

`saveAll` does not guarantee efficient JDBC batching by itself. Efficiency
depends on ID strategy, Hibernate configuration, statement similarity, flush
behavior, and driver support.

### Batching Limitations

- `IDENTITY` generation can prevent insert batching;
- interleaved entity types can split batches;
- cascades can produce unexpected statement order;
- very large transactions consume memory, locks, undo logs, and connections;
- bulk JPQL or database-native operations may be better for large updates.

Use bounded chunks and define restart or idempotency behavior for imports.


## Pagination And Sorting

```java
Page<OrderSummary> findByCustomerUsername(
        String username,
        Pageable pageable
);
```

`Page` normally executes a data query and a count query. For expensive queries:

- provide an optimized `countQuery`;
- use `Slice` when the total is unnecessary;
- use cursor/keyset pagination for deep pages;
- allow-list sort fields;
- include a unique tie-breaker such as ID.

Never expose unbounded `findAll()` operations over production tables.


## Query Hints And Timeouts

```java
@QueryHints({
        @QueryHint(
                name = "jakarta.persistence.query.timeout",
                value = "2000"
        )
})
@Query("select o from OrderEntity o where o.orderNumber = :number")
Optional<OrderEntity> findTimed(@Param("number") String number);
```

Timeout support and units can vary by provider and driver. Apply an end-to-end
request deadline as well; a query timeout alone does not bound queueing or
connection acquisition.


## Query Optimization Workflow

1. Identify the slow API or business operation.
2. Record query count and total database time.
3. Inspect generated SQL and bound values.
4. Run `EXPLAIN` or `EXPLAIN ANALYZE`.
5. check indexes against filters, joins, and ordering.
6. reduce selected columns with projections.
7. eliminate N+1 and unbounded result sets.
8. validate connection-pool and lock wait behavior.
9. test with production-like row counts and distributions.
10. compare metrics before and after the change.

An index can accelerate reads but increases storage and write cost. Index
actual access patterns rather than every column.


## Production Do And Do Not

| Do | Do not |
|---|---|
| Put transaction boundaries in services | Open transactions in controllers |
| Use migrations for constraints and indexes | Depend on `ddl-auto=update` |
| Keep associations lazy and query intentionally | Mark every relation eager |
| Use projections for read models | Return entities from REST APIs |
| Bind query parameters | Concatenate external values into JPQL or SQL |
| Cap pages and batches | Load entire production tables |
| Use database uniqueness for invariants | Rely only on existence checks |
| Keep locks and transactions short | Perform remote calls while holding locks |
| Inspect generated SQL and plans | Assume repository names imply efficient SQL |
| Test with the production database engine | Trust an in-memory database for dialect behavior |








