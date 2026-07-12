---
title: Java Records
sidebar_position: 5
---

# Java Records

Records are compact classes for immutable data carriers.

```java
public record OrderResponse(
        Long id,
        String orderNumber,
        BigDecimal totalAmount
) {
}
```

The compiler generates:

- private final fields;
- canonical constructor;
- accessors named after components;
- `equals`;
- `hashCode`;
- `toString`.

## Compact Constructor

```java
public record Money(BigDecimal amount, String currency) {
    public Money {
        Objects.requireNonNull(amount);
        Objects.requireNonNull(currency);

        if (amount.signum() < 0) {
            throw new IllegalArgumentException("Amount cannot be negative");
        }
    }
}
```

## Records In Spring Boot

Records work well for request/response DTOs:

```java
public record CheckoutRequest(
        @NotNull Long productId,
        @Positive int quantity
) {
}
```

```java
@PostMapping("/checkout")
ResponseEntity<OrderResponse> checkout(
        @Valid @RequestBody CheckoutRequest request
) {
    return ResponseEntity.status(HttpStatus.CREATED)
            .body(orderService.checkout(request));
}
```

## Records vs Lombok DTOs

| Records | Lombok DTOs |
|---|---|
| built into Java | annotation processor |
| immutable by default | mutable or immutable depending on annotations |
| less boilerplate | more flexible |
| final class | can support more class shapes |

## Limitations

- records cannot extend classes;
- records are final;
- component references are final, but referenced objects can still be mutable;
- records should not contain heavy business behavior.

## Interview Questions

### Are records deeply immutable?

No. Record component references are final. If a component is a mutable list,
the list itself can still be changed unless copied defensively.

### Can records implement interfaces?

Yes.

### Can records be JPA entities?

Usually no. JPA entities need identity, lifecycle, proxies, and a no-arg
constructor model. Use records for DTOs and projections instead.

## Runtime And Invariant Depth

Records are final nominal classes with private final component fields, accessors,
and generated value methods. They are shallowly immutable. A compact constructor
validates/normalizes parameters before implicit field assignment; reassign the
parameter to store a defensive copy. Record serialization reconstructs through
the canonical constructor, supporting invariant validation differently from
ordinary serializable classes.

## Tricky Interview Questions

1. Can a record component reference mutable state? Yes.
2. Can a record extend another class? No; it extends `Record`.
3. Does a compact constructor explicitly assign every field? No; assignment is implicit after its body.

## Official References

- [JLS record classes](https://docs.oracle.com/javase/specs/jls/se25/html/jls-8.html#jls-8.10)
