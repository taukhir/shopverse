---
title: "OpenAPI Contracts And Generated DTO Artifacts"
description: "A contract-first retail tutorial for defining checkout APIs, generating Java DTOs with Gradle Kotlin DSL, publishing versioned artifacts, and consuming them from Quarkus projects."
sidebar_label: "OpenAPI Contract Artifacts"
tags: ["amway", "openapi", "quarkus", "gradle", "api-contracts", "code-generation"]
page_type: Tutorial
difficulty: Intermediate
status: maintained
prerequisites: [Java 21 fundamentals, Gradle Kotlin DSL fundamentals, REST fundamentals]
learning_objectives: [Explain why OpenAPI is needed, Design a retail checkout contract, Generate Java DTOs in a Gradle subproject, Publish a versioned Maven artifact, Consume and map generated DTOs safely, Evolve API contracts compatibly]
technologies: [OpenAPI, OpenAPI Generator, Java 21, Gradle Kotlin DSL, Quarkus REST, MicroProfile REST Client, MapStruct, Maven repositories]
last_reviewed: "2026-08-21"
scope: generic
owner: docs-architecture
reviewer: documentation-maintainers
review_evidence: user-provided-stack-and-official-documentation-review
---

# OpenAPI Contracts And Generated DTO Artifacts

<DocLabels items={[{label: 'Contract first', tone: 'intermediate'}, {label: 'Retail checkout', tone: 'domain'}, {label: 'Artifact publishing', tone: 'production'}]} />

This tutorial explains the reported Amway Next Gen pattern: define the HTTP
contract in OpenAPI, generate Java DTOs or clients, publish an immutable artifact,
and consume a selected version in checkout or another project. The examples are
realistic retail examples, not confirmation of Amway's internal endpoint names,
package names, artifact repository, or release process. Verify those details in
the actual specification, Gradle build, pipeline, and repository settings.

## 1. Why OpenAPI Is Needed

An HTTP endpoint is more than a URL. Its contract includes methods, parameters,
headers, authentication, request and response shapes, validation rules, status
codes, and errors. If each team describes those details in Java classes, tickets,
and wiki pages independently, they drift.

The OpenAPI Specification is a language-neutral description of an HTTP API. A
machine can use the same file to generate documentation and code, validate
requests, create mocks, drive tests, and review compatibility. This gives a
checkout pod several benefits:

- provider and consumer teams can work from one reviewed boundary;
- generated DTOs remove repetitive serialization and annotation code;
- consumers select an explicit contract version instead of copying classes;
- account, profile, cart, checkout, and post-checkout fields become discoverable;
- CI can detect an invalid or breaking contract before publication;
- security reviewers can see operations, authentication, and exposed data.

OpenAPI does **not** prove that pricing is correct, the caller owns a profile, an
idempotency key works, or compensation succeeds. Those are runtime behavior and
need implementation, authorization, integration, and failure-path tests.

### Contract first versus code first

In a contract-first workflow, teams review the OpenAPI file before implementation
and generate code from it. In a code-first workflow, annotations on implemented
resources produce an OpenAPI document. Both are valid, but contract first is a
strong fit when multiple projects consume a published contract.

<DocCallout type="production" title="Pin supported versions">

The latest OpenAPI Specification and the version supported by a team's generator
are not necessarily the same. This tutorial uses OpenAPI 3.0.3 for broad tooling
compatibility. Pin the approved OpenAPI Generator version in the Gradle version
catalog, confirm its supported specification dialect, and upgrade deliberately.

</DocCallout>

## 2. The Three Artifacts

Do not use “the API artifact” for three different things:

| Deliverable | Example coordinate | Used for |
|---|---|---|
| Specification | `checkout-api-spec:1.4.0` | language-neutral source, linting, mocks, tests, other generators |
| Java models | `checkout-api-model:1.4.0` | generated request, response, error, and value DTOs |
| Java client | `checkout-api-client:1.4.0` | typed outbound HTTP calls plus models |

A small team may initially publish the specification and models together. Separate
coordinates scale better because a Python or TypeScript consumer only needs the
specification, and a Java provider does not automatically need an HTTP client.

Generated classes are transport models. They must not become Hibernate entities,
DynamoDB records, or core domain aggregates. Map them at the application boundary:

```text
HTTP JSON
  → generated CheckoutSubmission DTO
  → MapStruct/manual validation and mapping
  → SubmitCheckoutCommand
  → checkout domain
  → CheckoutResult
  → generated CheckoutReceipt DTO
  → HTTP JSON
```

This protects the domain when a consumer-facing field is renamed or an optional
field is added.

## 3. Write A Retail Checkout Contract

Create `checkout-api-contract/src/main/openapi/checkout-api.yaml`:

