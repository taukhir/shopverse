---
title: Gradle Troubleshooting, Interview Questions, Labs, And Revision
description: Diagnose Gradle configuration-cache, build-cache, dependency-resolution, and daemon failures with lead-level scenarios and exercises.
difficulty: Advanced
page_type: Interview
status: maintained
prerequisites: [Gradle CI Security And Reproducibility]
learning_objectives: [Troubleshoot Gradle systematically, Complete practical labs, Answer lead-level build questions]
technologies: [Gradle]
last_reviewed: "2026-11-18"
scope: generic
owner: docs-operations
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Gradle Troubleshooting, Interview Questions, Labs, And Revision

## Diagnostic Sequence

1. Record the exact command, project path, Gradle/JDK versions (via
   `./gradlew --version`), OS, and CI job.
2. Find the first meaningful failure, not the final task-execution summary.
3. Classify: configuration-phase failure, dependency resolution, stale
   cache/configuration-cache, compilation, test, or daemon/environment.
4. Reproduce with the wrapper and the narrowest project path
   (`:order-service:test`) rather than the full `build`.
5. Inspect the task graph (`--dry-run`) and dependency tree
   (`dependencies`) for the specific project.
6. Use `--info` for task-level up-to-date reasoning and `--scan` for a full
   shareable report; use `-Dorg.gradle.debug=true` only for bounded deep
   diagnosis, and never paste a build scan containing secrets externally.
7. Correct ownership, then rerun the narrow target and the relevant
   downstream project paths.

## Symptom Matrix

| Symptom | Checks | Correction |
|---|---|---|
| task unexpectedly `UP-TO-DATE` | declared `@InputFile`/`@OutputFile` annotations, `--info` task reasoning | declare the missing input/output, or mark the task non-cacheable if it is genuinely non-deterministic |
| stale configuration-cache behavior | `--configuration-cache-problems=warn`, recent build-script edits | invalidate the configuration cache once; fix build-script logic reading mutable state at configuration time |
| dependency resolved to unexpected version | `dependencies --configuration runtimeClasspath`, version catalog entries | converge via the version catalog; confirm highest-wins resolution picked the version you actually intended |
| works in IDE only | IDE's own Gradle sync settings versus the wrapper-pinned version/JDK toolchain | make the wrapper and toolchain canonical for both |
| `api` leak causes unrelated module version bump | which configuration (`api` vs `implementation`) declared the dependency | change the shared module's declaration to `implementation` unless that type is genuinely part of its public contract |
| daemon seems to hang or use excessive memory | `./gradlew --status`, daemon heap settings in `gradle.properties` | stop stale daemons (`./gradlew --stop`), size `org.gradle.jvmargs` deliberately |
| 401/403 on publish | repository credentials in `gradle.properties`/CI secrets, not the build script | fix credential injection, never commit secrets to the build script |
| remote build cache serves wrong output | task input declarations (see Build Lifecycle page) | fix the under-declared input; do not clear the whole cache reflexively |

## Top Interview Questions

**What happens during `./gradlew build`?** Gradle initializes (reads
`settings.gradle.kts`), configures every participating project (evaluates
`build.gradle.kts`, applies plugins), computes the task graph needed to
satisfy `build`'s dependencies, and executes every task in that graph that
is not already up-to-date or cache-hit, in dependency order.

**Why use a version catalog instead of just declaring versions inline?**
It centralizes selected versions in one reviewable file every subproject
references identically, the Gradle analogue of a Maven BOM import, and
avoids the silent highest-version-wins drift that inconsistent inline
declarations across subprojects can otherwise produce.

**How do you prevent build-input drift between a developer's machine and
CI?** Commit and never hand-edit the wrapper (pin the Gradle version and
its checksum), use a JDK toolchain instead of relying on whatever JDK is
on `PATH`, enable dependency locking and verification, and make build
scripts free of machine-specific or time-dependent configuration-time
logic.

**Build cache versus configuration cache — when would enabling only one
of them still help?** The build cache helps whenever task *execution*
(compilation, tests) is the expensive part and inputs repeat across runs
or machines; the configuration cache helps whenever the *configuration
phase itself* (evaluating build scripts) is expensive relative to task
execution, such as a build with many subprojects and complex conditional
logic in each `build.gradle.kts`. A build dominated by one cost sees little
benefit from optimizing the other.

**Why can parallel Gradle builds be unsafe or non-deterministic?** Tasks
that read or write shared, non-task-local state (a port, a shared test
database, a file outside the declared task outputs) can race when Gradle
executes independent tasks concurrently with `--parallel`; the fix is
isolating that shared state per task/module, not disabling parallelism as
a permanent workaround.

## Hands-On Labs

1. Build a multi-project settings file with a shared library module and
   two service modules; declare the shared module as both `api` and
   `implementation` in turn and observe the difference in each consumer's
   resolved compile classpath.
2. Introduce two subprojects declaring different versions of the same
   transitive dependency; inspect `dependencies`, then converge through a
   version catalog.
3. Write a custom task with correctly declared `@InputFile`/`@OutputFile`
   properties; prove it is skipped as `UP-TO-DATE` on a repeat run, then
   break the declaration and observe it always re-running.
4. Enable the local build cache and a configuration cache; measure a
   clean build versus a repeat build's wall-clock time with `--scan`.
5. Enable dependency locking, bump one dependency's version in the build
   script, and observe the lockfile diff required to accept the change
   deliberately.
6. Pin the wrapper to a specific Gradle version with a `distributionSha256Sum`
   and prove a tampered/mismatched distribution URL fails verification.
7. Simulate a stale remote-build-cache hit from an under-declared task
   input, then fix the declaration and confirm correct cache invalidation.

## One-Page Revision

- Three phases always run in order: initialization, configuration,
  execution — only execution actually runs task actions.
- A task is `UP-TO-DATE` only if its declared inputs/outputs are unchanged;
  undeclared inputs are invisible to caching.
- Build cache reuses task *output*; configuration cache reuses the
  *configured task graph itself* — different problems, different caches.
- `implementation` hides a dependency from consumers; `api` exposes it
  transitively — prefer `implementation` unless the type is genuinely
  public contract.
- Gradle's default conflict resolution is highest-version-wins, not
  Maven's nearest-wins — verify the resolved graph, do not assume parity.
- A version catalog centralizes versions across a multi-module build the
  way a Maven BOM does, but is type-checked Gradle infrastructure.
- The wrapper pins the exact Gradle version/checksum; never hand-edit it,
  regenerate it with `gradle wrapper --gradle-version`.
- Dependency locking pins resolved versions; dependency verification
  checks artifact checksums/signatures — use both for real supply-chain
  posture.
- Diagnose the exact task/project/input; do not clear the entire Gradle
  cache reflexively.

## Official References

- [Gradle command-line interface](https://docs.gradle.org/current/userguide/command_line_interface.html)
- [Troubleshooting builds](https://docs.gradle.org/current/userguide/troubleshooting.html)
- [The Gradle daemon](https://docs.gradle.org/current/userguide/gradle_daemon.html)

## Recommended Next

Return to the [Gradle Engineering Learning Path](../GRADLE-ENGINEERING-PATH.md) and apply the labs to a real multi-module repository.
