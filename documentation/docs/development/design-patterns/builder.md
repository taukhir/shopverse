---
title: "Builder Pattern in Java and Spring"
description: "Compare manual, staged, Lombok, and Spring builders while preserving required fields, defaults, and domain invariants."
sidebar_label: "Builder"
tags: ["java", "spring", "design-patterns", "creational", "interview"]
page_type: "Deep Dive"
difficulty: "Intermediate"
status: "maintained"
last_reviewed: "2026-07-24"
---

# Builder Pattern in Java and Spring

<DocLabels items={[{label: 'Core pattern', tone: 'intermediate'}, {label: 'Creational', tone: 'foundation'}, {label: 'Domain design', tone: 'production'}]} />

Builder constructs an object step by step through named operations. It is useful
for immutable objects with many optional values, staged configuration, or
construction invariants.

## The Problem

Telescoping constructors make optional values and same-typed arguments hard to
read:

```java
new SearchOrdersQuery(customerId, Set.of(), null, null, 50, true, false);
```

A JavaBean with setters is readable but can be observed half-built, makes
immutability difficult, and may postpone validation until much later. Builder
separates mutable construction state from the final valid product.

## Implementation 1: Manual Immutable Builder

```java
public final class SearchOrdersQuery {
    private final CustomerId customerId;
    private final Set<OrderStatus> statuses;
    private final Instant createdAfter;
    private final int pageSize;

    private SearchOrdersQuery(Builder builder) {
        this.customerId = Objects.requireNonNull(builder.customerId);
        this.statuses = Set.copyOf(builder.statuses);
        this.createdAfter = builder.createdAfter;
        this.pageSize = builder.pageSize;
    }

    public static Builder forCustomer(CustomerId customerId) {
        return new Builder(customerId);
    }

    public static final class Builder {
        private final CustomerId customerId;
        private Set<OrderStatus> statuses = Set.of();
        private Instant createdAfter;
        private int pageSize = 50;

        private Builder(CustomerId customerId) {
            this.customerId = customerId;
        }

        public Builder statuses(Set<OrderStatus> value) {
            this.statuses = Set.copyOf(value);
            return this;
        }

        public Builder createdAfter(Instant value) {
            this.createdAfter = value;
            return this;
        }

        public Builder pageSize(int value) {
            this.pageSize = value;
            return this;
        }

        public SearchOrdersQuery build() {
            if (pageSize < 1 || pageSize > 200) {
                throw new IllegalStateException("pageSize must be between 1 and 200");
            }
            return new SearchOrdersQuery(this);
        }
    }
}
```

Required data enters the builder constructor, optional data has defaults, mutable
collections are copied, and `build()` rejects invalid combinations.

### Drawbacks And Solutions

- Boilerplate grows with the product. Generate only mechanical code, but keep
  validation and API design explicit.
- Callers may not know which values are required. Put required values in the
  entry method or use a staged builder.
- A reusable builder carries stale mutable state. Treat builders as single-use
  or add an explicit safe reset.

## Implementation 2: Staged Builder

Interfaces can make required construction steps compile-time visible:

```java
public final class ApiRequest {
    public interface MethodStep {
        UriStep method(HttpMethod method);
    }
    public interface UriStep {
        OptionalStep uri(URI uri);
    }
    public interface OptionalStep {
        OptionalStep header(String name, String value);
        ApiRequest build();
    }

    public static MethodStep builder() {
        return new Steps();
    }

    private static final class Steps
            implements MethodStep, UriStep, OptionalStep {
        // state and interface implementations
    }
}
```

The call order is enforced:

```java
ApiRequest request = ApiRequest.builder()
        .method(HttpMethod.POST)
        .uri(URI.create("/orders"))
        .header("Idempotency-Key", key)
        .build();
```

### Drawback And Solution

Staged builders add several types and become awkward with many optional branches.
Use them only when construction order or mandatory stages are genuinely complex;
otherwise required constructor arguments plus one normal builder are clearer.

## Implementation 3: Lombok `@Builder`

```java
@Builder
public record ProductSearch(
        @NonNull String query,
        Set<Category> categories,
        @Builder.Default int pageSize
) {
    public ProductSearch {
        categories = categories == null ? Set.of() : Set.copyOf(categories);
        if (pageSize < 1 || pageSize > 100) {
            throw new IllegalArgumentException("pageSize must be 1..100");
        }
    }
}
```

Lombok removes mechanics, but the record constructor must still enforce the
invariants because callers, reflection, or deserializers may bypass the builder.

## Implementation 4: Builders In Spring APIs

Spring commonly exposes builders for staged client or request configuration:

```java
WebClient client = WebClient.builder()
        .baseUrl(properties.baseUrl().toString())
        .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
        .build();
```

Prefer injecting a configured `WebClient.Builder` when application-wide filters,
observability, codecs, or customizers should be retained. Calling a static builder
everywhere can silently discard platform configuration.

## JPA And Domain-Model Cautions

Lombok `@Builder` removes boilerplate but does not design the construction API. On
a JPA entity it may expose fields that should change only through domain methods,
omit persistence-required constructors, or allow invalid state. Prefer a named
factory for aggregates with a small valid creation path:

```java
Order order = Order.open(customerId, items, clock.instant());
```

Use a builder for DTOs, test fixtures, and configuration when it improves clarity;
do not make every two-field value object fluent.

<DocCallout type="mistake" title="A builder must not postpone all validation">

Named setters are not enough. Protect required fields, cross-field invariants,
defensive copies, and defaults at `build()` or through staged types. Otherwise the
builder merely makes invalid objects easier to create.

</DocCallout>

## Drawbacks, Remedies, And Tests

| Risk | Remedy | Proving test |
|---|---|---|
| required field is omitted | require it in the entry method or staged interface | missing required data cannot build |
| mutable input leaks into product | defensive-copy at setter and construction boundaries | mutate source collection after `build()` |
| default silently changes | define it once and assert it | default-value test |
| invalid field combination passes | validate cross-field rules in `build()` or constructor | parameterized invalid-combination tests |
| builder hides a tiny object | replace with a record or named constructor | compare call-site clarity |

Builders improve call-site readability and evolution, but add indirection and
boilerplate. Records and named constructors remain better for small, stable
value objects.

## Interview-Ready Answer

> Builder provides named, stepwise construction for a complex object. I put
> required values in the entry method or constructor, give optional values safe
> defaults, copy collections, and enforce invariants in `build()`. Spring uses
> builders in APIs such as WebClient. I avoid indiscriminate Lombok builders on
> domain entities because they can expose invalid state.

## Related Patterns

- [Factory](./factory.md) decides which product to create; Builder assembles one
  product.
- [Prototype](./prototype.md) starts from an existing configured instance;
  `toBuilder()` is a hybrid when many copied fields may change.
- [Singleton](./singleton.md) may be the scope of a configured client produced by
  a builder.

## Official References

- [Spring WebClient configuration](https://docs.spring.io/spring-framework/reference/web/webflux-webclient/client-builder.html)
- [Spring Boot WebClient customization](https://docs.spring.io/spring-boot/reference/io/rest-client.html#io.rest-client.webclient.customization)
