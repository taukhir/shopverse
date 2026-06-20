---
title: JPA Repositories Queries And Projections
---

# JPA Repositories Queries And Projections

Repository interfaces, derived queries, JPQL, native SQL, projections, specifications, and SQL injection prevention.

Back to [Spring Data JPA](../SPRING-DATA-JPA.md).

## Repository Interfaces

```java
public interface OrderRepository
        extends JpaRepository<OrderEntity, Long>,
                JpaSpecificationExecutor<OrderEntity> {
}
```

Useful base interfaces:

| Interface | Capability |
|---|---|
| `Repository` | marker with explicitly declared methods |
| `CrudRepository` | basic CRUD |
| `ListCrudRepository` | CRUD returning lists |
| `PagingAndSortingRepository` | pagination and sorting |
| `JpaRepository` | JPA CRUD, paging, flush, batch-oriented methods |
| `JpaSpecificationExecutor` | dynamic criteria specifications |

Expose only operations the domain needs. Extending `JpaRepository` is
convenient but also exposes broad mutation methods.


## Derived Queries

Spring Data parses method names:

```java
List<OrderEntity> findTop20ByCustomerUsernameAndStatusOrderByCreatedAtDesc(
        String customerUsername,
        OrderStatus status
);
```

Conceptual SQL:

```sql
select *
from orders
where customer_username = ?
  and status = ?
order by created_at desc
limit 20;
```

Derived methods work well for simple predicates. Use explicit queries when a
method name becomes difficult to understand.


## Custom JPQL Queries

JPQL operates on entities and entity attributes:

```java
@Query("""
        select o
        from OrderEntity o
        where o.customerUsername = :username
          and o.status in :statuses
        order by o.createdAt desc
        """)
List<OrderEntity> findCustomerOrders(
        @Param("username") String username,
        @Param("statuses") Set<OrderStatus> statuses
);
```

Parameters are bound values, not concatenated into the query.

### Modifying Queries

```java
@Modifying(clearAutomatically = true, flushAutomatically = true)
@Query("""
        update InventoryItemEntity item
           set item.availableQuantity = item.availableQuantity - :quantity
         where item.productId = :productId
           and item.availableQuantity >= :quantity
        """)
int reserveIfAvailable(
        @Param("productId") Long productId,
        @Param("quantity") int quantity
);
```

Call modifying queries inside a transaction. The returned row count provides
an atomic success signal:

```java
if (repository.reserveIfAvailable(productId, quantity) != 1) {
    throw new InsufficientInventoryException(productId);
}
```

Bulk JPQL updates bypass normal entity dirty checking and lifecycle callbacks.
Clear or refresh affected managed entities to avoid stale persistence-context
state.


## Native SQL Queries

```java
@Query(
        value = """
                select o.id, o.order_number, sum(i.quantity * i.unit_price)
                from orders o
                join order_items i on i.order_id = o.id
                where o.created_at >= :from
                group by o.id, o.order_number
                """,
        nativeQuery = true
)
List<OrderTotalView> findOrderTotals(@Param("from") Instant from);
```

Use native SQL for database-specific features, carefully optimized reports, or
queries that are clearer in SQL. Native queries increase coupling to the
database dialect and can require explicit count queries for pagination.


## Projections

Projections load only the fields required by a use case and avoid exposing
entities.

### Closed Interface Projection

```java
public interface OrderSummary {
    Long getId();
    String getOrderNumber();
    OrderStatus getStatus();
    BigDecimal getTotalAmount();
}
```

```java
Page<OrderSummary> findByCustomerUsername(
        String customerUsername,
        Pageable pageable
);
```

For a closed projection, Spring Data can select only referenced properties:

```sql
select id, order_number, status, total_amount
from orders
where customer_username = ?
limit ? offset ?;
```

### Open Interface Projection

```java
public interface OrderDisplay {

    String getOrderNumber();

    @Value("#{target.orderNumber + ' - ' + target.status}")
    String getLabel();
}
```

Open projections use SpEL and may require loading more entity state. Prefer
closed or DTO projections for predictable query performance.

### Record Or Class DTO Projection

```java
public record OrderSummaryResponse(
        Long id,
        String orderNumber,
        OrderStatus status,
        BigDecimal totalAmount
) {
}
```

JPQL constructor projection:

```java
@Query("""
        select new com.example.order.api.OrderSummaryResponse(
                o.id,
                o.orderNumber,
                o.status,
                o.totalAmount
        )
        from OrderEntity o
        where o.customerUsername = :username
        """)
Page<OrderSummaryResponse> findSummaries(
        @Param("username") String username,
        Pageable pageable
);
```

DTO projections provide an explicit contract and work well for read APIs.

### Dynamic Projection

```java
<T> Optional<T> findByOrderNumber(
        String orderNumber,
        Class<T> projectionType
);
```

```java
OrderSummary summary = repository.findByOrderNumber(
        orderNumber,
        OrderSummary.class
).orElseThrow();
```

Dynamic projections reduce repository method duplication but can hide which
query shape a use case expects. Use them selectively.

### Nested Projections

Nested interface projections can traverse relationships:

```java
interface OrderWithCustomer {
    String getOrderNumber();
    CustomerView getCustomer();
}
```

They can still produce joins or additional loading. Inspect generated SQL
rather than assuming the projection is efficient.


## Specifications And Dynamic Queries

Specifications compose optional predicates without unsafe SQL construction:

```java
public static Specification<OrderEntity> hasStatus(OrderStatus status) {
    return (root, query, builder) ->
            status == null
                    ? builder.conjunction()
                    : builder.equal(root.get("status"), status);
}
```

```java
Specification<OrderEntity> specification =
        Specification.where(hasStatus(status))
                .and(createdAfter(from))
                .and(ownedBy(username));

return repository.findAll(specification, pageable);
```

For complex read models, Querydsl, Criteria API, jOOQ, or explicit SQL may be
clearer than a large specification tree. Choose one approach consistently.


## SQL Injection Risks And Prevention

This is safe because values are bound:

```java
@Query("select u from UserEntity u where u.username = :username")
Optional<UserEntity> findByUsername(@Param("username") String username);
```

Hibernate sends SQL similar to:

```sql
select *
from users
where username = ?;
```

The username remains data and cannot change the SQL structure.

This is unsafe:

```java
String sql = "select * from users where username = '" + username + "'";
entityManager.createNativeQuery(sql).getResultList();
```

An input such as:

```text
' OR '1'='1
```

can alter query meaning.

### Dynamic Sort Injection

Values can be parameterized; identifiers and SQL keywords generally cannot.
Never concatenate an arbitrary client sort field:

```java
String sql = "select * from orders order by " + requestedSort;
```

Use an allow-list:

```java
private static final Map<String, String> ALLOWED_SORTS = Map.of(
        "createdAt", "created_at",
        "status", "status",
        "totalAmount", "total_amount"
);
```

Better still, map client values to typed Spring `Sort` properties validated
against known entity attributes.

### Injection Safety Checklist

- bind every external value with repository parameters;
- use Criteria API, specifications, or Querydsl for dynamic predicates;
- allow-list dynamic identifiers, operators, and sort fields;
- never accept raw JPQL, SQL fragments, or SpEL from clients;
- use least-privilege database users;
- validate lengths and formats as defense in depth;
- do not expose database errors or generated SQL to clients;
- review stored procedures and custom JDBC code under the same rules.

ORM use does not automatically make every query safe. String concatenation can
reintroduce injection into JPQL and native SQL.








