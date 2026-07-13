---
title: Java Language Resolution, Initialization And OOP Internals
description: Senior treatment of overload resolution, overriding, initialization, dispatch, construction, and compatibility.
status: "maintained"
last_reviewed: "2026-07-13"
---

# Java Language Resolution, Initialization And OOP Internals

## Compile-Time Selection Versus Runtime Dispatch

Overloading is selected from declared types at compile time. Overriding dispatch
selects an instance implementation at runtime. Fields and static methods do not
participate in virtual overriding.

```java
class Parent { String call(Number n) { return "P:Number"; } }
class Child extends Parent {
    @Override String call(Number n) { return "C:Number"; }
    String call(Integer n) { return "C:Integer"; }
}
Parent value = new Child();
value.call(1); // compiler sees Parent.call(Number); runtime dispatches Child.call(Number)
```

Candidate discovery, applicability phases and most-specific selection matter.
The compiler first considers strict invocation (including primitive widening),
then loose invocation (boxing/unboxing plus permitted widening), then variable
arity. A later phase cannot defeat an applicable earlier-phase method.

```java
static void choose(long x) {}
static void choose(Integer x) {}
static void choose(int... x) {}
choose(1); // long: widening is applicable before boxing or varargs phases
```

`null` selects the most-specific compatible reference parameter, but unrelated
types produce ambiguity. Generic inference and lambdas can make applicability
dependent on the target type; do not reduce modern overload resolution to a
memorized five-item list.

## Promotion And Evaluation

Unary and binary numeric promotion convert `byte`, `short` and `char` operands
to `int` for most arithmetic. Compound assignment includes an implicit narrowing
conversion; the apparently equivalent expanded assignment may not compile.

```java
short s = 1;
s += 1;          // implicit cast after arithmetic
// s = s + 1;    // expression is int
```

Evaluation is left-to-right, but side-effect-heavy expressions remain hostile
to review. Overflow is defined wraparound for integer primitives; it is not an
exception. Use exact arithmetic methods where overflow violates the domain.

## Initialization State Machine

Class initialization occurs at first active use and is synchronized by the JVM.
Before `<clinit>` runs, preparation assigns default static values. Initialization
executes superclass initialization first, then textual static field/block order.
Failure wraps the initiating error and leaves the class erroneous; later active
uses typically fail with `NoClassDefFoundError`.

Object construction proceeds through allocation/default field values, superclass
construction, instance field initializers/blocks in textual order, then the
constructor body. Dynamic dispatch is already active during superclass
construction, so invoking an overridable method can observe uninitialized child
state.

```java
class Base {
    Base() { describe(); }
    void describe() {}
}
class Derived extends Base {
    private String name = "ready";
    @Override void describe() { System.out.println(name); } // prints null during Base()
}
```

Publishing `this` from a constructor also defeats safe construction: another
thread can observe incomplete state. Prefer factories that construct fully,
then register or publish.

## Override Contracts

An override may widen access, return a covariant subtype and narrow/remove a
checked exception. It cannot add a broader checked exception. Runtime exceptions
are unrestricted by that declaration rule. Bridge methods preserve polymorphism
after erasure for generic overrides; `javap -v` reveals their synthetic bytecode.

## Lead Review Checklist

- Separate overload selection from override dispatch in explanations.
- Reject overload families where `null`, boxing or lambda target typing creates ambiguity.
- Never call overridable behavior from constructors without a proven invariant.
- Treat static initialization as a failure and deadlock boundary.
- Classify public changes by source, binary and behavioral compatibility.
- Inspect generated bridge/synthetic methods when reflection or frameworks depend on method shape.

## Lab

Compile overload variants with `javac -Xlint:all`, inspect descriptors and bridge
methods using `javap -c -v`, and write tests proving initialization order and
erroneous-class behavior.

## Senior Interview Questions

<ExpandableAnswer title="Why can adding an overload break source compatibility without breaking existing bytecode?">

Recompilation may select a new most-specific method; old bytecode retains its descriptor.

</ExpandableAnswer>

<ExpandableAnswer title="Can a static method be overridden?">

No; selection is hiding based on the reference/class expression.

</ExpandableAnswer>

<ExpandableAnswer title="Why is construction-time virtual dispatch dangerous?">

The child method runs before child initialization completes.

</ExpandableAnswer>

<ExpandableAnswer title="Does an unchecked exception belong to a method signature?">

No; the `throws` declaration is not used to distinguish overloads.

</ExpandableAnswer>


## Official References

- [JLS conversions](https://docs.oracle.com/javase/specs/jls/se25/html/jls-5.html)
- [JLS method invocation](https://docs.oracle.com/javase/specs/jls/se25/html/jls-15.html#jls-15.12)
- [JLS initialization](https://docs.oracle.com/javase/specs/jls/se25/html/jls-12.html)

## Recommended Next

Continue with [Generics And Erasure Internals](./JAVA-GENERICS-ERASURE-INTERNALS.md).
