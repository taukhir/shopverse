---
title: Java Generics, Erasure And Variance Internals
description: Senior guide to invariance, wildcard capture, erasure, bridges, heap pollution, arrays, and API design.
status: "maintained"
last_reviewed: "2026-07-13"
---

# Java Generics, Erasure And Variance Internals

## Why Invariance Exists

If `List<Integer>` were a subtype of `List<Number>`, a caller could add a
`Double` and violate the original list. Wildcards express use-site variance:
`? extends Number` supports reading values as `Number`; `? super Integer`
supports adding integers while reads are only safely `Object`.

```java
static double sum(List<? extends Number> source) { /* producer */ }
static void addDefaults(List<? super Integer> target) { target.add(0); }
```

PECS is a starting heuristic, not the entire type model. A wildcard denotes an
unknown captured type. Helper methods can capture it when two operations must
refer to the same unknown type.

## Erasure Translation

Type parameters erase to their leftmost bound or `Object`. Casts are inserted
at use sites, and descriptors generally contain erased types. Generic metadata
is retained in class-file signature attributes for compilers/reflection but is
not reified as per-instance type arguments.

```java
class Box<T extends Number & Comparable<T>> {
    T value;
}
```

The field descriptor erases to `Number`; the fuller bound information appears
in generic signatures. This explains why `new T()`, `T.class`, `instanceof
List<String>` and ordinary generic arrays are unavailable.

## Bridge Methods

```java
class Parent<T> { T value() { return null; } }
class Child extends Parent<String> {
    @Override String value() { return "x"; }
}
```

After erasure, polymorphism requires a synthetic bridge compatible with the
parent's erased `Object value()` descriptor, delegating to `String value()`.
Frameworks inspecting methods must account for bridge and synthetic flags.

## Heap Pollution

Heap pollution exists when a variable of a parameterized type refers to an
object incompatible with that parameterization. Raw types, unchecked casts and
generic varargs are common entry points; failure often occurs far from the
unsafe write.

```java
static void corrupt(List<String> strings) {
    List raw = strings;
    raw.add(42);             // unchecked
    String first = strings.get(0); // later ClassCastException
}
```

`@SafeVarargs` is a programmer assertion that the method does not perform unsafe
operations on its non-reifiable varargs array; it does not make unsafe code safe.

## Arrays Versus Generics

Arrays are reified and covariant, so an invalid store is checked at runtime.
Generics are invariant and erased, shifting many errors to compilation.

```java
Number[] values = new Integer[1];
values[0] = 1.5; // ArrayStoreException
```

Prefer collections for generic APIs. Where runtime type tokens are needed, pass
`Class<T>` or a richer type token deliberately and understand that nested
generic information requires more than `Class<List>`.

## API Design Rules

- Expose the least restrictive useful type; accept interfaces, return stable contracts.
- Use wildcards on inputs when callers benefit; avoid wildcard return types that export capture complexity.
- Avoid raw types and broad unchecked suppression.
- Keep type parameters when relationships between multiple arguments/results matter.
- Consider sealed result types when a closed outcome model is clearer than generic exception channels.

## Lab And Interview

<ExpandableAnswer title="What should an architect explain about Java Generics, Erasure And Variance Internals?">

For **Java Generics, Erasure And Variance Internals**, a strong answer starts with the runtime responsibility and the invariant that must remain true. It then walks through one Shopverse request or event, names the important boundary, and explains the failure behavior rather than describing only the happy path. Close with the trade-off, the production signal that verifies the design, and the condition that would justify a different approach. This structure demonstrates practical judgment without memorizing isolated definitions.

</ExpandableAnswer>

Use `javap -v` to locate `Signature`, bridge and synthetic metadata. Compile
varargs pollution with `-Xlint:unchecked`. Explain why `List<?>` permits `null`
addition but not arbitrary objects, and why `List<? super Number>` is not safely
read as `Number`.

## Official References

- [JLS type parameters](https://docs.oracle.com/javase/specs/jls/se25/html/jls-4.html#jls-4.4)
- [JLS erasure](https://docs.oracle.com/javase/specs/jls/se25/html/jls-4.html#jls-4.6)
- [JLS heap pollution](https://docs.oracle.com/javase/specs/jls/se25/html/jls-4.html#jls-4.12.2.1)

## Recommended Next

Continue with [Strings And Encoding Internals](./JAVA-STRINGS-ENCODING-INTERNALS.md).
