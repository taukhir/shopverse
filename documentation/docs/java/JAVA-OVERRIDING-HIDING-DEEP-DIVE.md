---
title: Java Overriding, Method Hiding And Field Hiding Deep Dive
description: Runtime dispatch, static hiding, fields, covariant returns, exceptions, bridges, defaults and construction traps.
---

# Java Overriding, Method Hiding And Field Hiding Deep Dive

## Three Different Mechanisms

| Mechanism | Applies to | Selection |
|---|---|---|
| overloading | methods and constructors | compile-time parameter resolution |
| overriding | inherited instance methods | runtime receiver dispatch after descriptor selection |
| hiding | static methods and fields | compile-time reference/class type |

## Runtime Overriding

```java
class Parent { Number value() throws IOException { return 1; } }
class Child extends Parent {
    @Override public Integer value() throws FileNotFoundException { return 2; }
}
Parent p = new Child();
System.out.println(p.value()); // 2
```

The child widens access, narrows the checked exception and returns a covariant
subtype. It could declare unchecked exceptions. It cannot narrow access or add a
broader checked exception.

Private methods are not inherited and cannot be overridden. Final instance
methods cannot be overridden. Package-private methods outside their package may
not form the override relationship developers expect.

## Static Method Hiding

```java
class Parent { static String type() { return "parent"; } }
class Child extends Parent { static String type() { return "child"; } }
Parent reference = new Child();
System.out.println(reference.type()); // parent
System.out.println(Child.type());      // child
```

Static selection uses the compile-time qualifier. Call statics with the declaring
class to make hiding visible. `@Override` is invalid.

## Field Hiding

```java
class Parent { String name = "parent"; }
class Child extends Parent { String name = "child"; }
Parent value = new Child();
System.out.println(value.name); // parent
```

Fields are not polymorphic. Inside `Child`, `name` and `super.name` address
different storage. Hiding state creates two sources of truth and should normally
be avoided.

## Interface Default Resolution

A concrete class method wins over an interface default. A more-specific interface
wins over its ancestor. Unrelated defaults require an explicit override, which
can call `Left.super.method()`. Default methods enable interface evolution but
can create source conflicts when clients already implement an unrelated method.

## Bridges After Erasure

```java
class Base<T> { T get() { return null; } }
class Text extends Base<String> { @Override String get() { return "x"; } }
```

The compiler emits a synthetic bridge compatible with the erased parent
descriptor and delegates to the covariant implementation. Reflection/framework
code must handle bridge methods deliberately.

## Construction Trap

Calling an override from a superclass constructor dispatches to the child before
child initialization. It can read default values, escape `this`, start threads or
invoke dependencies before invariants hold. Use final/private construction helpers
and publish the object only after construction.

## JIT Perspective

`invokevirtual`/`invokeinterface` do not imply permanent expensive dispatch. Type
profiles let the JIT inline monomorphic or guarded call sites; new receiver types
can invalidate assumptions and trigger deoptimization.

## Tricky Interview Questions

1. Can an override throw `Exception` when the parent throws `IOException`? No.
2. Can a child hide a static method with an instance method? No compatible declaration is allowed.
3. Does field access use runtime object type? No.
4. Why might reflection show two child `get` methods? One is a synthetic bridge.
5. Which wins: superclass concrete method or interface default? The class method.
6. Does a private same-named child method override? No.

## Official References

- [JLS overriding and hiding](https://docs.oracle.com/javase/specs/jls/se25/html/jls-8.html#jls-8.4.8)
- [JLS interface method inheritance](https://docs.oracle.com/javase/specs/jls/se25/html/jls-9.html#jls-9.4.1)

## Recommended Next

Continue with [Comparable And Comparator](./JAVA-COMPARABLE-COMPARATOR-DEEP-DIVE.md).
