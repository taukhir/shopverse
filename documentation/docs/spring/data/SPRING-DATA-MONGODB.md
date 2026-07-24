---
title: Spring Data MongoDB In Depth
description: Document mapping, repositories, MongoTemplate, aggregation, indexes, transactions, change streams, reactive access, sharding, and incidents.
difficulty: Advanced
page_type: Deep Dive
status: Generic
prerequisites: [MongoDB fundamentals, Spring Data Commons]
learning_objectives: [Model bounded documents, Implement repository and template queries, Operate indexes transactions and sharding]
technologies: [Spring Data MongoDB, MongoDB, Spring Boot]
last_reviewed: "2026-07-24"
---

# Spring Data MongoDB In Depth

## Document Model First

Embed data read and changed with the aggregate; reference independently growing or owned
data. Avoid unbounded arrays, frequently rewritten giant documents, and relational-style
joins disguised as convenience mappings.

```java
@Document("orders")
class OrderDocument {
    @Id UUID id;
    @Version Long version;
    OrderStatus status;
    List<OrderLineDocument> lines;
    @Field("created_at") Instant createdAt;
}
```

`@DocumentReference` is an application mapping feature, not a foreign key. It does not add
referential integrity or make cross-document updates atomic.

## Repositories And MongoTemplate

Use repositories for stable aggregate access. Use `MongoTemplate` for criteria, updates,
bulk operations, aggregation pipelines, collation, hints, and advanced query options.

```java
Query query = Query.query(Criteria.where("status").is("READY"))
    .with(Sort.by("createdAt", "id"))
    .limit(100);
List<OrderDocument> orders = mongoTemplate.find(query, OrderDocument.class);
```

For partial changes, explicit update operations avoid reading and replacing an entire
document. Preserve version/invariant checks where concurrent writers exist.

## Indexes And Query Evidence

Design compound indexes from equality, sort, and range predicates. Validate with `explain`,
including documents and keys examined. Indexes consume memory and write I/O, so remove
unused indexes through a measured rollout.

Do not enable automatic index creation in production as an unreviewed schema-management
strategy. Treat index builds and uniqueness changes as migrations with capacity and rollback.

## Aggregation

Aggregation pipelines should filter early, project required fields, bound fan-out, and avoid
large in-memory stages. Decide whether the pipeline belongs on the request path, in a
materialized projection, or in an offline analytics system.

## Transactions And Consistency

Single-document writes are atomic. Multi-document transactions are available in supported
deployments but add coordination, resource, and latency cost. Prefer document boundaries
that preserve invariants without distributed-style transaction use.

Use majority/write/read concerns based on failure tolerance. Understand retryable writes and
unknown outcomes; business operations still need idempotency.

## Change Streams

Change streams can drive projections and integrations, but consumers need resume-token
persistence, idempotency, lag monitoring, retention awareness, schema evolution, and a
rebuild path. They are not automatically an audit log.

## Reactive MongoDB

Reactive repositories and `ReactiveMongoTemplate` fit end-to-end reactive applications.
Bound concurrency and prove cancellation/resource cleanup. Do not mix blocking and reactive
drivers casually in one request path.

## Sharding And Production

Choose a shard key from cardinality, write distribution, query routing, monotonicity, and
future resharding constraints. A poor key produces hot shards or scatter-gather queries.

Monitor operation latency, scanned/returned ratio, cache pressure, replication lag, connection
pools, elections, chunk distribution, document size, and change-stream lag.

## Production Scenarios

- Growing document latency: inspect document/array growth and update amplification.
- One shard overloaded: inspect shard-key distribution and targeted-query percentage.
- Duplicate change event: deduplicate by event/resume identity and make projection idempotent.
- Transaction aborts: measure contention, duration, document count, and retry semantics.
- New unique index fails: locate duplicates before the migration, then enforce incrementally.

## Interview Questions

1. When should data be embedded rather than referenced?
2. Why is `@DocumentReference` not a relational association?
3. When is a multi-document transaction justified?
4. How do resume tokens affect change-stream recovery?
5. What makes a shard key safe for both writes and queries?

## Official References

- [Spring Data MongoDB reference](https://docs.spring.io/spring-data/mongodb/reference/)
- [MongoDB manual](https://www.mongodb.com/docs/manual/)

## Recommended Next

Continue with [Multi-Store Consistency](./SPRING-DATA-MULTISTORE-CONSISTENCY.md).

