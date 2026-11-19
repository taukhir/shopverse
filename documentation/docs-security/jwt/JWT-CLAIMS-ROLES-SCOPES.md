---
title: JWT Claims Roles And Scopes
status: maintained
last_reviewed: "2026-11-17"
page_type: Guide
difficulty: Intermediate
scope: generic
owner: docs-security
reviewer: documentation-maintainers
review_evidence: repository-content-audit
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

**Only two of the claims in the table above are actually issued.**
`JwtService.generateToken(...)` sets `roles` (space-joined) and
`permissions` (a list) — there is no `scope` claim and no `aud` claim
anywhere in the token it builds; "roles versus scopes" is a real
conceptual distinction, but Shopverse's own tokens only carry the roles
side of it today.

**The `ROLE_` prefix is not added by Shopverse's converter — it has to
already be in the stored data.** Every service shares one
`JwtGrantedAuthoritiesConverter`
(`shopverse-common/shopverse-security-starter`'s
`ShopverseJwtAuthoritiesConverter`), and it does nothing but copy the
`roles`/`permissions` claim values straight into `GrantedAuthority`
objects — no prefixing, no transformation:

```java
private void addClaimAuthorities(Set<GrantedAuthority> authorities, Object claimValue) {
    // splits/iterates the claim, then: authorities.add(new SimpleGrantedAuthority(authority));
}
```

Yet `order-service`'s `SecurityConfig` calls `.hasRole("ADMIN")`, and
Spring Security's `hasRole(...)` only ever matches an authority literally
named `ROLE_ADMIN`. For that to work, the `roles` claim's values —
ultimately `Role.roleName()` from the database — must *already* be
stored as `ROLE_ADMIN`/`ROLE_CUSTOMER`, not `ADMIN`/`CUSTOMER`. This is
exactly the deliberate-converter warning in the "Roles Versus Scopes"
section above, not a default Spring Security is quietly papering over —
Shopverse made the data carry the prefix instead of making the converter
add it.

## Related Guides

- [Authorization and method security](../spring-security/AUTHORIZATION-METHOD-SECURITY.md)
- [JWT fundamentals](JWT-FUNDAMENTALS.md)
- [JWKS and asymmetric JWT](JWKS-ASYMMETRIC-JWT.md)

