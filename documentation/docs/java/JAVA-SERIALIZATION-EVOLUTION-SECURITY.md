---
title: Java Serialization Versioning, Security And Safe Evolution
description: serialVersionUID behavior, compatible evolution, filters, gadget risks, serialization proxies, validation, and migration alternatives.
status: "maintained"
last_reviewed: "2026-07-13"
---

# Java Serialization Versioning, Security And Safe Evolution

## What `serialVersionUID` Does

The stream class descriptor records a serial version UID. During
deserialization, native serialization compares it with the UID of the resolved
local class. A mismatch normally throws `InvalidClassException` before normal
state restoration.

```java
@java.io.Serial
private static final long serialVersionUID = 3L;
```

If a class does not declare it, the runtime computes a default UID from parts
of the class signature. Seemingly harmless refactoring can change that value,
so serializable classes should declare an intentional UID.

The UID is only a compatibility gate. Keeping it unchanged does not magically
convert incompatible field types or validate business meaning. Changing it is
an intentional hard break: previously stored instances using another UID can
no longer be read by that class without migration or a compatibility reader.

## Evolution Matrix

| Change while UID stays equal | Typical default behavior | Design concern |
|---|---|---|
| add a field | old streams give the field its Java default | default may violate invariants |
| remove a field | extra old stream data is ignored | information is permanently lost on rewrite |
| rename a field | behaves like remove plus add | needs custom mapping/migration |
| change compatible hierarchy details | depends on serialization rules | test real old payloads |
| change a field to an incompatible type | usually incompatible | migrate explicitly |
| change UID | `InvalidClassException` for old UID | deliberate protocol break |

Keep golden payloads from supported versions and test both reading and
round-tripping. Never use Java-native payloads as a long-lived database schema
without an explicit migration strategy.

## Deserialization Is Code-Reachable Input

Deserialization constructs an object graph and can invoke hooks such as
`readObject`, `readResolve`, collection behavior, and code in reachable gadget
classes. An allowlisted root type alone is insufficient if arbitrary nested
types can enter the graph.

Apply `ObjectInputFilter` limits for allowed classes, graph depth, references,
array length, and byte count. Prefer a process-wide filter policy plus a
stream-specific allowlist, and reject by default.

```java
ObjectInputFilter filter = ObjectInputFilter.Config.createFilter(
        "maxdepth=20;maxrefs=10000;maxbytes=1048576;" +
        "com.shopverse.snapshot.*;java.base/*;!*"
);

try (var in = new ObjectInputStream(source)) {
    in.setObjectInputFilter(filter);
    CartSnapshot snapshot = (CartSnapshot) in.readObject();
    validate(snapshot);
}
```

Filters reduce exposure but do not make untrusted native serialization a good
public protocol. Authenticate and integrity-protect trusted payloads where
tampering matters, enforce size limits before allocation, and validate domain
invariants after reconstruction.

## Serialization Proxy Pattern

For carefully controlled native serialization, a proxy can expose a small,
stable logical representation rather than private object layout.

```java
@java.io.Serial
private Object writeReplace() {
    return new Proxy(cartId, java.util.List.copyOf(productIds));
}

@java.io.Serial
private void readObject(ObjectInputStream ignored) throws InvalidObjectException {
    throw new InvalidObjectException("Proxy required");
}

private record Proxy(String cartId, java.util.List<String> productIds)
        implements java.io.Serializable {
    @java.io.Serial private static final long serialVersionUID = 1L;
    @java.io.Serial private Object readResolve() {
        return new CartSnapshot(cartId, productIds);
    }
}
```

The proxy funnels reconstruction through validated constructors and decouples
the wire representation from internal fields.

## Operational Checklist

- inventory every native serialization entry point and stored payload;
- reject untrusted input and apply JEP 290 filters to unavoidable trusted use;
- pin explicit UIDs and document the supported version window;
- set depth, reference, array, and byte limits;
- validate invariants and authorization after parsing;
- avoid serializing credentials, tokens, JPA entities, lazy proxies, open
  resources, threads, executors, or environment-specific handles;
- include compatibility tests in CI;
- prefer schema-governed DTO formats for new distributed contracts.

## Tricky Interview Questions

<ExpandableAnswer title="Does changing UID migrate old data?">

No; it normally rejects it.

</ExpandableAnswer>

<ExpandableAnswer title="Is an unchanged UID proof of compatibility?">

No.

</ExpandableAnswer>

<ExpandableAnswer title="Is marking a secret transient sufficient security?">

No; protect the entire graph and trust boundary.

</ExpandableAnswer>

<ExpandableAnswer title="Can a filter allow only the root class safely?">

Not if nested graph types remain unrestricted.

</ExpandableAnswer>

<ExpandableAnswer title="Why use a serialization proxy?">

To preserve invariants and detach logical wire state from private layout.

</ExpandableAnswer>


## Official References

- [Versioning of serializable objects](https://docs.oracle.com/en/java/javase/25/docs/specs/serialization/version.html)
- [`ObjectInputFilter` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/io/ObjectInputFilter.html)
- [JEP 290: Filter Incoming Serialization Data](https://openjdk.org/jeps/290)
- [Secure Coding Guidelines for Java](https://www.oracle.com/java/technologies/javase/seccodeguide.html)

## Recommended Next

Compare native serialization with the format choices in
[Serialization Formats And APIs](./JAVA-SERIALIZATION.md), then apply the rules
in a compatibility test using stored payload fixtures.
