---
title: "MapStruct: Generated Mappers And Custom Methods"
description: "Learn compile-time mapping, handwritten methods, qualifiers, nested objects, updates, null strategies, dependency injection, and debugging."
sidebar_label: "MapStruct Deep Dive"
page_type: Deep Dive
difficulty: Intermediate
status: maintained
prerequisites: [Java interfaces, JavaBeans or records, Basic dependency injection]
learning_objectives:
  - Trace a mapper declaration into generated Java and handwritten helper calls
  - Choose explicit mapping rules and null behavior for create and update operations
  - Diagnose method selection and annotation processor failures
technologies: [Java, MapStruct, Spring, Quarkus]
last_reviewed: "2026-10-20"
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: official-mapstruct-reference-and-generated-code-walkthrough
---

# MapStruct: Generated Mappers And Custom Methods

MapStruct generates ordinary Java mapping code during compilation. That generated
code can call methods you write yourself. Understanding this relationship explains
why a project contains both generated mapper implementations and custom methods.

This is a learning guide with fictional commerce models, not a description of
proprietary Amway code or a claim that ShopVerse services implement these examples.
Read the [Amway technology-stack guide](../architecture/AMWAY-PROJECT-TECH-STACK.md)
for the surrounding onboarding context.

## 1. The Compilation And Runtime Model

```text
Mapper interface + model types + annotations + handwritten helpers
                         |
                  Java compilation
                         |
              MapStruct annotation processor
                         |
                 CustomerMapperImpl.java
                         |
                 Compiled implementation
                         |
            Application invokes ordinary Java methods
```

