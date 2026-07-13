---
title: Abstract Classes, Interfaces And Functional Java
description: Abstract types, modern interface methods, marker interfaces, lambdas, and design interview traps.
---

# Abstract Classes, Interfaces And Functional Java

## Abstract Classes

An abstract class can own state, constructors, concrete methods, and abstract methods. It cannot be instantiated, but its constructor runs while a concrete subclass is built. Avoid calling overridable methods from constructors: subclass state may not yet be initialized.

```java
abstract class PaymentProcessor {
    private final String provider;
    protected PaymentProcessor(String provider) { this.provider = provider; }
    public final void process() { validate(); charge(); }
    protected void validate() { }
    protected abstract void charge();
}
```

An abstract method cannot be `private`, `static`, or `final`: each modifier prevents the required instance override.

## Modern Interfaces

Interfaces may contain public abstract methods, public static final constants, default methods, static methods, and private instance/static helpers. Default methods allow compatible API evolution; private methods remove duplicated implementation inside default methods.

```java
interface Auditable {
    default void audit(String event) { write(prefix() + event); }
    private String prefix() { return "AUDIT:"; }
    private static void write(String value) { System.out.println(value); }
    static Auditable standard() { return event -> { }; } // only if one abstract method
    void record(String event);
}
```

Conflict order: a class method wins over an interface default; a more-specific interface wins; unrelated defaults must be resolved explicitly with `InterfaceName.super.method()`.

## Marker Interfaces

Marker interfaces such as `Serializable`, `Cloneable`, and `RandomAccess` contain no required methods but attach type-level meaning. Unlike annotations, they participate in subtyping and generic bounds. Prefer annotations for metadata unless APIs must accept only marked types.

## Functional Interfaces

One abstract method makes an interface functional; inherited `Object` methods and any number of default/static methods do not count. `@FunctionalInterface` makes the intent compiler-checked.

| Interface | Shape | Typical use |
|---|---|---|
| `Predicate<T>` | `T -> boolean` | validation/filtering |
| `Consumer<T>` | `T -> void` | side effect |
| `Supplier<T>` | `() -> T` | lazy production/factory |
| `Function<T,R>` | `T -> R` | transformation |
| `UnaryOperator<T>` | `T -> T` | same-type transformation |
| `BiFunction<T,U,R>` | `(T,U) -> R` | combine two values |

Java has no standard `Producer` interface; `Supplier<T>` represents that role. Lambdas capture only final or effectively-final local variables, while captured object state can still mutate.

## Interview Traps

<ExpandableAnswer title="Can an abstract class have no abstract methods?">

Yes.

</ExpandableAnswer>

<ExpandableAnswer title="Can an interface have a constructor or instance field?">

No.

</ExpandableAnswer>

<ExpandableAnswer title="Can a functional interface have many default methods?">

Yes.

</ExpandableAnswer>

<ExpandableAnswer title="Does a lambda create the same this as an anonymous class?">

No; lambda `this` is lexical.

</ExpandableAnswer>

<ExpandableAnswer title="Why were private interface methods added?">

To share implementation among default methods without exposing it.

</ExpandableAnswer>


## Official References

- [JLS interfaces](https://docs.oracle.com/javase/specs/jls/se25/html/jls-9.html)
- [Java functional package](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/function/package-summary.html)

## Recommended Next

Continue with [Objects, Strings And Garbage Collection](./JAVA-OBJECTS-STRINGS-GC.md).
