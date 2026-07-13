---
title: Cache-Aside Versus Write-Through
description: Choose a cache write policy from ownership, stale windows, and failure recovery.
difficulty: Advanced
page_type: Decision Guide
status: Generic
prerequisites: [Caching, Transactions]
learning_objectives: [Compare ownership, Quantify staleness, Design repair]
technologies: [Spring Cache, Redis, PostgreSQL]
last_reviewed: "2026-07-13"
---

# Cache-Aside Versus Write-Through

<DocLabels items={[
  {label: 'Decision guide', tone: 'advanced'},
  {label: 'Consistency', tone: 'production'},
  {label: 'Failure windows', tone: 'shopverse'},
]} />

| Cache-aside | Write-through |
|---|---|
| application reads source on miss and populates | write path updates through cache abstraction |
| simple, demand-loaded, source remains explicit | cache may stay warm for written values |
| miss stampede and invalidation windows | write latency and dual-system failure complexity |
| best for read-heavy data with tolerable staleness | useful when cache is an owned write path with durable semantics |

## Use And Avoid

Use cache-aside when the database is authoritative, only demanded keys should be
cached, and TTL/event invalidation can satisfy the stale budget. Avoid it for an
invariant that must be current at acceptance time.

Use write-through only when the cache layer has explicit ownership, failure and
durability semantics. Avoid treating two independent writes—database then
Redis—as atomic merely because they occur in one method.

## Migration Path

1. Define read-specific staleness and availability contracts.
2. Add version/timestamp metadata and hit/miss/load metrics.
3. Introduce the new policy for one key namespace.
4. Dual-read only for comparison; never silently choose conflicting values.
5. Test cache outage, DB outage and crash between writes.
6. Retain TTL and reconciliation as repair paths.

<!-- snippet-source: labs/spring-architect/src/main/java/io/shopverse/labs/cache/ProductPriceService.java -->
<!-- snippet-test: labs/spring-architect/src/test/java/io/shopverse/labs/CacheBehaviorTest.java -->

<ExpandableAnswer title="Interview: Which pattern guarantees strong consistency?">

Neither by itself. Strong consistency depends on one authoritative commit path
or a coordination protocol with defined failure semantics. For critical pricing
or allocation, validate against the source of truth and treat cached data as a
versioned projection unless the cache is itself the transactional system.

</ExpandableAnswer>

## Official References

- [Spring cache abstraction](https://docs.spring.io/spring-framework/reference/integration/cache.html)
- [Spring cache annotations](https://docs.spring.io/spring-framework/reference/integration/cache/annotations.html)

## Recommended Next

Run [Database And Cache Consistency Lab](../architect-labs/DATABASE-CACHE-CONSISTENCY.md).
