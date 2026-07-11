---
title: Java Keywords
sidebar_position: 2
difficulty: Beginner to Advanced
page_type: Reference and Interview Guide
status: Generic
learning_objectives: [Recognize every Java keyword, Choose modifiers correctly, Explain volatile transient final and synchronized in interviews]
technologies: [Java, JVM, Java Memory Model, Serialization]
last_reviewed: "2026-07-11"
---

# Java Keywords

Java keywords are words with a language-defined meaning. Reserved keywords
cannot be used as identifiers. Contextual keywords act as keywords only in
specific grammar positions. `true`, `false`, and `null` are literals, not
keywords.

> **Interview shortcut:** do not try to memorize only a number. Know the
> categories, the common modifiers, and the difference between reserved and
> contextual keywords. The current list is defined by the
> [Java Language Specification, section 3.9](https://docs.oracle.com/en/java/javase/26/docs/specs/jls/jls-3.html#jls-3.9).

## Reserved keywords

| Category | Keywords | Where they are used |
|---|---|---|
| Primitive types and no-value type | `boolean`, `byte`, `char`, `short`, `int`, `long`, `float`, `double`, `void` | Fields, parameters, local variables, return types, casts |
| Type declarations | `class`, `interface`, `enum`, `extends`, `implements` | Classes, interfaces, enums, inheritance and contracts |
| Access control | `public`, `protected`, `private` | Types, fields, constructors and methods where permitted |
| Other modifiers | `abstract`, `final`, `static`, `strictfp`, `native`, `synchronized`, `transient`, `volatile`, `default` | Type/member behavior; legal location depends on the modifier |
| Object and type operations | `new`, `this`, `super`, `instanceof` | Object creation, current/super references and runtime type tests |
| Branching and loops | `if`, `else`, `switch`, `case`, `for`, `while`, `do`, `break`, `continue`, `return` | Control flow inside methods, constructors and initializers |
| Exceptions and assertions | `try`, `catch`, `finally`, `throw`, `throws`, `assert` | Error handling, method contracts and development-time checks |
| Packages and imports | `package`, `import` | Compilation-unit declarations |
| Reserved but unused | `const`, `goto` | Cannot be identifiers; Java provides no implementation for them |
| Special reserved identifier | `_` | Reserved since Java 9; a single underscore cannot be an identifier |

## Contextual keywords

These words remain usable as identifiers outside the context in which the
grammar treats them specially.

| Keywords | Main context |
|---|---|
| `module`, `open`, `requires`, `transitive`, `exports`, `opens`, `to`, `uses`, `provides`, `with` | Java Platform Module System declarations |
| `var` | Local-variable and lambda-parameter type inference |
| `record` | Record declarations |
| `sealed`, `non-sealed`, `permits` | Restricted class and interface hierarchies |
| `yield` | Producing a value from a switch expression block |
| `when` | Guarding a pattern in a switch label |

## Important keyword comparison

| Keyword | Applies to | Primary guarantee | Does **not** guarantee |
|---|---|---|---|
| `volatile` | Instance/static fields | Visibility and ordering of reads/writes; a write happens-before a later read of the same field | Atomicity of compound operations such as `count++` |
| `transient` | Instance fields | Default Java serialization skips the field | Security, encryption, or exclusion from JSON/JPA by itself |
| `final` | Variables, fields, methods, classes, parameters | One assignment for a variable; no override for a method; no subclass for a class | Deep immutability of the referenced object |
| `synchronized` | Instance/static methods and statement blocks | Mutual exclusion plus happens-before visibility through the same monitor | Fairness, deadlock prevention, or cross-process locking |

## `volatile`

### Meaning

A `volatile` field is shared using Java Memory Model visibility rules. A write
to a volatile field happens-before every subsequent read of that same field.
This prevents threads from indefinitely using a stale cached value and limits
reordering around the access.

```java
final class Worker implements Runnable {
    private volatile boolean running = true;

    public void stop() {
        running = false;
    }

    @Override
    public void run() {
        while (running) {
            processNextItem();
        }
    }
}
```

### Where to use it

- A stop, shutdown, initialized, or configuration-refresh flag read by many
  threads and written independently.
- Publishing a newly created immutable snapshot to readers.
- A state variable where every update is a single independent read or write.
- Double-checked locking, where the singleton reference must be volatile.

```java
private static volatile Service instance;

static Service instance() {
    Service result = instance;
    if (result == null) {
        synchronized (Service.class) {
            result = instance;
            if (result == null) {
                instance = result = new Service();
            }
        }
    }
    return result;
}
```

### Where not to use it

```java
private volatile int count;

void increment() {
    count++; // read + add + write: the whole operation is not atomic
}
```

Use `AtomicInteger.incrementAndGet()`, `LongAdder`, or locking when an invariant
or compound update must be atomic. Volatile is not a replacement for a lock.

## `transient`

### Meaning

The default `ObjectOutputStream` serialization mechanism does not write a
`transient` instance field. After normal deserialization it receives its Java
default value unless custom `readObject` logic restores it. Static fields are
class state and are not serialized as part of an object, whether or not they
are marked transient.

```java
final class UserSession implements java.io.Serializable {
    private static final long serialVersionUID = 1L;

    private final String username;
    private transient String accessToken;
    private transient java.util.Map<String, Object> cache;
}
```

### Where to use it

- Derived or cached values that can be rebuilt.
- Runtime-only collaborators that should not be persisted.
- Sensitive values that must not enter a Java-serialized representation.
- Fields whose type is not serializable but is unnecessary after restoration.

Do not treat `transient` as a general privacy annotation. Jackson, Gson, JPA,
database mappers, logs, and reflection-based tools follow their own rules.
Use each framework's exclusion annotation and never rely on Java serialization
as encryption.

## `final`

### Meaning by location

| Location | Effect | Typical use |
|---|---|---|
| Local variable or parameter | Can be assigned once | Communicate intent; support captured variables (which may also be effectively final) |
| Instance field | Must be assigned once by declaration, initializer, or every constructor path | Required object state and immutable value objects |
| `static final` field | One class-level reference/value | Constants and immutable shared objects |
| Method | Cannot be overridden | Preserve an invariant or fixed algorithm step |
| Class | Cannot be extended | Immutable value types, utility classes, security-sensitive invariants |

```java
public final class Money {
    private final java.math.BigDecimal amount;
    private final String currency;

    public Money(java.math.BigDecimal amount, String currency) {
        this.amount = amount;
        this.currency = currency;
    }
}
```

`final List<String> names` means the reference cannot point to another list;
the list may still be mutated. Use an immutable/defensive copy such as
`List.copyOf(names)` for deeper immutability. Correctly constructed final fields
also receive special safe-publication guarantees under the Java Memory Model;
do not let `this` escape from the constructor.

## `synchronized`

### Meaning and monitor choice

Every Java object can act as a monitor lock. Only one thread at a time can hold
a particular monitor. Exiting a synchronized region releases the monitor, and
that unlock happens-before a later lock of the same monitor.

| Form | Monitor acquired |
|---|---|
| `synchronized` instance method | `this` |
| `static synchronized` method | The declaring class's `Class` object |
| `synchronized (lock) { ... }` | The evaluated `lock` object |

```java
final class InventoryCounter {
    private final Object lock = new Object();
    private int available;

    void reserve(int quantity) {
        synchronized (lock) {
            if (quantity > available) {
                throw new IllegalStateException("Insufficient stock");
            }
            available -= quantity;
        }
    }

    int available() {
        synchronized (lock) {
            return available;
        }
    }
}
```

### Where to use it

- Protect multiple fields that form one invariant.
- Make a check-then-act sequence atomic.
- Coordinate a small critical section with simple exclusive locking.
- Call `wait`, `notify`, or `notifyAll` while owning that same object's monitor.

Prefer a private lock object when callers should not share the locking policy.
Keep critical sections small, avoid blocking network/database calls while
holding a monitor, and acquire multiple locks in a consistent order. Use
`ReentrantLock` for timed/interruptible acquisition or multiple conditions, and
concurrent collections or atomic classes for their specialized use cases.

## Important interview questions

### 1. Is `volatile` atomic?

An individual volatile read or write is atomic and visible under the memory
model, but a compound action is not. `count++` can lose updates because multiple
threads can read the same old value before either writes the result.

### 2. What is the difference between `volatile` and `synchronized`?

Volatile provides visibility and ordering for one field without mutual
exclusion. Synchronized provides mutual exclusion and visibility for all state
protected by the same monitor. Choose volatile only when operations do not need
to be grouped into one atomic invariant.

### 3. Can `volatile` be used on a local variable?

No. It applies only to fields because local variables are confined to a method
invocation and are not shared fields in the Java Memory Model.

### 4. Why is volatile required in double-checked locking?

It safely publishes the constructed object and prevents another thread from
observing a reference whose initialization effects are not yet visible.

### 5. Does `transient` make a field secure?

No. It only affects default Java object serialization. The value can still be
logged, reflected, persisted by another framework, or exposed elsewhere.

### 6. What value does a transient field have after deserialization?

Normally its type default: `null`, `0`, or `false`. Field initializers and
constructors are not a substitute for custom deserialization of a Serializable
object; use `readObject` when reconstruction is required.

### 7. Can `final` and `transient` be used together?

Yes, but restoring a transient final instance field through ordinary custom
deserialization is awkward because final fields are meant to be assigned during
construction. Prefer a serialization proxy or recompute the value on demand.

### 8. What is the difference between `final`, `finally`, and `finalize`?

- `final` is a keyword used for variables, methods, and classes.
- `finally` is a keyword for cleanup after `try`/`catch` execution.
- `finalize()` is a deprecated-for-removal Object method and should not be used
  for resource management; use try-with-resources or cleaners where appropriate.

### 9. Does a final reference make an object immutable?

No. It prevents reassignment of the reference. The referenced object can remain
mutable unless its API and implementation prevent mutation.

### 10. Can constructors, static methods, or abstract methods be final?

Constructors cannot be final because they are not inherited. Static methods are
hidden rather than overridden, so declaring one final only prevents hiding it.
An abstract method cannot be final because abstract requires an implementation
by overriding while final forbids overriding.

### 11. Is `synchronized` reentrant?

Yes. A thread holding a monitor can acquire the same monitor again, which lets
one synchronized method call another synchronized method on the same object.

### 12. Are static and instance synchronized methods mutually exclusive?

Not automatically. They lock different monitors: the class object versus the
instance. They exclude each other only if both explicitly use the same lock.

### 13. Does synchronized guarantee fairness or prevent deadlocks?

No. It does not promise the longest-waiting thread gets the lock, and circular
lock acquisition can deadlock. Use disciplined lock ordering and minimize
nested locking.

### 14. Can synchronized lock across multiple application instances?

No. A monitor exists inside one JVM. Distributed applications need a database,
coordination service, broker design, or distributed-lock strategy appropriate
to the consistency requirement.

## Practical decision guide

| Requirement | Usually choose |
|---|---|
| Publish a simple state flag between threads | `volatile` |
| Atomically increment a shared counter | `AtomicInteger` or `LongAdder` |
| Protect a multi-field invariant | `synchronized` or `Lock` |
| Keep a runtime-only field out of Java serialization | `transient` |
| Prevent reassignment or overriding | `final` |
| Build an immutable value object | Final class/record, final state, defensive copies, no mutators |
| Exclude a field from JSON or database persistence | The JSON/ORM framework's own annotation/configuration |
| Coordinate multiple JVMs | An external consistency mechanism, not `synchronized` |

## Quick revision checklist

- Reserved keywords cannot be identifiers; contextual keywords depend on
  grammar position.
- `volatile` gives visibility and ordering, not compound-operation atomicity.
- `transient` affects default Java serialization only.
- `final` has different meanings for references, methods, and classes.
- `synchronized` locks a monitor and supplies both exclusion and visibility.
- Thread safety depends on a consistent policy: every access to protected state
  must follow the same policy.

## Specification references

- [JLS 3.9 — Keywords](https://docs.oracle.com/en/java/javase/26/docs/specs/jls/jls-3.html#jls-3.9)
- [JLS 8.3.1 — Field modifiers](https://docs.oracle.com/en/java/javase/26/docs/specs/jls/jls-8.html#jls-8.3.1)
- [JLS 14.19 — The synchronized statement](https://docs.oracle.com/en/java/javase/26/docs/specs/jls/jls-14.html#jls-14.19)
- [JLS 17.4 — Memory model](https://docs.oracle.com/en/java/javase/26/docs/specs/jls/jls-17.html#jls-17.4)
- [JLS 17.5 — Final field semantics](https://docs.oracle.com/en/java/javase/26/docs/specs/jls/jls-17.html#jls-17.5)