```yaml
openapi: 3.0.3
info:
  title: Checkout API
  version: 1.4.0
  description: Creates a checkout order from a priced cart.
servers:
  - url: https://api.example.test
paths:
  /checkout-carts/{cartId}/orders:
    post:
      operationId: submitCheckout
      summary: Submit a cart for checkout
      parameters:
        - name: cartId
          in: path
          required: true
          schema: { type: string, minLength: 1, maxLength: 64 }
        - name: Idempotency-Key
          in: header
          required: true
          description: Stable key for one logical checkout attempt.
          schema: { type: string, minLength: 16, maxLength: 128 }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CheckoutSubmission'
            example:
              accountId: acc-4821
              profileId: profile-310
              deliveryAddressId: address-18
              paymentInstrumentToken: tok_example_only
              lines:
                - sku: SKU-VIT-C-100
                  quantity: 2
      responses:
        '201':
          description: Checkout accepted and order created.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/CheckoutReceipt' }
        '400':
          description: Invalid request.
          content:
            application/problem+json:
              schema: { $ref: '#/components/schemas/Problem' }
        '409':
          description: Cart state or idempotency conflict.
          content:
            application/problem+json:
              schema: { $ref: '#/components/schemas/Problem' }
components:
  schemas:
    CheckoutSubmission:
      type: object
      required: [accountId, profileId, deliveryAddressId,
                 paymentInstrumentToken, lines]
      properties:
        accountId: { type: string, minLength: 1, maxLength: 64 }
        profileId: { type: string, minLength: 1, maxLength: 64 }
        deliveryAddressId: { type: string, minLength: 1, maxLength: 64 }
        paymentInstrumentToken:
          type: string
          minLength: 1
          writeOnly: true
          description: Opaque provider token; never raw card data.
        lines:
          type: array
          minItems: 1
          maxItems: 100
          items: { $ref: '#/components/schemas/CheckoutLine' }
    CheckoutLine:
      type: object
      required: [sku, quantity]
      properties:
        sku: { type: string, minLength: 1, maxLength: 64 }
        quantity: { type: integer, format: int32, minimum: 1, maximum: 99 }
    CheckoutReceipt:
      type: object
      required: [orderId, status, total]
      properties:
        orderId: { type: string }
        status:
          type: string
          enum: [ACCEPTED, CONFIRMED, REJECTED]
        total: { $ref: '#/components/schemas/Money' }
    Money:
      type: object
      required: [amount, currency]
      properties:
        amount: { type: string, pattern: '^-?[0-9]+\\.[0-9]{2}$' }
        currency: { type: string, pattern: '^[A-Z]{3}$' }
    Problem:
      type: object
      required: [type, title, status]
      properties:
        type: { type: string, format: uri }
        title: { type: string }
        status: { type: integer, format: int32 }
        code: { type: string }
        correlationId: { type: string }
```

The request sends stable references, not full account, profile, address, or
payment documents. The service must authenticate the caller and verify that those
references are owned and eligible. It must also reprice or verify the cart on the
server; client-supplied prices are not authoritative.

## 4. Create The Gradle Multi-Project Module

One possible structure is:

```text
checkout-platform/
├── settings.gradle.kts
├── gradle/libs.versions.toml
├── checkout-api-contract/
│   ├── build.gradle.kts
│   └── src/main/openapi/checkout-api.yaml
├── checkout-service/
└── post-checkout-service/
```

Register the module:

```kotlin
// settings.gradle.kts
include("checkout-api-contract", "checkout-service", "post-checkout-service")
```

Pin the generator plugin through the existing version catalog. The alias names
below are examples; follow the project's convention:

```toml
# gradle/libs.versions.toml
[versions]
openapi-generator = "<approved-version>"

[plugins]
openapi-generator = {
  id = "org.openapi.generator",
  version.ref = "openapi-generator"
}
```

Configure generation and publication in
`checkout-api-contract/build.gradle.kts`:

