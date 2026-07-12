---
title: Reflection, Method Handles, JPMS And Java Packaging
description: Dynamic invocation, proxies, annotations, agents, module boundaries, services, images, and compatibility.
---

# Reflection, Method Handles, JPMS And Java Packaging

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

JPMS makes dependencies and accessibility explicit:

```java
module com.shopverse.orders {
    requires java.net.http;
    exports com.shopverse.orders.api;
    opens com.shopverse.orders.dto to com.fasterxml.jackson.databind;
    uses com.shopverse.spi.PricingProvider;
}
```

`exports` grants compile/runtime API access; `opens` grants deep reflection.
Qualified forms restrict recipients. Automatic and unnamed modules support
migration but weaken clarity; split packages are prohibited across named modules.
`ServiceLoader` connects `uses` with provider `provides` declarations.

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

Run the loader/module labs in [Senior Labs](./JAVA-SENIOR-LABS-INTERVIEW.md).
