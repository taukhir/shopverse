---
title: Java 8 To 26 Overview
sidebar_position: 1
status: "maintained"
last_reviewed: "2026-07-13"
---

# Java 8 To 26 Overview

<DocLabels items={[
  {label: 'Version guide', tone: 'foundation'},
  {label: 'Modern backend Java', tone: 'intermediate'},
  {label: 'Production adoption', tone: 'production'},
  {label: 'Preview-aware', tone: 'preview'},
]} />

This page is the umbrella for important Java language and runtime features
used in modern backend development.

<DocCallout type="production" title="Feature status is part of the contract">
A feature appearing in a JDK does not make every form of it production-stable.
Record whether it is final, preview, or incubating, and pin the compiler flags,
runtime flags, and rollback plan before it enters a deployable code path.
</DocCallout>

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
| Scoped values | 21 preview, 25 final | safer immutable context passing than many `ThreadLocal` use cases |
| Stream gatherers | 24 | custom intermediate stream operations |
| Stable values / lazy constants | 25 preview / 26 second preview | lazily initialized immutable values behind an evolving preview API |
| Primitive pattern matching | 26 preview | richer pattern matching over primitive values |

## Java 26 And AI

Java 26 does not add a dedicated core-JDK AI framework like "Java AI API" or a
built-in LLM client. AI work in Java is usually done through libraries and
frameworks such as LangChain4j, Spring AI, ONNX Runtime, DJL, TensorFlow Java,
or HTTP clients calling hosted model APIs.

Some modern Java/JDK features are still useful for AI-enabled backend systems:

| Feature area | Why it helps AI applications |
|---|---|
| Virtual threads | handle many blocking calls to model APIs, vector databases, and downstream services with simpler request-per-task code |
| Structured concurrency | coordinate parallel calls such as retrieval, ranking, model invocation, and guardrail checks |
| Scoped values | pass request context safely across structured concurrent tasks without mutable `ThreadLocal` leakage |
| Vector API work in recent JDKs | enables SIMD-style numeric operations that can help ML/vector workloads when libraries use it |
| Foreign Function and Memory API | allows Java libraries to call native AI/ML runtimes more safely than older JNI-heavy approaches |
| HTTP Client | useful for calling hosted LLM, embedding, reranking, and moderation APIs |

So the correct statement is: Java 26 is not an AI release by itself, but modern
Java runtime features make Java more practical for building AI-integrated
backend services.

## Dedicated Pages

<TopicCards items={[
  {title: 'Java 25 and 26 language changes', href: '/java/features-8-to-26/JAVA-25-26-LANGUAGE', description: 'Separate final language features from previews and migration-sensitive changes.', icon: 'code', tags: ['Java 25', 'Java 26']},
  {title: 'Java 25 and 26 runtime changes', href: '/java/features-8-to-26/JAVA-25-26-RUNTIME', description: 'Review runtime evolution, tooling impact, and operational adoption concerns.', icon: 'gauge', tags: ['Runtime', 'Operations']},
  {title: 'Lambdas', href: '/java/features-8-to-26/JAVA-LAMBDAS', description: 'Understand target typing, capture, method references, and functional boundaries.', icon: 'brain', tags: ['Java 8', 'Functional']},
  {title: 'Optional', href: '/java/features-8-to-26/JAVA-OPTIONAL', description: 'Model expected absence without spreading wrapper types into every API shape.', icon: 'boxes', tags: ['Java 8', 'API design']},
  {title: 'Records', href: '/java/features-8-to-26/JAVA-RECORDS', description: 'Use compact data carriers while respecting shallow immutability and invariants.', icon: 'layers', tags: ['Java 16', 'Data modeling']},
  {title: 'Virtual threads', href: '/java/features-8-to-26/JAVA-VIRTUAL-THREADS', description: 'Scale blocking I/O while retaining limits around scarce downstream resources.', icon: 'network', tags: ['Java 21', 'Concurrency']},
]} />

Additional focused guides:

- [var](JAVA-VAR.md)
- [Switch](JAVA-SWITCH.md)
- [Sealed Classes](JAVA-SEALED-CLASSES.md)

## Version-By-Version Highlights

### Java 8: Functional And Asynchronous Foundations

