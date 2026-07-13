---
title: Shared Web Pagination
status: "maintained"
last_reviewed: "2026-07-13"
---

# Shared Web Pagination

Back to [Platform Infrastructure](./README.md).

## Status

Implemented.

## Purpose

Use `shopverse-web` for shared page response DTOs and pagination validation
helpers.

## Problem

Pagination DTOs and helpers existed mostly in `user-service`, making other
services likely to reimplement page response mapping and validation.

## When To Use

Use this module when an endpoint returns a paged list or validates `page`,
`size`, and `sort` request parameters.

Do not move endpoint-specific allowed sort fields into the platform module.

## Solution

`shopverse-web` provides:

- `PageResponse`
- `PageMapper`
- `PaginationUtils`
- `InvalidPageRequestException`

## Used By

- `user-service`

## Gradle Dependency

```groovy
dependencies {
    implementation 'io.shopverse.platform:shopverse-web:0.0.1-SNAPSHOT'
}
```

## Service-Owned Code

Services choose allowed sort fields and decide which endpoints are pageable.

## Configuration Properties

None.

## Migration Steps

Add the dependency.

```groovy
dependencies {
    implementation 'io.shopverse.platform:shopverse-web:0.0.1-SNAPSHOT'
}
```

Return the shared page response type from service methods.

```java
import io.shopverse.platform.web.pagination.PageMapper;
import io.shopverse.platform.web.pagination.PageResponse;

public PageResponse<UserSummaryResponse> listUsers(Pageable pageable) {
    Page<User> page = userRepository.findAll(pageable);

    return PageMapper.toResponse(
            page,
            user -> new UserSummaryResponse(
                    user.getId(),
                    user.getEmail(),
                    user.getDisplayName()
            )
    );
}
```

Use the shared validation exception when page or size parameters are invalid.

```java
import io.shopverse.platform.web.pagination.InvalidPageRequestException;
import io.shopverse.platform.web.pagination.PaginationUtils;

Pageable pageable = PaginationUtils.pageRequest(
        page,
        size,
        sort,
        Set.of("email", "createdAt")
);
```

Keep the allowed sort fields local. They are part of the API contract for a
specific endpoint.

## Verification

Run pagination unit tests and one controller test:

```powershell
.\gradlew.bat test --no-daemon
```

Check:

- valid `page`, `size`, and `sort` values return `PageResponse`
- invalid page or size values return the service's normal API error response
- disallowed sort fields are rejected

## Troubleshooting

| Symptom | Check |
|---|---|
| Invalid sort is accepted | The endpoint is not using `PaginationUtils.pageRequest(...)` with local allowed fields. |
| Error response shape differs | Wire `InvalidPageRequestException` through the service's local exception handler. |
| Page metadata is wrong | Confirm `PageMapper.toResponse(...)` receives the original Spring `Page`, not a manually sliced list. |

## Related Docs

- [Common Error Contract](./COMMON-ERROR.md)
- [Spring REST APIs](../development/SPRING-REST-APIS.md)
- [Config Property Reference](./CONFIG-PROPERTIES.md)
