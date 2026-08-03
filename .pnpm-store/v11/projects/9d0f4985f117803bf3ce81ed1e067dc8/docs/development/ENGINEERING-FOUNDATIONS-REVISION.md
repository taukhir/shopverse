---
title: Engineering Foundations Revision Sheet
description: Rapid revision for design principles, patterns, APIs, data structures, testing, delivery, and technical review.
difficulty: Advanced
page_type: Interview
status: maintained
prerequisites: [Engineering Foundations Overview]
learning_objectives: [Recall core engineering decisions quickly, Review a design across quality boundaries, Answer foundational architect questions concisely]
technologies: [Java, HTTP, SQL, Git, CI]
last_reviewed: "2026-07-30"
scope: generic
owner: docs-development
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Engineering Foundations Revision Sheet

Use after completing the [Engineering Foundations Overview](./ENGINEERING-FOUNDATIONS-OVERVIEW.md).

## One-Line Recall

| Concept | Revision answer |
|---|---|
| cohesion | Keep behavior and data that change for the same reason together. |
| coupling | Measure how much one component knows about or depends on another. |
| abstraction | Preserve the essential contract while hiding replaceable detail. |
| encapsulation | Protect invariants by controlling access to state and behavior. |
| dependency inversion | Make policy depend on stable contracts, not volatile infrastructure. |
| composition | Build behavior from collaborating objects instead of inheriting implementation. |
| idempotency | Repeating the same logical operation converges on one authoritative effect. |
| compatibility | Old and new participants can safely overlap during evolution. |
| observability | Runtime evidence can explain state, impact, and recovery. |

## Pattern Selection

| Need | Consider | Avoid when |
|---|---|---|
| choose interchangeable behavior | Strategy | behavior never varies |
| isolate construction | Factory or Builder | construction is already trivial |
| translate an external contract | Adapter | it merely renames identical methods |
| add cross-cutting behavior | Decorator or Proxy | hidden ordering makes behavior unclear |
| notify multiple observers | Observer/events | immediate consistency or response is required |
| process through ordered handlers | Chain of Responsibility | exactly one explicit owner is clearer |

## API Review

- resources and commands express business intent;
- validation and error contracts are stable;
- retries are safe through idempotency keys or conditional state transitions;
- pagination has deterministic ordering;
- authentication and object-level authorization are explicit;
- compatibility, deprecation, rate limits, and observability are defined.

## Code Review Sequence

1. invariant and behavior correctness;
2. security and data protection;
3. transaction, concurrency, and failure boundaries;
4. responsibility and dependency design;
5. performance and resource ownership;
6. test evidence, telemetry, rollout, and rollback;
7. naming and local readability.

## Interview Prompts

**Pattern or simple code?** Use the simplest structure that preserves the required
variation and test boundary. A pattern is justified by change and risk, not by name.

**Monolith or microservices?** Start from ownership, independent scaling/deployment,
consistency, team boundaries, and operational maturity. A modular monolith is often
the safer starting point.

**Unit or integration test?** Unit tests isolate logic cheaply; integration tests
prove framework, database, serialization, network, and configuration boundaries.
Use both where each failure would matter.

**What makes code production-ready?** Correct invariants, bounded resources,
security, failure handling, telemetry, compatible deployment, recovery, and proven
tests—not only clean structure.

## Maven And Gradle Interview Questions

### Maven phase, lifecycle, and plugin goal?

A lifecycle is an ordered build model, a phase is one step such as test or package, and a plugin goal performs
work bound to a phase or invoked directly. Calling a phase executes earlier phases in that lifecycle; it does
not mean Maven has a built-in implementation for every task.

### `dependencies` versus `dependencyManagement`?

`dependencies` adds a dependency to that project. `dependencyManagement` supplies versions, scopes or exclusions
when a child/module declares it; importing a BOM contributes managed coordinates. Management does not normally
put the library on the classpath by itself.

### How does Maven resolve a transitive version conflict?

Maven generally uses the nearest definition, with declaration order resolving equal depth, after management
rules apply. Inspect the effective POM and dependency tree, then manage/exclude intentionally. A successful
compile does not prove runtime binary compatibility.

### `pluginManagement` versus `plugins`?

`pluginManagement` defines inherited defaults and versions for plugins when they are used; `plugins` activates
the plugin/build binding in the project. Pin plugin versions because plugins are executable supply-chain inputs,
not harmless metadata.

### How is Maven reactor order chosen?

The reactor sorts modules from declared inter-module project dependencies and relevant plugin/build edges, not
simply the `<modules>` text order. `-pl` selects projects and `-am`/`-amd` expand required upstream/downstream
projects; partial builds still need compatible external artifacts.

### When are Maven profiles dangerous?

Profiles can change dependencies, plugins and resources based on environment, hiding what was actually built.
Keep artifacts reproducible, prefer runtime configuration for deployment differences, make activation explicit
and inspect the effective model in CI.

### Why use Maven/Gradle wrappers and Java toolchains?

The wrapper pins the build-tool distribution and toolchains select a declared JDK independently of the shell's
default. Verify wrapper integrity, pin plugins/dependencies and record versions so developer and CI builds use
the same controlled inputs.

### Maven snapshot versus release dependency?

A release coordinate should be immutable; a snapshot can resolve to changing timestamped content and metadata.
Snapshots improve iteration but weaken reproducibility and caching. Do not promote unpinned snapshots into a
production artifact without an explicit immutable identity.

### What makes a build reproducible?

Same declared source and inputs should produce equivalent verifiable output: pinned tools/plugins/dependencies,
controlled repositories, normalized timestamps/order, locked environment inputs and no undeclared network or
machine state. Compare artifact hashes and provenance, not only successful compilation.

### How do you diagnose a corrupt or stale dependency cache?

First inspect resolution logs, checksums, metadata age, repository mirrors and effective configuration. Refresh
the smallest affected coordinate or use an isolated cache to prove the hypothesis. Deleting the entire shared
cache hides evidence and creates avoidable network/supply-chain load.

### Maven versus Gradle?

Maven emphasizes a declarative fixed lifecycle and conventional model; Gradle exposes a programmable task graph,
incremental work and build-cache features. Choose from ecosystem, build complexity, reproducibility, performance
and team operability rather than syntax preference.

### Gradle configuration, execution, incremental build, and build cache?

Configuration constructs the task graph; execution runs selected tasks. Up-to-date checks reuse local outputs
when declared inputs/outputs match, while the build cache can reuse task outputs across workspaces. Undeclared
inputs, nondeterministic tasks and configuration-time side effects make reuse incorrect or ineffective.

## Final Checklist

- requirements and invariants precede implementation;
- dependencies point toward stable policy;
- patterns solve demonstrated variation;
- APIs and data evolve compatibly;
- state and work have clear ownership;
- resources and failure are bounded;
- tests and production evidence cover critical boundaries.

## Official References

- [Java language specification](https://docs.oracle.com/javase/specs/jls/se21/html/)
- [Spring Framework reference](https://docs.spring.io/spring-framework/reference/)
- [Google SRE books](https://sre.google/books/)
