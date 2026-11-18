---
title: Gradle Build Lifecycle, Task Graph, And Caching
description: Understand Gradle's initialization/configuration/execution phases, task dependencies, incremental up-to-date checks, and the build and configuration caches.
difficulty: Intermediate
page_type: Deep Dive
status: maintained
prerequisites: [Gradle Engineering Learning Path]
learning_objectives: [Trace Gradle's three build phases, Predict whether a task is up-to-date, Configure custom tasks safely]
technologies: [Gradle]
last_reviewed: "2026-11-18"
scope: generic
owner: docs-operations
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Gradle Build Lifecycle, Task Graph, And Caching

## Three Build Phases

Every Gradle invocation runs three phases, always in this order:

1. **Initialization**: Gradle evaluates `settings.gradle.kts` to determine
   which projects participate in the build, and creates a `Project`
   instance for each.
2. **Configuration**: Gradle evaluates every participating project's
   `build.gradle.kts`, applying plugins and registering tasks — but not yet
   running any task's action. A slow configuration phase (heavy logic that
   runs on every invocation regardless of which task was requested) is a
   common, avoidable source of "Gradle feels slow even for `gradlew help`".
3. **Execution**: Gradle determines the subset of the task graph needed for
   the requested tasks, checks each for up-to-date status or cache hits,
   and executes the remainder in dependency order.

```bash
./gradlew help --task test
```

prints the computed task graph for `test` without executing it — useful
for confirming which tasks a command will actually run before running it.

## First Working Example: A Custom Task

```kotlin
tasks.register<Copy>("copyDeploymentManifests") {
    from("src/deploy")
    into(layout.buildDirectory.dir("manifests"))
}

tasks.named("build") {
    dependsOn("copyDeploymentManifests")
}
```

`tasks.register` is lazy: the task object is not created or configured
until something actually needs it, which is why Gradle prefers
`tasks.register` over the eager `tasks.create` for build-script
performance at scale.

## Incremental Build: Up-To-Date Checks

Every task declares (explicitly or via a built-in task type) its
**inputs** and **outputs**. Before executing a task, Gradle computes a
hash of its current inputs and compares it against the hash recorded from
the previous execution with the same outputs; if nothing changed, the task
is skipped and reported `UP-TO-DATE`.

```kotlin
abstract class GenerateChangelog : DefaultTask() {
    @get:InputFile
    abstract val sourceLog: RegularFileProperty

    @get:OutputFile
    abstract val changelogFile: RegularFileProperty

    @TaskAction
    fun generate() {
        changelogFile.get().asFile.writeText(sourceLog.get().asFile.readText())
    }
}
```

A task with no declared inputs/outputs — a plain ad-hoc task registered with
only a `doLast` action and no `inputs`/`outputs` declared — can never be
considered up-to-date and always re-runs. That is correct for a one-off
script step, wrong for anything that should be incremental.

## Build Cache Versus Configuration Cache

These solve different problems and are a common interview confusion:

| Cache | Caches | Scope |
|---|---|---|
| **Build cache** (local/remote) | task *outputs*, keyed by a hash of task inputs | can reuse another machine's (or an earlier local) execution of the same task with the same inputs |
| **Configuration cache** | the *result of the configuration phase itself* (the task graph) | skips re-running build-script configuration logic on a subsequent invocation with the same inputs, not the tasks' own work |

A remote build cache lets a CI worker skip re-compiling and re-testing code
another CI job (or a developer) already built from identical inputs — the
single highest-leverage Gradle performance feature for a large multi-module
build, and the thing that most distinguishes Gradle from Maven in
day-to-day CI cost.

```properties
# gradle.properties
org.gradle.caching=true
org.gradle.configuration-cache=true
```

## How It Works: Task Graph Execution

