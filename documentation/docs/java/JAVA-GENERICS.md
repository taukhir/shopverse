---
title: Java Generics
status: "maintained"
last_reviewed: "2026-07-13"
---

# Java Generics

:::info Canonical learning route
This page introduces the API surface. Erasure translation, bridges, wildcard
capture and heap pollution are canonical in
[Generics And Erasure Internals](./JAVA-GENERICS-ERASURE-INTERNALS.md).
:::

Generics add compile-time type safety while allowing reusable classes and
methods.

```java
List<String> usernames = List.of("ana", "rose");
String first = usernames.getFirst();
```

Without generics, callers would need casts and runtime failures would be more
common.

## Generic Class

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

## Interview Questions

<ExpandableAnswer title="Why use generics?">

Generics provide compile-time type safety and allow reusable APIs without
unsafe casts or duplicated implementations for every element type.

</ExpandableAnswer>

## Official References

- [JLS types, values and variables](https://docs.oracle.com/javase/specs/jls/se25/html/jls-4.html)

<ExpandableAnswer title="What is type erasure?">

Generic type parameters are mostly removed from bytecode for backward
compatibility. The compiler inserts casts and bridge methods where required.

</ExpandableAnswer>

<ExpandableAnswer title="When should you use extends versus super?">

Use `extends` for a producer that you primarily read from and `super` for a
consumer that you write values into: producer extends, consumer super.

</ExpandableAnswer>
