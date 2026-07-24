---
title: Spring Data Cassandra Configuration Mapping Repositories And Templates
description: Spring Boot configuration, CqlSession, composite-key mapping, converters, repositories, CassandraTemplate, CqlTemplate, paging, auditing, and schema management.
difficulty: Advanced
page_type: Tutorial
status: Generic
prerequisites: [Spring Data Cassandra overview, Cassandra CQL modeling]
learning_objectives: [Map query-first tables, Choose repository or template APIs, Configure sessions and schema safely]
technologies: [Spring Data Cassandra, CassandraTemplate, CqlTemplate, CqlSession]
last_reviewed: "2026-07-23"
---

# Spring Data Cassandra Configuration Mapping Repositories And Templates

## Boot Configuration

Representative configuration:

```yaml
spring:
  cassandra:
    contact-points: cassandra-1:9042,cassandra-2:9042
    local-datacenter: dc1
    keyspace-name: commerce
    username: ${CASSANDRA_USERNAME}
    password: ${CASSANDRA_PASSWORD}
    schema-action: none
    request:
      timeout: 2s
      consistency: local-quorum
```

Property availability and nesting can change across Spring Boot generations;
validate against the project's Boot reference and configuration metadata. Supply
secrets through the platform secret mechanism, not committed YAML.

Boot creates the driver `CqlSession`, converter, templates, and repository
infrastructure when dependencies and properties match. Customize driver behavior
with supported customizers/execution profiles instead of replacing all auto-
configuration unnecessarily.

## Composite Primary-Key Mapping

Start from the CQL table:

```sql
CREATE TABLE order_event_by_customer_month (
  customer_id uuid,
  month date,
  occurred_at timestamp,
  event_id timeuuid,
  order_id uuid,
  event_type text,
  payload text,
  PRIMARY KEY ((customer_id, month), occurred_at, event_id)
) WITH CLUSTERING ORDER BY (occurred_at DESC, event_id DESC);
```

Map the key explicitly:

```java
@PrimaryKeyClass
public record OrderEventKey(
        @PrimaryKeyColumn(name = "customer_id", type = PrimaryKeyType.PARTITIONED)
        UUID customerId,

        @PrimaryKeyColumn(name = "month", ordinal = 1,
                type = PrimaryKeyType.PARTITIONED)
        LocalDate month,

        @PrimaryKeyColumn(name = "occurred_at", ordinal = 0,
                type = PrimaryKeyType.CLUSTERED,
                ordering = Ordering.DESCENDING)
        Instant occurredAt,

        @PrimaryKeyColumn(name = "event_id", ordinal = 1,
                type = PrimaryKeyType.CLUSTERED,
                ordering = Ordering.DESCENDING)
        UUID eventId) {}
```

```java
@Table("order_event_by_customer_month")
public record OrderEventRow(
        @PrimaryKey OrderEventKey key,
        @Column("order_id") UUID orderId,
        @Column("event_type") String eventType,
        String payload) {}
```

Confirm annotation ordinals and generated CQL with integration tests. The Java
model must reproduce the table's partition and clustering order exactly.

## Repository

```java
public interface OrderEventRepository
        extends CassandraRepository<OrderEventRow, OrderEventKey> {

    Slice<OrderEventRow> findByKeyCustomerIdAndKeyMonthAndKeyOccurredAtBetween(
            UUID customerId,
            LocalDate month,
            Instant from,
            Instant to,
            Pageable pageable);
}
```

Derived methods must still obey Cassandra restrictions. Method names do not create
indexes or make cross-partition filtering efficient. Prefer explicit `@Query` or a
template when the generated statement is unclear, and verify prepared binding,
paging, and partition restrictions.

Repository `save` maps to Cassandra mutation semantics, not JPA persistence-context
dirty checking. There is no managed entity lifecycle, lazy relationship loading,
or relational unit of work.

## CassandraTemplate

Use the operations interface for mapped queries with explicit intent:

```java
@Repository
class OrderEventQueries {
    private final CassandraOperations operations;

    OrderEventQueries(CassandraOperations operations) {
        this.operations = operations;
    }

    List<OrderEventRow> recent(UUID customerId, LocalDate month) {
        Query query = Query.query(
                        Criteria.where("customer_id").is(customerId)
                                .and("month").is(month))
                .sort(Sort.by(Sort.Direction.DESC, "occurred_at"))
                .limit(100);
        return operations.select(query, OrderEventRow.class);
    }
}
```

Validate generated column names for embedded/composite keys. For a critical query,
explicit CQL can be easier to review than a mapping DSL.

## CqlTemplate And Prepared Statements

```java
@Repository
class InventoryCounterDao {
    private final CqlOperations cql;

    InventoryCounterDao(CqlOperations cql) {
        this.cql = cql;
    }

    void increment(UUID sku, long delta) {
        cql.execute(
                "UPDATE inventory_counter SET reserved = reserved + ? WHERE sku = ?",
                delta, sku);
    }
}
```

`CqlTemplate` handles statement execution, resources, row mapping, and Spring data-
access exception translation. `CassandraTemplate` adds object mapping. The driver
caches prepared statements; avoid generating unbounded CQL shapes or interpolating
values into query strings.

For precise driver features, inject `CqlSession`, prepare once/cached, bind typed
values, set execution profile/consistency/idempotence, and return results through a
narrow DAO. Never concatenate untrusted CQL identifiers or values.

## Converters And Types

Spring's `MappingCassandraConverter` uses driver codecs and Spring conversion.
Register explicit converters for domain value objects:

```java
@WritingConverter
class MoneyWriteConverter implements Converter<Money, BigDecimal> {
    public BigDecimal convert(Money source) {
        return source.amount();
    }
}
```

Keep currency/unit/semantic data explicit; a converter that drops meaning creates a
contract bug. Test UUID/timeuuid, timestamps/time zones, decimals, UDTs, collections,
enums, null/unset, and schema evolution.

## Paging

Prefer `Slice` when a total count would require an inappropriate distributed scan.
Cassandra paging state is not an SQL offset. If exposed as an API cursor, bind it to
the query/user, authenticate or encrypt it, expire it, and reject reuse against a
different statement or schema.

## Schema Management

Development schema actions can create/drop tables, but production should use
reviewed, compatible CQL migrations. Deploy additive schema first, support old and
new application versions, backfill/query projections safely, cut traffic, then
remove obsolete fields/tables after the compatibility window.

Do not assume `@Table` changes migrate a live cluster. Cassandra schema agreement is
necessary but does not prove data backfill or application compatibility.

## Auditing And Lifecycle Events

Spring Data supports auditing and mapping callbacks, but audit timestamps used for
business conflict resolution must have explicit clock/ownership rules. Keep
callbacks deterministic and lightweight; hidden remote calls or cross-table writes
make retries and partial failures difficult to reason about.

## Official References

- [Spring Data Cassandra support](https://docs.spring.io/spring-data/cassandra/reference/cassandra.html)
- [Mapping](https://docs.spring.io/spring-data/cassandra/reference/cassandra/mapping.html)
- [Repositories](https://docs.spring.io/spring-data/cassandra/reference/repositories.html)
- [CQL Template](https://docs.spring.io/spring-data/cassandra/reference/cassandra/cql-template.html)

## Recommended Next

Continue with [Reactive, Consistency, Testing, And Production](./SPRING-CASSANDRA-PRODUCTION-REACTIVE-TESTING.md).

