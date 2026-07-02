---
title: Spring REST APIs
---

# Spring REST APIs

Spring REST API material is split into controller design, request mapping, validation/errors, file handling, concurrency/idempotency/OpenAPI, REST clients, testing, and interviews.

## Shopverse Implementation Path

Shopverse shares a small amount of REST infrastructure:

| REST Concern | Shopverse page |
|---|---|
| Shared API error response record | [Common Error Contract](../platform/COMMON-ERROR.md) |
| Shared page response and pagination helpers | [Shared Web Pagination](../platform/WEB-PAGINATION.md) |
| Platform troubleshooting | [Platform Troubleshooting](../platform/TROUBLESHOOTING.md) |

Controllers, request DTOs, response DTOs, endpoint sort fields, and exception
policy remain service-owned. The platform modules standardize transport
helpers only.

## Focused Pages

| Page | Covers |
|---|---|
| [Spring REST API Basics And CRUD](spring-rest/REST-BASICS-CRUD.md) | Dependencies, request lifecycle, and a clean CRUD structure. |
| [Spring REST Request Mapping Validation And Errors](spring-rest/REST-MAPPING-VALIDATION-ERRORS.md) | Request data mapping, validation, ResponseEntity, and central error handling. |
| [Spring REST Files Pagination And Idempotency](spring-rest/REST-FILES-PAGINATION-IDEMPOTENCY.md) | Multipart uploads, downloads, pagination, conditional requests, idempotent commands, and OpenAPI docs. |
| [Spring REST Clients And Feign](spring-rest/REST-CLIENTS-FEIGN.md) | RestTemplate, RestClient, WebClient, Feign, and choosing the right HTTP client. |
| [Spring REST Testing And Interview Guide](spring-rest/REST-TESTING-INTERVIEW.md) | Controller testing, do and do not rules, interview questions, and related guides. |

## Compatibility Anchors

The original long page was split into focused pages. These headings are kept so older links have a stable landing point.

## Required Dependencies

Moved to [Spring REST API Basics And CRUD](spring-rest/REST-BASICS-CRUD.md).

## Request Lifecycle

Moved to [Spring REST API Basics And CRUD](spring-rest/REST-BASICS-CRUD.md).

## A Clean CRUD Structure

Moved to [Spring REST API Basics And CRUD](spring-rest/REST-BASICS-CRUD.md).

## Mapping Request Data

Moved to [Spring REST Request Mapping Validation And Errors](spring-rest/REST-MAPPING-VALIDATION-ERRORS.md).

## Validation

Moved to [Spring REST Request Mapping Validation And Errors](spring-rest/REST-MAPPING-VALIDATION-ERRORS.md).

## `ResponseEntity`

Moved to [Spring REST Request Mapping Validation And Errors](spring-rest/REST-MAPPING-VALIDATION-ERRORS.md).

## Central Error Handling

Moved to [Spring REST Request Mapping Validation And Errors](spring-rest/REST-MAPPING-VALIDATION-ERRORS.md).

## Multipart File Upload

Moved to [Spring REST Files Pagination And Idempotency](spring-rest/REST-FILES-PAGINATION-IDEMPOTENCY.md).

## File Download

Moved to [Spring REST Files Pagination And Idempotency](spring-rest/REST-FILES-PAGINATION-IDEMPOTENCY.md).

## Pagination, Sorting, And Filtering

Moved to [Spring REST Files Pagination And Idempotency](spring-rest/REST-FILES-PAGINATION-IDEMPOTENCY.md).

## Conditional Requests And Optimistic Concurrency

Moved to [Spring REST Files Pagination And Idempotency](spring-rest/REST-FILES-PAGINATION-IDEMPOTENCY.md).

## Idempotent Commands

Moved to [Spring REST Files Pagination And Idempotency](spring-rest/REST-FILES-PAGINATION-IDEMPOTENCY.md).

## OpenAPI Documentation

Moved to [Spring REST Files Pagination And Idempotency](spring-rest/REST-FILES-PAGINATION-IDEMPOTENCY.md).

## Calling Other REST APIs

Moved to [Spring REST Clients And Feign](spring-rest/REST-CLIENTS-FEIGN.md).

## Controller Testing

Moved to [Spring REST Testing And Interview Guide](spring-rest/REST-TESTING-INTERVIEW.md).

## Do And Do Not

Moved to [Spring REST Testing And Interview Guide](spring-rest/REST-TESTING-INTERVIEW.md).

## Lead Engineer Interview Questions

Moved to [Spring REST Testing And Interview Guide](spring-rest/REST-TESTING-INTERVIEW.md).

## Related Guides

Moved to [Spring REST Testing And Interview Guide](spring-rest/REST-TESTING-INTERVIEW.md).
