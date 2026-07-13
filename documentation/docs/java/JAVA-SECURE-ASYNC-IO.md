---
title: Secure XML, Regex, Paths And Asynchronous I/O
description: XXE, ReDoS, path traversal, asynchronous file channels, cancellation, buffer ownership, and safe boundary design.
status: "maintained"
last_reviewed: "2026-07-13"
---

# Secure XML, Regex, Paths And Asynchronous I/O

## XML And XXE

XML parsers must disable external entities and DTD processing unless a tightly
controlled protocol explicitly requires them. Defaults and feature names vary by
factory/provider, so configure, test malicious fixtures, limit input and avoid
silently ignoring unsupported security features.

```java
DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
factory.setXIncludeAware(false);
factory.setExpandEntityReferences(false);
```

## Regex Denial Of Service

Nested ambiguous quantifiers can cause catastrophic backtracking on crafted
input. Bound input length, prefer linear/unambiguous expressions, use possessive
quantifiers/atomic groups where correct, and isolate or time-bound untrusted
matching. A regex timeout implemented by abandoning a thread may not stop engine
work; design the pattern safely first.

## Path Authorization

Resolve user input under an allowed root, normalize, and account for symbolic
links and time-of-check/time-of-use races. A string prefix is not authorization.
Use least-privilege filesystem permissions and open/create options that match
overwrite and link policy.

## AsynchronousFileChannel

Asynchronous file operations complete through `Future` or `CompletionHandler`.
The caller must keep buffers valid until completion and handle partial results,
failure, cancellation and channel shutdown. Completion does not imply durable
storage; `force` and filesystem guarantees are separate concerns.

```java
try (AsynchronousFileChannel channel = AsynchronousFileChannel.open(path, READ)) {
    ByteBuffer buffer = ByteBuffer.allocate(8192);
    int read = channel.read(buffer, 0).get(1, TimeUnit.SECONDS);
    if (read >= 0) buffer.flip();
}
```

## Tricky Interview Questions

<ExpandableAnswer title="Is disabling only general entities enough for XXE?">

No; DTDs, parameter entities, XInclude and provider behavior matter.

</ExpandableAnswer>

<ExpandableAnswer title="Does normalize() defeat symlink traversal?">

No.

</ExpandableAnswer>

<ExpandableAnswer title="Can a buffer be reused immediately after scheduling an async read?">

No; ownership lasts until completion.

</ExpandableAnswer>

<ExpandableAnswer title="Does future cancellation guarantee an OS operation was cancelled?">

No; consult implementation/API semantics and design idempotently.

</ExpandableAnswer>

<ExpandableAnswer title="Does a completed file write guarantee persistence after power loss?">

No.

</ExpandableAnswer>


## Official References

- [`AsynchronousFileChannel`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/nio/channels/AsynchronousFileChannel.html)
- [Java XML processing limits](https://docs.oracle.com/en/java/javase/25/security/java-api-xml-processing-jaxp-security-guide.html)
- [`Path`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/nio/file/Path.html)

## Recommended Next

Continue with [I/O And Resource Ownership](./JAVA-NIO-IO-RESOURCE-OWNERSHIP.md).
