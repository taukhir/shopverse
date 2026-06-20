---
title: Spring REST Request Mapping Validation And Errors
---

# Spring REST Request Mapping Validation And Errors

Request data mapping, validation, ResponseEntity, and central error handling.

Back to [Spring REST APIs](../SPRING-REST-APIS.md).

## Mapping Request Data

### Path Variables

Use path variables to identify a resource:

```java
@GetMapping("/{orderId}")
OrderResponse get(@PathVariable Long orderId) {
    return orderService.get(orderId);
}
```

```http
GET /api/v1/orders/42
```

### Query Parameters

Use query parameters for optional filtering, sorting, pagination, and search:

```java
@GetMapping
Page<OrderResponse> search(
        @RequestParam(required = false) OrderStatus status,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
) {
    return orderService.search(status, PageRequest.of(page, size));
}
```

```http
GET /api/v1/orders?status=CONFIRMED&page=0&size=20
```

Allow-list sort and filter fields. Do not concatenate arbitrary client values
into SQL or dynamic expressions.

### Headers

Use headers for protocol and cross-cutting metadata:

```java
@PostMapping("/checkout")
OrderResponse checkout(
        @RequestHeader("Idempotency-Key") String idempotencyKey,
        @RequestHeader(
                name = "X-Correlation-Id",
                required = false
        ) String correlationId,
        @Valid @RequestBody CheckoutRequest request
) {
    return orderService.checkout(idempotencyKey, correlationId, request);
}
```

Authentication credentials, correlation IDs, conditional-request values, and
content negotiation belong in headers. Business fields normally belong in the
body.

### Request Bodies

Use `@RequestBody` for a structured representation:

```java
@PostMapping
ResponseEntity<UserResponse> create(
        @Valid @RequestBody CreateUserRequest request
) {
    // ...
}
```

A request has one body. Do not define multiple `@RequestBody` parameters; use
one request record containing the required fields.

### Form Data

HTML form or form-encoded requests can use `@ModelAttribute`:

```java
public record ProfileForm(
        @NotBlank String displayName,
        MultipartFile avatar
) {
}

@PostMapping(
        path = "/profile",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
)
ProfileResponse update(@Valid @ModelAttribute ProfileForm form) {
    return profileService.update(form);
}
```


## Validation

### Body Validation

```java
public record CheckoutRequest(
        @NotEmpty
        @Size(max = 20)
        List<@Valid CheckoutItemRequest> items
) {
}

public record CheckoutItemRequest(
        @NotNull @Positive Long productId,
        @Positive @Max(100) int quantity
) {
}
```

`@Valid` triggers nested validation. Bean Validation checks structure; the
service checks business rules such as stock availability and ownership.

### Path And Query Validation

Enable method validation:

```java
@RestController
@Validated
class ProductController {

    @GetMapping("/{id}")
    ProductResponse get(@PathVariable @Positive Long id) {
        // ...
    }
}
```

### Custom Constraint

Create a custom validation annotation when a reusable structural rule cannot
be expressed by standard constraints:

```java
@Documented
@Constraint(validatedBy = CurrencyCodeValidator.class)
@Target({FIELD, PARAMETER, RECORD_COMPONENT})
@Retention(RUNTIME)
public @interface CurrencyCode {
    String message() default "must be a supported currency";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
```

Do not perform database queries from ordinary field validators. Cross-resource
business validation belongs in the transactional service.


## `ResponseEntity`

`ResponseEntity<T>` controls status, headers, and body:

```java
return ResponseEntity
        .status(HttpStatus.ACCEPTED)
        .header(HttpHeaders.LOCATION, operationUri.toString())
        .body(operation);
```

Use it when the method must set a non-default status or headers. Returning a
DTO directly is clear for a normal `200 OK` response:

```java
@GetMapping("/{id}")
ProductResponse get(@PathVariable Long id) {
    return productService.get(id);
}
```

Do not return `ResponseEntity<?>` everywhere without a reason. Strong generic
types improve documentation and client generation.


## Central Error Handling

```java
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ProductNotFoundException.class)
    ProblemDetail handleNotFound(
            ProductNotFoundException exception,
            HttpServletRequest request
    ) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND,
                exception.getMessage()
        );
        problem.setTitle("Product not found");
        problem.setProperty("code", "PRODUCT_NOT_FOUND");
        problem.setProperty("path", request.getRequestURI());
        problem.setProperty("correlationId", MDC.get("correlationId"));
        return problem;
    }
}
```

Map known domain exceptions to stable statuses and error codes. Keep a final
handler for unexpected exceptions, log the full internal exception, and return
a generic `500` response without implementation details.

Validation failures should produce field-level errors:

```json
{
  "status": 400,
  "code": "VALIDATION_FAILED",
  "message": "Request validation failed",
  "fieldErrors": [
    {
      "field": "items[0].quantity",
      "message": "must be greater than 0"
    }
  ]
}
```










