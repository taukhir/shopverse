---
title: Maven Dependencies, BOMs, Reactors, And Profiles
description: Master dependency scopes and mediation, exclusions, BOM imports, multi-module ordering, partial builds, and profile design.
difficulty: Advanced
page_type: Deep Dive
status: Generic
prerequisites: [Maven POM Lifecycle And Plugins]
learning_objectives: [Predict dependency resolution, Govern versions through BOMs, Operate large reactors efficiently]
technologies: [Apache Maven]
last_reviewed: "2026-07-23"
---

# Maven Dependencies, BOMs, Reactors, And Profiles

## Dependency Graph And Mediation

Maven resolves a graph, not a flat list. When versions conflict, dependency mediation
normally selects the nearest definition; if depth is equal, declaration order can matter.
`dependencyManagement` supplies versions/configuration but does not add a dependency.

```bash
./mvnw dependency:tree
./mvnw dependency:tree -Dverbose -Dincludes=com.fasterxml.jackson.core
```

Declare dependencies for APIs your source directly uses. Use exclusions at the edge that
introduces an unwanted transitive artifact, documenting why. Broad exclusions can create
runtime linkage failures.

## Scopes

| Scope | Compile | Test | Runtime artifact/classpath intent |
|---|---:|---:|---|
| compile | yes | yes | included/transitive default |
| provided | yes | yes | supplied by runtime/container |
| runtime | no | yes | required to execute |
| test | no | yes | test only |
| import | dependencyManagement only | n/a | imports a BOM |

`system` scope and local filesystem JARs undermine portability and should be replaced by a
proper repository artifact.

## Parent POM Versus BOM

A project can have only one parent but can import multiple BOMs. A parent can govern the
whole build; a BOM is a dependency-version contract.

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-dependencies</artifactId>
      <version>${spring-boot.version}</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
```

Import order and local managed versions can affect the effective result. Validate the
resolved graph after platform upgrades instead of overriding isolated libraries casually.

## Reactor

The reactor collects modules, sorts them by inter-module dependencies/plugin relationships,
and builds in dependency order. Useful selection:

```bash
./mvnw -pl :order-service -am verify
./mvnw -pl :order-service -amd test
./mvnw -rf :payment-service verify
```

- `-pl` selects projects.
- `-am` also builds required upstream modules.
- `-amd` also builds downstream dependents.
- `-rf` resumes from a module after failure.

Parallel builds (`-T`) require thread-safe plugins/tests and enough CPU/memory/external
capacity. They can expose shared ports, mutable test data, and ordering assumptions.

## Module Design

Prefer modules with an owned artifact and dependency direction. Typical layers include a
platform/BOM, reusable build parent, domain/API libraries, services, and test fixtures.
Avoid cyclic modules and giant `common` libraries. Publishing an artifact creates a
compatibility and ownership obligation.

## Profiles

Profiles change the build model. Use them for genuinely different build environments or
optional distributions, not routine application runtime configuration. Ensure a normal
build has deterministic defaults and CI prints active profiles.

Activation can depend on property, JDK, OS, file, or explicit `-P`. Implicit environment
activation can make “works on my machine” failures hard to reproduce.

## Dependency Governance

- converge versions through a platform/BOM;
- ban duplicate classes and known-bad dependencies where practical;
- record licenses and generate an SBOM;
- inspect optional dependencies and shaded artifacts;
- pin plugin versions as well as library versions;
- test runtime classpaths, not only compilation;
- prefer supported platform upgrades to isolated security overrides, while mitigating
  urgent vulnerabilities with evidence and follow-up.

## Interview Questions

**Why can code compile but fail with `NoSuchMethodError`?** Compilation saw one compatible
API, but runtime resolved a different binary version; inspect the runtime dependency tree,
packaging, container, and shading.

**BOM versus parent?** A BOM imports dependency management; a parent supplies a broader
inherited project model. Multiple BOMs can be imported, but only one parent is selected.

**Why did Maven build modules out of file order?** The reactor sorts by dependency/build
relationships, not by the textual module list alone.

## Official References

- [Maven dependency mechanism](https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html)
- [Maven multi-module guide](https://maven.apache.org/guides/mini/guide-multiple-modules.html)
- [Maven profiles](https://maven.apache.org/guides/introduction/introduction-to-profiles.html)

## Recommended Next

Continue with [Testing, Repositories, Security, Reproducibility, And CI](./MAVEN-CI-SECURITY-REPRODUCIBILITY.md).

