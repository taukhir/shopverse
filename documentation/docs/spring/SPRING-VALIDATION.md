---
title: Spring Bean Validation
sidebar_position: 7
---

# Spring Bean Validation

Spring integrates Jakarta Bean Validation for validating HTTP requests,
configuration properties, method parameters, return values, and persistence
objects. Hibernate Validator is the commonly used implementation.

## Dependency

```gradle
implementation 'org.springframework.boot:spring-boot-starter-validation'
```

The starter provides the Jakarta Validation API and a validation provider.
Spring Boot auto-configures a `Validator` and integrates it with Spring MVC and
method validation.

## Common Constraints

| Annotation | Meaning |
|---|---|
| `@NotNull` | value must not be null |
| `@NotBlank` | text must contain a non-whitespace character |
| `@NotEmpty` | collection, map, array, or text must not be empty |
| `@Size` | length or collection size range |
| `@Min` / `@Max` | numeric boundary |
| `@Positive` / `@PositiveOrZero` | positive number rule |
| `@DecimalMin` / `@DecimalMax` | decimal boundary |
| `@Email` | email-shaped text |
| `@Pattern` | regular-expression rule |
| `@Past` / `@Future` | temporal rule |
| `@Digits` | integer and fraction digit limits |
| `@AssertTrue` / `@AssertFalse` | boolean invariant |

```java
public record CreateProductRequest(
        @NotBlank
        @Size(max = 120)
        String name,

        @NotNull
        @Positive
        BigDecimal price,

        @NotBlank
        @Pattern(regexp = "[A-Z]{3}")
        String currency
) {
}
```

## `@Valid`

`@Valid` is the Jakarta Bean Validation cascade marker. It tells the validator
to traverse the annotated object and validate constraints declared inside it.
It is most commonly used on Spring MVC request objects and nested DTO fields:

```java
public record CheckoutRequest(
        @NotEmpty
        @Size(max = 20)
        List<@Valid CheckoutItemRequest> items
) {
}
```

```java
@PostMapping("/checkout")
ResponseEntity<OrderResponse> checkout(
        @Valid @RequestBody CheckoutRequest request
) {
    // ...
}
```

Without `@Valid` on the collection element or nested field, constraints inside
`CheckoutItemRequest` are not necessarily traversed.

`@Valid`:

- is defined by `jakarta.validation.Valid`;
- validates an object graph recursively;
- works on fields, record components, method parameters, and return values;
- does not itself define a validation rule;
- does not select validation groups.

For example, `@Valid` alone does not mean that a request must be non-null:

```java
public OrderResponse create(
        @Valid @RequestBody CreateOrderRequest request
) {
    // @Valid traverses request when a request object exists.
}
```

Nullability is owned by the web binding contract or an explicit constraint:

```java
public OrderResponse create(
        @NotNull @Valid @RequestBody CreateOrderRequest request
) {
    // ...
}
```

## `@Validated`

`@Validated` is Spring's extension to Bean Validation. It is defined by
`org.springframework.validation.annotation.Validated` and is used when Spring
needs to:

- enable method-level validation on a Spring bean;
- select validation groups;
- mark a type, method, or parameter as a Spring validation boundary.

```java
@RestController
@Validated
class ProductController {

    @GetMapping("/{id}")
    ProductResponse get(@PathVariable @Positive Long id) {
        return service.get(id);
    }
}
```

This class-level controller style uses Spring's validation proxy. With Spring
Framework 6.1 or later, prefer MVC's built-in method validation for controller
parameter constraints as explained in the comparison section below.

Method validation can also apply to services:

```java
@Service
@Validated
class TransferService {

    public Receipt transfer(
            @NotBlank String account,
            @Positive BigDecimal amount,
            @Valid TransferOptions options
    ) {
        // ...
    }
}
```

For a service bean, the call must pass through the Spring-managed
method-validation proxy. Self-invocation bypasses that proxy:

```java
@Service
@Validated
class TransferService {

    public void transferBatch(List<TransferCommand> commands) {
        commands.forEach(command ->
                validateAndTransfer(command)); // direct self-invocation
    }

    public void validateAndTransfer(@Valid TransferCommand command) {
        // Proxy-based method validation is not intercepted here.
    }
}
```

Move the validated method to another Spring bean, validate explicitly, or
restructure the boundary instead of attempting proxy self-injection.

## `@Valid` Versus `@Validated`

