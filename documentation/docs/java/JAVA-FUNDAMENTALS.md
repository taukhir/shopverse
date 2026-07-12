---
title: Java Fundamentals
sidebar_position: 1
difficulty: Beginner
page_type: Tutorial
status: Generic
learning_objectives: [Understand the Java type and execution model, Build a foundation for collections streams and concurrency]
technologies: [Java, JVM]
last_reviewed: "2026-07-10"
---

# Java Fundamentals

:::info Canonical learning route
This URL remains the foundation overview. Senior readers should continue through
[Core Java Deep Dive](./CORE-JAVA-DEEP-DIVE.md) and the
[Lead And Architect Path](./JAVA-LEAD-ARCHITECT-PATH.md); detailed mechanics are
owned by their focused child chapters rather than duplicated here.
:::

Java is a statically typed, object-oriented, class-based language designed to
run on the Java Virtual Machine. The main idea is that Java source code is
compiled into bytecode, and the JVM executes that bytecode on different
operating systems.

```text
Java source code (.java)
  -> javac compiler
  -> bytecode (.class)
  -> JVM
  -> machine execution
```

## JDK, JRE, JVM

| Term | Meaning | What it contains |
|---|---|---|
| JVM | Java Virtual Machine | runtime engine, class loading, bytecode execution, JIT, GC |
| JRE | Java Runtime Environment | JVM plus runtime libraries needed to run Java apps |
| JDK | Java Development Kit | JRE plus compiler, tools, debugger, jshell, javadoc |

Use the JDK for development and builds. A runtime image or JRE-like image is
enough only when the application is already compiled.

## JVM

The JVM is responsible for:

- loading classes;
- verifying bytecode;
- executing bytecode;
- managing memory;
- running garbage collection;
- applying just-in-time compilation;
- handling threads and synchronization.

## JIT Compiler

The JVM initially interprets bytecode. Frequently executed code paths become
hot, and the JIT compiler converts them to optimized machine code.

This is why Java applications can become faster after warm-up.

## Classloader Basics

Classloaders load `.class` files into JVM memory.

Common classloader roles:

- bootstrap classloader loads core Java classes;
- platform classloader loads platform modules;
- application classloader loads application classes and dependencies.

Class loading usually happens lazily when a class is first needed.

## Platform Independence

Java is platform-independent because compiled bytecode targets the JVM, not a
specific operating system.

```text
Same .class file
  -> Windows JVM
  -> Linux JVM
  -> macOS JVM
```

The JVM itself is platform-specific, but the bytecode remains portable.

## Memory Areas

| Area | Purpose |
|---|---|
| Heap | objects and arrays |
| Stack | method calls and local variables per thread |
| Metaspace | class metadata |
| Program counter | current instruction per thread |
| Native method stack | native method execution |

Most application memory tuning focuses on heap, GC behavior, thread count, and
object allocation rate.

## Common Interview Questions

### Is Java compiled or interpreted?

Both. Source code is compiled to bytecode. The JVM interprets bytecode and can
JIT compile hot paths into native machine code.

### Why is Java platform independent?

Because Java compiles to bytecode that runs on a platform-specific JVM.

### Difference between JDK and JRE?

JDK is for development and includes compiler/tools. JRE is for running compiled
Java applications.

### What does the JVM do?

It loads classes, verifies bytecode, executes code, manages memory, runs GC,
and coordinates threads.

## Recommended Next Page

Continue with [Java OOP](./JAVA-OOP.md).

## Official References

- [Java Language Specification](https://docs.oracle.com/javase/specs/jls/se25/html/index.html)
