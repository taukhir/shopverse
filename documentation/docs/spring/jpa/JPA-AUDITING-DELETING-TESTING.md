---
title: JPA Auditing Deleting And Repository Testing
---

# JPA Auditing Deleting And Repository Testing

Auditing, delete behavior, repository tests, and related guides.

Back to [Spring Data JPA](../SPRING-DATA-JPA.md).

## Auditing

Enable auditing:

```java
@Configuration
@EnableJpaAuditing
class JpaAuditConfiguration {
}
```

```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class AuditedEntity {

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private Instant updatedAt;

    @CreatedBy
    private String createdBy;

    @LastModifiedBy
    private String updatedBy;
}
```

Provide an `AuditorAware<String>` that reads the authenticated identity. Use a
stable system identity for background jobs. Database defaults and Liquibase
constraints must remain compatible with application auditing.


## Deleting Entities

`delete(entity)` loads and removes an entity, applying cascades and callbacks.
A bulk delete executes directly:

```java
@Modifying(clearAutomatically = true)
@Query("delete from ExpiredReservationEntity r where r.expiresAt < :now")
int deleteExpired(@Param("now") Instant now);
```

Bulk deletion bypasses per-entity callbacks and cascades. Ensure foreign keys
and dependent cleanup are handled deliberately.

Soft deletion adds complexity to every query, uniqueness rule, index, cache,
and relationship. Use it only when business recovery or audit requirements
justify it; an append-only history or archive table may be clearer.


## Testing Repository Behavior

Use `@DataJpaTest` for mappings and queries:

```java
@DataJpaTest
class OrderRepositoryTest {

    @Autowired
    OrderRepository repository;

    @Test
    void projectsCustomerOrders() {
        Page<OrderSummary> result = repository.findByCustomerUsername(
                "alice",
                PageRequest.of(0, 20)
        );

        assertThat(result.getContent()).allSatisfy(summary ->
                assertThat(summary.getOrderNumber()).isNotBlank()
        );
    }
}
```

Use Testcontainers with the production database engine for:

- native queries;
- locking and isolation;
- generated-key behavior;
- indexes and execution plans;
- Liquibase migrations;
- case sensitivity and database-specific SQL.

In-memory databases can differ materially from MySQL.


## Related Guides

- [Hibernate ORM](../../data/HIBERNATE.md)
- [Database Engineering](../../data/DATABASE-ENGINEERING.md)
- [Spring Transactions](../SPRING-TRANSACTIONS.md)
- [Liquibase](../../data/LIQUIBASE-GENERIC.md)
- [Spring REST APIs](../../development/SPRING-REST-APIS.md)
- [Spring Boot Testing](../SPRING-BOOT-TESTING.md)
- [Jackson annotations reference](https://github.com/FasterXML/jackson-annotations/wiki/Jackson-Annotations)







