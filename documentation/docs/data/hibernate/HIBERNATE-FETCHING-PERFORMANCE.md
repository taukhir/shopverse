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


## Association Batch Fetching

Association batch fetching is a read strategy. It is different from JDBC
statement batching, which groups inserts, updates, or deletes. When several lazy
proxies or collections of the same role are pending initialization, Hibernate can
load a bounded group with an `IN (...)` query instead of one query per parent.

```java
@ManyToMany(fetch = FetchType.LAZY)
@BatchSize(size = 50)
private Set<Role> roles;
```

Or configure a provider-wide default:

```yaml
spring:
  jpa:
    properties:
      hibernate:
        default_batch_fetch_size: 50
```

An illustrative access pattern becomes:

```sql
select u.* from users u where u.status = ?;

select ur.user_id, r.*
from user_roles ur
join roles r on r.id = ur.role_id
where ur.user_id in (?, ?, ?, ...);
```

The batch size is a ceiling/hint, not a promise that every query contains exactly
that many keys. Large batches can exceed parameter limits or produce unstable
plans; tiny batches leave many round trips. Measure query count, bind count, rows,
latency, and database plan with representative cardinality.

<DocCallout type="mistake" title="Do not confuse the two Hibernate batch settings">
`hibernate.default_batch_fetch_size` batches lazy reads by identifiers.
`hibernate.jdbc.batch_size` batches compatible write statements. Enabling one
does not enable or prove the other.
</DocCallout>


## Subselect Collection Fetching

Hibernate-specific subselect fetching initializes collections for owners from a
previous entity query by reusing that owner selection in a subsequent query:

```java
@ManyToMany(fetch = FetchType.LAZY)
@Fetch(FetchMode.SUBSELECT)
private Set<Role> roles;
```

```sql
select u.*
from users u
where u.status = ?;

select ur.user_id, r.*
from user_roles ur
join roles r on r.id = ur.role_id
where ur.user_id in (
    select u.id from users u where u.status = ?
);
```

It can replace many collection selects with one secondary select without
multiplying the parent rows in a wide join. It is most useful when the application
loads a coherent parent result set and then needs the same collection for those
parents.

The trade-offs are provider coupling, sensitivity to the preceding query/session
context, and the possibility of fetching collections for more owners than the
caller actually uses. Pagination, filters, tenant predicates, and transaction
scope must be tested. Hibernate also exposes global/session controls such as
`hibernate.use_subselect_fetch`; prefer the narrowest configuration whose query
shape is proven.


## Fetch Strategy Decision Table

| Strategy | Round-trip shape | Best fit | Avoid or reconsider when |
|---|---|---|---|
| entity graph | provider-selected; often joins for the requested graph | one bounded managed aggregate | exact join type is required or graph cardinality is large |
| JPQL fetch join | explicitly joined query | exact join semantics and bounded associations | paging parents or fetching multiple large collections |
| batch fetching | parent query plus batched `IN` selects | many parents with lazily accessed children | one join is small and simpler, or parameter batches become large |
| subselect fetching | parent query plus one subselect collection query | most parents in one result need the same collection | only a few owners are traversed or query/session behavior is hard to bound |
| DTO projection | selected scalar/read-model query | read APIs, reports, and list pages | managed mutation is required |
| explicit separate queries | several deliberately bounded queries | large nested graphs and independent filters | latency makes extra round trips unacceptable and a bounded join is safe |

Fetch strategies solve object loading, not database design. The foreign-key/join
columns still need suitable indexes, and every strategy needs a bounded root
result.


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


## Official References

- [Hibernate ORM fetching guide](https://docs.hibernate.org/stable/orm/userguide/html_single/#chapters-fetching)
- [Hibernate `@BatchSize`](https://docs.hibernate.org/orm/current/javadocs/org/hibernate/annotations/BatchSize.html)
- [Hibernate fetch-related settings](https://docs.hibernate.org/stable/orm/userguide/html_single/#settings-hibernate.default_batch_fetch_size)




