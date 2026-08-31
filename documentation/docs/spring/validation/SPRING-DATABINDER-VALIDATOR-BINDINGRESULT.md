---
title: Spring DataBinder Validator And BindingResult
description: A beginner-to-advanced guide to programmatic Spring validation, DataBinder lifecycle, BindingResult errors, custom and Jakarta validators, secure binding, tests, and production use.
difficulty: Intermediate
page_type: Guide
status: maintained
learning_objectives:
  - Explain the separate binding and validation responsibilities of DataBinder
  - Run Spring Validator and Jakarta validation programmatically
  - Inspect and translate FieldError and ObjectError safely
  - Secure property binding against unintended object-graph updates
  - Test binding, validation, nested paths, hints, and error contracts
technologies: [Spring Framework, DataBinder, Spring Validator, BindingResult, Jakarta Validation, Spring MVC]
last_reviewed: "2026-08-24"
scope: generic
owner: docs-spring
reviewer: documentation-maintainers
review_evidence: official-spring-framework-documentation-review
---

# Spring DataBinder Validator And BindingResult

<DocLabels items={[
  {label: 'Programmatic validation', tone: 'intermediate'},
  {label: 'Binding safety', tone: 'production'},
  {label: 'Spring internals', tone: 'advanced'},
]} />

`DataBinder` coordinates a target object, optional input binding, type conversion,
one or more validators, and a `BindingResult`. It is the lower-level mechanism
behind many Spring MVC binding workflows, but it can also be used directly in a
service, adapter, batch job, or test.

This guide begins with the common “validate an existing object” helper, then
progresses to actual property binding, Jakarta Validation, multiple validators,
validation hints, nested paths, secure field allowlists, exception translation,
and focused tests.

## The Mental Model

Binding and validation are different operations:

```text
untrusted property values
    │
    ▼ binder.bind(...)
type conversion + allowed property assignment
    │
    ▼ target object
    │
    ▼ binder.validate()
Spring Validator or SmartValidator
    │
    ▼
BindingResult
  ├── binding errors: typeMismatch, required, methodInvocation
  └── validation errors: custom field and object error codes
```

If code calls only `validate()`, `DataBinder` does not populate or change the
target. It simply passes the existing target to the configured validators and
collects their errors.

`BindingResult` extends Spring's `Errors` interface. A validator writes errors
through `Errors`; application code reads the same collection through the richer
`BindingResult` interface.

## Correct Programmatic Validation Helper

The following pattern validates an object that has already been constructed:

```java
public static void validate(
        Object target,
        Validator validator,
        String title) {

    DataBinder binder = new DataBinder(target);
    binder.setValidator(validator);
    binder.validate();

    BindingResult bindingResult = binder.getBindingResult();

    if (bindingResult.hasErrors()) {
        throw new BindingResultException(bindingResult, title);
    }
}
```

Common API-name corrections are:

- the method is `getBindingResult()`, singular;
- the error check is `bindingResult.hasErrors()`;
- ordinary validation failures belong in `BindingResult`, not as exceptions
  thrown directly from `Validator.validate`;
- `BindingResultException` in this example is application-specific, not a
  standard Spring exception.

For clearer error paths, provide an object name:

```java
DataBinder binder = new DataBinder(target, "checkoutRequest");
```

That name participates in object-level errors and message-code resolution. It
should be a stable technical name; keep the user-facing title separate.

## Lifecycle Line By Line

### 1. Construct the binder

```java
DataBinder binder = new DataBinder(target, "checkoutRequest");
```

The binder retains the target and creates its binding-result infrastructure. By
default, normal JavaBean property access is available. No property assignment or
validation has happened yet.

### 2. Register a compatible validator

```java
binder.setValidator(checkoutRequestValidator);
```

Spring's `Validator` contract has two methods:

```java
public interface Validator {
    boolean supports(Class<?> clazz);
    void validate(Object target, Errors errors);
}
```

`supports` declares the target types the validator accepts. `DataBinder` checks
compatibility when the validator is configured, helping detect wiring mistakes
before validation proceeds.

### 3. Invoke validation

```java
binder.validate();
```

