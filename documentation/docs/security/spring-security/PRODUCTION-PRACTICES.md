---
title: Spring Security Production Practices
status: "maintained"
last_reviewed: "2026-07-13"
---


# Spring Security Production Practices

<DocLabels items={[
  {label: 'Security operations', tone: 'production'},
  {label: 'Credential safety', tone: 'advanced'},
  {label: 'Production checklist', tone: 'shopverse'},
]} />

Password security, related guides, and official references.

Back to [Spring Security](../SPRING-SECURITY-GENERIC.md).

## Password Security

- store only adaptive password hashes;
- use BCrypt, Argon2, PBKDF2, or scrypt through `PasswordEncoder`;
- never decrypt passwords because they should not be encrypted reversibly;
- rate-limit login attempts;
- use generic authentication errors;
- monitor credential stuffing;
- support account lock and recovery;
- rehash when encoder strength changes.

`DelegatingPasswordEncoder` stores an algorithm identifier such as
`{bcrypt}` with the hash, supporting migration between encoders.

## Operational Control Matrix

| Control | Evidence | Failure response |
|---|---|---|
| signing-key rotation | drill with overlapping `kid` values | restore previous signer/public key overlap |
| login abuse protection | rate, failures by account/IP/device | throttle without enabling account lockout DoS |
| authorization denials | route, subject, client, decision reason | investigate spikes without logging tokens |
| dependency on identity/JWKS | cache age and refresh failures | continue validated cached keys within policy |
| role/scope changes | propagation time to accepted decisions | revoke/version high-risk access |
| secret exposure | secret-scanner and access audit | rotate, invalidate and investigate immediately |

## Release Gate

Before production, prove negative tests for anonymous access, insufficient scope,
wrong resource owner, expired/wrong-issuer/wrong-audience tokens, untrusted origin,
missing CSRF token where cookies authenticate, and direct service access. Verify
that logs and traces contain identifiers needed for investigation but never raw
passwords, authorization codes, access tokens or private keys.

<DocCallout type="production" title="Availability is part of security design">

Define behavior when JWKS, the identity provider, policy data or an audit sink is
unavailable. Fail closed for authorization, but use safe key caching and bounded
timeouts so a short control-plane outage does not become an avoidable platform
outage.

</DocCallout>

## Interview Check

**How can adaptive password hashes be upgraded without forcing every user to reset?**

<ExpandableAnswer title="Expand answer">

After a successful login, `PasswordEncoder.upgradeEncoding()` can identify an
old algorithm or cost. Re-encode the submitted raw password with the current
policy and store the new hash in a controlled transaction. Never attempt to
decode the old hash; users who do not log in can be handled by expiry/reset policy.

</ExpandableAnswer>


## Related Guides

- [Shopverse JWT and OAuth2 implementation](../JWT-OAUTH2-SPRING-SECURITY.md)
- [API Gateway](../../development/API-GATEWAY-GENERIC.md)
- [Spring Cloud OpenFeign](../../spring/SPRING-OPENFEIGN.md)
- [Testing](../../development/TESTING.md)


## Official References

- [Spring Security architecture](https://docs.spring.io/spring-security/reference/servlet/architecture.html)
- [Username/password authentication](https://docs.spring.io/spring-security/reference/servlet/authentication/passwords/index.html)
- [OAuth2 Resource Server JWT](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html)
- [Method security](https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html)
- [Spring Authorization Server](https://docs.spring.io/spring-authorization-server/reference/)




