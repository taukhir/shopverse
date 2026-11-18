---
title: JWT Best Practices
status: maintained
last_reviewed: "2026-11-17"
page_type: Guide
difficulty: Intermediate
scope: generic
owner: docs-security
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# JWT Best Practices

JWTs are bearer credentials. Anyone who has a valid token can use it until it
expires or is blocked.

## Validation Checklist

- Validate signature.
- Validate `iss`.
- Validate `aud` when tokens target specific services.
- Validate `exp` and clock skew.
- Reject `alg=none`.
- Use an allowlist of algorithms.
- Map roles/scopes explicitly.
- Keep access tokens short-lived.
- Avoid storing sensitive personal data in the payload.

## Storage

| Client type | Recommended storage |
|---|---|
| browser web app | secure, HttpOnly, SameSite cookie when possible |
| mobile/native | OS secure storage |
| backend service | memory or secret-managed credential flow |

## Revocation Options

| Option | Tradeoff |
|---|---|
| short expiry | simplest and scalable |
| refresh token rotation | better user experience, more state |
| token denylist by `jti` | immediate blocking, requires lookup |
| key rotation | invalidates token sets signed by old keys |

## Shopverse Reality

Checking Shopverse against its own table above: of the four revocation
options listed, exactly **one** is in place — short expiry (`auth-service`
issues access tokens with a fixed 1-hour `exp`, `JwtService.java:34`).
Refresh-token rotation, `jti` denylisting, and key rotation are all **not
implemented** — there is no refresh endpoint, no logout/revoke endpoint,
and the JWKS signing key is a single hard-coded key with no rotation
support (see [JWKS reality](JWKS-ASYMMETRIC-JWT.md#shopverse-reality-rotation-support-is-not-actually-wired)).
Audience (`aud`) validation from the checklist above is also not
configured on any resource server yet — every service validates
signature, issuer, and expiry (`JwtValidators.createDefaultWithIssuer(...)`),
but none configure an audience validator. None of this is accidental:
`services/auth-service/AGENTS.md` states plainly that this service is
"not a complete OAuth2 authorization server" — but it does mean the
1-hour expiry is currently the platform's *only* working line of defense
against a leaked or no-longer-valid token, not one layer among several.

## Related Guides

- [JWT fundamentals](JWT-FUNDAMENTALS.md)
- [JWKS and asymmetric JWT](JWKS-ASYMMETRIC-JWT.md)
- [JWT claims, roles, and scopes](JWT-CLAIMS-ROLES-SCOPES.md)
- [Token lifecycle](../oauth/TOKEN-LIFECYCLE.md)

