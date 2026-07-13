---
title: Java Control Flow, Expression And Error Keywords
description: Branching, loops, switch, exceptions, assertions, object creation, type tests, and return semantics.
difficulty: Intermediate
page_type: Reference
status: Generic
technologies: [Java 25, JLS]
last_reviewed: "2026-07-13"
---

# Java Control Flow, Expression And Error Keywords

## Control Families

| Family | Keywords/contextual words | Review question |
|---|---|---|
| selection | `if`, `else`, `switch`, `case`, `default`, `when`, `yield` | is the decision exhaustive and side-effect controlled? |
| iteration | `for`, `while`, `do` | can progress, termination and work bounds be proven? |
| transfer | `break`, `continue`, `return` | which enclosing construct completes? |
| failure | `try`, `catch`, `finally`, `throw`, `throws`, `assert` | who owns recovery and cleanup? |
| expressions | `new`, `this`, `super`, `instanceof` | which object/type and initialization phase is involved? |

```java
return switch (result) {
    case PaymentAccepted accepted -> confirm(accepted.providerReference());
    case PaymentDeclined declined when declined.retryable() -> scheduleRetry();
    case PaymentDeclined declined -> reject(declined.reasonCode());
};
```

`yield` produces a value from a colon-style switch-expression block; it is not the same
as thread scheduling. `assert` expresses a disableable internal assumption and must not
validate requests, authorization, payments, or required side effects.

## Exception Vocabulary

`throw` transfers control with one exception instance. `throws` declares possible
checked exceptions on a method or constructor. `finally` normally runs during abrupt
completion, but process termination or VM failure can prevent it; use try-with-resources
for owned `AutoCloseable` resources.

## Type And Construction Expressions

`new` allocates/constructs an object or array. `this` refers to the current instance or
delegates to another constructor. `super` selects superclass members or construction.
`instanceof` returns false for `null` and supports pattern variables.

## Official References

- [JLS Chapter 14: Statements](https://docs.oracle.com/javase/specs/jls/se25/html/jls-14.html)
- [JLS Chapter 15: Expressions](https://docs.oracle.com/javase/specs/jls/se25/html/jls-15.html)

## Recommended Next

Continue with [Operators And Control Flow](../JAVA-OPERATORS-CONTROL-FLOW.md).
