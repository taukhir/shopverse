---
title: "Builder Pattern in Spring"
description: "Build readable immutable objects, preserve domain invariants, and distinguish builders from Spring bean construction."
sidebar_label: "Builder"
tags: ["spring", "design-patterns", "interview"]
page_type: "Deep Dive"
difficulty: "Intermediate"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Builder Pattern in Spring

<DocLabels items={[{label: 'Core pattern', tone: 'intermediate'}, {label: 'Creational', tone: 'foundation'}, {label: 'Domain design', tone: 'production'}]} />

Builder constructs an object step by step through named operations. It is useful
for immutable objects with many optional values, staged configuration, or
construction invariants.

## Make Construction Readable

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

## Builders in Spring APIs

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

## Lombok and JPA Cautions

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

## Testing and Trade-offs

Test defaults, required values, invalid combinations, and defensive copies.
Builders improve call-site readability and evolution, but add boilerplate and may
hide which fields are mandatory. Records and named constructors remain better for
small, stable value objects.

## Interview-Ready Answer

> Builder provides named, stepwise construction for a complex object. I put
> required values in the entry method or constructor, give optional values safe
> defaults, copy collections, and enforce invariants in `build()`. Spring uses
> builders in APIs such as WebClient. I avoid indiscriminate Lombok builders on
> domain entities because they can expose invalid state.

## Related Patterns

- [Factory](./factory.md) decides which product to create; Builder assembles one
  product.
- [Singleton](./singleton.md) may be the scope of a configured client produced by
  a builder.

## Official References

- [Spring WebClient configuration](https://docs.spring.io/spring-framework/reference/web/webflux-webclient/client-builder.html)
- [Spring Boot WebClient customization](https://docs.spring.io/spring-boot/reference/io/rest-client.html#io.rest-client.webclient.customization)
