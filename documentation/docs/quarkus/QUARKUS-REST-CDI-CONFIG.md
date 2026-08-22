---
title: "Quarkus REST, CDI, Configuration, And Validation"
description: "Application-level tutorial for Jakarta REST resources, Jackson JSON, CDI scopes and injection, typed configuration, validation, errors, and blocking versus reactive execution."
sidebar_label: "2. REST, CDI, Config"
tags: ["quarkus", "rest", "cdi", "validation"]
page_type: Tutorial
difficulty: Intermediate
status: maintained
prerequisites: [Quarkus foundations, HTTP and JSON basics]
learning_objectives: [Build a validated JSON API, Use CDI and typed configuration correctly, Design a stable error contract, Choose the correct execution model]
technologies: [Quarkus REST, Jackson, CDI, SmallRye Config, Jakarta Validation]
last_reviewed: "2026-08-11"
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: official-documentation-review
---

# Quarkus REST, CDI, Configuration, And Validation

This tutorial builds the synchronous edge of a checkout service. The examples
are intentionally small; production checkout still needs durable state,
idempotency, downstream failure handling, and authorization.

## 1. Add Capabilities

The exact platform version belongs to the project BOM. Common dependencies are:

```xml
<dependency>
  <groupId>io.quarkus</groupId>
  <artifactId>quarkus-rest-jackson</artifactId>
</dependency>
<dependency>
  <groupId>io.quarkus</groupId>
  <artifactId>quarkus-hibernate-validator</artifactId>
</dependency>
```

`quarkus-rest-jackson` provides Jakarta REST integration and JSON serialization.
The validation extension integrates Jakarta Validation at HTTP and CDI method
boundaries.

## 2. Model A Request At The Boundary

```java
package example.checkout.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CheckoutRequest(
        @NotBlank @Size(max = 80) String cartId,
        @NotBlank @Size(max = 80) String accountId,
        @NotBlank @Size(max = 80) String selectedProfileId,
        @NotEmpty @Size(max = 100) List<@Valid Item> items) {

    public record Item(
            @NotBlank @Size(max = 80) String productId,
            @Positive int quantity) {}
}
```

Boundary validation rejects malformed input. It does not prove that the account
belongs to the caller, that the profile is eligible in the market, that the
product exists, or that inventory and price are current. Those are authorized
business validations inside the application boundary.

## 3. Define A Resource

```java
package example.checkout.api;

import example.checkout.application.CheckoutApplicationService;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/checkouts")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class CheckoutResource {

    private final CheckoutApplicationService service;

    public CheckoutResource(CheckoutApplicationService service) {
        this.service = service;
    }

    @POST
    public Response create(
            @HeaderParam("Idempotency-Key") String idempotencyKey,
            @Valid CheckoutRequest request) {
        CheckoutResponse result = service.checkout(idempotencyKey, request);
        return Response.status(Response.Status.CREATED).entity(result).build();
    }
}
```

Constructor injection makes required dependencies explicit. A resource should
translate HTTP into an application command, not implement pricing, account,
payment, or persistence policy.

## 4. Use CDI Deliberately

```java
package example.checkout.application;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class CheckoutApplicationService {
    // Stateless orchestration methods belong here.
}
```

Important scopes include:

| Scope | Lifetime | Typical use |
|---|---|---|
| `@ApplicationScoped` | shared contextual instance | stateless services, repositories, clients |
| `@RequestScoped` | one HTTP request | request-specific state only when necessary |
| `@Dependent` | lifecycle follows injection target | lightweight implementation detail |
| `@Singleton` | one eagerly referenced instance without normal-scope proxy semantics | infrastructure with deliberate lifecycle needs |

Avoid mutable customer or checkout state in application-scoped beans. Concurrent
requests share the bean, so method-local immutable state or correctly designed
thread-safe collaborators are safer.

Quarkus CDI, called ArC, implements CDI Lite with selected additional features;
it is not CDI Full. Learn bean discovery, proxyability, qualifiers, interceptors,
and lifecycle from the Quarkus CDI reference rather than assuming Spring rules.

## 5. Bind Typed Configuration

