---
title: Java Module System (JPMS)
description: Module descriptors, strong encapsulation, the readability graph, ServiceLoader wiring, migration, and JPMS failure modes.
difficulty: Advanced
page_type: Deep Dive
status: maintained
prerequisites: [Java packages and the classpath, Java reflection fundamentals]
learning_objectives: [Write and reason about a module descriptor, Explain why JPMS enforces strong encapsulation the classpath never could, Diagnose module-access and ServiceLoader failures]
technologies: [Java, JPMS]
last_reviewed: "2026-11-18"
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Java Module System (JPMS)

The **Java Platform Module System** (JPMS, delivered in Java 9 under
Project Jigsaw) is a module boundary enforced by the JVM itself: each
module declares exactly what it depends on and exactly what it exposes,
and the runtime refuses access that the declaration does not grant — unlike
the classpath, where every public class on any JAR is reachable from
everywhere else by default.

## Page Overview

This page covers: what problem JPMS solves that the classpath could not;
the module descriptor and its directives; the readability graph and strong
encapsulation; a minimal two-module worked example using `ServiceLoader`;
automatic and unnamed modules as a migration bridge; `--add-opens`/
`--add-exports` as a deliberate escape hatch; and the failure modes a lead
engineer meets when modularizing a real application. Packaging mechanics
(`jlink`, `jpackage`, multi-release JARs) and reflection/dynamic-proxy
internals live on
[Java Reflection, Dynamic Loading, And Packaging](./JAVA-DYNAMIC-JPMS-PACKAGING.md)
instead of here.

## Prerequisites

- Comfort with Java packages, JARs, and the classpath.
- [Java Reflection, Dynamic Loading, And Packaging](./JAVA-DYNAMIC-JPMS-PACKAGING.md)
  for how reflection resolves members at runtime.

## Core Terminology

- **Module**: a named, self-describing collection of packages with a
  `module-info.java` descriptor.
- **Readability**: module A "reads" module B when A declares `requires B`;
  the JVM only resolves types across a readability edge.
- **Accessibility**: even when A reads B, a type in B is only usable by A
  if B's package containing that type is `exported` (or `opened`) to A.
- **Unnamed module**: everything still on the classpath; it reads every
  other module, and every automatic module reads it, but named modules do
  not read it by default.
- **Automatic module**: a plain JAR placed on the module path without a
  descriptor; the JVM derives its name and exports every package, acting as
  a bridge during migration.

## Mental Model

```text
classpath:  every public type, everywhere, always reachable
module path: readability graph + per-package export list
             A can see B's type T only if:
               1. A requires B (readability), AND
               2. B exports (or opens) the package containing T
```

Strong encapsulation is the JVM enforcing rule 2 even for code that would
otherwise compile and link under the old classpath model — including
reflective access, which `opens` governs separately from `exports`.

## First Working Example

```java
// com.shopverse.pricing.spi / module-info.java
module com.shopverse.pricing.spi {
    exports com.shopverse.pricing.spi;
}
```

```java
// com.shopverse.pricing.spi/com/shopverse/pricing/spi/PricingProvider.java
package com.shopverse.pricing.spi;

public interface PricingProvider {
    long priceCents(String sku, int quantity);
}
```

```java
// com.shopverse.pricing.standard / module-info.java
module com.shopverse.pricing.standard {
    requires com.shopverse.pricing.spi;
    provides com.shopverse.pricing.spi.PricingProvider
        with com.shopverse.pricing.standard.StandardPricingProvider;
}
```

```java
// com.shopverse.checkout / module-info.java
module com.shopverse.checkout {
    requires com.shopverse.pricing.spi;
    uses com.shopverse.pricing.spi.PricingProvider;
}
```

```java
ServiceLoader<PricingProvider> loader = ServiceLoader.load(PricingProvider.class);
PricingProvider provider = loader.findFirst()
    .orElseThrow(() -> new IllegalStateException("No pricing provider on the module path"));
```

`com.shopverse.checkout` never declares `requires com.shopverse.pricing.standard`
— it only requires the SPI module and `uses` the service interface.
`ServiceLoader` locates whichever provider module is present on the module
path at launch, the same decoupling a classpath-based project would need a
separate dependency-injection framework to achieve.

## Example Progression

**Exports vs. opens.** `exports` grants compile-time and runtime API access
only; `opens` additionally grants deep reflection (the access `Hibernate`,
`Jackson`, and most DI frameworks need to read/set private fields or invoke
non-public constructors). A module that only `exports` a package containing
a JPA entity will throw at runtime the first time Hibernate tries to set a
private field reflectively — the fix is `opens ... to <framework module>`,
a qualified export that keeps that permission narrow rather than opening
the package to everyone.

**Qualified exports.** `exports com.shopverse.orders.internal to
com.shopverse.orders.batch;` grants access to one named module only — useful
for an internal package that a sibling module in the same team's codebase
legitimately needs, without making it part of the public API surface every
other consumer sees.

## How It Works / Internal Lifecycle