```kotlin
plugins {
    `java-library`
    `maven-publish`
    alias(libs.plugins.openapi.generator)
}

group = "com.example.checkout.contract"
version = providers.gradleProperty("contractVersion").orElse("1.4.0").get()

java {
    toolchain.languageVersion.set(JavaLanguageVersion.of(21))
    withSourcesJar()
}

val contractFile = layout.projectDirectory.file(
    "src/main/openapi/checkout-api.yaml"
)
val generatedDir = layout.buildDirectory.dir("generated/openapi")

openApiValidate {
    inputSpec.set(contractFile)
}

openApiGenerate {
    generatorName.set("java")
    inputSpec.set(contractFile)
    outputDir.set(generatedDir)
    modelPackage.set("com.example.checkout.contract.model")
    globalProperties.set(mapOf(
        "models" to "",
        "apis" to "false",
        "supportingFiles" to "false",
        "modelDocs" to "false",
        "modelTests" to "false"
    ))
    configOptions.set(mapOf(
        "dateLibrary" to "java8",
        "serializationLibrary" to "jackson",
        "useJakartaEe" to "true",
        "openApiNullable" to "false"
    ))
}

sourceSets.main {
    java.srcDir(generatedDir.map { it.dir("src/main/java") })
}

tasks.named<JavaCompile>("compileJava") {
    dependsOn(tasks.named("openApiValidate"), tasks.named("openApiGenerate"))
}

dependencies {
    api("com.fasterxml.jackson.core:jackson-annotations")
    api("jakarta.validation:jakarta.validation-api")
}

publishing {
    publications {
        create<MavenPublication>("checkoutModels") {
            from(components["java"])
            artifactId = "checkout-api-model"
        }
    }
    repositories {
        maven {
            name = "internal"
            url = uri(providers.gradleProperty("internalRepositoryUrl").get())
            credentials(PasswordCredentials::class)
        }
    }
}
```

Generator templates and versions can change imports and required dependencies.
Run generation, inspect the generated imports and publication POM, then adjust
dependencies to the approved Quarkus platform. Never hand-edit generated files;
change the specification or controlled generator configuration and regenerate.

## 5. Generate And Test Locally

From the repository root on Windows:

```powershell
.\gradlew.bat :checkout-api-contract:openApiValidate
.\gradlew.bat :checkout-api-contract:clean :checkout-api-contract:build
.\gradlew.bat :checkout-api-contract:publishToMavenLocal `
  -PcontractVersion=1.4.0-local
```

`publishToMavenLocal` is useful for a developer feedback loop. CI and released
consumers should resolve immutable versions from the approved internal Maven
repository, such as CodeArtifact, Artifactory, or Nexus. Confirm which one the
project actually uses.

Check that:

1. validation rejects an invalid contract;
2. a clean build reproduces the same public Java API;
3. the JAR contains only intended packages and no credentials or generated noise;
4. the POM declares dependencies needed by consumers;
5. serialization and validation tests cover representative retail payloads.

## 6. Publish In CI

A safe contract pipeline is:

```text
lint and validate specification
  → generate from pinned tool and templates
  → compile and unit/serialization test
  → compare with last released contract
  → inspect dependency and security reports
  → publish immutable version
  → run a consumer smoke test
  → tag/release with provenance
```

Publish only after the version is approved. Do not overwrite `1.4.0` with new
bytes. Do not make production releases depend on `mavenLocal()` or mutable
snapshots. Keep repository credentials in the CI secret facility, scope them to
the required repository, and never place tokens in the specification or Gradle
source.

The specification itself can be added to a dedicated spec JAR:

```kotlin
val openApiSpec by tasks.registering(Jar::class) {
    archiveClassifier.set("openapi")
    from("src/main/openapi")
}

publishing.publications.named<MavenPublication>("checkoutModels") {
    artifact(openApiSpec)
}
```

For independent lifecycle and language-neutral discovery, publish that classifier
or file as a separate `checkout-api-spec` module according to repository policy.

## 7. Consume The DTO Artifact

In another Java or Quarkus project:

```kotlin
repositories {
    maven {
        name = "internal"
        url = uri(providers.gradleProperty("internalRepositoryUrl").get())
        credentials(PasswordCredentials::class)
    }
}

dependencies {
    implementation(
        "com.example.checkout.contract:checkout-api-model:1.4.0"
    )
}
```

With a repository named `internal`, Gradle can receive the username and password
as externally injected `internalUsername` and `internalPassword` properties. The
CI secret facility should provide them at execution time; they do not belong in
the build file or a committed `gradle.properties` file.

Map the DTO into an internal command instead of passing it through the domain:

```java
@Mapper(
    componentModel = MappingConstants.ComponentModel.CDI,
    unmappedTargetPolicy = ReportingPolicy.ERROR
)
public interface CheckoutContractMapper {

    @Mapping(target = "idempotencyKey", source = "idempotencyKey")
    SubmitCheckoutCommand toCommand(
        CheckoutSubmission dto,
        String cartId,
        String idempotencyKey
    );

