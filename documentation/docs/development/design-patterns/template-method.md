---
title: "Template Method Pattern in Spring"
description: "Define invariant workflows with customizable steps, Spring template APIs, hooks, and composition alternatives."
sidebar_label: "Template Method"
tags: ["spring", "design-patterns", "interview"]
page_type: "Deep Dive"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Template Method Pattern in Spring

<DocLabels items={[{label: 'Interview priority', tone: 'advanced'}, {label: 'Behavioral', tone: 'foundation'}, {label: 'Workflow', tone: 'production'}]} />

Template Method defines an algorithm skeleton in a base class and lets subclasses
customize selected steps without changing their order.

## Example: Controlled Import Workflow

```java
public abstract class ImportTemplate<R> {
    public final ImportSummary run(Path source) {
        validateSource(source);
        List<R> rows = parse(source);
        validateRows(rows);
        ImportSummary summary = persist(rows);
        afterSuccess(summary);
        return summary;
    }

    protected void validateSource(Path source) {
        if (!Files.isReadable(source)) {
            throw new InvalidImportSource(source);
        }
    }

    protected abstract List<R> parse(Path source);
    protected abstract void validateRows(List<R> rows);
    protected abstract ImportSummary persist(List<R> rows);
    protected void afterSuccess(ImportSummary summary) { }
}
```

The `final` method protects the invariant sequence. Abstract methods are required
steps; the empty method is an optional hook. Keep hooks few and semantically
clear.

```java
@Component
final class ProductCsvImport extends ImportTemplate<ProductRow> {
    protected List<ProductRow> parse(Path source) { /* parse CSV */ }
    protected void validateRows(List<ProductRow> rows) { /* rules */ }
    protected ImportSummary persist(List<ProductRow> rows) { /* batch write */ }
}
```

## Spring Template APIs

Spring's template classes express a related idea through callbacks:

```java
List<OrderView> orders = jdbcTemplate.query(
        "select id, status from orders where customer_id = ?",
        (rs, rowNum) -> new OrderView(rs.getLong("id"), rs.getString("status")),
        customerId
);
```

`JdbcTemplate` owns resource acquisition, execution, exception translation, and
cleanup; the callback supplies the variable mapping step. `TransactionTemplate`,
`RedisTemplate`, `JmsTemplate`, and other Spring APIs similarly hold repetitive
infrastructure mechanics in one place.

## Template Method Versus Strategy

| Concern | Template Method | Strategy |
|---|---|---|
| reuse mechanism | inheritance | composition |
| what varies | selected workflow steps | complete algorithm/collaborator |
| runtime replacement | awkward | natural |
| flow ownership | base class | context/orchestrator |
| coupling | subclass to base internals | caller to interface |

Prefer Strategy when behavior needs independent dependencies, runtime selection,
or broad variation. Prefer Template Method when the sequence itself is an
invariant and subclasses only fill narrow steps.

<DocCallout type="mistake" title="Beware the fragile base class">

Many protected methods, Boolean hooks, and access to base-class mutable state make
subclasses depend on implementation details. At that point, replace inheritance
with a small orchestrator composed from explicit step interfaces.

</DocCallout>

## Transactions and Failure

Place the transaction boundary on a public Spring bean method, not on a protected
template step that relies on proxy interception. Define which steps may perform
side effects and what happens if a later step fails. A hook is not a durable
after-commit mechanism; use transaction synchronization, an application event, or
an outbox when those semantics are required.

## Testing

Test the base flow with a minimal test subclass that records call order. Test each
concrete implementation's parsing, validation, and persistence behavior. Include
failure cases proving that later steps do not run after an earlier failure.

## Interview-Ready Answer

> Template Method fixes an algorithm skeleton in a base class while subclasses
> override selected steps. Spring's template APIs apply the same principle with
> callbacks: the framework owns resource and error handling while application
> code supplies the variable operation. It is useful for a stable mandatory flow,
> but Strategy is more flexible when behaviors vary substantially.

## Related Patterns

- [Strategy](./strategy.md) uses composition for interchangeable algorithms.
- [Chain of Responsibility](./chain-of-responsibility.md) distributes steps among
  ordered handlers and may short-circuit dynamically.

## Official References

- [Spring JDBC `JdbcTemplate`](https://docs.spring.io/spring-framework/reference/data-access/jdbc/core.html)
- [Spring `TransactionTemplate`](https://docs.spring.io/spring-framework/reference/data-access/transaction/programmatic.html)
