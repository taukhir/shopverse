---
title: Common Error Contract
status: "maintained"
last_reviewed: "2026-07-13"
---

# Common Error Contract

Back to [Platform Infrastructure](./README.md).

## Status

Implemented.

## Purpose

Use `shopverse-common-error` when a service needs the shared HTTP error
response shape but still wants to keep its local exception-handler policy.

## Problem

Services used local API error response DTOs, which could drift in field names
and JSON shape.

## When To Use

Use this module in servlet or reactive services that return Shopverse API
errors.

Do not use it to centralize every exception handler. Services still decide
which exception maps to which HTTP status.

## Solution

`shopverse-common-error` provides:

- `io.shopverse.platform.error.ApiErrorResponse`
- `io.shopverse.platform.error.ApiErrors`

`ApiErrorResponse` is the shared JSON response record. `ApiErrors` is a small
helper for local exception handlers that need to build `ProblemDetail`,
`ResponseEntity<ApiErrorResponse>`, or validation-error maps consistently.

## Used By

- `user-service`
- `order-service`
- `payment-service`
- `inventory-service`

## Gradle Dependency

```groovy
dependencies {
    implementation 'io.shopverse.platform:shopverse-common-error:0.0.1-SNAPSHOT'
}
```

If the service is not already using the platform composite build, add:

```groovy
// settings.gradle
includeBuild('../shopverse-platform')
```

## Service-Owned Code

Services still own their exception classes and exception-handler policy. This
module standardizes the response contract only.

## Configuration Properties

None.

## Migration Steps

Add the platform build and dependency.

```groovy
// settings.gradle
includeBuild('../shopverse-platform')
```

```groovy
// build.gradle
dependencies {
    implementation 'io.shopverse.platform:shopverse-common-error:0.0.1-SNAPSHOT'
}
```

Use the shared response record and helper in the local exception handler.

```java
import io.shopverse.platform.error.ApiErrorResponse;
import io.shopverse.platform.error.ApiErrors;

@ExceptionHandler(ResourceNotFoundException.class)
public ResponseEntity<ApiErrorResponse> handleNotFound(
        ResourceNotFoundException ex
) {
    return ApiErrors.response(HttpStatus.NOT_FOUND, ex.getMessage());
}
```

Services that use Spring `ProblemDetail` can use the same helper without
adopting the `ApiErrorResponse` JSON shape:

```java
@ExceptionHandler(ResourceNotFoundException.class)
ProblemDetail handleNotFound(ResourceNotFoundException exception) {
    return ApiErrors.problem(HttpStatus.NOT_FOUND, exception.getMessage());
}
```

Delete service-local DTOs that only duplicate `ApiErrorResponse`. Keep the
handler itself local because each service may have different exception classes
and status-code policy.

## Verification

Run the service tests that cover exception handlers:

```powershell
.\gradlew.bat test --no-daemon
```

For an endpoint-level check, call a known missing resource and verify the JSON
fields:

```json
{
  "status": 404,
  "message": "...",
  "timestamp": "...",
  "errors": null
}
```

## Troubleshooting

| Symptom | Check |
|---|---|
| `ApiErrorResponse` cannot be imported | The service is missing `includeBuild('../shopverse-platform')` or the `shopverse-common-error` dependency. |
| `ApiErrors` cannot be imported | The service is on an older platform build or is missing the `shopverse-common-error` dependency. |
| Error JSON shape is still different | The local handler is still returning a service-local DTO. |
| Wrong HTTP status | Fix the local exception handler. The platform module only owns the response record. |

## Related Docs

- [Shared Web Pagination](./WEB-PAGINATION.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Documentation Maintenance Map](../reference/DOCUMENTATION-MAINTENANCE-MAP.md)