Conceptually, the binder invokes each applicable validator with its target and
the binder's error collector:

```java
validator.validate(target, binder.getBindingResult());
```

The real implementation also supports multiple validators, excluded validators,
and `SmartValidator` hints.

### 4. Inspect the result

```java
BindingResult result = binder.getBindingResult();
```

Useful operations include:

```java
result.hasErrors();
result.hasFieldErrors();
result.hasFieldErrors("quantity");
result.getErrorCount();
result.getAllErrors();
result.getFieldErrors();
result.getFieldError("quantity");
result.getGlobalErrors();
```

## Build A Retail Checkout Validator

Consider a transport object that has already been deserialized:

```java
public record CheckoutSubmission(
        String accountId,
        String profileId,
        List<CheckoutLine> lines,
        String promotionCode) {
}

public record CheckoutLine(String sku, int quantity) {
}
```

A Spring validator can report field and object failures:

```java
@Component
public final class CheckoutSubmissionValidator implements Validator {

    @Override
    public boolean supports(Class<?> type) {
        return CheckoutSubmission.class.isAssignableFrom(type);
    }

    @Override
    public void validate(Object target, Errors errors) {
        CheckoutSubmission request = (CheckoutSubmission) target;

        ValidationUtils.rejectIfEmptyOrWhitespace(
                errors,
                "accountId",
                "checkout.account.required",
                "Account is required"
        );

        ValidationUtils.rejectIfEmptyOrWhitespace(
                errors,
                "profileId",
                "checkout.profile.required",
                "Profile is required"
        );

        if (request.lines() == null || request.lines().isEmpty()) {
            errors.rejectValue(
                    "lines",
                    "checkout.lines.required",
                    "At least one line is required"
            );
        }

        if (request.accountId() != null
                && request.accountId().equals(request.profileId())) {
            errors.reject(
                    "checkout.identity.references.invalid",
                    "Account and profile references are invalid"
            );
        }
    }
}
```

Use `rejectValue` when a specific field owns the failure. Use `reject` for an
object-level or cross-field failure. Error codes such as
`checkout.lines.required` should be stable application identifiers; the default
message is a fallback, not a public machine contract.

<DocCallout type="production" title="Keep business operations out of validators">

Validators should normally be deterministic, cheap, and free of remote calls.
Checking whether an authenticated customer owns `accountId`, whether a promotion
is eligible, or whether inventory can be reserved belongs in an application
service with explicit transaction, timeout, concurrency, and failure policy.

</DocCallout>

## FieldError Versus ObjectError

A rejected field produces `FieldError`, which can contain:

- the object and field names;
- one or more resolvable message codes;
- arguments for message interpolation;
- the rejected value;
- a default message;
- whether the failure originated during binding.

An object-level rejection produces `ObjectError`. It has no single field path
because the rule may involve multiple values.

```java
for (ObjectError error : result.getAllErrors()) {
    if (error instanceof FieldError fieldError) {
        log.debug("Validation failed: object={}, field={}, code={}",
                fieldError.getObjectName(),
                fieldError.getField(),
                fieldError.getCode());
    } else {
        log.debug("Validation failed: object={}, code={}",
                error.getObjectName(),
                error.getCode());
    }
}
```

Do not log `getRejectedValue()` generically. It may contain a payment token,
address, email, profile data, or another sensitive value.

## Nested Validation Paths

A parent validator can invoke a child validator while preserving a useful path:

```java
public final class CheckoutLineValidator implements Validator {

    @Override
    public boolean supports(Class<?> type) {
        return CheckoutLine.class.isAssignableFrom(type);
    }

    @Override
    public void validate(Object target, Errors errors) {
        CheckoutLine line = (CheckoutLine) target;

        ValidationUtils.rejectIfEmptyOrWhitespace(
                errors, "sku", "checkout.sku.required"
        );

        if (line.quantity() < 1 || line.quantity() > 99) {
            errors.rejectValue(
                    "quantity",
                    "checkout.quantity.range",
                    "Quantity must be between 1 and 99"
            );
        }
    }
}
```

