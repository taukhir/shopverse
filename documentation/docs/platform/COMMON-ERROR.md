---
title: Common Error Contract
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

## Used By

- `user-service`

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

Use the shared response record in the local exception handler.

```java
import io.shopverse.platform.error.ApiErrorResponse;

@ExceptionHandler(ResourceNotFoundException.class)
public ResponseEntity<ApiErrorResponse> handleNotFound(
        ResourceNotFoundException ex,
        HttpServletRequest request
) {
    return buildError(HttpStatus.NOT_FOUND, ex.getMessage(), request.getRequestURI());
}

private ResponseEntity<ApiErrorResponse> buildError(
        HttpStatus status,
        String message,
        String path
) {
    ApiErrorResponse error = new ApiErrorResponse(
            Instant.now(),
            status.value(),
            status.getReasonPhrase(),
            message,
            path
    );
    return ResponseEntity.status(status).body(error);
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
  "timestamp": "...",
  "status": 404,
  "error": "Not Found",
  "message": "...",
  "path": "/..."
}
```

## Troubleshooting

| Symptom | Check |
|---|---|
| `ApiErrorResponse` cannot be imported | The service is missing `includeBuild('../shopverse-platform')` or the `shopverse-common-error` dependency. |
| Error JSON shape is still different | The local handler is still returning a service-local DTO. |
| Wrong HTTP status | Fix the local exception handler. The platform module only owns the response record. |

## Related Docs

- [Shared Web Pagination](./WEB-PAGINATION.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Documentation Maintenance Map](../reference/DOCUMENTATION-MAINTENANCE-MAP.md)
