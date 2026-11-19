---
title: Gradle Dependencies, Version Catalogs, And Multi-Module Builds
description: Master dependency configurations, api versus implementation visibility, version catalogs, multi-project structure, and composite builds.
difficulty: Advanced
page_type: Deep Dive
status: maintained
prerequisites: [Gradle Build Lifecycle And Task Graph]
learning_objectives: [Predict dependency visibility and resolution, Govern versions through a version catalog, Operate multi-module builds efficiently]
technologies: [Gradle]
last_reviewed: "2026-11-18"
scope: generic
owner: docs-operations
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Gradle Dependencies, Version Catalogs, And Multi-Module Builds

## Dependency Configurations

Gradle resolves a dependency graph scoped per **configuration** — a named
bucket with its own visibility rules, the direct analogue of Maven's
dependency `<scope>` but with a critical addition the Java Library plugin
introduces:

| Configuration | On this project's classpath | Exposed to consumers transitively |
|---|---|---|
| `implementation` | compile + runtime | no |
| `api` (Java Library plugin only) | compile + runtime | yes |
| `compileOnly` | compile only | no |
| `runtimeOnly` | runtime only | no |
| `testImplementation` | test compile + runtime | n/a |

Declaring a dependency as `api` when `implementation` would do leaks that
dependency's own transitive dependencies onto every module that depends on
yours — a common source of unintended version coupling across a
multi-module build. Maven has no equivalent distinction: every `compile`
scope dependency is transitively exposed, which is one reason large Maven
reactors accumulate wide, hard-to-change dependency graphs more easily.

```kotlin
dependencies {
    api(project(":shopverse-common"))
    implementation("org.springframework.boot:spring-boot-starter-web")
    compileOnly("org.projectlombok:lombok:1.18.36")
    annotationProcessor("org.projectlombok:lombok:1.18.36")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
```

## Version Catalogs

A **version catalog** (`gradle/libs.versions.toml`) centralizes dependency
coordinates and versions across every module in a multi-project build —
Gradle's answer to Maven's BOM-import pattern, but type-checked and
IDE-autocompleted rather than XML:

```toml
# gradle/libs.versions.toml
[versions]
springBoot = "3.5.0"
junit = "5.12.2"

[libraries]
spring-boot-starter-web = { module = "org.springframework.boot:spring-boot-starter-web", version.ref = "springBoot" }
junit-jupiter = { module = "org.junit.jupiter:junit-jupiter", version.ref = "junit" }
```

```kotlin
dependencies {
    implementation(libs.spring.boot.starter.web)
    testImplementation(libs.junit.jupiter)
}
```

Every module references `libs.*` instead of a repeated literal
coordinate/version string, so a version bump happens once in the catalog
rather than being hand-edited across every module's build script — the
same convergence goal a Maven BOM import solves, implemented as shared,
versioned Gradle infrastructure rather than an XML dependency import.

## Multi-Project Builds

```kotlin
// settings.gradle.kts
rootProject.name = "shopverse"
include("order-service", "payment-service", "inventory-service", "shopverse-common")
```

A project is addressed by **path**, not by a flat module list the way
Maven's reactor is:

```bash
./gradlew :order-service:test
./gradlew :order-service:dependencies --configuration runtimeClasspath
./gradlew build  # root task; by default runs the task in every subproject that has one
```

A project dependency (`implementation(project(":shopverse-common"))`)
makes Gradle build `:shopverse-common`'s required tasks first,
automatically computing build order from the dependency graph — Gradle's
equivalent of Maven's reactor module ordering, but derived implicitly from
declared project dependencies rather than an explicit sort of a
`<modules>` list.

## Composite Builds

A **composite build** (`includeBuild` in `settings.gradle.kts`) lets one
Gradle build consume another, *separate* Gradle build's project as if it
were a local dependency, substituting it in place of a published
coordinate — useful for developing a shared library and a consuming
service together without publishing a snapshot to a repository on every
change. This differs from `include` (which adds a module to the *same*
build) and has no direct Maven equivalent; the closest Maven approximation
is manually `mvn install`-ing a dependency locally before building the
consumer, which composite builds make unnecessary.

## Boundaries And Trade-Offs

- `api` exposure is sometimes the correct choice (a published library's
  genuinely public return types must be `api`), not a mistake to eliminate
  everywhere — the trade-off is between consumer convenience and the
  module's own freedom to change its internal dependencies later without
  breaking every consumer's compile classpath.
- Gradle's default conflict resolution picks the **highest** requested
  version among conflicting transitive requests; this differs from
  Maven's nearest-wins mediation, so a dependency graph ported from Maven
  tooling/assumptions should be re-verified rather than assumed identical.
- Composite builds solve local cross-repository development friction but
  are not a substitute for an actual published, versioned artifact in CI —
  CI should still build and test against the real published coordinate.

## Failure Modes, Edge Cases, And Common Mistakes

- A module compiles successfully but a consumer fails at runtime with
  `NoClassDefFoundError` for a type used only internally: usually an
  `implementation` dependency was relied upon transitively by a consumer
  that should have declared its own direct dependency, or should have been
  exposed as `api` if that type is genuinely part of the public contract.
- Two subprojects declare different versions of the same library directly
  (not through the version catalog): Gradle resolves to the highest
  version for both, which can silently upgrade a module's actual runtime
  dependency beyond what its own build script states.
- Treating `compileOnly` as equivalent to Maven's `provided` scope without
  also adding `runtimeOnly` where a provided dependency actually needs to
  be present at runtime in a test or local run configuration — unlike
  Maven's `provided`, Gradle's `compileOnly` contributes nothing to the
  runtime classpath at all.

## Tricky Interview Questions

**Why might a well-intentioned `api` declaration on a shared library module
cause a seemingly unrelated version bump across the whole multi-module
build?** `api` dependencies are exposed transitively to every consumer; if
the shared library's `api` dependency on a logging library is bumped, every
module depending on that shared library now also sees (and, under
highest-version-wins resolution, may be forced onto) the new version on its
own compile classpath — the opposite of the isolation `implementation`
would have provided.

**A module's tests pass locally but fail in CI with a missing class at
runtime. What Gradle-specific cause would you check before assuming a CI
environment difference?** Whether the failing class comes from a dependency
declared `compileOnly` (visible to the compiler but intentionally absent
from the runtime classpath) that the runtime path genuinely needs — a
classic case of `compileOnly` used where `implementation` or an explicit
`runtimeOnly` addition was actually required.

**Why does Gradle's version-conflict resolution strategy (highest version
wins) make a version catalog more important than it would be under Maven's
nearest-wins mediation?** Because any module anywhere in the graph
declaring a newer transitive version can silently raise the resolved
version used everywhere, a version catalog gives every module one shared,
reviewable source of truth for the version actually intended — reducing
the chance that an unrelated module's dependency bump changes another
module's effective runtime behavior unnoticed.

## Official References

- [Declaring dependencies](https://docs.gradle.org/current/userguide/declaring_dependencies.html)
- [Java Library plugin and api/implementation](https://docs.gradle.org/current/userguide/java_library_plugin.html)
- [Gradle version catalogs](https://docs.gradle.org/current/userguide/platforms.html)
- [Multi-project builds](https://docs.gradle.org/current/userguide/multi_project_builds.html)
- [Composite builds](https://docs.gradle.org/current/userguide/composite_builds.html)

## Recommended Next

Continue with [CI, Wrapper Security, And Reproducibility](./GRADLE-CI-SECURITY-REPRODUCIBILITY.md).
