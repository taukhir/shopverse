---
title: Java Fundamentals Through Runtime Scenarios
description: Primitive promotion, references, pass-by-value, wrappers, initialization and failure scenarios with expected results.
---

# Java Fundamentals Through Runtime Scenarios

## Primitive Promotion

```java
byte left = 10, right = 20;
// byte sum = left + right; // compile error: binary promotion produces int
int sum = left + right;
```

The operands are promoted before addition. Assignment context does not narrow a
non-constant expression automatically.

```java
final int constant = 100;
byte allowed = constant;       // representable constant expression
int runtime = 100;
// byte rejected = runtime;    // not a constant variable expression
```

```java
short value = 1;
value += 1;       // equivalent to (short)(value + 1), including possible loss
// value = value + 1; // expression is int
```

```java
int maximum = Integer.MAX_VALUE;
System.out.println(maximum + 1);              // -2147483648
System.out.println(Math.addExact(maximum, 1)); // ArithmeticException
```

Integer overflow wraps; exact arithmetic is required when overflow violates a
domain invariant.

## Boxing And Wrapper Identity

```java
Integer a = 127, b = 127;
Integer c = 128, d = 128;
System.out.println(a == b);       // commonly true: required cache range includes this value
System.out.println(c == d);       // do not rely on identity; commonly false
System.out.println(c.equals(d));  // true
```

```java
Integer missing = null;
// int value = missing; // NullPointerException during unboxing
```

Wrappers are values; identity is not a business contract. Null unboxing can hide
inside arithmetic, comparisons, overload calls and ternary expressions.

## Pass-By-Value Scenarios

```java
static void update(int number, StringBuilder text) {
    number = 99;                 // local primitive copy
    text.append("!");           // shared object reached through copied reference
    text = new StringBuilder();  // local reference copy is reassigned
}
```

The caller's primitive and reference variables are unchanged; the shared builder
is mutated. Arrays and collections behave the same way: the reference value is
copied, not the caller's variable.

```java
static void replace(List<String> values) { values = List.of("new"); }
static void mutate(List<String> values) { values.add("new"); }
```

## Aliasing And Defensive Copying

```java
var mutable = new ArrayList<>(List.of("A"));
var alias = mutable;
alias.add("B");                 // both variables observe one object
var snapshot = List.copyOf(mutable);
mutable.add("C");               // snapshot remains [A, B]
```

`Collections.unmodifiableList(mutable)` would be a read-only live view and would
observe `C`. Immutability and unmodifiable access are different contracts.

## Initialization Scenarios

Initialization order is superclass static state, subclass static state, allocation
with default instance values, superclass instance initialization/constructor,
then subclass instance initialization/constructor.

```java
class Base {
    Base() { print(); }
    void print() { }
}
class Child extends Base {
    private String state = "ready";
    @Override void print() { System.out.println(state); } // null during Base()
}
```

Dynamic dispatch is active during construction, but child state is not initialized.
Calling overridable behavior or publishing `this` from constructors is unsafe.

```java
class Broken {
    static { if (true) throw new IllegalStateException("configuration"); }
}
```

The initiating active use receives `ExceptionInInitializerError`; later uses can
receive `NoClassDefFoundError` because the class remains erroneous for that loader.

## Static Reachability

```java
static final Map<String, byte[]> CACHE = new ConcurrentHashMap<>();
```

Values remain strongly reachable while the loaded class and entries remain.
Clearing entries permits collection; class unloading additionally requires the
defining loader to become unreachable. Static does not mean “stored outside heap.”

## Tricky Interview Questions

1. Why does `byte + byte` become `int`? Binary numeric promotion.
2. Does Java pass an object by reference? No; it copies a reference value.
3. Why can `Integer == Integer` appear inconsistent? Cache/identity versus value equality.
4. Can a static initializer be retried in the same class loader? Not through normal active use after failure.
5. Does a final collection become immutable? Only the reference cannot be reassigned.

## Official References

- [JLS conversions](https://docs.oracle.com/javase/specs/jls/se25/html/jls-5.html)
- [JLS initialization](https://docs.oracle.com/javase/specs/jls/se25/html/jls-12.html)

## Recommended Next

Continue with [Overload Resolution](./JAVA-OVERLOADING-RESOLUTION-DEEP-DIVE.md).
