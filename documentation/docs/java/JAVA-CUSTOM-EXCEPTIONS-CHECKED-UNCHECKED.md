---
title: Java Custom Exceptions, Checked And Unchecked Rules
description: Design custom exception hierarchies, choose checked or unchecked contracts, preserve causes, translate failures at boundaries, expose stable error codes, and test failure behavior.
sidebar_label: Custom Exceptions And Rules
difficulty: Intermediate
page_type: Tutorial
status: maintained
prerequisites: [Java classes and methods]
learning_objectives: [Choose checked or unchecked exceptions, Design stable custom exception types, Preserve and translate causes, Expose safe API errors]
technologies: [Java, Spring Boot]
last_reviewed: "2026-07-28"
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Java Custom Exceptions, Checked And Unchecked Rules

<DocLabels items={[{label: 'Java', tone: 'foundation'}, {label: 'Error contracts', tone: 'intermediate'}, {label: 'Production safety', tone: 'production'}]} />

An exception type is part of an API contract. Create one when its type or stable error code lets a
caller make a meaningful decision, improves boundary translation, or provides operational context.
Do not create a new class merely to rename a generic failure.

## Exception Hierarchy

```text
Throwable
|- Error                    JVM/environment failure; normally do not catch
`- Exception
   |- checked exceptions    must be caught or declared
   `- RuntimeException      unchecked programming/domain/runtime failures
```

The compiler rule is not a severity rule. An unchecked exception can describe an expected business
rejection, while a checked exception can represent a temporary external failure. The choice is
about the caller's recovery contract.

## Checked Versus Unchecked

| Question | Checked exception | Unchecked exception |
|---|---|---|
| base class | extends `Exception` | extends `RuntimeException` |
| compiler | catch or declare | no catch/declare requirement |
| best fit | caller is expected and able to recover immediately | invariant violation, programming error, or recovery belongs at a higher boundary |
| API effect | makes recovery visible but propagates through signatures | keeps signatures smaller but can hide failure contracts |
| common risk | catch-and-wrap boilerplate or meaningless propagation | undocumented runtime failures and overly broad catching |

Prefer a checked exception when every reasonable caller must consciously choose retry, fallback,
alternate input, or abort. Prefer unchecked when local callers cannot recover, when the failure is
an invariant/programming problem, or when a centralized application boundary owns translation.

## Rules For Custom Exception Classes

1. Name the failure precisely: `InventoryReservationException`, not `AppException`.
2. Preserve the original cause with `super(message, cause)`.
3. Store a stable machine-readable code separately from the human message.
4. Add only immutable, non-sensitive context needed for a decision or diagnosis.
5. Never put passwords, tokens, payment data, or unnecessary PII in messages or fields.
6. Keep the hierarchy shallow; catch the narrowest useful abstraction.
7. Do not catch `Throwable` or normally catch `Error`.
8. Do not use exceptions for ordinary branching or validation success/failure loops.
9. Translate once at an ownership boundary; avoid repeated wrap-without-value layers.
10. Log once where the failure is handled, with correlation context; do not log at every rethrow.

## Unchecked Domain Exception

```java
public enum OrderErrorCode {
    INVENTORY_INSUFFICIENT,
    ORDER_NOT_FOUND,
    INVALID_ORDER_STATE
}

public abstract class OrderException extends RuntimeException {
    private final OrderErrorCode code;

    protected OrderException(
            OrderErrorCode code,
            String message,
            Throwable cause
    ) {
        super(message, cause);
        this.code = Objects.requireNonNull(code);
    }

    public OrderErrorCode code() {
        return code;
    }
}

public final class InsufficientInventoryException extends OrderException {
    private final String sku;

    public InsufficientInventoryException(String sku, Throwable cause) {
        super(
            OrderErrorCode.INVENTORY_INSUFFICIENT,
            "Inventory is insufficient for sku=" + safeSku(sku),
            cause
        );
        this.sku = safeSku(sku);
    }

    public String sku() {
        return sku;
    }
}
```

The application can map `OrderErrorCode` to an HTTP response or event without parsing text. The
message remains useful to operators, and the cause retains the original stack and vendor failure.

<ExpandableAnswer title="Code explanation: why use both type and code?">

The subtype supports precise catches inside Java. The enum code is stable across HTTP, messages,
logs, and clients where Java types do not cross the boundary. The message is not a stable protocol:
wording can change, may be localized, and must not be parsed by callers.

</ExpandableAnswer>

## Checked Recoverable Contract

```java
public final class PricingUnavailableException extends Exception {
    private final Duration retryAfter;

    public PricingUnavailableException(
            String message,
            Duration retryAfter,
            Throwable cause
    ) {
        super(message, cause);
        this.retryAfter = Objects.requireNonNull(retryAfter);
    }

    public Duration retryAfter() {
        return retryAfter;
    }
}

public Price quote(ProductId id) throws PricingUnavailableException {
    // Every caller must decide whether to retry, fall back, or fail the operation.
}
```

Do not select checked exceptions just because an I/O library throws one. Translate according to
your API's recovery semantics. Repository frameworks often translate vendor checked failures into
unchecked data-access exceptions because most service methods cannot repair a database failure.

## Translation At Boundaries

```java
public InventoryReservation reserve(ReservationRequest request) {
    try {
        return warehouseClient.reserve(request);
    } catch (WarehouseTimeoutException ex) {
        throw new InventoryReservationException(
            "Warehouse reservation timed out for order=" + request.orderId(),
            ex
        );
    }
}
```

Translation is valuable when it:

- replaces vendor terminology with an application-owned contract;
- adds safe identifiers or operation context;
- assigns retryability or a stable code;
- prevents infrastructure types leaking into the domain.

