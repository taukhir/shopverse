---
title: MySQL With Spring, Interview Scenarios, And Revision
description: Integrate MySQL with Spring Boot/JPA correctly and revise architect-level MySQL scenarios.
difficulty: Advanced
page_type: Interview
status: maintained
prerequisites: [MySQL HA And Operations, Spring Data JPA]
learning_objectives: [Configure Spring MySQL access, Prevent isolation-level and pool mistakes, Answer production scenario questions]
technologies: [MySQL, Spring Boot, JDBC, Hibernate]
last_reviewed: "2026-11-17"
scope: generic
owner: docs-data
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# MySQL With Spring, Interview Scenarios, And Revision

## Spring Boot Boundary

```yaml
spring:
  datasource:
    url: jdbc:mysql://db.example.internal:3306/shopverse?useSSL=true&serverTimezone=UTC
    username: ${MYSQL_APP_USER}
    password: ${MYSQL_APP_PASSWORD}
    hikari:
      maximum-pool-size: 20
      connection-timeout: 2000
      validation-timeout: 1000
      max-lifetime: 1740000
  jpa:
    open-in-view: false
    database-platform: org.hibernate.dialect.MySQLDialect
    properties:
      hibernate.jdbc.batch_size: 50
      hibernate.order_inserts: true
      hibernate.order_updates: true
```

Values are examples, not universal settings. Set `max-lifetime` below
MySQL's `wait_timeout` (and any intermediate proxy/load-balancer idle
timeout) so HikariCP retires connections before the server silently closes
them — a connection killed server-side while idle in the pool is a common,
avoidable source of intermittent "connection already closed" errors.

## Mapping And Query Example

```java
@Entity
@Table(name = "orders")
public class OrderEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Long id;

    @Version
    @Column(name = "row_version", nullable = false)
    private long rowVersion;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private OrderStatus status;
}
```

```java
@Modifying
@Query("""
  update OrderEntity o
     set o.status = :next
   where o.id = :id and o.status = :expected
  """)
int transition(Long id, OrderStatus expected, OrderStatus next);
```

`GenerationType.IDENTITY` maps to MySQL's `AUTO_INCREMENT` and keeps new
rows clustering at the end of the primary-key B+tree (see the architecture
page); it also disables Hibernate JDBC batching for inserts of that entity,
a frequently-missed trade-off versus a pooled/sequence-based ID strategy
available on other engines. Check the update count from the transition
query to detect a lost optimistic-lock race rather than assuming success.

## Failure Boundaries

- A Spring `@Transactional` timeout must stay shorter than any upstream
  request-ownership deadline.
- Code written and load-tested only against Postgres/Oracle's
  `READ COMMITTED` default should be re-verified under MySQL's
  `REPEATABLE READ` default before assuming identical concurrency behavior
  in production — see the isolation-levels page for the gap-locking
  difference.
- Retrying error 1213 (`ER_LOCK_DEADLOCK`) is safe because the rolled-back
  transaction committed nothing; retrying a lock-wait-timeout (1205) without
  checking for a stuck blocker first is not the same thing.
- A connection lost immediately after `COMMIT` leaves the outcome ambiguous
  to the caller; reconcile via a business/idempotency key rather than
  blindly repeating the operation.

## Hands-On Labs

1. Create an orders table with an `AUTO_INCREMENT` primary key and a
   composite secondary index; load skewed sample data.
2. Run `EXPLAIN` on a query using the secondary index and confirm whether
   it is a covering index or requires a clustered-index bookmark lookup.
3. Reproduce gap-lock contention: two sessions under `REPEATABLE READ`
   inserting into the same indexed range, one blocking the other.
4. Force and observe a deadlock (error 1213) between two sessions updating
   rows in opposite order; fix it with consistent lock ordering.
5. Test the optimistic-locking query above with two concurrent updates and
   confirm the loser gets a zero-row update count.
6. Set up single-primary/single-replica async replication locally and
   measure `Seconds_Behind_Source` under a write burst.
7. Simulate a connection drop immediately after commit and prove the
   idempotency-key reconciliation path recovers correctly.

## Top Production Interview Scenarios

**Throughput dropped sharply during a high-concurrency order-insert
burst.** Suspect gap-lock contention from `REPEATABLE READ` next-key
locking on a hot index range before assuming it is raw CPU/IO pressure;
check `INFORMATION_SCHEMA.INNODB_TRX`/lock-wait views for the contended
gap.

**A query uses an index per `EXPLAIN` but is still slow under load.**
Check whether it is a covering index or requires a clustered-index lookup
per matching row; a high selectivity estimate with many bookmark lookups
can still be slow even with "index used" reported.

**All pods are timing out acquiring a MySQL connection.** Check for leaked
connections or slow statements holding the pool, or whether the server's
own `max_connections` is actually saturated across every pod's pool
combined — do not raise each pod's pool size independently against a
shared server-side limit.

**Replica lag spiked after a deploy.** Correlate against a specific large
transaction or schema-change statement rather than assuming general load
growth; check whether multi-threaded replication settings on the replica
match the primary's write concurrency.

**Need a zero-downtime column type change.** Add the new column, deploy
dual-compatible readers/writers, backfill observably, cut reads over,
enforce constraints, drop the old column only once every old application
version is out of rotation — identical discipline to the other relational
engines on this site, implemented with MySQL's own online-DDL support
where available.

## One-Page Revision

- InnoDB tables are clustered by primary key; every secondary index carries
  that key, so a wide or random-order key bloats every index.
- Commit durability = redo-log flush, not data-page write; a background
  thread flushes dirty pages later.
- Default isolation is `REPEATABLE READ` with next-key (gap) locking — not
  `READ COMMITTED` like Oracle/Postgres.
- Plain `SELECT` (MVCC snapshot read) never blocks or is blocked; only
  locking reads and writes take row/gap locks.
- Deadlock (1213) is retry-safe; lock-wait-timeout (1205) may mean a stuck
  blocker — check before retrying.
- Async replication can lose committed data on failover; semi-sync bounds
  but does not eliminate that risk; Group Replication/Galera add automatic
  failover at the cost of write-path latency.
- Connection pool size is a server-wide (`max_connections`) budget, not a
  per-pod preference.

## Official References

- [Spring Data JPA reference](https://docs.spring.io/spring-data/jpa/reference/)
- [Hibernate MySQL dialect notes](https://docs.jboss.org/hibernate/orm/current/userguide/html_single/Hibernate_User_Guide.html#database-dialect)
- [MySQL Connector/J documentation](https://dev.mysql.com/doc/connector-j/en/)

## Recommended Next

Return to the [MySQL Architect Learning Path](../MYSQL-ARCHITECT-PATH.md) and complete the labs with measured evidence.
