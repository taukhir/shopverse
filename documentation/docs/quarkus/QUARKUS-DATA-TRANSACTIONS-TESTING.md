---
title: "Quarkus Data, Transactions, And Testing"
description: "Intermediate-to-advanced tutorial for Hibernate ORM with Panache, schema migration, transaction boundaries, idempotency, outbox persistence, Dev Services, and Quarkus test layers."
sidebar_label: "3. Data And Testing"
tags: ["quarkus", "hibernate", "panache", "testing"]
page_type: Tutorial
difficulty: Intermediate
status: maintained
prerequisites: [Quarkus REST and CDI, SQL and transaction fundamentals]
learning_objectives: [Use Panache without losing domain boundaries, Design correct local transactions, Test with production-like dependencies, Prove idempotency and outbox atomicity]
technologies: [Quarkus, Hibernate ORM, Panache, PostgreSQL, Liquibase, JUnit, RestAssured]
last_reviewed: "2026-08-11"
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: official-documentation-review
---

# Quarkus Data, Transactions, And Testing

Persistence annotations do not define a business transaction. Start by naming
the invariant, the owning service, the aggregate boundary, and what must commit
atomically.

## 1. Choose The Persistence Model

Common choices include:

| Model | Appropriate when | Main caution |
|---|---|---|
| Hibernate ORM | rich relational mapping and unit-of-work behavior are useful | fetching, dirty checking, locking, and query count remain explicit concerns |
| Hibernate ORM with Panache repository | Hibernate is appropriate and concise repositories improve readability | convenience methods can hide unbounded reads or weak boundaries |
| Panache active record | small cohesive models accept persistence behavior on the entity | domain objects become coupled to persistence APIs |
| JDBC or lightweight SQL | SQL control and predictable data access dominate | more mapping and transaction code belongs to the application |
| Hibernate Reactive | the complete request and database stack is non-blocking | reactive sessions and transactions require a different programming model |

Do not select Hibernate Reactive merely because Quarkus REST uses a reactive
engine. Blocking Hibernate ORM with worker-thread endpoints is a supported and
often simpler design.

## 2. Add ORM And Database Extensions

```xml
<dependency>
  <groupId>io.quarkus</groupId>
  <artifactId>quarkus-hibernate-orm-panache</artifactId>
</dependency>
<dependency>
  <groupId>io.quarkus</groupId>
  <artifactId>quarkus-jdbc-postgresql</artifactId>
</dependency>
<dependency>
  <groupId>io.quarkus</groupId>
  <artifactId>quarkus-liquibase</artifactId>
</dependency>
```

```properties
quarkus.datasource.db-kind=postgresql
quarkus.hibernate-orm.schema-management.strategy=validate
quarkus.liquibase.migrate-at-start=true
```

Production credentials and URLs should come from approved runtime configuration.
Use forward-only migration files and review generated SQL, locks, runtime, and
rollback or roll-forward strategy before deployment.

## 3. Model Persistence Separately From The API

```java
package example.checkout.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "checkout_order")
public class OrderEntity {

    @Id
    public String id;

    @Column(nullable = false, unique = true, updatable = false)
    public String idempotencyKey;

    @Column(nullable = false, updatable = false)
    public String ownerSubject;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public OrderStatus status;

    @Version
    public long version;
}
```

Do not deserialize an API request directly into a managed entity. API contracts,
domain transitions, and persistence mappings evolve for different reasons.

## 4. Repository Style

```java
package example.checkout.persistence;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Optional;

@ApplicationScoped
public class OrderRepository implements PanacheRepository<OrderEntity> {

    public Optional<OrderEntity> findByOwnerAndKey(
            String ownerSubject,
            String idempotencyKey) {
        return find("ownerSubject = ?1 and idempotencyKey = ?2",
                ownerSubject, idempotencyKey).firstResultOptional();
    }
}
```

Use database constraints as the final concurrency guard. An application lookup
followed by insert is still racy when two first attempts arrive together.

## 5. Transaction Boundary

```java
package example.checkout.application;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class CheckoutApplicationService {

    private final OrderRepository orders;
    private final OutboxRepository outbox;

    public CheckoutApplicationService(
            OrderRepository orders,
            OutboxRepository outbox) {
        this.orders = orders;
        this.outbox = outbox;
    }

    @Transactional
    public CheckoutResult create(CheckoutCommand command) {
        // Resolve an existing matching attempt or reject conflicting reuse.
        // Validate the state transition.
        // Persist the order and outbox record in the same local transaction.
        return persistOrderAndIntent(command);
    }
}
```

