---
title: "Generate And Verify OpenAPI From Quarkus"
description: "Intermediate tutorial for documenting a Quarkus provider, exporting its contract, and preventing implementation-to-contract drift."
sidebar_label: "4. Provider Contract"
tags: ["quarkus", "openapi", "contract-testing", "tutorial"]
page_type: Tutorial
difficulty: Intermediate
status: maintained
prerequisites: [OpenAPI fundamentals, Jakarta REST and validation]
learning_objectives: [Document success and failure responses, Export a repeatable schema artifact, Test the provider contract]
technologies: [Quarkus REST, SmallRye OpenAPI, MicroProfile OpenAPI]
last_reviewed: "2026-08-13"
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: official-documentation-review
---

# Generate And Verify OpenAPI From Quarkus

This tutorial treats the generated document as a build output that needs review,
not as automatically correct documentation.

## 1. Make The Resource Explicit

```java
@Path("/customers")
@Produces(MediaType.APPLICATION_JSON)
public class CustomerResource {

    @GET
    @Path("/{customerId}")
    @Operation(operationId = "getCustomer", summary = "Find one customer")
    @APIResponse(responseCode = "200", description = "Customer found")
    @APIResponse(responseCode = "404", description = "Customer not found")
    public CustomerView get(@PathParam("customerId") String customerId) {
        return service.findOwnedCustomer(customerId);
    }
}
```

Use annotations to clarify semantics that scanning cannot infer reliably:
stable operation IDs, error responses, headers, security requirements, and
examples. Keep validation constraints on boundary models so generated schemas
can expose useful limits.

## 2. Add API-Level Metadata

```java
@OpenAPIDefinition(
    info = @Info(title = "Customer API", version = "1.0.0"),
    tags = @Tag(name = "customers", description = "Customer-owned resources"))
public class CustomerApplication extends Application {}
```

Import these types from `org.eclipse.microprofile.openapi.annotations`. Avoid
advertising a production server URL that is only correct on one developer's
machine.

## 3. Export A Repeatable Artifact

Configure a build output directory:

```properties
quarkus.smallrye-openapi.store-schema-directory=target/openapi
```

Then package the application:

```powershell
.\mvnw.cmd clean verify
Get-ChildItem target\openapi
```

The exported YAML or JSON can be linted, diffed against a released baseline,
published separately, or packaged for consumers. Do not edit generated files in
`target`; change the source annotations or canonical static document.

If a design-first contract is canonical, place it under
`src/main/resources/META-INF/openapi.yaml` and consider disabling annotation
scanning with `mp.openapi.scan.disable=true`. Choose one ownership model and add
a drift gate; silently merging competing definitions hides mistakes.

## 4. Verify The Running Boundary

```java
@QuarkusTest
class OpenApiContractTest {
    @Test
    void exposesTheCustomerOperation() {
        given()
            .when().get("/q/openapi?format=json")
            .then()
            .statusCode(200)
            .body("paths.'/customers/{customerId}'.get.operationId",
                  equalTo("getCustomer"));
    }
}
```

Also test actual `200`, malformed input, unauthenticated, forbidden, not-found,
and unexpected-failure responses. A document assertion proves publication; HTTP
tests prove that implementation behavior agrees with the advertised contract.

## Failure Modes

- generated schemas expose internal persistence fields;
- `200` is documented while the resource returns `204` or another error shape;
- every build changes operation IDs, breaking generated clients;
- production Swagger UI exposes an avoidable attack and discovery surface;
- a breaking schema change ships without a consumer migration plan.

Swagger UI is dev/test-only by default. If a team enables it in production,
protect and monitor it deliberately; UI visibility never replaces endpoint
authorization.

Continue with [Generate, Package, And Consume Quarkus Clients](./QUARKUS-OPENAPI-CLIENT-ARTIFACTS.md).

## Official References

- [Quarkus OpenAPI And Swagger UI Guide](https://quarkus.io/guides/openapi-swaggerui)
- [MicroProfile OpenAPI Specification](https://download.eclipse.org/microprofile/microprofile-open-api-4.1/microprofile-openapi-spec-4.1.html)

