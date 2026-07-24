---
title: Maven Troubleshooting, Interview Questions, Labs, And Revision
description: Diagnose Maven model, resolution, compilation, testing, packaging, and CI failures with lead-level scenarios and exercises.
difficulty: Advanced
page_type: Interview Guide
status: Generic
prerequisites: [Maven CI Security And Reproducibility]
learning_objectives: [Troubleshoot Maven systematically, Complete practical labs, Answer lead-level build questions]
technologies: [Apache Maven]
last_reviewed: "2026-07-23"
---

# Maven Troubleshooting, Interview Questions, Labs, And Revision

## Diagnostic Sequence

1. Record the exact command, module, revision, Maven/JDK versions, OS, profiles, and CI job.
2. Find the first meaningful failure, not the final reactor summary.
3. Classify model, resolution, compilation, test, packaging, publication, or environment.
4. Reproduce with the wrapper and minimal selected reactor (`-pl ... -am`).
5. Inspect effective POM/settings and dependency tree.
6. Use `-e` for stack traces and `-X` only for bounded deep diagnosis; protect secrets.
7. Correct ownership, then rerun `verify` and the relevant downstream modules.

## Symptom Matrix

| Symptom | Checks | Correction |
|---|---|---|
| non-resolvable parent | relativePath, repository, parent coordinate, mirror | publish/fix coordinate or intended local parent |
| dependency omitted for conflict | verbose dependency tree and management | align BOM/managed version; remove accidental override |
| duplicate classes | tree, shaded JARs, split artifacts | converge/exclude at owning edge |
| works in IDE only | IDE classpath/JDK/profile versus wrapper build | make POM/toolchain canonical |
| test not discovered | provider, naming, engine, includes/excludes | align JUnit engine and plugin config |
| integration test skipped | Failsafe goals and use of `verify` | bind both goals; run `verify` |
| 401/403 deploy | server id, secret scope, target repo policy | fix settings/authorization, not POM secrets |
| corrupted local artifact | checksum/download evidence | remove only the exact coordinate and re-resolve |
| reactor cannot find module artifact | module selection and `-am` | build required upstream reactor projects |

## Top Interview Questions

**What happens during `mvn package`?** Maven builds the effective model, resolves build
extensions/plugins/dependencies, executes every default-lifecycle phase through `package`,
and runs goals bound by packaging and explicit executions.

**Why use dependency management?** It centralizes selected versions/exclusions for child
declarations; it does not itself place artifacts on classpaths.

**How do you prevent dependency drift?** Wrapper/toolchains, pinned plugins, managed
versions/BOMs, convergence/enforcer rules, immutable releases, controlled repositories,
locklike provenance reports/SBOM, and periodic upgrade verification.

**`install` versus `deploy`?** Install writes to the local repository; deploy publishes to
a remote repository for other builds.

**Why can parallel Maven builds be unsafe?** Plugins/tests may not be thread-safe, modules
may contend for ports/files/databases, and the machine/CI quotas may turn concurrency into
resource thrashing.

## Hands-On Labs

1. Build a parent, BOM, library, and service reactor; explain aggregation and inheritance.
2. Introduce two transitive versions, inspect mediation, then converge deliberately.
3. Configure Surefire and Failsafe; prove failure at `verify` and guaranteed teardown.
4. Add Enforcer rules for Maven/JDK and dependency convergence.
5. Use `-pl`, `-am`, `-amd`, and `-rf`; record which modules execute.
6. Generate an effective POM, dependency tree, SBOM, and reproducible artifact checksum.
7. Simulate repository authentication failure without exposing credentials in logs.

## One-Page Revision

- Effective model = Super POM + parent + project + profiles + settings/defaults.
- Phase is lifecycle position; goal is plugin action; execution binds goals/configuration.
- `dependencyManagement` manages; `<dependencies>` includes.
- Parent inheritance differs from module aggregation.
- Nearest dependency usually wins; runtime tree must be verified.
- Surefire = unit `test`; Failsafe = `integration-test` + `verify`.
- Wrapper + toolchain + pinned plugins + immutable inputs support reproducibility.
- CI publishes once and promotes the same artifact digest.
- Repository credentials live in secured settings/CI secrets, not source POMs.
- Diagnose the exact coordinate/module/model; do not erase every cache reflexively.

## Official References

- [Maven command-line options](https://maven.apache.org/ref/current/maven-embedder/cli.html)
- [Maven dependency plugin](https://maven.apache.org/plugins/maven-dependency-plugin/)
- [Maven Enforcer Plugin](https://maven.apache.org/enforcer/maven-enforcer-plugin/)

## Recommended Next

Return to the [Maven Engineering Learning Path](../MAVEN-ENGINEERING-PATH.md) and apply the labs to a real multi-module repository.
