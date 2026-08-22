---
title: Java Generics
status: maintained
last_reviewed: "2026-07-13"
page_type: Guide
difficulty: Intermediate
prerequisites: [Java classes, interfaces, inheritance, and collections]
learning_objectives: [Design type-safe generic APIs, Apply bounds and wildcards correctly, Explain erasure heap pollution and bridge methods]
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Java Generics

:::info Canonical learning route
This page introduces the API surface. Erasure translation, bridges, wildcard
capture and heap pollution are canonical in
[Generics And Erasure Internals](./JAVA-GENERICS-ERASURE-INTERNALS.md).
:::

Generics add compile-time type safety while allowing reusable classes and
methods.

## Page Overview

Java generics parameterize classes, interfaces, and methods with compile-time
types. This guide progresses from type parameters and bounds to invariance,
wildcards, erasure, heap pollution, API design, and the production boundaries of
reflection and serialization.

## Core Terminology

A **type parameter** declares a placeholder such as `T`; a **type argument** is
the supplied type such as `String`. A **bound** restricts valid arguments, a
**wildcard** describes an unknown compatible type, and **erasure** is the compiler
translation that removes most generic type information from runtime descriptors.

## Mental Model And First Example

```java
List<String> usernames = List.of("ana", "rose");
String first = usernames.getFirst();
```

Without generics, callers would need casts and runtime failures would be more
common.

## How It Works: Generic Class

```java
class ApiResponse<T> {
    private final T data;

    ApiResponse(T data) {
        this.data = data;
    }

    T data() {
        return data;
    }
}
```

## Generic Method

```java
static <T> T requireFound(Optional<T> value) {
    return value.orElseThrow(() -> new NoSuchElementException("Not found"));
}
```

## Bounds

```java
static <T extends Number> BigDecimal sum(List<T> values) {
    return values.stream()
            .map(number -> BigDecimal.valueOf(number.doubleValue()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
}
```

## Wildcards

| Syntax | Meaning | Use |
|---|---|---|
| `List<?>` | unknown type | read as `Object`, cannot add specific values |
| `List<? extends Number>` | producer of `Number` | read numbers |
| `List<? super Integer>` | consumer of `Integer` | add integers |

PECS rule: producer extends, consumer super.

```java
void copy(List<? extends Number> source, List<? super Number> target) {
    target.addAll(source);
}
```

## Type Erasure

Java removes most generic type information at runtime:

```java
List<String> names = new ArrayList<>();
List<Integer> ids = new ArrayList<>();
```

Both are `ArrayList` at runtime. This is why `new T()` and `List<String>.class`
are not valid.

## Why Type Erasure Matters

You cannot do this:

```java
if (value instanceof List<String>) {
    // not valid
}
```

At runtime, Java only sees `List`, not `List<String>`.

You also cannot create a generic array directly:

```java
T[] values = new T[10]; // not valid
```

Use collections or pass a `Class<T>`/factory when runtime type information is
required.

```java
class JsonReader<T> {
    private final Class<T> type;

    JsonReader(Class<T> type) {
        this.type = type;
    }

    T read(String json, ObjectMapper mapper) throws JsonProcessingException {
        return mapper.readValue(json, type);
    }
}
```

For nested generic JSON types, Jackson uses `TypeReference`:

```java
List<OrderResponse> orders = mapper.readValue(
        json,
        new TypeReference<List<OrderResponse>>() {}
);
```

## Invariance

`List<Integer>` is not a subtype of `List<Number>`.

```java
List<Integer> integers = List.of(1, 2);
// List<Number> numbers = integers; // not allowed
```

If this were allowed, someone could add a `BigDecimal` into a list that was
originally a list of integers. Use wildcards when variance is needed.

## Generic API Design

Good generic APIs keep type parameters meaningful:

```java
interface Repository<ID, ENTITY> {
    Optional<ENTITY> findById(ID id);
    ENTITY save(ENTITY entity);
}
```

Avoid generic parameters that do not add safety or clarity.

## Boundaries, Trade-Offs, And Edge Cases

- generic types are invariant, so `List<Integer>` is not `List<Number>`;
- arrays are reified and covariant while generics are erased and invariant;
- raw types bypass checks and can create heap pollution far from the failing cast;
- `List<?>` permits safe reading as `Object` but not arbitrary writes;
- recursive bounds and wildcard-heavy APIs can be correct yet unusable—prefer the
  simplest signature that preserves the caller's contract.

## Production Evidence And API Compatibility

Expose semantic type parameters, keep unsafe casts at audited boundaries, and
test reflection/serialization frameworks with nested parameterized types. API
reviews should check binary compatibility, bridge methods, variance at extension
points, and whether a domain-specific type is clearer than another generic layer.

## Interview Questions

<ExpandableAnswer title="Why use generics?">

Generics provide compile-time type safety and allow reusable APIs without
unsafe casts or duplicated implementations for every element type.

</ExpandableAnswer>

## Official References

- [JLS types, values and variables](https://docs.oracle.com/javase/specs/jls/se25/html/jls-4.html)

## Recommended Next

Continue with [Generics And Erasure Internals](./JAVA-GENERICS-ERASURE-INTERNALS.md),
then apply the contracts in [Java Collections](./JAVA-COLLECTIONS.md).

<ExpandableAnswer title="What is type erasure?">

Generic type parameters are mostly removed from bytecode for backward
compatibility. The compiler inserts casts and bridge methods where required.

</ExpandableAnswer>

<ExpandableAnswer title="When should you use extends versus super?">

Use `extends` for a producer that you primarily read from and `super` for a
consumer that you write values into: producer extends, consumer super.

</ExpandableAnswer>
