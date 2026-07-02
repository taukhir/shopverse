---
title: Spring Security
---

# Spring Security

Spring Security material is split into focused pages for authentication basics, servlet filter internals, JWT/JWKS, authorization, OAuth2, and production security practices.

## Shopverse Implementation Path

After reading the generic security pages, use these Shopverse pages for the
actual implementation:

| Concept | Shopverse page |
|---|---|
| Servlet JWT resource-server shared setup | [Security Starter](../platform/SECURITY-STARTER.md) |
| Current JWT/OAuth2 mapping | [JWT, OAuth2, And Spring Security](JWT-OAUTH2-SPRING-SECURITY.md) |
| Security starter properties and troubleshooting | [Platform Config Properties](../platform/CONFIG-PROPERTIES.md) and [Platform Troubleshooting](../platform/TROUBLESHOOTING.md) |
| Resource ownership authorization problems | [Resource Ownership Authorization](../reliability/problems/runtime/RESOURCE-OWNERSHIP-AUTHORIZATION.md) |

Important boundary: the current platform security starter is servlet-based.
`api-gateway` uses WebFlux and keeps reactive security configuration local.

For generic security study material, start with:

- [Security principles](principles/SECURITY-PRINCIPLES.md)
- [Microservices security principles](principles/MICROSERVICES-SECURITY-PRINCIPLES.md)
- [JWT fundamentals](jwt/JWT-FUNDAMENTALS.md)
- [OAuth2 fundamentals](oauth/OAUTH2-FUNDAMENTALS.md)
- [Token lifecycle](oauth/TOKEN-LIFECYCLE.md)

## Focused Pages

| Page | Covers |
|---|---|
| [Spring Security Authentication Basics](spring-security/AUTHENTICATION-BASICS.md) | Authentication, authorization, dependencies, authentication managers, providers, form login, HTTP Basic, database-backed users, and UserDetails. |
| [Spring Security Servlet Filter Chain](spring-security/SERVLET-FILTER-CHAIN.md) | Servlet security architecture, core classes, SecurityContext, multiple chains, exceptions, sessions, CSRF, and CORS. |
| [JWT JWKS And Resource Server Security](spring-security/JWT-JWKS-RESOURCE-SERVER.md) | Bearer JWT authentication, JWT parts, JWS/JWE/JWK/JWKS, symmetric/asymmetric signing, Shopverse encoding/decoding, claims, revocation, and production practices. |
| [Spring Security Authorization And Method Security](spring-security/AUTHORIZATION-METHOD-SECURITY.md) | Scopes, roles, groups, authorities, JWT authority conversion, RBAC/policy models, method security, URL security, and Shopverse summary. |
| [OAuth2 OIDC And Token Flows](spring-security/OAUTH2-OIDC-FLOWS.md) | OAuth2 roles, authorization code with PKCE, client credentials, device flow, refresh tokens, password grant, and OIDC. |
| [Spring Security Production Practices](spring-security/PRODUCTION-PRACTICES.md) | Password security, related guides, and official references. |

## Compatibility Anchors

The original long page was split into focused pages. These headings are kept so older links have a stable landing point.

## Authentication And Authorization

Moved to [Spring Security Authentication Basics](spring-security/AUTHENTICATION-BASICS.md).

## Core Dependencies

Moved to [Spring Security Authentication Basics](spring-security/AUTHENTICATION-BASICS.md).

## Servlet Security Architecture

Moved to [Spring Security Servlet Filter Chain](spring-security/SERVLET-FILTER-CHAIN.md).

## Important Interfaces And Classes

Moved to [Spring Security Servlet Filter Chain](spring-security/SERVLET-FILTER-CHAIN.md).

## AuthenticationManager And Providers

Moved to [Spring Security Authentication Basics](spring-security/AUTHENTICATION-BASICS.md).

## Common Authentication Providers

Moved to [Spring Security Authentication Basics](spring-security/AUTHENTICATION-BASICS.md).

## Form Login

Moved to [Spring Security Authentication Basics](spring-security/AUTHENTICATION-BASICS.md).

## HTTP Basic Authentication

Moved to [Spring Security Authentication Basics](spring-security/AUTHENTICATION-BASICS.md).

## Database-Backed Authentication

Moved to [Spring Security Authentication Basics](spring-security/AUTHENTICATION-BASICS.md).

## UserDetails And Authorities

Moved to [Spring Security Authentication Basics](spring-security/AUTHENTICATION-BASICS.md).

## SecurityContext And SecurityContextHolder

