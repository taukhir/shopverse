---
title: Java State, Concurrency And Lifecycle Keywords
description: final, volatile, synchronized, transient, native and strictfp semantics with production examples.
difficulty: Advanced
page_type: Reference
status: Generic
technologies: [Java 25, JMM, Serialization]
last_reviewed: "2026-07-13"
---

# Java State, Concurrency And Lifecycle Keywords

## `final`

`final` prevents variable reassignment, method overriding, or class extension depending
on location. A final reference does not make the referenced object immutable. Final
fields also participate in Java Memory Model initialization guarantees when an object
does not escape during construction.

```java
final class ReservationPolicy {
    private final List<String> blockedSkus;

    ReservationPolicy(List<String> blockedSkus) {
        this.blockedSkus = List.copyOf(blockedSkus);
    }
}
```

## `volatile`

A volatile read observes a compatible preceding volatile write and prevents certain
reorderings. It does not make compound operations such as `count++` atomic.

```java
private volatile boolean acceptingOrders = true;

void stopAdmission() { acceptingOrders = false; }
boolean mayAccept() { return acceptingOrders; }
```

Use atomics, locks, or ownership when several fields form one invariant.

## `synchronized`

Synchronized code acquires an object monitor, provides mutual exclusion, and creates
happens-before ordering between unlock and a later lock of the same monitor. Instance
and static synchronized methods lock different objects.

```java
synchronized boolean claim(String workerId) {
    if (owner != null) return false;
    owner = workerId;
    return true;
}
```

This protects only threads sharing that JVM object; it is not a distributed lock.

## `transient`

`transient` excludes an instance field from default native Java serialization. It does
not redact logs, JSON, database state, heap dumps, reflection, or secrets.

## `native` And `strictfp`

`native` declares implementation outside Java and crosses a safety boundary. Prefer
supported FFM APIs for new native integration where feasible. Since Java 17, floating-
point evaluation is always strict, so `strictfp` is retained mainly for compatibility.

## Decision Table

| Need | Tool |
|---|---|
| one immutable reference after construction | `final` plus defensive copying |
| visibility of one independent flag/value | `volatile` |
| atomic compound invariant in one JVM | `synchronized`, lock, or atomic design |
| omit field from native serialization | `transient` plus explicit security controls |

## Official References

- [JLS 8.3.1.4: volatile fields](https://docs.oracle.com/javase/specs/jls/se25/html/jls-8.html#jls-8.3.1.4)
- [JLS 17.4: Memory Model](https://docs.oracle.com/javase/specs/jls/se25/html/jls-17.html#jls-17.4)

## Recommended Next

Continue with [Control And Error Keywords](./JAVA-CONTROL-ERROR-KEYWORDS.md).
