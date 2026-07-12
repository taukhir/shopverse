---
title: Reflection, Proxies, Generics, And Serialization
difficulty: Advanced
page_type: Concept
status: Generic
keywords: [reflection, MethodHandle, dynamic proxy, annotation processing, type erasure, bridge method, serialization compatibility]
learning_objectives: [Compare runtime and compile-time metaprogramming, Explain erasure and bridge methods, Design explicit secure serialization contracts]
technologies: [Java]
last_reviewed: "2026-07-12"
---

# Reflection, Proxies, Generics, And Serialization

Reflection discovers and invokes runtime members with access, module, conversion,
and performance constraints. Cache stable metadata where justified and never turn
untrusted names into unrestricted invocation. Method handles are typed executable
references that the JVM can optimize more directly; `invokedynamic` links dynamic
call sites used by lambdas and language runtimes.

JDK dynamic proxies implement interfaces and route calls through an invocation
handler. Subclass proxies override non-final visible methods and cannot intercept
final/private methods or self-invocation through `this`. Identity methods,
exceptions, default methods, annotations, and proxy stacking require explicit tests.

Annotations are metadata. Runtime reflection reads retained annotations; compile-
time annotation processors generate or validate code without runtime scanning.
Processors must be deterministic, incremental-friendly, and versioned as build inputs.

## Generics Erasure

Java generics mostly erase type arguments at runtime. The compiler inserts casts
and may generate bridge methods to preserve overriding after erasure. Arrays are
reified/covariant; generics are erased/invariant. Use `? extends T` for producers
and `? super T` for consumers, while avoiding wildcard-heavy public contracts.

Type tokens capture parameterized type metadata through an anonymous subclass or
framework representation, but cannot restore information never retained.

## Object Contracts

Equality must be reflexive, symmetric, transitive, consistent, and aligned with
hash code. Mutable equality keys corrupt hash collections. Records provide value-
oriented components but do not deep-copy mutable inputs. Prefer immutable domain
values and explicit identity for entities.

## Serialization

Native Java serialization has fragile compatibility and security risk; avoid it
for untrusted or long-lived service contracts. Prefer explicit JSON/Protobuf/Avro
schemas with allowlisted types, limits, validation, and version evolution.

If native serialization is unavoidable, define `serialVersionUID`, validate
invariants during deserialization, use filters, avoid gadget-rich classpaths, and
test old/new forms. `transient` is not a complete secret-control mechanism.

Try-with-resources closes in reverse order and records later close failures as
suppressed exceptions. Preserve causal exceptions and avoid losing suppressed data.

## Recommended Next Page

[NIO, Zero-Copy, And Benchmarking](./NIO-PERFORMANCE-JMH.md)