Moved to [Spring Security Servlet Filter Chain](spring-security/SERVLET-FILTER-CHAIN.md).

## Stateless Bearer JWT Authentication

Moved to [JWT JWKS And Resource Server Security](spring-security/JWT-JWKS-RESOURCE-SERVER.md).

## JWT Structure

Moved to [JWT JWKS And Resource Server Security](spring-security/JWT-JWKS-RESOURCE-SERVER.md).

## JWS, JWE, JWK, And JWKS

Moved to [JWT JWKS And Resource Server Security](spring-security/JWT-JWKS-RESOURCE-SERVER.md).

## Symmetric And Asymmetric JWT Signing

Moved to [JWT JWKS And Resource Server Security](spring-security/JWT-JWKS-RESOURCE-SERVER.md).

## Shopverse JWT Encoding

Moved to [JWT JWKS And Resource Server Security](spring-security/JWT-JWKS-RESOURCE-SERVER.md).

## JWKS Publication

Moved to [JWT JWKS And Resource Server Security](spring-security/JWT-JWKS-RESOURCE-SERVER.md).

## Shopverse JWT Decoding

Moved to [JWT JWKS And Resource Server Security](spring-security/JWT-JWKS-RESOURCE-SERVER.md).

## Claim Types

Moved to [JWT JWKS And Resource Server Security](spring-security/JWT-JWKS-RESOURCE-SERVER.md).

## Scope, Role, Group, And Authority

Moved to [Spring Security Authorization And Method Security](spring-security/AUTHORIZATION-METHOD-SECURITY.md).

## JWT Authority Conversion

Moved to [Spring Security Authorization And Method Security](spring-security/AUTHORIZATION-METHOD-SECURITY.md).

## Authorization Models

Moved to [Spring Security Authorization And Method Security](spring-security/AUTHORIZATION-METHOD-SECURITY.md).

## Method Security

Moved to [Spring Security Authorization And Method Security](spring-security/AUTHORIZATION-METHOD-SECURITY.md).

## URL Security Versus Method Security

Moved to [Spring Security Authorization And Method Security](spring-security/AUTHORIZATION-METHOD-SECURITY.md).

## OAuth2 Roles

Moved to [OAuth2 OIDC And Token Flows](spring-security/OAUTH2-OIDC-FLOWS.md).

## Authorization Code With PKCE

Moved to [OAuth2 OIDC And Token Flows](spring-security/OAUTH2-OIDC-FLOWS.md).

## Client Credentials

Moved to [OAuth2 OIDC And Token Flows](spring-security/OAUTH2-OIDC-FLOWS.md).

## Device Authorization

Moved to [OAuth2 OIDC And Token Flows](spring-security/OAUTH2-OIDC-FLOWS.md).

## Refresh Tokens

Moved to [OAuth2 OIDC And Token Flows](spring-security/OAUTH2-OIDC-FLOWS.md).

## OAuth2 Resource Owner Password Grant

Moved to [OAuth2 OIDC And Token Flows](spring-security/OAUTH2-OIDC-FLOWS.md).

## OAuth2 And OIDC

Moved to [OAuth2 OIDC And Token Flows](spring-security/OAUTH2-OIDC-FLOWS.md).

## JWT Revocation And Blocking

Moved to [JWT JWKS And Resource Server Security](spring-security/JWT-JWKS-RESOURCE-SERVER.md).

## Multiple SecurityFilterChains

Moved to [Spring Security Servlet Filter Chain](spring-security/SERVLET-FILTER-CHAIN.md).

## Exceptions

Moved to [Spring Security Servlet Filter Chain](spring-security/SERVLET-FILTER-CHAIN.md).

## Session And Stateless Security

Moved to [Spring Security Servlet Filter Chain](spring-security/SERVLET-FILTER-CHAIN.md).

## CSRF And CORS

Moved to [Spring Security Servlet Filter Chain](spring-security/SERVLET-FILTER-CHAIN.md).

## Password Security

Moved to [Spring Security Production Practices](spring-security/PRODUCTION-PRACTICES.md).

## JWT And OAuth2 Production Practices

Moved to [JWT JWKS And Resource Server Security](spring-security/JWT-JWKS-RESOURCE-SERVER.md).

## Shopverse Security Summary

Moved to [Spring Security Authorization And Method Security](spring-security/AUTHORIZATION-METHOD-SECURITY.md).

## Related Guides

Moved to [Spring Security Production Practices](spring-security/PRODUCTION-PRACTICES.md).

## Official References

Moved to [Spring Security Production Practices](spring-security/PRODUCTION-PRACTICES.md).
