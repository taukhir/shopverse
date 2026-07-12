---
title: Java I/O, NIO And Resource Ownership
description: Streams, buffers, channels, selectors, direct memory, files, sockets, HTTP, cancellation, and architectural ownership.
---

# Java I/O, NIO And Resource Ownership

Byte streams transport bytes; readers/writers decode/encode characters. Buffering
reduces syscall frequency but adds memory and flush semantics. Always specify a
charset at boundaries and close the owner—not every borrowed wrapper—according
to an explicit lifecycle.

NIO buffers track capacity, position and limit. `flip` changes a filled buffer to
read mode; `compact` preserves unread bytes before more input. Channels may make
partial progress, so correct code loops until the protocol condition is met.

```java
while (buffer.hasRemaining()) channel.write(buffer);
```

Heap buffers are GC-managed arrays. Direct buffers can reduce copying for native
I/O but consume native/process memory and have cleaner-driven lifetime; pool and
bound them. Scatter/gather operates over buffer arrays. `FileChannel.transferTo`
can enable zero-copy paths subject to OS/JDK behavior. Memory-mapped files trade
syscalls for page-cache/address-space behavior and require careful truncation,
unmapping and crash-consistency design.

Selectors multiplex readiness for many non-blocking channels. Readiness is not
completion: process selected keys, handle partial operations, clear interest
correctly, cancel/close keys, and wake the selector during shutdown. Asynchronous
channels use completion callbacks/futures. Virtual threads make blocking socket
code scalable and simpler for many request protocols; selectors remain valuable
when explicit event-loop control and minimal per-connection task state matter.

Files need path normalization and authorization against an allowed root; symbolic
links and race conditions can defeat string-prefix checks. File locks are OS/filesystem
coordination, not a distributed consensus mechanism. HTTP calls require connect,
request and overall deadlines plus cancellation and bounded bodies.

## Tricky Interview Questions

1. Why can a channel operation return before a buffer is consumed? Partial progress is legal.
2. Do virtual threads eliminate selector use cases? No; event-loop control and streaming state can still justify selectors.
3. Who owns a wrapped stream? The API contract must define which layer closes the underlying resource.

## Official References

- [NIO package](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/nio/package-summary.html)
- [Channels](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/nio/channels/package-summary.html)
- [HTTP Client](https://docs.oracle.com/en/java/javase/25/docs/api/java.net.http/java/net/http/HttpClient.html)

## Recommended Next

Continue with [Dynamic Java And Modules](./JAVA-DYNAMIC-JPMS-PACKAGING.md).
