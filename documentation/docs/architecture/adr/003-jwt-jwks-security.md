---
title: "ADR 003: JWT And JWKS Security Model"
status: "maintained"
last_reviewed: "2026-07-13"
---

# ADR 003: JWT And JWKS Security Model

## Context

Services must validate caller identity and permissions without sharing a
private signing key across the platform.

## Decision

Use RSA-signed JWT access tokens issued by the Auth Service and expose public
verification keys through JWKS. Downstream services validate tokens and enforce
role, permission, and resource-ownership rules.

## Consequences

- Private signing material stays with the issuer.
- Resource services can validate tokens independently.
- Gateway routing and service authorization remain separate concerns.
- Token expiry, ownership checks, and internal service authentication are
  testable independently.
- Key rotation and secret management remain production concerns outside this
  local proof of concept.