```java
package example.checkout.config;

import io.smallrye.config.ConfigMapping;
import java.time.Duration;

@ConfigMapping(prefix = "checkout")
public interface CheckoutConfig {
    Duration downstreamTimeout();
    int maximumItems();
}
```

```properties
checkout.downstream-timeout=2s
checkout.maximum-items=100
```

Typed configuration fails earlier than scattered string lookups and documents
the required shape. Validate security-critical and capacity-critical values at
startup. Establish who owns defaults, environment overrides, secret resolution,
and configuration rollout.

Configuration sources have precedence. A convenient local property can be
overridden by runtime sources; debug the effective source without printing
secret values.

## 6. Stable Error Responses

Do not expose stack traces, internal class names, SQL errors, access tokens, or
downstream payloads. Translate expected failures into a bounded contract:

```java
public record ApiError(
        String code,
        String message,
        String correlationId) {}
```

```java
package example.checkout.api;

import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class CheckoutConflictMapper
        implements ExceptionMapper<CheckoutConflictException> {

    @Override
    public Response toResponse(CheckoutConflictException exception) {
        ApiError error = new ApiError(
                "CHECKOUT_CONFLICT",
                "The checkout request conflicts with an existing attempt.",
                CorrelationIds.current());
        return Response.status(Response.Status.CONFLICT).entity(error).build();
    }
}
```

Separate these outcomes:

- `400` malformed syntax or structurally invalid data;
- `401` missing or invalid authentication;
- `403` authenticated but not allowed to use the resource;
- `404` absent resource when disclosure is safe;
- `409` stale cart, idempotency conflict, or invalid state transition;
- `422` well-formed request that violates a domain rule, if that is the API
  convention;
- `503` dependency or capacity prevents safe processing;
- `202` accepted asynchronous work when the durable command really exists.

## 7. Blocking Versus Reactive Execution

Quarkus REST chooses execution based partly on the method signature. Direct
return values are normally treated as blocking and run on worker threads;
reactive types such as Mutiny `Uni` and `Multi` are normally treated as
non-blocking and run on I/O threads. `@Blocking` and `@NonBlocking` can override
the selection.

```java
@GET
@Path("/{id}")
public CheckoutResponse findBlocking(@PathParam("id") String id) {
    return repository.findRequired(id); // JDBC may block; worker thread is appropriate.
}
```

```java
@GET
@Path("/{id}")
public Uni<CheckoutResponse> findReactive(@PathParam("id") String id) {
    return reactiveRepository.findRequired(id); // Entire chain must remain non-blocking.
}
```

<DocCallout type="mistake" title="A reactive return type does not make blocking code safe">

Do not invoke JDBC, blocking REST clients, filesystem operations, or blocking
SDKs on an I/O thread. Either use a consistently reactive stack or move blocking
work to the supported worker or virtual-thread execution model and measure its
capacity.

</DocCallout>

Choose imperative or reactive from dependency behavior, team expertise,
debuggability, concurrency profile, and measured capacity. Mixing the models at
unclear boundaries is usually harder than either coherent model.

## 8. Resource Test

```java
package example.checkout.api;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

@QuarkusTest
class CheckoutResourceTest {

    @Test
    void rejectsMissingItems() {
        given()
            .contentType("application/json")
            .header("Idempotency-Key", "attempt-1")
            .body("""
                {"cartId":"cart-1","accountId":"a-1","selectedProfileId":"p-1","items":[]}
                """)
        .when()
            .post("/api/checkouts")
        .then()
            .statusCode(400);
    }
}
```

Add tests for missing idempotency key, overlong identifiers, zero or negative
quantity, unknown JSON fields according to policy, unauthorized account/profile,
error redaction, and response content type.

## Official References

- [Writing REST Services](https://quarkus.io/guides/rest)
- [REST JSON Guide](https://quarkus.io/guides/rest-json)
- [CDI Reference](https://quarkus.io/guides/cdi-reference)
- [Configuration Mappings](https://quarkus.io/guides/config-mappings)
- [Validation](https://quarkus.io/guides/validation)

## Next

Continue with [Data, Transactions, And Testing](./QUARKUS-DATA-TRANSACTIONS-TESTING.md).

