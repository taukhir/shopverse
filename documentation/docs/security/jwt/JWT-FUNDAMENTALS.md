---
title: JWT Fundamentals
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

## Related Guides

- [JWKS and asymmetric JWT](JWKS-ASYMMETRIC-JWT.md)
- [JWT claims roles and scopes](JWT-CLAIMS-ROLES-SCOPES.md)
- [Spring JWT resource server](../spring-security/JWT-JWKS-RESOURCE-SERVER.md)