```java
for (int index = 0; index < request.lines().size(); index++) {
    try {
        errors.pushNestedPath("lines[" + index + "]");
        ValidationUtils.invokeValidator(
                lineValidator,
                request.lines().get(index),
                errors
        );
    } finally {
        errors.popNestedPath();
    }
}
```

The resulting path is `lines[0].quantity`. Always restore the nested path in a
`finally` block so later errors are not attributed to the wrong child.

## Multiple Validators

`setValidator` establishes the primary validator. Additional independent rules
can be registered with `addValidators`:

```java
binder.setValidator(structuralValidator);
binder.addValidators(checkoutPolicyShapeValidator);
binder.validate();
```

Order may matter when validators assume earlier conditions. Prefer validators
that tolerate missing values and own distinct rules. If one rule requires another
to succeed, make that sequencing explicit and test it instead of relying on
incidental registration order.

## SmartValidator And Validation Hints

`SmartValidator` extends the basic contract with validation hints. Spring's
Jakarta Validation adapter uses hints to support validation groups:

```java
public interface SubmitChecks {
}

binder.setValidator(smartValidator);
binder.validate(SubmitChecks.class);
```

`DataBinder.validate(Object... hints)` passes the hints to validators that
implement `SmartValidator`; a basic `Validator` may ignore them. Excessive groups
make a DTO difficult to understand, so separate request types are often clearer
when create, update, and submission contracts differ substantially.

## Jakarta Bean Validation Through Spring

Spring can adapt Jakarta constraints to its `Validator` contract. A configured
`LocalValidatorFactoryBean`/`SmartValidator` can therefore be used with the same
binder:

```java
public record CheckoutSubmission(
        @NotBlank String accountId,
        @NotBlank String profileId,
        @NotEmpty List<@Valid CheckoutLine> lines) {
}

public record CheckoutLine(
        @NotBlank String sku,
        @Min(1) @Max(99) int quantity) {
}
```

```java
@Service
public final class CheckoutValidationService {

    private final SmartValidator validator;

    public CheckoutValidationService(SmartValidator validator) {
        this.validator = validator;
    }

    public void validate(CheckoutSubmission request) {
        DataBinder binder = new DataBinder(request, "checkoutSubmission");
        binder.setValidator(validator);
        binder.validate();

        BindingResult result = binder.getBindingResult();
        if (result.hasErrors()) {
            throw new CheckoutValidationException(result);
        }
    }
}
```

Use Jakarta constraints for declarative structural rules. Use a Spring
`Validator` when programmatic logic, explicit child-validator composition, or a
non-annotation model is clearer. They can coexist, but avoid reporting the same
rule twice.

Spring Framework 6.1 and later also offers `Validator.validateObject(target)` for
immediate validation without manually constructing a binder. `DataBinder`
remains useful when binding, conversion, object naming, multiple validators, or
binding-result behavior is part of the requirement.

## Actual Property Binding

This example binds string-shaped external values before validation:

```java
MutablePropertyValues values = new MutablePropertyValues();
values.add("accountId", "account-100");
values.add("profileId", "profile-200");
values.add("quantity", "two");

MutableCheckoutCommand command = new MutableCheckoutCommand();
DataBinder binder = new DataBinder(command, "checkoutCommand");

binder.setAllowedFields("accountId", "profileId", "quantity");
binder.bind(values);
binder.setValidator(commandValidator);
binder.validate();

BindingResult result = binder.getBindingResult();
```

Binding `quantity=two` into an integer can create a `typeMismatch` field error.
That is different from successfully binding `quantity=0` and later receiving a
business-shape validation error.

| Failure | Phase | Example code |
|---|---|---|
| missing required bound property | binding | `required` |
| string cannot convert to target type | binding | `typeMismatch` |
| property setter throws | binding | `methodInvocation` |
| quantity outside accepted range | validation | `checkout.quantity.range` |
| cross-field relationship invalid | validation | `checkout.identity.references.invalid` |

## Secure Data Binding

<DocCallout type="mistake" title="Property binding can expose unintended state">

