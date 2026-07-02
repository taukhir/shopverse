# Shared Web Pagination

## Problem

Pagination DTOs and helpers existed mostly in `user-service`, making other
services likely to reimplement page response mapping and validation.

## Solution

`shopverse-web` provides:

- `PageResponse`
- `PageMapper`
- `PaginationUtils`
- `InvalidPageRequestException`

## Used By

- `user-service`

## Service-Owned Code

Services choose allowed sort fields and decide which endpoints are pageable.