1. At startup, the module system resolves the module graph from the root
   modules (the application's own modules) outward, following `requires`
   edges, and fails fast if a required module is absent — a `module not
   found` error at launch, not a `NoClassDefFoundError` deep in a stack
   trace at first use the way a missing classpath JAR fails.
2. Package-level accessibility is computed per reader: the same package in
   module B can be visible to module A (exported to A specifically) and
   invisible to module C, something the classpath has no mechanism to
   express at all.
3. `ServiceLoader.load(...)` consults the resolved module graph's
   `provides ... with ...` declarations instead of scanning
   `META-INF/services` text files on the classpath, though the classpath
   form still works for unnamed-module code.

## Boundaries And Trade-Offs

- JPMS encapsulation is a genuine security/maintainability improvement over
  the classpath, but it is also friction: every reflective framework
  dependency (Hibernate, Jackson, most DI containers) needs an explicit
  `opens` directive or a blanket `--add-opens` on the command line, and
  getting this wrong turns a working classpath-based app into one that
  fails at startup the moment it is placed on the module path.
- Automatic modules let a project adopt the module path incrementally, but
  they export every package unconditionally — none of the encapsulation
  benefit applies until a dependency is actually modularized, so partial
  migration gives graph benefits (explicit `requires`) without the
  encapsulation benefit for those edges.
- `--add-opens`/`--add-exports` are an escape hatch for exactly this kind of
  friction, not a routine configuration knob; depending on command-line
  flags to make the application boot is a sign the module boundaries
  themselves need redesigning, not just patching.

## Failure Modes, Edge Cases, And Common Mistakes

- **`InaccessibleObjectException`**: thrown when reflective code (a
  framework, or `setAccessible(true)`) tries to reach into a package that is
  exported but not opened, or not exported/opened at all, to the caller's
  module. The fix is a targeted `opens <package> to <caller module>;`, not
  a global `opens` of the whole module.
- **Split packages**: two modules on the module path declaring the same
  package name is a resolution error at launch — unlike the classpath,
  where it silently resolves to whichever JAR's classes load first (a
  classic, hard-to-diagnose classpath bug that JPMS turns into a loud
  failure instead).
- **An unmodularized transitive dependency**: a library two levels down
  that only ships a plain JAR becomes an automatic module; it can still be
  used, but it cannot be depended on with the same compile-time guarantees
  (automatic module names derived from a JAR filename are not stable across
  releases), so pinning the exact artifact matters more once it is on the
  module path.
- **`uses` without a corresponding `provides` anywhere on the module path**:
  not an error — `ServiceLoader` simply returns no providers at runtime.
  Treat an empty result as a real production condition to handle (as the
  `orElseThrow` above does), not an assumption that a provider always
  exists.

## Production And Diagnostic Guidance

- Prefer `opens <package> to <specific module>;` over an unqualified
  `opens` or a command-line `--add-opens` flag — it documents exactly which
  framework needs deep reflection and does not expose that access to every
  other module on the path.
- `jdeps` can report a JAR's actual package dependencies against the JDK's
  own modules before committing to a migration, surfacing split packages
  and automatic-module risks before they become a launch-time failure.
- Treat a module's exported API — including its `uses`/`provides`
  declarations and any reflectively-accessed serialized form — as part of
  its public compatibility contract, the same evolution discipline this
  site requires for any other public interface.

## Tricky Interview Questions

**Two modules on the module path contain the same package. What happens,
and how does this differ from the same situation on the classpath?** JPMS
treats this as a split-package resolution error and refuses to launch; the
classpath instead silently resolves to whichever JAR's class loads first,
which can produce a `NoSuchMethodError` or inconsistent behavior that is
far harder to diagnose than a loud startup failure.

**A module `exports com.shopverse.orders.dto` but Hibernate still throws
`InaccessibleObjectException` trying to set a private field on an entity
in that package. Why didn't `exports` fix it?** `exports` only grants
compile-time/runtime type access, not deep reflection. Hibernate's
field-level reflective access requires `opens`, which is a separate,
stronger grant — the fix is `opens com.shopverse.orders.dto to
org.hibernate.orm.core;` (or the framework's actual module name), not
widening the `exports` directive.

**A lead engineer proposes modularizing one service's internal packages
purely for the "cleaner architecture," with no plan for its reflective
framework dependencies. What is the actual risk, and what would you ask for
before approving it?** The risk is a working application that fails at
startup once every ORM/DI/serialization library's reflective access points
are blocked by default; ask for an inventory of which packages those
frameworks need `opens` into before migrating, and a `jdeps` pass against
every transitive dependency to confirm none of them introduce a split
package once moved onto the module path.

## Summary / Review Checklist

- The classpath makes every public type reachable everywhere; JPMS adds a
  readability graph (`requires`) plus a per-reader accessibility check
  (`exports`/`opens`) the JVM itself enforces.
- `exports` ≠ `opens`: reflective frameworks need the latter, scoped with a
  qualified `opens ... to ...` where possible.
- `ServiceLoader` + `uses`/`provides` decouples a consumer module from any
  specific provider module, resolved from the module graph at launch.
- Automatic modules bridge migration but keep the classpath's "export
  everything" behavior until the dependency itself is modularized.
- A split package or a missing `opens` fails loudly and early under JPMS,
  versus silently or deep in a stack trace under the classpath.

## Recommended Next

Continue with
[Java Reflection, Dynamic Loading, And Packaging](./JAVA-DYNAMIC-JPMS-PACKAGING.md)
for how reflection, dynamic proxies, and `jlink`/`jpackage` interact with
the module boundaries described here.

## Official References

- [JPMS specification (Project Jigsaw)](https://openjdk.org/projects/jigsaw/spec/)
- [`java.lang.module` package](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/module/package-summary.html)
- [`ServiceLoader` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/ServiceLoader.html)