Binding arbitrary external property names onto a rich domain object can allow
updates to fields the caller should never control. Spring's `DataBinder` Javadoc
explicitly warns that data binding requires security consideration.

</DocCallout>

Prefer dedicated request/command DTOs and constructor binding. When property
binding is required, configure a positive allowlist:

```java
binder.setAllowedFields(
        "accountId",
        "profileId",
        "quantity",
        "promotionCode"
);
```

Do not bind external input directly onto entities containing fields such as:

```text
role
accountStatus
price
discountAmount
paymentStatus
orderStatus
ownerId
createdAt
```

Treat suppressed or disallowed fields according to a documented policy. Do not
silently accept an attempted write to a sensitive field. Also bound collections
and nested paths; automatic object-graph growth can consume memory when input
indexes are attacker controlled.

## Spring MVC: Usually Let The Framework Bind

For normal controllers, prefer the built-in MVC workflow:

```java
@PostMapping("/checkouts")
ResponseEntity<CheckoutReceipt> checkout(
        @Valid @RequestBody CheckoutSubmission request,
        BindingResult result) {

    if (result.hasErrors()) {
        throw new CheckoutValidationException(result);
    }

    return ResponseEntity.ok(checkoutService.submit(request));
}
```

Spring MVC deserializes/binds and validates the parameter. `BindingResult` must
immediately follow the validated model parameter when the controller intends to
handle its errors. Without that arrangement, MVC normally raises its framework
validation exception for centralized error handling.

Manual `DataBinder` is appropriate when:

- validation runs outside the controller layer;
- a batch, message, or adapter boundary needs Spring's error model;
- custom property binding or conversion is required;
- multiple validators must be composed explicitly;
- a focused test needs to observe binder behavior.

Do not manually repeat validation that MVC already performed unless the second
boundary has a distinct contract.

## Exception And HTTP Error Translation

Keep the original `BindingResult` inside an internal exception if a centralized
translator needs field paths and codes:

```java
public final class CheckoutValidationException extends RuntimeException {

    private final BindingResult result;

    public CheckoutValidationException(BindingResult result) {
        super("Checkout validation failed");
        this.result = result;
    }

    public BindingResult getResult() {
        return result;
    }
}
```

At the HTTP boundary, map errors to a stable public structure:

```json
{
  "type": "https://errors.example.test/validation",
  "title": "Request validation failed",
  "status": 400,
  "errors": [
    {
      "field": "lines[0].quantity",
      "code": "checkout.quantity.range",
      "message": "Quantity must be between 1 and 99"
    }
  ]
}
```

Do not serialize `BindingResult`, `FieldError`, stack traces, validator class
names, or rejected values directly. Translate only approved field paths, stable
codes, and localized safe messages.

## Focused Tests

### Validator unit test

```java
@Test
void rejectsEmptyLines() {
    CheckoutSubmission request = new CheckoutSubmission(
            "account-100", "profile-200", List.of(), null
    );

    DataBinder binder = new DataBinder(request, "checkoutSubmission");
    binder.setValidator(new CheckoutSubmissionValidator());
    binder.validate();

    BindingResult result = binder.getBindingResult();

    assertThat(result.hasFieldErrors("lines")).isTrue();
    assertThat(result.getFieldError("lines").getCode())
            .isEqualTo("checkout.lines.required");
}
```

### Type-conversion test

```java
@Test
void recordsTypeMismatchDuringBinding() {
    MutableCheckoutCommand command = new MutableCheckoutCommand();
    DataBinder binder = new DataBinder(command, "checkoutCommand");

    binder.bind(new MutablePropertyValues(
            Map.of("quantity", "two")
    ));

    assertThat(binder.getBindingResult()
            .hasFieldErrors("quantity")).isTrue();
    assertThat(binder.getBindingResult()
            .getFieldError("quantity").getCode())
            .isEqualTo("typeMismatch");
}
```

### Security test

```java
@Test
void doesNotBindOrderStatus() {
    MutableCheckoutCommand command = new MutableCheckoutCommand();
    DataBinder binder = new DataBinder(command);
    binder.setAllowedFields("accountId", "profileId", "quantity");

    binder.bind(new MutablePropertyValues(Map.of(
            "accountId", "account-100",
            "orderStatus", "COMPLETED"
    )));

    assertThat(binder.getBindingResult().getSuppressedFields())
            .containsExactly("orderStatus");
}
```

