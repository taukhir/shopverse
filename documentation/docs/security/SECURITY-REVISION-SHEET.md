---
title: Application And Platform Security Revision Sheet
description: Rapid revision of threat modeling, authentication, authorization, OAuth2, OIDC, JWT, service identity, secrets, and incident operations.
difficulty: Advanced
page_type: Interview
status: Generic
prerequisites: [Application And Platform Security Learning Guide]
learning_objectives: [Recall security boundaries quickly, Review distributed authorization designs, Answer security architect scenarios]
technologies: [Spring Security 7, OAuth2, OIDC, JWT, Kubernetes]
last_reviewed: "2026-07-23"
---

# Application And Platform Security Revision Sheet

## Core Rule

Authentication establishes identity. Authorization decides whether that identity
may perform this action on this object in this context. Every service protecting a
resource must enforce its authoritative policy.

## One-Line Recall

| Concept | Revision answer |
|---|---|
| threat model | Assets, actors, trust boundaries, threats, controls, and residual risk. |
| least privilege | Grant only required operations, resources, scope, and duration. |
| defense in depth | Independent controls limit failure of any single boundary. |
| OAuth2 | Delegated authorization framework for obtaining scoped access tokens. |
| OIDC | Identity layer over OAuth2 that adds authentication and ID tokens. |
| JWT | Signed claims container; not encryption and not automatically safe authorization. |
| JWKS | Published public keys used to validate token signatures and rotation. |
| CSRF | Attacker causes a browser to send authenticated state-changing requests. |
| CORS | Browser policy controlling which origins may read cross-origin responses. |
| workload identity | Verifiable identity for a service, job, or machine. |

## Token Validation

Validate signature/algorithm, issuer, audience, expiry/not-before, key selection,
token type, and required claims. Map claims to application authorities deliberately.
Never trust a token merely because it can be decoded.

Short-lived access tokens limit exposure. Refresh tokens need rotation, reuse
detection, secure storage, revocation, and session/device ownership. API keys need
hashing or secure secret storage, scopes, rotation, expiry, audit, and rate limits.

## Authorization Review

- endpoint permission and HTTP method;
- object ownership and tenant boundary;
- role/scope/attribute semantics;
- state-dependent business permission;
- service-to-service identity and delegation;
- administrative separation of duties;
- deny and audit behavior;
- cache and policy-change propagation.

## Common Failures

- gateway authenticates but services omit authorization;
- ID token is used as an API access token;
- user-controlled role or tenant claims are trusted;
- wildcard CORS with credentials;
- secrets appear in source, images, logs, or telemetry;
- symmetric keys are shared across unrelated verifiers;
- long-lived credentials have no rotation path;
- object-level authorization is replaced by UI hiding;
- sensitive error/log data crosses tenant boundaries.

## Incident Prompt

For a leaked credential: identify scope, revoke/rotate, preserve evidence, block
abuse, inspect audit and data access, notify owners, restore service with new trust,
and correct the issuance/storage/control weakness. Rotation is incomplete until old
material is unusable and every workload reconnects.

## Final Checklist

- trust boundaries and assets are modeled;
- user and workload identities are distinct;
- token validation and authorization occur at resource boundaries;
- secrets, keys, and certificates rotate without downtime;
- data is minimized, encrypted, redacted, retained, and deleted by policy;
- dependencies and build artifacts are verified;
- security events are auditable and incident response is tested.

Continue with the [Security Interview Workbook](./platform/SECURITY-INTERVIEW-WORKBOOK.md).