There are two separate moments: the build generates the implementation; runtime
calls it. MapStruct does not interpret mapping annotations on each request.
The generated code uses method calls rather than reflection for mapping.
See the [official introduction](https://mapstruct.org/documentation/stable/reference/html/#introduction).

## 2. A Small Mapping You Can Trace

These complete type declarations use Java 17 records. Put each public type in
its own matching file. JavaBeans with getters/setters work too; generated code
then uses their accessors rather than record accessors and constructors.

```java title="Customer.java"
public record Customer(Long id, String name, String email) {
}
```

```java title="CustomerResponse.java"
public record CustomerResponse(Long id, String displayName, String email) {
}
```

```java title="CustomerMapper.java"
import java.util.Locale;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@Mapper(unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface CustomerMapper {

    @Mapping(target = "displayName", source = "name")
    @Mapping(target = "email", source = "email",
             qualifiedByName = "normalizeEmail")
    CustomerResponse toResponse(Customer source);

    @Named("normalizeEmail")
    default String normalizeEmail(String value) {
        return value == null ? null : value.trim().toLowerCase(Locale.ROOT);
    }
}
```

`id` matches by name. `displayName` explicitly reads `name`. The email rule
selects a handwritten transformation. Lowercasing an entire email is only a
teaching policy here; apply the normalization rules agreed by your application.

MapStruct produces code equivalent to the following. Exact generated formatting,
annotations, and local-variable names can vary; do not create this file manually.

```java title="Equivalent generated implementation"
public class CustomerMapperImpl implements CustomerMapper {
    @Override
    public CustomerResponse toResponse(Customer source) {
        if (source == null) {
            return null;
        }
        return new CustomerResponse(
                source.id(),
                source.name(),
                normalizeEmail(source.email())
        );
    }
}
```

The implementation inherits the default method. MapStruct supplies `toResponse`;
you supply `normalizeEmail`. Both execute in the same call flow.
See [custom methods](https://mapstruct.org/documentation/stable/reference/html/#adding-custom-methods).

## 3. Build Setup And A First Execution

For a standalone Gradle Java project, this Kotlin DSL fragment supplies both
annotations and the annotation processor. Version 1.6.3 is the baseline used by
this guide, not an instruction to upgrade an existing application.

```kotlin title="build.gradle.kts dependency fragment"
plugins {
    java
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(17))
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.mapstruct:mapstruct:1.6.3")
    annotationProcessor("org.mapstruct:mapstruct-processor:1.6.3")
}
```

Use the existing wrapper's `compileJava` task to generate and compile the mapper.
Gradle commonly writes generated sources beneath
`build/generated/sources/annotationProcessor/java/main`; Maven commonly uses
`target/generated-sources/annotations`. Build configuration can override these.

This main class exercises the mapper without a dependency injection framework:

```java title="MappingDemo.java"
import org.mapstruct.factory.Mappers;

public class MappingDemo {
    public static void main(String[] args) {
        CustomerMapper mapper = Mappers.getMapper(CustomerMapper.class);
        CustomerResponse result = mapper.toResponse(
                new Customer(42L, "Example Customer", "  DEMO@example.invalid  "));

        if (!"Example Customer".equals(result.displayName())
                || !"demo@example.invalid".equals(result.email())
                || mapper.toResponse(null) != null) {
            throw new AssertionError("Unexpected mapping result");
        }
    }
}
```

The assertions are a small exercise, not a replacement for a test suite. This
page's snippets are instructional and are not compiled by the documentation build.
See [Gradle setup](https://mapstruct.org/documentation/stable/reference/html/#gradle).

## 4. Automatic Mapping And Explicit Rules

| Situation | Typical declaration or behavior |
|---|---|
| Same property name and compatible types | Implicit mapping |
| Different property names | `@Mapping(target = "displayName", source = "name")` |
| Intentionally excluded target | `@Mapping(target = "internalNote", ignore = true)` |
| Only explicitly selected fields should be exposed | `@BeanMapping(ignoreByDefault = true)` |
| Missing target mappings should fail the build | `unmappedTargetPolicy = ReportingPolicy.ERROR` |

Strict target reporting detects omissions; it does not detect every security
mistake. A new same-name property can still map automatically. For public
responses or customer update requests, consider an explicit allowlist and tests
that assert sensitive or server-owned fields stay excluded.

Mapping describes representation. Authorization, price calculation, payment
decisions, and valid order-state transitions belong in explicit application or
domain logic before a result is mapped.

## 5. How Custom Method Selection Works

MapStruct considers eligible mapping methods and conversions using source and
target types. A method name by itself is not a field-specific selection rule.
An unqualified `String -> String` helper can affect multiple string properties.
Two eligible conversions can produce an ambiguous-mapping compilation error.

`qualifiedByName = "normalizeEmail"` selects an appropriately typed method
annotated with `org.mapstruct.Named("normalizeEmail")`. Do not accidentally
import an injection framework's `Named`. A qualifier does not make an incompatible
method signature valid.

For larger codebases, a custom annotation marked with `org.mapstruct.Qualifier`
and class retention supports selection through `qualifiedBy`. Annotation-based
qualifiers are easier to refactor safely than string names.
See the [selection FAQ](https://mapstruct.org/faq/) and
[qualifiers](https://mapstruct.org/documentation/stable/reference/html/#mapping-method-selection-based-on-qualifiers).

## 6. What A Custom Mapper Can Mean

| Mechanism | Suitable use | Important distinction |
|---|---|---|
| Interface default method | Small pure transformation | Generated implementation inherits it |
| Concrete method in an abstract mapper | Shared handwritten logic | Generated class extends the abstract mapper |
| Helper mapper through `uses` | Reusable address or money representation | Helper must be eligible and available through the chosen component model |
| `@BeforeMapping` / `@AfterMapping` | Applicable preparation or finishing logic | Invocation depends on compatible parameters and qualifiers |
| Decorator | Wrap a mapping operation | Wiring depends on component model |
| `@ObjectFactory` | Control target creation | Creates the target; it does not replace every property mapping |

Do not assume an `@AfterMapping` method runs just because its name looks correct.
Check the generated call. Builder targets require particular care: a hook that
modifies the builder needs the builder as its mapping target. See
[customization](https://mapstruct.org/documentation/stable/reference/html/#customizing-mappings).

## 7. Nested Objects, Collections, And Reuse

A rule such as `@Mapping(target = "city", source = "address.city")` flattens a
nested value. Generated access normally includes checks for intermediate nulls;
a handwritten Java expression needs its own handling.

If a source property is `Address` and the target property is `AddressResponse`,
declare the conversion locally or reference an `AddressMapper` through
`@Mapper(uses = AddressMapper.class)`. MapStruct can also generate certain nested
bean mappings automatically. Inspect those generated mappings when strict
field selection matters.

For `List<CustomerResponse> toResponses(List<Customer> source)`, MapStruct can
generate a loop that maps elements through an eligible customer conversion.
Qualify element mapping with `@IterableMapping` when alternatives are ambiguous.
An empty input and a null input are different cases; test both.

Copying a collection does not imply a deep copy of every contained object.
If element references are directly assignable, they may be reused. See
[collections](https://mapstruct.org/documentation/stable/reference/html/#mapping-collections).

## 8. Create Versus Update And Null Semantics

A create mapping returns a new target. An update mapping receives an existing
mutable target through `@MappingTarget`. The following is a method fragment for
an application mapper whose request and entity classes already exist:

```java
@BeanMapping(
    ignoreByDefault = true,
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
@Mapping(target = "displayName", source = "displayName")
void update(ProfilePatch source, @MappingTarget ProfileEntity target);
```

The annotations and strategies above are from `org.mapstruct`. This explicitly
permits one property and preserves its existing value when the source property
is null. It does not change the entity's authorization or persistence semantics.

| Setting | Question it answers |
|---|---|
| `NullValueMappingStrategy` | What should the whole method return for a null source argument? |
| `NullValuePropertyMappingStrategy` | What happens to target properties for null or absent source values in update mappings? |
| `NullValueCheckStrategy` | When should generated code insert source null checks? |

Your handwritten helper should accept null safely when its call path can supply
null. Do not assume a generated check always protects a custom conversion.

Ignoring nulls is not a complete PATCH design: a plain nullable property cannot
distinguish an omitted field from an explicit request to clear it. Use an explicit
presence model where that distinction is required. Collection update behavior
also depends on accessors and collection strategy; mapping alone does not define
JPA association reconciliation or orphan removal.
See [null strategies](https://mapstruct.org/documentation/stable/reference/html/#controlling-mapping-result-for-null-properties-in-bean-mappings).

## 9. Spring, Quarkus, And Context

Choose the component model matching the application. Spring projects commonly
use `componentModel = "spring"`; Quarkus applications can use
`MappingConstants.ComponentModel.JAKARTA_CDI` for Jakarta CDI. Inject the managed
mapper into the consuming service. Use `Mappers.getMapper` for the default model,
as in the standalone exercise, rather than bypassing framework injection.

`uses` helpers should fit the same dependency-injection setup. Constructor
injection can make generated mapper dependencies easier to understand and test.
See [dependency injection](https://mapstruct.org/documentation/stable/reference/html/#using-dependency-injection).

An `@Context` parameter carries caller-supplied state, such as locale or an
identity map for cycle avoidance, into applicable nested mapping methods and
hooks. MapStruct does not create missing context arguments. Avoid mutable
request-specific fields on singleton mappers; pass per-call state explicitly.
See [mapping context](https://mapstruct.org/documentation/stable/reference/html/#passing-context).

## 10. Expressions, Defaults, And Shared Configuration

Use a typed helper when a transformation deserves independent tests. An
`expression = "java(...)"` inserts Java text into generated code, so errors can
surface during compilation of that code. Expressions are harder to refactor
than ordinary method calls.

`defaultValue` supplies a string-based fallback for a null source property;
`constant` supplies a fixed value. Conversion and qualifiers still matter.
`defaultExpression` supplies Java for a fallback. Avoid inventing business
defaults, such as a payment status, merely to satisfy mapping.

A shared `@MapperConfig` can centralize reporting policy, component model, and
injection strategy. `@InheritConfiguration` reuses applicable mapping rules;
`@InheritInverseConfiguration` helps with inverse mappings but cannot recover
information lost by flattening or custom transformations. Inspect exclusions
such as expressions and defaults before treating an inverse as symmetric.

See [advanced options](https://mapstruct.org/documentation/stable/reference/html/#advanced-mapping-options)
and [configuration reuse](https://mapstruct.org/documentation/stable/reference/html/#reusing-mapping-configurations).

## 11. Debugging And Verification

| Symptom | First boundary to inspect |
|---|---|
| No implementation generated | Processor dependency, annotation processing, compile errors |
| Unknown source property | Actual accessor names, source parameter name, Lombok processing |
| Ambiguous conversion | Eligible methods, their types, and qualifiers |
| Qualifier error | Correct `Named` import, matching name, compatible signature |
| Mapper bean unavailable | Generated component annotation and framework discovery |
| Null unexpectedly overwrites a value | Create/update distinction and effective null strategy |
| Unexpected nested conversion or helper call | Generated implementation and inherited configuration |

For Lombok 1.18.16 or newer, consult MapStruct's documented
`lombok-mapstruct-binding` processor setup. Do not fix missing accessors by
hand-editing generated implementations.

For each meaningful mapping, test renamed fields, null input, null nested values,
empty collections, custom transformations, and excluded properties. Update tests
should start with an existing target and verify both preservation and intentional
changes. Include framework wiring checks when injected helper mappers matter.
Generated code still needs behavioral tests for the rules you selected.
See [the official FAQ](https://mapstruct.org/faq/).

## 12. Practice And Reading Order

1. Compile the small example and locate `CustomerMapperImpl`.
2. Predict the three constructor arguments before opening generated code.
3. Set email to null and trace the helper call.
4. Add a target field without a source and observe strict reporting.
5. Add a second qualified email transformation and select it explicitly.
6. Introduce an address mapper, then inspect the generated delegation.
7. Compare a create mapping with an update on an existing mutable target.

Be able to explain why a qualifier selects a conversion, why null ignoring is
not full PATCH semantics, and why a mapper is not an authorization boundary.

Continue with [the Amway stack](../architecture/AMWAY-PROJECT-TECH-STACK.md),
[Quarkus REST and CDI](../quarkus/QUARKUS-REST-CDI-CONFIG.md), or the
[official MapStruct reference](https://mapstruct.org/documentation/stable/reference/html/).
