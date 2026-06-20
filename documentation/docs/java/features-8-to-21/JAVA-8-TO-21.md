---
title: Java 8 To 21 Overview
sidebar_position: 1
---

# Java 8 To 21 Overview

This page is the umbrella for important Java language and runtime features
used in modern backend development.

## Feature Map

| Feature | Version | Why it matters |
|---|---:|---|
| Lambdas | 8 | concise behavior passing |
| Streams | 8 | functional-style collection processing |
| Optional | 8 | explicit absence in return values |
| `java.time` | 8 | modern date/time API |
| CompletableFuture | 8 | async composition |
| Collection factories | 9 | concise immutable collections |
| `var` | 10 | local type inference |
| HTTP Client | 11 | standard Java HTTP client |
| Switch expressions | 14 | safer value-returning switch |
| Text blocks | 15 | readable multiline strings |
| Records | 16 | compact immutable data carriers |
| Sealed classes | 17 | controlled inheritance |
| Pattern matching | 16+ | safer type checks and switch |
| Virtual threads | 21 | cheap thread-per-task blocking I/O |
| Sequenced collections | 21 | standard first/last/reversed APIs |

## Dedicated Pages

- [Optional](JAVA-OPTIONAL.md)
- [var](JAVA-VAR.md)
- [Switch](JAVA-SWITCH.md)
- [Records](JAVA-RECORDS.md)
- [Sealed Classes](JAVA-SEALED-CLASSES.md)
- [Virtual Threads](JAVA-VIRTUAL-THREADS.md)

## Practical Rule

Use new Java features when they make intent clearer or remove boilerplate.
Avoid using them only to look modern.

Good candidates in backend code:

- records for request/response DTOs;
- switch expressions for status mapping;
- sealed interfaces for fixed domain result types;
- virtual threads for high-concurrency blocking I/O;
- Optional for repository/service return values where absence is expected.