| Capability | `@Valid` | `@Validated` |
|---|---:|---:|
| Jakarta standard | Yes | No, Spring-specific |
| Primary purpose | Cascade into an object graph | Enable Spring method validation or select groups |
| Nested-object cascading | Yes | No replacement for field-level `@Valid` |
| Validation groups | Cannot select a group | Selects one or more groups |
| Typical controller use | Request body, model attribute, request part | Group selection; legacy/proxy controller method validation |
| Typical service use | Nested parameter or return object | Type-level method validation |
| Requires a Spring proxy | No for ordinary MVC argument validation | Yes for service method validation |

### When To Use `@Valid`

Use `@Valid` for an ordinary request body:

```java
@PostMapping
OrderResponse create(
        @Valid @RequestBody CreateOrderRequest request
) {
    return orderService.create(request);
}
```

Use it on every nested boundary that must be traversed:

```java
public record CreateOrderRequest(
        @NotEmpty
        List<@Valid OrderItemRequest> items,

        @NotNull
        @Valid AddressRequest shippingAddress
) {
}
```

Without the nested `@Valid`, constraints such as `@Positive quantity` and
`@NotBlank postalCode` can be skipped.

### When To Use `@Validated`

Use `@Validated` on a service that validates method parameters or return
values:

```java
@Service
@Validated
class InventoryService {

    public InventoryResponse reserve(
            @Positive Long productId,
            @Positive int quantity
    ) {
        // ...
    }
}
```

Use it to select a validation group:

```java
interface OnCreate {
}

interface OnUpdate {
}

public record UserRequest(
        @Null(groups = OnCreate.class)
        @NotNull(groups = OnUpdate.class)
        Long id,

        @NotBlank(groups = {OnCreate.class, OnUpdate.class})
        String username
) {
}
```

```java
@PostMapping
UserResponse create(
        @Validated(OnCreate.class) @RequestBody UserRequest request
) {
    // ...
}

@PutMapping("/{id}")
UserResponse update(
        @Validated(OnUpdate.class) @RequestBody UserRequest request
) {
    // ...
}
```

### When To Use Both

They solve different problems and are frequently complementary:

```java
@RestController
@Validated
class OrderController {

    @PostMapping
    OrderResponse create(
            @RequestParam @Positive int priority,
            @Valid @RequestBody CreateOrderRequest request
    ) {
        // ...
    }
}
```

Here:

- type-level `@Validated` enables proxy-based validation of `priority`;
- parameter-level `@Valid` traverses `CreateOrderRequest`;
- nested fields inside the request still need their own `@Valid`.

For Spring Framework 6.1 and later, Spring MVC has built-in controller method
validation when constraints are declared directly on handler method parameters
or return values. In that model, remove class-level `@Validated` from the
controller and let MVC raise `HandlerMethodValidationException`. Keep
`@Validated` on service beans where proxy-based method validation is required.

Applications can therefore encounter two common exceptions:

| Exception | Typical source |
|---|---|
| `MethodArgumentNotValidException` | validation of one `@Valid` request object |
| `HandlerMethodValidationException` | constraints across controller method parameters or return value |

### Decision Guide

| Requirement | Use |
|---|---|
| Validate fields in one request DTO | `@Valid @RequestBody` |
| Validate objects nested inside a DTO | `@Valid` on the nested field or type argument |
| Validate `@PathVariable`, `@RequestParam`, or service arguments | method validation |
| Enable service method validation | `@Validated` on the Spring service |
| Apply create/update groups | `@Validated(Group.class)` |
| Cascade while also selecting a group | `@Validated(Group.class)` at the entry point and `@Valid` on nested objects |

## Container Element Validation

Constraints can target generic type arguments:

```java
public record PermissionRequest(
        @NotEmpty
        Set<@NotBlank @Pattern(regexp = "[A-Z_]+") String> permissions,

        Map<@NotBlank String, @Positive Integer> limits
) {
}
```

## Class-Level Cross-Field Validation

Use a class-level custom constraint when multiple fields must be evaluated
together:

```java
@ValidDateRange
public record PromotionRequest(
        @NotNull Instant startsAt,
        @NotNull Instant endsAt
) {
}
```

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = DateRangeValidator.class)
public @interface ValidDateRange {
    String message() default "endsAt must be after startsAt";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
```

```java
public class DateRangeValidator
        implements ConstraintValidator<ValidDateRange, PromotionRequest> {

    @Override
    public boolean isValid(
            PromotionRequest request,
            ConstraintValidatorContext context
    ) {
        if (request == null
                || request.startsAt() == null
                || request.endsAt() == null) {
            return true;
        }

        return request.endsAt().isAfter(request.startsAt());
    }
}
```

Let `@NotNull` report missing fields; the custom validator owns only the range
relationship.

## Field-Level Custom Validation

```java
@Target({
        ElementType.FIELD,
        ElementType.PARAMETER,
        ElementType.RECORD_COMPONENT
})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = CurrencyCodeValidator.class)
public @interface CurrencyCode {
    String message() default "must be a supported currency";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
```

```java
public class CurrencyCodeValidator
        implements ConstraintValidator<CurrencyCode, String> {

    private static final Set<String> SUPPORTED =
            Set.of("USD", "EUR", "INR");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return value == null || SUPPORTED.contains(value);
    }
}
```

Constraint validators should normally be stateless, fast, and thread-safe.
Avoid remote calls and expensive database queries inside them.

## Validation Groups

```java
interface OnCreate {
}

interface OnUpdate {
}
```

```java
public record UserRequest(
        @Null(groups = OnCreate.class)
        @NotNull(groups = OnUpdate.class)
        Long id,

        @NotBlank
        String username
) {
}
```

```java
@PostMapping
UserResponse create(
        @Validated(OnCreate.class) @RequestBody UserRequest request
) {
    // ...
}
```

Groups are useful for a shared model with genuinely different validation
phases. Separate request records are often clearer for create and update APIs.

## Group Sequences

```java
@GroupSequence({
        BasicChecks.class,
        ExpensiveChecks.class
})
interface OrderedChecks {
}
```

Later groups run only when earlier groups pass. Use this sparingly; complex
group graphs can make validation difficult to understand.

## Configuration Properties Validation

```java
@ConfigurationProperties("shopverse.payment")
@Validated
public record PaymentProperties(
        @NotNull Duration timeout,
        @Positive int maxAttempts,
        @NotBlank URI providerBaseUrl
) {
}
```

Invalid configuration fails application startup instead of allowing a broken
runtime state.

## Entity Validation

```java
@Entity
class ProductEntity {

    @NotBlank
    @Column(nullable = false, length = 120)
    private String name;
}
```

Entity validation can run before persistence lifecycle operations. Keep
database constraints as the final race-safe guarantee:

```text
request validation
  -> service business validation
  -> entity validation
  -> database constraints
```

## Error Handling

```java
@RestControllerAdvice
class ValidationExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail handleBodyValidation(
            MethodArgumentNotValidException exception
    ) {
        ProblemDetail problem =
                ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setTitle("Request validation failed");
        problem.setProperty(
                "fieldErrors",
                exception.getBindingResult()
                        .getFieldErrors()
                        .stream()
                        .map(error -> Map.of(
                                "field", error.getField(),
                                "message", Objects.requireNonNullElse(
                                        error.getDefaultMessage(),
                                        "invalid"
                                )
                        ))
                        .toList()
        );
        return problem;
    }
}
```

Handle method-parameter constraint exceptions as well. Return stable field
paths and messages without exposing rejected secrets or internal details.

## Testing Validation

Unit-test a custom validator directly:

```java
Validator validator = Validation
        .buildDefaultValidatorFactory()
        .getValidator();

Set<ConstraintViolation<PromotionRequest>> violations =
        validator.validate(invalidRequest);

assertThat(violations)
        .extracting(ConstraintViolation::getMessage)
        .contains("endsAt must be after startsAt");
```

Use `@WebMvcTest` to verify request binding, validation, and error JSON.

## Do And Do Not

| Do | Do not |
|---|---|
| Validate untrusted boundaries | Trust internal-looking HTTP or event input |
| Use `@Valid` for nested objects | Assume nested validation happens automatically |
| Use `@Validated` for method validation/groups | Add it without understanding proxy boundaries |
| Keep validators deterministic and fast | Call remote services from validators |
| Use separate DTOs when contracts differ | Overuse complex validation groups |
| Keep database constraints | Treat annotations as race-safe persistence guarantees |
| Return structured field errors | Expose stack traces or sensitive rejected values |
| Test custom constraints and MVC errors | Test only the happy path |

## Related Guides

- [Spring REST APIs](../development/SPRING-REST-APIS.md)
- [Spring Boot Internals](../development/SPRING-BOOT-INTERNALS.md)
- [Hibernate ORM](../data/HIBERNATE.md)
- [Spring Boot Testing](SPRING-BOOT-TESTING.md)
- [Spring MVC validation reference](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html)
