---
title: Java Reflection, Dynamic Loading, And Packaging
description: Dynamic invocation, proxies, annotations, agents, hidden classes, runtime images, and compatibility.
status: maintained
last_reviewed: "2026-11-18"
page_type: Guide
difficulty: Intermediate
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Java Reflection, Dynamic Loading, And Packaging

Reflection discovers members from runtime metadata and performs access checks;
cache lookups carefully without retaining unloadable class loaders. Method handles
provide typed, composable invocation and can be optimized at stable call sites.
VarHandles expose controlled field/array access with plain, opaque, acquire/release
and volatile-like ordering modes. Dynamic proxies implement interface dispatch;
class proxies/agents depend on bytecode generation and introduce final-method,
self-invocation, module-access and stack-trace consequences.

Runtime annotations depend on retention and target. Annotation processing runs at
compile time and generates sources/resources; it is not reflection. Agents and
instrumentation can transform class definitions but create startup, compatibility,
security and observability risks. Hidden classes support framework-generated
implementation artifacts without ordinary discovery/lifecycle expectations.

## Module Boundaries, In Brief

The Java Platform Module System (JPMS) adds a readability graph
(`requires`) and per-reader accessibility (`exports`/`opens`) on top of
everything above — a dynamic proxy or reflective framework running on the
module path is still subject to these checks, which is why `opens` (not
just `exports`) often has to be declared before reflection that worked on
the classpath keeps working on a module. The descriptor syntax, the
`ServiceLoader`/`uses`/`provides` wiring, migration strategy, and JPMS's own
failure modes are covered in full on
[Java Module System (JPMS)](./JAVA-MODULE-SYSTEM-JPMS.md) — read that page
for anything beyond this one-paragraph recap.

Packaging choices include modular/non-modular JARs, multi-release JARs, `jlink`
runtime images, `jpackage` installers, and CDS/AppCDS archives. Test classpath and
module-path deployments separately. Public evolution must consider descriptors,
reflection configuration, services, serialized forms and generated proxies—not
only source compilation.

## Official References

- [Java reflection](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/reflect/package-summary.html)
- [Method handles](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/invoke/package-summary.html)
- [JPMS specification](https://openjdk.org/projects/jigsaw/spec/)

## Recommended Next

Continue with [Java Module System (JPMS)](./JAVA-MODULE-SYSTEM-JPMS.md) for
module descriptors, strong encapsulation, and `ServiceLoader` wiring, then
run the loader/module labs in [Senior Labs](./JAVA-SENIOR-LABS-INTERVIEW.md).