- lambdas, method references, and functional interfaces;
- streams and collectors;
- `Optional` and the `java.time` API;
- default and static interface methods;
- `CompletableFuture` for asynchronous composition.

```java
var paidOrderIds = orders.stream()
        .filter(Order::isPaid)
        .map(Order::id)
        .toList();
```

Use streams for readable transformations, not for side-effect-heavy workflows.
Use `Optional` mainly as a return type rather than in entity fields or method
parameters.

### Java 9–11: Modules, Collections And HTTP

- JPMS modules and `module-info.java`;
- `List.of`, `Set.of`, `Map.of`, and private interface methods;
- local variable type inference with `var`;
- the standard HTTP Client;
- additions such as `String.isBlank`, `lines`, and `Files.readString`.

`var` preserves static typing. Use it when the initializer makes the type and
intent obvious; avoid it when it hides an important abstraction.

### Java 12–17: Expressions And Data-Oriented Types

- switch expressions and `yield`;
- text blocks;
- records for transparent data carriers;
- sealed classes and interfaces;
- pattern matching for `instanceof`.

```java
String label = switch (status) {
    case CREATED -> "new";
    case PAID -> "ready";
    case CANCELLED -> "closed";
};
```

Java 17 is a long-term-support release and remains a common production
baseline. Records are shallowly immutable: mutable components still require
defensive copying when the domain requires deep immutability.

### Java 18–21: Concurrency And Pattern Matching

- simple web server, UTF-8 default charset, and incremental runtime changes;
- record patterns and pattern matching for switch;
- virtual threads for scalable thread-per-task blocking I/O;
- sequenced collections;
- structured concurrency and scoped values through their preview evolution.

Virtual threads improve concurrency, not CPU speed. Database connection pools,
downstream rate limits, and bounded resources still require explicit admission
control.

### Java 22–26: Foreign Interop And Evolving Language Features

- Foreign Function and Memory API maturation;
- stream gatherers for custom intermediate operations;
- scoped values becoming final in Java 25;
- stable values evolving into the lazy-constants preview API;
- continued pattern-matching and primitive-pattern work in Java 26 previews.

Preview features require an explicit compiler/runtime flag and may change or be
removed. Keep them away from stable public contracts unless the deployment and
upgrade policy deliberately accepts that risk.

## Feature Adoption Checklist

Before adopting a feature, confirm:

1. the production JDK and build tool support it;
2. whether it is final, preview, incubating, or experimental;
3. library, framework, IDE, static-analysis, and observability compatibility;
4. rollback behavior for serialized data and public APIs;
5. measurable readability, safety, or performance benefit;
6. team understanding and test coverage.

## Practical Rule

Use new Java features when they make intent clearer or remove boilerplate.
Avoid using them only to look modern.

Good candidates in backend code:

- records for request/response DTOs;
- switch expressions for status mapping;
- sealed interfaces for fixed domain result types;
- virtual threads for high-concurrency blocking I/O;
- Optional for repository/service return values where absence is expected.

## Tricky Interview Questions

<ExpandableAnswer title="Does var make Java dynamically typed?">

No; the compiler infers one static type.

</ExpandableAnswer>

<ExpandableAnswer title="Are records deeply immutable?">

No; their component references are final, but referenced objects may mutate.

</ExpandableAnswer>

<ExpandableAnswer title="Do virtual threads remove the need for connection pools?">

No; pools protect scarce external resources.

</ExpandableAnswer>

<ExpandableAnswer title="Can a switch expression fall through?">

Arrow rules do not; colon-style groups require explicit `yield` for a value.

</ExpandableAnswer>

<ExpandableAnswer title="Can production code use preview features without flags?">

No; compilation and execution require preview enablement.

</ExpandableAnswer>


## Official References

- [Java language changes through Java 26](https://docs.oracle.com/en/java/javase/26/language/java-language-changes-summary.html)
- [OpenJDK JEP index](https://openjdk.org/jeps/0)
- [Java 26 API](https://docs.oracle.com/en/java/javase/26/docs/api/index.html)

## Recommended Next

Choose a dedicated feature page above, then continue with the
[Core Java Deep Dive](../CORE-JAVA-DEEP-DIVE.md).
