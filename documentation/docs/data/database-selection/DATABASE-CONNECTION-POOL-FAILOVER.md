---
title: Connection Pools, Overload, And Database Failover
description: HikariCP internals, capacity sizing, acquisition incidents, leaks, failover recovery, and Spring Boot production diagnostics.
difficulty: Advanced
page_type: Guide
status: Complete
prerequisites: [JDBC, transactions, database observability]
technologies: [Spring Boot, HikariCP, JDBC, Micrometer]
last_reviewed: "2026-07-28"
---

# Connection Pools, Overload, And Database Failover

<DocLabels items={[
  {label: 'HikariCP', tone: 'intermediate'},
  {label: 'Failure recovery', tone: 'production'},
  {label: 'Capacity', tone: 'advanced'},
]} />

A connection pool is a bounded concurrency gate around expensive database sessions. It
is not a cache that should grow until acquisition waits disappear. An oversized pool can
move the queue into the database, increase context switching and lock contention, and
turn a slow dependency into a full database outage.

## Acquisition And Return Lifecycle

```text
application thread
  -> DataSource.getConnection()
  -> borrow an idle pooled connection OR wait in the acquisition queue
  -> JDBC operations inside transaction
  -> commit/rollback
  -> close() returns the logical connection to the pool
```

Hikari wraps physical JDBC connections. Closing the application-facing connection normally
returns it; failing to close it, holding it across slow remote work, or leaving a transaction
open reduces available capacity.

## The Settings That Matter

| Setting | What it controls | Production reasoning |
|---|---|---|
| `maximumPoolSize` | total idle plus in-use physical connections | allocate from the database's safe session budget across every pod and workload |
| `minimumIdle` | target idle connections | fixed-size behavior is often simpler; justify connection churn or idle cost before changing |
| `connectionTimeout` | caller's maximum acquisition wait | keep inside the endpoint/job deadline so failure is bounded and observable |
| `validationTimeout` | aliveness-check deadline | must be shorter than acquisition timeout |
| `maxLifetime` | retirement age of a physical connection | set below infrastructure/database connection lifetime with margin |
| `keepaliveTime` | periodic check of idle connections | use to survive idle network expiry; it must be lower than `maxLifetime` |
| `idleTimeout` | idle retirement when below max size | relevant when `minimumIdle < maximumPoolSize` |
| `leakDetectionThreshold` | logs long checkouts | temporary diagnostic signal, not proof of a code leak |
| `initializationFailTimeout` | startup behavior if the DB is unavailable | decide deliberately whether the service should fail fast or start unable to serve |

Never copy values without aligning JDBC connect/socket/query timeouts, load-balancer and
firewall idle limits, database session policy, transaction deadlines, and the service SLO.

## Capacity Model

Start with the database's measured safe concurrent work, subtract administration,
replication, migrations, and other application allocations, then divide the remaining
budget across pods. Include deployment surge capacity.

```text
per-pod maximum <= application DB connection budget / maximum simultaneous pods

approximate concurrent connections demanded
  = transaction arrival rate x average time a connection is held
```

That second expression is Little's-law reasoning, not a sizing guarantee. Tail duration,
bursts, transaction mix, locks, retries, and hot rows need headroom and load testing.

Example: the database safely supports 180 application sessions, 30 are reserved for other
services and operations, and this service can temporarily run 10 pods during rollout. A
starting ceiling is `(180 - 30) / 10 = 15` per pod, subject to workload validation. Setting
every pod to 100 would advertise 1,000 sessions to a database budgeted for 150.

## Spring Boot Configuration

```yaml
spring:
  datasource:
    url: jdbc:postgresql://db.example/orders
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      pool-name: orders-primary
      maximum-pool-size: 15
      connection-timeout: 2000
      validation-timeout: 1000
      max-lifetime: 840000
      keepalive-time: 120000

management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus
```

These numbers illustrate relationships, not production defaults. Spring Boot exports generic
`jdbc.connections` gauges and Hikari-specific metrics. Alert on sustained pending/acquisition
time and request impact; an active pool equal to max during a brief healthy burst is not by
itself an incident.

## Failure Signatures