Also test nested paths, multiple simultaneous errors, object errors, message-code
resolution, validation groups, maximum collection sizes, sensitive-data
redaction, and the final HTTP error contract.

## Common Mistakes

- Calling `getBindingResults()` instead of `getBindingResult()`.
- Checking `binder.hasError()` instead of `result.hasErrors()`.
- Assuming `new DataBinder(target)` automatically validates.
- Assuming `validate()` binds external values.
- Throwing from a validator for an ordinary invalid field instead of rejecting it.
- Registering a validator whose `supports` method rejects the target class.
- Using a generated API DTO or persistence entity as an unrestricted binding target.
- Forgetting `popNestedPath()` after invoking a child validator.
- Logging rejected values or exposing internal message codes without review.
- Querying a database or remote API from a structural validator.
- Performing the same validation in MVC, a helper, and a service without distinct
  ownership.

## Production Checklist

- [ ] The boundary clearly distinguishes binding, validation, and business rules.
- [ ] Validators support the intended target type and remain deterministic.
- [ ] Field and object errors use stable codes.
- [ ] External property binding uses dedicated DTOs and positive allowlists.
- [ ] Suppressed sensitive-field attempts are rejected or audited safely.
- [ ] Nested and collection paths are bounded and tested.
- [ ] Rejected values never leak through logs, metrics, traces, or HTTP responses.
- [ ] MVC does not duplicate manual validation without a reason.
- [ ] Exception translation produces the documented public error contract.
- [ ] Binding, validation, security, and endpoint tests cover failure paths.

## Interview Checks

<ExpandableAnswer title="Does DataBinder always bind data before validating?">

No. Binding and validation are explicit operations. Calling only `validate()`
validates the target in its current state; it does not assign property values.

</ExpandableAnswer>

<ExpandableAnswer title="Why use BindingResult instead of throwing inside Validator?">

It collects multiple field and object failures in one structured result, supports
message-code resolution, preserves nested paths, and lets the owning boundary
decide whether to render, translate, or throw.

</ExpandableAnswer>

<ExpandableAnswer title="When is validateObject simpler than DataBinder?">

For immediate validation of an already constructed object with one modern Spring
`Validator`, `validateObject` can be simpler. Use `DataBinder` when binding,
conversion, multiple validators, validation hints, object naming, or binder error
analysis is required.

</ExpandableAnswer>

## Official References

- [Spring Validation And Data Binding](https://docs.spring.io/spring-framework/reference/core/validation.html)
- [Spring Validator Interface](https://docs.spring.io/spring-framework/reference/core/validation/validator.html)
- [DataBinder Javadoc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/validation/DataBinder.html)
- [BindingResult Javadoc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/validation/BindingResult.html)
- [Spring MVC Validation](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html)

## Recommended Next

<TopicCards items={[
  {title: 'Amway create-checkout flow', href: '/architecture/AMWAY-CREATE-CHECKOUT-FLOW', description: 'See DataBinder validation inside the reconstructed strategy and handler pipeline.', icon: 'route', tags: ['Checkout', 'Pipeline']},
  {title: 'Bean Validation fundamentals', href: '/spring/validation/BEAN-VALIDATION-FUNDAMENTALS', description: 'Review constraints, null semantics, and nested cascade behavior.', icon: 'book', tags: ['Constraints', 'Valid']},
  {title: 'Method and custom validation', href: '/spring/validation/METHOD-CUSTOM-GROUPED-CONFIGURATION-VALIDATION', description: 'Continue with proxy boundaries, groups, custom constraints, and configuration validation.', icon: 'layers', tags: ['Validated', 'Groups']},
  {title: 'Errors, testing, and production', href: '/spring/validation/VALIDATION-ERRORS-TESTING-PRODUCTION', description: 'Standardize exception ownership, public error responses, and production evidence.', icon: 'experiment', tags: ['Errors', 'Tests']},
]} />
