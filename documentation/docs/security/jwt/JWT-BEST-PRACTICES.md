---
title: JWT Best Practices
status: "maintained"
last_reviewed: "2026-07-13"
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

## Related Guides

- [JWKS and asymmetric JWT](JWKS-ASYMMETRIC-JWT.md)
- [Token lifecycle](../oauth/TOKEN-LIFECYCLE.md)