    CheckoutReceipt toReceipt(CheckoutResult result);
}
```

The resource remains responsible for authenticated context and HTTP concerns;
the application service owns authorization and business behavior:

```java
@POST
@Path("/checkout-carts/{cartId}/orders")
public Response submit(
        @PathParam("cartId") String cartId,
        @HeaderParam("Idempotency-Key") String idempotencyKey,
        @Valid CheckoutSubmission request) {
    var command = mapper.toCommand(request, cartId, idempotencyKey);
    var result = checkout.submit(command, currentPrincipal());
    return Response.status(201).entity(mapper.toReceipt(result)).build();
}
```

If consumers need a typed HTTP client, generate a separate client artifact from
the same specification using the approved Java generator library option, such as
MicroProfile Rest Client. Test its exact Quarkus compatibility before publishing.
Do not make every consumer import a large client runtime just to obtain DTOs.

## 8. Evolve The Contract Safely

Typical compatibility decisions are:

| Change | Usually | Why |
|---|---|---|
| add an optional response property | compatible | tolerant consumers can ignore it |
| add an optional request property | compatible | older callers can omit it |
| add a required request property | breaking | existing callers do not send it |
| remove or rename a property/operation | breaking | compiled/runtime consumers depend on it |
| narrow validation or change a status code | potentially breaking | previously valid behavior changes |
| add an enum value | potentially breaking | exhaustive consumer switches may fail |

“Usually” is deliberate. Compatibility depends on organization rules and actual
consumers. Run an OpenAPI-aware diff against the last released specification,
review semantic changes, and test important consumers. For breaking evolution:

1. document and announce the new contract;
2. add a new operation or major API version when coexistence is required;
3. publish a new immutable artifact version;
4. migrate consumers independently;
5. observe usage and remove the old contract only after the agreed window.

The `info.version`, Maven artifact version, API path version, and application
release version have different purposes. Define how they relate in team policy;
do not assume they must always be identical.

## 9. Security And Data Rules

- Model references such as `accountId` and `profileId`; do not embed entire
  identity documents without a contract need.
- Never include raw card data, passwords, access tokens, production identifiers,
  addresses, or real customer examples.
- Mark sensitive write-only fields where useful, but remember that annotations do
  not prevent logs, traces, or exceptions from leaking values.
- Require authentication in the contract and authorization in implementation.
- Avoid remote `$ref` files from untrusted locations; generators process external
  input and templates as part of the build.
- Pin generator plugins, templates, and dependencies; review upgrades and scan
  generated dependencies.
- Avoid high-cardinality account, cart, profile, or order identifiers in metrics.

## 10. Common Failure Modes

- **Generated source does not compile:** inspect generated imports, generator
  options, Jakarta versus Javax selection, and missing annotation dependencies.
- **Build sometimes uses stale DTOs:** generate into `build/`, wire compilation to
  the generation task, and verify with a clean build.
- **Consumer resolves but fails at runtime:** compare Jackson, validation, and
  client-runtime compatibility with the consumer's Quarkus BOM.
- **DTO artifact pulls many dependencies:** publish model-only and client artifacts
  separately and inspect the generated POM.
- **Producer changed a field without a major release:** restore the old shape or
  run a planned compatibility migration; publishing a new JAR alone does not make
  the HTTP change safe.
- **Same DTO used as database entity:** introduce explicit mapping and keep storage
  evolution inside the owning service.
- **Account/profile data leaks into examples or telemetry:** replace with synthetic
  values and configure request/response redaction.

## Practical Completion Checklist

- [ ] The OpenAPI file is the reviewed source of truth for the boundary.
- [ ] Operation IDs, validation, errors, security, and examples are intentional.
- [ ] Generator and specification dialect versions are pinned.
- [ ] Clean Gradle generation is deterministic and never hand-edited.
- [ ] Models, specification, and optional client artifacts have clear ownership.
- [ ] Artifact versions are immutable and published from CI with provenance.
- [ ] Consumers map generated DTOs to their own domain/application models.
- [ ] Compatibility diff and provider/consumer tests gate releases.
- [ ] No customer data, credentials, payment data, or secrets enter artifacts.

## Related Learning

- [Amway Project Technology Stack](./AMWAY-PROJECT-TECH-STACK.md)
- [API Contract Governance](./governance/API-CONTRACT-GOVERNANCE.md)
- [Quarkus OpenAPI Fundamentals](../quarkus/QUARKUS-OPENAPI-FUNDAMENTALS.md)
- [Quarkus OpenAPI Provider](../quarkus/QUARKUS-OPENAPI-PROVIDER.md)
- [Quarkus OpenAPI Client Artifacts](../quarkus/QUARKUS-OPENAPI-CLIENT-ARTIFACTS.md)

## Official References

- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [OpenAPI Generator Gradle Plugin](https://github.com/OpenAPITools/openapi-generator/blob/master/modules/openapi-generator-gradle-plugin/README.adoc)
- [OpenAPI Generator Java Options](https://openapi-generator.tech/docs/generators/java/)
- [OpenAPI Generator Integrations](https://openapi-generator.tech/docs/integrations/)
- [Gradle Maven Publish Plugin](https://docs.gradle.org/current/userguide/publishing_maven.html)