It is noise when a layer catches `Exception`, changes only the class name, loses the cause, or logs
and immediately rethrows without owning recovery.

## Spring HTTP Error Mapping

```java
@RestControllerAdvice
final class ApiExceptionHandler {

    @ExceptionHandler(InsufficientInventoryException.class)
    ResponseEntity<ProblemDetail> handle(InsufficientInventoryException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        problem.setTitle("Inventory unavailable");
        problem.setProperty("code", ex.code().name());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(problem);
    }
}
```

Return a safe public message and stable code. Log internal causes with a correlation or trace ID;
never return stack traces, SQL, hostnames, credentials, or internal class names to clients.

## Catching And Rethrowing Correctly

```java
try {
    gateway.charge(command);
} catch (GatewayTimeoutException ex) {
    throw new PaymentUnavailableException("Payment gateway timed out", ex);
}
```

Avoid these forms:

```java
catch (Exception ex) { }                         // swallowed
catch (Exception ex) { throw new RuntimeException(ex.getMessage()); } // cause lost
catch (Throwable failure) { return fallback; }   // catches JVM Errors too
```

Use `throw;` only in languages that support it; in Java, `throw ex` can affect precise rethrow
analysis, while wrapping should always preserve `ex` as the cause. Never `return` from `finally`,
because it can suppress the original result or exception.

## Try-With-Resources And Suppressed Exceptions

If the body fails and resource closing also fails, the body failure remains primary and closing
failures appear in `getSuppressed()`.

```java
try (InputStream input = storage.open(key)) {
    return parser.parse(input);
}
```

Do not replace try-with-resources with a `finally` block that accidentally overwrites the primary
failure. Include suppressed exceptions when producing deep diagnostic evidence.

## Validation, Result Types, And Exceptions

| Situation | Better representation |
|---|---|
| malformed command that stops processing | validation exception mapped at boundary |
| many user-input field errors | structured validation result / field-error collection |
| optional absence | `Optional` only when absence is normal and context is not lost |
| batch partial success | result per item, not one swallowed exception |
| invariant broken | unchecked domain exception |
| process-fatal JVM condition | let `Error` propagate; preserve shutdown evidence |

## Dry Run: Failure From Database To HTTP

<ExpandableAnswer title="Trace an insufficient-inventory failure">

1. The database reports that the conditional stock update affected zero rows.
2. The repository exposes an application-specific reservation failure and preserves its cause.
3. The service throws `InsufficientInventoryException` with code
   `INVENTORY_INSUFFICIENT` and a safe SKU.
4. Transaction interception marks the transaction for rollback because the exception is unchecked.
5. `@RestControllerAdvice` maps it to HTTP `409` with a stable public code.
6. One boundary log records the trace ID, code, operation, and internal cause.
7. The client decides whether to change quantity; it never parses the exception message.

</ExpandableAnswer>

## Transaction And Async Cautions

- Spring transactions roll back by default for `RuntimeException` and `Error`, not every checked
  exception. Configure `rollbackFor` only when the business transaction requires it.
- Async frameworks often wrap failures in `CompletionException` or `ExecutionException`. Inspect
  and preserve the cause.
- Retrying needs an explicit idempotency and retryability contract. An exception type alone does
  not make an operation safe to retry.
- Interrupt handling is special: restore the interrupt flag when a boundary cannot propagate
  `InterruptedException`.

```java
catch (InterruptedException ex) {
    Thread.currentThread().interrupt();
    throw new OperationInterruptedException("Reservation interrupted", ex);
}
```

## Testing Exception Contracts

```java
@Test
void preservesCodeAndCause() {
    SQLException cause = new SQLException("constraint");
    InsufficientInventoryException ex =
        new InsufficientInventoryException("BOOK-1", cause);

    assertThat(ex.code()).isEqualTo(OrderErrorCode.INVENTORY_INSUFFICIENT);
    assertThat(ex).hasCause(cause);
}
```

Test the subtype, code, cause, safe message, transaction rollback, HTTP mapping, serialization shape,
retry classification, and absence of sensitive data. Do not assert an entire human message unless
its wording is intentionally contractual.

## Interview Questions

<ExpandableAnswer title="When should a custom exception be checked?">

When the method contract expects every caller to make an immediate recovery decision and that
decision is meaningful. If recovery belongs at a centralized boundary or the failure is an
invariant/programming problem, an unchecked exception is usually clearer.

</ExpandableAnswer>

<ExpandableAnswer title="Why preserve the cause?">

It retains the original stack, vendor type, suppressed exceptions, and low-level evidence. Without
it, production diagnosis stops at the translation layer and the actual failure may be impossible
to reconstruct.

</ExpandableAnswer>

<ExpandableAnswer title="Should an application catch Error?">

Normally no. Errors often indicate JVM or environment conditions that ordinary business recovery
cannot safely handle. Catch only at a narrowly justified shutdown/diagnostic boundary and do not
pretend the process can continue normally.

</ExpandableAnswer>

<ExpandableAnswer title="How does Spring transaction rollback differ for checked exceptions?">

By default, unchecked exceptions and `Error` trigger rollback; checked exceptions do not. The
transaction contract may explicitly configure rollback for a checked type. Choose exception
semantics first, then make rollback policy explicit rather than extending `RuntimeException` only
to obtain rollback.

</ExpandableAnswer>

## Official References

- [Java exceptions tutorial](https://docs.oracle.com/javase/tutorial/essential/exceptions/)
- [`Throwable`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Throwable.html)
- [`RuntimeException`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/RuntimeException.html)
- [Spring rollback rules](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/rolling-back.html)
- [Spring MVC error responses](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html)

## Recommended Next

Continue with [Exception Handling Across Streams And Async Workflows](./JAVA-EXCEPTION-ASYNC-DEEP-DIVE.md).
