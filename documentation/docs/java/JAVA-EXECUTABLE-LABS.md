---
title: Java Architect Executable Labs
description: Commands, expected observations, safety limits, and evidence templates for the Java senior Maven lab module.
---

# Java Architect Executable Labs

The source module is at `documentation/labs/java-senior`. It contains dependency-
free reproducers plus Maven-backed JUnit, JMH, JOL and jcstress experiments.

## Verified Smoke Labs

```powershell
cd documentation/labs/java-senior
powershell -ExecutionPolicy Bypass -File .\run-labs.ps1 -Mode smoke
```

Expected invariants:

- the bounded pool accepts 8 tasks and rejects 12: 2 core workers, 4 queue
  slots, then growth to 4 maximum workers;
- identical binary names from isolated defining loaders are different classes;
- the virtual-thread sample terminates and is ready for JFR/pinning inspection.

## Maven Labs

```powershell
mvn test
mvn -DskipTests package
```

`ThreadPoolSaturationLabTest` makes admission behavior executable. JMH compares
array and linked-list traversal with forks/warm-up. JOL reports shallow layout
and retained graph footprint. jcstress explores unsafe publication outcomes.

Additional jcstress cases prove volatile message passing, final-field publication,
and VarHandle release/acquire ordering. `SelectorEchoLab` demonstrates accept/read
selection, attachment-owned buffers, partial writes, compaction and key cleanup.

`CoreJavaScenariosTest` verifies widening-versus-boxing overload selection, static
hiding versus runtime overriding, mutable-key lookup failure, comparator-based tree
uniqueness, ForkJoin reduction, custom Spliterator partitioning, and a Java Compiler
API compile-failure fixture. `ParallelStreamBenchmark` compares sequential and
parallel execution at small and large sizes instead of assuming parallel speedup.

## Runtime Workloads

```powershell
java -Xms256m -Xmx256m -Xlog:gc*,safepoint `
  -cp target/classes io.shopverse.labs.GcAllocationWorkload 30

java -XX:NativeMemoryTracking=summary `
  -cp target/classes io.shopverse.labs.DirectMemoryPressureLab 64
jcmd <pid> VM.native_memory summary
```

Run pressure experiments only in an isolated development process. Keep explicit
heap/native limits and never run them against a shared environment.

## Evidence Record

For every experiment record JDK build, OS/container limits, CPU, command, warm-up,
input, expected invariant, observed result, JFR/GC/profile artifact, interpretation,
and at least one alternative explanation rejected by evidence.

## Official References

- [JMH](https://openjdk.org/projects/code-tools/jmh/)
- [JOL](https://openjdk.org/projects/code-tools/jol/)
- [jcstress](https://openjdk.org/projects/code-tools/jcstress/)

## Recommended Next

Use the results while answering the [Senior Interview Bank](./JAVA-SENIOR-INTERVIEW-BANK.md).
