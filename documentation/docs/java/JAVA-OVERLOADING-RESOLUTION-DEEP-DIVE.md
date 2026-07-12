---
title: Java Overloading And Method Resolution Deep Dive
description: Applicability phases, widening, boxing, varargs, null, generics, lambdas and source compatibility with many scenarios.
---

# Java Overloading And Method Resolution Deep Dive

Overloading is a compile-time operation. Runtime receiver type only matters after
the compiler has selected a descriptor that can participate in overriding.

## Resolution Phases

The compiler identifies member candidates and accessibility, then searches in
phases: strict fixed-arity invocation, loose fixed-arity invocation, then variable
arity. It selects the most-specific applicable candidate. An applicable earlier
phase prevents later-phase candidates from winning.

## Scenario Family

```java
static String call(long x)    { return "long"; }
static String call(Integer x) { return "Integer"; }
static String call(Number x)  { return "Number"; }
static String call(Object x)  { return "Object"; }
static String call(int... x)  { return "varargs"; }
```

| Invocation | Result | Reason |
|---|---|---|
| `call(1)` | `long` | primitive widening in strict phase beats boxing |
| `call(Integer.valueOf(1))` | `Integer` | exact reference match |
| `call((short) 1)` | `long` | primitive widening |
| `call()` | `varargs` | only variable-arity candidate |
| `call(new int[]{1})` | `varargs` | array parameter is exact fixed-arity use of varargs declaration |

Widening then boxing is not a general invocation conversion: an `int` does not
become `Long`. Boxing followed by reference widening is allowed (`int -> Integer
-> Number/Object`) when no strict-phase candidate wins.

## Null And Reference Specificity

```java
static void choose(String value) {}
static void choose(Object value) {}
choose(null); // String is more specific
```

Adding `choose(Integer)` makes `choose(null)` ambiguous because `String` and
`Integer` are unrelated. Cast null to declare intent.

## Declared Type Controls Overloading

```java
static void inspect(Number n)  { System.out.println("number"); }
static void inspect(Integer n) { System.out.println("integer"); }
Number n = Integer.valueOf(1);
inspect(n); // number
```

The runtime object does not cause overload reselection.

## Inheritance And Runtime Dispatch

```java
class Parent { String use(Number n) { return "P"; } }
class Child extends Parent {
    @Override String use(Number n) { return "C override"; }
    String use(Integer n) { return "C overload"; }
}
Parent p = new Child();
p.use(1); // compiler selects use(Number); runtime dispatch returns C override
```

## Generics, Erasure And Lambdas

Two overloads whose parameterizations erase to the same descriptor clash:

```java
// void load(List<String> x) {}
// void load(List<Integer> x) {} // same erasure
```

Lambda applicability depends on target function type. Overloading unrelated SAM
types with compatible lambda shapes can be ambiguous; a cast or named method
clarifies intent. Avoid public overload sets where lambdas, method references,
boxing and null make call sites fragile.

## Compatibility Trap

Adding a more-specific overload is binary compatible with already compiled code,
which keeps calling its old descriptor, but recompilation can select the new
method and change behavior. API review must test source and binary clients.

## Compile-Or-Fail Questions

1. Can return type alone overload a method? No.
2. Can different checked exceptions overload a method? No.
3. Does `call(null)` prefer `Object` over `String`? No; `String` is more specific.
4. Can both `call(int[])` and `call(int...)` be declared? No; they have the same signature.
5. Can generic bounds make erased declarations clash? Yes.

## Official References

- [JLS method invocation](https://docs.oracle.com/javase/specs/jls/se25/html/jls-15.html#jls-15.12)
- [JLS signatures and overloading](https://docs.oracle.com/javase/specs/jls/se25/html/jls-8.html#jls-8.4.9)

## Recommended Next

Continue with [Overriding And Hiding](./JAVA-OVERRIDING-HIDING-DEEP-DIVE.md).