The transaction belongs around the application operation that must be atomic,
not around the HTTP resource by default and not around slow remote calls. Holding
a database transaction open while calling inventory, pricing, or payment
increases lock time and cannot make the remote work atomic.

### Idempotency record

A robust record normally contains:

- authenticated owner or tenant scope;
- idempotency key;
- canonical request fingerprint;
- operation state such as in-progress, completed, or failed-retryable;
- stable response reference;
- creation and retention timestamps;
- database uniqueness on the intended scope.

Same key plus same fingerprint returns or resumes the same result. Same key plus
different fingerprint is a conflict. A global lookup that ignores the owner is
an authorization defect.

### Transactional outbox

Persist domain state and integration-event intent in the same local database
transaction. A separate publisher later sends the record and marks progress.
Consumers must still tolerate duplicate delivery. The outbox prevents the gap
between database commit and event intent; it does not provide magical global
exactly-once behavior.

## 6. Fetching, Locking, And Capacity

- Keep relationships lazy unless a measured query requires a different plan.
- Fetch exactly what the use case needs; avoid unbounded `listAll()` operations.
- Inspect SQL and query counts in integration tests.
- Use optimistic locking for competing updates when retry or conflict is safe.
- Use pessimistic locks only with bounded lock order, timeout, and contention
  evidence.
- Size the JDBC pool from database capacity and per-instance concurrency, not CPU
  count alone.
- Enforce request and query timeouts and propagate an overall deadline.

## 7. Test Layers

| Layer | Starts Quarkus | External dependency | Purpose |
|---|---|---|---|
| plain unit test | no | mocked or none | domain transitions, fingerprints, mappings |
| `@QuarkusTest` | yes, test mode | Dev Services or test resource | CDI, configuration, REST, ORM, security integration |
| `@QuarkusIntegrationTest` | packaged application | production-like service | packaging, container, JVM/native process boundary |
| contract test | depends | stub or provider | HTTP and event compatibility |
| end-to-end test | deployed system | real test environment | critical business journey and recovery |

Quarkus testing integrates JUnit with application startup. RestAssured is a
convenient HTTP client and is configured with the correct test port.

## 8. Database Integration Test

```java
package example.checkout.persistence;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

@QuarkusTest
class OrderRepositoryTest {

    @Inject
    OrderRepository repository;

    @Test
    @Transactional
    void findsAnAttemptOnlyInsideItsOwnerScope() {
        OrderEntity order = Fixtures.order("order-1", "subject-a", "key-1");
        repository.persist(order);
        repository.flush();

        assertEquals(1,
                repository.findByOwnerAndKey("subject-a", "key-1").stream().count());
        assertEquals(0,
                repository.findByOwnerAndKey("subject-b", "key-1").stream().count());
    }
}
```

Do not assume `@Transactional` rolls the test back unless the selected Quarkus
test mechanism explicitly provides that behavior. Isolate data deterministically
and verify the documented lifecycle for the project version.

## 9. Required Checkout Tests

- two concurrent first requests create one logical checkout;
- same key and fingerprint returns the stable result;
- same key with a different cart or account/profile is rejected;
- database constraint failure is translated without leaking SQL;
- order and outbox intent commit together;
- rollback leaves neither order nor event intent;
- stale entity version produces the documented conflict;
- unauthorized owner cannot retrieve another order;
- migration succeeds from the previous released schema;
- production database dialect behavior is exercised with a real database.

## Official References

- [Hibernate ORM With Panache](https://quarkus.io/guides/hibernate-orm-panache)
- [Hibernate ORM](https://quarkus.io/guides/hibernate-orm)
- [Using Transactions](https://quarkus.io/guides/transaction)
- [Liquibase](https://quarkus.io/guides/liquibase)
- [Testing Your Application](https://quarkus.io/guides/getting-started-testing)
- [Dev Services Overview](https://quarkus.io/guides/dev-services)

## Next

Continue with [Messaging, Security, And Observability](./QUARKUS-INTEGRATION-SECURITY-OBSERVABILITY.md).

