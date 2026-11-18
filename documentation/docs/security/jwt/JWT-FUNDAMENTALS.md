---
title: JWT Fundamentals
status: maintained
last_reviewed: "2026-11-17"
page_type: Guide
difficulty: Intermediate
scope: generic
owner: docs-security
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# JWT Fundamentals

JWT means JSON Web Token. It is a compact token format used to carry claims
between parties. A JWT can be signed so the receiver can verify it was issued
by a trusted party and was not modified.

## Structure

```text
header.payload.signature
```

| Part | Purpose |
|---|---|
| Header | token type, algorithm, key ID |
| Payload | claims such as subject, issuer, expiry, roles, scopes |
| Signature | proves integrity and issuer key ownership |

Example claims:

```json
{
  "iss": "shopverse-auth-service",
  "sub": "admin",
  "roles": ["ADMIN"],
  "scope": "orders:read orders:write",
  "exp": 1893456000
}
```

JWT is not automatically secure. Security depends on validating signature,
issuer, audience, expiry, algorithm, and authorization claims.

## JWT Versus Session

| Topic | JWT access token | Server session |
|---|---|---|
| Storage | client holds token | server stores session |
| Revocation | harder unless denylist/short expiry | delete session |
| Scale | no central session lookup required | needs shared session store |
| Risk | token theft gives bearer access | session cookie theft gives session access |

## Shopverse Reality

`auth-service`'s `JwtService.generateToken(...)` issues a fixed **1-hour**
access token and nothing else:

```java
.expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
```

There is no refresh-token endpoint, no logout endpoint, and no revocation
mechanism anywhere in the service — confirmed by grepping the controller
and service layer for `refresh`/`logout`/`revoke`/`denylist`, none exist.
Looking at the "JWT Versus Session" table above with that in mind: the
"harder unless denylist/short expiry" revocation row isn't a hypothetical
tradeoff here, it's the actual current behavior — a compromised or
still-valid token from a now-removed user stays usable for up to the
remaining hour of its lifetime, full stop, because neither mitigation
the table lists is implemented yet. This is explicit, tracked scope (see
`services/auth-service/AGENTS.md`: "not a complete OAuth2 authorization
server"), not an oversight — but it means the 1-hour window **is** the
platform's entire revocation story today.

## Related Guides

- [JWKS and asymmetric JWT](JWKS-ASYMMETRIC-JWT.md)
- [JWT claims roles and scopes](JWT-CLAIMS-ROLES-SCOPES.md)
- [JWT best practices](JWT-BEST-PRACTICES.md)
- [Spring JWT resource server](../spring-security/JWT-JWKS-RESOURCE-SERVER.md)
- [ADR 003: RSA-Signed JWT And JWKS Authentication](../../architecture/adr/003-jwt-jwks-security.md)