```text
1. Initialization: evaluate settings.gradle.kts -> build project list
2. Configuration: evaluate each build.gradle.kts -> register tasks
3. Execution:
     requested tasks -> compute transitive task graph
     for each task in dependency order:
       input hash matches recorded output? -> mark UP-TO-DATE, skip
       build-cache entry exists for this input hash? -> pull cached output
       otherwise -> execute task action, record new input/output hashes
```

## Boundaries And Trade-Offs

- Up-to-date checking and the build cache both depend on **correctly
  declared** task inputs/outputs; a custom task that reads a file it never
  declared as an `@InputFile` can be cached incorrectly stale — Gradle has
  no way to know that file affects the result.
- The configuration cache requires build logic to avoid certain patterns
  (reading mutable state at configuration time that should be deferred to
  execution time); enabling it on a build written without that discipline
  can produce confusing invalidation rather than a clean error in every
  version.
- Parallel task execution (`--parallel`) only parallelizes across
  independent projects/tasks in the graph; a task graph that is one long
  dependency chain gets no benefit from it.

## Failure Modes, Edge Cases, And Common Mistakes

- A task reported `UP-TO-DATE` when the developer expected it to re-run
  usually means an input was not declared, not that Gradle "ignored" a
  real change — inspect the task's declared inputs with `--info` before
  assuming caching is broken.
- A stale **configuration cache** entry surviving a build-script logic
  change can produce a build that silently runs the previous
  configuration; `./gradlew --configuration-cache-problems=warn` or
  invalidating the cache (`./gradlew build --no-configuration-cache` once)
  isolates whether the configuration cache itself is the cause.
- Mixing an ad-hoc `doLast` task with no declared outputs into a chain
  other tasks `dependsOn` defeats incremental build for every downstream
  task that depends on its (undeclared, unchecked) output.

## Production And Diagnostic Guidance

- Use `--scan` (Gradle Build Scan) to get a shareable, detailed breakdown
  of which tasks ran, which were cached/up-to-date, and where time was
  actually spent — far more actionable than reading console timing by eye.
- Use `--profile` for a local HTML report of task execution time without
  publishing anywhere, when a build scan is not appropriate for the data
  involved.
- Treat the configuration phase's own wall-clock time as a tracked metric
  separately from task execution time; a growing configuration phase
  usually means build-script logic doing real work (file I/O, network
  calls) at configuration time instead of being deferred into a task.

## Tricky Interview Questions

**A task ran even though nothing in the source changed. What do you check
first, before assuming the cache is broken?** Whether the task declares
its inputs/outputs at all, and whether every file/property that actually
affects its result is declared as an input — an undeclared input (or one
that changes every run, such as a timestamp) will always force
re-execution regardless of caching configuration.

**Why can enabling the remote build cache make CI slower in some setups
rather than faster?** If most CI jobs build genuinely different code on
every run (little reuse between jobs) or the cache backend's network
latency exceeds the time saved by skipping the task, the cache
round-trip cost can exceed the cost of simply executing the task locally —
build caching is a bet on reuse, not a universal speedup.

**Why does Gradle need both a build cache and a separate configuration
cache instead of one unified cache?** They cache different things at
different phases: the build cache reuses a task's *execution* output for a
given input hash, while the configuration cache reuses the *result of
evaluating the build scripts themselves* so that phase can be skipped
entirely on a repeat invocation — a build can benefit from one without the
other, for example when build-script logic is cheap but task execution
(compilation, tests) is expensive.

## Official References

- [Build lifecycle](https://docs.gradle.org/current/userguide/build_lifecycle.html)
- [Incremental build](https://docs.gradle.org/current/userguide/more_about_tasks.html#sec:up_to_date_checks)
- [Build cache](https://docs.gradle.org/current/userguide/build_cache.html)
- [Configuration cache](https://docs.gradle.org/current/userguide/configuration_cache.html)

## Recommended Next

Continue with [Dependencies, Version Catalogs, And Multi-Module Builds](./GRADLE-DEPENDENCIES-MULTI-MODULE.md).
