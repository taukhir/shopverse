# Observability Starter

## Problem

Servlet services repeated request logging filters with the same correlation
header extraction, MDC population, actuator exclusion, request metrics, and
response header propagation.

## Solution

`shopverse-observability-starter` provides:

- `CorrelationConstants`
- `CorrelationContext`
- `ShopverseRequestLoggingFilter`
- `ShopverseObservabilityAutoConfiguration`
- `ShopverseObservabilityProperties`

## Used By

- `user-service`
- `order-service`
- `payment-service`
- `inventory-service`
- `auth-service`
- `config-server`
- `discovery-server`

## Service-Owned Code

`api-gateway` is reactive and remains local. Gateway observability should use a
WebFlux-specific implementation if it is extracted later.