| Observation | Likely hypotheses | Evidence to collect |
|---|---|---|
| active=max, pending rising, DB busy | legitimate capacity limit or slow SQL | query rate/duration, plans, DB waits, transaction age |
| active=max, DB mostly idle | held/leaked connections, blocked application work | thread dump, transaction traces, checkout duration |
| idle connections exist but acquisition fails | validation/network/driver or pool state issue | pool logs, driver exceptions, packet/DNS/TLS timing |
| timeouts spike after scaling pods | aggregate connection storm | total sessions by application/pod, startup timeline |
| errors after idle period | network device or DB expired connections | connection age, keepalive, TCP reset/timeout evidence |
| recovery loops after failover | stale topology/DNS/connections or retry storm | target host, DNS TTL/cache, driver topology, retry rate |

## Connection Leak Versus Long Checkout

A leak means code never returns a connection. A long checkout may be valid but dangerous.
Common causes include remote calls inside a transaction, streaming a result after the
transaction should end, unbounded batch work, lock waits, and missing resource closure.

```java
@Transactional(timeout = 5)
public void reserve(ReservationCommand command) {
    // Keep database work inside the consistency boundary.
    inventoryRepository.reserve(command.sku(), command.quantity());
}

public void reserveAndNotify(ReservationCommand command) {
    reserveService.reserve(command);       // proxied transactional collaborator
    notificationClient.send(command.id()); // outside the DB transaction
}
```

Moving the remote call outside reduces connection hold time, but changes atomicity. Use an
outbox when reliable post-commit publication is required.

## Failover And Stale Connections

After primary loss, the pool may contain sockets to the old endpoint. Correct recovery spans:

1. the database elects/promotes one writable authority;
2. the old primary is fenced to prevent split brain;
3. discovery/DNS/proxy or the JDBC driver resolves the new target;
4. connection and socket deadlines reject dead paths quickly;
5. invalid pooled connections are evicted and replacements are created at a bounded rate;
6. ambiguous transactions are reconciled rather than blindly repeated;
7. service readiness returns only after a real, safe dependency check.

Hikari cannot elect a primary or guarantee transaction outcomes. Driver topology features,
database proxies, cluster managers, and the platform own those responsibilities.

## Prevent A Retry And Connection Storm

- Bound caller concurrency before pool acquisition.
- Give retries exponential backoff, jitter, a limit, and an overall deadline.
- Retry only transient and idempotent operations; reconnecting does not prove an earlier commit failed.
- Keep circuit breaking/load shedding outside the database transaction.
- Stagger pod startup and avoid every replica eagerly opening its maximum connections.
- Reserve capacity for health checks, operators, recovery, and critical workflows.
- Do not use a larger pool as the first response to slow queries.

## Incident Runbook

1. Confirm user impact and whether failures are acquisition, connect, statement, lock, or commit timeouts.
2. Graph active, idle, max, pending, acquisition time, usage time, creation errors, and total DB sessions.
3. Correlate with request/event concurrency, deployment/autoscaling, query latency, locks, CPU, and I/O.
4. Capture thread dumps and long/open transactions before restarting anything.
5. Contain: shed optional traffic, stop aggressive retries, pause noncritical consumers, or cap concurrency.
6. Fix the actual constraint: query/lock/transaction/network/failover routing/leak.
7. Recover gradually; verify connections target the current authority and offsets/jobs remain correct.
8. Prove recovery with SLOs, pool queues, database waits, retry rate, and a stable observation window.

## Interview Scenarios

**Why did increasing the pool make latency worse?** More concurrent queries exceeded the
database's useful parallelism, increasing queueing, cache churn, locks, and context switching.

**HTTP and Kafka consumers share one pool; what can fail?** A consumer surge can consume every
connection and starve requests. Allocate workload budgets, bound listener concurrency, consider
separate pools only with a database-wide cap, and make overload behavior explicit.

**Commit timed out during failover. Should we retry?** The outcome is ambiguous. Repeating a
non-idempotent mutation can duplicate it. Read by an idempotency/business key, reconcile state,
and retry through a design that makes repetition safe.

## Official References

- [HikariCP configuration and failure guidance](https://github.com/brettwooldridge/HikariCP)
- [HikariCP pool sizing](https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing)
- [Spring Boot SQL database support](https://docs.spring.io/spring-boot/reference/data/sql.html)
- [Spring Boot DataSource metrics](https://docs.spring.io/spring-boot/reference/actuator/metrics.html)

## Recommended Next

Continue with [Replication, Backup, And Recovery](./DATABASE-REPLICATION-BACKUP-RECOVERY.md)
and keep the [Database Load Incident Runbook](./DATABASE-LOAD-INCIDENT-RUNBOOK.md) available.

