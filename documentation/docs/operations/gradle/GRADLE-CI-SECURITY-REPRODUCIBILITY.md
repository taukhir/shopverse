---
title: Gradle CI, Wrapper Security, And Reproducibility
description: Secure the Gradle wrapper as a supply-chain control, verify and lock dependencies, and design a cacheable, reproducible CI pipeline.
difficulty: Advanced
page_type: Guide
status: maintained
prerequisites: [Gradle Dependencies Version Catalogs And Multi-Module Builds]
learning_objectives: [Treat the wrapper as a supply-chain control, Verify and lock dependencies, Design a cacheable reproducible CI pipeline]
technologies: [Gradle, CI/CD]
last_reviewed: "2026-11-18"
scope: generic
owner: docs-operations
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Gradle CI, Wrapper Security, And Reproducibility

## The Wrapper Is A Supply-Chain Control, Not Boilerplate

`gradlew`/`gradlew.bat` plus `gradle/wrapper/gradle-wrapper.properties` and
`gradle-wrapper.jar` pin the **exact** Gradle version (and the URL/checksum
it downloads from) that every developer machine and every CI job uses to
build this project. This repository bumped `gradle-wrapper` across every
service in a set of recent dependency-update commits precisely because an
outdated or unpinned wrapper is a real supply-chain and correctness risk:
a build run with a different Gradle version than the one the team actually
tested against can behave differently (different incremental-build
semantics, different default dependency-resolution strategy between major
versions, deprecated-API warnings becoming hard errors).

```properties
# gradle/wrapper/gradle-wrapper.properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.11-bin.zip
distributionSha256Sum=<pinned checksum of that exact distribution>
```

Setting `distributionSha256Sum` is the Gradle-specific equivalent of
pinning a Maven Wrapper version: without it, the wrapper trusts whatever
bytes the configured URL returns at download time, which is exactly the
kind of unpinned, mutable build input a supply-chain review should flag.
Never hand-edit `gradle-wrapper.jar` or `gradlew` directly — regenerate
both with `gradle wrapper --gradle-version <version>` from a trusted
Gradle installation so the wrapper scripts and jar stay matched to the
properties file.

## Dependency Verification And Locking

Two separate, complementary controls exist:

- **Dependency locking** (`dependencyLocking` + `*.lockfile` files) pins
  the *resolved version* of every dependency (including transitive ones)
  so a build does not silently pick up a newer transitive version between
  CI runs, even though the declared ranges/versions in the build script
  have not changed.
- **Dependency verification** (`gradle/verification-metadata.xml`) checks
  the *checksum/signature* of every downloaded dependency artifact against
  a recorded, trusted value before it is allowed onto the build classpath
  — the control that actually detects a compromised or tampered artifact,
  which locking alone does not.

```bash
./gradlew dependencies --write-locks
./gradlew --write-verification-metadata sha256 build
```

Locking without verification pins *which* version resolves but not that
the bytes for that version are the ones you intended; verification without
locking checks the artifacts you got but does not stop a transitive
version from silently drifting between builds. Production supply-chain
posture needs both, the same two-layer reasoning Maven's reproducibility
guidance applies through pinned plugin versions plus dependency-tree
verification.

## Reproducibility

A reproducible Gradle build controls: the wrapper-pinned Gradle version,
the JDK (via a Gradle **toolchain**, independent of whichever JDK launched
Gradle itself), locked dependency versions, verified artifact checksums,
and build-script logic free of machine-specific or time-dependent state.

```kotlin
java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
        vendor = JvmVendorSpec.AMAZON // pin a specific JDK distribution if required
    }
}
```

A toolchain request lets CI and every developer machine build with the
same JDK vendor/version regardless of which JDK happens to be on `PATH` —
Gradle provisions or locates a matching JDK automatically, the direct
analogue of Maven Toolchains referenced in the Maven CI/security guide.

## CI Pipeline, Build Cache, And Build Scans

```text
checkout -> verify wrapper checksum/version -> resolve (locked + verified)
 -> compile/test (remote build cache hit where available)
 -> integration/contract tests -> static/security/license gates
 -> assemble -> SBOM/attestation -> publish once -> promote same artifact digest
```

Unlike a Maven CI pipeline, a Gradle pipeline typically adds a **remote
build cache** node that every CI worker (and optionally every developer)
reads from and writes to: a service whose code has not changed since the
last green build can have `compileJava`/`test` served straight from the
cache instead of re-executed, which is the largest realistic CI-time
reduction available on a large multi-module Gradle build. Treat the
remote cache the same way the Maven guidance treats a shared local
repository cache: an untrusted performance optimization, never a source
of truth, and never a substitute for actually running the tests when
cache correctness itself is in question.

A **Build Scan** (`--scan`) published per CI run gives reviewers a
persistent, shareable record of exactly which tasks ran, which were cache
hits, dependency-resolution timing, and configuration-time cost — far more
diagnostic value for a flaky or slow CI job than scrollback logs alone.

## Production Questions

**A CI job and a developer's laptop produce different build output from
the same commit.** Compare the wrapper-resolved Gradle version, the JDK
toolchain actually provisioned, and whether dependency locking/verification
is enabled on both; an unpinned wrapper or toolchain is the first thing to
rule out, before suspecting the dependency graph itself.

**The remote build cache serves stale output after a bug fix.** Confirm
the fixed task's inputs were actually declared completely (see the
build-lifecycle page) — a cache poisoning problem is almost always an
under-declared input, not a cache-infrastructure bug; invalidate the
specific cache entries only after confirming the input declaration, not
by clearing the entire remote cache reflexively.

**Build is fast locally and slow in CI.** Separate configuration-phase
time, dependency-resolution time, and task-execution time using a build
scan; check whether CI is missing a warm remote-cache hit the local
machine benefits from, and whether CI's configured parallelism matches
its actual CPU allocation rather than the developer laptop's.

## Official References

- [The Gradle Wrapper](https://docs.gradle.org/current/userguide/gradle_wrapper.html)
- [Verifying dependencies](https://docs.gradle.org/current/userguide/dependency_verification.html)
- [Locking dependency versions](https://docs.gradle.org/current/userguide/dependency_locking.html)
- [Toolchains for JVM projects](https://docs.gradle.org/current/userguide/toolchains.html)
- [Build cache](https://docs.gradle.org/current/userguide/build_cache.html)

## Recommended Next

Finish with [Troubleshooting, Interview Questions, Labs, And Revision](./GRADLE-TROUBLESHOOTING-INTERVIEW-REVISION.md).
