---
title: JWT Claims Roles And Scopes
status: "maintained"
last_reviewed: "2026-07-13"
---

# JWT Claims Roles And Scopes

Claims are token fields. Some are standardized; others are application-specific.

## Common Claims

| Claim | Meaning |
|---|---|
| `iss` | issuer |
| `sub` | subject/user/service identity |
| `aud` | intended audience |
| `exp` | expiry time |
| `iat` | issued-at time |
| `jti` | unique token ID |
| `scope` | OAuth2 permission strings |
| `roles` | application roles |

## Roles Versus Scopes

| Concept | Typical meaning |
|---|---|
| Role | who the subject is, such as `ADMIN` or `CUSTOMER` |
| Scope | what the token may access, such as `orders:read` |
| Permission | fine-grained application capability |
| Group | identity-provider grouping that may map to roles |

Spring Security often prefixes roles as `ROLE_` for `hasRole(...)`. If a JWT
already contains final authorities, configure a converter deliberately instead
of relying on defaults.

## Shopverse Pattern

Shopverse uses JWT claims to carry roles/permissions and Spring method security
to protect ownership and admin-only operations.

```java
@PreAuthorize(\"hasAuthority('ORDER_READ') or hasRole('ADMIN')\")
public OrderTimelineResponse getTimeline(String orderNumber) {
    // service also verifies resource ownership
}
```

## Related Guides

- [Authorization and method security](../spring-security/AUTHORIZATION-METHOD-SECURITY.md)
- [JWT fundamentals](JWT-FUNDAMENTALS.md)

