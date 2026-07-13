---
title: Hibernate Fetching And Performance
status: "maintained"
last_reviewed: "2026-07-13"
---


# Hibernate Fetching And Performance

LazyInitializationException, N+1, fetch plans, and performance optimization.

[Back to Hibernate](../HIBERNATE.md).

## Fetching And `LazyInitializationException`

A lazy association is initialized only when accessed:

```java
@OneToMany(mappedBy = "order", fetch = FetchType.LAZY)
private List<OrderItemEntity> items;
```

This fails after the persistence context closes:

```java
OrderEntity detached = service.findOrder(id);
detached.getItems().size(); // LazyInitializationException
```

Solutions:

- map to DTOs inside the transaction;
- fetch required associations with a fetch join;
- use an entity graph;
- use projections;
- issue a separate bounded query.

Do not solve it globally with eager relationships or Open Session in View.
Those approaches hide query ownership and often cause unpredictable SQL.


## N+1 And Fetch Plans

```text
select all orders                         -- 1
select items where order_id = ?           -- N times
```

Use the smallest suitable solution:

```java
@EntityGraph(attributePaths = "items")
Optional<OrderEntity> findDetailedById(Long id);
```

```java
@Query("""
        select distinct order
        from OrderEntity order
        left join fetch order.items
        where order.id = :id
        """)
Optional<OrderEntity> findWithItems(Long id);
```

For paginated parent collections, prefer DTO projections or two-step loading
instead of paginating a collection fetch join.


## Performance Optimization

### Select Only Required Data

```java
public record OrderSummary(
        Long id,
        String orderNumber,
        OrderStatus status
) {
}
```

Use projections for read endpoints instead of loading full entity graphs.

### Enable JDBC Batching

```yaml
spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 50
        order_inserts: true
        order_updates: true
```

Flush and clear bounded import chunks:

```java
if ((index + 1) % batchSize == 0) {
    entityManager.flush();
    entityManager.clear();
}
```

### Keep Transactions Short

Do not hold a transaction open during:

- HTTP calls;
- Kafka waits;
- file uploads;
- user interaction;
- long CPU work.

### Use Read-Only Transactions

```java
@Transactional(readOnly = true)
public OrderSummary getOrder(Long id) {
    // ...
}
```

This communicates intent and may enable optimizations. It is not a security
boundary.

### Tune Pagination

- cap page size;
- index filter and order columns;
- use a unique sort tie-breaker;
- use `Slice` if total count is unnecessary;
- use keyset pagination for deep traversal.

### Inspect SQL And Plans

In controlled development:

```yaml
logging:
  level:
    org.hibernate.SQL: DEBUG
```

Do not enable verbose bind-value logging in production because it can expose
sensitive data and generate substantial volume.

Use:

- Hibernate statistics in tests or diagnostics;
- datasource-proxy or P6Spy in development;
- database `EXPLAIN`;
- application metrics and traces;
- production-like data volumes.

### Use Appropriate Locking

Use optimistic locking for ordinary contention:

```java
@Version
private long version;
```

Use pessimistic locks only for short measured critical sections. Never hold a
database lock while waiting for a remote dependency.

### Understand Cache Levels

- first-level cache: mandatory, persistence-context scoped;
- second-level cache: optional, shared entity/collection data;
- query cache: optional query-result key cache;
- Spring Cache: application-method cache outside Hibernate semantics.

Do not enable second-level or query caching globally without defining
invalidation, staleness, memory, and measurement.






