---
title: Spring Data Repositories Paging Auditing And Events
description: Repository contracts, projections, paging, scrolling, auditing, callbacks, domain events, and safe API boundaries.
difficulty: Intermediate
page_type: Deep Dive
status: Generic
prerequisites: [Spring Data Commons internals]
learning_objectives: [Choose repository return types, Design stable pagination, Use auditing callbacks and domain events safely]
technologies: [Spring Data Commons, Java]
last_reviewed: "2026-07-24"
---

# Spring Data Repositories Paging Auditing And Events

## Repository Contract Design

Expose only operations the aggregate supports. Extending a broad CRUD interface is easy,
but it can accidentally publish deletes, unbounded reads, or partial updates that violate
business invariants.

| Return type | Use | Trade-off |
|---|---|---|
| `Optional<T>` | at most one result | absence is explicit |
| `List<T>` | known bounded result | materializes all values |
| `Slice<T>` | next-page knowledge without total | avoids count query |
| `Page<T>` | content plus exact total | count may dominate latency |
| `Window<T>` | scrolling/keyset access | client must carry position |
| stream/reactive publisher | incremental processing | resource lifecycle must be closed/observed |

## Projection Choices

Closed interface projections select known properties; DTO/record projections create an
explicit API shape; open projections may execute expressions after materialization. Measure
the generated query and serialization boundary rather than assuming every projection is
cheap.

```java
public record OrderSummary(UUID id, String status, BigDecimal total) {}

interface OrderSummaryView {
    UUID getId();
    String getStatus();
}
```

Do not return persistence entities directly from controllers. It couples HTTP contracts to
lazy loading, mapping changes, security-sensitive columns, and persistence lifecycle.

## Offset And Keyset Pagination

Offset pagination is simple but becomes expensive at deep offsets and can shift under
concurrent writes. Keyset pagination uses a stable indexed tuple such as `(created_at, id)`.

Every pageable query needs:

- deterministic ordering with a unique tie-breaker;
- an index matching filters and ordering;
- a maximum page size;
- a policy for snapshot drift;
- an opaque, validated cursor if positions cross a public boundary.

Use `Slice` when a total is unnecessary. Use `Page` only when the product truly requires
an exact count and the count query has an acceptable plan.

## Auditing

Auditing records who created or modified a mapped object and when. It is not a complete
business audit trail because it does not explain intent, before/after values, authorization,
or externally visible effects.

```java
@CreatedDate Instant createdAt;
@LastModifiedDate Instant updatedAt;
@CreatedBy String createdBy;
@LastModifiedBy String updatedBy;
```

Define how principal information propagates through HTTP, scheduled, Kafka, batch, and
system-initiated work. Store timestamps in a consistent instant-based representation.

## Entity Callbacks And Store Events

Callbacks can normalize or validate mapped values, but hidden I/O inside lifecycle callbacks
creates surprising latency and transaction behavior. Keep callbacks deterministic and local.
Use application services for workflows and an outbox for reliable integration events.

Aggregate domain events published by repository infrastructure occur around repository
operations; they do not automatically make database and broker writes atomic. A process
crash can still lose an external publish after the database commits.

## Bulk Mutation Warning

Bulk updates often bypass per-entity callbacks, optimistic-version handling, dirty checking,
and auditing. Document which guarantees are intentionally skipped, clear stale session state
where relevant, and verify affected-row counts.

## Production Evidence

- Repository contract test proves absence and multiplicity semantics.
- Generated query and bind values are observable without leaking secrets.
- Explain plan proves bounded index access.
- Concurrent pagination test demonstrates accepted drift behavior.
- Audit test covers human, service, scheduler, and message identities.
- Outbox test proves events survive a process crash after commit.

## Interview Questions

1. Why can `Page` be much slower than `Slice`?
2. How do you make pagination deterministic under equal timestamps?
3. Why are repository domain events not an outbox replacement?
4. When should entities not be returned by a REST controller?
5. Which behavior can a bulk update bypass?

## Official References

- [Repository query return types](https://docs.spring.io/spring-data/commons/reference/repositories/query-return-types-reference.html)
- [Scrolling](https://docs.spring.io/spring-data/commons/reference/repositories/scrolling.html)
- [Auditing](https://docs.spring.io/spring-data/commons/reference/auditing.html)

## Recommended Next

Choose the store-specific track from the [Spring Data Architect Path](../SPRING-DATA-ARCHITECT-PATH.md).

