---
title: Hibernate Caching
difficulty: Advanced
page_type: Concept
status: Generic
prerequisites: [Hibernate basics and lifecycle, Cache umbrella]
learning_objectives: [Distinguish Hibernate cache levels, Configure L2 and query caching, Select concurrency strategies]
technologies: [Hibernate ORM, JPA, JCache]
last_reviewed: "2026-07-11"
---

# Hibernate Caching

Hibernate caching has different semantics from Spring method caching.

## Cache Levels

| Cache | Scope | Default | Stores |
|---|---|---|---|
| First-level | One `Session`/`EntityManager` | Always enabled | Managed entity identity/state |
| Second-level | `SessionFactory`/provider regions | Optional | Entity and collection state across sessions |
| Query cache | `SessionFactory`/provider regions | Optional | Query identifiers/scalars and update timestamps |
| Spring Cache | Application method | Optional | Arbitrary returned values |

## First-Level Cache

```java
Product first = entityManager.find(Product.class, 42L);
Product second = entityManager.find(Product.class, 42L);
assert first == second;
```

Within one persistence context, the same identifier maps to the same managed
object and normally avoids another identifier select. L1 also supports dirty
checking. It ends/clears with the persistence context and is not a cross-request
cache. JPQL can still execute SQL even if returned entities are already managed.

Batch jobs should `flush()` and `clear()` periodically to bound L1 memory.

## Second-Level Cache

L2 shares persistent state across persistence contexts and possibly replicas,
depending on provider topology. It requires a compatible region provider and
explicit configuration.

Conceptual configuration:

```yaml
spring:
  jpa:
    properties:
      hibernate:
        cache:
          use_second_level_cache: true
          use_query_cache: false
          region:
            factory_class: jcache
```

Entity opt-in:

```java
@Entity
@Cacheable
@org.hibernate.annotations.Cache(
        usage = CacheConcurrencyStrategy.READ_WRITE,
        region = "catalog.product"
)
public class Product {
    @Id
    private Long id;
}
```

Provider property names and dependencies vary by version. Pin compatible
Hibernate/provider versions and verify startup/statistics.

L2 stores a representation of persistent state by type/identifier/region.
Hibernate still materializes a managed entity in each L1. Collections have their
own regions; caching an entity does not automatically cache every association.

## Concurrency Strategies

| Strategy | Candidate data | Trade-off |
|---|---|---|
| `READ_ONLY` | Immutable reference data | Updates invalid; simplest |
| `NONSTRICT_READ_WRITE` | Rare updates, accepted staleness | Weaker update coordination |
| `READ_WRITE` | Mutable data needing coordination | Soft-lock/version overhead |
| `TRANSACTIONAL` | Compatible transactional provider | Strict provider/transaction requirements |

Support differs by provider. A strategy name is not a universal distributed
transaction guarantee.

## Query Cache

The query cache stores result identifiers/scalars, not necessarily full entities.
Entity identifiers are resolved from L2 or the database.

```java
List<Product> products = entityManager.createQuery(
                "select p from Product p where p.category.id = :categoryId",
                Product.class)
        .setParameter("categoryId", categoryId)
        .setHint("org.hibernate.cacheable", true)
        .getResultList();
```

Enable query caching globally only to make selected queries eligible, then opt
in measured stable queries. Frequently modified tables can invalidate many
results and make query caching slower.

## Candidates

Good: small reference data, read-mostly entities, reused parameter sets, and data
with explicit staleness/invalidation.

Poor: inventory/balances/permissions needing freshness, write-heavy or huge
high-cardinality data, nearly unique queries, or tables modified outside
Hibernate without coordinated invalidation.

## Hibernate L2 Versus Spring Cache

| Concern | Hibernate L2 | Spring Cache |
|---|---|---|
| Boundary | ORM entity/collection loading | Method result |
| Key | Region and entity identifier | Cache name plus application key |
| Value | Persistent state | DTO/list/computation/remote response |
| ORM awareness | Yes | No |

Avoid caching the same representation at multiple layers unless ownership and
invalidation are explicit. A Spring-cached DTO can remain stale after Hibernate
has invalidated an entity region.

## Bulk Updates And External Writers

Bulk JPQL/SQL and database-side changes can bypass normal lifecycle coordination.
Clear affected persistence contexts and evict regions where required:

```java
entityManagerFactory.getCache().evict(Product.class, productId);
entityManagerFactory.getCache().evict(Product.class);
```

Test the exact Hibernate/provider behavior. Avoid L2 when multiple writers cannot
participate in invalidation.

## Verification

Measure L2/query hit, miss, put, provider eviction/size, executed SQL, entity
loads, database latency, and end-to-end response time. Enable verbose Hibernate
statistics deliberately, not blindly at high production volume.

1. Measure baseline repeated SQL.
2. Define staleness and every write path.
3. Select provider, topology, region, TTL, and strategy.
4. Opt in only suitable entities/queries.
5. Test normal/bulk/external updates and rolling deployment.
6. Remove the cache if coordination costs more than it saves.

## Related Guides

- [Hibernate Fetching And Performance](./HIBERNATE-FETCHING-PERFORMANCE.md)
- [Cache Umbrella](../../architecture/CACHE-UMBRELLA.md)
- [Spring Cache](../../spring/SPRING-CACHE.md)

## Official Reference

- [Hibernate ORM User Guide](https://docs.jboss.org/hibernate/orm/current/userguide/html_single/Hibernate_User_Guide.html)
