---
title: "ADR 003: RSA-Signed JWT And JWKS Authentication"
status: maintained
last_reviewed: "2026-11-17"
page_type: Guide
difficulty: Advanced
scope: shopverse
owner: docs-architecture
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# ADR 003: RSA-Signed JWT And JWKS Authentication

## Context

Six services (gateway, auth, user, order, inventory, payment) need to
agree a caller is who they claim to be, without sharing a database,
a session store, or auth-service's private signing key. Per
`services/auth-service/AGENTS.md`, auth-service's actual job is narrower
than it sounds: it validates credentials through user-service and issues
tokens — it is explicitly **not** a full OAuth2 Authorization Server
(no client-credentials grant, no refresh-token rotation, no audience
validation yet).

## Decision

Asymmetric (RS256) JWTs, signed by auth-service's private key, verified by
every resource server against auth-service's published public key — never
by distributing the private key or a shared symmetric secret.

**Issuing side**
(`services/auth-service/src/main/java/io/shopverse/auth/config/JwtConfig.java`):

```java
@Bean
JwtEncoder jwtEncoder() {
    JWK jwk = new RSAKey.Builder(rsaKeys.publicKey())
            .privateKey(rsaKeys.privateKey())
            .keyID("key-1")
            .build();
    return new NimbusJwtEncoder(new ImmutableJWKSet<>(new JWKSet(jwk)));
}
```

The key pair itself is bound from `rsa.public-key`/`rsa.private-key`
(`RSAKeyProperties`, a `@ConfigurationProperties(prefix = "rsa")` record)
— supplied as configuration, never hard-coded, and never logged per this
service's own `AGENTS.md`.

**Publishing side.** auth-service exposes the **public** half only, at
`/.well-known/jwks.json` (`AuthController`), by re-wrapping the same
`RSAKey` bean as a public JWK set:

```java
@GetMapping("/.well-known/jwks.json")
public JwkSetResponse jwks() {
    JWKSet jwkSet = new JWKSet(rsaKey.toPublicJWK());
    // ...
}
```

**Verifying side.** Every resource server — gateway included — builds a
decoder against that URL and validates the same way:

```java
NimbusReactiveJwtDecoder decoder = NimbusReactiveJwtDecoder.withJwkSetUri(jwkSetUri).build();
decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<Jwt>(
        JwtValidators.createDefaultWithIssuer(issuer)
));
```

`JwtValidators.createDefaultWithIssuer(...)` is used identically across
Gateway, Auth, User, Order, Inventory, and Payment — this validates
signature, expiry/not-before timestamps, and issuer. It does **not**
validate audience: `aud` claim checking is tracked as planned, not yet
configured (see Consequences).

## Options Considered

**Symmetric (HS256) shared-secret JWTs.** Would avoid key-pair management
entirely, but every verifying service would need the same secret
auth-service uses to sign — meaning a leak or compromise of *any*
resource server's configuration would let an attacker forge tokens for the
whole platform. Rejected: RS256 means the six verifying services only ever
hold a public key, which is useless for forging a token.

**Session cookies validated against a shared session store.** Would avoid
JWTs entirely, but reintroduces a shared-state dependency across services
that otherwise own their own data — every request would need a round trip
to the session store, and that store becomes a new availability
dependency for every service. Rejected for the same reason the platform
avoids a shared database.

**A full OAuth2 Authorization Server (Spring Authorization Server) instead
of custom JWT issuance.** This is explicitly the more complete answer —
proper client-credentials/refresh-token/audience support — and is tracked
as a real planned upgrade (`dev-tools/teams/PROGRESS.md`). It wasn't built
first because the custom issuer covers the platform's actual current
need (one first-party frontend, no third-party OAuth clients yet) with
less moving infrastructure; the gap is explicit and tracked, not an
oversight.

## Consequences

- **Key rotation is not yet handled at the code level, even though the
  service's own `AGENTS.md` requires it.** `JwtConfig.jwtEncoder()` always
  builds exactly one `RSAKey` with a hard-coded `keyID("key-1")`, and the
  JWKS endpoint publishes exactly that one public key. Rotating the
  signing key today means a hard cutover — every token signed under the
  old key becomes unverifiable the moment the new key replaces it in
  config, because the old public key is no longer being published for
  verifiers to find. Supporting the overlap this service's own guidance
  requires (publish old and new public keys together for the old token's
  remaining lifetime) needs the JWKS endpoint to serve a `JWKSet` with
  **multiple** keyed entries, keyed by distinct `kid` values, and the
  encoder to be switched to the new key only once that's live — this is a
  real, currently-unimplemented gap, not a theoretical one.
- No audience (`aud`) validation yet — a token issued for one purpose
  would currently be accepted anywhere its issuer and expiry check out.
  Low current risk only because there is exactly one issuer and one
  first-party set of resource servers; the gap matters more the moment a
  second token-consuming audience exists.
- Login failures must not reveal account existence (this service's own
  invariant) — this constrains error-response design on the login
  endpoint specifically, independent of the JWT mechanism itself.
- Every verifying service depends on auth-service's JWKS endpoint being
  reachable; if it's down, no new signature can be verified against a
  refreshed key set, though already-cached decoders can keep validating
  previously-fetched keys until their cache expires.

## Related Documentation

- [ADR 001: API Gateway, Service Discovery, And Centralized Configuration](001-gateway-discovery-config.md)
- [OAuth2/OIDC Flows](../../security/spring-security/OAUTH2-OIDC-FLOWS.md)
- [Distributed Authorization At Scale](../../security/spring-security/DISTRIBUTED-AUTHORIZATION-PERMISSION-SCALE.md)
