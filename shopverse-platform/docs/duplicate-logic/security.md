# Security Starter

## Problem

Servlet resource-server services repeated JWT decoder setup, issuer validation,
and role/permission authority mapping.

## Solution

`shopverse-security-starter` provides:

- `ShopverseJwtAuthoritiesConverter`
- shared `JwtAuthenticationConverter`
- shared `JwtDecoder`
- issuer validation from `security.jwt.issuer`
- JWKS resolution from `spring.security.oauth2.resourceserver.jwt.jwk-set-uri`

## Used By

- `user-service`
- `order-service`
- `payment-service`
- `inventory-service`

## Service-Owned Code

Services still own:

- `SecurityFilterChain`
- endpoint authorization rules
- `@PreAuthorize` policy
- internal Basic auth
- token issuing

`api-gateway` is reactive and not covered by this servlet starter.
