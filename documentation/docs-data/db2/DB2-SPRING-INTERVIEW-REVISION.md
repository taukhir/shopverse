---
title: Db2 With Spring, Interview Scenarios, And Revision
description: Integrate Db2 with Spring Boot/JPA safely and revise architect-level Db2 scenarios.
difficulty: Advanced
page_type: Interview
status: maintained
prerequisites: [Db2 HA And Operations, Spring Data JPA]
learning_objectives: [Configure Spring Db2 access, Prevent pool and isolation-level mistakes, Answer production scenario questions]
technologies: [IBM Db2, Spring Boot, JDBC, Hibernate]
last_reviewed: "2026-11-17"
scope: generic
owner: docs-data
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Db2 With Spring, Interview Scenarios, And Revision

## Spring Boot Boundary

Use the `com.ibm.db2.jcc.DB2Driver` JDBC driver version matched to the server
release, and keep credentials external to the image/jar.

```yaml
spring:
  datasource:
    url: jdbc:db2://db.example.internal:50000/SHOPDB
    driver-class-name: com.ibm.db2.jcc.DB2Driver
    username: ${DB2_APP_USER}
    password: ${DB2_APP_PASSWORD}
    hikari:
      maximum-pool-size: 20
      connection-timeout: 2000
      validation-timeout: 1000
      max-lifetime: 1740000
  jpa:
    open-in-view: false
    database-platform: org.hibernate.dialect.DB2Dialect
    properties:
      hibernate.jdbc.batch_size: 50
      hibernate.order_inserts: true
      hibernate.order_updates: true
```

Values are examples, not universal settings. Size the pool from the
database's configured `MAXAPPLS`/connection budget, not from a per-pod
preference, and set `max-lifetime` below any network/firewall idle-connection
timeout between the application and the database.

## Mapping And Query Example

```java
@Entity
@Table(name = "ORDERS")
public class OrderEntity {
    @Id
    @Column(name = "ORDER_ID", nullable = false, length = 36)
    private String id;

    @Version
    @Column(name = "ROW_VERSION", nullable = false)
    private long rowVersion;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", nullable = false, length = 32)
    private OrderStatus status;
}
```

```java
@Modifying
@Query(value = """
  update OrderEntity o
     set o.status = :next
   where o.id = :id and o.status = :expected
  """)
int transition(String id, OrderStatus expected, OrderStatus next);
```

Check the update count returned by Spring Data. Hibernate's `DB2Dialect`
issues `WITH CS` by default for ordinary reads inside a transaction; raise
to `WITH RS`/`WITH RR` explicitly at the query level only where the business
rule requires it, rather than changing the connection-wide isolation level
for every statement.

## Failure Boundaries

- A Spring `@Transactional` timeout must be shorter than any upstream
  request-ownership deadline, the same rule as every other relational store
  covered on this site.
- Retrying `SQL0911N` is safe only when the reason code indicates a deadlock
  (retry-safe) rather than a lock timeout masking a stuck blocker (retrying
  blindly will not clear a stuck blocker).
- A connection lost immediately after `COMMIT` leaves the outcome ambiguous
  from the caller's point of view; reconcile through a business/idempotency
  key, never by blindly repeating a charge or stock decrement.
- Schema changes use expand/migrate/contract so that application versions
  running against the old and new schema can coexist during a rolling
  deployment.

## Hands-On Labs

1. Create an orders table and a composite index on `(customer_id,
   created_at)`; load skewed sample data.
2. Run `RUNSTATS`, capture the access plan, then delete/reload a large
   fraction of rows and observe the plan before re-running `RUNSTATS`.
3. Reproduce a lock-wait chain between two sessions and record the blocker
   using `MON_GET_LOCKS`.
4. Force a lock escalation with an oversized unbounded update and observe
   `LOCKLIST` pressure; fix it by batching the update.
5. Test the optimistic-locking query above with two concurrent updates and
   confirm the loser gets a zero update count, not an exception that hides
   the conflict.
6. Configure HADR between two local containers in `ASYNC` mode and measure
   the log gap under a write burst.
7. Simulate a connection drop immediately after commit and prove the
   idempotency-key reconciliation path recovers correctly.

## Top Production Interview Scenarios

**CPU is pinned after a deployment.** Compare workload shape before/after:
statement cache entries, executions, bufferpool hit ratio, and application
concurrency. Contain pool/traffic pressure first, then correct the
query/index/statistics root cause rather than scaling hardware blindly.

**Queries slowed down right after a nightly batch load.** Suspect stale
statistics (`RUNSTATS`) or bufferpool eviction from a shared bufferpool with
the batch job; confirm with a plan comparison and bufferpool hit-ratio trend
before changing anything.

**All pods are timing out acquiring a Db2 connection.** Check whether
connections are leaked or held by slow statements/remote calls, or whether
`MAXAPPLS` at the database is actually saturated. Do not raise every pod's
pool size independently — the database-side limit is shared capacity.

**A batch job's `UPDATE` escalated to a table lock and stalled OLTP
traffic.** Confirm via `MON_GET_LOCKS`/escalation counters, then redesign the
batch to commit in bounded chunks instead of raising `LOCKLIST` to make the
symptom disappear.

**Need a zero-downtime column type change.** Add the new column alongside
the old, deploy dual-compatible readers/writers, backfill observably, cut
reads over, enforce constraints, then drop the old column only once no
previous application version remains in rotation.

## One-Page Revision

- Instance manages EDUs/processes; database owns bufferpools, tablespaces,
  and logs.
- Commit durability = log write, not data-page write; a page cleaner flushes
  dirty pages later.
- `UR` < `CS` < `RS` < `RR` in isolation strength; Db2 names differ from ANSI
  terms used for other engines on this site.
- Lock escalation is a capacity signal from an oversized transaction, not a
  setting to raise away.
- `RUNSTATS` fixes stale-statistics regressions; `REORG` fixes fragmentation
  `RUNSTATS` alone will not show.
- HADR = standby/DR via log shipping; pureScale = shared-data clustering for
  scale/availability — different failure domains, often used together.
- Connection pool size is a database-wide (`MAXAPPLS`) budget, not a per-pod
  preference.

## Official References

- [Spring Data JPA reference](https://docs.spring.io/spring-data/jpa/reference/)
- [Hibernate Db2 dialect notes](https://docs.jboss.org/hibernate/orm/current/userguide/html_single/Hibernate_User_Guide.html#database-dialect)
- [Db2 JDBC driver reference](https://www.ibm.com/docs/en/db2/11.5?topic=cdjd-db2-jdbc-driver)

## Recommended Next

Return to the [IBM Db2 Architect Learning Path](../DB2-ARCHITECT-PATH.md) and complete the labs with measured evidence.
