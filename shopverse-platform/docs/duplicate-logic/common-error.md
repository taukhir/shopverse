# Common Error Contract

## Problem

Services used local API error response DTOs, which could drift in field names
and JSON shape.

## Solution

`shopverse-common-error` provides:

- `io.shopverse.platform.error.ApiErrorResponse`

## Used By

- `user-service`

## Service-Owned Code

Services still own their exception classes and exception-handler policy. This
module standardizes the response contract only.
